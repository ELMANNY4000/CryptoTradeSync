import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AccountSummary } from "@/components/dashboard/account-summary";
import { MarketOverview } from "@/components/dashboard/market-overview";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { WalletBalance } from "@/components/dashboard/wallet-balance";
import { useAuth } from "@/contexts/auth-context";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch user data and wallets when component mounts
  useEffect(() => {
    // Prefetch wallets and transactions data for dashboard
    queryClient.prefetchQuery({ queryKey: ["/api/wallets"] });
    queryClient.prefetchQuery({ queryKey: ["/api/transactions"] });
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      
      {/* Account Summary */}
      <AccountSummary />
      
      {/* Market Overview */}
      <MarketOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main content column - to be filled with trading view component */}
        <div className="col-span-1 lg:col-span-2">
          <iframe 
            src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_54321&symbol=BITSTAMP%3ABTCUSD&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=light&style=1&timezone=exchange&withdateranges=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=&utm_medium=widget&utm_campaign=chart&utm_term=BITSTAMP%3ABTCUSD"
            style={{ width: "100%", height: "400px" }}
            frameBorder="0"
            scrolling="no"
            allowFullScreen={true}
          ></iframe>
        </div>
        
        {/* Trading form placeholder for dashboard - link to full trade page */}
        <div className="col-span-1">
          <div className="bg-white dark:bg-darkBg rounded-lg shadow border border-border dark:border-darkBorderColor">
            <div className="p-4 border-b border-border dark:border-darkBorderColor">
              <h2 className="font-semibold">Quick Trade</h2>
            </div>
            <div className="p-4">
              <p className="text-muted-foreground mb-4">Use our advanced trading interface to execute trades with detailed market information and advanced order types.</p>
              <a href="/trade" className="block w-full py-3 bg-primary text-white rounded-md hover:bg-primary/90 font-medium text-center">
                Go to Trading Page
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <RecentActivity />
      
      {/* Wallet Balance */}
      <WalletBalance />
    </div>
  );
}
