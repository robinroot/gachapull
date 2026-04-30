import { Router } from "express";
import { db, userCollectionTable, cardsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { formatCard } from "./cards";

const router = Router();

router.get("/collection", requireAuth, async (req, res) => {
  const franchise = req.query.franchise as string | undefined;
  const userId = req.user!.userId;

  try {
    let query = db.select({ collection: userCollectionTable, card: cardsTable })
      .from(userCollectionTable)
      .innerJoin(cardsTable, eq(userCollectionTable.cardId, cardsTable.id))
      .where(eq(userCollectionTable.userId, userId));

    const items = await query;
    const filtered = franchise && franchise !== "all"
      ? items.filter(i => i.card.franchise === franchise)
      : items;

    res.json(filtered.map(i => ({
      card: formatCard(i.card),
      count: i.collection.count,
      firstObtainedAt: i.collection.firstObtainedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch collection" });
  }
});

router.get("/collection/stats", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  try {
    const items = await db.select({ collection: userCollectionTable, card: cardsTable })
      .from(userCollectionTable)
      .innerJoin(cardsTable, eq(userCollectionTable.cardId, cardsTable.id))
      .where(eq(userCollectionTable.userId, userId));

    const totalCards = items.reduce((sum, i) => sum + i.collection.count, 0);
    const uniqueCards = items.length;

    const byFranchise = { pokemon: 0, onepiece: 0 };
    const byRarity: Record<string, number> = { common: 0, rare: 0, super_rare: 0, ultra_rare: 0, legendary: 0 };

    for (const item of items) {
      byFranchise[item.card.franchise] += item.collection.count;
      byRarity[item.card.rarity] += item.collection.count;
    }

    const [{ totalPulls }] = await db.select({ totalPulls: sql<number>`count(*)::int` })
      .from(userCollectionTable).where(eq(userCollectionTable.userId, userId));

    res.json({ totalCards, uniqueCards, byFranchise, byRarity, totalPulls: totalCards });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
