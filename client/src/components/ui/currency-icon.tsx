import React from "react";
import { cn } from "@/lib/utils";

// Map crypto symbols to tailwind classes for background colors
const symbolColorMap: Record<string, { bg: string; text: string }> = {
  BTC: { bg: "bg-orange-100", text: "text-orange-600" },
  ETH: { bg: "bg-blue-100", text: "text-blue-600" },
  SOL: { bg: "bg-green-100", text: "text-green-600" },
  XRP: { bg: "bg-blue-100", text: "text-blue-600" },
  USDT: { bg: "bg-green-100", text: "text-green-600" },
  USD: { bg: "bg-green-100", text: "text-green-600" },
  // Add more cryptocurrencies as needed
  DEFAULT: { bg: "bg-gray-100", text: "text-gray-600" },
};

// Map crypto symbols to display characters
const symbolDisplayMap: Record<string, string> = {
  BTC: "₿",
  ETH: "Ξ",
  SOL: "S",
  XRP: "X",
  USDT: "$",
  USD: "$",
  // Add more cryptocurrencies as needed
};

interface CurrencyIconProps {
  symbol: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CurrencyIcon({ symbol, size = "md", className }: CurrencyIconProps) {
  const symbolKey = symbol.toUpperCase();
  const { bg, text } = symbolColorMap[symbolKey] || symbolColorMap.DEFAULT;
  const displaySymbol = symbolDisplayMap[symbolKey] || symbolKey.charAt(0);
  
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };
  
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold",
        bg,
        text,
        sizeClasses[size],
        className
      )}
    >
      {displaySymbol}
    </div>
  );
}
