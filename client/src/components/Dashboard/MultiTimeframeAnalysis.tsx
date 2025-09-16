import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface MultiTimeframeData {
  [symbol: string]: {
    [timeframe: string]: {
      technicalData: {
        rsi: number;
        macd: {
          macd: number;
          signal: number;
          histogram: number;
        };
        vwap: number;
        ema20: number;
        ema50: number;
        bollinger: {
          upper: number;
          middle: number;
          lower: number;
        };
        supertrend: {
          value: number;
          direction: 'LONG' | 'SHORT';
        };
      };
      signal: {
        signal: 'BUY' | 'SELL' | 'HOLD';
        strength: number;
        reasoning: string;
      };
    };
  };
}

const SYMBOLS = [
  { value: 'NIFTY', label: 'Nifty 50' },
  { value: 'BANKNIFTY', label: 'Bank Nifty' },
  { value: 'SENSEX', label: 'Sensex' }
];

const TIMEFRAMES = [
  { value: '1m', label: '1 Min' },
  { value: '5m', label: '5 Min' },
  { value: '15m', label: '15 Min' },
  { value: '1h', label: '1 Hour' }
];

export function MultiTimeframeAnalysis() {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [selectedTimeframe, setSelectedTimeframe] = useState('5m');

  const { data: multiTimeframeData, isLoading, refetch } = useQuery<MultiTimeframeData>({
    queryKey: ['/api/multi-timeframe-analysis'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getSignalIcon = (signal: 'BUY' | 'SELL' | 'HOLD') => {
    switch (signal) {
      case 'BUY': return <TrendingUp className="w-4 h-4 text-success" />;
      case 'SELL': return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <Minus className="w-4 h-4 text-warning" />;
    }
  };

  const getSignalColor = (signal: 'BUY' | 'SELL' | 'HOLD') => {
    switch (signal) {
      case 'BUY': return 'bg-success text-success-foreground';
      case 'SELL': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-warning text-warning-foreground';
    }
  };

  const formatValue = (value: number) => {
    return value.toFixed(2);
  };

  const currentData = multiTimeframeData?.[selectedSymbol]?.[selectedTimeframe];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multi-Timeframe Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading multi-timeframe analysis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-multi-timeframe-analysis">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Multi-Timeframe Analysis</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          data-testid="button-refresh-analysis"
        >
          <RefreshCw size={16} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Index</label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger data-testid="select-symbol">
                <SelectValue placeholder="Select index" />
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map((symbol) => (
                  <SelectItem key={symbol.value} value={symbol.value}>
                    {symbol.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Period</label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger data-testid="select-timeframe">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Current Analysis Display */}
        {currentData ? (
          <div className="space-y-4">
            {/* Overall Signal */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                {getSignalIcon(currentData.signal.signal)}
                <div>
                  <h3 className="font-semibold">Overall Signal</h3>
                  <p className="text-sm text-muted-foreground">{currentData.signal.reasoning}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className={getSignalColor(currentData.signal.signal)}>
                  {currentData.signal.signal}
                </Badge>
                <p className="text-sm mt-1">Strength: {currentData.signal.strength}%</p>
              </div>
            </div>

            {/* Technical Indicators Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-muted/20 rounded-lg" data-testid="indicator-rsi">
                <div className="text-sm font-medium text-muted-foreground">RSI</div>
                <div className="text-xl font-bold font-mono">{formatValue(currentData.technicalData.rsi)}</div>
                <div className={`text-xs ${currentData.technicalData.rsi > 70 ? 'text-destructive' : currentData.technicalData.rsi < 30 ? 'text-success' : 'text-warning'}`}>
                  {currentData.technicalData.rsi > 70 ? 'Overbought' : currentData.technicalData.rsi < 30 ? 'Oversold' : 'Neutral'}
                </div>
              </div>

              <div className="p-3 bg-muted/20 rounded-lg" data-testid="indicator-macd">
                <div className="text-sm font-medium text-muted-foreground">MACD</div>
                <div className="text-xl font-bold font-mono">{formatValue(currentData.technicalData.macd.macd)}</div>
                <div className="text-xs text-muted-foreground">
                  Signal: {formatValue(currentData.technicalData.macd.signal)}
                </div>
              </div>

              <div className="p-3 bg-muted/20 rounded-lg" data-testid="indicator-vwap">
                <div className="text-sm font-medium text-muted-foreground">VWAP</div>
                <div className="text-xl font-bold font-mono">{formatValue(currentData.technicalData.vwap)}</div>
              </div>

              <div className="p-3 bg-muted/20 rounded-lg" data-testid="indicator-ema20">
                <div className="text-sm font-medium text-muted-foreground">EMA 20</div>
                <div className="text-xl font-bold font-mono">{formatValue(currentData.technicalData.ema20)}</div>
              </div>

              <div className="p-3 bg-muted/20 rounded-lg" data-testid="indicator-ema50">
                <div className="text-sm font-medium text-muted-foreground">EMA 50</div>
                <div className="text-xl font-bold font-mono">{formatValue(currentData.technicalData.ema50)}</div>
                <div className={`text-xs ${currentData.technicalData.ema20 > currentData.technicalData.ema50 ? 'text-success' : 'text-destructive'}`}>
                  {currentData.technicalData.ema20 > currentData.technicalData.ema50 ? 'Bullish' : 'Bearish'}
                </div>
              </div>

              <div className="p-3 bg-muted/20 rounded-lg" data-testid="indicator-supertrend">
                <div className="text-sm font-medium text-muted-foreground">Supertrend</div>
                <div className="text-xl font-bold font-mono">{formatValue(currentData.technicalData.supertrend.value)}</div>
                <div className={`text-xs ${currentData.technicalData.supertrend.direction === 'LONG' ? 'text-success' : 'text-destructive'}`}>
                  {currentData.technicalData.supertrend.direction}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No data available for selected combination</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}