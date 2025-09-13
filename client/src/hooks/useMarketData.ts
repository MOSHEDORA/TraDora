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

  // Process technical indicators
  const technicalIndicators: TechnicalIndicator[] = technicalAnalysis ? 
    Object.entries(technicalAnalysis).flatMap(([symbol, data]: [string, any]) => [
      {
        name: `${symbol} VWAP`,
        value: data.vwap?.toFixed(2) || '0',
        signal: data.vwap > parseFloat(currentMarketData.find(d => d.symbol === symbol)?.price.toString() || '0') ? 'SELL' : 'BUY',
        color: data.vwap > parseFloat(currentMarketData.find(d => d.symbol === symbol)?.price.toString() || '0') ? 'destructive' : 'success'
      },
      {
        name: `${symbol} RSI`,
        value: data.rsi?.toFixed(2) || '50',
        signal: data.rsi > 70 ? 'SELL' : data.rsi < 30 ? 'BUY' : 'NEUTRAL',
        color: data.rsi > 70 ? 'destructive' : data.rsi < 30 ? 'success' : 'warning'
      },
      {
        name: `${symbol} MACD`,
        value: data.macd?.macd?.toFixed(2) || '0',
        signal: data.macd?.macd > data.macd?.signal ? 'BUY' : 'SELL',
        color: data.macd?.macd > data.macd?.signal ? 'success' : 'destructive'
      },
      {
        name: `${symbol} Supertrend`,
        value: data.supertrend?.value?.toFixed(2) || '0',
        signal: data.supertrend?.direction === 'LONG' ? 'BUY' : 'SELL',
        color: data.supertrend?.direction === 'LONG' ? 'success' : 'destructive'
      }
    ]) : [];

  return {
    marketData: currentMarketData,
    technicalIndicators,
    aiAnalysis,
    isLoading: marketLoading || technicalLoading || aiLoading,
    connectionStatus: lastMessage ? 'connected' : 'disconnected'
  };
}
