'use client';

import { useState } from 'react';

interface BuyOrder {
  price: string;
  usdtAmount: string;
}

interface BuyWallBotBuilderProps {
  token: string | null;
  onBotCreated: () => void;
}

export default function BuyWallBotBuilder({ token, onBotCreated }: BuyWallBotBuilderProps) {
  const [name, setName] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([{ price: '', usdtAmount: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const preventScrollChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const addOrder = () => {
    setBuyOrders([...buyOrders, { price: '', usdtAmount: '' }]);
  };

  const removeOrder = (index: number) => {
    if (buyOrders.length > 1) {
      setBuyOrders(buyOrders.filter((_, i) => i !== index));
    }
  };

  const updateOrder = (index: number, field: 'price' | 'usdtAmount', value: string) => {
    const updated = [...buyOrders];
    updated[index][field] = value;
    setBuyOrders(updated);
  };

  const getTotalUsdt = () => {
    return buyOrders.reduce((sum, order) => {
      const amount = parseFloat(order.usdtAmount) || 0;
      return sum + amount;
    }, 0);
  };

  const getValidOrdersCount = () => {
    return buyOrders.filter(o => parseFloat(o.price) > 0 && parseFloat(o.usdtAmount) > 0).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Please log in to create bots');
      return;
    }

    // Validate orders
    const validOrders = buyOrders.filter(o => 
      parseFloat(o.price) > 0 && parseFloat(o.usdtAmount) > 0
    );

    if (validOrders.length === 0) {
      setError('Please add at least one valid buy order');
      return;
    }

    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      setError('Please set a valid target price');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';
      const response = await fetch(`${apiUrl}/api/bot/buywall/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name || `Buy Wall Bot - ${new Date().toLocaleString()}`,
          targetPrice: parseFloat(targetPrice),
          buyOrders: validOrders.map(o => ({
            price: parseFloat(o.price),
            usdtAmount: parseFloat(o.usdtAmount)
          }))
        })
      });

      const data = await response.json();

      if (data.code === '0') {
        setSuccess(`Buy Wall Bot created with ${validOrders.length} orders totaling $${getTotalUsdt().toFixed(2)} USDT`);
        setName('');
        setTargetPrice('');
        setBuyOrders([{ price: '', usdtAmount: '' }]);
        onBotCreated();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.msg || 'Failed to create bot');
      }
    } catch (err) {
      setError('Error creating bot');
      console.error('Buy Wall bot creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPresetOrders = () => {
    const presetOrders: BuyOrder[] = [
      { price: '0.0270', usdtAmount: '10' },
      { price: '0.0268', usdtAmount: '4' },
      { price: '0.0266', usdtAmount: '6' },
      { price: '0.0264', usdtAmount: '8' },
      { price: '0.0262', usdtAmount: '10' },
      { price: '0.0260', usdtAmount: '12' },
      { price: '0.0258', usdtAmount: '10' },
      { price: '0.0255', usdtAmount: '8' },
      { price: '0.0253', usdtAmount: '6' },
      { price: '0.0250', usdtAmount: '12' },
      { price: '0.0247', usdtAmount: '10' },
      { price: '0.0244', usdtAmount: '8' },
      { price: '0.0241', usdtAmount: '6' },
      { price: '0.0238', usdtAmount: '4' },
      { price: '0.0235', usdtAmount: '6' },
      { price: '0.0232', usdtAmount: '8' },
      { price: '0.0229', usdtAmount: '10' },
      { price: '0.0227', usdtAmount: '12' },
      { price: '0.0224', usdtAmount: '14' },
      { price: '0.0220', usdtAmount: '16' },
      { price: '0.0217', usdtAmount: '18' },
      { price: '0.0214', usdtAmount: '20' },
      { price: '0.0200', usdtAmount: '22' },
      { price: '0.0170', usdtAmount: '24' },
      { price: '0.0140', usdtAmount: '26' },
    ];
    setBuyOrders(presetOrders);
    setTargetPrice('0.027');
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
            placeholder="e.g., GCB Buy Wall"
            className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] placeholder-gray-500"
          />
        </div>

        {/* Target Price Configuration */}
        <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg shadow-orange-500/50">🎯</span>
            Target Price (Trigger)
          </h3>
          
          <div>
            <label className="block text-gray-300 text-xs font-semibold mb-1">
              When GCB price reaches or drops below this price, place all orders
            </label>
            <input
              type="number"
              step="0.000001"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              onWheel={preventScrollChange}
              placeholder="0.027"
              required
              className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
            />
          </div>
        </div>

        {/* Buy Orders Configuration */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold flex items-center gap-2 text-sm">
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg shadow-green-500/50">🧱</span>
              Buy Wall Orders
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadPresetOrders}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors"
              >
                Load Preset
              </button>
              <button
                type="button"
                onClick={addOrder}
                className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-semibold rounded-lg border border-green-500/30 transition-colors"
              >
                + Add Order
              </button>
            </div>
          </div>

          {/* Order List Header */}
          <div className="grid grid-cols-12 gap-2 mb-2 px-1">
            <div className="col-span-1 text-gray-500 text-xs font-semibold">#</div>
            <div className="col-span-5 text-gray-400 text-xs font-semibold">Price (USDT)</div>
            <div className="col-span-5 text-gray-400 text-xs font-semibold">Amount (USDT)</div>
            <div className="col-span-1"></div>
          </div>

          {/* Orders List with Scroll */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {buyOrders.map((order, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1 text-gray-500 text-xs font-mono">{index + 1}</div>
                <div className="col-span-5">
                  <input
                    type="number"
                    step="0.000001"
                    value={order.price}
                    onChange={(e) => updateOrder(index, 'price', e.target.value)}
                    onWheel={preventScrollChange}
                    placeholder="0.027"
                    className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  />
                </div>
                <div className="col-span-5">
                  <input
                    type="number"
                    step="0.01"
                    value={order.usdtAmount}
                    onChange={(e) => updateOrder(index, 'usdtAmount', e.target.value)}
                    onWheel={preventScrollChange}
                    placeholder="10"
                    className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {buyOrders.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOrder(index)}
                      className="text-red-400 hover:text-red-300 text-lg"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-3 pt-3 border-t border-green-500/20 flex justify-between items-center">
            <span className="text-gray-400 text-sm">
              <span className="text-green-400 font-bold">{getValidOrdersCount()}</span> orders
            </span>
            <span className="text-gray-400 text-sm">
              Total: <span className="text-green-400 font-bold">${getTotalUsdt().toFixed(2)}</span> USDT
            </span>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/50">💡</span>
            How It Works
          </h3>
          
          <div className="space-y-2">
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-200">
                <strong>1. Trigger:</strong> When market price drops to or below target price, all buy orders are placed at once.
              </p>
            </div>
            <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-xs text-green-200">
                <strong>2. Auto-Refill:</strong> Bot monitors orders continuously. If any order gets filled (someone sells into it), bot automatically re-places that order.
              </p>
            </div>
            <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-xs text-purple-200">
                <strong>3. Partial Fill Handling:</strong> If an order is partially filled, bot tops up the filled portion first before re-placing completely filled orders.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !targetPrice || getValidOrdersCount() === 0}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-orange-500/50 transition-all duration-200 flex items-center justify-center gap-2"
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
              Create Buy Wall Bot
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
