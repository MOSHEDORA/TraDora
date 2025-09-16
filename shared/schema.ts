import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const tradingSignals = pgTable("trading_signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instrument: text("instrument").notNull(),
  signalType: text("signal_type").notNull(), // 'BUY' | 'SELL'
  entryPrice: decimal("entry_price", { precision: 10, scale: 2 }).notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("ACTIVE"), // 'ACTIVE' | 'TARGET_HIT' | 'SL_HIT' | 'EXPIRED'
  reasoning: text("reasoning"),
  confidence: integer("confidence").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paperTrades = pgTable("paper_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  instrument: text("instrument").notNull(),
  action: text("action").notNull(), // 'BUY' | 'SELL'
  quantity: integer("quantity").notNull(),
  entryPrice: decimal("entry_price", { precision: 10, scale: 2 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 10, scale: 2 }),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 2 }),
  target: decimal("target", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("OPEN"), // 'OPEN' | 'CLOSED' | 'SL_HIT' | 'TARGET_HIT'
  pnl: decimal("pnl", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const marketData = pgTable("market_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  change: decimal("change", { precision: 10, scale: 2 }).notNull(),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }).notNull(),
  high: decimal("high", { precision: 10, scale: 2 }).notNull(),
  low: decimal("low", { precision: 10, scale: 2 }).notNull(),
  volume: integer("volume").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const technicalIndicators = pgTable("technical_indicators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(), // '1m', '5m', '15m', '1h', '1d'
  indicators: jsonb("indicators").notNull(), // Contains RSI, MACD, VWAP, etc.
  timestamp: timestamp("timestamp").defaultNow(),
});

export const optionChain = pgTable("option_chain", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  underlying: text("underlying").notNull(), // 'NIFTY' | 'BANKNIFTY'
  expiry: text("expiry").notNull(),
  strike: decimal("strike", { precision: 10, scale: 2 }).notNull(),
  callLtp: decimal("call_ltp", { precision: 10, scale: 2 }),
  putLtp: decimal("put_ltp", { precision: 10, scale: 2 }),
  callOi: integer("call_oi"),
  putOi: integer("put_oi"),
  callVolume: integer("call_volume"),
  putVolume: integer("put_volume"),
  callIv: decimal("call_iv", { precision: 5, scale: 2 }),
  putIv: decimal("put_iv", { precision: 5, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTradingSignalSchema = createInsertSchema(tradingSignals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaperTradeSchema = createInsertSchema(paperTrades).omit({
  id: true,
  createdAt: true,
  closedAt: true,
  pnl: true,
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  id: true,
});

export const insertTechnicalIndicatorsSchema = createInsertSchema(technicalIndicators).omit({
  id: true,
  timestamp: true,
});

export const insertOptionChainSchema = createInsertSchema(optionChain).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type TradingSignal = typeof tradingSignals.$inferSelect;
export type InsertTradingSignal = z.infer<typeof insertTradingSignalSchema>;
export type PaperTrade = typeof paperTrades.$inferSelect;
export type InsertPaperTrade = z.infer<typeof insertPaperTradeSchema>;
export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;
export type TechnicalIndicators = typeof technicalIndicators.$inferSelect;
export type InsertTechnicalIndicators = z.infer<typeof insertTechnicalIndicatorsSchema>;
export type OptionChain = typeof optionChain.$inferSelect;
export type InsertOptionChain = z.infer<typeof insertOptionChainSchema>;
