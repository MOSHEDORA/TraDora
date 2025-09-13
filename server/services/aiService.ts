import { TechnicalIndicators, MarketData } from "@shared/schema";

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface AIAnalysis {
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

export class AIService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found. AI analysis will use fallback logic.');
    }
  }

  async analyzeMarket(
    marketData: MarketData[],
    technicalIndicators: Record<string, any>,
    optionData?: any
  ): Promise<AIAnalysis> {
    if (!this.apiKey) {
      return this.generateFallbackAnalysis(marketData, technicalIndicators);
    }

    try {
      const prompt = this.buildAnalysisPrompt(marketData, technicalIndicators, optionData);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000',
          'X-Title': 'TradePro Analytics'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            {
              role: 'system',
              content: `You are a professional intraday and scalping trader specializing in Indian markets (Nifty, Bank Nifty, Sensex). 
              You analyze market data, technical indicators, and provide actionable trading signals with specific entry, target, and stop-loss levels.
              Always provide reasoning for your signals and maintain a minimum target of ₹1000 daily profit through strategic trades.
              Respond in JSON format with sentiment, confidence, signals array, marketInsights, and recommendations.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in AI response');
      }

      try {
        const analysis = JSON.parse(content);
        return this.validateAndNormalizeAnalysis(analysis);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        return this.generateFallbackAnalysis(marketData, technicalIndicators);
      }

    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.generateFallbackAnalysis(marketData, technicalIndicators);
    }
  }

  private buildAnalysisPrompt(
    marketData: MarketData[],
    technicalIndicators: Record<string, any>,
    optionData?: any
  ): string {
    const niftyData = marketData.find(d => d.symbol === 'NIFTY');
    const bankNiftyData = marketData.find(d => d.symbol === 'BANKNIFTY');
    const sensexData = marketData.find(d => d.symbol === 'SENSEX');

    return `
Analyze the current Indian market conditions and provide trading signals:

MARKET DATA:
- Nifty 50: ₹${niftyData?.price} (${niftyData?.changePercent}%), Volume: ${niftyData?.volume}
- Bank Nifty: ₹${bankNiftyData?.price} (${bankNiftyData?.changePercent}%), Volume: ${bankNiftyData?.volume}  
- Sensex: ₹${sensexData?.price} (${sensexData?.changePercent}%), Volume: ${sensexData?.volume}

TECHNICAL INDICATORS:
${JSON.stringify(technicalIndicators, null, 2)}

OPTION DATA:
${optionData ? JSON.stringify(optionData, null, 2) : 'Not available'}

Provide analysis with specific BUY/SELL signals for options or futures that can generate ₹1000+ profit today.
Focus on scalping and intraday opportunities with clear entry, target, and stop-loss levels.

Return response in this exact JSON format:
{
  "sentiment": "BULLISH|BEARISH|NEUTRAL",
  "confidence": 85,
  "signals": [
    {
      "type": "BUY|SELL",
      "instrument": "BANKNIFTY 44400 CE",
      "entryPrice": 142.75,
      "targetPrice": 165.00,
      "stopLoss": 125.00,
      "reasoning": "Technical analysis reasoning"
    }
  ],
  "marketInsights": "Current market analysis and key levels",
  "recommendations": "Strategy recommendations for today"
}
`;
  }

  private validateAndNormalizeAnalysis(analysis: any): AIAnalysis {
    const validSentiments = ['BULLISH', 'BEARISH', 'NEUTRAL'];
    
    return {
      sentiment: validSentiments.includes(analysis.sentiment) ? analysis.sentiment : 'NEUTRAL',
      confidence: Math.max(0, Math.min(100, analysis.confidence || 50)),
      signals: Array.isArray(analysis.signals) ? analysis.signals.slice(0, 5) : [],
      marketInsights: analysis.marketInsights || 'Market analysis not available',
      recommendations: analysis.recommendations || 'No specific recommendations'
    };
  }

  private generateFallbackAnalysis(
    marketData: MarketData[],
    technicalIndicators: Record<string, any>
  ): AIAnalysis {
    return {
      sentiment: 'NEUTRAL',
      confidence: 0,
      signals: [],
      marketInsights: 'No Data Available - AI analysis requires OpenRouter API key',
      recommendations: 'No Data Available - Please configure AI service API key for analysis'
    };
  }

  async generateTradingSignal(
    instrument: string,
    currentPrice: number,
    technicalData: any
  ): Promise<{ type: 'BUY' | 'SELL'; entryPrice: number; targetPrice: number; stopLoss: number; reasoning: string } | null> {
    
    if (!this.apiKey) {
      return this.generateFallbackSignal(instrument, currentPrice, technicalData);
    }

    try {
      const prompt = `
Generate a specific trading signal for ${instrument} at current price ₹${currentPrice}.

Technical Data: ${JSON.stringify(technicalData)}

Provide a BUY or SELL signal with specific entry, target, and stop-loss levels that can generate at least ₹500 profit per lot.

Return in JSON format:
{
  "type": "BUY|SELL",
  "entryPrice": number,
  "targetPrice": number,
  "stopLoss": number,
  "reasoning": "Technical analysis reasoning"
}
`;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            {
              role: 'system',
              content: 'You are a professional options trader. Provide specific trading signals with clear reasoning.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('AI signal generation failed');
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        const signal = JSON.parse(content);
        return signal;
      }
    } catch (error) {
      console.error('AI signal generation error:', error);
    }

    return this.generateFallbackSignal(instrument, currentPrice, technicalData);
  }

  private generateFallbackSignal(instrument: string, currentPrice: number, technicalData: any) {
    // No fallback signals - return null when API is not available
    return null;
  }
}

export const aiService = new AIService();
