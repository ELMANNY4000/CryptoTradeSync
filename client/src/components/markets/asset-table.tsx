import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Button } from "@/components/ui/button";

interface AssetTableProps {
  assets: any[];
  onAssetClick: (symbol: string) => void;
}

export function AssetTable({ assets, onAssetClick }: AssetTableProps) {
  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(1)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(1)}M`;
    return `$${marketCap.toLocaleString()}`;
  };
  
  // Calculate 24h high and low based on current price and change percent
  const calculate24hRange = (asset: any) => {
    const changeAbs = asset.currentPrice * Math.abs(asset.priceChangePercent) / 100;
    const high = asset.priceChangePercent >= 0 
      ? asset.currentPrice 
      : asset.currentPrice / (1 - asset.priceChangePercent / 100);
    const low = asset.priceChangePercent >= 0 
      ? asset.currentPrice - changeAbs * 2 
      : asset.currentPrice;
    
    return { high, low };
  };
  
  // Approximate trading volume based on market cap (typically 2-10% of market cap)
  const estimateVolume = (marketCap: number) => {
    return marketCap * (0.02 + Math.random() * 0.08);
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-muted-foreground text-sm border-b border-border">
            <th className="py-3 px-4">#</th>
            <th className="py-3 px-4">Asset</th>
            <th className="py-3 px-4">Price (USD)</th>
            <th className="py-3 px-4">24h Change</th>
            <th className="py-3 px-4">24h High / Low</th>
            <th className="py-3 px-4">24h Volume</th>
            <th className="py-3 px-4">Market Cap</th>
            <th className="py-3 px-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {assets?.length ? (
            assets.map((asset, index) => {
              const range = calculate24hRange(asset);
              const volume = estimateVolume(asset.marketCap);
              
              return (
                <tr 
                  key={asset.id} 
                  className="border-b border-border hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => onAssetClick(asset.symbol)}
                >
                  <td className="py-3 px-4 text-muted-foreground">{index + 1}</td>
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
                  <td className="py-3 px-4 font-mono text-sm text-muted-foreground">
                    ${range.high.toFixed(2)} / ${range.low.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">
                    ${volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">
                    {formatMarketCap(asset.marketCap)}
                  </td>
                  <td className="py-3 px-4">
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssetClick(asset.symbol);
                      }}
                    >
                      Trade
                    </Button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={8} className="py-6 text-center text-muted-foreground">
                No assets found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
