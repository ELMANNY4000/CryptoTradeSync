import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PriceChart } from "@/components/trade/price-chart";
import { TradeForm } from "@/components/trade/trade-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cryptoApi } from "@/lib/crypto-api";
import { DataTable } from "@/components/ui/data-table";
import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Skeleton } from "@/components/ui/skeleton";

export default function Trade() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split("?")[1]);
  const [selectedSymbol, setSelectedSymbol] = useState(params.get("symbol") || "BTC");
  
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['/api/crypto/assets'],
    queryFn: cryptoApi.getAssets
  });
  
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
  });
  
  // Update URL when symbol changes
  useEffect(() => {
    setLocation(`/trade?symbol=${selectedSymbol}`, { replace: true });
  }, [selectedSymbol, setLocation]);
  
  // Order history columns
  const orderColumns = [
    {
      header: "Date",
      accessorKey: (order: any) => new Date(order.createdAt).toLocaleString(),
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: (order: any) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          order.type === "buy" 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}>
          {order.type.charAt(0).toUpperCase() + order.type.slice(1)}
        </span>
      ),
    },
    {
      header: "Asset",
      accessorKey: (order: any) => order.asset?.symbol || "-",
      cell: (order: any) => order.asset && (
        <div className="flex items-center">
          <CurrencyIcon symbol={order.asset.symbol} size="sm" className="mr-2" />
          <span>{order.asset.symbol}</span>
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: (order: any) => order.amount.toLocaleString(undefined, { maximumFractionDigits: 8 }),
    },
    {
      header: "Price",
      accessorKey: (order: any) => order.price 
        ? `$${order.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : "Market",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (order: any) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          order.status === "completed" 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
            : order.status === "pending"
            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      ),
    },
  ];
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold mb-2 md:mb-0">Trade</h1>
        
        <div className="w-full md:w-64">
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger>
              <SelectValue placeholder="Select Asset" />
            </SelectTrigger>
            <SelectContent>
              {assetsLoading ? (
                <div className="p-2">Loading assets...</div>
              ) : (
                assets?.map(asset => (
                  <SelectItem key={asset.id} value={asset.symbol}>
                    <div className="flex items-center">
                      <CurrencyIcon symbol={asset.symbol} size="sm" className="mr-2" />
                      <span>{asset.name} ({asset.symbol})</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Price Chart */}
        <div className="col-span-1 lg:col-span-2">
          <PriceChart symbol={selectedSymbol} />
        </div>
        
        {/* Trade Form */}
        <div className="col-span-1">
          <TradeForm symbol={selectedSymbol} />
        </div>
      </div>
      
      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="open">
            <TabsList className="mb-4">
              <TabsTrigger value="open">Open Orders</TabsTrigger>
              <TabsTrigger value="completed">Completed Orders</TabsTrigger>
              <TabsTrigger value="all">All Orders</TabsTrigger>
            </TabsList>
            
            <TabsContent value="open" className="mt-0">
              {ordersLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <DataTable 
                  data={orders?.filter((order: any) => order.status === "pending") || []}
                  columns={orderColumns}
                />
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-0">
              {ordersLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <DataTable 
                  data={orders?.filter((order: any) => order.status === "completed") || []}
                  columns={orderColumns}
                />
              )}
            </TabsContent>
            
            <TabsContent value="all" className="mt-0">
              {ordersLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <DataTable 
                  data={orders || []}
                  columns={orderColumns}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
