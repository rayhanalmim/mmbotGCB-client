'use client';

import { useState } from 'react';

interface PriceKeeperBotBuilderProps {
  token: string | null;
  onBotCreated: () => void;
}

export default function PriceKeeperBotBuilder({ token, onBotCreated }: PriceKeeperBotBuilderProps) {
  const [name, setName] = useState('');
  const [orderAmount, setOrderAmount] = useState('0.1');
  const [cooldownSeconds, setCooldownSeconds] = useState('5');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const preventScrollChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Please log in to create bots');
      return;
    }

    if (!orderAmount || parseFloat(orderAmount) <= 0) {
      setError('Please set a valid order amount');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';
      const response = await fetch(`${apiUrl}/api/bot/price-keeper/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name || `Price Keeper Bot - ${new Date().toLocaleString()}`,
          orderAmount: parseFloat(orderAmount),
          cooldownSeconds: parseInt(cooldownSeconds) || 5,
          telegramEnabled
        })
      });

      const data = await response.json();

      if (data.code === '0') {
        setSuccess('Price Keeper bot created successfully!');
        setName('');
        setOrderAmount('0.1');
        setCooldownSeconds('5');
        setTelegramEnabled(false);
        onBotCreated();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.msg || 'Failed to create bot');
      }
    } catch (err) {
      setError('Error creating Price Keeper bot');
      console.error('Price Keeper bot creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bot Name */}
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-2">
            Bot Name (Optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., GCB Price Keeper"
            className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] placeholder-gray-500"
          />
        </div>

        {/* Strategy Explanation */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg shadow-cyan-500/50">🎯</span>
            Strategy
          </h3>
          <p className="text-gray-300 text-sm mb-3">
            This bot keeps the visible market price synced with the best ask (cheapest sell) price. 
            When someone sells and the last trade price drops below the best ask, the bot places a small market buy order to refresh the displayed price.
          </p>
          <div className="bg-[#1a1a1a] rounded-lg p-3 text-xs text-gray-400">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-cyan-400">📊</span>
              <span>Monitors: Last Trade Price vs Best Ask Price</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">💰</span>
              <span>Action: Places small market buy when prices differ</span>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg shadow-purple-500/50">⚙️</span>
            Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order Amount */}
            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">
                Order Amount (USDT)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                onWheel={preventScrollChange}
                placeholder="0.1"
                required
                className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
              />
              <p className="text-gray-500 text-xs mt-1">Small amount per sync (e.g., $0.10)</p>
            </div>

            {/* Cooldown */}
            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">
                Cooldown (Seconds)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={cooldownSeconds}
                onChange={(e) => setCooldownSeconds(e.target.value)}
                onWheel={preventScrollChange}
                placeholder="5"
                required
                className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
              />
              <p className="text-gray-500 text-xs mt-1">Min time between orders</p>
            </div>
          </div>
        </div>

        {/* Telegram Notifications */}
        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/50">📱</span>
            Telegram Notifications
          </h3>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="telegramEnabled"
              checked={telegramEnabled}
              onChange={(e) => setTelegramEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-500 bg-[#27272a] border-[#3f3f46] rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="telegramEnabled" className="text-gray-300 text-sm font-medium cursor-pointer">
              Enable Telegram notifications
            </label>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Notifications will be sent to the configured Telegram bot
          </p>
        </div>

        {/* Error/Success Messages */}
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </span>
          ) : (
            '🎯 Create Price Keeper Bot'
          )}
        </button>
      </form>
    </div>
  );
}
