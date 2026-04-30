import { db } from "@workspace/db";
import { usersTable, userCoinsTable } from "@workspace/db/schema";
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
    const valid2 = await bcryptjs.compare(password, newHash);
    console.log("New hash valid:", valid2);
  }
} else {
  const hash = await bcryptjs.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    username: "admin",
    email,
    passwordHash: hash,
    role: "admin",
  }).returning();
  await db.insert(userCoinsTable).values({ userId: user.id, balance: 9999, totalEarned: 9999, totalSpent: 0 });
  console.log("Created admin user:", user.id);
}

process.exit(0);
