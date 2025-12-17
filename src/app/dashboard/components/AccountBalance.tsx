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
  const [needsCredentials, setNeedsCredentials] = useState(false);
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
      
      console.log('📊 Balance API Response:', response);
      
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
        setNeedsCredentials(false);
        setError(null);
        
        // Remove blur effect after a short delay
        if (!isInitialLoad) {
          setTimeout(() => {
            setUpdatingBalances({});
          }, 300);
        }
      } else {
        // Clear balances on error
        setBalances([]);
        
        // Check if error is due to missing credentials
        if (response.needsCredentials || response.msg?.includes('credentials')) {
          console.log('🔑 API Credentials Required - Setting error state');
          setNeedsCredentials(true);
          setError('API credentials not configured');
        } else {
          console.log('❌ Balance API Error:', response.msg);
          setError(response.msg || 'Failed to fetch balance');
          setNeedsCredentials(false);
        }
        
        // Clear updating state
        if (!isInitialLoad) {
          setTimeout(() => {
            setUpdatingBalances({});
          }, 300);
        }
      }
    } catch (err) {
      setBalances([]);
      setError('Failed to fetch account balance');
      setNeedsCredentials(false);
      console.error('Balance fetch error:', err);
      
      // Clear updating state on error
      if (!isInitialLoad) {
        setTimeout(() => {
          setUpdatingBalances({});
        }, 300);
      }
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
    console.log('⏳ AccountBalance: Rendering loading state');
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
    console.log('⚠️ AccountBalance: Rendering error state', { error, needsCredentials });
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Account Balance</h2>
            <p className="text-xs text-gray-400">2 Assets</p>
          </div>
        </div>

        {needsCredentials ? (
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 rounded-xl p-5 shadow-lg">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-amber-300 font-bold text-sm mb-1">API Credentials Required</h3>
                <p className="text-amber-200/80 text-xs leading-relaxed mb-3">
                  Please configure your GCBEX API credentials to view your account balance and enable bot trading.
                </p>
                <a
                  href="#settings"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configure API Credentials
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-2 border-red-500/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-red-500/30">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-red-300 font-bold text-sm mb-1">Failed to Load Balance</h3>
                <p className="text-red-200/80 text-xs leading-relaxed mb-2">{error}</p>
                <button
                  onClick={fetchBalance}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-xs font-semibold transition-all border border-red-500/30 hover:border-red-500/50"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
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
          <div className="bg-gradient-to-br from-gray-700/20 to-gray-800/20 border border-gray-600/30 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-600/30">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-300 mb-1">No Balance Found</p>
            <p className="text-xs text-gray-500">Your GCB and USDT balances will appear here</p>
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
