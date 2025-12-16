/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { API } from '@/lib/api';

interface BotPerformanceChartProps {
  token: string;
}

export default function BotPerformanceChart({ token }: BotPerformanceChartProps) {
  const [trades, setTrades] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tradesRes, marketRes] = await Promise.all([
          API.bot.getTrades(50, token),
          API.bot.getMarketData(token)
        ]);

        if (tradesRes.code === '0' && tradesRes.data) {
          setTrades(tradesRes.data);
        }

        if (marketRes.code === '0' && marketRes.data) {
          setMarketData(marketRes.data);
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [token]);

  const successTrades = trades.filter(t => t.status === 'success').length;
  const failedTrades = trades.filter(t => t.status === 'failed' || t.status === 'error').length;
  const totalTrades = trades.length;
  const successRate = totalTrades > 0 ? ((successTrades / totalTrades) * 100).toFixed(1) : '0';

  // Calculate total volume
  const totalVolume = trades.reduce((sum, t) => sum + (t.volume || 0), 0);
  const buyTrades = trades.filter(t => t.side === 'BUY').length;
  const sellTrades = trades.filter(t => t.side === 'SELL').length;

  // Price data for mini chart
  const currentPrice = marketData?.GCBUSDT?.price || 0;
  const high24h = marketData?.GCBUSDT?.high24h || 0;
  const low24h = marketData?.GCBUSDT?.low24h || 0;
  const priceChange = marketData?.GCBUSDT?.change24h || 0;

  // Generate mini price chart bars (last 24 hours simulation)
  const generatePriceBars = () => {
    const bars = [];
    const range = high24h - low24h;
    for (let i = 0; i < 24; i++) {
      const randomHeight = 20 + Math.random() * 60;
      const isUp = Math.random() > 0.5;
      bars.push({ height: randomHeight, isUp });
    }
    return bars;
  };

  const priceBars = generatePriceBars();

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
        <h2 className="text-lg font-bold text-white mb-4">Performance Dashboard</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl flex items-center justify-center shadow-lg shadow-[#F59E0B]/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Performance Dashboard</h2>
            <p className="text-xs text-gray-400">Real-time bot analytics</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Success Rate */}
        <div className="bg-[#27272a]/50 border border-green-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <p className="text-xs text-gray-400 mb-2">Success Rate</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-green-400">{successRate}%</p>
              <div className="mb-1">
                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded text-xs text-green-300 font-semibold">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {successTrades}/{totalTrades}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-[#27272a]/50 border border-blue-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <p className="text-xs text-gray-400 mb-2">Total Volume</p>
            <p className="text-2xl font-black text-blue-400">{totalVolume.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">GCB</p>
          </div>
        </div>

        {/* Buy/Sell Ratio */}
        <div className="bg-[#27272a]/50 border border-purple-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <p className="text-xs text-gray-400 mb-2">Buy/Sell</p>
            <div className="flex items-center gap-2">
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">{buyTrades}</p>
                <p className="text-xs text-gray-500">BUY</p>
              </div>
              <div className="text-gray-600">/</div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-400">{sellTrades}</p>
                <p className="text-xs text-gray-500">SELL</p>
              </div>
            </div>
          </div>
        </div>

        {/* Failed Trades */}
        <div className="bg-[#27272a]/50 border border-red-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <p className="text-xs text-gray-400 mb-2">Failed</p>
            <p className="text-3xl font-black text-red-400">{failedTrades}</p>
            <p className="text-xs text-gray-500 mt-1">trades</p>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      {marketData?.GCBUSDT && (
        <div className="bg-[#27272a]/50 border border-[#3f3f46] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">GCB/USDT Price</p>
              <div className="flex items-end gap-3">
                <p className="text-2xl font-bold text-white">${currentPrice.toFixed(6)}</p>
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${priceChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                  <svg className={`w-3 h-3 ${priceChange >= 0 ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  {Math.abs(priceChange).toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">24h Range</p>
              <p className="text-xs text-green-400 font-semibold">${high24h.toFixed(6)}</p>
              <p className="text-xs text-red-400 font-semibold">${low24h.toFixed(6)}</p>
            </div>
          </div>

          {/* Mini Bar Chart */}
          <div className="flex items-end justify-between gap-1 h-24">
            {priceBars.map((bar, i) => (
              <div key={i} className="flex-1 flex items-end">
                <div
                  className={`w-full rounded-t transition-all ${bar.isUp ? 'bg-green-500/50 hover:bg-green-500' : 'bg-red-500/50 hover:bg-red-500'
                    }`}
                  style={{ height: `${bar.height}%` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>24h ago</span>
            <span>Now</span>
          </div>
        </div>
      )}

      {/* Success/Failure Donut Chart */}
      {totalTrades > 0 && (
        <div className="bg-[#27272a]/50 border border-[#3f3f46] rounded-xl p-4">
          <p className="text-sm font-semibold text-white mb-4">Trade Distribution</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Donut Chart */}
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#374151"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Success arc */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#10B981"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(successTrades / totalTrades) * 251.2} 251.2`}
                    className="transition-all duration-500"
                  />
                  {/* Failed arc */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#EF4444"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(failedTrades / totalTrades) * 251.2} 251.2`}
                    strokeDashoffset={`-${(successTrades / totalTrades) * 251.2}`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xl font-bold text-white">{totalTrades}</p>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-300">Success: {successTrades}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-300">Failed: {failedTrades}</span>
                </div>
              </div>
            </div>

            {/* Total Trades Badge */}
            <div className="text-center px-6 py-3 bg-gradient-to-br from-[#6366F1] to-[#7C3AED] rounded-xl shadow-lg">
              <p className="text-xs text-white/80 mb-1">Total Trades</p>
              <p className="text-3xl font-black text-white">{totalTrades}</p>
            </div>
          </div>
        </div>
      )}

      {totalTrades === 0 && (
        <div className="bg-[#27272a]/50 border border-[#3f3f46] rounded-xl p-8 text-center">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-gray-300 font-semibold mb-1">No trade data yet</p>
          <p className="text-sm text-gray-500">Execute trades to see performance analytics</p>
        </div>
      )}
    </div>
  );
}
