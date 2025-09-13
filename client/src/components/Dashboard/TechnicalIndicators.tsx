import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TechnicalIndicator } from "@/types/trading";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TechnicalIndicatorsProps {
  indicators: TechnicalIndicator[];
  onRefresh?: () => void;
}

export function TechnicalIndicators({ indicators, onRefresh }: TechnicalIndicatorsProps) {
  const getIndicatorColor = (signal: TechnicalIndicator['signal']) => {
    switch (signal) {
      case 'BUY': return 'bg-success text-success-foreground';
      case 'SELL': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-warning text-warning-foreground';
    }
  };

  if (indicators.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Technical Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading technical indicators...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-technical-indicators">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Technical Indicators</CardTitle>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            data-testid="button-refresh-indicators"
          >
            <RefreshCw size={16} />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {indicators.slice(0, 18).map((indicator, index) => (
          <div 
            key={`${indicator.name}-${index}`}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
            data-testid={`indicator-${indicator.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                indicator.signal === 'BUY' ? 'bg-success' :
                indicator.signal === 'SELL' ? 'bg-destructive' : 'bg-warning'
              }`}></div>
              <span className="font-medium">{indicator.name}</span>
            </div>
            <div className="text-right">
              <div className="font-mono font-semibold" data-testid={`text-${indicator.name.toLowerCase().replace(/\s+/g, '-')}-value`}>
                {indicator.value}
              </div>
              <Badge 
                className={getIndicatorColor(indicator.signal)}
                data-testid={`badge-${indicator.name.toLowerCase().replace(/\s+/g, '-')}-signal`}
              >
                {indicator.signal}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
