import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface MarketDataRecord {
  id: string;
  symbol: string;
  open: string | null;
  price: string; // Close price
  change: string;
  changePercent: string;
  high: string;
  low: string;
  volume: number;
  timestamp: string | null;
}

const SYMBOLS = [
  { value: 'NIFTY', label: 'Nifty 50' },
  { value: 'BANKNIFTY', label: 'Bank Nifty' },
  { value: 'SENSEX', label: 'Sensex' },
];

export function MarketDataTable() {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');

  const { data: marketData, isLoading, refetch } = useQuery<MarketDataRecord[]>({
    queryKey: ['/api/market-data'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const formatToIST = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    const istOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    
    return new Intl.DateTimeFormat('en-IN', istOptions).format(date);
  };

  const formatPrice = (price: string | null) => {
    if (!price) return '0.00';
    const num = parseFloat(price);
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatVolume = (volume: number) => {
    return new Intl.NumberFormat('en-IN').format(volume);
  };

  const getChangeColor = (change: string) => {
    const changeNum = parseFloat(change);
    return changeNum >= 0 ? 'text-success' : 'text-destructive';
  };

  const getChangeIcon = (change: string) => {
    const changeNum = parseFloat(change);
    return changeNum >= 0 ? 
      <TrendingUp className="w-4 h-4 text-success" /> :
      <TrendingDown className="w-4 h-4 text-destructive" />;
  };

  // Filter data by selected symbol and sort by timestamp (newest first)
  const filteredData = marketData
    ?.filter(record => record.symbol === selectedSymbol)
    ?.sort((a, b) => {
      if (!a.timestamp && !b.timestamp) return 0;
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })
    ?.slice(0, 50) || []; // Show latest 50 records

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Data (OHLC)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading market data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-market-data-table">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Market Data (OHLC)</CardTitle>
        <div className="flex items-center space-x-4">
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-40" data-testid="select-market-symbol">
              <SelectValue placeholder="Select stock" />
            </SelectTrigger>
            <SelectContent>
              {SYMBOLS.map((symbol) => (
                <SelectItem key={symbol.value} value={symbol.value}>
                  {symbol.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            data-testid="button-refresh-market-data"
          >
            <RefreshCw size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" data-testid="table-market-data">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Date & Time (IST)</th>
                  <th className="text-right p-3 font-semibold">Open</th>
                  <th className="text-right p-3 font-semibold">High</th>
                  <th className="text-right p-3 font-semibold">Low</th>
                  <th className="text-right p-3 font-semibold">Close</th>
                  <th className="text-right p-3 font-semibold">Volume</th>
                  <th className="text-right p-3 font-semibold">Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((record, index) => {
                  const changeNum = parseFloat(record.change);
                  const changePercentNum = parseFloat(record.changePercent);
                  const sign = changeNum >= 0 ? '+' : '';
                  
                  return (
                    <tr 
                      key={record.id} 
                      className="border-b hover:bg-muted/30 transition-colors"
                      data-testid={`row-market-data-${index}`}
                    >
                      <td className="p-3 text-sm" data-testid={`cell-timestamp-${index}`}>
                        {formatToIST(record.timestamp)}
                      </td>
                      <td className="p-3 text-right font-mono" data-testid={`cell-open-${index}`}>
                        {formatPrice(record.open)}
                      </td>
                      <td className="p-3 text-right font-mono text-success" data-testid={`cell-high-${index}`}>
                        {formatPrice(record.high)}
                      </td>
                      <td className="p-3 text-right font-mono text-destructive" data-testid={`cell-low-${index}`}>
                        {formatPrice(record.low)}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold" data-testid={`cell-close-${index}`}>
                        {formatPrice(record.price)}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground" data-testid={`cell-volume-${index}`}>
                        {formatVolume(record.volume)}
                      </td>
                      <td className="p-3 text-right" data-testid={`cell-change-${index}`}>
                        <div className="flex items-center justify-end space-x-2">
                          {getChangeIcon(record.change)}
                          <div className={`font-mono ${getChangeColor(record.change)}`}>
                            <div>{sign}₹{Math.abs(changeNum).toFixed(2)}</div>
                            <div className="text-xs">({sign}{changePercentNum.toFixed(2)}%)</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Summary */}
            <div className="mt-4 p-4 bg-muted/20 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Records</p>
                  <p className="font-semibold">{filteredData.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Symbol</p>
                  <p className="font-semibold">{SYMBOLS.find(s => s.value === selectedSymbol)?.label}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Latest Price</p>
                  <p className="font-semibold font-mono">₹{formatPrice(filteredData[0]?.price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Latest Update</p>
                  <p className="font-semibold text-xs">{formatToIST(filteredData[0]?.timestamp)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No market data available for {SYMBOLS.find(s => s.value === selectedSymbol)?.label}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Data will appear when market updates are received
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}