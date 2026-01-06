'use client';

import { useEffect, useState } from 'react';

interface LogEntry {
  _id?: string;
  timestamp: string;
  type: string;
  message: string;
  action?: string;
  botName?: string;
  details?: {
    placedOrders?: Array<{ price: number; usdtAmount: number }>;
    refilledOrders?: Array<{ price: number; usdtAmount: number }>;
    filledOrders?: Array<{ price: number; usdtAmount: number }>;
    marketPrice?: number;
  };
}

interface BuyWallBotActivityLogsProps {
  token: string | null;
}

export default function BuyWallBotActivityLogs({ token }: BuyWallBotActivityLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!token) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/bot/buywall/logs?limit=100`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.code === '0') {
        setLogs(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching buy wall bot logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [token]);

  const getLogIcon = (type: string, action?: string) => {
    if (action === 'INITIAL_PLACE') return '🧱';
    if (action === 'REFILL') return '🔄';
    if (action === 'TOPUP_PARTIAL') return '➕';
    
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-[#27272a]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
            <span className="text-lg">📋</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Buy Wall Bot Activity</h2>
            <p className="text-xs text-gray-400">Real-time order placement and refill logs</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-[#27272a]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
            <span className="text-lg">📋</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Buy Wall Bot Activity</h2>
            <p className="text-xs text-gray-400">Real-time order placement and refill logs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No activity logs yet</p>
          <p className="text-gray-500 text-xs mt-1">Start a Buy Wall bot to see activity here</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {logs.map((log, index) => (
            <div
              key={log._id || index}
              className="bg-[#27272a] rounded-lg p-3 hover:bg-[#2f2f32] transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{getLogIcon(log.type, log.action)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${getLogColor(log.type)}`}>
                      {log.message}
                    </p>
                    <span className="text-[10px] text-gray-500 flex-shrink-0">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  
                  {/* Show bot name if available */}
                  {log.botName && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Bot: {log.botName}
                    </p>
                  )}
                  
                  {/* Show details for order placements */}
                  {log.details?.placedOrders && log.details.placedOrders.length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      <p className="font-semibold text-green-400 mb-1">Placed Orders:</p>
                      <div className="flex flex-wrap gap-1">
                        {log.details.placedOrders.slice(0, 5).map((order, i) => (
                          <span key={i} className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-green-300">
                            ${order.price.toFixed(4)} = ${order.usdtAmount}
                          </span>
                        ))}
                        {log.details.placedOrders.length > 5 && (
                          <span className="px-2 py-0.5 text-gray-500">
                            +{log.details.placedOrders.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Show details for refills */}
                  {log.details?.refilledOrders && log.details.refilledOrders.length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      <p className="font-semibold text-blue-400 mb-1">Refilled Orders:</p>
                      <div className="flex flex-wrap gap-1">
                        {log.details.refilledOrders.slice(0, 5).map((order, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300">
                            ${order.price.toFixed(4)} = ${order.usdtAmount.toFixed(2)}
                          </span>
                        ))}
                        {log.details.refilledOrders.length > 5 && (
                          <span className="px-2 py-0.5 text-gray-500">
                            +{log.details.refilledOrders.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Show market price if available */}
                  {log.details?.marketPrice && (
                    <p className="text-xs text-gray-500 mt-1">
                      Market Price: <span className="text-orange-400">${log.details.marketPrice.toFixed(6)}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
