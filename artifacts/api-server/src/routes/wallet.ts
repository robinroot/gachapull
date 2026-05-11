import { Router } from "express";
import { db, userBalanceTable, balanceTransactionsTable, topupOrdersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// Top-up packages (in IDR)
const TOPUP_PACKAGES = [
  { id: 1, name: "Starter", amountIdr: 10000, label: "Rp 10.000" },
  { id: 2, name: "Basic", amountIdr: 25000, label: "Rp 25.000" },
  { id: 3, name: "Value", amountIdr: 50000, label: "Rp 50.000", isPopular: true },
  { id: 4, name: "Pro", amountIdr: 100000, label: "Rp 100.000" },
  { id: 5, name: "Elite", amountIdr: 200000, label: "Rp 200.000" },
  { id: 6, name: "Legendary", amountIdr: 500000, label: "Rp 500.000" },
];

router.get("/wallet", requireAuth, async (req, res) => {
  try {
    const [balance] = await db.select().from(userBalanceTable).where(eq(userBalanceTable.userId, req.user!.userId)).limit(1);
    if (!balance) { res.status(404).json({ error: "Wallet not found" }); return; }
    res.json({ balanceIdr: balance.balanceIdr, totalTopup: balance.totalTopup, totalSpent: balance.totalSpent });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

router.get("/wallet/transactions", requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page || "1")));
  const limit = Math.min(50, parseInt(String(req.query.limit || "20")));
  const offset = (page - 1) * limit;
  const userId = req.user!.userId;

  try {
    const transactions = await db.select().from(balanceTransactionsTable)
      .where(eq(balanceTransactionsTable.userId, userId))
      .orderBy(desc(balanceTransactionsTable.createdAt))
      .limit(limit).offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` })
      .from(balanceTransactionsTable).where(eq(balanceTransactionsTable.userId, userId));

    res.json({
      transactions: transactions.map(t => ({
        id: t.id,
        amountIdr: t.amountIdr,
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

router.get("/wallet/topup-packages", requireAuth, (_req, res) => {
  res.json(TOPUP_PACKAGES);
});

// Mock topup endpoint — creates a pending order, simulates Midtrans
router.post("/wallet/topup", requireAuth, async (req, res) => {
  const { amountIdr, method } = req.body;
  const validMethods = ["qris", "gopay", "ovo", "dana", "bank_transfer"];
  if (!amountIdr || typeof amountIdr !== "number" || amountIdr < 1000) {
    res.status(400).json({ error: "Jumlah top-up tidak valid (minimal Rp 1.000)" }); return;
  }
  if (!method || !validMethods.includes(method)) {
    res.status(400).json({ error: "Metode pembayaran tidak valid" }); return;
  }

  const userId = req.user!.userId;
  try {
    const [order] = await db.insert(topupOrdersTable).values({
      userId,
      amountIdr,
      method,
      status: "pending",
      paymentRef: `TXN-${Date.now()}-${userId}`,
      snapToken: `snap-${Date.now()}`,
    }).returning();

    res.json({
      orderId: order.id,
      amountIdr: order.amountIdr,
      method: order.method,
      status: order.status,
      paymentRef: order.paymentRef,
      snapToken: order.snapToken,
      message: "Top-up order dibuat. Selesaikan pembayaran untuk menambah saldo.",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Gagal membuat order top-up" });
  }
});

// Mock confirm topup (would be Midtrans webhook in production)
router.post("/wallet/topup/:orderId/confirm", requireAuth, async (req, res) => {
  const orderId = parseInt(req.params.orderId);
  if (isNaN(orderId)) { res.status(400).json({ error: "Invalid order ID" }); return; }
  const userId = req.user!.userId;

  try {
    const [order] = await db.select().from(topupOrdersTable)
      .where(eq(topupOrdersTable.id, orderId)).limit(1);

    if (!order || order.userId !== userId) {
      res.status(404).json({ error: "Order tidak ditemukan" }); return;
    }
    if (order.status !== "pending") {
      res.status(400).json({ error: "Order sudah diproses" }); return;
    }

    await db.update(topupOrdersTable).set({ status: "completed", updatedAt: new Date() })
      .where(eq(topupOrdersTable.id, orderId));

    const [wallet] = await db.select().from(userBalanceTable).where(eq(userBalanceTable.userId, userId)).limit(1);
    const newBalance = (wallet?.balanceIdr || 0) + order.amountIdr;
    await db.update(userBalanceTable)
      .set({ balanceIdr: newBalance, totalTopup: (wallet?.totalTopup || 0) + order.amountIdr, updatedAt: new Date() })
      .where(eq(userBalanceTable.userId, userId));

    await db.insert(balanceTransactionsTable).values({
      userId,
      amountIdr: order.amountIdr,
      type: "topup",
      description: `Top-up via ${order.method.toUpperCase()} — Rp ${order.amountIdr.toLocaleString("id-ID")}`,
      referenceId: order.id,
    });

    res.json({
      message: `Saldo berhasil ditambahkan Rp ${order.amountIdr.toLocaleString("id-ID")}`,
      newBalance,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Gagal konfirmasi top-up" });
  }
});

export default router;
