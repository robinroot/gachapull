import { Router } from "express";
import { db, packsTable, packCardsTable, cardsTable, gachaPullsTable, userCollectionTable, userCoinsTable, coinTransactionsTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { GachaPullBody, GetGachaHistoryQueryParams } from "@workspace/api-zod";
import { formatCard } from "./cards";

const router = Router();

router.post("/gacha/pull", requireAuth, async (req, res) => {
  const parsed = GachaPullBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation error" }); return; }

  const { packId, pullCount } = parsed.data;
  const userId = req.user!.userId;

  try {
    const [pack] = await db.select().from(packsTable).where(eq(packsTable.id, packId)).limit(1);
    if (!pack || !pack.isActive) { res.status(400).json({ error: "Pack not available" }); return; }

    const poolEntries = await db.select({ cardId: packCardsTable.cardId, probability: packCardsTable.probability })
      .from(packCardsTable).where(eq(packCardsTable.packId, packId));

    if (poolEntries.length === 0) { res.status(400).json({ error: "Pack has no cards" }); return; }

    const totalCost = pack.priceCoins * pullCount;
    const [wallet] = await db.select().from(userCoinsTable).where(eq(userCoinsTable.userId, userId)).limit(1);
    if (!wallet || wallet.balance < totalCost) {
      res.status(400).json({ error: "Insufficient coins" }); return;
    }

    // Normalize probabilities
    const totalProb = poolEntries.reduce((sum, e) => sum + parseFloat(e.probability), 0);
    const pulls: { card: typeof cardsTable.$inferSelect; isNew: boolean }[] = [];

    for (let i = 0; i < pullCount; i++) {
      let rand = Math.random() * totalProb;
      let selectedCardId = poolEntries[poolEntries.length - 1].cardId;
      for (const entry of poolEntries) {
        rand -= parseFloat(entry.probability);
        if (rand <= 0) { selectedCardId = entry.cardId; break; }
      }

      const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, selectedCardId)).limit(1);
      if (!card) continue;

      const [existing] = await db.select().from(userCollectionTable)
        .where(and(eq(userCollectionTable.userId, userId), eq(userCollectionTable.cardId, card.id))).limit(1);

      let isNew = false;
      if (existing) {
        await db.update(userCollectionTable).set({ count: existing.count + 1, updatedAt: new Date() })
          .where(eq(userCollectionTable.id, existing.id));
      } else {
        isNew = true;
        await db.insert(userCollectionTable).values({ userId, cardId: card.id, count: 1 });
      }

      await db.insert(gachaPullsTable).values({ userId, packId, cardId: card.id });
      await db.update(cardsTable).set({ pullCount: card.pullCount + 1 }).where(eq(cardsTable.id, card.id));
      pulls.push({ card, isNew });
    }

    // Deduct coins
    const newBalance = wallet.balance - totalCost;
    const newTotalSpent = wallet.totalSpent + totalCost;
    await db.update(userCoinsTable).set({ balance: newBalance, totalSpent: newTotalSpent, updatedAt: new Date() })
      .where(eq(userCoinsTable.userId, userId));

    await db.insert(coinTransactionsTable).values({
      userId, amount: -totalCost, type: "debit",
      description: `Pulled ${pullCount}x from ${pack.name}`,
    });

    res.json({
      cards: pulls.map(p => ({ card: formatCard(p.card), isNew: p.isNew })),
      coinsSpent: totalCost,
      coinsRemaining: newBalance,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Gacha pull failed" });
  }
});

router.get("/gacha/history", requireAuth, async (req, res) => {
  const parsed = GetGachaHistoryQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;
  const userId = req.user!.userId;

  try {
    const pulls = await db.select({
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
      .limit(limit).offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(gachaPullsTable).where(eq(gachaPullsTable.userId, userId));

    res.json({
      pulls: pulls.map(p => ({
        id: p.id,
        pack: { id: p.packId, name: p.packName },
        card: formatCard(p.card),
        pulledAt: p.pulledAt.toISOString(),
      })),
      total: count, page, limit,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
