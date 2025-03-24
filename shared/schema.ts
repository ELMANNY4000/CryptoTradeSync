import { pgTable, text, serial, integer, timestamp, boolean, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User related tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  avatar: text("avatar"),
  role: text("role").default("user").notNull(),
  kycLevel: integer("kyc_level").default(0).notNull(),
});

export const kycInfo = pgTable("kyc_info", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  firstName: text("first_name"),
  lastName: text("last_name"),
  dateOfBirth: timestamp("date_of_birth"),
  country: text("country"),
  address: text("address"),
  city: text("city"),
  zipCode: text("zip_code"),
  documentType: text("document_type"),
  documentNumber: text("document_number"),
  verificationStatus: text("verification_status").default("unverified").notNull(),
});

// Cryptocurrency and wallet related tables
export const cryptoAssets = pgTable("crypto_assets", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  currentPrice: doublePrecision("current_price"),
  priceChangePercent: doublePrecision("price_change_percent"),
  marketCap: doublePrecision("market_cap"),
  icon: text("icon"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  assetId: integer("asset_id").notNull().references(() => cryptoAssets.id),
  balance: doublePrecision("balance").default(0).notNull(),
  address: text("address"),
});

// Transaction related tables
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // buy, sell, deposit, withdraw
  assetId: integer("asset_id").references(() => cryptoAssets.id),
  amount: doublePrecision("amount").notNull(),
  price: doublePrecision("price"),
  totalValue: doublePrecision("total_value").notNull(),
  fee: doublePrecision("fee"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Order related tables
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  assetId: integer("asset_id").notNull().references(() => cryptoAssets.id),
  type: text("type").notNull(), // buy, sell
  orderType: text("order_type").notNull(), // market, limit
  amount: doublePrecision("amount").notNull(),
  price: doublePrecision("price"),
  status: text("status").default("pending").notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Define schemas for inserts
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

export const insertKycInfoSchema = createInsertSchema(kycInfo).pick({
  userId: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  country: true,
  address: true,
  city: true,
  zipCode: true,
  documentType: true,
  documentNumber: true,
});

export const insertCryptoAssetSchema = createInsertSchema(cryptoAssets).pick({
  symbol: true,
  name: true,
  currentPrice: true,
  priceChangePercent: true,
  marketCap: true,
  icon: true,
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  userId: true,
  assetId: true,
  balance: true,
  address: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  type: true,
  assetId: true, 
  amount: true,
  price: true,
  totalValue: true,
  fee: true,
  status: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  assetId: true,
  type: true,
  orderType: true,
  amount: true,
  price: true,
  status: true,
});

// Export types for use in the application
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertKycInfo = z.infer<typeof insertKycInfoSchema>;
export type KycInfo = typeof kycInfo.$inferSelect;

export type InsertCryptoAsset = z.infer<typeof insertCryptoAssetSchema>;
export type CryptoAsset = typeof cryptoAssets.$inferSelect;

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
