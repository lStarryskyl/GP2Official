import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Convert http/https to ws/wss
const WEBSOCKET_URL = BASE_URL.replace(/^http/, 'ws') + '/api/ws';

export interface WebSocketMessage {
  type: string;
  project_id?: string;
  data: any;
}

export const useWebSocket = (projectId: string) => {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const connect = () => {
      const token = localStorage.getItem('access_token') || '';
      // Connect to the common project collaboration websocket
      const wsUrl = `${WEBSOCKET_URL}/projects/${projectId}/collaborate${token ? `?token=${token}` : ''}`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => setIsConnected(false);
      ws.onerror = (error) => console.error('WebSocket error:', error);
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          setLastMessage(msg);
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, [projectId]);

  return { lastMessage, isConnected, ws: wsRef.current };
};
