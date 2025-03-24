import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { cryptoApi } from "@/lib/crypto-api";
import { AssetTable } from "@/components/markets/asset-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function Markets() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: assets, isLoading, isError } = useQuery({
    queryKey: ['/api/crypto/assets'],
    queryFn: cryptoApi.getAssets
  });
  
  // Mock watchlist for demonstration
  const watchlistSymbols = ["BTC", "ETH", "SOL"];
  
  const watchlistAssets = assets?.filter(
    asset => watchlistSymbols.includes(asset.symbol)
  );
  
  const handleAssetClick = (symbol: string) => {
    navigate(`/trade?symbol=${symbol}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Crypto Markets</h1>
        <p className="text-muted-foreground">
          View real-time prices and market information for leading cryptocurrencies.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
          <CardDescription>
            Cryptocurrency market data updated in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Cryptocurrencies</TabsTrigger>
              <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
              <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
              <TabsTrigger value="losers">Top Losers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : isError ? (
                <div className="text-center py-8 text-muted-foreground">
                  Error loading market data. Please try again later.
                </div>
              ) : (
                <AssetTable assets={assets} onAssetClick={handleAssetClick} />
              )}
            </TabsContent>
            
            <TabsContent value="watchlist" className="mt-0">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : watchlistAssets?.length ? (
                <AssetTable assets={watchlistAssets} onAssetClick={handleAssetClick} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Your watchlist is empty. Add assets from the market view.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="gainers" className="mt-0">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <AssetTable 
                  assets={assets?.filter(a => a.priceChangePercent > 0)
                    .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
                    .slice(0, 5)} 
                  onAssetClick={handleAssetClick} 
                />
              )}
            </TabsContent>
            
            <TabsContent value="losers" className="mt-0">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <AssetTable 
                  assets={assets?.filter(a => a.priceChangePercent < 0)
                    .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
                    .slice(0, 5)} 
                  onAssetClick={handleAssetClick} 
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Market Cap</span>
                <span className="font-medium">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24 inline-block" />
                  ) : (
                    `$${(assets?.reduce((sum, asset) => sum + asset.marketCap, 0) || 0).toLocaleString(undefined, {
                      maximumFractionDigits: 0
                    })}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h Trading Volume</span>
                <span className="font-medium">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24 inline-block" />
                  ) : (
                    `$${(assets?.reduce((sum, asset) => sum + asset.marketCap * 0.05, 0) || 0).toLocaleString(undefined, {
                      maximumFractionDigits: 0
                    })}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">BTC Dominance</span>
                <span className="font-medium">
                  {isLoading ? (
                    <Skeleton className="h-4 w-16 inline-block" />
                  ) : (
                    `${(
                      (assets?.find(a => a.symbol === "BTC")?.marketCap || 0) / 
                      (assets?.reduce((sum, asset) => sum + asset.marketCap, 0) || 1) * 100
                    ).toFixed(1)}%`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Cryptocurrencies</span>
                <span className="font-medium">
                  {isLoading ? <Skeleton className="h-4 w-12 inline-block" /> : assets?.length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Market Movers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Biggest Gainers (24h)</h3>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assets?.filter(a => a.priceChangePercent > 0)
                      .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
                      .slice(0, 3)
                      .map(asset => (
                        <div key={asset.id} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="font-medium">{asset.symbol}</span>
                            <span className="text-muted-foreground ml-2">{asset.name}</span>
                          </div>
                          <span className="text-green-500">+{asset.priceChangePercent.toFixed(2)}%</span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Biggest Losers (24h)</h3>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assets?.filter(a => a.priceChangePercent < 0)
                      .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
                      .slice(0, 3)
                      .map(asset => (
                        <div key={asset.id} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="font-medium">{asset.symbol}</span>
                            <span className="text-muted-foreground ml-2">{asset.name}</span>
                          </div>
                          <span className="text-red-500">{asset.priceChangePercent.toFixed(2)}%</span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
