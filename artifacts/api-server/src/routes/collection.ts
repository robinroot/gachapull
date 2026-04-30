import { Router } from "express";
import { db, userCollectionTable, cardsTable, userCoinsTable, coinTransactionsTable, cardBuybacksTable, physicalCardRequestsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { formatCard } from "./cards";

const router = Router();

const RARITY_COIN_VALUE: Record<string, number> = {
  legendary: 500,
  ultra_rare: 200,
  super_rare: 80,
  rare: 40,
  common: 20,
};

const BUYBACK_RATE = 0.8;

router.get("/collection", requireAuth, async (req, res) => {
  const franchise = req.query.franchise as string | undefined;
  const rarity = req.query.rarity as string | undefined;
  const userId = req.user!.userId;

  try {
    const items = await db.select({ collection: userCollectionTable, card: cardsTable })
      .from(userCollectionTable)
      .innerJoin(cardsTable, eq(userCollectionTable.cardId, cardsTable.id))
      .where(eq(userCollectionTable.userId, userId));

    let filtered = items;
    if (franchise && franchise !== "all") filtered = filtered.filter(i => i.card.franchise === franchise);
    if (rarity && rarity !== "all") filtered = filtered.filter(i => i.card.rarity === rarity);

    res.json(filtered.map(i => ({
      card: formatCard(i.card),
      count: i.collection.count,
      firstObtainedAt: i.collection.firstObtainedAt.toISOString(),
      collectionId: i.collection.id,
      buybackValue: Math.floor((RARITY_COIN_VALUE[i.card.rarity] || 20) * BUYBACK_RATE),
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

    const byFranchise: Record<string, number> = { pokemon: 0, onepiece: 0 };
    const byRarity: Record<string, number> = { common: 0, rare: 0, super_rare: 0, ultra_rare: 0, legendary: 0 };

    for (const item of items) {
      if (item.card.franchise in byFranchise) byFranchise[item.card.franchise] += item.collection.count;
      if (item.card.rarity in byRarity) byRarity[item.card.rarity] += item.collection.count;
    }

    res.json({ totalCards, uniqueCards, byFranchise, byRarity, totalPulls: totalCards });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.post("/collection/buyback", requireAuth, async (req, res) => {
  const { cardId } = req.body;
  if (!cardId || typeof cardId !== "number" || cardId <= 0) {
    res.status(400).json({ error: "Invalid cardId" });
    return;
  }
  const userId = req.user!.userId;

  try {
    const [collectionEntry] = await db.select()
      .from(userCollectionTable)
      .where(and(eq(userCollectionTable.userId, userId), eq(userCollectionTable.cardId, cardId)))
      .limit(1);

    if (!collectionEntry) {
      res.status(404).json({ error: "Card not in your collection" });
      return;
    }

    const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, cardId)).limit(1);
    if (!card) {
      res.status(404).json({ error: "Card not found" });
      return;
    }

    const baseValue = RARITY_COIN_VALUE[card.rarity] || 20;
    const coinsRefunded = Math.floor(baseValue * BUYBACK_RATE);

    if (collectionEntry.count <= 1) {
      await db.delete(userCollectionTable).where(eq(userCollectionTable.id, collectionEntry.id));
    } else {
      await db.update(userCollectionTable)
        .set({ count: collectionEntry.count - 1, updatedAt: new Date() })
        .where(eq(userCollectionTable.id, collectionEntry.id));
    }

    const [wallet] = await db.select().from(userCoinsTable).where(eq(userCoinsTable.userId, userId)).limit(1);
    const newBalance = (wallet?.balance || 0) + coinsRefunded;

    await db.update(userCoinsTable)
      .set({ balance: newBalance, totalEarned: (wallet?.totalEarned || 0) + coinsRefunded })
      .where(eq(userCoinsTable.userId, userId));

    await db.insert(cardBuybacksTable).values({ userId, cardId, coinsRefunded });

    await db.insert(coinTransactionsTable).values({
      userId,
      amount: coinsRefunded,
      type: "earned",
      description: `Buyback: ${card.name} (${card.rarity.replace("_", " ")})`,
    });

    res.json({
      message: `Sold ${card.name} for ${coinsRefunded} coins`,
      coinsRefunded,
      newBalance,
      cardName: card.name,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Buyback failed" });
  }
});

router.post("/collection/request-physical", requireAuth, async (req, res) => {
  const { cardId, fullName, phone, address, city, province, postalCode, country } = req.body;

  if (!cardId || typeof cardId !== "number" || cardId <= 0) {
    res.status(400).json({ error: "Invalid cardId" });
    return;
  }
  if (!fullName || !phone || !address || !city || !province || !postalCode) {
    res.status(400).json({ error: "Missing required fields: fullName, phone, address, city, province, postalCode" });
    return;
  }

  const userId = req.user!.userId;

  try {
    const [collectionEntry] = await db.select()
      .from(userCollectionTable)
      .where(and(eq(userCollectionTable.userId, userId), eq(userCollectionTable.cardId, cardId)))
      .limit(1);

    if (!collectionEntry) {
      res.status(404).json({ error: "Card not in your collection" });
      return;
    }

    const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, cardId)).limit(1);
    if (!card) {
      res.status(404).json({ error: "Card not found" });
      return;
    }

    const [existing] = await db.select()
      .from(physicalCardRequestsTable)
      .where(
        and(
          eq(physicalCardRequestsTable.userId, userId),
          eq(physicalCardRequestsTable.cardId, cardId),
          sql`status NOT IN ('delivered', 'cancelled')`
        )
      )
      .limit(1);

    if (existing) {
      res.status(400).json({ error: "You already have a pending request for this card" });
      return;
    }

    const [request] = await db.insert(physicalCardRequestsTable).values({
      userId,
      cardId,
      fullName,
      phone,
      address,
      city,
      province,
      postalCode,
      country: country || "Indonesia",
    }).returning();

    res.status(201).json({
      message: "Physical card request submitted successfully",
      requestId: request.id,
      card: { name: card.name, rarity: card.rarity },
      status: "pending",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to submit request" });
  }
});

router.get("/collection/physical-requests", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  try {
    const requests = await db.select({ request: physicalCardRequestsTable, card: cardsTable })
      .from(physicalCardRequestsTable)
      .innerJoin(cardsTable, eq(physicalCardRequestsTable.cardId, cardsTable.id))
      .where(eq(physicalCardRequestsTable.userId, userId))
      .orderBy(sql`${physicalCardRequestsTable.createdAt} DESC`);

    res.json(requests.map(r => ({
      id: r.request.id,
      card: formatCard(r.card),
      status: r.request.status,
      fullName: r.request.fullName,
      phone: r.request.phone,
      address: r.request.address,
      city: r.request.city,
      province: r.request.province,
      postalCode: r.request.postalCode,
      country: r.request.country,
      trackingNumber: r.request.trackingNumber,
      adminNotes: r.request.adminNotes,
      createdAt: r.request.createdAt.toISOString(),
      updatedAt: r.request.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

export default router;
