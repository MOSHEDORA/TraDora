import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { MarketQuote, TechnicalIndicator, AIAnalysis } from '@/types/trading';
import { useWebSocket } from './useWebSocket';

export function useMarketData() {
  const [realtimeData, setRealtimeData] = useState<MarketQuote[]>([]);
  const { lastMessage } = useWebSocket('/ws');

  const { data: marketData, isLoading: marketLoading } = useQuery<MarketQuote[]>({
    queryKey: ['/api/market-data'],
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  });

  const { data: technicalAnalysis, isLoading: technicalLoading } = useQuery({
    queryKey: ['/api/technical-analysis'],
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: aiAnalysis, isLoading: aiLoading } = useQuery<AIAnalysis>({
    queryKey: ['/api/ai-analysis'],
    refetchInterval: 120000, // Refetch every 2 minutes
  });

  // Handle WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'MARKET_DATA' || lastMessage.type === 'MARKET_DATA_UPDATE') {
        setRealtimeData(lastMessage.data);
      }
    }
  }, [lastMessage]);

  // Use realtime data if available, fallback to API data
  const currentMarketData = realtimeData.length > 0 ? realtimeData : marketData || [];

  // Process technical indicators - only show real data, no fallbacks
  const technicalIndicators: TechnicalIndicator[] = technicalAnalysis ? 
    Object.entries(technicalAnalysis).flatMap(([symbol, data]: [string, any]) => {
      const currentPrice = parseFloat(currentMarketData.find(d => d.symbol === symbol)?.price.toString() || '0');
      
      // Only include indicators that have valid data
      const indicators = [];
      
      if (data.vwap && currentPrice > 0) {
        indicators.push({
          name: `${symbol} VWAP`,
          value: data.vwap.toFixed(2),
          signal: (data.vwap > currentPrice ? 'SELL' : 'BUY') as 'BUY' | 'SELL' | 'NEUTRAL',
          color: (data.vwap > currentPrice ? 'destructive' : 'success') as 'success' | 'destructive' | 'warning'
        });
      }
      
      if (data.rsi) {
        indicators.push({
          name: `${symbol} RSI`,
          value: data.rsi.toFixed(2),
          signal: (data.rsi > 70 ? 'SELL' : data.rsi < 30 ? 'BUY' : 'NEUTRAL') as 'BUY' | 'SELL' | 'NEUTRAL',
          color: (data.rsi > 70 ? 'destructive' : data.rsi < 30 ? 'success' : 'warning') as 'success' | 'destructive' | 'warning'
        });
      }
      
      if (data.macd?.macd && data.macd?.signal) {
        indicators.push({
          name: `${symbol} MACD`,
          value: `${data.macd.macd.toFixed(2)} | ${data.macd.signal.toFixed(2)}`,
          signal: (data.macd.macd > data.macd.signal ? 'BUY' : 'SELL') as 'BUY' | 'SELL' | 'NEUTRAL',
          color: (data.macd.macd > data.macd.signal ? 'success' : 'destructive') as 'success' | 'destructive' | 'warning'
        });
      }
      
      if (data.ema20 && data.ema50) {
        indicators.push({
          name: `${symbol} EMA 20/50`,
          value: `${data.ema20.toFixed(2)} / ${data.ema50.toFixed(2)}`,
          signal: (data.ema20 > data.ema50 ? 'BUY' : 'SELL') as 'BUY' | 'SELL' | 'NEUTRAL',
          color: (data.ema20 > data.ema50 ? 'success' : 'destructive') as 'success' | 'destructive' | 'warning'
        });
      }
      
      if (data.bollinger?.upper && data.bollinger?.middle && data.bollinger?.lower && currentPrice > 0) {
        indicators.push({
          name: `${symbol} Bollinger`,
          value: `${data.bollinger.upper.toFixed(2)} | ${data.bollinger.middle.toFixed(2)} | ${data.bollinger.lower.toFixed(2)}`,
          signal: (currentPrice > data.bollinger.upper ? 'SELL' : currentPrice < data.bollinger.lower ? 'BUY' : 'NEUTRAL') as 'BUY' | 'SELL' | 'NEUTRAL',
          color: (currentPrice > data.bollinger.upper ? 'destructive' : currentPrice < data.bollinger.lower ? 'success' : 'warning') as 'success' | 'destructive' | 'warning'
        });
      }
      
      if (data.supertrend?.value && data.supertrend?.direction) {
        indicators.push({
          name: `${symbol} Supertrend`,
          value: data.supertrend.value.toFixed(2),
          signal: (data.supertrend.direction === 'LONG' ? 'BUY' : 'SELL') as 'BUY' | 'SELL' | 'NEUTRAL',
          color: (data.supertrend.direction === 'LONG' ? 'success' : 'destructive') as 'success' | 'destructive' | 'warning'
        });
      }
      
      return indicators;
    }) : [];

  return {
    marketData: currentMarketData,
    technicalIndicators,
    aiAnalysis,
    isLoading: marketLoading || technicalLoading || aiLoading,
    connectionStatus: lastMessage ? 'connected' : 'disconnected'
  };
}
