import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { cryptoApi, WalletWithAsset } from "@/lib/crypto-api";
import { useAuth } from "@/contexts/auth-context";
import { Plus } from "lucide-react";

export function WalletBalance() {
  const { user } = useAuth();

  const { data: wallets, isLoading } = useQuery({
    queryKey: ["/api/wallets"],
    enabled: !!user
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Wallet Balances</h2>
        <Button variant="outline" className="text-primary bg-primary/10 hover:bg-primary/20">
          <Plus className="h-4 w-4 mr-1" />
          Deposit Funds
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center mb-3">
                  <Skeleton className="w-8 h-8 rounded-full mr-3" />
                  <div>
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-3 w-10 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-6 w-28 mb-1" />
                <Skeleton className="h-4 w-24 mb-3" />
                <div className="flex space-x-2">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : wallets?.length ? (
          wallets.map((wallet: WalletWithAsset) => (
            <Card key={wallet.id}>
              <CardContent className="pt-6">
                <div className="flex items-center mb-3">
                  <CurrencyIcon symbol={wallet.asset.symbol} className="mr-3" />
                  <div>
                    <div className="font-medium">{wallet.asset.name}</div>
                    <div className="text-xs text-muted-foreground">{wallet.asset.symbol}</div>
                  </div>
                </div>
                <div className="font-mono font-semibold text-lg mb-1">
                  {wallet.balance.toLocaleString(undefined, { 
                    maximumFractionDigits: 8 
                  })} {wallet.asset.symbol}
                </div>
                <div className="text-sm text-muted-foreground font-mono mb-3">
                  ≈ ${(wallet.balance * wallet.asset.currentPrice).toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
                <div className="flex space-x-2">
                  <Button className="flex-1" size="sm">Send</Button>
                  <Button className="flex-1" variant="outline" size="sm">Receive</Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-6 text-center text-muted-foreground">
            No wallet balances found
          </div>
        )}
      </div>
    </div>
  );
}
