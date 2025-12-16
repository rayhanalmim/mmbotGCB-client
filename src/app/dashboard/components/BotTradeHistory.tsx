'use client';

import { useState, useEffect } from 'react';
import { API } from '@/lib/api';
import type { BotTrade } from '@/lib/api';

interface BotTradeHistoryProps {
  token: string;
}

export default function BotTradeHistory({ token }: BotTradeHistoryProps) {
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await API.bot.getTrades(50, token);
      if (response.code === '0' && response.data) {
        setTrades(response.data);
      }
    } catch (err) {
      console.error('Error fetching bot trades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [token]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded border border-green-500/30">
            ✓ Success
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded border border-red-500/30">
            ✗ Failed
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded border border-amber-500/30">
            ⚠ Error
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs font-semibold rounded border border-gray-600">
            Unknown
          </span>
        );
    }
  };

  const getSideColor = (side: string) => {
    return side === 'BUY' ? 'text-green-400' : 'text-red-400';
  };

  const successCount = trades.filter(t => t.status === 'success').length;
  const failedCount = trades.filter(t => t.status === 'failed' || t.status === 'error').length;

  if (loading && trades.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
        <h2 className="text-lg font-bold text-white mb-4">Trade History</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#7C3AED] to-[#6366F1] rounded-xl flex items-center justify-center shadow-lg shadow-[#7C3AED]/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Trade History</h2>
            <p className="text-xs text-gray-400">Bot executed trades</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg font-semibold border border-green-500/30">
            ✓ {successCount}
          </span>
          <span className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg font-semibold border border-red-500/30">
            ✗ {failedCount}
          </span>
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-300 text-lg mb-2">No trades yet</p>
          <p className="text-gray-500 text-sm">When conditions are met, trades will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {trades.map((trade) => (
            <div
              key={trade._id}
              className={`border-2 rounded-xl p-4 transition ${
                trade.status === 'success'
                  ? 'bg-green-900/10 border-green-500/30'
                  : 'bg-red-900/10 border-red-500/30'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-white font-semibold text-sm">{trade.conditionName}</h4>
                    {getStatusBadge(trade.status)}
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDate(trade.executedAt)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Side</p>
                  <p className={`text-sm font-bold ${getSideColor(trade.side)}`}>
                    {trade.side === 'BUY' ? '↗' : '↘'} {trade.side}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Type</p>
                  <p className="text-sm font-semibold text-white">{trade.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Volume</p>
                  <p className="text-sm font-semibold text-white">{trade.volume.toFixed(4)} GCB</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Price</p>
                  <p className="text-sm font-semibold text-white">
                    {trade.price ? `$${trade.price.toFixed(6)}` : 'MARKET'}
                  </p>
                </div>
              </div>

              {trade.orderId && (
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <p className="text-xs text-gray-400">
                    Order ID: <span className="text-blue-400 font-mono">{trade.orderId}</span>
                  </p>
                </div>
              )}

              {trade.error && (
                <div className="mt-3 pt-3 border-t border-red-500/30">
                  <p className="text-xs text-red-400">
                    <strong>Error:</strong> {trade.error}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #27272a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6366F1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #7C3AED;
        }
      `}</style>
    </div>
  );
}
