import { Router } from "express";
import bcrypt from "bcrypt";
import { db, usersTable, userBalanceTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, signToken } from "../middlewares/auth";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

function formatUser(user: typeof usersTable.$inferSelect, balanceIdr = 0) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    balanceIdr,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }
  const { username, email, password } = parsed.data;
  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) { res.status(400).json({ error: "Email sudah terdaftar" }); return; }
    const existingUsername = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (existingUsername.length > 0) { res.status(400).json({ error: "Username sudah digunakan" }); return; }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(usersTable).values({ username, email, passwordHash }).returning();
    await db.insert(userBalanceTable).values({ userId: user.id, balanceIdr: 0, totalTopup: 0, totalSpent: 0 });
    const token = signToken({ userId: user.id, role: user.role });
    res.status(201).json({ user: formatUser(user, 0), token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Registrasi gagal" });
  }
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation error" }); return; }
  const { email, password } = parsed.data;
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) { res.status(401).json({ error: "Email atau password salah" }); return; }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: "Email atau password salah" }); return; }
    const [balance] = await db.select().from(userBalanceTable).where(eq(userBalanceTable.userId, user.id)).limit(1);
    const token = signToken({ userId: user.id, role: user.role });
    res.json({ user: formatUser(user, balance?.balanceIdr ?? 0), token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Login gagal" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    const [balance] = await db.select().from(userBalanceTable).where(eq(userBalanceTable.userId, user.id)).limit(1);
    res.json(formatUser(user, balance?.balanceIdr ?? 0));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
