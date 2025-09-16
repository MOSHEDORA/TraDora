import { InsertMarketData } from "@shared/schema";
import { config, isAngelOneConfigured } from "../config";
import { authenticator } from 'otplib';

interface YahooFinanceQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
}

interface AngelOneQuote {
  token: string;
  symbol: string;
  ltp: number;
  change: number;
  pchange: number;
  high: number;
  low: number;
  volume: number;
}

export class MarketDataService {
  private angelOneToken: string | null = null;
  private readonly baseUrls = {
    angelOne: 'https://apiconnect.angelbroking.com',
    yahoo: 'https://query1.finance.yahoo.com/v8/finance/chart',
    yahooQuote: 'https://query1.finance.yahoo.com/v7/finance/quote',
    nse: 'https://www.nseindia.com/api',
    alphavantage: 'https://www.alphavantage.co/query',
    marketstack: 'https://api.marketstack.com/v1/eod',
    iexcloud: 'https://cloud.iexapis.com/stable/stock',
    twelvedata: 'https://api.twelvedata.com/quote',
    polygon: 'https://api.polygon.io/v2/aggs/ticker'
  };

  constructor() {
    // Initialize Angel One authentication if API key is available
    this.initializeAngelOne();
    // Fetch historical data on startup to populate technical indicators
    this.initializeHistoricalData();
  }

