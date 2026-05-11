import { Router } from "express";
import { db, packsTable, packCardsTable, cardsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { CreatePackBody, AddCardToPackBody, ListPacksQueryParams } from "@workspace/api-zod";
import { formatCard } from "./cards";

const router = Router();

function formatPack(pack: typeof packsTable.$inferSelect, cardCount = 0) {
  return {
    id: pack.id,
    name: pack.name,
    franchise: pack.franchise,
    priceIdr: pack.priceIdr,
    imageUrl: pack.imageUrl,
    description: pack.description,
    isActive: pack.isActive,
    cardCount,
    createdAt: pack.createdAt.toISOString(),
  };
}

router.get("/packs", async (req, res) => {
  const parsed = ListPacksQueryParams.safeParse(req.query);
  const franchise = parsed.success ? parsed.data.franchise : undefined;
  const isActive = parsed.success ? parsed.data.isActive : undefined;
  try {
    const conditions = [];
    if (franchise && franchise !== "all") conditions.push(eq(packsTable.franchise, franchise as any));
    if (isActive !== undefined) conditions.push(eq(packsTable.isActive, isActive));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const packs = await db.select().from(packsTable).where(whereClause).orderBy(packsTable.createdAt);
    const packsWithCounts = await Promise.all(packs.map(async (pack) => {
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(packCardsTable).where(eq(packCardsTable.packId, pack.id));
      return formatPack(pack, count);
    }));
    res.json(packsWithCounts);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch packs" });
  }
});

router.get("/packs/featured", async (req, res) => {
  try {
    const packs = await db.select().from(packsTable).where(eq(packsTable.isActive, true)).orderBy(sql`random()`).limit(4);
    const packsWithCounts = await Promise.all(packs.map(async (pack) => {
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(packCardsTable).where(eq(packCardsTable.packId, pack.id));
      return formatPack(pack, count);
    }));
    res.json(packsWithCounts);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch featured packs" });
  }
});

router.get("/packs/:packId", async (req, res) => {
  const packId = parseInt(req.params.packId);
  if (isNaN(packId)) { res.status(400).json({ error: "Invalid pack ID" }); return; }
  try {
    const [pack] = await db.select().from(packsTable).where(eq(packsTable.id, packId)).limit(1);
    if (!pack) { res.status(404).json({ error: "Pack not found" }); return; }

    const poolEntries = await db.select({ card: cardsTable, probability: packCardsTable.probability })
      .from(packCardsTable)
      .innerJoin(cardsTable, eq(packCardsTable.cardId, cardsTable.id))
      .where(eq(packCardsTable.packId, packId));

    const cardPool = poolEntries.map(e => ({
      card: formatCard(e.card),
      probability: parseFloat(e.probability),
    }));

    res.json({ ...formatPack(pack, cardPool.length), cardPool });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch pack" });
  }
});

router.post("/packs", requireAdmin, async (req, res) => {
  const { name, franchise, priceIdr, imageUrl, description, isActive } = req.body;
  if (!name || !franchise || !priceIdr || !imageUrl) {
    res.status(400).json({ error: "Validation error: name, franchise, priceIdr, imageUrl required" }); return;
  }
  try {
    const [pack] = await db.insert(packsTable).values({ name, franchise, priceIdr, imageUrl, description, isActive: isActive ?? true }).returning();
    res.status(201).json(formatPack(pack, 0));
  } catch (err) {
    req.log.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to create pack", detail: msg });
  }
});

router.put("/packs/:packId", requireAdmin, async (req, res) => {
  const packId = parseInt(req.params.packId);
  if (isNaN(packId)) { res.status(400).json({ error: "Invalid pack ID" }); return; }
  try {
    const { name, franchise, priceIdr, imageUrl, description, isActive } = req.body;
    const updateData: Partial<typeof packsTable.$inferInsert> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (franchise !== undefined) updateData.franchise = franchise;
    if (priceIdr !== undefined) updateData.priceIdr = priceIdr;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [pack] = await db.update(packsTable).set(updateData).where(eq(packsTable.id, packId)).returning();
    if (!pack) { res.status(404).json({ error: "Pack not found" }); return; }
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(packCardsTable).where(eq(packCardsTable.packId, packId));
    res.json(formatPack(pack, count));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update pack" });
  }
});

router.delete("/packs/:packId", requireAdmin, async (req, res) => {
  const packId = parseInt(req.params.packId);
  if (isNaN(packId)) { res.status(400).json({ error: "Invalid pack ID" }); return; }
  try {
    await db.delete(packsTable).where(eq(packsTable.id, packId));
    res.json({ message: "Pack deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete pack" });
  }
});

router.post("/packs/:packId/cards", requireAdmin, async (req, res) => {
  const packId = parseInt(req.params.packId);
  if (isNaN(packId)) { res.status(400).json({ error: "Invalid pack ID" }); return; }
  const parsed = AddCardToPackBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation error" }); return; }
  try {
    await db.insert(packCardsTable).values({ packId, cardId: parsed.data.cardId, probability: String(parsed.data.probability) });
    res.status(201).json({ message: "Card added to pack" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to add card to pack" });
  }
});

router.delete("/packs/:packId/cards", requireAdmin, async (req, res) => {
  const packId = parseInt(req.params.packId);
  if (isNaN(packId)) { res.status(400).json({ error: "Invalid pack ID" }); return; }
  const cardId = req.body?.cardId;
  if (!cardId) { res.status(400).json({ error: "cardId required" }); return; }
  try {
    await db.delete(packCardsTable).where(and(eq(packCardsTable.packId, packId), eq(packCardsTable.cardId, cardId)));
    res.json({ message: "Card removed from pack" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to remove card" });
  }
});

export default router;
