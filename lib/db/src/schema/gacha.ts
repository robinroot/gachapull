import { pgTable, serial, integer, timestamp, text, pgEnum } from "drizzle-orm/pg-core";
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

export const cardBuybacksTable = pgTable("card_buybacks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  cardId: integer("card_id").notNull().references(() => cardsTable.id),
  coinsRefunded: integer("coins_refunded").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const physicalRequestStatusEnum = pgEnum("physical_request_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const physicalCardRequestsTable = pgTable("physical_card_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  cardId: integer("card_id").notNull().references(() => cardsTable.id),
  status: physicalRequestStatusEnum("status").notNull().default("pending"),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("Indonesia"),
  trackingNumber: text("tracking_number"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type GachaPull = typeof gachaPullsTable.$inferSelect;
export type UserCollection = typeof userCollectionTable.$inferSelect;
export type CardBuyback = typeof cardBuybacksTable.$inferSelect;
export type PhysicalCardRequest = typeof physicalCardRequestsTable.$inferSelect;
