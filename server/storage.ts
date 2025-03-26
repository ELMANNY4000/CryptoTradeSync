import {
  users, type User, type InsertUser,
  kycInfo, type KycInfo, type InsertKycInfo,
  cryptoAssets, type CryptoAsset, type InsertCryptoAsset,
  wallets, type Wallet, type InsertWallet,
  transactions, type Transaction, type InsertTransaction,
  orders, type Order, type InsertOrder,
  liquidityPools, type LiquidityPool, type InsertLiquidityPool,
  liquidityPositions, type LiquidityPosition, type InsertLiquidityPosition,
  swaps, type Swap, type InsertSwap,
  userSettings, type UserSettings, type InsertUserSettings
} from "@shared/schema";

// Storage interface for all data operations
export interface IStorage {
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUsersByIds(ids: number[]): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | null>;
  deleteUser(id: number): Promise<void>;
  
  getKycInfo(userId: number): Promise<KycInfo | null>;
  createKycInfo(kycInfo: InsertKycInfo): Promise<KycInfo>;
  updateKycInfo(userId: number, data: Partial<KycInfo>): Promise<KycInfo | null>;
  
  getAllCryptoAssets(): Promise<CryptoAsset[]>;
  getCryptoAsset(id: number): Promise<CryptoAsset | null>;
  getCryptoAssetBySymbol(symbol: string): Promise<CryptoAsset | null>;
  createCryptoAsset(asset: InsertCryptoAsset): Promise<CryptoAsset>;
  updateCryptoAsset(id: number, data: Partial<CryptoAsset>): Promise<CryptoAsset | null>;
  getAllCryptoAssets(): Promise<CryptoAsset[]>;
  
  getWalletsByUserId(userId: number): Promise<Wallet[]>;
  getWallet(id: number): Promise<Wallet | null>;
  getUserWalletForAsset(userId: number, assetId: number): Promise<Wallet | null>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: number, data: Partial<Wallet>): Promise<Wallet | null>;
  getWalletsByUserIds(userIds: number[]): Promise<Wallet[]>;
  
  getTransactionsByUserId(userId: number, limit?: number, offset?: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | null>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction | null>;
  archiveTransaction(id: number): Promise<void>;
  
  getOrdersByUserId(userId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | null>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order | null>;
  
  getAllLiquidityPools(): Promise<LiquidityPool[]>;
  getLiquidityPool(id: number): Promise<LiquidityPool | null>;
  getLiquidityPoolByTokens(token0Id: number, token1Id: number): Promise<LiquidityPool | null>;
  createLiquidityPool(pool: InsertLiquidityPool): Promise<LiquidityPool>;
  updateLiquidityPool(id: number, data: Partial<LiquidityPool>): Promise<LiquidityPool | null>;
  
  getLiquidityPositionsByUserId(userId: number): Promise<LiquidityPosition[]>;
  getLiquidityPositionsByPoolId(poolId: number): Promise<LiquidityPosition[]>;
  getLiquidityPosition(id: number): Promise<LiquidityPosition | null>;
  getUserLiquidityPositionForPool(userId: number, poolId: number): Promise<LiquidityPosition | null>;
  createLiquidityPosition(position: InsertLiquidityPosition): Promise<LiquidityPosition>;
  updateLiquidityPosition(id: number, data: Partial<LiquidityPosition>): Promise<LiquidityPosition | null>;
  
  getSwapsByUserId(userId: number): Promise<Swap[]>;
  getSwapsByPoolId(poolId: number): Promise<Swap[]>;
  getSwap(id: number): Promise<Swap | null>;
  createSwap(swap: InsertSwap): Promise<Swap>;
  
  getUserSettings(userId: number): Promise<UserSettings | null>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: number, data: Partial<UserSettings>): Promise<UserSettings | null>;
}
