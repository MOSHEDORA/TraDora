import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { TradingSignal } from "@/types/trading";

interface SignalCardProps {
  signal: TradingSignal;
  onAction?: (signalId: string, action: 'execute' | 'dismiss') => void;
}

export function SignalCard({ signal, onAction }: SignalCardProps) {
  const isActive = signal.status === 'ACTIVE';
  const isBuySignal = signal.signalType === 'BUY';
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: TradingSignal['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-primary text-primary-foreground';
      case 'TARGET_HIT': return 'bg-success text-success-foreground';
      case 'SL_HIT': return 'bg-destructive text-destructive-foreground';
      case 'EXPIRED': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`card-signal-${signal.id}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'animate-pulse' : ''} ${
              isBuySignal ? 'bg-success' : 'bg-destructive'
            }`}></div>
            <h3 className={`font-semibold ${isBuySignal ? 'text-success' : 'text-destructive'}`}>
              {signal.signalType} SIGNAL
            </h3>
            {isBuySignal ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
          <Badge 
            className={getStatusColor(signal.status)}
            data-testid={`badge-signal-status-${signal.id}`}
          >
            {signal.status.replace('_', ' ')}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Instrument:</span>
            <span className="font-semibold font-mono" data-testid={`text-signal-instrument-${signal.id}`}>
              {signal.instrument}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entry Price:</span>
            <span className="font-semibold font-mono" data-testid={`text-signal-entry-${signal.id}`}>
              ₹{signal.entryPrice}
            </span>
          </div>
          {signal.targetPrice && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target:</span>
              <span className="font-semibold font-mono text-success" data-testid={`text-signal-target-${signal.id}`}>
                ₹{signal.targetPrice}
              </span>
            </div>
          )}
          {signal.stopLoss && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stop Loss:</span>
              <span className="font-semibold font-mono text-destructive" data-testid={`text-signal-sl-${signal.id}`}>
                ₹{signal.stopLoss}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time:</span>
            <div className="flex items-center space-x-1">
              <Clock size={12} />
              <span className="font-mono text-sm" data-testid={`text-signal-time-${signal.id}`}>
                {formatTime(signal.createdAt)}
              </span>
            </div>
          </div>
          {signal.confidence && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confidence:</span>
              <Badge variant="outline" data-testid={`badge-signal-confidence-${signal.id}`}>
                {signal.confidence}%
              </Badge>
            </div>
          )}
        </div>
        
        {signal.reasoning && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground" data-testid={`text-signal-reasoning-${signal.id}`}>
              {signal.reasoning}
            </p>
          </div>
        )}
        
        {isActive && onAction && (
          <div className="mt-4 flex space-x-2">
            <Button
              size="sm"
              onClick={() => onAction(signal.id, 'execute')}
              data-testid={`button-execute-signal-${signal.id}`}
            >
              Execute Trade
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(signal.id, 'dismiss')}
              data-testid={`button-dismiss-signal-${signal.id}`}
            >
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
