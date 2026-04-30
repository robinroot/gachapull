import { Router } from "express";
import { db, usersTable, userCoinsTable, gachaPullsTable, cardsTable, userCollectionTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { formatCard } from "./cards";

const router = Router();

router.get("/leaderboard", async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  try {
    const results = await db.select({
      userId: usersTable.id,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
      totalSpent: userCoinsTable.totalSpent,
    })
      .from(usersTable)
      .innerJoin(userCoinsTable, eq(usersTable.id, userCoinsTable.userId))
      .orderBy(desc(userCoinsTable.totalSpent))
      .limit(limit);

    const leaderboard = await Promise.all(results.map(async (u, idx) => {
      const [{ pullCount }] = await db.select({ pullCount: sql<number>`count(*)::int` })
        .from(gachaPullsTable).where(eq(gachaPullsTable.userId, u.userId));

      // Find top card (rarest card in collection)
      const topEntry = await db.select({ card: cardsTable })
        .from(userCollectionTable)
        .innerJoin(cardsTable, eq(userCollectionTable.cardId, cardsTable.id))
        .where(eq(userCollectionTable.userId, u.userId))
        .orderBy(sql`CASE rarity WHEN 'legendary' THEN 1 WHEN 'ultra_rare' THEN 2 WHEN 'super_rare' THEN 3 WHEN 'rare' THEN 4 ELSE 5 END`)
        .limit(1);

      return {
        rank: idx + 1,
        user: { id: u.userId, username: u.username, avatarUrl: u.avatarUrl },
        totalSpentUsd: Math.round(u.totalSpent / 100 * 100) / 100,
        totalPulls: pullCount,
        topCard: topEntry[0] ? formatCard(topEntry[0].card) : null,
      };
    }));

    res.json(leaderboard);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
