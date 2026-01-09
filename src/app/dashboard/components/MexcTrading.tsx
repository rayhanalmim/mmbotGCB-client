'use client';

import { useState, useEffect, useCallback } from 'react';

interface Balance {
  asset: string;
  free: string;
  locked: string;
}

interface OpenOrder {
  orderId: string;
  symbol: string;
  side: string;
  type: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: string;
  time: number;
}

interface TickerData {
  symbol: string;
  price: string;
  priceChange?: string;
  priceChangePercent?: string;
  highPrice?: string;
  lowPrice?: string;
  volume?: string;
}

export default function MexcTrading() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [ticker24hr, setTicker24hr] = useState<TickerData | null>(null);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<OpenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Order form state
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [quoteOrderQty, setQuoteOrderQty] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'trade' | 'orders' | 'history'>('trade');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';

  const fetchBalances = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/mexc/account`);
      const data = await response.json();
      if (data.code === '0' && data.data?.balances) {
        setBalances(data.data.balances);
      }
    } catch (err) {
      console.error('Error fetching MEXC balances:', err);
    }
  }, [API_URL]);

  const fetchTicker = useCallback(async () => {
    try {
      const [tickerRes, ticker24hrRes] = await Promise.all([
        fetch(`${API_URL}/api/mexc/ticker?symbol=GCBUSDT`),
        fetch(`${API_URL}/api/mexc/ticker/24hr?symbol=GCBUSDT`)
      ]);
      
      const tickerData = await tickerRes.json();
      const ticker24hrData = await ticker24hrRes.json();
      
      if (tickerData.code === '0') {
        setTicker(tickerData.data);
      }
      if (ticker24hrData.code === '0') {
        setTicker24hr(ticker24hrData.data);
      }
    } catch (err) {
      console.error('Error fetching MEXC ticker:', err);
    }
  }, [API_URL]);

  const fetchOpenOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/mexc/openOrders?symbol=GCBUSDT`);
      const data = await response.json();
      if (data.code === '0' && Array.isArray(data.data)) {
        setOpenOrders(data.data);
      }
    } catch (err) {
      console.error('Error fetching open orders:', err);
    }
  }, [API_URL]);

  const fetchOrderHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/mexc/allOrders?symbol=GCBUSDT&limit=50`);
      const data = await response.json();
      if (data.code === '0' && Array.isArray(data.data)) {
        setOrderHistory(data.data.reverse());
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
    }
  }, [API_URL]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchBalances(),
      fetchTicker(),
      fetchOpenOrders(),
      fetchOrderHistory()
    ]);
    setLoading(false);
  }, [fetchBalances, fetchTicker, fetchOpenOrders, fetchOrderHistory]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      fetchTicker();
      fetchBalances();
      fetchOpenOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAll, fetchTicker, fetchBalances, fetchOpenOrders]);

  const placeOrder = async () => {
    setOrderLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const orderData: Record<string, string> = {
        symbol: 'GCBUSDT',
        side: orderSide,
        type: orderType
      };

      if (orderType === 'LIMIT') {
        if (!quantity || !price) {
          setError('Please enter quantity and price for limit order');
          setOrderLoading(false);
          return;
        }
        orderData.quantity = quantity;
        orderData.price = price;
      } else {
        if (orderSide === 'BUY') {
          if (!quoteOrderQty) {
            setError('Please enter USDT amount for market buy');
            setOrderLoading(false);
            return;
          }
          orderData.quoteOrderQty = quoteOrderQty;
        } else {
          if (!quantity) {
            setError('Please enter GCB quantity for market sell');
            setOrderLoading(false);
            return;
          }
          orderData.quantity = quantity;
        }
      }

      const response = await fetch(`${API_URL}/api/mexc/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.code === '0') {
        setSuccess(`Order placed successfully! Order ID: ${data.data.orderId}`);
        setQuantity('');
        setPrice('');
        setQuoteOrderQty('');
        fetchAll();
      } else {
        setError(data.msg || 'Failed to place order');
      }
    } catch (err) {
      setError('Error placing order');
      console.error(err);
    } finally {
      setOrderLoading(false);
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/mexc/order`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'GCBUSDT', orderId })
      });

      const data = await response.json();

      if (data.code === '0') {
        setSuccess('Order cancelled successfully');
        fetchOpenOrders();
        fetchOrderHistory();
      } else {
        setError(data.msg || 'Failed to cancel order');
      }
    } catch (err) {
      setError('Error cancelling order');
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  };

  const cancelAllOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/mexc/openOrders`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'GCBUSDT' })
      });

      const data = await response.json();

      if (data.code === '0') {
        setSuccess('All orders cancelled');
        fetchOpenOrders();
        fetchOrderHistory();
      } else {
        setError(data.msg || 'Failed to cancel orders');
      }
    } catch (err) {
      setError('Error cancelling orders');
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-[#2a2a2a] pb-2">
        <button
          onClick={() => setActiveTab('trade')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'trade'
              ? 'bg-[#00B897] text-white'
              : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
          }`}
        >
          Trade
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'orders'
              ? 'bg-[#00B897] text-white'
              : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
          }`}
        >
          Open Orders ({openOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-[#00B897] text-white'
              : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
          }`}
        >
          Order History
        </button>
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

      {/* Trade Tab */}
      {activeTab === 'trade' && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h3 className="text-white font-bold text-lg mb-4">Place Order</h3>
          
          {/* Order Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setOrderType('LIMIT')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                orderType === 'LIMIT'
                  ? 'bg-[#00B897] text-white'
                  : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
              }`}
            >
              Limit
            </button>
            <button
              onClick={() => setOrderType('MARKET')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                orderType === 'MARKET'
                  ? 'bg-[#00B897] text-white'
                  : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
              }`}
            >
              Market
            </button>
          </div>

          {/* Buy/Sell Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setOrderSide('BUY')}
              className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
                orderSide === 'BUY'
                  ? 'bg-green-500 text-white'
                  : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setOrderSide('SELL')}
              className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
                orderSide === 'SELL'
                  ? 'bg-red-500 text-white'
                  : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
              }`}
            >
              SELL
            </button>
          </div>

          {/* Order Form */}
          <div className="space-y-4">
            {orderType === 'LIMIT' && (
              <>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Price (USDT)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.000000"
                    step="0.000001"
                    className="w-full bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00B897]"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Quantity (GCB)</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00B897]"
                  />
                </div>
                {price && quantity && (
                  <div className="bg-[#2a2a2a] rounded-lg p-3">
                    <div className="text-gray-400 text-sm">Total</div>
                    <div className="text-white font-bold">
                      {(parseFloat(price || '0') * parseFloat(quantity || '0')).toFixed(2)} USDT
                    </div>
                  </div>
                )}
              </>
            )}

            {orderType === 'MARKET' && orderSide === 'BUY' && (
              <div>
                <label className="block text-gray-400 text-sm mb-1">Amount (USDT)</label>
                <input
                  type="number"
                  value={quoteOrderQty}
                  onChange={(e) => setQuoteOrderQty(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00B897]"
                />
                <p className="text-gray-500 text-xs mt-1">Enter USDT amount to spend</p>
              </div>
            )}

            {orderType === 'MARKET' && orderSide === 'SELL' && (
              <div>
                <label className="block text-gray-400 text-sm mb-1">Quantity (GCB)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00B897]"
                />
                <p className="text-gray-500 text-xs mt-1">Enter GCB amount to sell</p>
              </div>
            )}

            <button
              onClick={placeOrder}
              disabled={orderLoading}
              className={`w-full py-4 rounded-lg font-bold text-white transition-colors disabled:opacity-50 ${
                orderSide === 'BUY'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {orderLoading ? 'Placing Order...' : `${orderSide} GCB`}
            </button>
          </div>
        </div>
      )}

      {/* Open Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold text-lg">Open Orders</h3>
            {openOrders.length > 0 && (
              <button
                onClick={cancelAllOrders}
                className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-sm hover:bg-red-500/30"
              >
                Cancel All
              </button>
            )}
          </div>
          
          {openOrders.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No open orders</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-[#2a2a2a]">
                    <th className="text-left pb-2">Side</th>
                    <th className="text-left pb-2">Type</th>
                    <th className="text-right pb-2">Price</th>
                    <th className="text-right pb-2">Amount</th>
                    <th className="text-right pb-2">Filled</th>
                    <th className="text-right pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {openOrders.map((order) => (
                    <tr key={order.orderId} className="border-b border-[#2a2a2a]">
                      <td className={`py-3 ${order.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                        {order.side}
                      </td>
                      <td className="py-3 text-white">{order.type}</td>
                      <td className="py-3 text-white text-right">${order.price}</td>
                      <td className="py-3 text-white text-right">{order.origQty}</td>
                      <td className="py-3 text-white text-right">{order.executedQty}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => cancelOrder(order.orderId)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Order History Tab */}
      {activeTab === 'history' && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h3 className="text-white font-bold text-lg mb-4">Order History</h3>
          
          {orderHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No order history</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-[#2a2a2a]">
                    <th className="text-left pb-2">Time</th>
                    <th className="text-left pb-2">Side</th>
                    <th className="text-left pb-2">Type</th>
                    <th className="text-right pb-2">Price</th>
                    <th className="text-right pb-2">Amount</th>
                    <th className="text-right pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.slice(0, 20).map((order) => (
                    <tr key={order.orderId} className="border-b border-[#2a2a2a]">
                      <td className="py-3 text-gray-400 text-sm">
                        {new Date(order.time).toLocaleString()}
                      </td>
                      <td className={`py-3 ${order.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                        {order.side}
                      </td>
                      <td className="py-3 text-white">{order.type}</td>
                      <td className="py-3 text-white text-right">${order.price}</td>
                      <td className="py-3 text-white text-right">{order.origQty}</td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.status === 'FILLED' ? 'bg-green-500/20 text-green-400' :
                          order.status === 'CANCELED' ? 'bg-red-500/20 text-red-400' :
                          order.status === 'NEW' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
