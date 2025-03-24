import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { cryptoApi, CryptoAsset } from "@/lib/crypto-api";

export function MarketOverview() {
  const [view, setView] = useState<"watchlist" | "all">("all");

  const { data: cryptoAssets, isLoading } = useQuery({
    queryKey: ['/api/crypto/assets'],
    queryFn: cryptoApi.getAssets
  });

  // Mock watchlist (in a real app, this would be from user's saved assets)
  const watchlistSymbols = ["BTC", "ETH", "SOL"];
  const filteredAssets = view === "watchlist" 
    ? cryptoAssets?.filter(asset => watchlistSymbols.includes(asset.symbol))
    : cryptoAssets;

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(1)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(1)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  const handleTradeClick = (asset: CryptoAsset) => {
    // Navigate to trade page with selected asset
    window.location.href = `/trade?symbol=${asset.symbol}`;
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Market Overview</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant={view === "watchlist" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("watchlist")}
          >
            Watchlist
          </Button>
          <Button
            variant={view === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("all")}
          >
            All Markets
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-muted-foreground text-sm">
                <th className="py-2 px-4">Asset</th>
                <th className="py-2 px-4">Price</th>
                <th className="py-2 px-4">24h Change</th>
                <th className="py-2 px-4">Market Cap</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeletons
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Skeleton className="w-8 h-8 rounded-full mr-3" />
                        <div>
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-3 w-10 mt-1" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-8 w-16" /></td>
                  </tr>
                ))
              ) : filteredAssets?.length ? (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="border-t border-border hover:bg-muted cursor-pointer">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <CurrencyIcon symbol={asset.symbol} className="mr-3" />
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-xs text-muted-foreground">{asset.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      ${asset.currentPrice.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: asset.currentPrice < 1 ? 4 : 2 
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={asset.priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {asset.priceChangePercent >= 0 ? '+' : ''}{asset.priceChangePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {formatMarketCap(asset.marketCap)}
                    </td>
                    <td className="py-3 px-4">
                      <Button 
                        size="sm"
                        onClick={() => handleTradeClick(asset)}
                      >
                        Trade
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    {view === "watchlist" ? "No assets in watchlist" : "No assets found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
