import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { cryptoApi, WalletWithAsset } from "@/lib/crypto-api";
import { useAuth } from "@/contexts/auth-context";

export function AccountSummary() {
  const { user } = useAuth();
  
  const { data: wallets, isLoading } = useQuery({
    queryKey: ["/api/wallets"],
    enabled: !!user
  });

  // Calculate total balance in USD
  const totalBalance = wallets?.reduce((total, wallet: WalletWithAsset) => {
    return total + wallet.balance * wallet.asset.currentPrice;
  }, 0) || 0;

  // Calculate 24h change percentage (mocked for this example)
  // In a real app, this would be calculated from historical data
  const changePercentage = 2.4;
  const isPositiveChange = changePercentage >= 0;

  // Calculate 24h trading volume (mocked for this example)
  const tradingVolume = 5234.50;
  const volumeChangePercentage = -0.8;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm text-muted-foreground mb-2">Total Balance</h3>
          <div className="flex items-baseline">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <span className="text-2xl font-semibold font-mono">
                  ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`ml-2 text-sm ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositiveChange ? '+' : ''}{changePercentage}%
                </span>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Updated just now</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm text-muted-foreground mb-2">24h Trading Volume</h3>
          <div className="flex items-baseline">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <span className="text-2xl font-semibold font-mono">
                  ${tradingVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`ml-2 text-sm ${volumeChangePercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {volumeChangePercentage >= 0 ? '+' : ''}{volumeChangePercentage}%
                </span>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Updated just now</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm text-muted-foreground mb-2">Account Status</h3>
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  user?.kycLevel === 0 
                    ? 'bg-yellow-200 text-yellow-800' 
                    : user?.kycLevel === 1 
                      ? 'bg-orange-200 text-orange-800' 
                      : 'bg-green-200 text-green-800'
                }`}>
                  Tier {user?.kycLevel || 0}
                </span>
                <span className="text-sm">
                  {user?.kycLevel === 0 
                    ? 'Not Verified' 
                    : user?.kycLevel === 1 
                      ? 'Basic Verification' 
                      : 'Fully Verified'}
                </span>
              </>
            )}
          </div>
          {user?.kycLevel !== 2 && (
            <Button asChild variant="link" className="mt-2 p-0 h-auto text-primary text-sm font-medium">
              <Link href="/kyc">Complete KYC ›</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
