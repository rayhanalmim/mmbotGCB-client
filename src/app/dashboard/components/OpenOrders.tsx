'use client';

import { useState, useEffect, useCallback } from 'react';
import { API, type OpenOrder } from '@/lib/api';

interface OpenOrdersProps {
  token: string;
}

export default function OpenOrders({ token }: OpenOrdersProps) {
  const [orders, setOrders] = useState<OpenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);
      const response = await API.trade.getOpenOrders('GCBUSDT', token);
      
      if (response.code === '0' && response.data) {
        setOrders(response.data);
      } else {
        setError(response.msg || 'Failed to fetch open orders');
      }
    } catch (err) {
      setError('Error fetching open orders');
      console.error('Open orders fetch error:', err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => fetchOrders(false), 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleCancel = async (order: OpenOrder) => {
    if (!confirm(`Cancel ${order.side} order for ${order.origQty} ${order.symbol.replace('USDT', '')} at ${order.price}?`)) {
      return;
    }

    try {
      setCancellingId(order.orderIdString);
      const response = await API.trade.cancelOrder(order.orderIdString, order.symbol, token);
      
      if (response.symbol) {
        setSuccess(`Order #${order.orderIdString} canceled successfully`);
        await fetchOrders();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to cancel order');
      }
    } catch (err) {
      setError('Error canceling order');
      console.error('Cancel order error:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp)).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && orders.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a] h-full">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a] h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Open Orders</h2>
            <p className="text-xs text-gray-400">Manage your limit orders</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-orange-500/20 text-orange-300 rounded-lg font-semibold border border-orange-500/30 text-sm">
            {orders.length} Active
          </span>
          <button
            onClick={() => fetchOrders(false)}
            disabled={loading}
            className="p-2 bg-gray-700/50 hover:bg-gray-600 text-gray-300 rounded-lg transition disabled:opacity-50"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-500/30 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-400 text-sm font-semibold">{success}</p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-300 text-lg mb-2">No open orders</p>
          <p className="text-gray-500 text-sm">Your limit orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.orderIdString}
              className="bg-[#27272a]/50 border border-[#3f3f46] rounded-xl p-4 hover:border-[#52525b] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      order.side === 'BUY' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {order.side}
                    </span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs font-semibold">
                      {order.type}
                    </span>
                    <span className="text-white font-semibold">{order.symbol}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Price</p>
                      <p className="text-white font-semibold">${parseFloat(order.price).toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Quantity</p>
                      <p className="text-white font-semibold">{parseFloat(order.origQty).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Filled</p>
                      <p className="text-white font-semibold">
                        {parseFloat(order.executedQty).toFixed(2)} / {parseFloat(order.origQty).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Total</p>
                      <p className="text-white font-semibold">
                        ${(parseFloat(order.price) * parseFloat(order.origQty)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCancel(order)}
                  disabled={cancellingId === order.orderIdString}
                  className="ml-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {cancellingId === order.orderIdString ? (
                    <>
                      <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      Canceling...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-600/50">
                <span>Order ID: {order.orderIdString}</span>
                <span>•</span>
                <span>Created: {formatDate(order.time)}</span>
                <span>•</span>
                <span className={`${order.status === 'NEW' ? 'text-green-400' : 'text-gray-400'}`}>
                  Status: {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
