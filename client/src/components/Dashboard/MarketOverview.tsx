import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Building, University } from "lucide-react";
import { MarketQuote } from "@/types/trading";

interface MarketOverviewProps {
  marketData: MarketQuote[];
}

export function MarketOverview({ marketData }: MarketOverviewProps) {
  const getIcon = (symbol: string) => {
    switch (symbol) {
      case 'NIFTY': return TrendingUp;
      case 'BANKNIFTY': return University;
      case 'SENSEX': return Building;
      default: return TrendingUp;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatChange = (change: number, changePercent: number) => {
    const changeNum = typeof change === 'string' ? parseFloat(change) : change;
    const changePercentNum = typeof changePercent === 'string' ? parseFloat(changePercent) : changePercent;
    const sign = changeNum >= 0 ? '+' : '';
    return {
      change: `${sign}${formatPrice(changeNum)}`,
      percent: `(${sign}${changePercentNum.toFixed(2)}%)`,
      isPositive: changeNum >= 0
    };
  };

  if (marketData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading market data...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {marketData.map((quote) => {
        const Icon = getIcon(quote.symbol);
        const changeData = formatChange(quote.change, quote.changePercent);
        
        return (
          <Card 
            key={quote.symbol} 
            className="hover:shadow-lg transition-shadow"
            data-testid={`card-${quote.symbol.toLowerCase()}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold">
                {quote.symbol === 'NIFTY' ? 'Nifty 50' : 
                 quote.symbol === 'BANKNIFTY' ? 'Bank Nifty' : 
                 'Sensex'}
              </CardTitle>
              <Icon className="text-primary" size={20} />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold font-mono" data-testid={`text-${quote.symbol.toLowerCase()}-price`}>
                {formatPrice(quote.price)}
              </div>
              <div className="flex items-center space-x-2">
                <span 
                  className={`font-mono ${changeData.isPositive ? 'text-success' : 'text-destructive'}`}
                  data-testid={`text-${quote.symbol.toLowerCase()}-change`}
                >
                  {changeData.change}
                </span>
                <span 
                  className={`font-mono ${changeData.isPositive ? 'text-success' : 'text-destructive'}`}
                  data-testid={`text-${quote.symbol.toLowerCase()}-percent`}
                >
                  {changeData.percent}
                </span>
                {changeData.isPositive ? 
                  <TrendingUp className="text-success" size={16} /> : 
                  <TrendingDown className="text-destructive" size={16} />
                }
              </div>
              <div className="text-sm text-muted-foreground">
                High: <span className="font-mono" data-testid={`text-${quote.symbol.toLowerCase()}-high`}>
                  {formatPrice(quote.high)}
                </span> | 
                Low: <span className="font-mono" data-testid={`text-${quote.symbol.toLowerCase()}-low`}>
                  {formatPrice(quote.low)}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
