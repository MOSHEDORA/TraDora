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
  const strategies: StrategyRecommendation[] = [
    {
      name: "Long Straddle",
      description: "High IV suggests big move expected. Consider 44,400 strike straddle.",
      legs: [
        "Buy 44400 CE @ ₹142.75",
        "Buy 44400 PE @ ₹48.25"
      ],
      netDebit: 191.00,
      maxProfit: "Unlimited",
      maxLoss: "₹9,550 (Net Debit)",
      breakeven: "44,209 / 44,591",
      marketView: 'NEUTRAL',
      riskLevel: 'HIGH'
    },
    {
      name: "Iron Condor",
      description: "Range-bound strategy for sideways movement. Limited risk/reward.",
      legs: [
        "Sell 44200 CE @ ₹185.50",
        "Buy 44600 CE @ ₹95.25",
        "Sell 44600 PE @ ₹65.75",
        "Buy 44200 PE @ ₹25.75"
      ],
      netCredit: 159.25,
      maxProfit: "₹7,962 (Net Credit)",
      maxLoss: "₹12,038",
      breakeven: "44,359 / 44,441",
      marketView: 'NEUTRAL',
      riskLevel: 'MEDIUM'
    },
    {
      name: "Bull Call Spread",
      description: "Moderate bullish outlook with limited risk and reward.",
      legs: [
        "Buy 44400 CE @ ₹142.75",
        "Sell 44500 CE @ ₹118.50"
      ],
      netDebit: 24.25,
      maxProfit: "₹3,787 (Spread - Net Debit)",
      maxLoss: "₹1,212 (Net Debit)",
      breakeven: "44,424",
      marketView: 'BULLISH',
      riskLevel: 'MEDIUM'
    }
  ];

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
        {strategies.map((strategy, index) => (
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
        ))}
      </CardContent>
    </Card>
  );
}
