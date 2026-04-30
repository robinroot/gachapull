import { Router } from "express";
import { db, coinPackagesTable, paymentOrdersTable, userCoinsTable, coinTransactionsTable, paymentSettingsTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { GetPaymentHistoryQueryParams } from "@workspace/api-zod";
import crypto from "crypto";

const router = Router();

async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(paymentSettingsTable).where(eq(paymentSettingsTable.key, key)).limit(1);
  return row?.value ?? null;
}

function formatPackage(pkg: typeof coinPackagesTable.$inferSelect) {
  return {
    id: pkg.id,
    name: pkg.name,
    coins: pkg.coins,
    priceUsd: parseFloat(pkg.priceUsd),
    bonusCoins: pkg.bonusCoins,
    isPopular: pkg.isPopular,
    isActive: pkg.isActive,
  };
}

function formatPayment(order: typeof paymentOrdersTable.$inferSelect) {
  return {
    id: order.id,
    method: order.method,
    amountUsd: parseFloat(order.amountUsd),
    coinsGranted: order.coinsGranted,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  };
}

router.get("/payments/packages", async (req, res) => {
  try {
    const packages = await db.select().from(coinPackagesTable).where(eq(coinPackagesTable.isActive, true)).orderBy(coinPackagesTable.priceUsd);
    res.json(packages.map(formatPackage));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

router.post("/payments/stripe/create-session", requireAuth, async (req, res) => {
  const { coinPackageId } = req.body;
  const userId = req.user!.userId;
  try {
    const [pkg] = await db.select().from(coinPackagesTable).where(eq(coinPackagesTable.id, coinPackageId)).limit(1);
    if (!pkg || !pkg.isActive) { res.status(400).json({ error: "Invalid package" }); return; }

    const stripeSecretKey = await getSetting("stripe_secret_key");
    if (!stripeSecretKey) { res.status(503).json({ error: "Stripe not configured" }); return; }

    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(stripeSecretKey);
    const totalCoins = pkg.coins + (pkg.bonusCoins ?? 0);

    const orderId = `stripe_${Date.now()}_${userId}`;
    const [order] = await db.insert(paymentOrdersTable).values({
      userId, coinPackageId: pkg.id,
      amountUsd: pkg.priceUsd,
      coinsGranted: totalCoins,
      method: "stripe", status: "pending",
      paymentRef: orderId,
    }).returning();

    const domains = process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost";
    const baseUrl = `https://${domains}`;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `${pkg.name} - ${totalCoins} coins` },
          unit_amount: Math.round(parseFloat(pkg.priceUsd) * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${baseUrl}/?payment=success&orderId=${order.id}`,
      cancel_url: `${baseUrl}/payments?payment=cancelled`,
      metadata: { orderId: String(order.id), userId: String(userId) },
    });

    res.json({ sessionId: session.id, url: session.url! });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create Stripe session" });
  }
});

router.post("/payments/stripe/webhook", async (req, res) => {
  try {
    const webhookSecret = await getSetting("stripe_webhook_secret");
    const stripeSecretKey = await getSetting("stripe_secret_key");
    if (!stripeSecretKey) { res.status(200).json({ message: "OK" }); return; }

    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(stripeSecretKey);

    let event: any;
    if (webhookSecret) {
      const sig = req.headers["stripe-signature"] as string;
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = parseInt(session.metadata?.orderId);
      if (orderId) {
        const [order] = await db.select().from(paymentOrdersTable).where(eq(paymentOrdersTable.id, orderId)).limit(1);
        if (order && order.status === "pending") {
          await db.update(paymentOrdersTable).set({ status: "completed", updatedAt: new Date() }).where(eq(paymentOrdersTable.id, orderId));
          const [wallet] = await db.select().from(userCoinsTable).where(eq(userCoinsTable.userId, order.userId)).limit(1);
          if (wallet) {
            await db.update(userCoinsTable).set({
              balance: wallet.balance + order.coinsGranted,
              totalEarned: wallet.totalEarned + order.coinsGranted,
              updatedAt: new Date(),
            }).where(eq(userCoinsTable.userId, order.userId));
            await db.insert(coinTransactionsTable).values({
              userId: order.userId, amount: order.coinsGranted, type: "credit",
              description: `Purchased ${order.coinsGranted} coins via Stripe`,
            });
          }
        }
      }
    }
    res.json({ message: "OK" });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Webhook error" });
  }
});

router.post("/payments/midtrans/create", requireAuth, async (req, res) => {
  const { coinPackageId } = req.body;
  const userId = req.user!.userId;
  try {
    const [pkg] = await db.select().from(coinPackagesTable).where(eq(coinPackagesTable.id, coinPackageId)).limit(1);
    if (!pkg || !pkg.isActive) { res.status(400).json({ error: "Invalid package" }); return; }

    const serverKey = await getSetting("midtrans_server_key");
    if (!serverKey) { res.status(503).json({ error: "Midtrans not configured. Please set up your Midtrans API keys in Admin Settings." }); return; }

    const isProduction = (await getSetting("midtrans_is_production")) === "true";
    const totalCoins = pkg.coins + (pkg.bonusCoins ?? 0);
    const orderId = `midtrans_${Date.now()}_${userId}`;

    const [order] = await db.insert(paymentOrdersTable).values({
      userId, coinPackageId: pkg.id,
      amountUsd: pkg.priceUsd,
      coinsGranted: totalCoins,
      method: "midtrans", status: "pending",
      paymentRef: orderId,
    }).returning();

    const baseUrl = isProduction ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
    const auth = Buffer.from(`${serverKey}:`).toString("base64");
    const response = await fetch(`${baseUrl}/v2/charge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Basic ${auth}`, "Accept": "application/json" },
      body: JSON.stringify({
        payment_type: "qris",
        transaction_details: { order_id: orderId, gross_amount: Math.round(parseFloat(pkg.priceUsd) * 15000) },
        qris: { acquirer: "gopay" },
        custom_field1: String(order.id),
      }),
    });

    const data = await response.json() as any;
    res.json({ token: data.qr_string || orderId, redirectUrl: data.redirect_url || "", orderId });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create Midtrans payment" });
  }
});

router.post("/payments/midtrans/webhook", async (req, res) => {
  try {
    const serverKey = await getSetting("midtrans_server_key");
    if (!serverKey) { res.json({ message: "OK" }); return; }

    const { order_id, transaction_status, signature_key, gross_amount, status_code } = req.body;
    const hash = crypto.createHash("sha512").update(`${order_id}${status_code}${gross_amount}${serverKey}`).digest("hex");
    if (hash !== signature_key) { res.status(400).json({ error: "Invalid signature" }); return; }

    if (transaction_status === "settlement" || transaction_status === "capture") {
      const [order] = await db.select().from(paymentOrdersTable).where(eq(paymentOrdersTable.paymentRef, order_id)).limit(1);
      if (order && order.status === "pending") {
        await db.update(paymentOrdersTable).set({ status: "completed", updatedAt: new Date() }).where(eq(paymentOrdersTable.id, order.id));
        const [wallet] = await db.select().from(userCoinsTable).where(eq(userCoinsTable.userId, order.userId)).limit(1);
        if (wallet) {
          await db.update(userCoinsTable).set({
            balance: wallet.balance + order.coinsGranted,
            totalEarned: wallet.totalEarned + order.coinsGranted,
            updatedAt: new Date(),
          }).where(eq(userCoinsTable.userId, order.userId));
          await db.insert(coinTransactionsTable).values({
            userId: order.userId, amount: order.coinsGranted, type: "credit",
            description: `Purchased ${order.coinsGranted} coins via Midtrans`,
          });
        }
      }
    }
    res.json({ message: "OK" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Webhook error" });
  }
});

router.post("/payments/usdt/create", requireAuth, async (req, res) => {
  const { coinPackageId } = req.body;
  const userId = req.user!.userId;
  try {
    const [pkg] = await db.select().from(coinPackagesTable).where(eq(coinPackagesTable.id, coinPackageId)).limit(1);
    if (!pkg || !pkg.isActive) { res.status(400).json({ error: "Invalid package" }); return; }

    const walletAddress = await getSetting("usdt_wallet_address");
    if (!walletAddress) { res.status(503).json({ error: "USDT wallet not configured. Please set up your USDT wallet address in Admin Settings." }); return; }

    const network = (await getSetting("usdt_network")) || "trc20";
    const totalCoins = pkg.coins + (pkg.bonusCoins ?? 0);
    const amountUsdt = parseFloat(pkg.priceUsd);
    const orderId = `usdt_${Date.now()}_${userId}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await db.insert(paymentOrdersTable).values({
      userId, coinPackageId: pkg.id,
      amountUsd: pkg.priceUsd,
      coinsGranted: totalCoins,
      method: "usdt", status: "pending",
      paymentRef: orderId,
      metadata: { walletAddress, network, amountUsdt, expiresAt: expiresAt.toISOString() },
    });

    res.json({ address: walletAddress, amountUsdt, orderId, expiresAt: expiresAt.toISOString(), qrCodeUrl: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create USDT payment" });
  }
});

router.get("/payments/history", requireAuth, async (req, res) => {
  const parsed = GetPaymentHistoryQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;
  const userId = req.user!.userId;

  try {
    const payments = await db.select().from(paymentOrdersTable)
      .where(eq(paymentOrdersTable.userId, userId))
      .orderBy(desc(paymentOrdersTable.createdAt))
      .limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(paymentOrdersTable).where(eq(paymentOrdersTable.userId, userId));

    res.json({ payments: payments.map(formatPayment), total: count, page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});

export default router;
