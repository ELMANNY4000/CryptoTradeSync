import { CurrencyIcon } from "@/components/ui/currency-icon";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionListProps {
  transactions: any[];
  isLoading: boolean;
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTypeBadgeClasses = (type: string) => {
    switch (type) {
      case 'buy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'sell':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'deposit':
      case 'withdraw':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const txTypeLabels: Record<string, string> = {
    buy: 'Buy',
    sell: 'Sell',
    deposit: 'Deposit',
    withdraw: 'Withdraw'
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-muted-foreground text-sm border-b border-border">
            <th className="py-3 px-4">Type</th>
            <th className="py-3 px-4">Asset</th>
            <th className="py-3 px-4">Amount</th>
            <th className="py-3 px-4">Price</th>
            <th className="py-3 px-4">Total</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            // Loading skeletons
            Array(5).fill(0).map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-3 px-4"><Skeleton className="h-6 w-16" /></td>
                <td className="py-3 px-4"><Skeleton className="h-6 w-20" /></td>
                <td className="py-3 px-4"><Skeleton className="h-6 w-24" /></td>
                <td className="py-3 px-4"><Skeleton className="h-6 w-24" /></td>
                <td className="py-3 px-4"><Skeleton className="h-6 w-24" /></td>
                <td className="py-3 px-4"><Skeleton className="h-6 w-40" /></td>
                <td className="py-3 px-4"><Skeleton className="h-6 w-24" /></td>
              </tr>
            ))
          ) : transactions?.length ? (
            transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-border">
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadgeClasses(tx.type)}`}>
                    {txTypeLabels[tx.type] || tx.type}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {tx.asset ? (
                    <div className="flex items-center">
                      <CurrencyIcon symbol={tx.asset.symbol} size="sm" className="mr-2" />
                      <span>{tx.asset.symbol}</span>
                    </div>
                  ) : (
                    tx.type === 'deposit' || tx.type === 'withdraw' ? (
                      <div className="flex items-center">
                        <CurrencyIcon symbol="USD" size="sm" className="mr-2" />
                        <span>USD</span>
                      </div>
                    ) : "-"
                  )}
                </td>
                <td className="py-3 px-4 font-mono">
                  {tx.asset ? 
                    `${tx.amount.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${tx.asset.symbol}` :
                    tx.amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
                  }
                </td>
                <td className="py-3 px-4 font-mono">
                  {tx.price ? `$${tx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                </td>
                <td className="py-3 px-4 font-mono">
                  ${tx.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {formatDate(tx.createdAt)}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClasses(tx.status)}`}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="py-6 text-center text-muted-foreground">
                No transactions found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
