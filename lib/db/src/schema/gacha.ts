import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { packsTable } from "./packs";
import { cardsTable } from "./cards";

export const gachaPullsTable = pgTable("gacha_pulls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  packId: integer("pack_id").notNull().references(() => packsTable.id),
  cardId: integer("card_id").notNull().references(() => cardsTable.id),
  pulledAt: timestamp("pulled_at").notNull().defaultNow(),
});

export const userCollectionTable = pgTable("user_collection", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  cardId: integer("card_id").notNull().references(() => cardsTable.id),
  count: integer("count").notNull().default(1),
  firstObtainedAt: timestamp("first_obtained_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type GachaPull = typeof gachaPullsTable.$inferSelect;
export type UserCollection = typeof userCollectionTable.$inferSelect;
