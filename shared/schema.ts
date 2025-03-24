import { pgTable, text, serial, integer, timestamp, boolean, doublePrecision, jsonb, primaryKey } from "drizzle-orm/pg-core";
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

// DEX-specific tables
export const liquidityPools = pgTable("liquidity_pools", {
  id: serial("id").primaryKey(),
  token0Id: integer("token0_id").notNull().references(() => cryptoAssets.id),
  token1Id: integer("token1_id").notNull().references(() => cryptoAssets.id),
  token0Reserve: doublePrecision("token0_reserve").default(0).notNull(),
  token1Reserve: doublePrecision("token1_reserve").default(0).notNull(),
  fee: doublePrecision("fee").default(0.003).notNull(), // Default 0.3% fee
  totalLiquidity: doublePrecision("total_liquidity").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const liquidityPositions = pgTable("liquidity_positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  poolId: integer("pool_id").notNull().references(() => liquidityPools.id),
  liquidity: doublePrecision("liquidity").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const swaps = pgTable("swaps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  poolId: integer("pool_id").notNull().references(() => liquidityPools.id),
  tokenInId: integer("token_in_id").notNull().references(() => cryptoAssets.id),
  tokenOutId: integer("token_out_id").notNull().references(() => cryptoAssets.id),
  amountIn: doublePrecision("amount_in").notNull(),
  amountOut: doublePrecision("amount_out").notNull(),
  fee: doublePrecision("fee").notNull(),
  priceImpact: doublePrecision("price_impact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  txHash: text("tx_hash"), // For blockchain compatibility
});

// Define schemas for inserts
export const insertLiquidityPoolSchema = createInsertSchema(liquidityPools).pick({
  token0Id: true,
  token1Id: true,
  token0Reserve: true,
  token1Reserve: true,
  fee: true,
});

export const insertLiquidityPositionSchema = createInsertSchema(liquidityPositions).pick({
  userId: true,
  poolId: true,
  liquidity: true,
});

export const insertSwapSchema = createInsertSchema(swaps).pick({
  userId: true,
  poolId: true,
  tokenInId: true,
  tokenOutId: true,
  amountIn: true,
  amountOut: true,
  fee: true,
  priceImpact: true,
  txHash: true,
});

// Export types for DEX
export type InsertLiquidityPool = z.infer<typeof insertLiquidityPoolSchema>;
export type LiquidityPool = typeof liquidityPools.$inferSelect;

export type InsertLiquidityPosition = z.infer<typeof insertLiquidityPositionSchema>;
export type LiquidityPosition = typeof liquidityPositions.$inferSelect;

export type InsertSwap = z.infer<typeof insertSwapSchema>;
export type Swap = typeof swaps.$inferSelect;
