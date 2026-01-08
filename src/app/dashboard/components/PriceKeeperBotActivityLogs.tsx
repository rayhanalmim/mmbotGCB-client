'use client';

import { useState, useEffect, useCallback } from 'react';

interface MonitorLog {
  timestamp: string;
  type: string;
  message: string;
  data?: {
    marketPrice?: number;
    bestAskPrice?: number;
    botName?: string;
    orderId?: string;
    volume?: string;
  };
}

interface PriceKeeperBotActivityLogsProps {
  token: string | null;
  botId?: string;
}

export default function PriceKeeperBotActivityLogs({ token, botId }: PriceKeeperBotActivityLogsProps) {
  const [logs, setLogs] = useState<MonitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!token) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';
      const endpoint = botId 
        ? `${apiUrl}/api/bot/price-keeper/${botId}/logs?limit=100`
        : `${apiUrl}/api/bot/price-keeper/logs?limit=100`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.code === '0') {
        setLogs(data.data || []);
      } else {
        setError(data.msg || 'Failed to fetch logs');
      }
    } catch (err) {
      setError('Error fetching logs');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [token, botId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh every 3 seconds for real-time monitoring
  useEffect(() => {
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'trade':
        return '💱';
      default:
        return 'ℹ️';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-400 border-l-green-500';
      case 'error':
        return 'text-red-400 border-l-red-500';
      case 'warning':
        return 'text-yellow-400 border-l-yellow-500';
      case 'trade':
        return 'text-purple-400 border-l-purple-500';
      default:
        return 'text-cyan-400 border-l-cyan-500';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border border-cyan-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <span className="text-xl">🎯</span>
          </div>
          <div>
            <h3 className="text-white font-bold">Price Keeper Bot Activity</h3>
            <p className="text-xs text-gray-400">Real-time price monitoring logs</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 text-xs">Loading...</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border border-cyan-500/30 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
          <span className="text-xl">🎯</span>
        </div>
        <div>
          <h3 className="text-white font-bold">Price Keeper Bot Activity</h3>
          <p className="text-xs text-gray-400">Real-time price monitoring logs</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {logs.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs">Live</span>
            </div>
          )}
          <button
            onClick={fetchLogs}
            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 px-2 py-1 bg-cyan-500/10 rounded-lg hover:bg-cyan-500/20 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-300 hover:text-white">✕</button>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p>No activity logs yet. Start a Price Keeper bot to see logs here.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`bg-[#0f0f0f] border border-[#3f3f46] rounded-lg p-3 border-l-4 ${getTypeColor(log.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{getTypeIcon(log.type)}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${getTypeColor(log.type).split(' ')[0]}`}>
                      {log.message}
                    </div>
                    {log.data && (log.data.marketPrice || log.data.bestAskPrice) && (
                      <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        {log.data.marketPrice && (
                          <span className="bg-[#27272a] px-2 py-0.5 rounded">
                            <span className="text-gray-500">Market:</span>
                            <span className="text-white ml-1">${log.data.marketPrice.toFixed(6)}</span>
                          </span>
                        )}
                        {log.data.bestAskPrice && (
                          <span className="bg-[#27272a] px-2 py-0.5 rounded">
                            <span className="text-gray-500">Best Ask:</span>
                            <span className="text-white ml-1">${log.data.bestAskPrice.toFixed(6)}</span>
                          </span>
                        )}
                        {log.data.orderId && (
                          <span className="bg-[#27272a] px-2 py-0.5 rounded">
                            <span className="text-gray-500">Order:</span>
                            <span className="text-cyan-400 ml-1">{String(log.data.orderId).slice(-8)}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-gray-500 text-xs whitespace-nowrap ml-2">
                  {formatDate(log.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
