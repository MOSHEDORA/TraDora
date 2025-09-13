import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Zap } from "lucide-react";
import { SignalCard } from "./SignalCard";
import { TradingSignal } from "@/types/trading";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";

export function SignalsPanel() {
  const [activeSignals, setActiveSignals] = useState<TradingSignal[]>([]);
  const [signalHistory, setSignalHistory] = useState<TradingSignal[]>([]);
  const { lastMessage } = useWebSocket('/ws');
  const { toast } = useToast();

  const { data: signals, isLoading, refetch } = useQuery<TradingSignal[]>({
    queryKey: ['/api/trading-signals'],
    refetchInterval: 30000,
  });

  // Separate active signals from history
  useEffect(() => {
    if (signals) {
      const active = signals.filter(signal => signal.status === 'ACTIVE');
      const history = signals.filter(signal => signal.status !== 'ACTIVE');
      setActiveSignals(active);
      setSignalHistory(history);
    }
  }, [signals]);

  // Handle WebSocket updates for new signals
  useEffect(() => {
    if (lastMessage?.type === 'NEW_SIGNAL') {
      const newSignal = lastMessage.data as TradingSignal;
      setActiveSignals(prev => [newSignal, ...prev]);
      
      toast({
        title: "New Trading Signal",
        description: `${newSignal.signalType} ${newSignal.instrument} at ₹${newSignal.entryPrice}`,
      });
    } else if (lastMessage?.type === 'SIGNAL_UPDATE') {
      const updatedSignal = lastMessage.data as TradingSignal;
      
      if (updatedSignal.status === 'ACTIVE') {
        setActiveSignals(prev => 
          prev.map(signal => signal.id === updatedSignal.id ? updatedSignal : signal)
        );
      } else {
        setActiveSignals(prev => prev.filter(signal => signal.id !== updatedSignal.id));
        setSignalHistory(prev => [updatedSignal, ...prev]);
      }
    }
  }, [lastMessage, toast]);

  const handleSignalAction = async (signalId: string, action: 'execute' | 'dismiss') => {
    try {
      const signal = activeSignals.find(s => s.id === signalId);
      if (!signal) return;

      if (action === 'execute') {
        // Execute as paper trade
        const response = await fetch('/api/paper-trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instrument: signal.instrument,
            action: signal.signalType,
            quantity: 25, // Default quantity
            entryPrice: signal.entryPrice,
            stopLoss: signal.stopLoss,
            target: signal.targetPrice,
          }),
        });

        if (response.ok) {
          toast({
            title: "Paper Trade Executed",
            description: `${signal.signalType} ${signal.instrument} added to portfolio`,
          });
        }
      }

      // Update signal status
      await fetch(`/api/trading-signals/${signalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'execute' ? 'EXECUTED' : 'DISMISSED',
        }),
      });

      refetch();
    } catch (error) {
      console.error('Signal action error:', error);
      toast({
        title: "Error",
        description: "Failed to process signal action",
        variant: "destructive",
      });
    }
  };

  const generateNewSignal = async () => {
    try {
      // No hardcoded values - signal generation disabled without real data
      toast({
        title: "No Data Available",
        description: "Signal generation requires real-time market data",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Generate signal error:', error);
      toast({
        title: "Error",
        description: "Failed to generate new signal",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading trading signals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="signals-panel">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Live Trading Signals</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-muted-foreground">AI Engine Active</span>
          </div>
          <Button
            onClick={generateNewSignal}
            className="bg-primary text-primary-foreground"
            data-testid="button-generate-signal"
          >
            <Zap size={16} className="mr-2" />
            Generate Signal
          </Button>
          <Button
            onClick={() => refetch()}
            variant="outline"
            data-testid="button-refresh-signals"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Signals */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <span>Active Signals</span>
          <Badge variant="outline" data-testid="badge-active-signals-count">
            {activeSignals.length}
          </Badge>
        </h3>
        {activeSignals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No active signals at the moment</p>
              <p className="text-sm text-muted-foreground mt-2">
                AI is continuously monitoring markets for opportunities
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeSignals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                onAction={handleSignalAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Signal History */}
      <Card data-testid="card-signal-history">
        <CardHeader>
          <CardTitle>Recent Signals History</CardTitle>
        </CardHeader>
        <CardContent>
          {signalHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No signal history available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Time</th>
                    <th className="text-left py-3 px-4 font-semibold">Signal</th>
                    <th className="text-left py-3 px-4 font-semibold">Instrument</th>
                    <th className="text-left py-3 px-4 font-semibold">Entry</th>
                    <th className="text-left py-3 px-4 font-semibold">Target</th>
                    <th className="text-left py-3 px-4 font-semibold">SL</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {signalHistory.slice(0, 10).map((signal) => (
                    <tr 
                      key={signal.id} 
                      className="border-b border-border/50"
                      data-testid={`row-signal-history-${signal.id}`}
                    >
                      <td className="py-3 px-4 font-mono">
                        {new Date(signal.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={signal.signalType === 'BUY' ? 'bg-success' : 'bg-destructive'}>
                          {signal.signalType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono">{signal.instrument}</td>
                      <td className="py-3 px-4 font-mono">₹{signal.entryPrice}</td>
                      <td className="py-3 px-4 font-mono">{signal.targetPrice || '-'}</td>
                      <td className="py-3 px-4 font-mono">{signal.stopLoss || '-'}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(signal.status)}>
                          {signal.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono">{signal.confidence || '-'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusColor(status: TradingSignal['status']) {
  switch (status) {
    case 'TARGET_HIT': return 'bg-success text-success-foreground';
    case 'SL_HIT': return 'bg-destructive text-destructive-foreground';
    case 'EXPIRED': return 'bg-muted text-muted-foreground';
    default: return 'bg-warning text-warning-foreground';
  }
}
