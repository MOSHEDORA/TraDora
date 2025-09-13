import { InsertMarketData } from "@shared/schema";

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
    const apiKey = process.env.ANGEL_ONE_API_KEY;
    const clientId = process.env.ANGEL_ONE_CLIENT_ID;
    const password = process.env.ANGEL_ONE_PASSWORD;
    const totp = process.env.ANGEL_ONE_TOTP;

    if (!apiKey || !clientId || !password) {
      console.log('Angel One credentials not found, will use Yahoo Finance as primary source');
      return;
    }

    try {
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
          password: password,
          totp: totp
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status && data.data?.jwtToken) {
          this.angelOneToken = data.data.jwtToken;
          console.log('Angel One authentication successful');
        }
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

    const response = await fetch(`${this.baseUrls.angelOne}/rest/secure/angelbroking/order/v1/getLTP`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.angelOneToken}`,
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00'
      },
      body: JSON.stringify({
        exchange: "NSE",
        tradingsymbol: symbols[0],
        symboltoken: tokenArray[0]?.exchangetoken
      })
    });

    if (!response.ok) {
      throw new Error(`Angel One API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Return error if Angel One API response cannot be parsed
    throw new Error('Angel One API response parsing failed - no valid data available');
  }

  private async getYahooFinanceData(symbols: string[]): Promise<InsertMarketData[]> {
    const yahooSymbols = symbols.map(symbol => {
      const mapping: Record<string, string> = {
        'NIFTY': '^NSEI',
        'BANKNIFTY': '^NSEBANK',
        'SENSEX': '^BSESN'
      };
      return mapping[symbol] || `${symbol}.NS`;
    });

    const results: InsertMarketData[] = [];

    for (let i = 0; i < yahooSymbols.length; i++) {
      try {
        const response = await fetch(`${this.baseUrls.yahoo}/${yahooSymbols[i]}?interval=1m&range=1d`);
        
        if (!response.ok) {
          console.error(`Yahoo Finance API error for ${symbols[i]}: ${response.statusText}`);
          // Skip symbol if no data available
          console.warn(`No data available for ${symbols[i]}`);
          continue;
        }

        const data = await response.json();
        const result = data.chart?.result?.[0];
        
        if (result?.meta && result?.indicators?.quote?.[0]) {
          const meta = result.meta;
          const quote = result.indicators.quote[0];
          const timestamps = result.timestamp;
          const latestIndex = timestamps.length - 1;

          results.push({
            symbol: symbols[i],
            price: meta.regularMarketPrice?.toString() || "0",
            change: (meta.regularMarketPrice - meta.previousClose)?.toString() || "0",
            changePercent: (((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100)?.toString() || "0",
            high: meta.regularMarketDayHigh?.toString() || "0",
            low: meta.regularMarketDayLow?.toString() || "0",
            volume: meta.regularMarketVolume || 0
          });
        } else {
          console.warn(`No valid data received for ${symbols[i]}`);
        }
      } catch (error) {
        console.error(`Error fetching data for ${symbols[i]}:`, error);
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

}

export const marketDataService = new MarketDataService();
