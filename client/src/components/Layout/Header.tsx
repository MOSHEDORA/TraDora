import { Moon, Sun, Settings, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface HeaderProps {
  onThemeToggle: () => void;
  isDark: boolean;
}

export function Header({ onThemeToggle, isDark }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between" data-testid="header">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Activity className="text-primary-foreground" size={16} />
          </div>
          <h1 className="text-xl font-bold text-foreground">TradePro Analytics</h1>
        </div>
        <div className="hidden md:flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-muted"></div>
            <span className="text-muted-foreground">
              Market Status: No Data Available
            </span>
          </div>
          <span className="text-muted-foreground font-mono" data-testid="current-time">
            {formatTime(currentTime)} IST
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden lg:flex items-center space-x-3 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-muted-foreground">Angel One</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-muted-foreground">Yahoo Finance</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-warning rounded-full"></div>
            <span className="text-muted-foreground">NSE API</span>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onThemeToggle}
          data-testid="button-theme-toggle"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-settings"
        >
          <Settings size={20} />
        </Button>
      </div>
    </header>
  );
}
