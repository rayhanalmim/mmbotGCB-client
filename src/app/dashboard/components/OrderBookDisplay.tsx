'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';

export default function OrderBookDisplay() {
  const [orderBook, setOrderBook] = useState<{ bids: [string, string][]; asks: [string, string][] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderBook = async () => {
      try {
        const response = await apiClient.orderBook.getDepth('GCBUSDT', 10);
        if (response.code === '0' && response.data) {
          setOrderBook(response.data);
        }
      } catch (error) {
        console.error('Error fetching order book:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-32"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const bestAsk = orderBook?.asks?.[0];
  const bestBid = orderBook?.bids?.[0];
  const spread = bestAsk && bestBid ? (parseFloat(bestAsk[0]) - parseFloat(bestBid[0])).toFixed(8) : '0';
  const spreadPercent = bestAsk && bestBid ? (((parseFloat(bestAsk[0]) - parseFloat(bestBid[0])) / parseFloat(bestBid[0])) * 100).toFixed(3) : '0';

  // Calculate statistics
  const calculateStats = () => {
    if (!orderBook) return null;

    // Calculate totals for asks
    const askVolume = orderBook.asks.reduce((sum, ask) => sum + parseFloat(ask[1]), 0);
    const askValue = orderBook.asks.reduce((sum, ask) => sum + (parseFloat(ask[0]) * parseFloat(ask[1])), 0);
    
    // Calculate totals for bids
    const bidVolume = orderBook.bids.reduce((sum, bid) => sum + parseFloat(bid[1]), 0);
    const bidValue = orderBook.bids.reduce((sum, bid) => sum + (parseFloat(bid[0]) * parseFloat(bid[1])), 0);
    
    // Calculate mid price
    const midPrice = bestAsk && bestBid ? ((parseFloat(bestAsk[0]) + parseFloat(bestBid[0])) / 2) : 0;
    
    // Calculate buy/sell pressure (ratio)
    const totalVolume = askVolume + bidVolume;
    const buyPressure = totalVolume > 0 ? (bidVolume / totalVolume) * 100 : 50;
    const sellPressure = 100 - buyPressure;
    
    // Market depth imbalance
    const imbalance = bidValue - askValue;
    const imbalancePercent = askValue > 0 ? (imbalance / askValue) * 100 : 0;
    
    return {
      askVolume,
      askValue,
      bidVolume,
      bidValue,
      midPrice,
      buyPressure,
      sellPressure,
      imbalance,
      imbalancePercent
    };
  };

  const stats = calculateStats();

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl flex items-center justify-center shadow-lg shadow-[#10B981]/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Order Book</h2>
            <p className="text-xs text-gray-400">GCB/USDT Depth</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Spread</p>
          <p className="text-sm font-bold text-yellow-400">{spread} ({spreadPercent}%)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Asks (Sell Orders) */}
        <div>
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-red-500/30">
            <span className="text-xs font-bold text-red-400 uppercase">Asks (Sellers)</span>
          </div>
          <div className="space-y-1">
            {orderBook?.asks?.slice(0, 10).reverse().map((ask, i) => {
              const price = parseFloat(ask[0]);
              const volume = parseFloat(ask[1]);
              const total = price * volume;
              return (
                <div key={i} className="flex justify-between items-center text-xs bg-red-500/5 hover:bg-red-500/10 rounded px-2 py-1 transition-colors">
                  <span className="text-red-400 font-mono">{price.toFixed(6)}</span>
                  <span className="text-gray-400 font-mono">{volume.toFixed(2)}</span>
                  <span className="text-gray-500 font-mono text-[10px]">{total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div>
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-green-500/30">
            <span className="text-xs font-bold text-green-400 uppercase">Bids (Buyers)</span>
          </div>
          <div className="space-y-1">
            {orderBook?.bids?.slice(0, 10).map((bid, i) => {
              const price = parseFloat(bid[0]);
              const volume = parseFloat(bid[1]);
              const total = price * volume;
              return (
                <div key={i} className="flex justify-between items-center text-xs bg-green-500/5 hover:bg-green-500/10 rounded px-2 py-1 transition-colors">
                  <span className="text-green-400 font-mono">{price.toFixed(6)}</span>
                  <span className="text-gray-400 font-mono">{volume.toFixed(2)}</span>
                  <span className="text-gray-500 font-mono text-[10px]">{total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#27272a]">
        <div className="flex justify-between text-[10px] text-gray-500 uppercase font-semibold mb-3">
          <span>Price (USDT)</span>
          <span>Amount (GCB)</span>
          <span>Total (USDT)</span>
        </div>

        {/* Market Statistics */}
        {stats && (
          <div className="space-y-3 mt-4 pt-4 border-t border-[#27272a]">
            <div className="text-xs font-bold text-gray-300 uppercase mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Market Statistics
            </div>

            {/* Mid Price */}
            <div className="bg-[#27272a] rounded-lg p-3">
              <div className="text-[10px] text-gray-400 mb-1">Mid Price</div>
              <div className="text-sm font-bold text-yellow-400">{stats.midPrice.toFixed(6)} USDT</div>
            </div>

            {/* Total Volume and Value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="text-[10px] text-red-400 mb-1 uppercase font-semibold">Ask Side</div>
                <div className="text-xs text-gray-300">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Volume:</span>
                    <span className="font-mono font-bold">{stats.askVolume.toFixed(2)} GCB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Value:</span>
                    <span className="font-mono font-bold">{stats.askValue.toFixed(2)} USDT</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="text-[10px] text-green-400 mb-1 uppercase font-semibold">Bid Side</div>
                <div className="text-xs text-gray-300">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">Volume:</span>
                    <span className="font-mono font-bold">{stats.bidVolume.toFixed(2)} GCB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Value:</span>
                    <span className="font-mono font-bold">{stats.bidValue.toFixed(2)} USDT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Pressure */}
            <div className="bg-[#27272a] rounded-lg p-3">
              <div className="text-[10px] text-gray-400 mb-2 uppercase font-semibold">Market Pressure</div>
              <div className="flex h-6 rounded overflow-hidden mb-2">
                {/* Buy Pressure (Green) */}
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
                  style={{ width: `${stats.buyPressure}%` }}
                >
                  {stats.buyPressure > 15 && `${stats.buyPressure.toFixed(1)}%`}
                </div>
                {/* Sell Pressure (Red) */}
                <div 
                  className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500"
                  style={{ width: `${stats.sellPressure}%` }}
                >
                  {stats.sellPressure > 15 && `${stats.sellPressure.toFixed(1)}%`}
                </div>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-green-400">Buy Pressure</span>
                <span className="text-red-400">Sell Pressure</span>
              </div>
            </div>

            {/* Market Depth Imbalance */}
            <div className="bg-[#27272a] rounded-lg p-3">
              <div className="text-[10px] text-gray-400 mb-1 uppercase font-semibold">Depth Imbalance</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className={`text-sm font-bold ${stats.imbalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.imbalance >= 0 ? '+' : ''}{stats.imbalance.toFixed(2)} USDT
                  </div>
                  <div className={`text-[10px] ${stats.imbalancePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.imbalancePercent >= 0 ? '+' : ''}{stats.imbalancePercent.toFixed(2)}%
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 text-right max-w-[120px]">
                  {stats.imbalance > 0 
                    ? '🟢 More buy liquidity' 
                    : stats.imbalance < 0 
                    ? '🔴 More sell liquidity' 
                    : '⚖️ Balanced'}
                </div>
              </div>
            </div>

            {/* Market Sentiment */}
            <div className="bg-gradient-to-r from-[#27272a] to-[#1f1f1f] rounded-lg p-3 border border-[#333]">
              <div className="text-[10px] text-gray-400 mb-2 uppercase font-semibold flex items-center gap-1">
                <span>💡</span> Market Analysis
              </div>
              <div className="text-xs text-gray-300 leading-relaxed">
                {stats.buyPressure > 60 && stats.imbalance > 0 ? (
                  <span className="text-green-400">⚡ Strong bullish momentum - High buy pressure with deeper bid support</span>
                ) : stats.sellPressure > 60 && stats.imbalance < 0 ? (
                  <span className="text-red-400">⚡ Strong bearish momentum - High sell pressure with deeper ask walls</span>
                ) : stats.buyPressure > 55 ? (
                  <span className="text-green-300">📈 Moderate bullish bias - Buyers slightly dominating</span>
                ) : stats.sellPressure > 55 ? (
                  <span className="text-red-300">📉 Moderate bearish bias - Sellers slightly dominating</span>
                ) : (
                  <span className="text-yellow-400">⚖️ Neutral market - Balanced buy/sell pressure</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
