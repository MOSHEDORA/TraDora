import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'SENSEX'];
const TIMEFRAMES = ['1m', '5m', '15m', '1h'];

export function TechnicalIndicatorsTable() {
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

  const getSymbolLabel = (symbol: string) => {
    switch (symbol) {
      case 'NIFTY': return 'Nifty 50';
      case 'BANKNIFTY': return 'Bank Nifty';
      case 'SENSEX': return 'Sensex';
      default: return symbol;
    }
  };

  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case '1m': return '1 Min';
      case '5m': return '5 Min';
      case '15m': return '15 Min';
      case '1h': return '1 Hour';
      default: return timeframe;
    }
  };

  // Calculate overall decision for each symbol across timeframes
  const getOverallDecision = (symbol: string): { signal: 'BUY' | 'SELL' | 'HOLD', strength: number, count: { buy: number, sell: number, hold: number } } => {
    if (!multiTimeframeData?.[symbol]) {
      return { signal: 'HOLD', strength: 0, count: { buy: 0, sell: 0, hold: 0 } };
    }

    const signals = TIMEFRAMES.map(tf => multiTimeframeData[symbol]?.[tf]?.signal?.signal).filter(Boolean);
    const buyCount = signals.filter(s => s === 'BUY').length;
    const sellCount = signals.filter(s => s === 'SELL').length;
    const holdCount = signals.filter(s => s === 'HOLD').length;

    const totalSignals = signals.length;
    if (totalSignals === 0) {
      return { signal: 'HOLD', strength: 0, count: { buy: 0, sell: 0, hold: 0 } };
    }

    let overallSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let strength = 0;

    if (buyCount > sellCount && buyCount > holdCount) {
      overallSignal = 'BUY';
      strength = Math.round((buyCount / totalSignals) * 100);
    } else if (sellCount > buyCount && sellCount > holdCount) {
      overallSignal = 'SELL';
      strength = Math.round((sellCount / totalSignals) * 100);
    } else {
      overallSignal = 'HOLD';
      strength = Math.round((holdCount / totalSignals) * 100);
    }

    return { 
      signal: overallSignal, 
      strength, 
      count: { buy: buyCount, sell: sellCount, hold: holdCount }
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Technical Analysis Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading technical analysis matrix...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-technical-matrix">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Technical Analysis Matrix</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          data-testid="button-refresh-matrix"
        >
          <RefreshCw size={16} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" data-testid="table-technical-matrix">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Index</th>
                {TIMEFRAMES.map(tf => (
                  <th key={tf} className="text-center p-3 font-semibold">{getTimeframeLabel(tf)}</th>
                ))}
                <th className="text-center p-3 font-semibold">Final Decision</th>
              </tr>
            </thead>
            <tbody>
              {SYMBOLS.map(symbol => {
                const overallDecision = getOverallDecision(symbol);
                return (
                  <tr key={symbol} className="border-b hover:bg-muted/30 transition-colors" data-testid={`row-${symbol.toLowerCase()}`}>
                    <td className="p-3 font-medium">{getSymbolLabel(symbol)}</td>
                    {TIMEFRAMES.map(timeframe => {
                      const data = multiTimeframeData?.[symbol]?.[timeframe];
                      return (
                        <td key={timeframe} className="p-3 text-center" data-testid={`cell-${symbol.toLowerCase()}-${timeframe}`}>
                          {data ? (
                            <div className="flex flex-col items-center space-y-1">
                              <div className="flex items-center space-x-1">
                                {getSignalIcon(data.signal.signal)}
                                <Badge className={getSignalColor(data.signal.signal)}>
                                  {data.signal.signal}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {data.signal.strength}%
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <Badge variant="outline">N/A</Badge>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center" data-testid={`cell-${symbol.toLowerCase()}-final`}>
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex items-center space-x-2">
                          {getSignalIcon(overallDecision.signal)}
                          <Badge className={getSignalColor(overallDecision.signal)}>
                            {overallDecision.signal}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {overallDecision.strength}% Consensus
                        </div>
                        <div className="text-xs text-muted-foreground">
                          B:{overallDecision.count.buy} S:{overallDecision.count.sell} H:{overallDecision.count.hold}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-muted/20 rounded-lg">
          <h4 className="font-semibold mb-2">Legend</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Final Decision:</strong> Based on majority consensus across all timeframes</p>
              <p><strong>Consensus %:</strong> Percentage of timeframes agreeing with the decision</p>
            </div>
            <div>
              <p><strong>B/S/H Count:</strong> Number of Buy/Sell/Hold signals across timeframes</p>
              <p><strong>Signal Strength:</strong> Individual timeframe confidence level</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}