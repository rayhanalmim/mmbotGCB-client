'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';

interface TestTradeProps {
  token: string | null;
}

export default function TestTrade({ token }: TestTradeProps) {
  const [orderType, setOrderType] = useState<1 | 2>(2); // 1 = LIMIT, 2 = MARKET
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [symbol, setSymbol] = useState('gcbusdt');
  const [inputCurrency, setInputCurrency] = useState<'GCB' | 'USDT'>('USDT'); // User's input currency choice
  const [inputAmount, setInputAmount] = useState(''); // Amount in selected currency
  const [calculatedAmount, setCalculatedAmount] = useState(''); // Calculated amount in other currency
  const [gcbPrice, setGcbPrice] = useState<number>(0); // Current GCB price in USDT
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch GCB price on mount and every 10 seconds
  useEffect(() => {
    const fetchGcbPrice = async () => {
      try {
        setRateLoading(true);
        const response = await apiClient.market.getRates('USD');
        if (response.code === '0' && response.data?.rate?.USD?.GCB) {
          const priceValue = response.data.rate.USD.GCB;
          const price = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
          setGcbPrice(price);
        }
      } catch (err) {
        console.error('Error fetching GCB price:', err);
      } finally {
        setRateLoading(false);
      }
    };

    fetchGcbPrice();
    const interval = setInterval(fetchGcbPrice, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Calculate equivalent amount when input changes
  useEffect(() => {
    if (!inputAmount || !gcbPrice) {
      setCalculatedAmount('');
      return;
    }

    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) {
      setCalculatedAmount('');
      return;
    }

    if (inputCurrency === 'USDT') {
      // User entered USDT, calculate GCB
      const gcbAmount = amount / gcbPrice;
      setCalculatedAmount(gcbAmount.toFixed(6));
    } else {
      // User entered GCB, calculate USDT
      const usdtAmount = amount * gcbPrice;
      setCalculatedAmount(usdtAmount.toFixed(6));
    }
  }, [inputAmount, gcbPrice, inputCurrency]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Please log in first');
      return;
    }

    if (!inputAmount) {
      setError('Amount is required');
      return;
    }

    if (!gcbPrice) {
      setError('Waiting for price data...');
      return;
    }

    if (orderType === 1 && !price) {
      setError('Price is required for limit orders');
      return;
    }

    // Calculate volume based on API requirements:
    // - MARKET BUY: volume = USDT amount (quote currency)
    // - MARKET SELL: volume = GCB amount (base currency)
    // - LIMIT orders: volume = GCB amount (base currency)
    let apiVolume: string;
    let displayAmount: string;
    
    if (orderType === 2 && side === 'BUY') {
      // MARKET BUY: API expects USDT amount
      if (inputCurrency === 'USDT') {
        apiVolume = inputAmount; // User entered USDT, send directly
        displayAmount = `${calculatedAmount} GCB (${inputAmount} USDT)`;
      } else {
        apiVolume = calculatedAmount; // User entered GCB, send calculated USDT
        displayAmount = `${inputAmount} GCB (${calculatedAmount} USDT)`;
      }
    } else {
      // MARKET SELL or LIMIT orders: API expects GCB amount
      if (inputCurrency === 'GCB') {
        apiVolume = inputAmount; // User entered GCB, send directly
        displayAmount = `${inputAmount} GCB (${calculatedAmount} USDT)`;
      } else {
        apiVolume = calculatedAmount; // User entered USDT, send calculated GCB
        displayAmount = `${calculatedAmount} GCB (${inputAmount} USDT)`;
      }
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Debug log
    console.log(`📤 Placing order:`, {
      side,
      type: orderType === 1 ? 'LIMIT' : 'MARKET',
      symbol,
      volume: apiVolume,
      volumeCurrency: orderType === 2 && side === 'BUY' ? 'USDT' : 'GCB',
      price: orderType === 1 ? price : null,
    });

    try {
      const response = await apiClient.trade.placeOrder({
        side,
        type: orderType,
        symbol,
        volume: apiVolume,
        price: orderType === 1 ? price : null,
      }, token);

      // Check for successful order (GCBEX API returns orderId directly)
      if (response.orderId || response.orderIdString) {
        const orderId = response.orderIdString || response.orderId;
        setResult(`✅ Order placed successfully!\n${side} ${displayAmount}${orderType === 1 ? ` at ${price} USDT` : ' (MARKET)'}\nOrder ID: ${orderId}`);
        // Reset form
        setInputAmount('');
        setCalculatedAmount('');
        setPrice('');
      } else if (response.code === '0') {
        // Fallback for wrapped response format
        setResult(`✅ Order placed successfully: ${side} ${displayAmount}${orderType === 1 ? ` at ${price} USDT` : ' (MARKET)'}`);
        setInputAmount('');
        setCalculatedAmount('');
        setPrice('');
      } else {
        // Error response
        setError(`❌ Order failed: ${response.msg || JSON.stringify(response)}`);
      }
    } catch (err) {
      setError(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-[#6366F1]/50">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Instant Trade</h2>
          <p className="text-xs text-gray-400">Execute market orders instantly</p>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="space-y-4">
        {/* Order Type Selection */}
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-2">Order Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOrderType(2)}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                orderType === 2
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#7C3AED] text-white shadow-lg shadow-[#6366F1]/30'
                  : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46] border border-[#3f3f46]'
              }`}
            >
              Market Order
            </button>
            <button
              type="button"
              onClick={() => setOrderType(1)}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                orderType === 1
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#7C3AED] text-white shadow-lg shadow-[#6366F1]/30'
                  : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46] border border-[#3f3f46]'
              }`}
            >
              Limit Order
            </button>
          </div>
        </div>

        {/* Side Selection */}
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-2">Side</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSide('BUY')}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                side === 'BUY'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46] border border-[#3f3f46]'
              }`}
            >
              🟢 BUY
            </button>
            <button
              type="button"
              onClick={() => setSide('SELL')}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                side === 'SELL'
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46] border border-[#3f3f46]'
              }`}
            >
              🔴 SELL
            </button>
          </div>
        </div>

        {/* Current Rate Display */}
        <div className="bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${rateLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'} shadow-lg`}></div>
              <span className="text-gray-300 text-sm font-semibold">Current Rate:</span>
            </div>
            <div className="text-right">
              <p className="text-white text-lg font-bold">
                {gcbPrice > 0 ? `$${gcbPrice.toFixed(6)}` : 'Loading...'}
              </p>
              <p className="text-gray-400 text-xs">1 GCB = {gcbPrice > 0 ? gcbPrice.toFixed(6) : '--'} USDT</p>
            </div>
          </div>
        </div>

        {/* Symbol */}
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-2">Trading Pair</label>
          <input
            type="text"
            value={symbol.toUpperCase()}
            disabled
            className="w-full bg-[#27272a]/50 text-gray-400 border border-[#3f3f46] rounded-lg px-4 py-2.5 cursor-not-allowed uppercase"
          />
        </div>

        {/* Currency Input Selector */}
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-2">I want to {side === 'BUY' ? 'spend' : 'sell'}</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setInputCurrency('USDT')}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                inputCurrency === 'USDT'
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#7C3AED] text-white shadow-lg shadow-[#6366F1]/30'
                  : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46] border border-[#3f3f46]'
              }`}
            >
              💵 USDT
            </button>
            <button
              type="button"
              onClick={() => setInputCurrency('GCB')}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                inputCurrency === 'GCB'
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#7C3AED] text-white shadow-lg shadow-[#6366F1]/30'
                  : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46] border border-[#3f3f46]'
              }`}
            >
              🪙 GCB
            </button>
          </div>
        </div>

        {/* Amount Input with Real-time Conversion */}
        <div className="space-y-3">
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">
              Amount ({inputCurrency})
            </label>
            <input
              type="number"
              step="any"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] placeholder-gray-500"
              placeholder={inputCurrency === 'USDT' ? '10.00' : '100.00'}
              required
            />
          </div>

          {/* Conversion Display */}
          {inputAmount && calculatedAmount && (
            <div className="bg-[#FF007A]/10 border border-[#FF007A]/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">You will {side === 'BUY' ? 'receive' : 'get'}:</span>
                <div className="text-right">
                  <p className="text-[#FF007A] font-bold text-lg">
                    {calculatedAmount} {inputCurrency === 'USDT' ? 'GCB' : 'USDT'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    @ {gcbPrice.toFixed(6)} USDT per GCB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Price (only for limit orders) */}
        {orderType === 1 && (
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">Price (USDT)</label>
            <input
              type="number"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] placeholder-gray-500"
              placeholder="0.027"
              required={orderType === 1}
            />
          </div>
        )}

        {/* Result/Error Messages */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-400 text-sm font-semibold">{result}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all shadow-lg ${
            side === 'BUY'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/20 hover:shadow-green-500/40'
              : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-red-500/20 hover:shadow-red-500/40'
          } disabled:from-[#27272a] disabled:to-[#1f1f23] disabled:cursor-not-allowed hover:scale-[1.02] flex items-center justify-center gap-2`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Placing Order...
            </>
          ) : (
            <>
              <span>{side === 'BUY' ? '🟢' : '🔴'}</span> 
              Place {side} Order {orderType === 2 ? '(Market)' : '(Limit)'}
            </>
          )}
        </button>
      </form>

      {/* Warning Notice */}
      <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-amber-400 text-xl">⚠️</span>
          <div>
            <p className="text-amber-400 text-sm font-semibold">Test Mode</p>
            <p className="text-amber-300/80 text-xs mt-1">
              This is for testing the trading API. Use small amounts to verify functionality before running the bot.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
