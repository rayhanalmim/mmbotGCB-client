'use client';

import { useState } from 'react';

interface MexcMMBotBuilderProps {
  onBotCreated?: () => void;
}

export default function MexcMMBotBuilder({ onBotCreated }: MexcMMBotBuilderProps) {
  const [name, setName] = useState('');
  const [orderAmount, setOrderAmount] = useState('1');
  const [gapThreshold, setGapThreshold] = useState('3');
  const [cooldownSeconds, setCooldownSeconds] = useState('10');
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Bot name is required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/mexc/bot/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          symbol: 'GCBUSDT',
          orderAmount: parseFloat(orderAmount),
          gapThreshold: parseFloat(gapThreshold),
          cooldownSeconds: parseInt(cooldownSeconds),
          telegramEnabled
        })
      });

      const data = await response.json();

      if (data.code === '0') {
        setSuccess('MEXC MM Bot created successfully!');
        setName('');
        setOrderAmount('1');
        setGapThreshold('3');
        setCooldownSeconds('10');
        if (onBotCreated) onBotCreated();
      } else {
        setError(data.msg || 'Failed to create bot');
      }
    } catch (err) {
      setError('Error creating bot');
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00B897] to-[#00D4AA] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-xl p-3">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Create MEXC MM Bot</h2>
            <p className="text-white/80 text-sm">Price Gap Market Maker for GCB/USDT</p>
          </div>
        </div>
      </div>

      {/* Strategy Explanation */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
          <span>📊</span> Strategy Overview
        </h3>
        <div className="text-gray-400 text-sm space-y-2">
          <p>This bot monitors the <span className="text-white font-medium">price gap</span> between the market price and best ask price on MEXC.</p>
          <p>When the gap exceeds your threshold (e.g., 3%), it places a market buy order to help maintain price stability.</p>
          <div className="bg-[#2a2a2a] rounded-lg p-3 mt-3">
            <p className="text-xs text-gray-500 mb-1">Formula:</p>
            <code className="text-[#00B897] text-sm">Gap % = (Best Ask - Market Price) / Market Price × 100</code>
          </div>
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 space-y-5">
        <h3 className="text-white font-bold text-lg mb-4">Bot Configuration</h3>

        {/* Bot Name */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Bot Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., MEXC Price Gap Bot #1"
            className="w-full bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00B897]"
            required
          />
        </div>

        {/* Trading Pair - Fixed */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Trading Pair</label>
          <input
            type="text"
            value="GCB/USDT"
            disabled
            className="w-full bg-[#2a2a2a] text-gray-500 border border-[#3a3a3a] rounded-lg px-4 py-3 cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Order Amount */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Order Amount (USDT)</label>
            <input
              type="number"
              value={orderAmount}
              onChange={(e) => setOrderAmount(e.target.value)}
              min="0.1"
              step="0.1"
              className="w-full bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00B897]"
            />
            <p className="text-gray-500 text-xs mt-1">USDT to spend per order</p>
          </div>

          {/* Gap Threshold */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Gap Threshold (%)</label>
            <input
              type="number"
              value={gapThreshold}
              onChange={(e) => setGapThreshold(e.target.value)}
              min="0.1"
              step="0.1"
              className="w-full bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00B897]"
            />
            <p className="text-gray-500 text-xs mt-1">Trigger when gap ≥ this %</p>
          </div>

          {/* Cooldown */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Cooldown (seconds)</label>
            <input
              type="number"
              value={cooldownSeconds}
              onChange={(e) => setCooldownSeconds(e.target.value)}
              min="5"
              step="1"
              className="w-full bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00B897]"
            />
            <p className="text-gray-500 text-xs mt-1">Wait between orders</p>
          </div>
        </div>

        {/* Telegram Notifications */}
        <div className="flex items-center gap-3 bg-[#2a2a2a] rounded-lg p-4">
          <input
            type="checkbox"
            id="telegramEnabled"
            checked={telegramEnabled}
            onChange={(e) => setTelegramEnabled(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 text-[#00B897] focus:ring-[#00B897] bg-[#1a1a1a]"
          />
          <label htmlFor="telegramEnabled" className="text-gray-300 text-sm cursor-pointer">
            Enable Telegram notifications for bot activity
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#00B897] to-[#00D4AA] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Creating Bot...' : 'Create MEXC MM Bot'}
        </button>
      </form>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
          <span>💡</span> How It Works
        </h4>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• Bot checks market price and best ask every 3 seconds</li>
          <li>• If gap ≥ threshold, places a market buy order</li>
          <li>• Uses MEXC API credentials from server .env</li>
          <li>• Cooldown prevents excessive trading</li>
        </ul>
      </div>
    </div>
  );
}
