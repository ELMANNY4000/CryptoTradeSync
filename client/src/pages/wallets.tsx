import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { TransactionList } from "@/components/wallets/transaction-list";
import { Plus, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Wallets() {
  const [activeTab, setActiveTab] = useState("wallets");
  
  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ["/api/wallets"]
  });
  
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"]
  });
  
  // Calculate total balance in USD
  const totalBalance = wallets?.reduce((total: number, wallet: any) => {
    return total + (wallet.balance * wallet.asset.currentPrice);
  }, 0) || 0;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold mb-2 md:mb-0">Wallets</h1>
        
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Deposit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deposit Funds</DialogTitle>
                <DialogDescription>
                  Choose a payment method to add funds to your account
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <p className="text-sm">
                  This is a demo application. In a real application, you would be able
                  to deposit funds using various payment methods such as bank transfer,
                  credit/debit card, or cryptocurrency.
                </p>
                <Button className="w-full">Connect Bank Account</Button>
                <Button variant="outline" className="w-full">Use Credit/Debit Card</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw Funds</DialogTitle>
                <DialogDescription>
                  Choose a withdrawal method and amount
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <p className="text-sm">
                  This is a demo application. In a real application, you would be able
                  to withdraw funds to your bank account or other payment methods.
                </p>
                <Button className="w-full">Withdraw to Bank Account</Button>
                <Button variant="outline" className="w-full">Withdraw to Crypto Wallet</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Total Assets Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono mb-4">
            {walletsLoading ? (
              <Skeleton className="h-9 w-48" />
            ) : (
              `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Button className="flex items-center" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Balances
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="wallets">My Wallets</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="wallets" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {walletsLoading ? (
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
              wallets.map((wallet: any) => (
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="flex-1" size="sm">Send</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Send {wallet.asset.symbol}</DialogTitle>
                            <DialogDescription>
                              Enter destination address and amount
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <p className="text-sm">
                              This is a demo application. In a real application, you would be able
                              to send cryptocurrency to external wallets.
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="flex-1" variant="outline" size="sm">Receive</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Receive {wallet.asset.symbol}</DialogTitle>
                            <DialogDescription>
                              Your deposit address
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <p className="text-sm font-mono p-3 bg-muted rounded-md break-all">
                              {wallet.address || `wallet-address-${wallet.id}-${wallet.asset.symbol}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Only send {wallet.asset.symbol} to this address. Sending any other asset may result in permanent loss.
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No wallets found. Create a wallet by trading or depositing cryptocurrency.
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <TransactionList 
                transactions={transactions} 
                isLoading={transactionsLoading} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
