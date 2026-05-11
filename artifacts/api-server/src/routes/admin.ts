import { Router } from "express";
import { db, usersTable, userBalanceTable, topupOrdersTable, gachaPullsTable, cardsTable, packsTable, paymentSettingsTable, physicalCardRequestsTable } from "@workspace/db";
import { eq, desc, sql, ilike, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { ListAdminUsersQueryParams, ListAdminTransactionsQueryParams } from "@workspace/api-zod";
import { formatCard } from "./cards";

const router = Router();

// STATS
router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)::int` }).from(usersTable);
    const [{ totalPulls }] = await db.select({ totalPulls: sql<number>`count(*)::int` }).from(gachaPullsTable);
    const [{ totalCards }] = await db.select({ totalCards: sql<number>`count(*)::int` }).from(cardsTable);
    const [{ totalPacks }] = await db.select({ totalPacks: sql<number>`count(*)::int` }).from(packsTable);
    const [{ totalRevenueIdr }] = await db.select({ totalRevenueIdr: sql<number>`coalesce(sum(amount_idr), 0)` })
      .from(topupOrdersTable).where(eq(topupOrdersTable.status, "completed"));

    const revenueByMethod: Record<string, number> = { qris: 0, gopay: 0, ovo: 0, dana: 0, bank_transfer: 0 };
    for (const method of ["qris", "gopay", "ovo", "dana", "bank_transfer"] as const) {
      const [{ rev }] = await db.select({ rev: sql<number>`coalesce(sum(amount_idr), 0)` })
        .from(topupOrdersTable).where(and(eq(topupOrdersTable.status, "completed"), eq(topupOrdersTable.method, method)));
      revenueByMethod[method] = parseInt(String(rev)) || 0;
    }

    const recentTransactions = await db.select({
      id: topupOrdersTable.id,
      userId: topupOrdersTable.userId,
      username: usersTable.username,
      method: topupOrdersTable.method,
      amountIdr: topupOrdersTable.amountIdr,
      status: topupOrdersTable.status,
      createdAt: topupOrdersTable.createdAt,
    })
      .from(topupOrdersTable)
      .innerJoin(usersTable, eq(topupOrdersTable.userId, usersTable.id))
      .orderBy(desc(topupOrdersTable.createdAt))
      .limit(10);

    res.json({
      totalUsers,
      totalRevenueIdr: parseInt(String(totalRevenueIdr)) || 0,
      totalPulls, totalCards, totalPacks,
      revenueByMethod,
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        user: { id: t.userId, username: t.username },
        method: t.method,
        amountIdr: t.amountIdr,
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
    const users = await db.select({ user: usersTable, balance: userBalanceTable })
      .from(usersTable)
      .leftJoin(userBalanceTable, eq(usersTable.id, userBalanceTable.userId))
      .where(whereClause)
      .orderBy(desc(usersTable.createdAt))
      .limit(limit).offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(whereClause);

    const usersWithPulls = await Promise.all(users.map(async ({ user, balance }) => {
      const [{ pulls }] = await db.select({ pulls: sql<number>`count(*)::int` })
        .from(gachaPullsTable).where(eq(gachaPullsTable.userId, user.id));
      return {
        id: user.id, username: user.username, email: user.email, role: user.role,
        balanceIdr: balance?.balanceIdr ?? 0,
        totalSpent: balance?.totalSpent ?? 0,
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
    const [balance] = await db.select().from(userBalanceTable).where(eq(userBalanceTable.userId, userId)).limit(1);
    const [{ pulls }] = await db.select({ pulls: sql<number>`count(*)::int` }).from(gachaPullsTable).where(eq(gachaPullsTable.userId, userId));

    res.json({
      id: user.id, username: user.username, email: user.email, role: user.role,
      balanceIdr: balance?.balanceIdr ?? 0,
      totalSpent: balance?.totalSpent ?? 0,
      totalPulls: pulls,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

const VALID_ROLES = ["user", "admin"] as const;

router.put("/admin/users/:userId", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user ID" }); return; }
  const { role, balanceIdr } = req.body;

  // Validate role to prevent arbitrary role escalation
  if (role !== undefined && !VALID_ROLES.includes(role)) {
    res.status(400).json({ error: `Invalid role. Allowed: ${VALID_ROLES.join(", ")}` }); return;
  }
  // Validate balanceIdr is a non-negative number
  if (balanceIdr !== undefined && (typeof balanceIdr !== "number" || balanceIdr < 0 || !Number.isFinite(balanceIdr))) {
    res.status(400).json({ error: "balanceIdr must be a non-negative number" }); return;
  }

  try {
    if (role) await db.update(usersTable).set({ role, updatedAt: new Date() }).where(eq(usersTable.id, userId));
    if (balanceIdr !== undefined) {
      await db.update(userBalanceTable).set({ balanceIdr, updatedAt: new Date() }).where(eq(userBalanceTable.userId, userId));
    }
    res.json({ message: "User updated" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// TRANSACTIONS (topup orders)
router.get("/admin/transactions", requireAdmin, async (req, res) => {
  const parsed = ListAdminTransactionsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const status = parsed.success ? parsed.data.status : undefined;
  const offset = (page - 1) * limit;

  try {
    const whereClause = status ? eq(topupOrdersTable.status, status as any) : undefined;
    const transactions = await db.select({ order: topupOrdersTable, username: usersTable.username })
      .from(topupOrdersTable)
      .innerJoin(usersTable, eq(topupOrdersTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(topupOrdersTable.createdAt))
      .limit(limit).offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(topupOrdersTable).where(whereClause);

    res.json({
      transactions: transactions.map(({ order, username }) => ({
        id: order.id,
        user: { id: order.userId, username },
        method: order.method,
        amountIdr: order.amountIdr,
        status: order.status,
        paymentRef: order.paymentRef,
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
      duitku: {
        merchantCode: map["duitku_merchant_code"] || "",
        apiKey: map["duitku_api_key"] ? "***" : "",
        isProduction: map["duitku_is_production"] === "true",
        enabled: map["duitku_enabled"] === "true",
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/admin/settings", requireAdmin, async (req, res) => {
  const { duitku } = req.body;
  try {
    const updates: { key: string; value: string }[] = [];
    if (duitku) {
      if (duitku.merchantCode !== undefined) updates.push({ key: "duitku_merchant_code", value: duitku.merchantCode });
      if (duitku.apiKey && duitku.apiKey !== "***") updates.push({ key: "duitku_api_key", value: duitku.apiKey });
      if (duitku.isProduction !== undefined) updates.push({ key: "duitku_is_production", value: String(duitku.isProduction) });
      if (duitku.enabled !== undefined) updates.push({ key: "duitku_enabled", value: String(duitku.enabled) });
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

// PHYSICAL CARD REQUESTS
router.get("/admin/physical-requests", requireAdmin, async (req, res) => {
  const status = req.query.status as string | undefined;
  const page = Math.max(1, parseInt(String(req.query.page || "1")));
  const limit = Math.min(50, parseInt(String(req.query.limit || "20")));
  const offset = (page - 1) * limit;

  try {
    const items = await db.select({ request: physicalCardRequestsTable, card: cardsTable, user: usersTable })
      .from(physicalCardRequestsTable)
      .innerJoin(cardsTable, eq(physicalCardRequestsTable.cardId, cardsTable.id))
      .innerJoin(usersTable, eq(physicalCardRequestsTable.userId, usersTable.id))
      .orderBy(desc(physicalCardRequestsTable.createdAt))
      .limit(limit).offset(offset);

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
      total, page, limit,
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

    const updates: Partial<typeof physicalCardRequestsTable.$inferInsert> = { updatedAt: new Date() };
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
