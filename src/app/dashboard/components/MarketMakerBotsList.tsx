'use client';

import { useEffect, useState } from 'react';
import apiClient, { type MarketMakerBot } from '@/lib/api';

interface MarketMakerBotsListProps {
  token: string | null;
  refreshTrigger: number;
}

export default function MarketMakerBotsList({ token, refreshTrigger }: MarketMakerBotsListProps) {
  const [bots, setBots] = useState<MarketMakerBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchBots = async () => {
      try {
        const response = await apiClient.marketMakerBot.getList(token);
        if (response.code === '0' && response.data) {
          setBots(response.data);
        }
      } catch (err) {
        console.error('Error fetching market maker bots:', err);
        setError('Failed to load market maker bots');
      } finally {
        setLoading(false);
      }
    };

    fetchBots();
  }, [token, refreshTrigger]);

  const handleStart = async (botId: string) => {
    if (!token) return;
    try {
      const response = await apiClient.marketMakerBot.start(botId, token);
      if (response.code === '0') {
        setBots(bots.map(b => b._id === botId ? { ...b, isActive: true, isRunning: true, status: 'running' } : b));
      }
    } catch (err) {
      console.error('Error starting bot:', err);
    }
  };

  const handleStop = async (botId: string) => {
    if (!token) return;
    try {
      const response = await apiClient.marketMakerBot.stop(botId, token);
      if (response.code === '0') {
        setBots(bots.map(b => b._id === botId ? { ...b, isActive: false, isRunning: false, status: 'stopped' } : b));
      }
    } catch (err) {
      console.error('Error stopping bot:', err);
    }
  };

  const handleDelete = async (botId: string) => {
    if (!token || !confirm('Are you sure you want to delete this bot?')) return;
    try {
      const response = await apiClient.marketMakerBot.delete(botId, token);
      if (response.code === '0') {
        setBots(bots.filter(b => b._id !== botId));
      }
    } catch (err) {
      console.error('Error deleting bot:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-48"></div>
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl flex items-center justify-center shadow-lg shadow-[#F59E0B]/50">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Market Maker Bots</h2>
          <p className="text-xs text-gray-400">{bots.length} bot(s) configured</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {bots.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-400 text-sm">No market maker bots created yet</p>
          <p className="text-gray-500 text-xs mt-2">Create your first bot to start market making</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bots.map((bot) => (
            <div
              key={bot._id}
              className="bg-[#27272a] rounded-xl p-4 border border-[#3f3f46] hover:border-[#F59E0B] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{bot.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      bot.status === 'running' ? 'bg-green-500/20 text-green-400' :
                      bot.status === 'stopped' ? 'bg-gray-500/20 text-gray-400' :
                      bot.status === 'target_reached' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {bot.status === 'target_reached' ? 'Target Reached' : bot.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex items-center gap-4">
                      <span>Symbol: <span className="text-orange-400 font-mono">{bot.symbol}</span></span>
                      <span>Target: <span className="text-yellow-400 font-mono">${bot.targetPrice.toFixed(6)}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bot Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs">
                <div className="bg-[#1a1a1a] rounded-lg p-2">
                  <div className="text-gray-500 mb-1">Spread</div>
                  <div className="text-white font-mono">{(bot.spreadPercent * 100).toFixed(2)}%</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-2">
                  <div className="text-gray-500 mb-1">Order Size</div>
                  <div className="text-white font-mono">{bot.orderSize} GCB</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-2">
                  <div className="text-gray-500 mb-1">Target Price</div>
                  <div className="text-white font-mono">${bot.targetPrice.toFixed(6)}</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-2">
                  <div className="text-gray-500 mb-1">Cycles</div>
                  <div className="text-white font-mono">{bot.executionCount || 0}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {bot.isActive && bot.isRunning ? (
                  <button
                    onClick={() => handleStop(bot._id)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    Stop Bot
                  </button>
                ) : (
                  <button
                    onClick={() => handleStart(bot._id)}
                    className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Bot
                  </button>
                )}
                
                <button
                  onClick={() => handleDelete(bot._id)}
                  className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                  title="Delete Bot"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Last Execution */}
              {bot.lastExecutedAt && (
                <div className="text-[10px] text-gray-500 mt-3 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Last executed: {new Date(bot.lastExecutedAt).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

