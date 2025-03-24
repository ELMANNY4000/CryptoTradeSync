import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoApi, CryptoAsset } from "@/lib/crypto-api";
import { useAuth } from "@/contexts/auth-context";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const tradeFormSchema = z.object({
  type: z.enum(["buy", "sell"]),
  amount: z.string().min(1, "Amount is required"),
  orderType: z.enum(["market", "limit"]),
  limitPrice: z.string().optional(),
});

type TradeFormValues = z.infer<typeof tradeFormSchema>;

interface TradeFormProps {
  symbol: string;
}

export function TradeForm({ symbol }: TradeFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  
  // Fetch selected asset data
  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: [`/api/crypto/assets/${symbol}`],
    queryFn: () => cryptoApi.getAssetBySymbol(symbol),
    enabled: !!symbol
  });
  
  // Fetch user's wallets to check balances
  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ["/api/wallets"],
    enabled: !!user
  });
  
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      type: "buy",
      amount: "",
      orderType: "market",
      limitPrice: "",
    },
  });
  
  // Update trade type when tab changes
  const handleTabChange = (value: string) => {
    if (value === "buy" || value === "sell") {
      setTradeType(value);
      form.setValue("type", value);
    }
  };
  
  // Place order mutation
  const placeOrder = useMutation({
    mutationFn: async (orderData: any) => {
      return cryptoApi.placeOrder(orderData);
    },
    onSuccess: () => {
      toast({
        title: "Order Executed",
        description: `${tradeType === "buy" ? "Buy" : "Sell"} order placed successfully.`,
      });
      
      // Reset form
      form.reset({
        type: tradeType,
        amount: "",
        orderType: "market",
        limitPrice: "",
      });
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // User's USD wallet and crypto wallet for this asset
  const usdWallet = wallets?.find((w: any) => w.asset.symbol === "USDT");
  const assetWallet = asset ? wallets?.find((w: any) => w.asset.symbol === asset.symbol) : null;
  
  // Current balance available
  const usdBalance = usdWallet?.balance || 0;
  const assetBalance = assetWallet?.balance || 0;
  
  // Calculate estimated total based on input amount
  const amount = parseFloat(form.watch("amount")) || 0;
  const limitPrice = parseFloat(form.watch("limitPrice")) || (asset?.currentPrice || 0);
  const orderType = form.watch("orderType");
  const price = orderType === "market" ? (asset?.currentPrice || 0) : limitPrice;
  
  // Calculate fee (0.25%)
  const feePercentage = 0.0025;
  
  // Calculate total cost/receive
  const subtotal = amount * price;
  const fee = subtotal * feePercentage;
  const total = tradeType === "buy" ? subtotal + fee : subtotal - fee;
  
  // Check if user has enough balance
  const hasEnoughBalance = tradeType === "buy" 
    ? usdBalance >= total 
    : assetBalance >= amount;
  
  const onSubmit = (data: TradeFormValues) => {
    if (!asset) return;
    
    const parsedAmount = parseFloat(data.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than zero.",
        variant: "destructive",
      });
      return;
    }
    
    // For limit orders, verify limit price
    if (data.orderType === "limit") {
      const parsedPrice = parseFloat(data.limitPrice || "0");
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        toast({
          title: "Invalid Price",
          description: "Please enter a valid limit price greater than zero.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (!hasEnoughBalance) {
      toast({
        title: "Insufficient Balance",
        description: tradeType === "buy" 
          ? "You don't have enough funds to complete this purchase." 
          : `You don't have enough ${asset.symbol} to complete this sale.`,
        variant: "destructive",
      });
      return;
    }
    
    // Prepare order data
    const orderData = {
      assetId: asset.id,
      type: data.type,
      orderType: data.orderType,
      amount: parsedAmount,
      price: data.orderType === "limit" ? parseFloat(data.limitPrice || "0") : undefined
    };
    
    placeOrder.mutate(orderData);
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Trade {symbol}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs
              defaultValue="buy"
              value={tradeType}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell">Sell</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {tradeType === "buy" && (
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-medium">
                    {walletsLoading 
                      ? "Loading..." 
                      : `$${usdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    }
                  </span>
                </div>
              </div>
            )}
            
            {tradeType === "sell" && (
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-medium">
                    {walletsLoading || assetLoading
                      ? "Loading..." 
                      : `${assetBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${symbol}`
                    }
                  </span>
                </div>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount{tradeType === "buy" ? " (USD)" : ` (${symbol})`}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder={tradeType === "buy" ? "Enter USD amount" : `Enter ${symbol} amount`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="orderType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select order type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="market">Market Order</SelectItem>
                      <SelectItem value="limit">Limit Order</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch("orderType") === "limit" && (
              <FormField
                control={form.control}
                name="limitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limit Price (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Enter limit price"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="pt-4 border-t border-border dark:border-darkBorderColor space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-sm font-mono">
                  {assetLoading 
                    ? "Loading..." 
                    : `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fee (0.25%)</span>
                <span className="text-sm font-mono">
                  ${fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{tradeType === "buy" ? "Total Cost" : "You Receive"}</span>
                <span className="font-mono">
                  ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              
              {!hasEnoughBalance && (
                <div className="text-red-500 text-sm mt-2">
                  {tradeType === "buy" 
                    ? "Insufficient USD balance" 
                    : `Insufficient ${symbol} balance`
                  }
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={placeOrder.isPending || assetLoading || walletsLoading || !hasEnoughBalance}
            >
              {placeOrder.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `${tradeType === "buy" ? "Buy" : "Sell"} ${symbol}`
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
