import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const franchiseEnum = pgEnum("franchise", ["pokemon", "onepiece"]);
export const rarityEnum = pgEnum("rarity", ["common", "rare", "super_rare", "ultra_rare", "legendary"]);

export const cardsTable = pgTable("cards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  franchise: franchiseEnum("franchise").notNull(),
  rarity: rarityEnum("rarity").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  pullCount: integer("pull_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCardSchema = createInsertSchema(cardsTable).omit({ id: true, createdAt: true, updatedAt: true, pullCount: true });
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cardsTable.$inferSelect;
