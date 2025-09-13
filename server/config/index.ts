// Centralized configuration management for all APIs and services

export interface DatabaseConfig {
  url: string;
  port: number;
  user: string;
  password: string;
  database: string;
  host: string;
}

export interface AngelOneConfig {
  apiKey: string;
  clientId: string;
  mpin: string;
  totpSecret: string;
  baseUrl: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface YahooFinanceConfig {
  baseUrl: string;
  enabled: boolean;
}

export interface NSEConfig {
  baseUrl: string;
  enabled: boolean;
}

export interface AppConfig {
  port: number;
  environment: string;
  angelOne: AngelOneConfig;
  openRouter: OpenRouterConfig;
  yahooFinance: YahooFinanceConfig;
  nse: NSEConfig;
  database: DatabaseConfig;
}

// Load configuration from environment variables
export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000'),
  environment: process.env.NODE_ENV || 'development',
  
  angelOne: {
    apiKey: process.env.ANGEL_ONE_API_KEY || '',
    clientId: process.env.ANGEL_ONE_CLIENT_ID || '',
    mpin: process.env.ANGEL_ONE_MPIN || '',
    totpSecret: process.env.ANGEL_ONE_TOTP_SECRET || '',
    baseUrl: 'https://apiconnect.angelbroking.com'
  },
  
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'mistralai/mistral-7b-instruct:free'
  },
  
  yahooFinance: {
    baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart',
    enabled: true
  },
  
  nse: {
    baseUrl: 'https://www.nseindia.com/api',
    enabled: true
  },
  
  database: {
    url: process.env.DATABASE_URL || '',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || '',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || '',
    host: process.env.PGHOST || ''
  }
};

// Helper functions to check service availability
export const isAngelOneConfigured = (): boolean => {
  return !!(config.angelOne.apiKey && config.angelOne.clientId && config.angelOne.mpin);
};

export const isOpenRouterConfigured = (): boolean => {
  return !!config.openRouter.apiKey;
};

export const isDatabaseConfigured = (): boolean => {
  return !!(config.database.url || (config.database.host && config.database.database));
};

// Service status interface
export interface ServiceStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
}

export const getServiceStatuses = (): ServiceStatus[] => {
  return [
    {
      name: 'Angel One',
      status: isAngelOneConfigured() ? 'connected' : 'disconnected',
      error: !isAngelOneConfigured() ? 'API credentials not configured' : undefined
    },
    {
      name: 'OpenRouter AI',
      status: isOpenRouterConfigured() ? 'connected' : 'disconnected', 
      error: !isOpenRouterConfigured() ? 'API key not configured' : undefined
    },
    {
      name: 'Yahoo Finance',
      status: config.yahooFinance.enabled ? 'connected' : 'disconnected',
      error: !config.yahooFinance.enabled ? 'Service disabled' : undefined
    },
    {
      name: 'NSE API',
      status: config.nse.enabled ? 'connected' : 'disconnected',
      error: !config.nse.enabled ? 'Service disabled' : undefined
    }
  ];
};