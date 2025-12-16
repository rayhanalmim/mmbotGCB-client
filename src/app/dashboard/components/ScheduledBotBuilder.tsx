'use client';

import { useState } from 'react';
import apiClient from '@/lib/api';

interface ScheduledBotBuilderProps {
  token: string | null;
  onBotCreated: () => void;
}

export default function ScheduledBotBuilder({ token, onBotCreated }: ScheduledBotBuilderProps) {
  const [name, setName] = useState('');
  const [totalUsdtBudget, setTotalUsdtBudget] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [bidOffsetPercent, setBidOffsetPercent] = useState('0.1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Prevent scroll from changing number input values
  const preventScrollChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Please log in to create scheduled bots');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const bot = {
        name: name || `Accumulation Bot - ${new Date().toLocaleString()}`,
        totalUsdtBudget: parseFloat(totalUsdtBudget),
        durationHours: parseInt(durationHours),
        bidOffsetPercent: parseFloat(bidOffsetPercent),
      };

      const response = await apiClient.scheduledBot.create(bot, token);

      if (response.code === '0') {
        setSuccess('Scheduled bot created successfully!');
        setName('');
        setTotalUsdtBudget('');
        setDurationHours('');
        setBidOffsetPercent('0.1');
        onBotCreated();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.msg || 'Failed to create scheduled bot');
      }
    } catch (err) {
      setError('Error creating scheduled bot');
      console.error('Scheduled bot creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const usdtPerHour = totalUsdtBudget && durationHours 
    ? (parseFloat(totalUsdtBudget) / parseInt(durationHours)).toFixed(2) 
    : '0';
  const marketBuyPerHour = usdtPerHour !== '0' ? (parseFloat(usdtPerHour) * 0.5).toFixed(2) : '0';
  const limitBuyPerHour = usdtPerHour !== '0' ? (parseFloat(usdtPerHour) * 0.5).toFixed(2) : '0';

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
            placeholder="e.g., GCB Accumulation Bot"
            className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] placeholder-gray-500"
          />
        </div>

        {/* Configuration */}
        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/50">⚙️</span>
            Configuration
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Total USDT Budget */}
            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">
                Daily Total USDT Budget
              </label>
              <input
                type="number"
                step="any"
                value={totalUsdtBudget}
                onChange={(e) => setTotalUsdtBudget(e.target.value)}
                onWheel={preventScrollChange}
                placeholder="1000"
                required
                className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
              <p className="text-xs text-gray-500 mt-1">Total USDT to spend accumulating GCB over the duration</p>
            </div>

            {/* Duration in Hours */}
            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">
                Duration (Hours)
              </label>
              <input
                type="number"
                min="1"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                onWheel={preventScrollChange}
                placeholder="24"
                required
                className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
              <p className="text-xs text-gray-500 mt-1">Bot will execute two orders every hour for this duration</p>
            </div>

            {/* Bid Offset Percentage */}
            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">
                Bid Offset (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={bidOffsetPercent}
                onChange={(e) => setBidOffsetPercent(e.target.value)}
                onWheel={preventScrollChange}
                placeholder="0.1"
                required
                className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
              <p className="text-xs text-gray-500 mt-1">Limit buy will be placed this % below best ask (to be top of bids)</p>
            </div>
          </div>
        </div>

        {/* Strategy Info */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg shadow-purple-500/50">📊</span>
            Strategy Preview
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">USDT per Hour:</span>
              <span className="text-white font-bold">{usdtPerHour} USDT</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Market Buy:</span>
              <span className="text-green-400 font-bold">{marketBuyPerHour} USDT (50%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Limit Buy Bid:</span>
              <span className="text-blue-400 font-bold">{limitBuyPerHour} USDT (50%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Executions:</span>
              <span className="text-white font-bold">{durationHours || '0'} hours</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Strategy:</span>
              <span className="text-amber-400 font-bold">Accumulation + Price Support</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-200 leading-relaxed">
              <strong>How it works:</strong> Every hour, the bot splits {usdtPerHour} USDT into two orders:<br/>
              1️⃣ <strong>Market Buy</strong> ({marketBuyPerHour} USDT) - Instantly takes tokens from sellers<br/>
              2️⃣ <strong>Limit Buy Bid</strong> ({limitBuyPerHour} USDT) - Places order {bidOffsetPercent}% below best ask to be top of order book and catch any sellers
            </p>
          </div>

          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-xs text-green-200 leading-relaxed">
              <strong>Goal:</strong> Accumulate maximum GCB tokens at cheapest prices while providing strong bid support to pump the token price.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !totalUsdtBudget || !durationHours || !bidOffsetPercent}
          className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5558E3] hover:to-[#7C3AED] disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-[#6366F1]/50 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating Bot...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Scheduled Bot
            </>
          )}
        </button>

        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}
      </form>
    </div>
  );
}
