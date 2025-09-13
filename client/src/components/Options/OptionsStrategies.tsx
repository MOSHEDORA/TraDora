import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StrategyRecommendation {
  name: string;
  description: string;
  legs: string[];
  netDebit?: number;
  netCredit?: number;
  maxProfit: string;
  maxLoss: string;
  breakeven: string;
  marketView: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export function OptionsStrategies() {
  // No mock data - strategies should be generated from real market data
  const strategies: StrategyRecommendation[] = [];

  const getMarketViewIcon = (view: string) => {
    switch (view) {
      case 'BULLISH': return <TrendingUp size={16} className="text-success" />;
      case 'BEARISH': return <TrendingDown size={16} className="text-destructive" />;
      default: return <Minus size={16} className="text-warning" />;
    }
  };

  const getMarketViewColor = (view: string) => {
    switch (view) {
      case 'BULLISH': return 'bg-success/10 text-success border-success/20';
      case 'BEARISH': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-success text-success-foreground';
      case 'MEDIUM': return 'bg-warning text-warning-foreground';
      default: return 'bg-destructive text-destructive-foreground';
    }
  };

  return (
    <Card data-testid="card-options-strategies">
      <CardHeader>
        <CardTitle>Recommended Strategies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {strategies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg">No Data Available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Strategy recommendations require real-time option chain data
            </p>
          </div>
        ) : (
          strategies.map((strategy, index) => (
          <div 
            key={strategy.name}
            className={`p-4 rounded-lg border ${getMarketViewColor(strategy.marketView)}`}
            data-testid={`strategy-${strategy.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getMarketViewIcon(strategy.marketView)}
                <h4 className="font-semibold">{strategy.name}</h4>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getRiskColor(strategy.riskLevel)} data-testid={`badge-risk-${strategy.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  {strategy.riskLevel} RISK
                </Badge>
                <Badge variant="outline" data-testid={`badge-view-${strategy.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  {strategy.marketView}
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3" data-testid={`text-strategy-description-${index}`}>
              {strategy.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-2">Strategy Legs:</h5>
                <div className="space-y-1">
                  {strategy.legs.map((leg, legIndex) => (
                    <div 
                      key={legIndex}
                      className="text-xs font-mono bg-muted/50 p-1 rounded"
                      data-testid={`text-strategy-leg-${index}-${legIndex}`}
                    >
                      {leg}
                    </div>
                  ))}
                </div>
                {(strategy.netDebit || strategy.netCredit) && (
                  <div className="mt-2 font-semibold text-sm" data-testid={`text-strategy-net-${index}`}>
                    Net {strategy.netDebit ? `Debit: ₹${strategy.netDebit}` : `Credit: ₹${strategy.netCredit}`}
                  </div>
                )}
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Risk/Reward:</h5>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Max Profit:</span>
                    <span className="font-mono text-success" data-testid={`text-max-profit-${index}`}>
                      {strategy.maxProfit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Loss:</span>
                    <span className="font-mono text-destructive" data-testid={`text-max-loss-${index}`}>
                      {strategy.maxLoss}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Breakeven:</span>
                    <span className="font-mono" data-testid={`text-breakeven-${index}`}>
                      {strategy.breakeven}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                size="sm" 
                variant="outline"
                data-testid={`button-simulate-strategy-${index}`}
              >
                Simulate Strategy
              </Button>
            </div>
          </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
