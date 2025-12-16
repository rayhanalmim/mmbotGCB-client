'use client';

import { useState } from 'react';
import apiClient from '@/lib/api';

interface MarketMakerBotBuilderProps {
  token: string | null;
  onBotCreated: () => void;
}

export default function MarketMakerBotBuilder({ token, onBotCreated }: MarketMakerBotBuilderProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: 'GCBUSDT',
    targetPrice: '',
    spreadPercent: '0.02', // 2% default
    orderSize: '',
    priceFloor: '',
    priceCeil: '',
    incrementStep: '0.0001',
    telegramEnabled: false,
    telegramUserId: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Prevent scroll from changing number input values
  const preventScrollChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Authentication required');
      return;
    }

    // Validation
    if (!formData.name || !formData.targetPrice || !formData.orderSize) {
      setError('Please fill in all required fields');
      return;
    }

    const targetPrice = parseFloat(formData.targetPrice);
    const orderSize = parseFloat(formData.orderSize);
    const spreadPercent = parseFloat(formData.spreadPercent);
    const incrementStep = parseFloat(formData.incrementStep);

    if (targetPrice <= 0 || orderSize <= 0 || spreadPercent <= 0 || incrementStep <= 0) {
      setError('All numeric values must be positive');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.marketMakerBot.create({
        name: formData.name,
        symbol: formData.symbol,
        targetPrice,
        spreadPercent,
        orderSize,
        priceFloor: null,
        priceCeil: null,
        incrementStep,
        telegramEnabled: formData.telegramEnabled,
        telegramUserId: formData.telegramEnabled ? formData.telegramUserId : undefined
      }, token);

      if (response.code === '0') {
        setSuccess('Market Maker bot created successfully!');
        // Reset form
        setFormData({
          name: '',
          symbol: 'GCBUSDT',
          targetPrice: '',
          spreadPercent: '0.02',
          orderSize: '',
          priceFloor: '',
          priceCeil: '',
          incrementStep: '0.0001',
          telegramEnabled: false,
          telegramUserId: ''
        });
        onBotCreated();
      } else {
        setError(response.msg || 'Failed to create bot');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bot Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bot Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., GCB Price Support Bot"
            className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6]"
            required
          />
        </div>

        {/* Symbol */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Trading Pair
          </label>
          <input
            type="text"
            name="symbol"
            value={formData.symbol}
            onChange={handleInputChange}
            className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#8B5CF6]"
            readOnly
          />
          <p className="text-xs text-gray-500 mt-1">Currently only GCBUSDT is supported</p>
        </div>

        {/* Target Price */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Price (USDT) *
          </label>
          <input
            type="number"
            name="targetPrice"
            value={formData.targetPrice}
            onChange={handleInputChange}
            onWheel={preventScrollChange}
            placeholder="0.030000"
            step="0.000001"
            className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6]"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Bot will support price up to this level</p>
        </div>

        {/* Spread Percent */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Spread Percentage *
          </label>
          <input
            type="number"
            name="spreadPercent"
            value={formData.spreadPercent}
            onChange={handleInputChange}
            onWheel={preventScrollChange}
            placeholder="0.02"
            step="0.001"
            min="0.001"
            max="0.1"
            className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6]"
            required
          />
          <p className="text-xs text-gray-500 mt-1">e.g., 0.02 = 2% spread between buy and sell orders</p>
        </div>

        {/* Order Size */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Order Size (GCB) *
          </label>
          <input
            type="number"
            name="orderSize"
            value={formData.orderSize}
            onChange={handleInputChange}
            onWheel={preventScrollChange}
            placeholder="1000"
            step="0.01"
            min="0.01"
            className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6]"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Initial order size in GCB tokens</p>
        </div>

        {/* Increment Step */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Increment Step *
          </label>
          <input
            type="number"
            name="incrementStep"
            value={formData.incrementStep}
            onChange={handleInputChange}
            onWheel={preventScrollChange}
            placeholder="0.0001"
            step="0.00001"
            min="0.00001"
            className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6]"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Price increment for ladder strategy</p>
        </div>

        {/* Telegram Notifications */}
        <div className="border border-[#3f3f46] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="telegramEnabled"
              checked={formData.telegramEnabled}
              onChange={handleInputChange}
              className="w-4 h-4 rounded bg-[#27272a] border-[#3f3f46] text-[#8B5CF6] focus:ring-[#8B5CF6]"
            />
            <label className="text-sm font-medium text-gray-300">
              Enable Telegram Notifications
            </label>
          </div>

          {formData.telegramEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telegram User ID
              </label>
              <input
                type="text"
                name="telegramUserId"
                value={formData.telegramUserId}
                onChange={handleInputChange}
                placeholder="Your Telegram User ID"
                className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6]"
              />
              <p className="text-xs text-gray-500 mt-1">Get your ID from @userinfobot on Telegram</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#8B5CF6]/30"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Bot...
            </span>
          ) : (
            'Create Market Maker Bot'
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-blue-300 space-y-1">
            <p className="font-semibold">How Market Maker Bot Works:</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-200/80">
              <li>Continuously places buy/sell orders around the target price</li>
              <li>Uses ladder strategy: incrementally adjusting price and size</li>
              <li>Stops placing new orders when market reaches target price</li>
              <li>Automatically cancels and replaces orders each cycle</li>
              <li>Requires sufficient USDT for buy orders and GCB for sell orders</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

