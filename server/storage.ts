import { 
  type User, 
  type InsertUser,
  type TradingSignal,
  type InsertTradingSignal,
  type PaperTrade,
  type InsertPaperTrade,
  type MarketData,
  type InsertMarketData,
  type TechnicalIndicators,
  type InsertTechnicalIndicators,
  type OptionChain,
  type InsertOptionChain
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Trading Signals
  getTradingSignals(): Promise<TradingSignal[]>;
  getActiveTradingSignals(): Promise<TradingSignal[]>;
  createTradingSignal(signal: InsertTradingSignal): Promise<TradingSignal>;
  updateTradingSignal(id: string, updates: Partial<TradingSignal>): Promise<TradingSignal | undefined>;

  // Paper Trading
  getPaperTrades(userId?: string): Promise<PaperTrade[]>;
  getActivePaperTrades(userId?: string): Promise<PaperTrade[]>;
  createPaperTrade(trade: InsertPaperTrade): Promise<PaperTrade>;
  updatePaperTrade(id: string, updates: Partial<PaperTrade>): Promise<PaperTrade | undefined>;

  // Market Data
  getMarketData(symbol?: string): Promise<MarketData[]>;
  getLatestMarketData(symbol: string): Promise<MarketData | undefined>;
  saveMarketData(data: InsertMarketData): Promise<MarketData>;

  // Technical Indicators
  getTechnicalIndicators(symbol: string, timeframe: string): Promise<TechnicalIndicators | undefined>;
  saveTechnicalIndicators(data: InsertTechnicalIndicators): Promise<TechnicalIndicators>;

  // Option Chain
  getOptionChain(underlying: string, expiry: string): Promise<OptionChain[]>;
  saveOptionChain(data: InsertOptionChain): Promise<OptionChain>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tradingSignals: Map<string, TradingSignal>;
  private paperTrades: Map<string, PaperTrade>;
  private marketData: Map<string, MarketData>;
  private technicalIndicators: Map<string, TechnicalIndicators>;
  private optionChain: Map<string, OptionChain>;

  constructor() {
    this.users = new Map();
    this.tradingSignals = new Map();
    this.paperTrades = new Map();
    this.marketData = new Map();
    this.technicalIndicators = new Map();
    this.optionChain = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Trading Signals
  async getTradingSignals(): Promise<TradingSignal[]> {
    return Array.from(this.tradingSignals.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getActiveTradingSignals(): Promise<TradingSignal[]> {
    return Array.from(this.tradingSignals.values())
      .filter(signal => signal.status === 'ACTIVE')
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createTradingSignal(insertSignal: InsertTradingSignal): Promise<TradingSignal> {
    const id = randomUUID();
    const now = new Date();
    const signal: TradingSignal = { 
      ...insertSignal, 
      id, 
      createdAt: now,
      updatedAt: now,
      status: 'ACTIVE',
      targetPrice: insertSignal.targetPrice || null,
      stopLoss: insertSignal.stopLoss || null,
      reasoning: insertSignal.reasoning || null,
      confidence: insertSignal.confidence || null
    };
    this.tradingSignals.set(id, signal);
    return signal;
  }

  async updateTradingSignal(id: string, updates: Partial<TradingSignal>): Promise<TradingSignal | undefined> {
    const signal = this.tradingSignals.get(id);
    if (!signal) return undefined;
    
    const updatedSignal = { ...signal, ...updates, updatedAt: new Date() };
    this.tradingSignals.set(id, updatedSignal);
    return updatedSignal;
  }

  // Paper Trading
  async getPaperTrades(userId?: string): Promise<PaperTrade[]> {
    const trades = Array.from(this.paperTrades.values());
    if (userId) {
      return trades.filter(trade => trade.userId === userId)
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    return trades.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getActivePaperTrades(userId?: string): Promise<PaperTrade[]> {
    const trades = Array.from(this.paperTrades.values())
      .filter(trade => trade.status === 'OPEN');
    
    if (userId) {
      return trades.filter(trade => trade.userId === userId)
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    return trades.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createPaperTrade(insertTrade: InsertPaperTrade): Promise<PaperTrade> {
    const id = randomUUID();
    const now = new Date();
    const trade: PaperTrade = { 
      ...insertTrade, 
      id, 
      createdAt: now,
      closedAt: null,
      status: 'OPEN',
      pnl: "0",
      exitPrice: null,
      stopLoss: insertTrade.stopLoss || null,
      target: insertTrade.target || null,
      userId: insertTrade.userId || null
    };
    this.paperTrades.set(id, trade);
    return trade;
  }

  async updatePaperTrade(id: string, updates: Partial<PaperTrade>): Promise<PaperTrade | undefined> {
    const trade = this.paperTrades.get(id);
    if (!trade) return undefined;
    
    const updatedTrade = { ...trade, ...updates };
    if (updates.status === 'CLOSED' || updates.status === 'SL_HIT' || updates.status === 'TARGET_HIT') {
      updatedTrade.closedAt = new Date();
    }
    this.paperTrades.set(id, updatedTrade);
    return updatedTrade;
  }

  // Market Data
  async getMarketData(symbol?: string): Promise<MarketData[]> {
    const data = Array.from(this.marketData.values());
    if (symbol) {
      return data.filter(item => item.symbol === symbol)
        .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
    }
    return data.sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async getLatestMarketData(symbol: string): Promise<MarketData | undefined> {
    const symbolData = Array.from(this.marketData.values())
      .filter(item => item.symbol === symbol)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
    
    return symbolData[0];
  }

  async saveMarketData(insertData: InsertMarketData): Promise<MarketData> {
    const id = randomUUID();
    const data: MarketData = { 
      ...insertData,
      id,
      timestamp: insertData.timestamp || new Date(),
      open: insertData.open || null
    };
    this.marketData.set(id, data);
    return data;
  }

  // Technical Indicators
  async getTechnicalIndicators(symbol: string, timeframe: string): Promise<TechnicalIndicators | undefined> {
    return Array.from(this.technicalIndicators.values())
      .find(item => item.symbol === symbol && item.timeframe === timeframe);
  }

  async saveTechnicalIndicators(insertData: InsertTechnicalIndicators): Promise<TechnicalIndicators> {
    const id = randomUUID();
    const data: TechnicalIndicators = { ...insertData, id, timestamp: new Date() };
    this.technicalIndicators.set(id, data);
    return data;
  }

  // Option Chain
  async getOptionChain(underlying: string, expiry: string): Promise<OptionChain[]> {
    return Array.from(this.optionChain.values())
      .filter(item => item.underlying === underlying && item.expiry === expiry)
      .sort((a, b) => parseFloat(a.strike) - parseFloat(b.strike));
  }

  async saveOptionChain(insertData: InsertOptionChain): Promise<OptionChain> {
    const id = randomUUID();
    const data: OptionChain = { 
      ...insertData, 
      id, 
      timestamp: new Date(),
      callLtp: insertData.callLtp || null,
      putLtp: insertData.putLtp || null,
      callOi: insertData.callOi || null,
      putOi: insertData.putOi || null,
      callVolume: insertData.callVolume || null,
      putVolume: insertData.putVolume || null,
      callIv: insertData.callIv || null,
      putIv: insertData.putIv || null
    };
    this.optionChain.set(id, data);
    return data;
  }
}

export const storage = new MemStorage();
