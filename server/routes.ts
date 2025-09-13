import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { marketDataService } from "./services/marketDataService";
import { aiService } from "./services/aiService";
import { technicalAnalysisService } from "./services/technicalAnalysisService";
import { insertTradingSignalSchema, insertPaperTradeSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  // Broadcast function for real-time updates
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Market Data API
  app.get('/api/market-data', async (req, res) => {
    try {
      const symbols = ['NIFTY', 'BANKNIFTY', 'SENSEX'];
      const marketData = await marketDataService.getMarketData(symbols);
      
      // Save to storage
      for (const data of marketData) {
        await storage.saveMarketData(data);
      }
      
      // Broadcast real-time updates
      broadcast({ type: 'MARKET_DATA', data: marketData });
      
      res.json(marketData);
    } catch (error) {
      console.error('Market data fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch market data' });
    }
  });

  // Technical Analysis API
  app.get('/api/technical-analysis', async (req, res) => {
    try {
      const { symbol, timeframe = '5m' } = req.query;
      
      if (symbol) {
        const indicators = await storage.getTechnicalIndicators(symbol as string, timeframe as string);
        res.json(indicators);
      } else {
        // Get all symbols
        const marketData = await storage.getMarketData();
        const technicals = technicalAnalysisService.analyzeTechnicals(marketData);
        
        // Save technical indicators
        for (const [sym, data] of Object.entries(technicals)) {
          await storage.saveTechnicalIndicators({
            symbol: sym,
            timeframe: timeframe as string,
            indicators: data
          });
        }
        
        res.json(technicals);
      }
    } catch (error) {
      console.error('Technical analysis error:', error);
      res.status(500).json({ error: 'Failed to calculate technical indicators' });
    }
  });

  // AI Analysis API
  app.post('/api/ai-analysis', async (req, res) => {
    try {
      const marketData = await storage.getMarketData();
      const technicals = technicalAnalysisService.analyzeTechnicals(marketData);
      
      const analysis = await aiService.analyzeMarket(marketData, technicals);
      
      res.json(analysis);
    } catch (error) {
      console.error('AI analysis error:', error);
      res.status(500).json({ error: 'Failed to generate AI analysis' });
    }
  });

  // Trading Signals API
  app.get('/api/trading-signals', async (req, res) => {
    try {
      const { active } = req.query;
      const signals = active === 'true' 
        ? await storage.getActiveTradingSignals()
        : await storage.getTradingSignals();
      
      res.json(signals);
    } catch (error) {
      console.error('Trading signals fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch trading signals' });
    }
  });

  app.post('/api/trading-signals', async (req, res) => {
    try {
      const signalData = insertTradingSignalSchema.parse(req.body);
      const signal = await storage.createTradingSignal(signalData);
      
      // Broadcast new signal
      broadcast({ type: 'NEW_SIGNAL', data: signal });
      
      res.json(signal);
    } catch (error) {
      console.error('Create trading signal error:', error);
      res.status(400).json({ error: 'Failed to create trading signal' });
    }
  });

  app.patch('/api/trading-signals/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const signal = await storage.updateTradingSignal(id, updates);
      if (!signal) {
        return res.status(404).json({ error: 'Signal not found' });
      }
      
      // Broadcast signal update
      broadcast({ type: 'SIGNAL_UPDATE', data: signal });
      
      res.json(signal);
    } catch (error) {
      console.error('Update trading signal error:', error);
      res.status(400).json({ error: 'Failed to update trading signal' });
    }
  });

  // Generate AI Signal API
  app.post('/api/generate-signal', async (req, res) => {
    try {
      const { instrument, currentPrice } = req.body;
      
      const marketData = await storage.getMarketData();
      const technicals = technicalAnalysisService.analyzeTechnicals(marketData);
      
      const aiSignal = await aiService.generateTradingSignal(instrument, currentPrice, technicals);
      
      if (aiSignal) {
        const signal = await storage.createTradingSignal({
          instrument,
          signalType: aiSignal.type,
          entryPrice: aiSignal.entryPrice.toString(),
          targetPrice: aiSignal.targetPrice.toString(),
          stopLoss: aiSignal.stopLoss.toString(),
          reasoning: aiSignal.reasoning,
          confidence: 75
        });
        
        broadcast({ type: 'NEW_SIGNAL', data: signal });
        res.json(signal);
      } else {
        res.status(400).json({ error: 'Could not generate signal for this instrument' });
      }
    } catch (error) {
      console.error('Generate signal error:', error);
      res.status(500).json({ error: 'Failed to generate signal' });
    }
  });

  // Paper Trading API
  app.get('/api/paper-trades', async (req, res) => {
    try {
      const { userId, active } = req.query;
      const trades = active === 'true'
        ? await storage.getActivePaperTrades(userId as string)
        : await storage.getPaperTrades(userId as string);
      
      res.json(trades);
    } catch (error) {
      console.error('Paper trades fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch paper trades' });
    }
  });

  app.post('/api/paper-trades', async (req, res) => {
    try {
      const tradeData = insertPaperTradeSchema.parse(req.body);
      const trade = await storage.createPaperTrade(tradeData);
      
      res.json(trade);
    } catch (error) {
      console.error('Create paper trade error:', error);
      res.status(400).json({ error: 'Failed to create paper trade' });
    }
  });

  app.patch('/api/paper-trades/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Calculate P&L if closing trade
      if (updates.exitPrice && updates.status === 'CLOSED') {
        const trade = await storage.getPaperTrades();
        const currentTrade = trade.find(t => t.id === id);
        
        if (currentTrade) {
          const entryPrice = parseFloat(currentTrade.entryPrice);
          const exitPrice = parseFloat(updates.exitPrice);
          const quantity = currentTrade.quantity;
          
          let pnl = 0;
          if (currentTrade.action === 'BUY') {
            pnl = (exitPrice - entryPrice) * quantity;
          } else {
            pnl = (entryPrice - exitPrice) * quantity;
          }
          
          updates.pnl = pnl.toString();
        }
      }
      
      const trade = await storage.updatePaperTrade(id, updates);
      if (!trade) {
        return res.status(404).json({ error: 'Trade not found' });
      }
      
      res.json(trade);
    } catch (error) {
      console.error('Update paper trade error:', error);
      res.status(400).json({ error: 'Failed to update paper trade' });
    }
  });

  // Option Chain API
  app.get('/api/option-chain', async (req, res) => {
    try {
      const { underlying = 'BANKNIFTY', expiry } = req.query;
      
      if (!expiry) {
        return res.status(400).json({ error: 'Expiry date is required' });
      }
      
      // Try to get from storage first
      let optionChain = await storage.getOptionChain(underlying as string, expiry as string);
      
      if (optionChain.length === 0) {
        // Fetch from market data service
        const chainData = await marketDataService.getOptionChainData(underlying as string, expiry as string);
        
        // Save to storage
        for (const option of chainData) {
          await storage.saveOptionChain(option);
        }
        
        optionChain = await storage.getOptionChain(underlying as string, expiry as string);
      }
      
      res.json(optionChain);
    } catch (error) {
      console.error('Option chain fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch option chain' });
    }
  });

  // Stock Screener API
  app.get('/api/stock-screener', async (req, res) => {
    try {
      const { minVolume, minPrice, minVolatility } = req.query;
      
      // This would typically screen a larger universe of stocks
      // For demo, we'll return some mock screened results
      const screenedStocks = [
        {
          symbol: 'RELIANCE',
          name: 'Reliance Industries',
          price: 2456.75,
          change: 3.2,
          volume: 2400000,
          volatility: 35,
          aiScore: 85
        },
        {
          symbol: 'TCS',
          name: 'Tata Consultancy Services',
          price: 3742.50,
          change: -1.8,
          volume: 1800000,
          volatility: 28,
          aiScore: 72
        },
        {
          symbol: 'HDFCBANK',
          name: 'HDFC Bank Limited',
          price: 1589.25,
          change: 2.1,
          volume: 3200000,
          volatility: 42,
          aiScore: 91
        }
      ];
      
      res.json(screenedStocks);
    } catch (error) {
      console.error('Stock screener error:', error);
      res.status(500).json({ error: 'Failed to run stock screener' });
    }
  });

  // Real-time data updates (runs every 5 seconds)
  setInterval(async () => {
    try {
      const symbols = ['NIFTY', 'BANKNIFTY', 'SENSEX'];
      const marketData = await marketDataService.getMarketData(symbols);
      
      // Save and broadcast updates
      for (const data of marketData) {
        await storage.saveMarketData(data);
      }
      
      broadcast({ type: 'MARKET_DATA_UPDATE', data: marketData });
      
      // Check for new signals - need to get saved market data with proper structure
      const savedMarketData = await storage.getMarketData();
      const technicals = technicalAnalysisService.analyzeTechnicals(savedMarketData);
      for (const [symbol, data] of Object.entries(technicals)) {
        const signalAnalysis = technicalAnalysisService.generateSignalFromTechnicals(symbol, data);
        
        if (signalAnalysis.signal !== 'HOLD' && signalAnalysis.strength > 70) {
          // Generate AI signal for high-confidence technical signals
          const instrument = symbol === 'BANKNIFTY' ? 'BANKNIFTY 44400 CE' : 'NIFTY 19400 CE';
          const currentPrice = parseFloat(marketData.find(d => d.symbol === symbol)?.price || '0');
          
          if (currentPrice > 0) {
            const aiSignal = await aiService.generateTradingSignal(instrument, currentPrice, data);
            
            if (aiSignal) {
              const signal = await storage.createTradingSignal({
                instrument,
                signalType: aiSignal.type,
                entryPrice: aiSignal.entryPrice.toString(),
                targetPrice: aiSignal.targetPrice.toString(),
                stopLoss: aiSignal.stopLoss.toString(),
                reasoning: aiSignal.reasoning,
                confidence: Math.round(signalAnalysis.strength)
              });
              
              broadcast({ type: 'NEW_SIGNAL', data: signal });
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Real-time update error:', error);
    }
  }, 5000);

  return httpServer;
}
