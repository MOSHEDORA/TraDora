# Overview

TradePro Analytics is a comprehensive trading platform designed for professional intraday and scalping traders focusing on Indian market indices (Nifty, Bank Nifty, Sensex). The application combines real-time market data, AI-powered analysis, technical indicators, options chain analysis, and paper trading capabilities to provide a complete trading toolkit. The system aims to help traders generate consistent profits (minimum ₹1000/day) through intelligent signal generation and comprehensive market analysis.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built using **React with TypeScript** and follows a component-based architecture with the following key decisions:

- **Vite Build Tool**: Chosen for fast development builds and Hot Module Replacement (HMR)
- **Shadcn/ui Design System**: Provides consistent, accessible UI components built on Radix UI primitives
- **TanStack Query**: Handles server state management, caching, and background refetching
- **Wouter for Routing**: Lightweight client-side routing solution
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development with dark/light theme support

The frontend follows a modular structure with separate directories for components (Dashboard, LiveSignals, Options, PaperTrading, StockScreener), hooks for custom logic, and a centralized type system.

## Backend Architecture
The server uses **Express.js with TypeScript** in ESM format, implementing a RESTful API with real-time WebSocket capabilities:

- **Express Server**: Handles HTTP API requests with middleware for JSON parsing and logging
- **WebSocket Integration**: Provides real-time updates for market data, trading signals, and notifications
- **Service Layer Pattern**: Separates business logic into dedicated services (MarketDataService, AIService, TechnicalAnalysisService)
- **In-Memory Storage**: Uses a custom storage abstraction that can be swapped for database implementations

## Data Storage Solutions
The application uses **Drizzle ORM** with **PostgreSQL** for data persistence:

- **Drizzle Configuration**: Configured for PostgreSQL dialect with schema-first approach
- **Database Schema**: Includes tables for users, trading signals, paper trades, market data, technical indicators, and option chains
- **Migration Support**: Uses Drizzle Kit for database migrations and schema management
- **Memory Storage Fallback**: Implements an in-memory storage layer for development/testing

## Authentication and Authorization
Basic user management structure is in place with:

- **User Schema**: Supports username/password authentication
- **Session Management**: Uses connect-pg-simple for PostgreSQL-based session storage
- **API Protection**: Middleware ready for protecting routes based on authentication state

## Market Data Integration
Multi-source data fetching strategy with fallback mechanisms:

- **Primary Source**: Angel One API for real-time Indian market data
- **Secondary Source**: Yahoo Finance API as backup
- **Fallback Mechanism**: NSE option chain API as tertiary source
- **Error Handling**: Graceful degradation when data sources are unavailable
- **Caching Strategy**: Configurable refresh intervals (30s for market data, 60s for technical analysis)

## AI Analysis System
Integrates OpenRouter API for intelligent market analysis:

- **Market Sentiment Analysis**: Processes market data and technical indicators to determine bullish/bearish sentiment
- **Signal Generation**: Creates buy/sell signals with entry, target, and stop-loss levels
- **Confidence Scoring**: Provides confidence levels for generated signals
- **Fallback Logic**: Uses rule-based analysis when AI service is unavailable

## Technical Analysis Engine
Custom implementation of popular trading indicators:

- **Indicators Supported**: RSI, MACD, VWAP, EMA crossovers, Bollinger Bands, Supertrend
- **Real-time Calculation**: Updates technical indicators based on live market data
- **Multiple Timeframes**: Supports different timeframe analysis
- **Signal Generation**: Converts indicator values into actionable buy/sell/neutral signals

## Real-time Communication
WebSocket implementation for live updates:

- **Market Data Streaming**: Real-time price updates and volume information
- **Signal Broadcasting**: Instant notification of new trading signals
- **Connection Management**: Handles client connections, disconnections, and error recovery
- **Message Types**: Structured message format for different types of updates

# External Dependencies

## Financial Data Providers
- **Angel One API**: Primary source for Indian stock market data, requires API credentials
- **Yahoo Finance API**: Secondary data source for market quotes and historical data
- **NSE (National Stock Exchange)**: Tertiary source for option chain data

## AI and Analytics
- **OpenRouter API**: Provides access to various AI models for market analysis and signal generation
- **Custom Technical Analysis**: In-house implementation of technical indicators

## Database and Storage
- **PostgreSQL**: Primary database for persistent data storage
- **Neon Database**: Cloud PostgreSQL provider (based on connection string pattern)
- **Redis (Future)**: Planned for session storage and caching

## Development and Deployment
- **Replit Platform**: Development environment with integrated deployment
- **Vite Dev Tools**: Development server with HMR and debugging capabilities
- **Drizzle Kit**: Database migration and schema management tool

## UI and Styling
- **Radix UI**: Headless UI components for accessibility and functionality
- **Tailwind CSS**: Utility-first styling framework
- **Lucide Icons**: Consistent icon library for UI elements

## Real-time Features
- **WebSocket (ws)**: Native WebSocket implementation for real-time communication
- **TanStack Query**: Client-side state management and caching for API responses