import { pgTable, text, serial, integer, timestamp, pgEnum, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const paymentMethodEnum = pgEnum("payment_method", ["stripe", "midtrans", "usdt"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed"]);
export const coinTransactionTypeEnum = pgEnum("coin_transaction_type", ["credit", "debit"]);

export const coinPackagesTable = pgTable("coin_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  coins: integer("coins").notNull(),
  priceUsd: numeric("price_usd", { precision: 10, scale: 2 }).notNull(),
  bonusCoins: integer("bonus_coins").default(0),
  isPopular: boolean("is_popular").default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const paymentOrdersTable = pgTable("payment_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  coinPackageId: integer("coin_package_id").references(() => coinPackagesTable.id),
  amountUsd: numeric("amount_usd", { precision: 10, scale: 2 }).notNull(),
  coinsGranted: integer("coins_granted").notNull(),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  paymentRef: text("payment_ref"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const coinTransactionsTable = pgTable("coin_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  type: coinTransactionTypeEnum("type").notNull(),
  description: text("description").notNull(),
  referenceId: integer("reference_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const paymentSettingsTable = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CoinPackage = typeof coinPackagesTable.$inferSelect;
export type PaymentOrder = typeof paymentOrdersTable.$inferSelect;
export type CoinTransaction = typeof coinTransactionsTable.$inferSelect;
export const insertCoinPackageSchema = createInsertSchema(coinPackagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCoinPackage = z.infer<typeof insertCoinPackageSchema>;
