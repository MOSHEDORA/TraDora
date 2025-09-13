import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { ScreenedStock } from "@/types/trading";
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from "lucide-react";

export function ScreenerTable() {
  const { data: screenedStocks, isLoading, refetch } = useQuery<ScreenedStock[]>({
    queryKey: ['/api/stock-screener'],
    refetchInterval: 60000,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 10000000) {
      return `${(volume / 10000000).toFixed(1)}Cr`;
    } else if (volume >= 100000) {
      return `${(volume / 100000).toFixed(1)}L`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-success' : 'text-destructive';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-success text-success-foreground';
    if (score >= 60) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const handleAnalyzeStock = (symbol: string) => {
    // In a real application, this would open a detailed analysis modal or navigate to analysis page
    console.log(`Analyzing stock: ${symbol}`);
  };

  if (isLoading) {
    return (
      <Card data-testid="card-screener-table">
        <CardHeader>
          <CardTitle>Stock Screener Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Running stock screener...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!screenedStocks || !Array.isArray(screenedStocks) || screenedStocks.length === 0) {
    return (
      <Card data-testid="card-screener-table">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Stock Screener Results</CardTitle>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            data-testid="button-refresh-screener"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No stocks found matching current criteria</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your screening parameters
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-screener-table">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Top Screened Stocks</CardTitle>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          data-testid="button-refresh-screener"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Symbol</th>
                <th className="text-left py-3 px-4 font-semibold">Price</th>
                <th className="text-left py-3 px-4 font-semibold">Change</th>
                <th className="text-left py-3 px-4 font-semibold">Volume</th>
                <th className="text-left py-3 px-4 font-semibold">Volatility</th>
                <th className="text-left py-3 px-4 font-semibold">AI Score</th>
                <th className="text-left py-3 px-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {screenedStocks.map((stock) => (
                <tr 
                  key={stock.symbol}
                  className="border-b border-border/50 hover:bg-muted/20"
                  data-testid={`row-stock-${stock.symbol}`}
                >
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-semibold" data-testid={`text-symbol-${stock.symbol}`}>
                        {stock.symbol}
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid={`text-name-${stock.symbol}`}>
                        {stock.name}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono" data-testid={`text-price-${stock.symbol}`}>
                    {formatCurrency(stock.price)}
                  </td>
                  <td className="py-3 px-4">
                    <div className={`flex items-center space-x-1 ${getChangeColor(stock.change)}`}>
                      {stock.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      <span className="font-mono" data-testid={`text-change-${stock.symbol}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono" data-testid={`text-volume-${stock.symbol}`}>
                    {formatVolume(stock.volume)}
                  </td>
                  <td className="py-3 px-4 font-mono" data-testid={`text-volatility-${stock.symbol}`}>
                    {stock.volatility}%
                  </td>
                  <td className="py-3 px-4">
                    <Badge 
                      className={getScoreColor(stock.aiScore)}
                      data-testid={`badge-ai-score-${stock.symbol}`}
                    >
                      {stock.aiScore}/100
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      size="sm"
                      onClick={() => handleAnalyzeStock(stock.symbol)}
                      data-testid={`button-analyze-${stock.symbol}`}
                    >
                      Analyze
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* AI Insights for Top Stocks */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <BarChart3 className="text-primary" size={20} />
            <span>AI Analysis - Top Picks</span>
          </h3>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No Data Available</p>
            <p className="text-sm text-muted-foreground mt-2">
              AI analysis requires real-time data and API access
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
