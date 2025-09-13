import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { AIAnalysis } from "@/types/trading";

interface AIInsightsProps {
  analysis: AIAnalysis | undefined;
  isConnected: boolean;
}

export function AIInsights({ analysis, isConnected }: AIInsightsProps) {
  const getSentimentColor = (sentiment: AIAnalysis['sentiment']) => {
    switch (sentiment) {
      case 'BULLISH': return 'bg-success text-success-foreground';
      case 'BEARISH': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-warning text-warning-foreground';
    }
  };

  const getSentimentIcon = (sentiment: AIAnalysis['sentiment']) => {
    switch (sentiment) {
      case 'BULLISH': return TrendingUp;
      case 'BEARISH': return AlertTriangle;
      default: return Target;
    }
  };

  if (!analysis) {
    return (
      <Card data-testid="card-ai-insights">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="text-primary" size={20} />
            <span>AI Market Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading AI analysis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const SentimentIcon = getSentimentIcon(analysis.sentiment);

  return (
    <Card data-testid="card-ai-insights">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center space-x-2">
          <Brain className="text-primary" size={20} />
          <span>AI Market Analysis</span>
        </CardTitle>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-destructive'}`}></div>
          <span>OpenRouter API {isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${
              analysis.sentiment === 'BULLISH' ? 'bg-success/10 border-success/20' :
              analysis.sentiment === 'BEARISH' ? 'bg-destructive/10 border-destructive/20' :
              'bg-warning/10 border-warning/20'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <SentimentIcon size={20} className={
                  analysis.sentiment === 'BULLISH' ? 'text-success' :
                  analysis.sentiment === 'BEARISH' ? 'text-destructive' :
                  'text-warning'
                } />
                <h4 className={`font-semibold ${
                  analysis.sentiment === 'BULLISH' ? 'text-success' :
                  analysis.sentiment === 'BEARISH' ? 'text-destructive' :
                  'text-warning'
                }`}>
                  Market Sentiment: {analysis.sentiment}
                </h4>
                <Badge 
                  className={getSentimentColor(analysis.sentiment)}
                  data-testid="badge-ai-confidence"
                >
                  {analysis.confidence}%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-market-insights">
                {analysis.marketInsights}
              </p>
            </div>
            
            {analysis.signals.length > 0 && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">AI Trading Signal</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <Badge className={analysis.signals[0].type === 'BUY' ? 'bg-success' : 'bg-destructive'}>
                      {analysis.signals[0].type}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Instrument:</span>
                    <span className="font-mono">{analysis.signals[0].instrument}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entry:</span>
                    <span className="font-mono">₹{analysis.signals[0].entryPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target:</span>
                    <span className="font-mono text-success">₹{analysis.signals[0].targetPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stop Loss:</span>
                    <span className="font-mono text-destructive">₹{analysis.signals[0].stopLoss}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Recommendation</h4>
              <p className="text-sm text-muted-foreground" data-testid="text-ai-recommendations">
                {analysis.recommendations}
              </p>
            </div>
            
            {analysis.signals.length > 0 && (
              <div className="p-4 bg-muted/20 rounded-lg">
                <h4 className="font-semibold mb-2">Signal Reasoning</h4>
                <p className="text-sm text-muted-foreground">
                  {analysis.signals[0].reasoning}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
