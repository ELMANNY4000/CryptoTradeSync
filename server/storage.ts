import { 
  users, type User, type InsertUser,
  kycInfo, type KycInfo, type InsertKycInfo,
  cryptoAssets, type CryptoAsset, type InsertCryptoAsset,
  wallets, type Wallet, type InsertWallet,
  transactions, type Transaction, type InsertTransaction,
  orders, type Order, type InsertOrder
} from "@shared/schema";

// Storage interface for all data operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // KYC operations
  getKycInfo(userId: number): Promise<KycInfo | undefined>;
  createKycInfo(kycInfo: InsertKycInfo): Promise<KycInfo>;
  updateKycInfo(userId: number, data: Partial<KycInfo>): Promise<KycInfo | undefined>;
  
  // Crypto assets operations
  getAllCryptoAssets(): Promise<CryptoAsset[]>;
  getCryptoAsset(id: number): Promise<CryptoAsset | undefined>;
  getCryptoAssetBySymbol(symbol: string): Promise<CryptoAsset | undefined>;
  createCryptoAsset(asset: InsertCryptoAsset): Promise<CryptoAsset>;
  updateCryptoAsset(id: number, data: Partial<CryptoAsset>): Promise<CryptoAsset | undefined>;
  
  // Wallet operations
  getWalletsByUserId(userId: number): Promise<Wallet[]>;
  getWallet(id: number): Promise<Wallet | undefined>;
  getUserWalletForAsset(userId: number, assetId: number): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: number, data: Partial<Wallet>): Promise<Wallet | undefined>;
  
  // Transaction operations
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction | undefined>;
  
  // Order operations
  getOrdersByUserId(userId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private kycInfo: Map<number, KycInfo>;
  private cryptoAssets: Map<number, CryptoAsset>;
  private wallets: Map<number, Wallet>;
  private transactions: Map<number, Transaction>;
  private orders: Map<number, Order>;
  
  private currentUserId: number;
  private currentKycId: number;
  private currentAssetId: number;
  private currentWalletId: number;
  private currentTransactionId: number;
  private currentOrderId: number;
  
  constructor() {
    this.users = new Map();
    this.kycInfo = new Map();
    this.cryptoAssets = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.orders = new Map();
    
    this.currentUserId = 1;
    this.currentKycId = 1;
    this.currentAssetId = 1;
    this.currentWalletId = 1;
    this.currentTransactionId = 1;
    this.currentOrderId = 1;
    
    // Initialize with some crypto assets
    this.initializeCryptoAssets();
  }
  
  private initializeCryptoAssets() {
    const assets = [
      {
        symbol: "BTC",
        name: "Bitcoin",
        currentPrice: 42897.53,
        priceChangePercent: 2.41,
        marketCap: 832400000000,
        icon: "₿",
      },
      {
        symbol: "ETH",
        name: "Ethereum",
        currentPrice: 2245.78,
        priceChangePercent: 3.12,
        marketCap: 275200000000,
        icon: "Ξ",
      },
      {
        symbol: "SOL",
        name: "Solana",
        currentPrice: 102.34,
        priceChangePercent: -1.54,
        marketCap: 45300000000,
        icon: "S",
      },
      {
        symbol: "XRP",
        name: "XRP",
        currentPrice: 0.5478,
        priceChangePercent: -0.76,
        marketCap: 29100000000,
        icon: "X",
      },
      {
        symbol: "USDT",
        name: "Tether",
        currentPrice: 1.00,
        priceChangePercent: 0.01,
        marketCap: 83000000000,
        icon: "$",
      }
    ];
    
    assets.forEach(asset => this.createCryptoAsset(asset));
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now, 
      kycLevel: 0,
      role: "user",
    };
    this.users.set(id, user);
    
    // Create default USD wallet for new user
    const usdAsset = await this.getCryptoAssetBySymbol("USDT");
    if (usdAsset) {
      await this.createWallet({
        userId: id,
        assetId: usdAsset.id,
        balance: 10000, // Starting with $10,000 mock money
        address: `wallet-${id}-${usdAsset.id}`
      });
    }
    
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // KYC operations
  async getKycInfo(userId: number): Promise<KycInfo | undefined> {
    return Array.from(this.kycInfo.values()).find(info => info.userId === userId);
  }
  
  async createKycInfo(insertKycInfo: InsertKycInfo): Promise<KycInfo> {
    const id = this.currentKycId++;
    const kycInfo: KycInfo = { ...insertKycInfo, id, verificationStatus: "pending" };
    this.kycInfo.set(id, kycInfo);
    return kycInfo;
  }
  
  async updateKycInfo(userId: number, data: Partial<KycInfo>): Promise<KycInfo | undefined> {
    const kycInfo = await this.getKycInfo(userId);
    if (!kycInfo) return undefined;
    
    const updatedKycInfo = { ...kycInfo, ...data };
    this.kycInfo.set(kycInfo.id, updatedKycInfo);
    return updatedKycInfo;
  }
  
  // Crypto assets operations
  async getAllCryptoAssets(): Promise<CryptoAsset[]> {
    return Array.from(this.cryptoAssets.values());
  }
  
  async getCryptoAsset(id: number): Promise<CryptoAsset | undefined> {
    return this.cryptoAssets.get(id);
  }
  
  async getCryptoAssetBySymbol(symbol: string): Promise<CryptoAsset | undefined> {
    return Array.from(this.cryptoAssets.values()).find(
      asset => asset.symbol.toLowerCase() === symbol.toLowerCase()
    );
  }
  
  async createCryptoAsset(insertAsset: InsertCryptoAsset): Promise<CryptoAsset> {
    const id = this.currentAssetId++;
    const now = new Date();
    const asset: CryptoAsset = { ...insertAsset, id, lastUpdated: now };
    this.cryptoAssets.set(id, asset);
    return asset;
  }
  
  async updateCryptoAsset(id: number, data: Partial<CryptoAsset>): Promise<CryptoAsset | undefined> {
    const asset = await this.getCryptoAsset(id);
    if (!asset) return undefined;
    
    const now = new Date();
    const updatedAsset = { ...asset, ...data, lastUpdated: now };
    this.cryptoAssets.set(id, updatedAsset);
    return updatedAsset;
  }
  
  // Wallet operations
  async getWalletsByUserId(userId: number): Promise<Wallet[]> {
    return Array.from(this.wallets.values()).filter(wallet => wallet.userId === userId);
  }
  
  async getWallet(id: number): Promise<Wallet | undefined> {
    return this.wallets.get(id);
  }
  
  async getUserWalletForAsset(userId: number, assetId: number): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(
      wallet => wallet.userId === userId && wallet.assetId === assetId
    );
  }
  
  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = this.currentWalletId++;
    const wallet: Wallet = { ...insertWallet, id };
    this.wallets.set(id, wallet);
    return wallet;
  }
  
  async updateWallet(id: number, data: Partial<Wallet>): Promise<Wallet | undefined> {
    const wallet = await this.getWallet(id);
    if (!wallet) return undefined;
    
    const updatedWallet = { ...wallet, ...data };
    this.wallets.set(id, updatedWallet);
    return updatedWallet;
  }
  
  // Transaction operations
  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt: now,
      completedAt: insertTransaction.status === "completed" ? now : undefined
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = await this.getTransaction(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { 
      ...transaction, 
      ...data,
      completedAt: data.status === "completed" && !transaction.completedAt ? new Date() : transaction.completedAt
    };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  // Order operations
  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const now = new Date();
    const order: Order = { 
      ...insertOrder, 
      id, 
      createdAt: now,
      completedAt: insertOrder.status === "completed" ? now : undefined 
    };
    this.orders.set(id, order);
    return order;
  }
  
  async updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const updatedOrder = { 
      ...order, 
      ...data,
      completedAt: data.status === "completed" && !order.completedAt ? new Date() : order.completedAt
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
}

// Export a single instance of the storage for use throughout the application
export const storage = new MemStorage();
