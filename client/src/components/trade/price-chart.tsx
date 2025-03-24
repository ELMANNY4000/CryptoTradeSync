import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { cryptoApi, CryptoAsset } from "@/lib/crypto-api";
import { Settings, Maximize2 } from "lucide-react";

// @ts-ignore - TradingView library
declare const TradingView: any;

interface PriceChartProps {
  symbol: string;
}

export function PriceChart({ symbol }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState("1D");
  
  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: [`/api/crypto/assets/${symbol}`],
    queryFn: () => cryptoApi.getAssetBySymbol(symbol),
    enabled: !!symbol
  });

  // Initialize TradingView widget
  useEffect(() => {
    if (!symbol || !chartContainerRef.current) return;

    let tvSymbol = symbol.toUpperCase();
    // Map our symbols to TradingView symbols
    if (tvSymbol === "BTC") tvSymbol = "BTCUSD";
    else if (tvSymbol === "ETH") tvSymbol = "ETHUSD";
    else tvSymbol = `${tvSymbol}USD`;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof TradingView !== 'undefined' && chartContainerRef.current) {
        new TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: timeframeToInterval(timeframe),
          timezone: "Etc/UTC",
          theme: document.body.getAttribute('data-theme') === 'dark' ? "dark" : "light",
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: chartContainerRef.current.id,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, timeframe]);

  const timeframeToInterval = (tf: string) => {
    switch (tf) {
      case "1H": return "60";
      case "4H": return "240";
      case "1D": return "D";
      case "1W": return "W";
      case "1M": return "M";
      default: return "D";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border px-4 py-3 flex flex-row justify-between items-center">
        {assetLoading ? (
          <div className="flex items-center">
            <Skeleton className="w-8 h-8 rounded-full mr-3" />
            <div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32 mt-1" />
            </div>
          </div>
        ) : asset ? (
          <div className="flex items-center">
            <CurrencyIcon symbol={asset.symbol} className="mr-3" />
            <div>
              <h2 className="font-semibold">{asset.name} ({asset.symbol}/USD)</h2>
              <div className="flex items-center text-sm">
                <span className="font-mono font-medium">
                  ${asset.currentPrice.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: asset.currentPrice < 1 ? 4 : 2 
                  })}
                </span>
                <span className={`ml-2 ${asset.priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {asset.priceChangePercent >= 0 ? '+' : ''}{asset.priceChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div>Select a crypto asset</div>
        )}
        
        <div className="flex items-center space-x-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1H">1H</SelectItem>
              <SelectItem value="4H">4H</SelectItem>
              <SelectItem value="1D">1D</SelectItem>
              <SelectItem value="1W">1W</SelectItem>
              <SelectItem value="1M">1M</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <div id="tradingview_chart" ref={chartContainerRef} className="h-[400px] w-full">
        {!symbol && (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a cryptocurrency to view chart
          </div>
        )}
      </div>
      
      <CardContent className="border-t border-border py-4">
        <div className="flex flex-wrap gap-4">
          {!assetLoading && asset && (
            <>
              <div>
                <div className="text-xs text-muted-foreground">24h High</div>
                <div className="font-mono font-medium">
                  ${(asset.currentPrice * (1 + asset.priceChangePercent / 100 * 1.5)).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">24h Low</div>
                <div className="font-mono font-medium">
                  ${(asset.currentPrice * (1 - asset.priceChangePercent / 100 * 1.5)).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">24h Volume</div>
                <div className="font-mono font-medium">
                  ${(asset.marketCap * 0.05).toLocaleString(undefined, { 
                    maximumFractionDigits: 1 
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
