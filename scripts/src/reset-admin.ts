import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Auto-load .env from project root (2 levels up from scripts/src/)
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, "../../.env");
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
  console.log("Loaded .env from project root");
} catch {
  // .env not found — DATABASE_URL must be set in environment
}

import { db } from "@workspace/db";
import { usersTable, userBalanceTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";

const email = "admin@gachapull.com";
const password = "Admin@123456";

const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

if (existing.length > 0) {
  const hash = existing[0].passwordHash;
  const valid = await bcryptjs.compare(password, hash);
  console.log("Hash:", hash);
  console.log("Password valid:", valid);

  if (!valid) {
    const newHash = await bcryptjs.hash(password, 12);
    await db.update(usersTable).set({ passwordHash: newHash, role: "admin" }).where(eq(usersTable.email, email));
    console.log("Updated password hash");
  } else {
    await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.email, email));
    console.log("Admin role confirmed");
  }
} else {
  const hash = await bcryptjs.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    username: "admin",
    email,
    passwordHash: hash,
    role: "admin",
  }).returning();
  await db.insert(userBalanceTable).values({ userId: user.id, balanceIdr: 0, totalTopup: 0, totalSpent: 0 });
  console.log("Created admin user:", user.id);
}

process.exit(0);
