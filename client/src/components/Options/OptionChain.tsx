import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { OptionChainData } from "@/types/trading";
import { useState } from "react";

export function OptionChain() {
  const [selectedUnderlying] = useState('BANKNIFTY');
  const [selectedExpiry] = useState('25-Jan-2024');

  const { data: optionChain, isLoading } = useQuery<OptionChainData[]>({
    queryKey: ['/api/option-chain', { underlying: selectedUnderlying, expiry: selectedExpiry }],
    refetchInterval: 30000,
  });

  const formatNumber = (value: string | number | null) => {
    if (!value) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-IN');
  };

  const formatPrice = (value: string | null) => {
    if (!value) return '-';
    return `₹${parseFloat(value).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <Card data-testid="card-option-chain">
        <CardHeader>
          <CardTitle>Option Chain - {selectedUnderlying}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading option chain...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!optionChain || optionChain.length === 0) {
    return (
      <Card data-testid="card-option-chain">
        <CardHeader>
          <CardTitle>Option Chain - {selectedUnderlying}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No option chain data available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Data will be available during market hours
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-option-chain">
      <CardHeader>
        <CardTitle>Option Chain - {selectedUnderlying}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-semibold text-success">OI</th>
                <th className="text-left py-3 px-2 font-semibold text-success">Volume</th>
                <th className="text-left py-3 px-2 font-semibold text-success">IV</th>
                <th className="text-left py-3 px-2 font-semibold text-success">LTP</th>
                <th className="text-center py-3 px-4 font-semibold bg-muted/30">Strike</th>
                <th className="text-right py-3 px-2 font-semibold text-destructive">LTP</th>
                <th className="text-right py-3 px-2 font-semibold text-destructive">IV</th>
                <th className="text-right py-3 px-2 font-semibold text-destructive">Volume</th>
                <th className="text-right py-3 px-2 font-semibold text-destructive">OI</th>
              </tr>
              <tr className="text-xs text-muted-foreground">
                <th className="py-1 px-2" colSpan={4}>CALLS</th>
                <th className="py-1 px-2"></th>
                <th className="py-1 px-2" colSpan={4}>PUTS</th>
              </tr>
            </thead>
            <tbody>
              {optionChain.map((row, index) => (
                <tr 
                  key={`${row.strike}-${index}`}
                  className={`border-b border-border/50 hover:bg-muted/20 ${
                    parseFloat(row.strike) % 500 === 0 ? 'bg-primary/5' : ''
                  }`}
                  data-testid={`row-option-${row.strike}`}
                >
                  {/* CALLS */}
                  <td className="py-2 px-2 font-mono text-xs" data-testid={`text-call-oi-${row.strike}`}>
                    {formatNumber(row.callOi)}
                  </td>
                  <td className="py-2 px-2 font-mono text-xs" data-testid={`text-call-volume-${row.strike}`}>
                    {formatNumber(row.callVolume)}
                  </td>
                  <td className="py-2 px-2 font-mono text-xs" data-testid={`text-call-iv-${row.strike}`}>
                    {row.callIv ? `${parseFloat(row.callIv).toFixed(1)}%` : '-'}
                  </td>
                  <td className="py-2 px-2 font-mono text-xs font-semibold" data-testid={`text-call-ltp-${row.strike}`}>
                    {formatPrice(row.callLtp)}
                  </td>
                  
                  {/* STRIKE */}
                  <td className="py-2 px-4 font-mono font-bold text-center bg-muted/30" data-testid={`text-strike-${row.strike}`}>
                    {formatNumber(row.strike)}
                  </td>
                  
                  {/* PUTS */}
                  <td className="py-2 px-2 font-mono text-xs font-semibold text-right" data-testid={`text-put-ltp-${row.strike}`}>
                    {formatPrice(row.putLtp)}
                  </td>
                  <td className="py-2 px-2 font-mono text-xs text-right" data-testid={`text-put-iv-${row.strike}`}>
                    {row.putIv ? `${parseFloat(row.putIv).toFixed(1)}%` : '-'}
                  </td>
                  <td className="py-2 px-2 font-mono text-xs text-right" data-testid={`text-put-volume-${row.strike}`}>
                    {formatNumber(row.putVolume)}
                  </td>
                  <td className="py-2 px-2 font-mono text-xs text-right" data-testid={`text-put-oi-${row.strike}`}>
                    {formatNumber(row.putOi)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>* Data refreshes every 30 seconds during market hours</p>
          <p>* OI = Open Interest, IV = Implied Volatility, LTP = Last Traded Price</p>
        </div>
      </CardContent>
    </Card>
  );
}
