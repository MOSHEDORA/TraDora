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
    yahoo: 'https://query1.finance.yahoo.com/v8/finance/chart'
  };

  constructor() {
    // Initialize Angel One authentication if API key is available
    this.initializeAngelOne();
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

  async getMarketData(symbols: string[]): Promise<InsertMarketData[]> {
    // Try Angel One first if available
    if (this.angelOneToken) {
      try {
        return await this.getAngelOneData(symbols);
      } catch (error) {
        console.error('Angel One data fetch failed, falling back to Yahoo Finance:', error);
      }
    }

    // Fallback to Yahoo Finance
    return await this.getYahooFinanceData(symbols);
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
    // Yahoo Finance access disabled - return empty array
    console.log('Yahoo Finance data source not available - no market data returned');
    return [];
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

}

export const marketDataService = new MarketDataService();
