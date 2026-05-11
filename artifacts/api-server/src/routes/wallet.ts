import { Router } from "express";
import { db, userBalanceTable, balanceTransactionsTable, topupOrdersTable, usersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { getDuitkuConfig, createDuitkuInvoice, verifyCallbackSignature, DUITKU_METHODS } from "../lib/duitku";
import { topupLimiter } from "../middlewares/rate-limit";
import { logger } from "../lib/logger";

const MAX_TOPUP_IDR = 10_000_000; // Rp 10 juta per transaksi

const router = Router();

const TOPUP_PACKAGES = [
  { id: 1, name: "Starter",   amountIdr: 10000,  label: "Rp 10.000" },
  { id: 2, name: "Basic",     amountIdr: 25000,  label: "Rp 25.000" },
  { id: 3, name: "Value",     amountIdr: 50000,  label: "Rp 50.000",  isPopular: true },
  { id: 4, name: "Pro",       amountIdr: 100000, label: "Rp 100.000" },
  { id: 5, name: "Elite",     amountIdr: 200000, label: "Rp 200.000" },
  { id: 6, name: "Legendary", amountIdr: 500000, label: "Rp 500.000" },
];

router.get("/wallet", requireAuth, async (req, res) => {
  try {
    const [balance] = await db.select().from(userBalanceTable).where(eq(userBalanceTable.userId, req.user!.userId)).limit(1);
    if (!balance) { res.status(404).json({ error: "Wallet not found" }); return; }
    res.json({ balanceIdr: balance.balanceIdr, totalTopup: balance.totalTopup, totalSpent: balance.totalSpent });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

router.get("/wallet/transactions", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1")));
  const limit = Math.min(50, parseInt(String(req.query.limit || "20")));
  const offset = (page - 1) * limit;
  const userId = req.user!.userId;

  try {
    const transactions = await db.select().from(balanceTransactionsTable)
      .where(eq(balanceTransactionsTable.userId, userId))
      .orderBy(desc(balanceTransactionsTable.createdAt))
      .limit(limit).offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(balanceTransactionsTable).where(eq(balanceTransactionsTable.userId, userId));

    res.json({
      transactions: transactions.map(t => ({
        id: t.id,
        amountIdr: t.amountIdr,
        type: t.type,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
      total: count, page, limit,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

router.get("/wallet/topup-packages", requireAuth, (_req, res) => {
  res.json(TOPUP_PACKAGES);
});

router.get("/wallet/payment-methods", requireAuth, (_req, res) => {
  res.json(Object.entries(DUITKU_METHODS).map(([id, m]) => ({ id, label: m.label, code: m.code })));
});

// GET order status (for return URL polling)
router.get("/wallet/topup/:orderId", requireAuth, async (req, res) => {
  const orderId = parseInt(req.params.orderId);
  if (isNaN(orderId)) { res.status(400).json({ error: "Invalid order ID" }); return; }
  const userId = req.user!.userId;
  try {
    const [order] = await db.select().from(topupOrdersTable)
      .where(eq(topupOrdersTable.id, orderId)).limit(1);
    if (!order || order.userId !== userId) { res.status(404).json({ error: "Order tidak ditemukan" }); return; }
    res.json({ orderId: order.id, status: order.status, amountIdr: order.amountIdr, method: order.method });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Gagal cek status order" });
  }
});

// POST topup — real Duitku or demo fallback
router.post("/wallet/topup", requireAuth, topupLimiter, async (req, res) => {
  const { amountIdr, method } = req.body;
  if (!amountIdr || typeof amountIdr !== "number" || amountIdr < 1000) {
    res.status(400).json({ error: "Jumlah top-up tidak valid (minimal Rp 1.000)" }); return;
  }
  if (amountIdr > MAX_TOPUP_IDR) {
    res.status(400).json({ error: `Jumlah top-up melebihi batas maksimum (Rp ${MAX_TOPUP_IDR.toLocaleString("id-ID")})` }); return;
  }

  const userId = req.user!.userId;

  try {
    const duitkuConfig = await getDuitkuConfig();

    if (duitkuConfig) {
      // --- REAL DUITKU FLOW ---
      const validMethod = DUITKU_METHODS[method];
      if (!validMethod) {
        res.status(400).json({ error: "Metode pembayaran tidak valid" }); return;
      }

      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      if (!user) { res.status(404).json({ error: "User tidak ditemukan" }); return; }

      const merchantOrderId = `GACHA-${Date.now()}-${userId}`;

      const proto = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host || "localhost:8080";
      const appBase = String(proto).split(",")[0].trim() + "://" + host.replace(":8080", "");

      const [order] = await db.insert(topupOrdersTable).values({
        userId,
        amountIdr,
        method: "qris" as any, // stored as generic; real method tracked via paymentRef
        status: "pending",
        paymentRef: merchantOrderId,
      }).returning();

      const duitkuRes = await createDuitkuInvoice(duitkuConfig, {
        merchantOrderId,
        paymentAmount: amountIdr,
        productDetails: `Top-up GachaPull ${TOPUP_PACKAGES.find(p => p.amountIdr === amountIdr)?.name || ""}`,
        email: user.email,
        customerVaName: user.username,
        paymentMethod: validMethod.code,
        returnUrl: `${appBase}/wallet?status=success&orderId=${order.id}`,
        callbackUrl: `${appBase}/api/wallet/duitku/callback`,
        expiryPeriod: 60,
      });

      await db.update(topupOrdersTable).set({ snapToken: duitkuRes.reference, updatedAt: new Date() })
        .where(eq(topupOrdersTable.id, order.id));

      res.json({
        orderId: order.id,
        amountIdr,
        paymentUrl: duitkuRes.paymentUrl,
        reference: duitkuRes.reference,
        mode: "duitku",
      });

    } else {
      // --- DEMO MODE ---
      const validMethods = Object.keys(DUITKU_METHODS).concat(["bank_transfer"]);
      if (!method || !validMethods.includes(method)) {
        res.status(400).json({ error: "Metode pembayaran tidak valid" }); return;
      }

      const [order] = await db.insert(topupOrdersTable).values({
        userId,
        amountIdr,
        method: "qris" as any,
        status: "pending",
        paymentRef: `DEMO-${Date.now()}-${userId}`,
        snapToken: `demo-${Date.now()}`,
      }).returning();

      res.json({
        orderId: order.id,
        amountIdr,
        method,
        status: "pending",
        mode: "demo",
        message: "Demo mode aktif. Konfirmasi manual untuk tambah saldo.",
      });
    }
  } catch (err) {
    req.log.error(err);
    const msg = err instanceof Error ? err.message : "Gagal membuat order top-up";
    res.status(500).json({ error: msg });
  }
});

// Duitku webhook callback (POST from Duitku server)
router.post("/wallet/duitku/callback", async (req, res) => {
  try {
    const { merchantCode, amount, merchantOrderId, resultCode, signature } = req.body;

    const duitkuConfig = await getDuitkuConfig();
    if (!duitkuConfig) { res.status(400).send("Duitku not configured"); return; }

    const isValid = verifyCallbackSignature(merchantCode, amount, merchantOrderId, duitkuConfig.apiKey, signature);
    if (!isValid) { res.status(400).send("Invalid signature"); return; }

    if (resultCode !== "00") {
      res.status(200).send("Payment not successful, ignored");
      return;
    }

    // Find order by paymentRef (merchantOrderId)
    const [order] = await db.select().from(topupOrdersTable)
      .where(eq(topupOrdersTable.paymentRef, merchantOrderId)).limit(1);

    if (!order) { res.status(404).send("Order not found"); return; }
    if (order.status === "completed") { res.status(200).send("Already processed"); return; }

    await db.update(topupOrdersTable).set({ status: "completed", updatedAt: new Date() })
      .where(eq(topupOrdersTable.id, order.id));

    const [wallet] = await db.select().from(userBalanceTable).where(eq(userBalanceTable.userId, order.userId)).limit(1);
    const newBalance = (wallet?.balanceIdr || 0) + order.amountIdr;
    await db.update(userBalanceTable)
      .set({ balanceIdr: newBalance, totalTopup: (wallet?.totalTopup || 0) + order.amountIdr, updatedAt: new Date() })
      .where(eq(userBalanceTable.userId, order.userId));

    await db.insert(balanceTransactionsTable).values({
      userId: order.userId,
      amountIdr: order.amountIdr,
      type: "topup",
      description: `Top-up via Duitku — Rp ${order.amountIdr.toLocaleString("id-ID")}`,
      referenceId: order.id,
    });

    res.status(200).send("OK");
  } catch (err) {
    logger.error({ err }, "Duitku callback error");
    res.status(500).send("Internal error");
  }
});

// Demo confirm (when Duitku not configured)
router.post("/wallet/topup/:orderId/confirm", requireAuth, async (req, res) => {
  const orderId = parseInt(req.params.orderId);
  if (isNaN(orderId)) { res.status(400).json({ error: "Invalid order ID" }); return; }
  const userId = req.user!.userId;

  try {
    const [order] = await db.select().from(topupOrdersTable)
      .where(eq(topupOrdersTable.id, orderId)).limit(1);

    if (!order || order.userId !== userId) { res.status(404).json({ error: "Order tidak ditemukan" }); return; }
    if (order.status !== "pending") { res.status(400).json({ error: "Order sudah diproses" }); return; }

    await db.update(topupOrdersTable).set({ status: "completed", updatedAt: new Date() })
      .where(eq(topupOrdersTable.id, orderId));

    const [wallet] = await db.select().from(userBalanceTable).where(eq(userBalanceTable.userId, userId)).limit(1);
    const newBalance = (wallet?.balanceIdr || 0) + order.amountIdr;
    await db.update(userBalanceTable)
      .set({ balanceIdr: newBalance, totalTopup: (wallet?.totalTopup || 0) + order.amountIdr, updatedAt: new Date() })
      .where(eq(userBalanceTable.userId, userId));

    await db.insert(balanceTransactionsTable).values({
      userId,
      amountIdr: order.amountIdr,
      type: "topup",
      description: `Top-up Demo — Rp ${order.amountIdr.toLocaleString("id-ID")}`,
      referenceId: order.id,
    });

    res.json({
      message: `Saldo berhasil ditambahkan Rp ${order.amountIdr.toLocaleString("id-ID")}`,
      newBalance,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Gagal konfirmasi top-up" });
  }
});

export default router;
