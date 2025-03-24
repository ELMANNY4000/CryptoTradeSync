import axios from "axios";
import { apiRequest } from "./queryClient";

// Define types for crypto API responses
export interface CryptoAsset {
  id: number;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChangePercent: number;
  marketCap: number;
  icon: string;
  lastUpdated: string;
}

export interface WalletWithAsset {
  id: number;
  userId: number;
  assetId: number;
  balance: number;
  address: string;
  asset: CryptoAsset;
}

export interface Transaction {
  id: number;
  userId: number;
  type: string;
  assetId: number | null;
  amount: number;
  price: number | null;
  totalValue: number;
  fee: number | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  asset?: CryptoAsset;
}

export interface Order {
  id: number;
  userId: number;
  assetId: number;
  type: string;
  orderType: string;
  amount: number;
  price: number | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  asset?: CryptoAsset;
}

export interface PriceHistory {
  symbol: string;
  priceHistory: [number, number][]; // [timestamp, price]
}

// API functions
export const cryptoApi = {
  // Assets
  getAssets: async (): Promise<CryptoAsset[]> => {
    const response = await axios.get("/api/crypto/assets");
    return response.data.assets;
  },

  getAssetBySymbol: async (symbol: string): Promise<CryptoAsset> => {
    const response = await axios.get(`/api/crypto/assets/${symbol}`);
    return response.data.asset;
  },

  getPriceHistory: async (symbol: string, days: number = 30): Promise<PriceHistory> => {
    const response = await axios.get(`/api/crypto/history/${symbol}?days=${days}`);
    return response.data;
  },

  // Wallets
  getWallets: async (): Promise<WalletWithAsset[]> => {
    const response = await apiRequest("GET", "/api/wallets");
    const data = await response.json();
    return data.wallets;
  },

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    const response = await apiRequest("GET", "/api/transactions");
    const data = await response.json();
    return data.transactions;
  },

  createTransaction: async (transaction: {
    type: string;
    assetId?: number;
    amount: number;
    price?: number;
    totalValue: number;
    fee?: number;
  }): Promise<Transaction> => {
    const response = await apiRequest("POST", "/api/transactions", transaction);
    const data = await response.json();
    return data.transaction;
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    const response = await apiRequest("GET", "/api/orders");
    const data = await response.json();
    return data.orders;
  },

  placeOrder: async (order: {
    assetId: number;
    type: string;
    orderType: string;
    amount: number;
    price?: number;
  }): Promise<{order: Order, transaction?: Transaction}> => {
    const response = await apiRequest("POST", "/api/orders", order);
    const data = await response.json();
    return data;
  },
};
