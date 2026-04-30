import { Router } from "express";
import { db, userCoinsTable, coinTransactionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { GetWalletTransactionsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/wallet", requireAuth, async (req, res) => {
  try {
    const [coins] = await db.select().from(userCoinsTable).where(eq(userCoinsTable.userId, req.user!.userId)).limit(1);
    if (!coins) { res.status(404).json({ error: "Wallet not found" }); return; }
    res.json({ balance: coins.balance, totalEarned: coins.totalEarned, totalSpent: coins.totalSpent });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

router.get("/wallet/transactions", requireAuth, async (req, res) => {
  const parsed = GetWalletTransactionsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;
  const userId = req.user!.userId;

  try {
    const transactions = await db.select().from(coinTransactionsTable)
      .where(eq(coinTransactionsTable.userId, userId))
      .orderBy(desc(coinTransactionsTable.createdAt))
      .limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(coinTransactionsTable).where(eq(coinTransactionsTable.userId, userId));

    res.json({
      transactions: transactions.map(t => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
      total: count, page, limit,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;
