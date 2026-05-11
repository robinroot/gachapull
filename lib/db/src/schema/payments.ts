import { pgTable, text, serial, integer, timestamp, pgEnum, numeric, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const topupMethodEnum = pgEnum("topup_method", ["qris", "gopay", "ovo", "dana", "bank_transfer"]);
export const topupStatusEnum = pgEnum("topup_status", ["pending", "completed", "failed", "expired"]);
export const balanceTransactionTypeEnum = pgEnum("balance_transaction_type", ["topup", "gacha_pull", "buyback", "refund", "adjustment"]);

export const topupOrdersTable = pgTable("topup_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amountIdr: integer("amount_idr").notNull(),
  method: topupMethodEnum("method").notNull(),
  status: topupStatusEnum("status").notNull().default("pending"),
  paymentRef: text("payment_ref"),
  snapToken: text("snap_token"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const balanceTransactionsTable = pgTable("balance_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amountIdr: integer("amount_idr").notNull(),
  type: balanceTransactionTypeEnum("type").notNull(),
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

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type TopupOrder = typeof topupOrdersTable.$inferSelect;
export type BalanceTransaction = typeof balanceTransactionsTable.$inferSelect;
