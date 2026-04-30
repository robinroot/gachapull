import { Router } from "express";
import { db, cardsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../middlewares/auth";
import { CreateCardBody, ListCardsQueryParams } from "@workspace/api-zod";

const router = Router();

function formatCard(card: typeof cardsTable.$inferSelect) {
  return {
    id: card.id,
    name: card.name,
    franchise: card.franchise,
    rarity: card.rarity,
    imageUrl: card.imageUrl,
    description: card.description,
    pullCount: card.pullCount,
    createdAt: card.createdAt.toISOString(),
  };
}

router.get("/cards", async (req, res) => {
  const parsed = ListCardsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const franchise = parsed.success ? parsed.data.franchise : undefined;
  const rarity = parsed.success ? parsed.data.rarity : undefined;
  const offset = (page - 1) * limit;

  try {
    const conditions = [];
    if (franchise && franchise !== "all") conditions.push(eq(cardsTable.franchise, franchise as any));
    if (rarity) conditions.push(eq(cardsTable.rarity, rarity as any));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const cards = await db.select().from(cardsTable).where(whereClause).limit(limit).offset(offset).orderBy(cardsTable.createdAt);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(cardsTable).where(whereClause);

    res.json({ cards: cards.map(formatCard), total: count, page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

router.get("/cards/featured", async (req, res) => {
  try {
    const cards = await db.select().from(cardsTable)
      .where(eq(cardsTable.rarity, "legendary"))
      .orderBy(sql`random()`)
      .limit(6);
    res.json(cards.map(formatCard));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch featured cards" });
  }
});

router.get("/cards/:cardId", async (req, res) => {
  const cardId = parseInt(req.params.cardId);
  if (isNaN(cardId)) { res.status(400).json({ error: "Invalid card ID" }); return; }
  try {
    const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, cardId)).limit(1);
    if (!card) { res.status(404).json({ error: "Card not found" }); return; }
    res.json(formatCard(card));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch card" });
  }
});

router.post("/cards", requireAdmin, async (req, res) => {
  const parsed = CreateCardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation error", message: parsed.error.message }); return; }
  try {
    const [card] = await db.insert(cardsTable).values(parsed.data as any).returning();
    res.status(201).json(formatCard(card));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create card" });
  }
});

router.put("/cards/:cardId", requireAdmin, async (req, res) => {
  const cardId = parseInt(req.params.cardId);
  if (isNaN(cardId)) { res.status(400).json({ error: "Invalid card ID" }); return; }
  const parsed = CreateCardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation error" }); return; }
  try {
    const [card] = await db.update(cardsTable).set({ ...parsed.data as any, updatedAt: new Date() }).where(eq(cardsTable.id, cardId)).returning();
    if (!card) { res.status(404).json({ error: "Card not found" }); return; }
    res.json(formatCard(card));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update card" });
  }
});

router.delete("/cards/:cardId", requireAdmin, async (req, res) => {
  const cardId = parseInt(req.params.cardId);
  if (isNaN(cardId)) { res.status(400).json({ error: "Invalid card ID" }); return; }
  try {
    await db.delete(cardsTable).where(eq(cardsTable.id, cardId));
    res.json({ message: "Card deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete card" });
  }
});

export { formatCard };
export default router;
