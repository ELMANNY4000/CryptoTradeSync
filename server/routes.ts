import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { cryptoService } from "./crypto-service";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  insertUserSchema,
  insertKycInfoSchema,
  insertOrderSchema,
  insertTransactionSchema,
  users,
  kycInfo,
  type User,
  type KycInfo
} from "@shared/schema";

// JWT Secret (in production this would be in environment variables)
const JWT_SECRET = "crypto-trading-secret-key";

// Authentication middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Admin middleware
async function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(req.user.id);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}

// Extend the Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up API routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Error handler for Zod validation errors
  const handleZodError = (error: any, res: Response) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  };

  // Update cryptocurrency prices every 5 minutes
  const updateCryptoPrices = async () => {
    try {
      console.log("Updating cryptocurrency prices...");
      await cryptoService.fetchCryptoPrices();
    } catch (error) {
      console.error("Error updating cryptocurrency prices:", error);
    }
  };

  // Initialize crypto prices and set up interval for updates
  await updateCryptoPrices();
  setInterval(updateCryptoPrices, 5 * 60 * 1000); // Every 5 minutes

  // ===== Authentication Routes =====
  apiRouter.post("/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already in use" });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          kycLevel: user.kycLevel,
          role: user.role
        },
        token
      });
    } catch (error) {
      handleZodError(error, res);
    }
  });

  apiRouter.post("/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          kycLevel: user.kycLevel,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.get("/auth/me", authenticate, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          kycLevel: user.kycLevel,
          role: user.role
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== KYC Routes =====
  apiRouter.post("/kyc", authenticate, async (req, res) => {
    try {
      const kycData = insertKycInfoSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      // Check if KYC info already exists
      const existingKyc = await storage.getKycInfo(req.user!.id);
      if (existingKyc) {
        return res.status(409).json({ message: "KYC information already submitted" });
      }
      
      const kycInfo = await storage.createKycInfo(kycData);
      
      // Update user KYC level
      await storage.updateUser(req.user!.id, { kycLevel: 1 });
      
      res.status(201).json({
        message: "KYC information submitted successfully",
        kycInfo
      });
    } catch (error) {
      handleZodError(error, res);
    }
  });

  apiRouter.get("/kyc", authenticate, async (req, res) => {
    try {
      const kycInfo = await storage.getKycInfo(req.user!.id);
      if (!kycInfo) {
        return res.status(404).json({ message: "KYC information not found" });
      }
      
      res.json({ kycInfo });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin route to approve KYC
  apiRouter.put("/admin/kyc/:userId/approve", authenticate, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const kycInfo = await storage.getKycInfo(userId);
      if (!kycInfo) {
        return res.status(404).json({ message: "KYC information not found" });
      }
      
      const updatedKycInfo = await storage.updateKycInfo(userId, {
        verificationStatus: "verified"
      });
      
      // Update user KYC level
      await storage.updateUser(userId, { kycLevel: 2 });
      
      res.json({
        message: "KYC verification approved",
        kycInfo: updatedKycInfo
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Crypto Asset Routes =====
  apiRouter.get("/crypto/assets", async (req, res) => {
    try {
      const assets = await storage.getAllCryptoAssets();
      res.json({ assets });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.get("/crypto/assets/:symbol", async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const asset = await storage.getCryptoAssetBySymbol(symbol);
      
      if (!asset) {
        return res.status(404).json({ message: "Crypto asset not found" });
      }
      
      res.json({ asset });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.get("/crypto/history/:symbol", async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      
      const asset = await storage.getCryptoAssetBySymbol(symbol);
      if (!asset) {
        return res.status(404).json({ message: "Crypto asset not found" });
      }
      
      const coinId = cryptoService.symbolToCoinGeckoId(symbol);
      const priceHistory = await cryptoService.getHistoricalPrices(coinId, days);
      
      res.json({ 
        symbol,
        priceHistory
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Wallet Routes =====
  apiRouter.get("/wallets", authenticate, async (req, res) => {
    try {
      const wallets = await storage.getWalletsByUserId(req.user!.id);
      
      // Enrich wallets with asset info
      const enrichedWallets = await Promise.all(
        wallets.map(async (wallet) => {
          const asset = await storage.getCryptoAsset(wallet.assetId);
          return {
            ...wallet,
            asset
          };
        })
      );
      
      res.json({ wallets: enrichedWallets });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Transaction Routes =====
  apiRouter.get("/transactions", authenticate, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(req.user!.id);
      
      // Enrich transactions with asset info
      const enrichedTransactions = await Promise.all(
        transactions.map(async (tx) => {
          if (tx.assetId) {
            const asset = await storage.getCryptoAsset(tx.assetId);
            return {
              ...tx,
              asset
            };
          }
          return tx;
        })
      );
      
      res.json({ transactions: enrichedTransactions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.post("/transactions", authenticate, async (req, res) => {
    try {
      const txData = insertTransactionSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      // For buy/sell transactions, verify that the asset exists
      if (txData.type === "buy" || txData.type === "sell") {
        if (!txData.assetId) {
          return res.status(400).json({ message: "Asset ID is required for buy/sell transactions" });
        }
        
        const asset = await storage.getCryptoAsset(txData.assetId);
        if (!asset) {
          return res.status(404).json({ message: "Crypto asset not found" });
        }
      }
      
      // Process transaction - This is where you'd handle balance updates
      // For simplicity, we're just recording the transaction and updating wallets
      
      // Process based on transaction type
      if (txData.type === "buy") {
        // Find USD/USDT wallet
        const usdAsset = await storage.getCryptoAssetBySymbol("USDT");
        if (!usdAsset) {
          return res.status(500).json({ message: "USDT wallet not found" });
        }
        
        const usdWallet = await storage.getUserWalletForAsset(req.user!.id, usdAsset.id);
        if (!usdWallet) {
          return res.status(400).json({ message: "USD wallet not found" });
        }
        
        // Check if user has enough USD
        if (usdWallet.balance < txData.totalValue) {
          return res.status(400).json({ message: "Insufficient balance" });
        }
        
        // Update USD wallet
        await storage.updateWallet(usdWallet.id, {
          balance: usdWallet.balance - txData.totalValue
        });
        
        // Get or create target asset wallet
        let assetWallet = await storage.getUserWalletForAsset(req.user!.id, txData.assetId!);
        if (!assetWallet) {
          assetWallet = await storage.createWallet({
            userId: req.user!.id,
            assetId: txData.assetId!,
            balance: 0,
            address: `wallet-${req.user!.id}-${txData.assetId}`
          });
        }
        
        // Update asset wallet
        await storage.updateWallet(assetWallet.id, {
          balance: assetWallet.balance + txData.amount
        });
      } else if (txData.type === "sell") {
        // Get asset wallet
        const assetWallet = await storage.getUserWalletForAsset(req.user!.id, txData.assetId!);
        if (!assetWallet) {
          return res.status(400).json({ message: "Asset wallet not found" });
        }
        
        // Check if user has enough of the asset
        if (assetWallet.balance < txData.amount) {
          return res.status(400).json({ message: "Insufficient balance" });
        }
        
        // Update asset wallet
        await storage.updateWallet(assetWallet.id, {
          balance: assetWallet.balance - txData.amount
        });
        
        // Find USD/USDT wallet
        const usdAsset = await storage.getCryptoAssetBySymbol("USDT");
        if (!usdAsset) {
          return res.status(500).json({ message: "USDT wallet not found" });
        }
        
        const usdWallet = await storage.getUserWalletForAsset(req.user!.id, usdAsset.id);
        if (!usdWallet) {
          return res.status(400).json({ message: "USD wallet not found" });
        }
        
        // Update USD wallet
        await storage.updateWallet(usdWallet.id, {
          balance: usdWallet.balance + txData.totalValue
        });
      }
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        ...txData,
        status: "completed" // For simplicity, all transactions are immediately completed
      });
      
      res.status(201).json({
        message: "Transaction successful",
        transaction
      });
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // ===== Order Routes =====
  apiRouter.get("/orders", authenticate, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUserId(req.user!.id);
      
      // Enrich orders with asset info
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          const asset = await storage.getCryptoAsset(order.assetId);
          return {
            ...order,
            asset
          };
        })
      );
      
      res.json({ orders: enrichedOrders });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.post("/orders", authenticate, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      // Verify that the asset exists
      const asset = await storage.getCryptoAsset(orderData.assetId);
      if (!asset) {
        return res.status(404).json({ message: "Crypto asset not found" });
      }
      
      // For market orders, execute immediately
      if (orderData.orderType === "market") {
        // Create transaction for market order
        const transaction = await storage.createTransaction({
          userId: req.user!.id,
          type: orderData.type, // buy or sell
          assetId: orderData.assetId,
          amount: orderData.amount,
          price: asset.currentPrice,
          totalValue: orderData.amount * asset.currentPrice,
          fee: orderData.amount * asset.currentPrice * 0.0025, // 0.25% fee
          status: "completed"
        });
        
        // Create completed order
        const order = await storage.createOrder({
          ...orderData,
          price: asset.currentPrice,
          status: "completed"
        });
        
        // Process the transaction
        if (orderData.type === "buy") {
          // Find USD/USDT wallet
          const usdAsset = await storage.getCryptoAssetBySymbol("USDT");
          if (!usdAsset) {
            return res.status(500).json({ message: "USDT wallet not found" });
          }
          
          const usdWallet = await storage.getUserWalletForAsset(req.user!.id, usdAsset.id);
          if (!usdWallet) {
            return res.status(400).json({ message: "USD wallet not found" });
          }
          
          // Check if user has enough USD
          const totalCost = transaction.totalValue + (transaction.fee || 0);
          if (usdWallet.balance < totalCost) {
            return res.status(400).json({ message: "Insufficient balance" });
          }
          
          // Update USD wallet
          await storage.updateWallet(usdWallet.id, {
            balance: usdWallet.balance - totalCost
          });
          
          // Get or create target asset wallet
          let assetWallet = await storage.getUserWalletForAsset(req.user!.id, orderData.assetId);
          if (!assetWallet) {
            assetWallet = await storage.createWallet({
              userId: req.user!.id,
              assetId: orderData.assetId,
              balance: 0,
              address: `wallet-${req.user!.id}-${orderData.assetId}`
            });
          }
          
          // Update asset wallet
          await storage.updateWallet(assetWallet.id, {
            balance: assetWallet.balance + orderData.amount
          });
        } else if (orderData.type === "sell") {
          // Get asset wallet
          const assetWallet = await storage.getUserWalletForAsset(req.user!.id, orderData.assetId);
          if (!assetWallet) {
            return res.status(400).json({ message: "Asset wallet not found" });
          }
          
          // Check if user has enough of the asset
          if (assetWallet.balance < orderData.amount) {
            return res.status(400).json({ message: "Insufficient balance" });
          }
          
          // Update asset wallet
          await storage.updateWallet(assetWallet.id, {
            balance: assetWallet.balance - orderData.amount
          });
          
          // Find USD/USDT wallet
          const usdAsset = await storage.getCryptoAssetBySymbol("USDT");
          if (!usdAsset) {
            return res.status(500).json({ message: "USDT wallet not found" });
          }
          
          const usdWallet = await storage.getUserWalletForAsset(req.user!.id, usdAsset.id);
          if (!usdWallet) {
            return res.status(400).json({ message: "USD wallet not found" });
          }
          
          // Update USD wallet (minus fee)
          const amountAfterFee = transaction.totalValue - (transaction.fee || 0);
          await storage.updateWallet(usdWallet.id, {
            balance: usdWallet.balance + amountAfterFee
          });
        }
        
        res.status(201).json({
          message: "Market order executed successfully",
          order,
          transaction
        });
      } else {
        // For limit orders, just create pending order
        const order = await storage.createOrder({
          ...orderData,
          status: "pending"
        });
        
        res.status(201).json({
          message: "Limit order created successfully",
          order
        });
      }
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // ===== Admin Routes =====
  apiRouter.get("/admin/users", authenticate, isAdmin, async (req, res) => {
    try {
      // Query all users from the database
      const { db } = await import("./db");
      const allUsers = await db.select().from(users);
      
      // Filter sensitive information
      const filteredUsers = allUsers.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        kycLevel: user.kycLevel,
        role: user.role,
        createdAt: user.createdAt
      }));
      
      res.json({ users: filteredUsers });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  apiRouter.get("/admin/kyc-requests", authenticate, isAdmin, async (req, res) => {
    try {
      // Query pending KYC requests
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const kycRequests = await db.select().from(kycInfo)
        .where(eq(kycInfo.verificationStatus, "pending"));
      
      // Enrich with user info
      const enrichedRequests = await Promise.all(
        kycRequests.map(async (kyc) => {
          const user = await storage.getUser(kyc.userId);
          return {
            ...kyc,
            user: user ? {
              id: user.id,
              username: user.username,
              email: user.email,
              fullName: user.fullName
            } : undefined
          };
        })
      );
      
      res.json({ kycRequests: enrichedRequests });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