  private async initializeAngelOne() {
    if (!isAngelOneConfigured()) {
      console.log('Angel One credentials not configured properly');
      return;
    }

    const { apiKey, clientId, mpin, totpSecret } = config.angelOne;

    try {
      // Generate TOTP from the secret
      const totp = authenticator.generate(totpSecret);
      console.log('Attempting Angel One authentication...');

      const response = await fetch(`${this.baseUrls.angelOne}/rest/auth/angelbroking/user/v1/loginByPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '127.0.0.1',
          'X-ClientPublicIP': '127.0.0.1',
          'X-MACAddress': '00:00:00:00:00:00',
          'X-PrivateKey': apiKey
        },
        body: JSON.stringify({
          clientcode: clientId,
          password: mpin,
          totp: totp
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status && data.data?.jwtToken) {
          this.angelOneToken = data.data.jwtToken;
          console.log('Angel One authentication successful');
        } else {
          console.error('Angel One authentication failed:', data.message || 'Invalid response format');
        }
      } else {
        console.error('Angel One authentication failed with status:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Angel One authentication failed:', error);
    }
  }

  async getHistoricalData(symbols: string[], days: number = 100): Promise<InsertMarketData[]> {
    const dataSources = [
      { name: 'Yahoo Historical', enabled: true, fetch: () => this.getYahooHistoricalData(symbols, days) },
      { name: 'Alpha Vantage Historical', enabled: true, fetch: () => this.getAlphaVantageHistoricalData(symbols) },
      { name: 'Twelve Data Historical', enabled: true, fetch: () => this.getTwelveDataHistoricalData(symbols) }
    ];

    for (const source of dataSources) {
      if (!source.enabled) continue;
      
      try {
        console.log(`Fetching historical data from ${source.name}...`);
        const data = await source.fetch();
        if (data && data.length > 20) {
          console.log(`✓ ${source.name} returned ${data.length} historical records`);
          return data;
        }
      } catch (error) {
        console.error(`✗ ${source.name} failed:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.warn('All historical data sources failed');
    return [];
  }

  async getMarketData(symbols: string[]): Promise<InsertMarketData[]> {
    const dataSources = [
      { name: 'Angel One', enabled: !!this.angelOneToken, fetch: () => this.getAngelOneData(symbols) },
      { name: 'Yahoo Finance', enabled: true, fetch: () => this.getYahooFinanceData(symbols) },
      { name: 'Alpha Vantage', enabled: true, fetch: () => this.getAlphaVantageData(symbols) },
      { name: 'Twelve Data', enabled: true, fetch: () => this.getTwelveDataData(symbols) },
      { name: 'Marketstack', enabled: true, fetch: () => this.getMarketstackData(symbols) },
      { name: 'NSE Direct', enabled: true, fetch: () => this.getNSEData(symbols) },
      { name: 'Yahoo Quote API', enabled: true, fetch: () => this.getYahooQuoteData(symbols) },
      { name: 'BSE API', enabled: true, fetch: () => this.getBSEData(symbols) }
    ];

    for (const source of dataSources) {
      if (!source.enabled) continue;
      
      try {
        console.log(`Trying ${source.name} for market data...`);
        const data = await source.fetch();
        if (data && data.length > 0) {
          console.log(`✓ ${source.name} returned ${data.length} records`);
          return data;
        }
      } catch (error) {
        console.error(`✗ ${source.name} failed:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.warn('All market data sources failed');
    return [];
  }

  private async getAngelOneData(symbols: string[]): Promise<InsertMarketData[]> {
    if (!this.angelOneToken) {
      throw new Error('Angel One not authenticated');
    }

    const symbolMapping: Record<string, string> = {
      'NIFTY': '99926000',
      'BANKNIFTY': '99926009',
      'SENSEX': '99919000'
    };

    const tokenArray = symbols.map(symbol => ({
      exchangetoken: symbolMapping[symbol] || symbol,
      tradingsymbol: symbol
    }));

    const response = await fetch(`${this.baseUrls.angelOne}/rest/secure/angelbroking/order/v1/getLtpData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.angelOneToken}`,
        'X-PrivateKey': config.angelOne.apiKey,
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        exchange: "NSE",
        tradingsymbol: symbols[0],
        symboltoken: tokenArray[0]?.exchangetoken
      })
    });

    if (!response.ok) {
      throw new Error(`Angel One LTP API error: ${response.status} ${response.statusText}`);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Angel One returned non-JSON response:', text.substring(0, 200));
      throw new Error('Angel One API returned HTML instead of JSON');
    }

    const body = await response.json();
    
    if (!body.status || !body.data) {
      console.error('Angel One LTP invalid payload:', body.message || body.error || 'Unknown error');
      throw new Error(`Angel One LTP: ${body.message || 'Invalid response format'}`);
    }

    // Map Angel One response to our format
    const results: InsertMarketData[] = [];
    const data = body.data;
    
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const quote = Array.isArray(data) ? data[i] : data;
      
      if (quote) {
        results.push({
          symbol: symbol,
          price: (quote.ltp || quote.lastPrice || 0).toString(),
          change: (quote.change || 0).toString(),
          changePercent: (quote.pChange || 0).toString(),
          high: (quote.high || quote.dayHigh || 0).toString(),
          low: (quote.low || quote.dayLow || 0).toString(),
          volume: quote.volume || 0
        });
      }
    }
    
    console.log(`Angel One fetched ${results.length} quotes for symbols:`, symbols);
    return results;
  }

  private async getYahooFinanceData(symbols: string[]): Promise<InsertMarketData[]> {
    const results: InsertMarketData[] = [];
    
    // Map NSE symbols to Yahoo Finance format
    const yahooSymbolMap: Record<string, string> = {
      'NIFTY': '^NSEI',
      'BANKNIFTY': '^NSEBANK',
      'SENSEX': '^BSESN',
      'RELIANCE': 'RELIANCE.NS',
      'TCS': 'TCS.NS',
      'HDFCBANK': 'HDFCBANK.NS',
      'INFY': 'INFY.NS',
      'ICICIBANK': 'ICICIBANK.NS'
    };

    for (const symbol of symbols) {
      try {
        // Validate symbol (basic allowlist for security)
        if (!/^[A-Z0-9_]+$/.test(symbol)) {
          console.warn(`Invalid symbol format: ${symbol}`);
          continue;
        }
        
        const yahooSymbol = yahooSymbolMap[symbol] || `${encodeURIComponent(symbol)}.NS`;
        const url = `${this.baseUrls.yahoo}/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const result = data.chart?.result?.[0];
        
        if (result && result.meta) {
          const meta = result.meta;
          const current = meta.regularMarketPrice || meta.previousClose;
          const prev = meta.previousClose;
          const change = current - prev;
          const changePercent = (change / prev) * 100;

          results.push({
            symbol: symbol,
            price: current.toString(),
            change: change.toString(),
            changePercent: changePercent.toString(),
            high: (meta.regularMarketDayHigh || current).toString(),
            low: (meta.regularMarketDayLow || current).toString(),
            volume: meta.regularMarketVolume || 0
          });
        }
      } catch (error) {
        console.error(`Yahoo Finance error for ${symbol}:`, error instanceof Error ? error.message : String(error));
      }
    }

    return results;
  }

  private async getYahooQuoteData(symbols: string[]): Promise<InsertMarketData[]> {
    const yahooSymbolMap: Record<string, string> = {
      'NIFTY': '^NSEI',
      'BANKNIFTY': '^NSEBANK',
      'SENSEX': '^BSESN'
    };

    // Validate and encode symbols
    const validSymbols = symbols.filter(s => /^[A-Z0-9_]+$/.test(s));
    if (validSymbols.length === 0) {
      throw new Error('No valid symbols provided');
    }
    
    const yahooSymbols = validSymbols.map(s => encodeURIComponent(yahooSymbolMap[s] || `${s}.NS`)).join(',');
    const url = `${this.baseUrls.yahooQuote}?symbols=${yahooSymbols}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const quotes = data.quoteResponse?.result || [];
      
      const results: InsertMarketData[] = [];
      for (let i = 0; i < quotes.length && i < validSymbols.length; i++) {
        const quote = quotes[i];
        const symbol = validSymbols[i];
        
        results.push({
          symbol: symbol,
          price: (quote.regularMarketPrice || quote.ask || quote.bid || 0).toString(),
          change: (quote.regularMarketChange || 0).toString(),
          changePercent: (quote.regularMarketChangePercent || 0).toString(),
          high: (quote.regularMarketDayHigh || quote.regularMarketPrice || 0).toString(),
          low: (quote.regularMarketDayLow || quote.regularMarketPrice || 0).toString(),
          volume: quote.regularMarketVolume || 0
        });
      }
      
      return results;
    } catch (error) {
      throw new Error(`Yahoo Quote API failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getNSEData(symbols: string[]): Promise<InsertMarketData[]> {
    const results: InsertMarketData[] = [];
    
    for (const symbol of symbols) {
      try {
        let url = '';
        // Validate symbol
        if (!/^[A-Z0-9_]+$/.test(symbol)) {
          console.warn(`Invalid symbol format: ${symbol}`);
          continue;
        }
        
        if (['NIFTY', 'BANKNIFTY'].includes(symbol)) {
          url = `${this.baseUrls.nse}/equity-meta-info?symbol=${encodeURIComponent(symbol)}`;
        } else {
          url = `${this.baseUrls.nse}/quote-equity?symbol=${encodeURIComponent(symbol)}`;
        }
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.nseindia.com/',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        let quote = null;
        
        if (data.data) {
          quote = data.data;
        } else if (data.priceInfo) {
          quote = data.priceInfo;
        }
        
        if (quote) {
          const current = quote.lastPrice || quote.close || 0;
          const prev = quote.previousClose || quote.prevClose || current;
          const change = current - prev;
          const changePercent = prev > 0 ? (change / prev) * 100 : 0;

          results.push({
            symbol: symbol,
            price: current.toString(),
            change: change.toString(),
            changePercent: changePercent.toString(),
            high: (quote.dayHigh || quote.high || current).toString(),
            low: (quote.dayLow || quote.low || current).toString(),
            volume: quote.totalTradedVolume || quote.volume || 0
          });
        }
      } catch (error) {
        console.error(`NSE error for ${symbol}:`, error instanceof Error ? error.message : String(error));
      }
    }

    return results;
  }


  async getOptionChainData(underlying: string, expiry: string) {
    // Try to fetch from NSE API or Angel One
    try {
      const nseUrl = `https://www.nseindia.com/api/option-chain-indices?symbol=${underlying}`;
      
      const response = await fetch(nseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (!response.ok) {
        throw new Error('NSE API failed');
      }

      const data = await response.json();
      return this.parseNSEOptionChain(data, underlying, expiry);
    } catch (error) {
      console.error('NSE option chain fetch failed:', error);
      return [];
    }
  }

  private parseNSEOptionChain(data: any, underlying: string, expiry: string) {
    // Parse NSE option chain response
    const options = [];
    const records = data.records?.data || [];

    for (const record of records) {
      if (record.expiryDate === expiry) {
        options.push({
          underlying,
          expiry,
          strike: record.strikePrice.toString(),
          callLtp: record.CE?.lastPrice?.toString() || "0",
          putLtp: record.PE?.lastPrice?.toString() || "0",
          callOi: record.CE?.openInterest || 0,
          putOi: record.PE?.openInterest || 0,
          callVolume: record.CE?.totalTradedVolume || 0,
          putVolume: record.PE?.totalTradedVolume || 0,
          callIv: record.CE?.impliedVolatility?.toString() || "0",
          putIv: record.PE?.impliedVolatility?.toString() || "0"
        });
      }
    }

    return options;
  }

  private async getBSEData(symbols: string[]): Promise<InsertMarketData[]> {
    const results: InsertMarketData[] = [];
    
    for (const symbol of symbols) {
      try {
        let url = '';
        if (symbol === 'SENSEX') {
          // Use a public API endpoint for BSE Sensex
          url = 'https://priceapi.moneycontrol.com/pricefeed/bse/equitycash/BSE';
        } else {
          // Try to get individual stock data from BSE
          continue; // Skip individual stocks for now
        }
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://www.bseindia.com/'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.data) {
          const quote = data.data;
          const current = parseFloat(quote.lastPrice || quote.pricecurrent || '0');
          const prev = parseFloat(quote.previousClose || quote.priceprevclose || current.toString());
          const change = current - prev;
          const changePercent = prev > 0 ? (change / prev) * 100 : 0;

          results.push({
            symbol: symbol,
            price: current.toString(),
            change: change.toString(),
            changePercent: changePercent.toString(),
            high: (quote.priceperchigh || current).toString(),
            low: (quote.priceperclow || current).toString(),
            volume: parseInt(quote.volume || '0')
          });
        }
      } catch (error) {
        console.error(`BSE error for ${symbol}:`, error instanceof Error ? error.message : String(error));
      }
    }

    return results;
  }

  private async getAlphaVantageData(symbols: string[]): Promise<InsertMarketData[]> {
    const results: InsertMarketData[] = [];
    const apiKey = process.env.ALPHAVANTAGE_API_KEY || 'demo';
    
    for (const symbol of symbols) {
      try {
        // Validate symbol
        if (!/^[A-Z0-9_]+$/.test(symbol)) {
          continue;
        }
        
        // Convert Indian symbols for Alpha Vantage (limited Indian support)
        const alphaSymbol = symbol === 'SENSEX' ? 'BSE:SENSEX' : `${symbol}.BSE`;
        const url = `${this.baseUrls.alphavantage}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(alphaSymbol)}&apikey=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const quote = data['Global Quote'];
        
        if (quote && quote['05. price']) {
          const current = parseFloat(quote['05. price']);
          const change = parseFloat(quote['09. change'] || '0');
          const changePercent = parseFloat(quote['10. change percent']?.replace('%', '') || '0');
          
          results.push({
            symbol: symbol,
            price: current.toString(),
            change: change.toString(),
            changePercent: changePercent.toString(),
            high: (quote['03. high'] || current).toString(),
            low: (quote['04. low'] || current).toString(),
            volume: parseInt(quote['06. volume'] || '0')
          });
        }
      } catch (error) {
        console.error(`Alpha Vantage error for ${symbol}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    return results;
  }

  private async getTwelveDataData(symbols: string[]): Promise<InsertMarketData[]> {
    const results: InsertMarketData[] = [];
    const apiKey = process.env.TWELVEDATA_API_KEY || 'demo';
    
    for (const symbol of symbols) {
      try {
        // Validate symbol
        if (!/^[A-Z0-9_]+$/.test(symbol)) {
          continue;
        }
        
        // Twelve Data supports some Indian exchanges
        const exchangeMap: Record<string, string> = {
          'NIFTY': 'NSE',
          'BANKNIFTY': 'NSE', 
          'SENSEX': 'BSE'
        };
        
        const exchange = exchangeMap[symbol] || 'NSE';
        const url = `${this.baseUrls.twelvedata}?symbol=${encodeURIComponent(symbol)}&exchange=${exchange}&apikey=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.price) {
          const current = parseFloat(data.price);
          const change = parseFloat(data.change || '0');
          const changePercent = parseFloat(data.percent_change || '0');
          
          results.push({
            symbol: symbol,
            price: current.toString(),
            change: change.toString(),
            changePercent: changePercent.toString(),
            high: (data.high || current).toString(),
            low: (data.low || current).toString(),
            volume: parseInt(data.volume || '0')
          });
        }
      } catch (error) {
        console.error(`Twelve Data error for ${symbol}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    return results;
  }

  private async getMarketstackData(symbols: string[]): Promise<InsertMarketData[]> {
    const results: InsertMarketData[] = [];
    const apiKey = process.env.MARKETSTACK_API_KEY || 'demo';
    
    for (const symbol of symbols) {
      try {
        // Validate symbol
        if (!/^[A-Z0-9_]+$/.test(symbol)) {
          continue;
        }
        
        // Marketstack format: symbol.exchange
        const marketstackSymbol = symbol === 'SENSEX' ? 'BSE.XBOM' : `${symbol}.XNSE`;
        const url = `${this.baseUrls.marketstack}?access_key=${apiKey}&symbols=${encodeURIComponent(marketstackSymbol)}&limit=1`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const quotes = data.data;
        
        if (quotes && quotes.length > 0) {
          const quote = quotes[0];
          const current = quote.close || quote.adj_close || 0;
          const prev = quote.open || current;
          const change = current - prev;
          const changePercent = prev > 0 ? (change / prev) * 100 : 0;
          
          results.push({
            symbol: symbol,
            price: current.toString(),
            change: change.toString(),
            changePercent: changePercent.toString(),
            high: (quote.high || current).toString(),
            low: (quote.low || current).toString(),
            volume: quote.volume || 0
          });
        }
      } catch (error) {
        console.error(`Marketstack error for ${symbol}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    return results;
  }

  private async initializeHistoricalData() {
    try {
      console.log('Initializing historical data for technical analysis...');
      const symbols = ['NIFTY', 'BANKNIFTY', 'SENSEX'];
      const historicalData = await this.getHistoricalData(symbols, 100);
      
      if (historicalData.length > 0) {
        console.log(`Loaded ${historicalData.length} historical data points for technical analysis`);
        // Here you would typically save this to your storage
        // For now, we'll simulate this by creating varied price data
        this.seedHistoricalDataToStorage(historicalData);
      }
    } catch (error) {
      console.error('Failed to initialize historical data:', error);
    }
  }

  private async seedHistoricalDataToStorage(historicalData: InsertMarketData[]) {
    console.log('Seeding historical data to storage...');
    
    // Import storage dynamically to avoid circular dependency
    const { storage } = await import('../storage');
    
    let savedCount = 0;
    for (const data of historicalData) {
      try {
        await storage.saveMarketData(data);
        savedCount++;
      } catch (error) {
        console.error('Error saving historical data point:', error);
      }
    }
    
    console.log(`✓ Successfully seeded ${savedCount} historical data points to storage`);
  }

  private async getYahooHistoricalData(symbols: string[], days: number): Promise<InsertMarketData[]> {
    const results: InsertMarketData[] = [];
    const yahooSymbolMap: Record<string, string> = {
      'NIFTY': '^NSEI',
      'BANKNIFTY': '^NSEBANK', 
      'SENSEX': '^BSESN'
    };

    for (const symbol of symbols) {
      try {
        if (!/^[A-Z0-9_]+$/.test(symbol)) {
          continue;
        }
        
        const yahooSymbol = yahooSymbolMap[symbol] || `${encodeURIComponent(symbol)}.NS`;
        const endDate = Math.floor(Date.now() / 1000);
        const startDate = endDate - (days * 24 * 60 * 60); // days ago
        
        const url = `${this.baseUrls.yahoo}/${encodeURIComponent(yahooSymbol)}?period1=${startDate}&period2=${endDate}&interval=1d`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const result = data.chart?.result?.[0];
        
        if (result && result.timestamp && result.indicators?.quote?.[0]) {
          const timestamps = result.timestamp;
          const quote = result.indicators.quote[0];
          const closes = quote.close || [];
          const opens = quote.open || [];
          const highs = quote.high || [];
          const lows = quote.low || [];
          const volumes = quote.volume || [];
          
          for (let i = 0; i < timestamps.length; i++) {
            if (closes[i] != null && !isNaN(closes[i])) {
              const close = closes[i];
              const open = opens[i] || close;
              const change = close - open;
              const changePercent = open > 0 ? (change / open) * 100 : 0;
              
              results.push({
                symbol: symbol,
                price: close.toString(),
                change: change.toString(),
                changePercent: changePercent.toString(),
                high: (highs[i] || close).toString(),
                low: (lows[i] || close).toString(),
                volume: volumes[i] || 0,
                timestamp: new Date(timestamps[i] * 1000).toISOString()
              });
            }
          }
        }
      } catch (error) {
        console.error(`Yahoo historical error for ${symbol}:`, error instanceof Error ? error.message : String(error));
      }
    }

    return results;
  }

  private async getAlphaVantageHistoricalData(symbols: string[]): Promise<InsertMarketData[]> {
    const results: InsertMarketData[] = [];
    const apiKey = process.env.ALPHAVANTAGE_API_KEY || 'demo';
    
    for (const symbol of symbols) {
      try {
        if (!/^[A-Z0-9_]+$/.test(symbol)) {
          continue;
        }
        
        const alphaSymbol = symbol === 'SENSEX' ? 'BSE:SENSEX' : `${symbol}.BSE`;
        const url = `${this.baseUrls.alphavantage}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(alphaSymbol)}&apikey=${apiKey}&outputsize=compact`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const timeSeries = data['Time Series (Daily)'];
        
        if (timeSeries) {
          for (const [date, values] of Object.entries(timeSeries as Record<string, any>)) {
            const close = parseFloat(values['4. close']);
            const open = parseFloat(values['1. open']);
            const change = close - open;
            const changePercent = open > 0 ? (change / open) * 100 : 0;
            
            results.push({
              symbol: symbol,
              price: close.toString(),
              change: change.toString(),
              changePercent: changePercent.toString(),
              high: values['2. high'],
              low: values['3. low'],
              volume: parseInt(values['5. volume'] || '0'),
              timestamp: new Date(date).toISOString()
            });
          }
        }
      } catch (error) {
        console.error(`Alpha Vantage historical error for ${symbol}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    return results;
  }

  private async getTwelveDataHistoricalData(symbols: string[]): Promise<InsertMarketData[]> {
    const results: InsertMarketData[] = [];
    const apiKey = process.env.TWELVEDATA_API_KEY || 'demo';
    
    for (const symbol of symbols) {
      try {
        if (!/^[A-Z0-9_]+$/.test(symbol)) {
          continue;
        }
        
        const exchangeMap: Record<string, string> = {
          'NIFTY': 'NSE',
          'BANKNIFTY': 'NSE', 
          'SENSEX': 'BSE'
        };
        
        const exchange = exchangeMap[symbol] || 'NSE';
        const url = `${this.baseUrls.twelvedata.replace('/quote', '/time_series')}?symbol=${encodeURIComponent(symbol)}&exchange=${exchange}&interval=1day&outputsize=100&apikey=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const values = data.values;
        
        if (values && Array.isArray(values)) {
          for (const point of values) {
            const close = parseFloat(point.close);
            const open = parseFloat(point.open);
            const change = close - open;
            const changePercent = open > 0 ? (change / open) * 100 : 0;
            
            results.push({
              symbol: symbol,
              price: close.toString(),
              change: change.toString(),
              changePercent: changePercent.toString(),
              high: point.high,
              low: point.low,
              volume: parseInt(point.volume || '0'),
              timestamp: new Date(point.datetime).toISOString()
            });
          }
        }
      } catch (error) {
        console.error(`Twelve Data historical error for ${symbol}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    return results;
  }

}

export const marketDataService = new MarketDataService();
