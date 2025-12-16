'use client';

import { useState } from 'react';
import apiClient from '@/lib/api';

interface StabilizerBotBuilderProps {
  token: string | null;
  onBotCreated: () => void;
}

export default function StabilizerBotBuilder({ token, onBotCreated }: StabilizerBotBuilderProps) {
  const [name, setName] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const preventScrollChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Please log in to create stabilizer bots');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const bot = {
        name: name || `Stabilizer Bot - ${new Date().toLocaleString()}`,
        targetPrice: parseFloat(targetPrice),
      };

      const response = await apiClient.stabilizerBot.create(bot, token);

      if (response.code === '0') {
        setSuccess('Stabilizer bot created successfully!');
        setName('');
        setTargetPrice('');
        onBotCreated();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.msg || 'Failed to create stabilizer bot');
      }
    } catch (err) {
      setError('Error creating stabilizer bot');
      console.error('Stabilizer bot creation error:', err);
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
            placeholder="e.g., GCB Price Stabilizer"
            className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] placeholder-gray-500"
          />
        </div>

        {/* Configuration */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg shadow-green-500/50">🎯</span>
            Target Price Configuration
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Target Price */}
            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">
                Target Price (USDT)
              </label>
              <input
                type="number"
                step="0.000001"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                onWheel={preventScrollChange}
                placeholder="0.028"
                required
                className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
              <p className="text-xs text-gray-500 mt-1">The price you want to maintain for GCB token</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/50">💡</span>
            How It Works
          </h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-200 leading-relaxed">
                <strong>Continuous Monitoring:</strong> Bot checks market price every 5 seconds and compares it with your target price.
              </p>
            </div>

            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xs text-green-200 leading-relaxed">
                <strong>Smart Price Recovery:</strong> When market price drops below target:
                <br/>• Calculates exact USDT needed to restore price
                <br/>• Splits total amount into 4 equal market buy orders
                <br/>• Executes orders with 10-second intervals
                <br/>• Takes 40 seconds total to fully stabilize price
              </p>
            </div>

            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-xs text-purple-200 leading-relaxed">
                <strong>Example:</strong> If bot needs $100 USDT to restore price:
                <br/>• Order 1: $25 USDT market buy (immediate)
                <br/>• Wait 10 seconds
                <br/>• Order 2: $25 USDT market buy
                <br/>• Wait 10 seconds
                <br/>• Order 3: $25 USDT market buy
                <br/>• Wait 10 seconds
                <br/>• Order 4: $25 USDT market buy
                <br/>• Price restored! ✅
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-xs text-amber-200 leading-relaxed">
                <strong>Real-time Logs:</strong> View all bot actions in the Activity Logs tab including price checks, calculations, and trade executions.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !targetPrice}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-green-500/50 transition-all duration-200 flex items-center justify-center gap-2"
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
              Create Stabilizer Bot
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
