import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Signal, Layers, TrendingUp, Search } from "lucide-react";
import { TabType } from "@/types/trading";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  newSignalsCount?: number;
  todayPnL?: string;
  todayTrades?: number;
  winRate?: string;
}

export function TabNavigation({ 
  activeTab, 
  onTabChange, 
  newSignalsCount = 0,
  todayPnL = "+₹0",
  todayTrades = 0,
  winRate = "0%"
}: TabNavigationProps) {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: BarChart3
    },
    {
      id: 'signals' as TabType,
      label: 'Live Signals',
      icon: Signal,
      badge: newSignalsCount > 0 ? newSignalsCount : undefined
    },
    {
      id: 'options' as TabType,
      label: 'Options Analysis',
      icon: Layers
    },
    {
      id: 'paper-trading' as TabType,
      label: 'Paper Trading',
      icon: TrendingUp
    },
    {
      id: 'screener' as TabType,
      label: 'Stock Screener',
      icon: Search
    }
  ];

  return (
    <nav className="w-64 bg-card border-r border-border p-4" data-testid="tab-navigation">
      <div className="space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              onClick={() => onTabChange(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              <Icon size={20} className="mr-3" />
              <span className="font-medium">{tab.label}</span>
              {tab.badge && (
                <Badge 
                  variant="destructive" 
                  className="ml-auto bg-accent text-accent-foreground text-xs"
                  data-testid={`badge-${tab.id}`}
                >
                  {tab.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Today's Performance
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">P&L</span>
            <span 
              className={`text-sm font-semibold font-mono ${todayPnL.startsWith('+') ? 'text-success' : todayPnL.startsWith('-') ? 'text-destructive' : 'text-foreground'}`}
              data-testid="text-today-pnl"
            >
              {todayPnL}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Trades</span>
            <span className="text-sm font-semibold font-mono" data-testid="text-today-trades">
              {todayTrades}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Win Rate</span>
            <span className="text-sm font-semibold font-mono" data-testid="text-win-rate">
              {winRate}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
