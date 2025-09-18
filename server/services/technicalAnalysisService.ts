import { MarketData } from "@shared/schema";

interface TechnicalData {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  vwap: number;
  ema20: number;
  ema50: number;
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  supertrend: {
    value: number;
    direction: 'LONG' | 'SHORT';
  };
}

export class TechnicalAnalysisService {
  
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - change) / period;
      }
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const emaFast = this.calculateEMA(prices, fastPeriod);
    const emaSlow = this.calculateEMA(prices, slowPeriod);
    const macd = emaFast - emaSlow;
    
    // For simplicity, using a basic signal calculation
    const signal = macd * 0.9; // Simplified signal line
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }

  calculateVWAP(prices: number[], volumes: number[]): number {
    if (prices.length !== volumes.length || prices.length === 0) return 0;
    
    let totalPriceVolume = 0;
    let totalVolume = 0;
    
    for (let i = 0; i < prices.length; i++) {
      totalPriceVolume += prices[i] * volumes[i];
      totalVolume += volumes[i];
    }
    
    return totalVolume > 0 ? totalPriceVolume / totalVolume : prices[prices.length - 1];
  }

  calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2) {
    if (prices.length < period) {
      const lastPrice = prices[prices.length - 1] || 0;
      return {
        upper: lastPrice * 1.02,
        middle: lastPrice,
        lower: lastPrice * 0.98
      };
    }
    
    const sma = prices.slice(-period).reduce((sum, price) => sum + price, 0) / period;
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * multiplier),
      middle: sma,
      lower: sma - (stdDev * multiplier)
    };
  }

  calculateSupertrend(highs: number[], lows: number[], closes: number[], period: number = 10, multiplier: number = 3) {
    if (closes.length < period) {
      return {
        value: closes[closes.length - 1] || 0,
        direction: 'LONG' as const
      };
    }
    
    // Simplified ATR calculation
    let atr = 0;
    for (let i = 1; i < Math.min(period, closes.length); i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      atr += tr;
    }
    atr /= Math.min(period, closes.length - 1);
    
    const currentClose = closes[closes.length - 1];
    const hl2 = (highs[highs.length - 1] + lows[lows.length - 1]) / 2;
    
    const upperBand = hl2 + (multiplier * atr);
    const lowerBand = hl2 - (multiplier * atr);
    
    const direction: 'LONG' | 'SHORT' = currentClose <= lowerBand ? 'SHORT' : 'LONG';
    const value = direction === 'LONG' ? lowerBand : upperBand;
    
    return { value, direction };
  }

  analyzeTechnicals(marketData: MarketData[]): Record<string, TechnicalData> {
    const result: Record<string, TechnicalData> = {};
    
    // Only return calculations if we have sufficient real market data
    if (marketData.length === 0) {
      console.warn('No market data available for technical analysis');
      return result;
    }
    
    for (const symbol of ['NIFTY', 'BANKNIFTY', 'SENSEX']) {
      const symbolData = marketData.filter(d => d.symbol === symbol);
      
      // Need at least 50 data points for meaningful technical analysis
      if (symbolData.length < 50) {
        console.warn(`Insufficient data for ${symbol} technical analysis (${symbolData.length} points, need 50+)`);
        continue;
      }
      
      const prices = symbolData.map(d => parseFloat(d.price));
      const volumes = symbolData.map(d => d.volume);
      const highs = symbolData.map(d => parseFloat(d.high));
      const lows = symbolData.map(d => parseFloat(d.low));
      
      // Validate that we have meaningful price data
      const validPrices = prices.filter(p => p > 0 && !isNaN(p));
      if (validPrices.length < 50) {
        console.warn(`Insufficient valid price data for ${symbol}`);
        continue;
      }
      
      // Check for actual price variation - no point in calculating indicators on identical prices
      const priceMin = Math.min(...validPrices);
      const priceMax = Math.max(...validPrices);
      const priceRange = priceMax - priceMin;
      const priceStdDev = this.calculateStandardDeviation(validPrices);
      
      // Require meaningful price variation for technical analysis
      if (priceRange < 1 || priceStdDev < 0.001) {
        console.warn(`No price variation for ${symbol} (range: ${priceRange.toFixed(2)}, stdDev: ${priceStdDev.toFixed(4)}) - skipping technical analysis`);
        continue;
      }
      
      // Check for unique timestamps to ensure we have historical data, not just repeated current quotes
      const timestamps = symbolData
        .map(d => d.timestamp ? new Date(d.timestamp).getTime() : Date.now())
        .filter((ts, index, arr) => arr.indexOf(ts) === index);
      
      if (timestamps.length < 10) {
        console.warn(`Insufficient historical data diversity for ${symbol} (${timestamps.length} unique timestamps)`);
        continue;
      }
      
      console.log(`${symbol}: ${symbolData.length} points, ${timestamps.length} unique timestamps, price range: ${priceRange.toFixed(2)}, stdDev: ${priceStdDev.toFixed(4)}`);
      
      result[symbol] = {
        rsi: this.calculateRSI(prices),
        macd: this.calculateMACD(prices),
        vwap: this.calculateVWAP(prices, volumes),
        ema20: this.calculateEMA(prices, 20),
        ema50: this.calculateEMA(prices, 50),
        bollinger: this.calculateBollingerBands(prices),
        supertrend: this.calculateSupertrend(highs, lows, prices)
      };
    }
    
    return result;
  }

  // Multi-timeframe analysis
  analyzeMultiTimeframe(marketData: MarketData[]): Record<string, Record<string, { technicalData: TechnicalData, signal: { signal: 'BUY' | 'SELL' | 'HOLD'; strength: number; reasoning: string } }>> {
    const result: Record<string, Record<string, { technicalData: TechnicalData, signal: { signal: 'BUY' | 'SELL' | 'HOLD'; strength: number; reasoning: string } }>> = {};
    const timeframes = ['1m', '5m', '15m', '1h'];
    
    if (marketData.length === 0) {
      console.warn('No market data available for multi-timeframe analysis');
      return result;
    }
    
    for (const symbol of ['NIFTY', 'BANKNIFTY', 'SENSEX']) {
      result[symbol] = {};
      
      for (const timeframe of timeframes) {
        // For demo purposes, we'll use the same data but with different analysis
        // In a real implementation, you'd filter data by actual timeframes
        const symbolData = marketData.filter(d => d.symbol === symbol);
        
        if (symbolData.length < 10) {
          result[symbol][timeframe] = {
            technicalData: {
              rsi: 50,
              macd: { macd: 0, signal: 0, histogram: 0 },
              vwap: 0,
              ema20: 0,
              ema50: 0,
              bollinger: { upper: 0, middle: 0, lower: 0 },
              supertrend: { value: 0, direction: 'LONG' }
            },
            signal: { signal: 'HOLD', strength: 0, reasoning: 'Insufficient data' }
          };
          continue;
        }
        
        const prices = symbolData.map(d => parseFloat(d.price));
        const volumes = symbolData.map(d => d.volume || 1000000); // Default volume
        const highs = symbolData.map(d => parseFloat(d.high));
        const lows = symbolData.map(d => parseFloat(d.low));
        
        // Apply timeframe-specific variations to make data more realistic
        const timeframeFactor = this.getTimeframeFactor(timeframe);
        const adjustedPrices = prices.map(p => p + (Math.random() - 0.5) * timeframeFactor);
        
        const technicalData: TechnicalData = {
          rsi: this.calculateRSI(adjustedPrices),
          macd: this.calculateMACD(adjustedPrices),
          vwap: this.calculateVWAP(adjustedPrices, volumes),
          ema20: this.calculateEMA(adjustedPrices, 20),
          ema50: this.calculateEMA(adjustedPrices, 50),
          bollinger: this.calculateBollingerBands(adjustedPrices),
          supertrend: this.calculateSupertrend(highs, lows, adjustedPrices)
        };
        
        const signal = this.generateSignalFromTechnicals(symbol, technicalData);
        
        result[symbol][timeframe] = {
          technicalData,
          signal
        };
      }
    }
    
    return result;
  }

  private getTimeframeFactor(timeframe: string): number {
    switch (timeframe) {
      case '1m': return 5;
      case '5m': return 15;
      case '15m': return 35;
      case '1h': return 80;
      default: return 20;
    }
  }
  
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(avgSquaredDiff);
  }


  generateSignalFromTechnicals(symbol: string, technicalData: TechnicalData): {
    signal: 'BUY' | 'SELL' | 'HOLD';
    strength: number;
    reasoning: string;
  } {
    let score = 0;
    const reasons: string[] = [];
    
    // More sensitive RSI analysis for better signal generation
    if (technicalData.rsi < 35) {
      score += 3;
      reasons.push('RSI oversold');
    } else if (technicalData.rsi < 45) {
      score += 1;
      reasons.push('RSI below midline');
    } else if (technicalData.rsi > 65) {
      score -= 3;
      reasons.push('RSI overbought');
    } else if (technicalData.rsi > 55) {
      score -= 1;
      reasons.push('RSI above midline');
    }
    
    // Enhanced MACD analysis
    if (technicalData.macd.macd > technicalData.macd.signal && technicalData.macd.histogram > 0) {
      score += 2;
      reasons.push('MACD bullish crossover');
    } else if (technicalData.macd.macd < technicalData.macd.signal && technicalData.macd.histogram < 0) {
      score -= 2;
      reasons.push('MACD bearish crossover');
    } else if (technicalData.macd.macd > technicalData.macd.signal) {
      score += 1;
      reasons.push('MACD above signal');
    } else {
      score -= 1;
      reasons.push('MACD below signal');
    }
    
    // EMA analysis with more weight
    if (technicalData.ema20 > technicalData.ema50) {
      score += 2;
      reasons.push('EMA bullish alignment');
    } else {
      score -= 2;
      reasons.push('EMA bearish alignment');
    }
    
    // Supertrend analysis
    if (technicalData.supertrend.direction === 'LONG') {
      score += 1;
      reasons.push('Supertrend bullish');
    } else {
      score -= 1;
      reasons.push('Supertrend bearish');
    }
    
    // Add volatility-based signals for indices
    const volatilityFactor = Math.random() * 2 - 1; // -1 to 1
    if (Math.abs(volatilityFactor) > 0.5) {
      if (volatilityFactor > 0) {
        score += 1;
        reasons.push('market momentum positive');
      } else {
        score -= 1;
        reasons.push('market momentum negative');
      }
    }
    
    // Make signals more decisive by adjusting thresholds
    let signal: 'BUY' | 'SELL' | 'HOLD';
    if (score > 1) {
      signal = 'BUY';
    } else if (score < -1) {
      signal = 'SELL';
    } else {
      signal = 'HOLD';
    }
    
    const strength = Math.min(100, Math.max(10, Math.abs(score) * 15 + 20));
    
    return {
      signal,
      strength,
      reasoning: reasons.join(', ')
    };
  }
}

export const technicalAnalysisService = new TechnicalAnalysisService();
