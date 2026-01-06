'use client';

import { useEffect, useState } from 'react';

interface BuyOrder {
  price: number;
  usdtAmount: number;
  orderId?: string;
  status?: string;
}

interface BuyWallBot {
  _id: string;
  name: string;
  symbol: string;
  targetPrice: number;
  buyOrders: BuyOrder[];
  totalUsdt: number;
  ordersPlaced: boolean;
  placedOrders: BuyOrder[];
  totalRefills: number;
  isActive: boolean;
  isRunning: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface BuyWallBotsListProps {
  token: string | null;
  refreshTrigger: number;
}

export default function BuyWallBotsList({ token, refreshTrigger }: BuyWallBotsListProps) {
  const [bots, setBots] = useState<BuyWallBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedBot, setExpandedBot] = useState<string | null>(null);

  const fetchBots = async () => {
    if (!token) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';
      const response = await fetch(`${apiUrl}/api/bot/buywall/list`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.code === '0') {
        setBots(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching buy wall bots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
    const interval = setInterval(fetchBots, 5000);
    return () => clearInterval(interval);
  }, [token, refreshTrigger]);

  const handleStart = async (botId: string) => {
    setActionLoading(botId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';
      const response = await fetch(`${apiUrl}/api/bot/buywall/${botId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.code === '0') {
        await fetchBots();
      }
    } catch (error) {
      console.error('Error starting bot:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (botId: string) => {
    setActionLoading(botId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';
      const response = await fetch(`${apiUrl}/api/bot/buywall/${botId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.code === '0') {
        await fetchBots();
      }
    } catch (error) {
      console.error('Error stopping bot:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (botId: string) => {
    if (!confirm('Are you sure you want to delete this bot?')) return;

    setActionLoading(botId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';
      const response = await fetch(`${apiUrl}/api/bot/buywall/${botId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.code === '0') {
        await fetchBots();
      }
    } catch (error) {
      console.error('Error deleting bot:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReset = async (botId: string) => {
    if (!confirm('Reset this bot? This will clear placed orders tracking and allow re-placement.')) return;

    setActionLoading(botId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';
      const response = await fetch(`${apiUrl}/api/bot/buywall/${botId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.code === '0') {
        await fetchBots();
      }
    } catch (error) {
      console.error('Error resetting bot:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (bot: BuyWallBot) => {
    if (bot.isRunning) {
      if (bot.ordersPlaced) {
        return (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg border border-green-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            Monitoring
          </span>
        );
      }
      return (
        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-lg border border-yellow-500/30 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
          Waiting
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs font-bold rounded-lg border border-gray-500/30">
        Stopped
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-[#27272a]">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-[#27272a]">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-500/10 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🧱</span>
          </div>
          <h3 className="text-white font-bold mb-2">No Buy Wall Bots</h3>
          <p className="text-gray-400 text-sm">Create a buy wall bot to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bots.map((bot) => (
        <div
          key={bot._id}
          className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border border-[#27272a] overflow-hidden"
        >
          {/* Bot Header */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <span className="text-lg">🧱</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">{bot.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-gray-400 text-xs">{bot.symbol}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-orange-400 text-xs font-semibold">
                    Target: ${bot.targetPrice?.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge(bot)}
              
              <button
                onClick={() => setExpandedBot(expandedBot === bot._id ? null : bot._id)}
                className="p-2 hover:bg-[#27272a] rounded-lg transition-colors"
              >
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${expandedBot === bot._id ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="px-4 pb-3 grid grid-cols-4 gap-2">
            <div className="bg-[#27272a] rounded-lg p-2 text-center">
              <p className="text-gray-400 text-[10px] uppercase">Orders</p>
              <p className="text-white font-bold text-sm">{bot.buyOrders?.length || 0}</p>
            </div>
            <div className="bg-[#27272a] rounded-lg p-2 text-center">
              <p className="text-gray-400 text-[10px] uppercase">Total</p>
              <p className="text-green-400 font-bold text-sm">${bot.totalUsdt?.toFixed(0)}</p>
            </div>
            <div className="bg-[#27272a] rounded-lg p-2 text-center">
              <p className="text-gray-400 text-[10px] uppercase">Placed</p>
              <p className="text-blue-400 font-bold text-sm">{bot.ordersPlaced ? 'Yes' : 'No'}</p>
            </div>
            <div className="bg-[#27272a] rounded-lg p-2 text-center">
              <p className="text-gray-400 text-[10px] uppercase">Refills</p>
              <p className="text-purple-400 font-bold text-sm">{bot.totalRefills || 0}</p>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedBot === bot._id && (
            <div className="border-t border-[#27272a] p-4 space-y-3">
              {/* Orders Table */}
              <div className="bg-[#27272a] rounded-lg p-3">
                <h4 className="text-white font-semibold text-xs mb-2">Buy Orders</h4>
                <div className="max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left py-1">Price</th>
                        <th className="text-right py-1">USDT</th>
                        <th className="text-right py-1">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {bot.buyOrders?.map((order, idx) => {
                        const placedOrder = bot.placedOrders?.find(
                          p => Math.abs(p.price - order.price) < 0.0000001
                        );
                        return (
                          <tr key={idx} className="border-t border-[#3f3f46]">
                            <td className="py-1 text-orange-400">${order.price.toFixed(6)}</td>
                            <td className="py-1 text-right text-green-400">${order.usdtAmount}</td>
                            <td className="py-1 text-right">
                              {placedOrder ? (
                                <span className="text-blue-400">Placed</span>
                              ) : bot.ordersPlaced ? (
                                <span className="text-yellow-400">Pending</span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {bot.isRunning ? (
                  <button
                    onClick={() => handleStop(bot._id)}
                    disabled={actionLoading === bot._id}
                    className="flex-1 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold rounded-lg border border-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === bot._id ? 'Stopping...' : 'Stop'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleStart(bot._id)}
                    disabled={actionLoading === bot._id}
                    className="flex-1 py-2 px-4 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm font-semibold rounded-lg border border-green-500/30 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === bot._id ? 'Starting...' : 'Start'}
                  </button>
                )}

                <button
                  onClick={() => handleReset(bot._id)}
                  disabled={actionLoading === bot._id}
                  className="py-2 px-4 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm font-semibold rounded-lg border border-yellow-500/30 transition-colors disabled:opacity-50"
                >
                  Reset
                </button>

                <button
                  onClick={() => handleDelete(bot._id)}
                  disabled={actionLoading === bot._id}
                  className="py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-lg border border-red-500/20 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>

              {/* Created/Updated Info */}
              <div className="text-[10px] text-gray-500 flex justify-between">
                <span>Created: {new Date(bot.createdAt).toLocaleString()}</span>
                <span>Updated: {new Date(bot.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
