import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

interface OHLCRecord {
  id: string;
  symbol: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: number;
  timestamp: string;
  change: string;
  changePercent: string;
}

interface DailyTrainingRecord {
  date: string;
  symbol: string;
  recordCount: number;
  averageVolatility: number;
  priceRange: number;
  trainedModelPath?: string;
}

class FileDataService {
  private dataDir = path.join(process.cwd(), 'data');
  private ohlcDir = path.join(this.dataDir, 'ohlc');
  private modelsDir = path.join(this.dataDir, 'models');
  private trainingDir = path.join(this.dataDir, 'training');

  async init() {
    // Create data directories if they don't exist
    await this.ensureDirectoryExists(this.dataDir);
    await this.ensureDirectoryExists(this.ohlcDir);
    await this.ensureDirectoryExists(this.modelsDir);
    await this.ensureDirectoryExists(this.trainingDir);
  }

  private async ensureDirectoryExists(dirPath: string) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private getOHLCFilePath(symbol: string, date: string): string {
    return path.join(this.ohlcDir, `${symbol}_${date}.json`);
  }

  private getTrainingFilePath(date: string): string {
    return path.join(this.trainingDir, `training_${date}.json`);
  }

  async saveOHLCData(record: Omit<OHLCRecord, 'id'>): Promise<OHLCRecord> {
    await this.init();

    const recordWithId: OHLCRecord = {
      ...record,
      id: nanoid()
    };

    const date = new Date(record.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
    const filePath = this.getOHLCFilePath(record.symbol, date);

    try {
      // Read existing data for the day
      let existingData: OHLCRecord[] = [];
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
      } catch (error) {
        // File doesn't exist, start with empty array
        existingData = [];
      }

      // Add new record and sort by timestamp
      existingData.push(recordWithId);
      existingData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Keep only the last 1000 records per day to prevent files from getting too large
      if (existingData.length > 1000) {
        existingData = existingData.slice(-1000);
      }

      // Write back to file
      await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
      
      console.log(`📁 Saved OHLC data for ${record.symbol} on ${date}: ${existingData.length} total records`);
      return recordWithId;
    } catch (error) {
      console.error(`Error saving OHLC data for ${record.symbol}:`, error);
      throw error;
    }
  }

