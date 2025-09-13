import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PaperTrade } from "@/types/trading";
import { TrendingUp, TrendingDown, X } from "lucide-react";

export function Portfolio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: trades, isLoading } = useQuery<PaperTrade[]>({
    queryKey: ['/api/paper-trades'],
    refetchInterval: 30000,
  });

  const { data: activeTrades } = useQuery<PaperTrade[]>({
    queryKey: ['/api/paper-trades', { active: true }],
    refetchInterval: 30000,
  });

  const closeTradeMutation = useMutation({
    mutationFn: async ({ tradeId, exitPrice }: { tradeId: string; exitPrice: number }) => {
      const response = await fetch(`/api/paper-trades/${tradeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CLOSED',
          exitPrice: exitPrice.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to close trade');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade Closed",
        description: "Position has been closed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/paper-trades'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to close trade",
        variant: "destructive",
      });
    }
  });

  // Calculate portfolio summary
  const totalPnL = trades?.reduce((sum, trade) => sum + parseFloat(trade.pnl), 0) || 0;
  const todayTrades = trades?.filter(trade => {
    const today = new Date().toDateString();
    return new Date(trade.createdAt).toDateString() === today;
  }) || [];
  
  const todayPnL = todayTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl), 0);
  const totalTradesCount = trades?.length || 0;
  const winningTrades = trades?.filter(trade => parseFloat(trade.pnl) > 0).length || 0;
  const winRate = totalTradesCount > 0 ? Math.round((winningTrades / totalTradesCount) * 100) : 0;

  const formatCurrency = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}₹${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  const handleCloseTrade = (tradeId: string) => {
    // In a real app, this would use current market price
    const mockExitPrice = 150.25; // Mock current price
    closeTradeMutation.mutate({ tradeId, exitPrice: mockExitPrice });
  };

  const getStatusColor = (status: PaperTrade['status']) => {
    switch (status) {
      case 'OPEN': return 'bg-primary text-primary-foreground';
      case 'CLOSED': return 'bg-muted text-muted-foreground';
      case 'TARGET_HIT': return 'bg-success text-success-foreground';
      case 'SL_HIT': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="card-portfolio">
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading portfolio...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="portfolio-container">
      {/* Portfolio Summary */}
      <Card data-testid="card-portfolio-summary">
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground">Total P&L</div>
            <div 
              className={`text-xl font-bold font-mono ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}
              data-testid="text-total-pnl"
            >
              {formatCurrency(totalPnL)}
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground">Today's P&L</div>
            <div 
              className={`text-lg font-bold font-mono ${todayPnL >= 0 ? 'text-success' : 'text-destructive'}`}
              data-testid="text-today-pnl"
            >
              {formatCurrency(todayPnL)}
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground">Win Rate</div>
            <div className="text-lg font-bold font-mono" data-testid="text-win-rate">
              {winRate}%
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground">Total Trades</div>
            <div className="text-lg font-bold font-mono" data-testid="text-total-trades">
              {totalTradesCount}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Positions */}
      <Card data-testid="card-active-positions">
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {!activeTrades || activeTrades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active positions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTrades.map((trade) => (
                <div 
                  key={trade.id}
                  className="p-3 border border-border rounded-lg"
                  data-testid={`active-position-${trade.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {trade.action === 'BUY' ? 
                        <TrendingUp className="text-success" size={16} /> : 
                        <TrendingDown className="text-destructive" size={16} />
                      }
                      <span className="font-medium text-sm">{trade.instrument}</span>
                      <Badge className={trade.action === 'BUY' ? 'bg-success' : 'bg-destructive'}>
                        {trade.action}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCloseTrade(trade.id)}
                      disabled={closeTradeMutation.isPending}
                      data-testid={`button-close-position-${trade.id}`}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Qty</div>
                      <div className="font-mono">{trade.quantity}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Price</div>
                      <div className="font-mono">₹{parseFloat(trade.entryPrice).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">P&L</div>
                      <div className={`font-mono ${parseFloat(trade.pnl) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(parseFloat(trade.pnl))}
                      </div>
                    </div>
                  </div>
                  
                  {(trade.stopLoss || trade.target) && (
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      {trade.stopLoss && (
                        <div>
                          <div className="text-muted-foreground">SL</div>
                          <div className="font-mono text-destructive">₹{parseFloat(trade.stopLoss).toFixed(2)}</div>
                        </div>
                      )}
                      {trade.target && (
                        <div>
                          <div className="text-muted-foreground">Target</div>
                          <div className="font-mono text-success">₹{parseFloat(trade.target).toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Trade History */}
      <Card data-testid="card-trade-history">
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {!trades || trades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No trading history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trades.slice(0, 5).map((trade) => (
                <div 
                  key={trade.id}
                  className="flex items-center justify-between p-2 bg-muted/20 rounded text-sm"
                  data-testid={`trade-history-${trade.id}`}
                >
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(trade.status)}>
                      {trade.status.replace('_', ' ')}
                    </Badge>
                    <span className="font-mono text-xs">{trade.instrument}</span>
                  </div>
                  <div className={`font-mono ${parseFloat(trade.pnl) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(parseFloat(trade.pnl))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
