import { Router } from "express";
import { db, userCollectionTable, cardsTable, userBalanceTable, balanceTransactionsTable, cardBuybacksTable, physicalCardRequestsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { formatCard } from "./cards";

const router = Router();

// IDR value per rarity (buyback = 80%)
const RARITY_IDR_VALUE: Record<string, number> = {
  legendary: 50000,
  ultra_rare: 20000,
  super_rare: 8000,
  rare: 4000,
  common: 2000,
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
      buybackValue: Math.floor((RARITY_IDR_VALUE[i.card.rarity] || 2000) * BUYBACK_RATE),
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

    res.json({ totalCards, uniqueCards, byFranchise, byRarity });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.post("/collection/buyback", requireAuth, async (req, res) => {
  const { cardId } = req.body;
  if (!cardId || typeof cardId !== "number" || cardId <= 0) {
    res.status(400).json({ error: "Invalid cardId" }); return;
  }
  const userId = req.user!.userId;

  try {
    const [collectionEntry] = await db.select()
      .from(userCollectionTable)
      .where(and(eq(userCollectionTable.userId, userId), eq(userCollectionTable.cardId, cardId)))
      .limit(1);

    if (!collectionEntry) { res.status(404).json({ error: "Kartu tidak ada di koleksimu" }); return; }

    const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, cardId)).limit(1);
    if (!card) { res.status(404).json({ error: "Kartu tidak ditemukan" }); return; }

    const baseValue = RARITY_IDR_VALUE[card.rarity] || 2000;
    const amountRefunded = Math.floor(baseValue * BUYBACK_RATE);

    if (collectionEntry.count <= 1) {
      await db.delete(userCollectionTable).where(eq(userCollectionTable.id, collectionEntry.id));
    } else {
      await db.update(userCollectionTable)
        .set({ count: collectionEntry.count - 1, updatedAt: new Date() })
        .where(eq(userCollectionTable.id, collectionEntry.id));
    }

    const [wallet] = await db.select().from(userBalanceTable).where(eq(userBalanceTable.userId, userId)).limit(1);
    const newBalance = (wallet?.balanceIdr || 0) + amountRefunded;

    await db.update(userBalanceTable)
      .set({ balanceIdr: newBalance, totalTopup: (wallet?.totalTopup || 0) + amountRefunded, updatedAt: new Date() })
      .where(eq(userBalanceTable.userId, userId));

    await db.insert(cardBuybacksTable).values({ userId, cardId, amountIdr: amountRefunded });

    await db.insert(balanceTransactionsTable).values({
      userId,
      amountIdr: amountRefunded,
      type: "buyback",
      description: `Buyback: ${card.name} (${card.rarity.replace("_", " ")})`,
    });

    res.json({
      message: `Berhasil menjual ${card.name} seharga Rp ${amountRefunded.toLocaleString("id-ID")}`,
      amountRefunded,
      newBalance,
      cardName: card.name,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Buyback gagal" });
  }
});

router.post("/collection/request-physical", requireAuth, async (req, res) => {
  const { cardId, fullName, phone, address, city, province, postalCode, country } = req.body;

  if (!cardId || typeof cardId !== "number" || cardId <= 0) {
    res.status(400).json({ error: "Invalid cardId" }); return;
  }
  if (!fullName || !phone || !address || !city || !province || !postalCode) {
    res.status(400).json({ error: "Semua field wajib diisi" }); return;
  }

  const userId = req.user!.userId;

  try {
    const [collectionEntry] = await db.select()
      .from(userCollectionTable)
      .where(and(eq(userCollectionTable.userId, userId), eq(userCollectionTable.cardId, cardId)))
      .limit(1);

    if (!collectionEntry) { res.status(404).json({ error: "Kartu tidak ada di koleksimu" }); return; }

    const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, cardId)).limit(1);
    if (!card) { res.status(404).json({ error: "Kartu tidak ditemukan" }); return; }

    const [existing] = await db.select()
      .from(physicalCardRequestsTable)
      .where(and(
        eq(physicalCardRequestsTable.userId, userId),
        eq(physicalCardRequestsTable.cardId, cardId),
        sql`status NOT IN ('delivered', 'cancelled')`
      ))
      .limit(1);

    if (existing) {
      res.status(400).json({ error: "Kamu sudah punya permintaan aktif untuk kartu ini" }); return;
    }

    const [request] = await db.insert(physicalCardRequestsTable).values({
      userId, cardId, fullName, phone, address, city, province, postalCode,
      country: country || "Indonesia",
    }).returning();

    res.status(201).json({
      message: "Permintaan kartu fisik berhasil diajukan",
      requestId: request.id,
      card: { name: card.name, rarity: card.rarity },
      status: "pending",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Gagal mengajukan permintaan" });
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
    res.status(500).json({ error: "Gagal mengambil data permintaan" });
  }
});

export default router;