  async getOHLCData(symbol?: string, fromDate?: string, toDate?: string, limit?: number): Promise<OHLCRecord[]> {
    await this.init();

    try {
      const files = await fs.readdir(this.ohlcDir);
      let allData: OHLCRecord[] = [];

      for (const file of files) {
        // Parse filename to get symbol and date
        const match = file.match(/^(\w+)_(\d{4}-\d{2}-\d{2})\.json$/);
        if (!match) continue;

        const [, fileSymbol, fileDate] = match;
        
        // Filter by symbol if specified
        if (symbol && fileSymbol !== symbol) continue;
        
        // Filter by date range if specified
        if (fromDate && fileDate < fromDate) continue;
        if (toDate && fileDate > toDate) continue;

        try {
          const filePath = path.join(this.ohlcDir, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const dayData: OHLCRecord[] = JSON.parse(fileContent);
          allData = allData.concat(dayData);
        } catch (error) {
          console.warn(`Error reading file ${file}:`, error);
        }
      }

      // Sort by timestamp (newest first)
      allData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply limit if specified
      if (limit && limit > 0) {
        allData = allData.slice(0, limit);
      }

      return allData;
    } catch (error) {
      console.error('Error reading OHLC data:', error);
      return [];
    }
  }

  async getLatestOHLCData(symbols: string[]): Promise<OHLCRecord[]> {
    const latest: OHLCRecord[] = [];
    
    for (const symbol of symbols) {
      const symbolData = await this.getOHLCData(symbol, undefined, undefined, 1);
      if (symbolData.length > 0) {
        latest.push(symbolData[0]);
      }
    }

    return latest;
  }

  async trainDailyModel(): Promise<void> {
    await this.init();
    
    const today = new Date().toISOString().split('T')[0];
    const symbols = ['NIFTY', 'BANKNIFTY', 'SENSEX'];
    
    console.log(`🤖 Starting daily model training for ${today}`);

    const trainingRecord: DailyTrainingRecord = {
      date: today,
      symbol: 'ALL',
      recordCount: 0,
      averageVolatility: 0,
      priceRange: 0
    };

    try {
      // Gather training data from the last 30 days
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      const fromDateStr = fromDate.toISOString().split('T')[0];

      let totalRecords = 0;
      let totalVolatility = 0;
      let totalPriceRange = 0;

      for (const symbol of symbols) {
        const symbolData = await this.getOHLCData(symbol, fromDateStr, today);
        
        if (symbolData.length > 0) {
          totalRecords += symbolData.length;
          
          // Calculate volatility and price range
          for (const record of symbolData) {
            const open = parseFloat(record.open);
            const close = parseFloat(record.close);
            const high = parseFloat(record.high);
            const low = parseFloat(record.low);
            
            // Simple volatility calculation
            const volatility = Math.abs((close - open) / open) * 100;
            totalVolatility += volatility;
            
            // Price range
            const priceRange = ((high - low) / open) * 100;
            totalPriceRange += priceRange;
          }
        }
      }

      if (totalRecords > 0) {
        trainingRecord.recordCount = totalRecords;
        trainingRecord.averageVolatility = totalVolatility / totalRecords;
        trainingRecord.priceRange = totalPriceRange / totalRecords;

        // Simulate model training (in a real system, this would train an ML model)
        console.log(`📊 Training data summary:
  - Records: ${totalRecords}
  - Avg Volatility: ${trainingRecord.averageVolatility.toFixed(2)}%
  - Avg Price Range: ${trainingRecord.priceRange.toFixed(2)}%`);

        // Save training record
        const trainingFilePath = this.getTrainingFilePath(today);
        await fs.writeFile(trainingFilePath, JSON.stringify(trainingRecord, null, 2));
        
        console.log(`✅ Daily model training completed for ${today}`);
      } else {
        console.log(`❌ No training data available for ${today}`);
      }
    } catch (error) {
      console.error('Error during daily model training:', error);
    }
  }

  async getTrainingHistory(): Promise<DailyTrainingRecord[]> {
    await this.init();
    
    try {
      const files = await fs.readdir(this.trainingDir);
      const trainingRecords: DailyTrainingRecord[] = [];

      for (const file of files) {
        if (file.startsWith('training_') && file.endsWith('.json')) {
          try {
            const filePath = path.join(this.trainingDir, file);
            const fileContent = await fs.readFile(filePath, 'utf8');
            const record: DailyTrainingRecord = JSON.parse(fileContent);
            trainingRecords.push(record);
          } catch (error) {
            console.warn(`Error reading training file ${file}:`, error);
          }
        }
      }

      // Sort by date (newest first)
      trainingRecords.sort((a, b) => b.date.localeCompare(a.date));
      return trainingRecords;
    } catch (error) {
      console.error('Error reading training history:', error);
      return [];
    }
  }

  async getDataSummary(): Promise<{
    totalRecords: number;
    latestDate: string;
    oldestDate: string;
    symbols: string[];
    dailyTrainingCount: number;
  }> {
    await this.init();

    try {
      const files = await fs.readdir(this.ohlcDir);
      let totalRecords = 0;
      let latestDate = '';
      let oldestDate = '';
      const symbolSet = new Set<string>();

      for (const file of files) {
        const match = file.match(/^(\w+)_(\d{4}-\d{2}-\d{2})\.json$/);
        if (!match) continue;

        const [, symbol, date] = match;
        symbolSet.add(symbol);

        if (!latestDate || date > latestDate) latestDate = date;
        if (!oldestDate || date < oldestDate) oldestDate = date;

        try {
          const filePath = path.join(this.ohlcDir, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const dayData: OHLCRecord[] = JSON.parse(fileContent);
          totalRecords += dayData.length;
        } catch (error) {
          console.warn(`Error reading file ${file} for summary:`, error);
        }
      }

      const trainingHistory = await this.getTrainingHistory();

      return {
        totalRecords,
        latestDate,
        oldestDate,
        symbols: Array.from(symbolSet),
        dailyTrainingCount: trainingHistory.length
      };
    } catch (error) {
      console.error('Error getting data summary:', error);
      return {
        totalRecords: 0,
        latestDate: '',
        oldestDate: '',
        symbols: [],
        dailyTrainingCount: 0
      };
    }
  }
}

export const fileDataService = new FileDataService();