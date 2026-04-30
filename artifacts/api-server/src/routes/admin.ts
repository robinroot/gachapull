import { Router } from "express";
import { db, usersTable, userCoinsTable, paymentOrdersTable, gachaPullsTable, cardsTable, packsTable, coinPackagesTable, paymentSettingsTable, physicalCardRequestsTable } from "@workspace/db";
import { eq, desc, sql, ilike, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { ListAdminUsersQueryParams, ListAdminTransactionsQueryParams, CreateAdminCoinPackageBody } from "@workspace/api-zod";
import { formatCard } from "./cards";
const router = Router();

// STATS
router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)::int` }).from(usersTable);
    const [{ totalPulls }] = await db.select({ totalPulls: sql<number>`count(*)::int` }).from(gachaPullsTable);
    const [{ totalCards }] = await db.select({ totalCards: sql<number>`count(*)::int` }).from(cardsTable);
    const [{ totalPacks }] = await db.select({ totalPacks: sql<number>`count(*)::int` }).from(packsTable);
    const [{ totalRevenue }] = await db.select({ totalRevenue: sql<number>`coalesce(sum(amount_usd::numeric), 0)` })
      .from(paymentOrdersTable).where(eq(paymentOrdersTable.status, "completed"));

    const revenueByMethod = { stripe: 0, midtrans: 0, usdt: 0 };
    for (const method of ["stripe", "midtrans", "usdt"] as const) {
      const [{ rev }] = await db.select({ rev: sql<number>`coalesce(sum(amount_usd::numeric), 0)` })
        .from(paymentOrdersTable).where(and(eq(paymentOrdersTable.status, "completed"), eq(paymentOrdersTable.method, method)));
      revenueByMethod[method] = parseFloat(String(rev)) || 0;
    }

    const recentTransactions = await db.select({
      id: paymentOrdersTable.id,
      userId: paymentOrdersTable.userId,
      username: usersTable.username,
      method: paymentOrdersTable.method,
      amountUsd: paymentOrdersTable.amountUsd,
      coinsGranted: paymentOrdersTable.coinsGranted,
      status: paymentOrdersTable.status,
      createdAt: paymentOrdersTable.createdAt,
    })
      .from(paymentOrdersTable)
      .innerJoin(usersTable, eq(paymentOrdersTable.userId, usersTable.id))
      .orderBy(desc(paymentOrdersTable.createdAt))
      .limit(10);

    res.json({
      totalUsers, totalRevenue: parseFloat(String(totalRevenue)) || 0,
      totalPulls, totalCards, totalPacks,
      revenueByMethod,
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        user: { id: t.userId, username: t.username },
        method: t.method,
        amountUsd: parseFloat(String(t.amountUsd)),
        coinsGranted: t.coinsGranted,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// USERS
router.get("/admin/users", requireAdmin, async (req, res) => {
  const parsed = ListAdminUsersQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const search = parsed.success ? parsed.data.search : undefined;
  const offset = (page - 1) * limit;

  try {
    const whereClause = search ? ilike(usersTable.username, `%${search}%`) : undefined;
    const users = await db.select({
      user: usersTable, coins: userCoinsTable,
    })
      .from(usersTable)
      .innerJoin(userCoinsTable, eq(usersTable.id, userCoinsTable.userId))
      .where(whereClause)
      .orderBy(desc(userCoinsTable.totalSpent))
      .limit(limit).offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(whereClause);

    const usersWithPulls = await Promise.all(users.map(async ({ user, coins }) => {
      const [{ pulls }] = await db.select({ pulls: sql<number>`count(*)::int` })
        .from(gachaPullsTable).where(eq(gachaPullsTable.userId, user.id));
      return {
        id: user.id, username: user.username, email: user.email, role: user.role,
        coinsBalance: coins.balance,
        totalSpentUsd: Math.round(coins.totalSpent / 100 * 100) / 100,
        totalPulls: pulls,
        createdAt: user.createdAt.toISOString(),
      };
    }));

    res.json({ users: usersWithPulls, total: count, page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/admin/users/:userId", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user ID" }); return; }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const [coins] = await db.select().from(userCoinsTable).where(eq(userCoinsTable.userId, userId)).limit(1);
    const [{ pulls }] = await db.select({ pulls: sql<number>`count(*)::int` }).from(gachaPullsTable).where(eq(gachaPullsTable.userId, userId));

    res.json({
      id: user.id, username: user.username, email: user.email, role: user.role,
      coinsBalance: coins?.balance ?? 0,
      totalSpentUsd: 0, totalPulls: pulls,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.put("/admin/users/:userId", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user ID" }); return; }
  const { role, coinsBalance } = req.body;
  try {
    if (role) await db.update(usersTable).set({ role, updatedAt: new Date() }).where(eq(usersTable.id, userId));
    if (coinsBalance !== undefined) {
      await db.update(userCoinsTable).set({ balance: coinsBalance, updatedAt: new Date() }).where(eq(userCoinsTable.userId, userId));
    }
    res.json({ message: "User updated" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// TRANSACTIONS
router.get("/admin/transactions", requireAdmin, async (req, res) => {
  const parsed = ListAdminTransactionsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const status = parsed.success ? parsed.data.status : undefined;
  const offset = (page - 1) * limit;

  try {
    const whereClause = status ? eq(paymentOrdersTable.status, status as any) : undefined;
    const transactions = await db.select({
      order: paymentOrdersTable, username: usersTable.username,
    })
      .from(paymentOrdersTable)
      .innerJoin(usersTable, eq(paymentOrdersTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(paymentOrdersTable.createdAt))
      .limit(limit).offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(paymentOrdersTable).where(whereClause);

    res.json({
      transactions: transactions.map(({ order, username }) => ({
        id: order.id,
        user: { id: order.userId, username },
        method: order.method,
        amountUsd: parseFloat(String(order.amountUsd)),
        coinsGranted: order.coinsGranted,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),
      total: count, page, limit,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// SETTINGS
router.get("/admin/settings", requireAdmin, async (req, res) => {
  try {
    const settings = await db.select().from(paymentSettingsTable);
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;

    res.json({
      stripe: {
        publicKey: map["stripe_public_key"] || "",
        secretKey: map["stripe_secret_key"] ? "***" : "",
        webhookSecret: map["stripe_webhook_secret"] ? "***" : "",
        enabled: map["stripe_enabled"] === "true",
      },
      midtrans: {
        serverKey: map["midtrans_server_key"] ? "***" : "",
        clientKey: map["midtrans_client_key"] || "",
        isProduction: map["midtrans_is_production"] === "true",
        enabled: map["midtrans_enabled"] === "true",
      },
      usdt: {
        walletAddress: map["usdt_wallet_address"] || "",
        network: (map["usdt_network"] as any) || "trc20",
        enabled: map["usdt_enabled"] === "true",
      },
      nowpayments: {
        apiKey: map["nowpayments_api_key"] ? "***" : "",
        enabled: map["nowpayments_enabled"] === "true",
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/admin/settings", requireAdmin, async (req, res) => {
  const { stripe, midtrans, usdt, nowpayments } = req.body;
  try {
    const updates: { key: string; value: string }[] = [];
    if (stripe) {
      if (stripe.publicKey !== undefined) updates.push({ key: "stripe_public_key", value: stripe.publicKey });
      if (stripe.secretKey && stripe.secretKey !== "***") updates.push({ key: "stripe_secret_key", value: stripe.secretKey });
      if (stripe.webhookSecret && stripe.webhookSecret !== "***") updates.push({ key: "stripe_webhook_secret", value: stripe.webhookSecret });
      if (stripe.enabled !== undefined) updates.push({ key: "stripe_enabled", value: String(stripe.enabled) });
    }
    if (midtrans) {
      if (midtrans.serverKey && midtrans.serverKey !== "***") updates.push({ key: "midtrans_server_key", value: midtrans.serverKey });
      if (midtrans.clientKey !== undefined) updates.push({ key: "midtrans_client_key", value: midtrans.clientKey });
      if (midtrans.isProduction !== undefined) updates.push({ key: "midtrans_is_production", value: String(midtrans.isProduction) });
      if (midtrans.enabled !== undefined) updates.push({ key: "midtrans_enabled", value: String(midtrans.enabled) });
    }
    if (usdt) {
      if (usdt.walletAddress !== undefined) updates.push({ key: "usdt_wallet_address", value: usdt.walletAddress });
      if (usdt.network !== undefined) updates.push({ key: "usdt_network", value: usdt.network });
      if (usdt.enabled !== undefined) updates.push({ key: "usdt_enabled", value: String(usdt.enabled) });
    }
    if (nowpayments) {
      if (nowpayments.apiKey && nowpayments.apiKey !== "***") updates.push({ key: "nowpayments_api_key", value: nowpayments.apiKey });
      if (nowpayments.enabled !== undefined) updates.push({ key: "nowpayments_enabled", value: String(nowpayments.enabled) });
    }
    for (const u of updates) {
      await db.insert(paymentSettingsTable).values({ key: u.key, value: u.value })
        .onConflictDoUpdate({ target: paymentSettingsTable.key, set: { value: u.value, updatedAt: new Date() } });
    }
    res.json({ message: "Settings updated" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// COIN PACKAGES (admin)
router.get("/admin/coin-packages", requireAdmin, async (req, res) => {
  try {
    const packages = await db.select().from(coinPackagesTable).orderBy(coinPackagesTable.priceUsd);
    res.json(packages.map(p => ({
      id: p.id, name: p.name, coins: p.coins, priceUsd: parseFloat(String(p.priceUsd)),
      bonusCoins: p.bonusCoins, isPopular: p.isPopular, isActive: p.isActive,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch coin packages" });
  }
});

router.post("/admin/coin-packages", requireAdmin, async (req, res) => {
  const parsed = CreateAdminCoinPackageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation error" }); return; }
  try {
    const data: any = { ...parsed.data, priceUsd: String(parsed.data.priceUsd) };
    const [pkg] = await db.insert(coinPackagesTable).values(data).returning();
    res.status(201).json({ id: pkg.id, name: pkg.name, coins: pkg.coins, priceUsd: parseFloat(String(pkg.priceUsd)), bonusCoins: pkg.bonusCoins, isPopular: pkg.isPopular, isActive: pkg.isActive });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create coin package" });
  }
});

router.put("/admin/coin-packages/:packageId", requireAdmin, async (req, res) => {
  const packageId = parseInt(req.params.packageId);
  if (isNaN(packageId)) { res.status(400).json({ error: "Invalid package ID" }); return; }
  try {
    const data: any = { ...req.body, updatedAt: new Date() };
    if (data.priceUsd !== undefined) data.priceUsd = String(data.priceUsd);
    const [pkg] = await db.update(coinPackagesTable).set(data).where(eq(coinPackagesTable.id, packageId)).returning();
    if (!pkg) { res.status(404).json({ error: "Package not found" }); return; }
    res.json({ id: pkg.id, name: pkg.name, coins: pkg.coins, priceUsd: parseFloat(String(pkg.priceUsd)), bonusCoins: pkg.bonusCoins, isPopular: pkg.isPopular, isActive: pkg.isActive });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update coin package" });
  }
});

router.delete("/admin/coin-packages/:packageId", requireAdmin, async (req, res) => {
  const packageId = parseInt(req.params.packageId);
  if (isNaN(packageId)) { res.status(400).json({ error: "Invalid package ID" }); return; }
  try {
    await db.delete(coinPackagesTable).where(eq(coinPackagesTable.id, packageId));
    res.json({ message: "Package deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete package" });
  }
});

// PHYSICAL CARD REQUESTS
router.get("/admin/physical-requests", requireAdmin, async (req, res) => {
  const status = req.query.status as string | undefined;
  const page = Math.max(1, parseInt(String(req.query.page || "1")));
  const limit = Math.min(50, parseInt(String(req.query.limit || "20")));
  const offset = (page - 1) * limit;

  try {
    let query = db.select({ request: physicalCardRequestsTable, card: cardsTable, user: usersTable })
      .from(physicalCardRequestsTable)
      .innerJoin(cardsTable, eq(physicalCardRequestsTable.cardId, cardsTable.id))
      .innerJoin(usersTable, eq(physicalCardRequestsTable.userId, usersTable.id))
      .orderBy(desc(physicalCardRequestsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const items = await query;
    const filtered = status ? items.filter(i => i.request.status === status) : items;

    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(physicalCardRequestsTable);

    res.json({
      requests: filtered.map(i => ({
        id: i.request.id,
        user: { id: i.user.id, username: i.user.username, email: i.user.email },
        card: formatCard(i.card),
        status: i.request.status,
        fullName: i.request.fullName,
        phone: i.request.phone,
        address: i.request.address,
        city: i.request.city,
        province: i.request.province,
        postalCode: i.request.postalCode,
        country: i.request.country,
        trackingNumber: i.request.trackingNumber,
        adminNotes: i.request.adminNotes,
        createdAt: i.request.createdAt.toISOString(),
        updatedAt: i.request.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch physical requests" });
  }
});

const VALID_PHYSICAL_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
type PhysicalStatus = typeof VALID_PHYSICAL_STATUSES[number];

router.put("/admin/physical-requests/:requestId", requireAdmin, async (req, res) => {
  const requestId = parseInt(req.params.requestId);
  if (isNaN(requestId)) { res.status(400).json({ error: "Invalid request ID" }); return; }

  const { status, trackingNumber, adminNotes } = req.body as { status?: string; trackingNumber?: string; adminNotes?: string };
  if (status && !VALID_PHYSICAL_STATUSES.includes(status as PhysicalStatus)) {
    res.status(400).json({ error: "Invalid status value" }); return;
  }

  try {
    const [existing] = await db.select().from(physicalCardRequestsTable).where(eq(physicalCardRequestsTable.id, requestId)).limit(1);
    if (!existing) { res.status(404).json({ error: "Request not found" }); return; }

    const updates: Partial<typeof physicalCardRequestsTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (status) updates.status = status as PhysicalStatus;
    if (trackingNumber !== undefined) updates.trackingNumber = trackingNumber;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    const [updated] = await db.update(physicalCardRequestsTable).set(updates).where(eq(physicalCardRequestsTable.id, requestId)).returning();
    res.json({ id: updated.id, status: updated.status, trackingNumber: updated.trackingNumber, adminNotes: updated.adminNotes });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update request" });
  }
});

export default router;
