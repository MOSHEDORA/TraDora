import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TradeFormData {
  instrument: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  stopLoss: number | null;
  target: number | null;
}

export function TradingForm() {
  const [formData, setFormData] = useState<TradeFormData>({
    instrument: '',
    action: 'BUY',
    quantity: 25,
    price: 0,
    stopLoss: null,
    target: null
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // No hardcoded instruments - should fetch from option chain API
  const instruments: { value: string; label: string }[] = [];

  const placeTradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      const response = await fetch('/api/paper-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData),
      });

      if (!response.ok) {
        throw new Error('Failed to place trade');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade Placed Successfully",
        description: `${formData.action} ${formData.quantity} lots of ${formData.instrument}`,
      });
      
      // Reset form
      setFormData({
        ...formData,
        quantity: 25,
        price: 0,
        stopLoss: null,
        target: null
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/paper-trades'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to place trade. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    const tradeData = {
      instrument: formData.instrument.replace(/_/g, ' '),
      action: formData.action,
      quantity: formData.quantity,
      entryPrice: formData.price.toString(),
      stopLoss: formData.stopLoss?.toString() || null,
      target: formData.target?.toString() || null,
    };

    placeTradeMutation.mutate(tradeData);
  };

  const handleInputChange = (field: keyof TradeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card data-testid="card-trading-form">
      <CardHeader>
        <CardTitle>Place Trade</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-paper-trade">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instrument">Instrument</Label>
              <Select
                value={formData.instrument}
                onValueChange={(value) => handleInputChange('instrument', value)}
              >
                <SelectTrigger data-testid="select-instrument">
                  <SelectValue placeholder="Select instrument" />
                </SelectTrigger>
                <SelectContent>
                  {instruments.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No Data Available - Requires option chain data
                    </div>
                  ) : (
                    instruments.map((instrument) => (
                      <SelectItem 
                        key={instrument.value} 
                        value={instrument.value}
                        data-testid={`option-${instrument.value}`}
                      >
                        {instrument.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="action">Action</Label>
              <Select
                value={formData.action}
                onValueChange={(value: 'BUY' | 'SELL') => handleInputChange('action', value)}
              >
                <SelectTrigger data-testid="select-action">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY" data-testid="option-buy">Buy</SelectItem>
                  <SelectItem value="SELL" data-testid="option-sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity (Lots)</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                data-testid="input-quantity"
              />
            </div>
            
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.05"
                min="0.05"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                placeholder="Entry price"
                required
                data-testid="input-price"
              />
            </div>
            
            <div>
              <Label htmlFor="stopLoss">Stop Loss (₹)</Label>
              <Input
                id="stopLoss"
                type="number"
                step="0.05"
                min="0.05"
                value={formData.stopLoss || ''}
                onChange={(e) => handleInputChange('stopLoss', parseFloat(e.target.value) || null)}
                placeholder="Optional"
                data-testid="input-stop-loss"
              />
            </div>
            
            <div>
              <Label htmlFor="target">Target (₹)</Label>
              <Input
                id="target"
                type="number"
                step="0.05"
                min="0.05"
                value={formData.target || ''}
                onChange={(e) => handleInputChange('target', parseFloat(e.target.value) || null)}
                placeholder="Optional"
                data-testid="input-target"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={placeTradeMutation.isPending}
            data-testid="button-place-trade"
          >
            {placeTradeMutation.isPending ? 'Placing Trade...' : 'Place Trade'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
