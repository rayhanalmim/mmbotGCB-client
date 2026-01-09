'use client';

import { useState, useEffect, useCallback } from 'react';

interface MexcMMBot {
  _id: string;
  name: string;
  symbol: string;
  orderAmount: number;
  gapThreshold: number;
  cooldownSeconds: number;
  telegramEnabled: boolean;
  isActive: boolean;
  isRunning: boolean;
  executionCount: number;
  totalUsdtSpent: number;
  lastMarketPrice: number | null;
  lastBestAskPrice: number | null;
  lastPriceGap: number | null;
  lastCheckedAt: string | null;
  lastExecutedAt: string | null;
  createdAt: string;
}

interface MexcMMBotsListProps {
  refreshTrigger?: number;
}

export default function MexcMMBotsList({ refreshTrigger }: MexcMMBotsListProps) {
  const [bots, setBots] = useState<MexcMMBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';

  const fetchBots = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/mexc/bot/list`);
      const data = await response.json();
      if (data.code === '0') {
        setBots(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching bots:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchBots();
    const interval = setInterval(fetchBots, 5000);
    return () => clearInterval(interval);
  }, [fetchBots, refreshTrigger]);

  const handleStart = async (botId: string) => {
    setActionLoading(botId);
    try {
      const response = await fetch(`${API_URL}/api/mexc/bot/${botId}/start`, {
        method: 'PUT'
      });
      const data = await response.json();
      if (data.code === '0') {
        setSuccess('Bot started successfully');
        fetchBots();
      } else {
        setError(data.msg || 'Failed to start bot');
      }
    } catch (err) {
      setError('Error starting bot');
    } finally {
      setActionLoading(null);
      setTimeout(() => { setSuccess(null); setError(null); }, 3000);
    }
  };

  const handleStop = async (botId: string) => {
    setActionLoading(botId);
    try {
      const response = await fetch(`${API_URL}/api/mexc/bot/${botId}/stop`, {
        method: 'PUT'
      });
      const data = await response.json();
      if (data.code === '0') {
        setSuccess('Bot stopped successfully');
        fetchBots();
      } else {
        setError(data.msg || 'Failed to stop bot');
      }
    } catch (err) {
      setError('Error stopping bot');
    } finally {
      setActionLoading(null);
      setTimeout(() => { setSuccess(null); setError(null); }, 3000);
    }
  };

  const handleDelete = async (botId: string, botName: string) => {
    if (!confirm(`Are you sure you want to delete "${botName}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(botId);
    try {
      const response = await fetch(`${API_URL}/api/mexc/bot/${botId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.code === '0') {
        setSuccess('Bot deleted successfully');
        fetchBots();
      } else {
        setError(data.msg || 'Failed to delete bot');
      }
    } catch (err) {
      setError('Error deleting bot');
    } finally {
      setActionLoading(null);
      setTimeout(() => { setSuccess(null); setError(null); }, 3000);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B897]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-3">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Manage MEXC MM Bots</h2>
              <p className="text-white/80 text-sm">{bots.length} bot(s) configured</p>
            </div>
          </div>
          <button
            onClick={fetchBots}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-2 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Bots List */}
      {bots.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🤖</span>
          </div>
          <h3 className="text-white font-bold text-lg mb-2">No Bots Created</h3>
          <p className="text-gray-400 text-sm">Create your first MEXC MM Bot to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bots.map((bot) => (
            <div
              key={bot._id}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${bot.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{bot.name}</h3>
                    <p className="text-gray-400 text-sm">{bot.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {bot.isRunning ? (
                    <button
                      onClick={() => handleStop(bot._id)}
                      disabled={actionLoading === bot._id}
                      className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading === bot._id ? 'Stopping...' : 'Stop'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStart(bot._id)}
                      disabled={actionLoading === bot._id}
                      className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading === bot._id ? 'Starting...' : 'Start'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(bot._id, bot.name)}
                    disabled={actionLoading === bot._id}
                    className="bg-gray-700 text-gray-400 px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm disabled:opacity-50"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Bot Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-[#2a2a2a] rounded-lg p-3">
                  <div className="text-gray-400 text-xs">Order Amount</div>
                  <div className="text-white font-semibold">${bot.orderAmount} USDT</div>
                </div>
                <div className="bg-[#2a2a2a] rounded-lg p-3">
                  <div className="text-gray-400 text-xs">Gap Threshold</div>
                  <div className="text-white font-semibold">{bot.gapThreshold}%</div>
                </div>
                <div className="bg-[#2a2a2a] rounded-lg p-3">
                  <div className="text-gray-400 text-xs">Cooldown</div>
                  <div className="text-white font-semibold">{bot.cooldownSeconds}s</div>
                </div>
                <div className="bg-[#2a2a2a] rounded-lg p-3">
                  <div className="text-gray-400 text-xs">Executions</div>
                  <div className="text-white font-semibold">{bot.executionCount || 0}</div>
                </div>
              </div>

              {/* Live Data */}
              {bot.isRunning && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div className="text-blue-400 text-xs">Market Price</div>
                    <div className="text-white font-semibold">
                      ${bot.lastMarketPrice?.toFixed(6) || '---'}
                    </div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <div className="text-orange-400 text-xs">Best Ask</div>
                    <div className="text-white font-semibold">
                      ${bot.lastBestAskPrice?.toFixed(6) || '---'}
                    </div>
                  </div>
                  <div className={`rounded-lg p-3 ${
                    (bot.lastPriceGap || 0) >= bot.gapThreshold 
                      ? 'bg-red-500/10 border border-red-500/30' 
                      : 'bg-green-500/10 border border-green-500/30'
                  }`}>
                    <div className={`text-xs ${(bot.lastPriceGap || 0) >= bot.gapThreshold ? 'text-red-400' : 'text-green-400'}`}>
                      Price Gap
                    </div>
                    <div className="text-white font-semibold">
                      {bot.lastPriceGap?.toFixed(2) || '0.00'}%
                    </div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <div className="text-purple-400 text-xs">Total Spent</div>
                    <div className="text-white font-semibold">
                      ${(bot.totalUsdtSpent || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span>Created: {formatTime(bot.createdAt)}</span>
                <span>Last Check: {formatTime(bot.lastCheckedAt)}</span>
                <span>Last Trade: {formatTime(bot.lastExecutedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
