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
  userSettings,
  type User,
  type KycInfo,
  type UserSettings
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

  // Update user profile
  apiRouter.patch("/auth/profile", authenticate, async (req, res) => {
    try {
      const { fullName, email, username } = req.body;
      
      if (email) {
        // Check if email is already taken by another user
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== req.user!.id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      if (username) {
        // Check if username is already taken by another user
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== req.user!.id) {
          return res.status(400).json({ message: "Username already in use" });
        }
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(req.user!.id, {
        fullName,
        email,
        username
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          kycLevel: updatedUser.kycLevel,
          role: updatedUser.role
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

  // ===== DEX Routes =====
  // Get all liquidity pools
  apiRouter.get("/dex/pools", async (req, res) => {
    try {
      const pools = await storage.getAllLiquidityPools();
      
      // Enrich with token information
      const enrichedPools = await Promise.all(pools.map(async (pool) => {
        const token0 = await storage.getCryptoAsset(pool.token0Id);
        const token1 = await storage.getCryptoAsset(pool.token1Id);
        
        return {
          ...pool,
          token0: token0 || undefined,
          token1: token1 || undefined
        };
      }));
      
      res.json({ pools: enrichedPools });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get specific liquidity pool
  apiRouter.get("/dex/pools/:id", async (req, res) => {
    try {
      const poolId = parseInt(req.params.id);
      if (isNaN(poolId)) {
        return res.status(400).json({ message: "Invalid pool ID" });
      }
      
      const pool = await storage.getLiquidityPool(poolId);
      if (!pool) {
        return res.status(404).json({ message: "Liquidity pool not found" });
      }
      
      const token0 = await storage.getCryptoAsset(pool.token0Id);
      const token1 = await storage.getCryptoAsset(pool.token1Id);
      
      res.json({
        pool: {
          ...pool,
          token0: token0 || undefined,
          token1: token1 || undefined
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create a new liquidity pool
  apiRouter.post("/dex/pools", authenticate, async (req, res) => {
    try {
      const { token0Id, token1Id, initialLiquidity0, initialLiquidity1 } = req.body;
      
      if (!token0Id || !token1Id || !initialLiquidity0 || !initialLiquidity1) {
        return res.status(400).json({ 
          message: "Missing required fields: token0Id, token1Id, initialLiquidity0, initialLiquidity1" 
        });
      }
      
      // Check if assets exist
      const token0 = await storage.getCryptoAsset(token0Id);
      const token1 = await storage.getCryptoAsset(token1Id);
      
      if (!token0 || !token1) {
        return res.status(404).json({ message: "One or both token assets not found" });
      }
      
      // Check if pool already exists
      const existingPool = await storage.getLiquidityPoolByTokens(token0Id, token1Id);
      if (existingPool) {
        return res.status(409).json({ message: "Liquidity pool already exists for these tokens" });
      }
      
      // Check if user has enough tokens
      const token0Wallet = await storage.getUserWalletForAsset(req.user!.id, token0Id);
      const token1Wallet = await storage.getUserWalletForAsset(req.user!.id, token1Id);
      
      if (!token0Wallet || token0Wallet.balance < initialLiquidity0) {
        return res.status(400).json({ message: `Insufficient ${token0.symbol} balance` });
      }
      
      if (!token1Wallet || token1Wallet.balance < initialLiquidity1) {
        return res.status(400).json({ message: `Insufficient ${token1.symbol} balance` });
      }
      
      // Create the pool
      const pool = await storage.createLiquidityPool({
        token0Id,
        token1Id,
        token0Reserve: initialLiquidity0,
        token1Reserve: initialLiquidity1,
        fee: 0.003 // 0.3% fee
      });
      
      // Create a liquidity position for the user
      const sqrtLiquidity = Math.sqrt(initialLiquidity0 * initialLiquidity1);
      const position = await storage.createLiquidityPosition({
        userId: req.user!.id,
        poolId: pool.id,
        liquidity: sqrtLiquidity
      });
      
      // Update user wallets
      await storage.updateWallet(token0Wallet.id, {
        balance: token0Wallet.balance - initialLiquidity0
      });
      
      await storage.updateWallet(token1Wallet.id, {
        balance: token1Wallet.balance - initialLiquidity1
      });
      
      res.status(201).json({
        message: "Liquidity pool created successfully",
        pool,
        position
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Add liquidity to a pool
  apiRouter.post("/dex/pools/:id/liquidity", authenticate, async (req, res) => {
    try {
      const poolId = parseInt(req.params.id);
      if (isNaN(poolId)) {
        return res.status(400).json({ message: "Invalid pool ID" });
      }
      
      const { amount0, amount1 } = req.body;
      
      if (!amount0 || !amount1) {
        return res.status(400).json({ message: "Missing required fields: amount0, amount1" });
      }
      
      // Get the pool
      const pool = await storage.getLiquidityPool(poolId);
      if (!pool) {
        return res.status(404).json({ message: "Liquidity pool not found" });
      }
      
      // Check if the ratio is correct
      const currentRatio = pool.token0Reserve / pool.token1Reserve;
      const providedRatio = amount0 / amount1;
      
      // Allow 1% slippage
      const slippage = 0.01;
      if (Math.abs(currentRatio - providedRatio) / currentRatio > slippage) {
        return res.status(400).json({ 
          message: "Liquidity ratio does not match the pool ratio",
          expectedRatio: currentRatio,
          providedRatio 
        });
      }
      
      // Check if user has enough tokens
      const token0Wallet = await storage.getUserWalletForAsset(req.user!.id, pool.token0Id);
      const token1Wallet = await storage.getUserWalletForAsset(req.user!.id, pool.token1Id);
      
      if (!token0Wallet || token0Wallet.balance < amount0) {
        return res.status(400).json({ message: "Insufficient token0 balance" });
      }
      
      if (!token1Wallet || token1Wallet.balance < amount1) {
        return res.status(400).json({ message: "Insufficient token1 balance" });
      }
      
      // Get user's existing position or create a new one
      let position = await storage.getUserLiquidityPositionForPool(req.user!.id, poolId);
      
      const newLiquidity = Math.sqrt(amount0 * amount1);
      
      if (position) {
        position = await storage.updateLiquidityPosition(position.id, {
          liquidity: position.liquidity + newLiquidity
        });
      } else {
        position = await storage.createLiquidityPosition({
          userId: req.user!.id,
          poolId: pool.id,
          liquidity: newLiquidity
        });
      }
      
      // Update pool reserves
      const updatedPool = await storage.updateLiquidityPool(poolId, {
        token0Reserve: pool.token0Reserve + amount0,
        token1Reserve: pool.token1Reserve + amount1,
        totalLiquidity: pool.totalLiquidity + newLiquidity
      });
      
      // Update user wallets
      await storage.updateWallet(token0Wallet.id, {
        balance: token0Wallet.balance - amount0
      });
      
      await storage.updateWallet(token1Wallet.id, {
        balance: token1Wallet.balance - amount1
      });
      
      res.status(200).json({
        message: "Liquidity added successfully",
        pool: updatedPool,
        position
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Perform a swap
  apiRouter.post("/dex/swap", authenticate, async (req, res) => {
    try {
      const { poolId, tokenInId, tokenOutId, amountIn } = req.body;
      
      if (!poolId || !tokenInId || !tokenOutId || !amountIn) {
        return res.status(400).json({ 
          message: "Missing required fields: poolId, tokenInId, tokenOutId, amountIn" 
        });
      }
      
      // Get the pool
      const pool = await storage.getLiquidityPool(poolId);
      if (!pool) {
        return res.status(404).json({ message: "Liquidity pool not found" });
      }
      
      // Validate tokens are in the pool
      if (!((pool.token0Id === tokenInId && pool.token1Id === tokenOutId) || 
            (pool.token0Id === tokenOutId && pool.token1Id === tokenInId))) {
        return res.status(400).json({ message: "Token pair does not match pool" });
      }
      
      // Check if user has enough tokens
      const tokenInWallet = await storage.getUserWalletForAsset(req.user!.id, tokenInId);
      
      if (!tokenInWallet || tokenInWallet.balance < amountIn) {
        return res.status(400).json({ message: "Insufficient balance for swap" });
      }
      
      // Calculate amounts (using constant product formula: x * y = k)
      let tokenInReserve, tokenOutReserve;
      
      if (tokenInId === pool.token0Id) {
        tokenInReserve = pool.token0Reserve;
        tokenOutReserve = pool.token1Reserve;
      } else {
        tokenInReserve = pool.token1Reserve;
        tokenOutReserve = pool.token0Reserve;
      }
      
      // Calculate amount out (with 0.3% fee)
      const fee = pool.fee;
      const amountInWithFee = amountIn * (1 - fee);
      const constantProduct = tokenInReserve * tokenOutReserve;
      const newTokenInReserve = tokenInReserve + amountInWithFee;
      const newTokenOutReserve = constantProduct / newTokenInReserve;
      const amountOut = tokenOutReserve - newTokenOutReserve;
      
      // Calculate price impact
      const priceImpact = 1 - ((tokenInReserve / tokenOutReserve) * (newTokenOutReserve / newTokenInReserve));
      
      // Check for minimum amount out (to prevent sandwich attacks)
      if (amountOut <= 0) {
        return res.status(400).json({ message: "Swap would result in zero output" });
      }
      
      // Update pool reserves
      let updatedPool;
      if (tokenInId === pool.token0Id) {
        updatedPool = await storage.updateLiquidityPool(poolId, {
          token0Reserve: pool.token0Reserve + amountIn,
          token1Reserve: pool.token1Reserve - amountOut
        });
      } else {
        updatedPool = await storage.updateLiquidityPool(poolId, {
          token0Reserve: pool.token0Reserve - amountOut,
          token1Reserve: pool.token1Reserve + amountIn
        });
      }
      
      // Create swap record
      const swap = await storage.createSwap({
        userId: req.user!.id,
        poolId,
        tokenInId,
        tokenOutId,
        amountIn,
        amountOut,
        fee: amountIn * fee,
        priceImpact,
        txHash: `tx-${Date.now()}-${Math.floor(Math.random() * 1000000)}`
      });
      
      // Update user wallets
      await storage.updateWallet(tokenInWallet.id, {
        balance: tokenInWallet.balance - amountIn
      });
      
      // Get or create output token wallet
      let tokenOutWallet = await storage.getUserWalletForAsset(req.user!.id, tokenOutId);
      
      if (!tokenOutWallet) {
        tokenOutWallet = await storage.createWallet({
          userId: req.user!.id,
          assetId: tokenOutId,
          balance: 0,
          address: `wallet-${req.user!.id}-${tokenOutId}`
        });
      }
      
      await storage.updateWallet(tokenOutWallet.id, {
        balance: tokenOutWallet.balance + amountOut
      });
      
      res.status(200).json({
        message: "Swap executed successfully",
        swap,
        amountOut,
        priceImpact,
        pool: updatedPool
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
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
        // Check if we have current price data
        if (asset.currentPrice === null) {
          return res.status(400).json({ message: "Current price data unavailable for this asset" });
        }
        
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
      // Get all users using storage interface for consistency
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
      const pendingKycRequests = await db.select().from(kycInfo)
        .where(eq(kycInfo.verificationStatus, "pending"));
      
      // Enrich with user info
      const enrichedRequests = await Promise.all(
        pendingKycRequests.map(async (kycRecord: KycInfo) => {
          const user = await storage.getUser(kycRecord.userId);
          return {
            ...kycRecord,
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
