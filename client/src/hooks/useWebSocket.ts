import { useEffect, useRef, useState } from 'react';
import { WebSocketMessage } from '@/types/trading';

export function useWebSocket(url: string) {
  const ws = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'Connecting' | 'Open' | 'Closed'>('Closed');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      setConnectionStatus('Open');
      console.log('WebSocket connected');
    };
    
    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.current.onclose = () => {
      setConnectionStatus('Closed');
      console.log('WebSocket disconnected');
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('Closed');
    };
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);
  
  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };
  
  return {
    connectionStatus,
    lastMessage,
    sendMessage
  };
}
