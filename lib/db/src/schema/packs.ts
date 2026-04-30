import { pgTable, text, serial, integer, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { franchiseEnum } from "./cards";
import { cardsTable } from "./cards";

export const packsTable = pgTable("packs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  franchise: franchiseEnum("franchise").notNull(),
  priceCoins: integer("price_coins").notNull(),
  priceUsd: numeric("price_usd", { precision: 10, scale: 2 }),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const packCardsTable = pgTable("pack_cards", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id").notNull().references(() => packsTable.id, { onDelete: "cascade" }),
  cardId: integer("card_id").notNull().references(() => cardsTable.id, { onDelete: "cascade" }),
  probability: numeric("probability", { precision: 10, scale: 6 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPackSchema = createInsertSchema(packsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPack = z.infer<typeof insertPackSchema>;
export type Pack = typeof packsTable.$inferSelect;
export type PackCard = typeof packCardsTable.$inferSelect;
