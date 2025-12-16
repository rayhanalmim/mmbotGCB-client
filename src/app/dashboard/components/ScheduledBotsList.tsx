'use client';

import { useEffect, useState } from 'react';
import apiClient, { type ScheduledBot } from '@/lib/api';

interface ScheduledBotsListProps {
  token: string | null;
  refreshTrigger: number;
}

export default function ScheduledBotsList({ token, refreshTrigger }: ScheduledBotsListProps) {
  const [bots, setBots] = useState<ScheduledBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchBots = async () => {
      try {
        const response = await apiClient.scheduledBot.getList(token);
        if (response.code === '0' && response.data) {
          setBots(response.data);
        }
      } catch (err) {
        console.error('Error fetching scheduled bots:', err);
        setError('Failed to load scheduled bots');
      } finally {
        setLoading(false);
      }
    };

    fetchBots();
  }, [token, refreshTrigger]);

  const handleStart = async (botId: string) => {
    if (!token) return;
    try {
      const response = await apiClient.scheduledBot.start(botId, token);
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
      const response = await apiClient.scheduledBot.stop(botId, token);
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
      const response = await apiClient.scheduledBot.delete(botId, token);
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
        <div className="w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] rounded-xl flex items-center justify-center shadow-lg shadow-[#8B5CF6]/50">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Scheduled Bots</h2>
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
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">No scheduled bots yet</p>
          <p className="text-gray-600 text-xs mt-1">Create a scheduled bot above to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bots.map((bot) => {
            const progress = (bot.executedBuys / bot.totalBuys) * 100;
            return (
              <div key={bot._id} className="bg-[#27272a] border border-[#3f3f46] rounded-xl p-4 hover:border-[#6366F1]/50 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-sm mb-1">{bot.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        bot.status === 'running' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        bot.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {bot.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{bot.executedBuys}/{bot.totalBuys} buys</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {bot.isRunning ? (
                      <button
                        onClick={() => bot._id && handleStop(bot._id)}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition-all"
                      >
                        Stop
                      </button>
                    ) : bot.status !== 'completed' ? (
                      <button
                        onClick={() => bot._id && handleStart(bot._id)}
                        className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg text-xs font-semibold transition-all"
                      >
                        Start
                      </button>
                    ) : null}
                    <button
                      onClick={() => bot._id && handleDelete(bot._id)}
                      className="px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 border border-gray-500/30 rounded-lg text-xs font-semibold transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Total Budget</p>
                    <p className="text-sm font-bold text-white">{bot.totalUsdtBudget} USDT</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-bold text-white">{bot.durationHours}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Spent</p>
                    <p className="text-sm font-bold text-amber-400">{bot.spentUsdt.toFixed(2)} USDT</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Accumulated</p>
                    <p className="text-sm font-bold text-blue-400">{bot.accumulatedGcb.toFixed(2)} GCB</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-400 font-semibold">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {bot.nextBuyAt && bot.isRunning && (
                  <div className="mt-3 pt-3 border-t border-[#3f3f46]">
                    <p className="text-xs text-gray-500">
                      Next buy: <span className="text-blue-400 font-semibold">{new Date(bot.nextBuyAt).toLocaleString()}</span>
                    </p>
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
