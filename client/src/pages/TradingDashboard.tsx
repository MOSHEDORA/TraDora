import { useState, useEffect } from 'react';
import { Header } from '@/components/Layout/Header';
import { TabNavigation } from '@/components/Layout/TabNavigation';
import { MarketOverview } from '@/components/Dashboard/MarketOverview';
import { TechnicalIndicators } from '@/components/Dashboard/TechnicalIndicators';
import { AIInsights } from '@/components/Dashboard/AIInsights';
import { SignalsPanel } from '@/components/LiveSignals/SignalsPanel';
import { OptionChain } from '@/components/Options/OptionChain';
import { OptionsStrategies } from '@/components/Options/OptionsStrategies';
import { TradingForm } from '@/components/PaperTrading/TradingForm';
import { Portfolio } from '@/components/PaperTrading/Portfolio';
import { ScreenerTable } from '@/components/StockScreener/ScreenerTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketData } from '@/hooks/useMarketData';
import { useQuery } from '@tanstack/react-query';
import { TabType, PaperTrade } from '@/types/trading';
import { CandlestickChart, BarChart3 } from 'lucide-react';

export default function TradingDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isDark, setIsDark] = useState(false);
  
  const { marketData, technicalIndicators, aiAnalysis, isLoading, connectionStatus } = useMarketData();

  // Fetch paper trading summary for sidebar stats
  const { data: paperTrades } = useQuery<PaperTrade[]>({
    queryKey: ['/api/paper-trades'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Calculate paper trading stats
  const todayTrades = paperTrades?.filter(trade => {
    const today = new Date().toDateString();
    return new Date(trade.createdAt).toDateString() === today;
  }).length || 0;

  const todayPnL = paperTrades?.filter(trade => {
    const today = new Date().toDateString();
    return new Date(trade.createdAt).toDateString() === today;
  }).reduce((sum, trade) => sum + parseFloat(trade.pnl), 0) || 0;

  const totalTrades = paperTrades?.length || 0;
  const winningTrades = paperTrades?.filter(trade => parseFloat(trade.pnl) > 0).length || 0;
  const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0;

  const formatCurrency = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}₹${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <MarketOverview marketData={marketData} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Chart Placeholder */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>Nifty 50 - 5 Min Chart</CardTitle>
                  <div className="flex items-center space-x-2">
                    <select className="px-3 py-1 text-sm border border-border rounded-lg bg-background">
                      <option>1 Min</option>
                      <option>5 Min</option>
                      <option>15 Min</option>
                      <option>1 Hour</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <CandlestickChart size={48} className="text-muted-foreground mb-4 mx-auto" />
                      <p className="text-muted-foreground">Real-time Candlestick Chart</p>
                      <p className="text-sm text-muted-foreground mt-1">Integrating with Chart.js/TradingView</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <TechnicalIndicators indicators={technicalIndicators} />
            </div>

            <AIInsights analysis={aiAnalysis} isConnected={connectionStatus === 'connected'} />
          </div>
        );
      
      case 'signals':
        return <SignalsPanel />;
      
      case 'options':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Options Analysis</h2>
              <div className="flex items-center space-x-4">
                <select className="px-4 py-2 border border-border rounded-lg bg-background">
                  <option value="banknifty">Bank Nifty</option>
                  <option value="nifty">Nifty 50</option>
                </select>
                <select className="px-4 py-2 border border-border rounded-lg bg-background">
                  <option>25 Jan 2024</option>
                  <option>01 Feb 2024</option>
                  <option>08 Feb 2024</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Put-Call Ratio</h3>
                  <div className="text-2xl font-bold font-mono">0.68</div>
                  <div className="text-sm text-success">Bullish</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Max Pain</h3>
                  <div className="text-2xl font-bold font-mono">44,400</div>
                  <div className="text-sm text-muted-foreground">Strike</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Implied Volatility</h3>
                  <div className="text-2xl font-bold font-mono">18.25%</div>
                  <div className="text-sm text-warning">Elevated</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Total OI</h3>
                  <div className="text-2xl font-bold font-mono">8.2L</div>
                  <div className="text-sm text-muted-foreground">Contracts</div>
                </CardContent>
              </Card>
            </div>
            
            <OptionChain />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OptionsStrategies />
              
              <Card>
                <CardHeader>
                  <CardTitle>Greeks Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">Delta (44400 CE)</span>
                    <span className="font-mono font-semibold">0.52</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">Gamma (44400 CE)</span>
                    <span className="font-mono font-semibold">0.0012</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">Theta (44400 CE)</span>
                    <span className="font-mono font-semibold text-destructive">-8.25</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">Vega (44400 CE)</span>
                    <span className="font-mono font-semibold">12.8</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      case 'paper-trading':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Paper Trading</h2>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Virtual Balance</div>
                <div className="text-xl font-bold font-mono text-primary">₹50,000</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TradingForm />
              </div>
              <div>
                <Portfolio />
              </div>
            </div>
          </div>
        );
      
      case 'screener':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Stock Screener</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">High Volume Stocks</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Min Volume:</span>
                      <span className="text-sm font-mono">1M shares</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Volume vs Avg:</span>
                      <span className="text-sm font-mono">200%+</span>
                    </div>
                    <div className="text-sm text-success">✓ Screening active</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">High Price Stocks</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Min Price:</span>
                      <span className="text-sm font-mono">₹1000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Market Cap:</span>
                      <span className="text-sm font-mono">₹10,000Cr+</span>
                    </div>
                    <div className="text-sm text-success">✓ Screening active</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">High Volatility Stocks</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Min Volatility:</span>
                      <span className="text-sm font-mono">30%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Price Change:</span>
                      <span className="text-sm font-mono">±5%+</span>
                    </div>
                    <div className="text-sm text-success">✓ Screening active</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <ScreenerTable />
          </div>
        );
      
      default:
        return <div>Tab not found</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 size={48} className="text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading trading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header onThemeToggle={toggleTheme} isDark={isDark} />
      
      <div className="flex-1 flex overflow-hidden">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          newSignalsCount={3}
          todayPnL={formatCurrency(todayPnL)}
          todayTrades={todayTrades}
          winRate={`${winRate}%`}
        />
        
        <main className="flex-1 overflow-auto p-6">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
