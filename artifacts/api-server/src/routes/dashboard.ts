import { Router } from "express";
import { db, usersTable, userCoinsTable, gachaPullsTable, userCollectionTable, cardsTable, packsTable, paymentOrdersTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { formatCard } from "./cards";

const router = Router();

router.get("/dashboard", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const [coins] = await db.select().from(userCoinsTable).where(eq(userCoinsTable.userId, userId)).limit(1);
    const [{ totalPulls }] = await db.select({ totalPulls: sql<number>`count(*)::int` }).from(gachaPullsTable).where(eq(gachaPullsTable.userId, userId));
    const [{ collectionCount }] = await db.select({ collectionCount: sql<number>`count(*)::int` }).from(userCollectionTable).where(eq(userCollectionTable.userId, userId));

    const [{ legendaryCount }] = await db.select({ legendaryCount: sql<number>`count(*)::int` })
      .from(userCollectionTable)
      .innerJoin(cardsTable, eq(userCollectionTable.cardId, cardsTable.id))
      .where(and(eq(userCollectionTable.userId, userId), eq(cardsTable.rarity, "legendary")));

    const recentPullsRaw = await db.select({
      id: gachaPullsTable.id,
      packId: gachaPullsTable.packId,
      packName: packsTable.name,
      card: cardsTable,
      pulledAt: gachaPullsTable.pulledAt,
    })
      .from(gachaPullsTable)
      .innerJoin(cardsTable, eq(gachaPullsTable.cardId, cardsTable.id))
      .innerJoin(packsTable, eq(gachaPullsTable.packId, packsTable.id))
      .where(eq(gachaPullsTable.userId, userId))
      .orderBy(desc(gachaPullsTable.pulledAt))
      .limit(5);

    const [{ totalSpentUsd }] = await db.select({ totalSpentUsd: sql<number>`coalesce(sum(amount_usd::numeric), 0)` })
      .from(paymentOrdersTable)
      .where(and(eq(paymentOrdersTable.userId, userId), eq(paymentOrdersTable.status, "completed")));

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        coinsBalance: coins?.balance ?? 0,
        createdAt: user.createdAt.toISOString(),
      },
      coinsBalance: coins?.balance ?? 0,
      totalPulls,
      collectionCount,
      legendaryCount,
      totalSpentUsd: parseFloat(String(totalSpentUsd)) || 0,
      recentPulls: recentPullsRaw.map(p => ({
        id: p.id,
        pack: { id: p.packId, name: p.packName },
        card: formatCard(p.card),
        pulledAt: p.pulledAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

export default router;
