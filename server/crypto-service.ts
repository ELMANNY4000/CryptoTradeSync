import axios from "axios";
import { storage } from "./storage";

// Interface for CoinGecko API response
interface CoinGeckoResponse {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
}

export class CryptoService {
  private baseUrl = "https://api.coingecko.com/api/v3";
  
  // Fetch cryptocurrency prices from CoinGecko API
  async fetchCryptoPrices() {
    try {
      const response = await axios.get(`${this.baseUrl}/coins/markets`, {
        params: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: 100,
          page: 1,
          sparkline: false,
          price_change_percentage: "24h"
        }
      });
      
      const data: CoinGeckoResponse[] = response.data;
      
      // Update crypto assets in storage
      for (const coin of data) {
        const existingAsset = await storage.getCryptoAssetBySymbol(coin.symbol.toUpperCase());
        
        if (existingAsset) {
          // Update existing asset
          await storage.updateCryptoAsset(existingAsset.id, {
            currentPrice: coin.current_price,
            priceChangePercent: coin.price_change_percentage_24h,
            marketCap: coin.market_cap,
            icon: existingAsset.icon, // Keep the same icon
          });
        } else {
          // Add new asset if it doesn't exist
          await storage.createCryptoAsset({
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            currentPrice: coin.current_price,
            priceChangePercent: coin.price_change_percentage_24h,
            marketCap: coin.market_cap,
            icon: coin.symbol.substring(0, 1).toUpperCase(), // Simple icon from first letter
          });
        }
      }
      
      return await storage.getAllCryptoAssets();
    } catch (error) {
      console.error("Failed to fetch crypto prices:", error);
      // Return existing assets from storage as fallback
      return await storage.getAllCryptoAssets();
    }
  }
  
  // Get historical price data for a specific coin
  async getHistoricalPrices(coinId: string, days: number = 30) {
    try {
      const response = await axios.get(`${this.baseUrl}/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: "usd",
          days: days,
        }
      });
      
      return response.data.prices;
    } catch (error) {
      console.error(`Failed to fetch historical prices for ${coinId}:`, error);
      return [];
    }
  }
  
  // Convert from CoinGecko ID format to our symbol format
  coinGeckoIdToSymbol(coinId: string): string {
    // Map of common CoinGecko IDs to symbols
    const idToSymbol: Record<string, string> = {
      "bitcoin": "BTC",
      "ethereum": "ETH",
      "solana": "SOL",
      "ripple": "XRP",
      "tether": "USDT",
      "cardano": "ADA",
      "polkadot": "DOT",
      "binancecoin": "BNB",
      "dogecoin": "DOGE",
      "avalanche-2": "AVAX"
    };
    
    return idToSymbol[coinId] || coinId.toUpperCase();
  }
  
  // Convert from our symbol format to CoinGecko ID format
  symbolToCoinGeckoId(symbol: string): string {
    // Map of symbols to CoinGecko IDs
    const symbolToId: Record<string, string> = {
      "BTC": "bitcoin",
      "ETH": "ethereum",
      "SOL": "solana",
      "XRP": "ripple",
      "USDT": "tether",
      "ADA": "cardano",
      "DOT": "polkadot",
      "BNB": "binancecoin",
      "DOGE": "dogecoin",
      "AVAX": "avalanche-2"
    };
    
    return symbolToId[symbol.toUpperCase()] || symbol.toLowerCase();
  }
}

export const cryptoService = new CryptoService();
