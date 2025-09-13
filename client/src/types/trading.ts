export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
}

export interface TechnicalIndicator {
  name: string;
  value: number | string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  color: 'success' | 'destructive' | 'warning';
}

export interface TradingSignal {
  id: string;
  instrument: string;
  signalType: 'BUY' | 'SELL';
  entryPrice: string;
  targetPrice: string | null;
  stopLoss: string | null;
  status: 'ACTIVE' | 'TARGET_HIT' | 'SL_HIT' | 'EXPIRED';
  reasoning: string | null;
  confidence: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaperTrade {
  id: string;
  userId: string | null;
  instrument: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: string;
  exitPrice: string | null;
  stopLoss: string | null;
  target: string | null;
  status: 'OPEN' | 'CLOSED' | 'SL_HIT' | 'TARGET_HIT';
  pnl: string;
  createdAt: string;
  closedAt: string | null;
}

export interface OptionChainData {
  id: string;
  underlying: string;
  expiry: string;
  strike: string;
  callLtp: string | null;
  putLtp: string | null;
  callOi: number | null;
  putOi: number | null;
  callVolume: number | null;
  putVolume: number | null;
  callIv: string | null;
  putIv: string | null;
}

export interface AIAnalysis {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  signals: Array<{
    type: 'BUY' | 'SELL';
    instrument: string;
    entryPrice: number;
    targetPrice: number;
    stopLoss: number;
    reasoning: string;
  }>;
  marketInsights: string;
  recommendations: string;
}

export interface ScreenedStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
  volatility: number;
  aiScore: number;
}

export type TabType = 'dashboard' | 'signals' | 'options' | 'paper-trading' | 'screener';

export interface WebSocketMessage {
  type: 'MARKET_DATA' | 'MARKET_DATA_UPDATE' | 'NEW_SIGNAL' | 'SIGNAL_UPDATE';
  data: any;
}
