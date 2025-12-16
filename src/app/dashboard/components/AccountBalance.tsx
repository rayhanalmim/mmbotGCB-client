'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import type { CoinBalance } from '@/lib/api';

interface AccountBalanceProps {
  token: string | null;
}

export default function AccountBalance({ token }: AccountBalanceProps) {
  const [balances, setBalances] = useState<CoinBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [updatingBalances, setUpdatingBalances] = useState<Record<string, boolean>>({});

  const fetchBalance = useCallback(async () => {
    if (!token) return;
    
    try {
      // Only show loading skeleton on initial load
      if (isInitialLoad) {
        setLoading(true);
      } else {
        // Trigger blur effect for balance updates
        setUpdatingBalances({
          'GCB': true,
          'USDT': true
        });
      }
      
      setError(null);
      const response = await apiClient.user.getBalance(1, token);
      
      // Handle rate limiting - don't show error, just skip update
      if (response.rateLimited) {
        console.log(`⏱️ Balance API rate limited. Wait ${response.waitTime}s`);
        if (!isInitialLoad) {
          setTimeout(() => {
            setUpdatingBalances({});
          }, 300);
        }
        return;
      }
      
      if (response.code === '0' && response.data && response.data.allCoinMap) {
        // Extract only GCB and USDT from allCoinMap
        const targetCoins = ['GCB', 'USDT'];
        const filteredBalances: CoinBalance[] = [];
        const allCoinMap = response.data.allCoinMap;
        
        targetCoins.forEach(coinName => {
          if (allCoinMap[coinName]) {
            filteredBalances.push(allCoinMap[coinName]);
          }
        });
        
        setBalances(filteredBalances);
        
        // Remove blur effect after a short delay
        if (!isInitialLoad) {
          setTimeout(() => {
            setUpdatingBalances({});
          }, 300);
        }
      } else {
        setError(response.msg || 'Failed to fetch balance');
      }
    } catch (err) {
      setError('Failed to fetch account balance');
      console.error('Balance fetch error:', err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, [token, isInitialLoad]);

  useEffect(() => {
    if (token) {
      fetchBalance();
      
      // Refresh every 5 seconds
      const interval = setInterval(fetchBalance, 5000);
      
      return () => clearInterval(interval);
    }
  }, [token, fetchBalance]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-700">
        <div className="h-5 bg-gray-700 rounded w-32 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-700/30 rounded-xl p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                  <div className="h-4 bg-gray-600 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-600 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Account Balance</h2>
        <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-400">{error}</p>
          <p className="text-gray-400 text-sm mt-2">
            Make sure you&apos;re logged in and have the correct permissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-700 hover:border-emerald-500/30 transition-all">
      <h2 className="text-base font-bold text-white mb-4">Account Balance</h2>
      
      <div className="space-y-3">
        {balances.length > 0 ? (
          balances.map((balance) => (
            <div 
              key={balance.coinName}
              className="bg-gray-700/30 hover:bg-gray-700/50 p-4 rounded-xl transition border border-gray-600/30 hover:border-emerald-500/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <img 
                    src={balance.icon} 
                    alt={balance.showName}
                    className="w-10 h-10 rounded-full shadow-lg shadow-blue-500/30"
                  />
                  <div>
                    <span className="text-white font-bold text-sm block">{balance.showName}</span>
                    <span className="text-gray-400 text-xs">{balance.exchange_symbol}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-white font-bold text-lg transition-all duration-300 ${
                    updatingBalances[balance.coinName] ? 'blur-sm opacity-50' : 'blur-0 opacity-100'
                  }`}>{balance.total_balance}</div>
                  <div className="text-xs text-gray-400">
                    Total Balance
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-600/50">
                <div>
                  <p className="text-xs text-gray-400">Available</p>
                  <p className={`text-sm font-semibold text-green-400 transition-all duration-300 ${
                    updatingBalances[balance.coinName] ? 'blur-sm opacity-50' : 'blur-0 opacity-100'
                  }`}>{balance.normal_balance}</p>
                </div>
                {parseFloat(balance.lock_balance) > 0 && (
                  <div>
                    <p className="text-xs text-gray-400">Locked</p>
                    <p className={`text-sm font-semibold text-amber-400 transition-all duration-300 ${
                      updatingBalances[balance.coinName] ? 'blur-sm opacity-50' : 'blur-0 opacity-100'
                    }`}>{balance.lock_balance}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm font-medium text-gray-400">No balance available</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#27272a] text-gray-500 text-xs text-center flex items-center justify-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Updates every 5 seconds
      </div>
    </div>
  );
}
