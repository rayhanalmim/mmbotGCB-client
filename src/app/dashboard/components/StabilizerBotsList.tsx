'use client';

import { useEffect, useState } from 'react';
import apiClient, { type StabilizerBot } from '@/lib/api';

interface StabilizerBotsListProps {
  token: string | null;
  refreshTrigger: number;
}

export default function StabilizerBotsList({ token, refreshTrigger }: StabilizerBotsListProps) {
  const [bots, setBots] = useState<StabilizerBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchBots = async () => {
      try {
        const response = await apiClient.stabilizerBot.getList(token);
        if (response.code === '0' && response.data) {
          setBots(response.data);
        }
      } catch (err) {
        console.error('Error fetching stabilizer bots:', err);
        setError('Failed to load stabilizer bots');
      } finally {
        setLoading(false);
      }
    };

    fetchBots();
    
    // Poll every 4 seconds for updates
    const interval = setInterval(fetchBots, 4000);
    return () => clearInterval(interval);
  }, [token, refreshTrigger]);

  const handleStart = async (botId: string) => {
    if (!token) return;
    try {
      const response = await apiClient.stabilizerBot.start(botId, token);
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
      const response = await apiClient.stabilizerBot.stop(botId, token);
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
      const response = await apiClient.stabilizerBot.delete(botId, token);
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
          <div className="space-y-3">
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
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/50">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Stabilizer Bots</h2>
          <p className="text-xs text-gray-400">{bots.length} bot(s) configured</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {bots.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/30">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-gray-300 font-semibold">No stabilizer bots yet</p>
          <p className="text-gray-500 text-sm mt-2">Create your first stabilizer bot to maintain target prices</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bots.map((bot) => {
            const isRunning = bot.status === 'running';
            const priceChange = bot.lastMarketPrice && bot.lastFinalPrice 
              ? (((bot.lastFinalPrice - bot.lastMarketPrice) / bot.lastMarketPrice) * 100)
              : 0;
            
            return (
              <div 
                key={bot._id} 
                className={`
                  group relative bg-[#1f1f23] border-2 rounded-2xl p-5 transition-all duration-300
                  hover:shadow-2xl hover:scale-[1.01]
                  ${isRunning 
                    ? 'border-green-500/50 shadow-lg shadow-green-500/20' 
                    : 'border-[#3f3f46] hover:border-gray-500/50'
                  }
                `}
              >
                {/* Running indicator */}
                {isRunning && (
                  <div className="absolute -top-1 -right-1">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-bold text-base truncate">{bot.name}</h3>
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                        ${isRunning 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/40 shadow-sm shadow-green-500/50' 
                          : 'bg-gray-600/20 text-gray-400 border border-gray-600/40'
                        }
                      `}>
                        {bot.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Target:</span>
                      <span className="text-green-400 font-mono font-bold">${bot.targetPrice.toFixed(6)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {bot.isRunning ? (
                      <button
                        onClick={() => bot._id && handleStop(bot._id)}
                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 active:scale-95"
                      >
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => bot._id && handleStart(bot._id)}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 active:scale-95"
                      >
                        Start
                      </button>
                    )}
                    <button
                      onClick={() => bot._id && handleDelete(bot._id)}
                      className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg text-sm font-bold transition-all border border-gray-600/50 hover:border-gray-500 active:scale-95"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-3">
                    <div className="text-blue-400 text-xs font-semibold mb-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Executions
                    </div>
                    <div className="text-white font-bold text-xl">{bot.executionCount || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-3">
                    <div className="text-purple-400 text-xs font-semibold mb-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Total Spent
                    </div>
                    <div className="text-white font-bold text-xl">${(bot.totalUsdtSpent || 0).toFixed(2)}</div>
                  </div>
                </div>

                {/* Success/Fail Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-3">
                    <div className="text-green-300 text-xs font-semibold mb-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Successful
                    </div>
                    <div className="text-white font-bold text-xl">{bot.successfulOrders || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-xl p-3">
                    <div className="text-red-300 text-xs font-semibold mb-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Failed
                    </div>
                    <div className="text-white font-bold text-xl">{bot.failedOrders || 0}</div>
                  </div>
                </div>

                {/* Last Recovery Info */}
                {bot.lastMarketPrice && bot.lastFinalPrice && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-cyan-200 font-semibold">Last Recovery</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300 font-mono">${bot.lastMarketPrice.toFixed(6)}</span>
                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span className="text-white font-mono font-bold">${bot.lastFinalPrice.toFixed(6)}</span>
                        <span className={`
                          px-2 py-0.5 rounded-full text-xs font-bold
                          ${priceChange > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}
                        `}>
                          {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
