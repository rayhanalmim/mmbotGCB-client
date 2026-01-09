'use client';

import { useState, useEffect, useCallback } from 'react';

interface PriceKeeperBot {
  _id: string;
  name: string;
  symbol: string;
  orderAmount: number;
  cooldownSeconds: number;
  isActive: boolean;
  isRunning: boolean;
  executionCount: number;
  totalUsdtSpent: number;
  lastExecutedAt: string | null;
  lastCheckedAt: string | null;
  lastMarketPrice: number | null;
  lastBestAskPrice: number | null;
  createdAt: string;
  status: string;
}

interface PriceKeeperBotsListProps {
  token: string | null;
  refreshTrigger: number;
}

export default function PriceKeeperBotsList({ token, refreshTrigger }: PriceKeeperBotsListProps) {
  const [bots, setBots] = useState<PriceKeeperBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBots = useCallback(async () => {
    if (!token) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';
      const response = await fetch(`${apiUrl}/api/bot/price-keeper/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.code === '0') {
        setBots(data.data || []);
      } else {
        setError(data.msg || 'Failed to fetch bots');
      }
    } catch (err) {
      setError('Error fetching Price Keeper bots');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBots();
  }, [fetchBots, refreshTrigger]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchBots, 5000);
    return () => clearInterval(interval);
  }, [fetchBots]);

  const handleStart = async (botId: string) => {
    if (!token) return;
    setActionLoading(botId);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';
      const response = await fetch(`${apiUrl}/api/bot/price-keeper/${botId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.code === '0') {
        await fetchBots();
      } else {
        setError(data.msg || 'Failed to start bot');
      }
    } catch (err) {
      setError('Error starting bot');
      console.error('Error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (botId: string) => {
    if (!token) return;
    setActionLoading(botId);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';
      const response = await fetch(`${apiUrl}/api/bot/price-keeper/${botId}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.code === '0') {
        await fetchBots();
      } else {
        setError(data.msg || 'Failed to stop bot');
      }
    } catch (err) {
      setError('Error stopping bot');
      console.error('Error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (botId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this bot?')) return;
    
    setActionLoading(botId);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';
      const response = await fetch(`${apiUrl}/api/bot/price-keeper/${botId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.code === '0') {
        await fetchBots();
      } else {
        setError(data.msg || 'Failed to delete bot');
      }
    } catch (err) {
      setError('Error deleting bot');
      console.error('Error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">🎯</div>
        <p>No Price Keeper bots yet. Create one above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-300 hover:text-white">✕</button>
        </div>
      )}

      {bots.map((bot) => (
        <div
          key={bot._id}
          className={`bg-[#1a1a1a] border rounded-xl p-4 transition-all ${
            bot.isRunning 
              ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
              : 'border-[#3f3f46]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${bot.isRunning ? 'bg-cyan-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <h3 className="text-white font-bold">{bot.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                bot.isRunning 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {bot.isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {bot.isRunning ? (
                <button
                  onClick={() => handleStop(bot._id)}
                  disabled={actionLoading === bot._id}
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === bot._id ? '...' : '⏹️ Stop'}
                </button>
              ) : (
                <button
                  onClick={() => handleStart(bot._id)}
                  disabled={actionLoading === bot._id}
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === bot._id ? '...' : '▶️ Start'}
                </button>
              )}
              <button
                onClick={() => handleDelete(bot._id)}
                disabled={actionLoading === bot._id}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-[#27272a] rounded-lg p-2">
              <div className="text-gray-500 text-xs">Order Amount</div>
              <div className="text-white font-medium">${bot.orderAmount?.toFixed(2) || '0.10'}</div>
            </div>
            <div className="bg-[#27272a] rounded-lg p-2">
              <div className="text-gray-500 text-xs">Cooldown</div>
              <div className="text-white font-medium">{bot.cooldownSeconds || 5}s</div>
            </div>
            <div className="bg-[#27272a] rounded-lg p-2">
              <div className="text-gray-500 text-xs">Executions</div>
              <div className="text-cyan-400 font-medium">{bot.executionCount || 0}</div>
            </div>
            <div className="bg-[#27272a] rounded-lg p-2">
              <div className="text-gray-500 text-xs">Total Spent</div>
              <div className="text-green-400 font-medium">${bot.totalUsdtSpent?.toFixed(2) || '0.00'}</div>
            </div>
          </div>

          {/* Price Info */}
          {bot.isRunning && (bot.lastMarketPrice || bot.lastBestAskPrice) && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[#27272a] rounded-lg p-2">
                <div className="text-gray-500 text-xs">Market Price</div>
                <div className="text-white font-medium">
                  ${bot.lastMarketPrice?.toFixed(6) || '-'}
                </div>
              </div>
              <div className="bg-[#27272a] rounded-lg p-2">
                <div className="text-gray-500 text-xs">Best Ask</div>
                <div className="text-white font-medium">
                  ${bot.lastBestAskPrice?.toFixed(6) || '-'}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>Created: {formatDate(bot.createdAt)}</span>
            <span>Last Executed: {formatDate(bot.lastExecutedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
