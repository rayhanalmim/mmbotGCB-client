'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import MarketData from './components/MarketData';
import BotConditionBuilder from './components/BotConditionBuilder';
import StabilizerBotBuilder from './components/StabilizerBotBuilder';
import BotConditionsList from './components/BotConditionsList';
import StabilizerBotsList from './components/StabilizerBotsList';
import StabilizerBotActivityLogs from './components/StabilizerBotActivityLogs';
import MarketMakerBotBuilder from './components/MarketMakerBotBuilder';
import MarketMakerBotsList from './components/MarketMakerBotsList';
import MarketMakerBotActivityLogs from './components/MarketMakerBotActivityLogs';
import ApiCredentialsSetup from './components/ApiCredentialsSetup';
import BotControl from './components/BotControl';
import BotActivityLogs from './components/BotActivityLogs';
import BotTradeHistory from './components/BotTradeHistory';
import OpenOrders from './components/OpenOrders';
import OrderBookDisplay from './components/OrderBookDisplay';
import TradingViewChart from './components/TradingViewChart';

// Custom hook to read localStorage safely
function useLocalStorage(key: string): string | null {
  const getSnapshot = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  };

  const subscribe = (callback: () => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export default function DashboardPage() {
  const router = useRouter();
  const token = useLocalStorage('gcbex_token');
  const uid = useLocalStorage('gcbex_uid');
  const isMountedRef = useRef(false);
  const hasChecked = useRef(false);
  const [refreshConditions, setRefreshConditions] = useState(0);
  const [refreshStabilizerBots, setRefreshStabilizerBots] = useState(0);
  const [refreshMarketMakerBots, setRefreshMarketMakerBots] = useState(0);
  const [hasValidCredentials, setHasValidCredentials] = useState(false);
  const [balances, setBalances] = useState<{ asset: string; free: string; locked: string }[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceUpdating, setBalanceUpdating] = useState(false);
  const [botStats, setBotStats] = useState({ total: 0, running: 0, executed: 0 });
  const [activeTab, setActiveTab] = useState<'analysis' | 'createbot' | 'mybots' | 'orders' | 'logs'>('analysis');
  const [gcbPrice, setGcbPrice] = useState<number | null>(null);
  const [usdtPrice, setUsdtPrice] = useState<number | null>(null);

  // Check authentication after client-side mount
  useEffect(() => {
    // Mark as mounted on first effect run (client-side only)
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    // Only check auth after mount flag is set
    if (hasChecked.current) return;
    hasChecked.current = true;

    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  // Fetch balance data
  useEffect(() => {
    if (!token) return;

    let isFirstFetch = true;

    const fetchBalance = async () => {
      try {
        if (isFirstFetch) {
          setBalanceLoading(true);
        } else {
          setBalanceUpdating(true);
        }

        const response = await fetch('http://localhost:3001/api/users/balance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ accountType: 'EXCHANGE' })
        });
        const data = await response.json();
        console.log('💰 Balance data:', data);

        // Check if response has allCoinMap structure
        if (data.code === '0' && data.data?.allCoinMap) {
          // Convert allCoinMap object to balances array
          const balancesArray = Object.entries(data.data.allCoinMap).map(([asset, coinData]) => {
            const coin = coinData as { free?: string; locked?: string; normal_balance?: string; lock_balance?: string };
            return {
              asset: asset,
              free: coin.free || coin.normal_balance || '0',
              locked: coin.locked || coin.lock_balance || '0'
            };
          });
          setBalances(balancesArray);
          console.log('✅ Balances set:', balancesArray.filter((b) => b.asset === 'GCB' || b.asset === 'USDT'));
        }
        // Fallback for old API format
        else if (data.code === '0' && data.data?.balances) {
          setBalances(data.data.balances);
          console.log('✅ Balances set (old format):', data.data.balances.filter((b: { asset: string }) => b.asset === 'GCB' || b.asset === 'USDT'));
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        if (isFirstFetch) {
          setBalanceLoading(false);
          isFirstFetch = false;
        } else {
          setTimeout(() => setBalanceUpdating(false), 300);
        }
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [token]);

  // Fetch bot stats
  useEffect(() => {
    if (!token) return;

    const fetchBotStats = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/bot/conditions', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.code === '0' && data.data) {
          const total = data.data.length;
          const running = data.data.filter((c: { isActive: boolean }) => c.isActive).length;
          setBotStats({ total, running, executed: 0 }); // TODO: Add executed count
        }
      } catch (error) {
        console.error('Error fetching bot stats:', error);
      }
    };

    fetchBotStats();
    const interval = setInterval(fetchBotStats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [token, refreshConditions]);

  // Check API credentials globally on page load
  useEffect(() => {
    if (!token) return;

    const checkCredentials = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/users/api-credentials`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.code === '0' && data.data) {
          const isValid = data.data.hasCredentials && data.data.valid;
          setHasValidCredentials(isValid);
          console.log('🔐 API Credentials Status:', isValid ? 'Valid ✅' : 'Invalid ❌');
        } else {
          setHasValidCredentials(false);
        }
      } catch (error) {
        console.error('Error checking credentials:', error);
        setHasValidCredentials(false);
      }
    };

    checkCredentials();
  }, [token]);

  // Fetch GCB and USDT prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        // Fetch GCB/USDT price through backend API
        const gcbResponse = await fetch(`${apiUrl}/api/test/openapi/ticker?symbol=GCBUSDT`);
        const gcbResult = await gcbResponse.json();
        if (gcbResult.success && gcbResult.data && gcbResult.data.last) {
          setGcbPrice(parseFloat(gcbResult.data.last));
        }

        // Set USDT price to 1.0 (stable coin)
        setUsdtPrice(1.0);
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('gcbex_token');
    localStorage.removeItem('gcbex_uid');
    router.push('/login');
  };

  // Get GCB and USDT balances
  const gcbBalance = balances.find(b => b.asset === 'GCB');
  const usdtBalance = balances.find(b => b.asset === 'USDT');
  const gcbFree = parseFloat(gcbBalance?.free || '0');
  const usdtFree = parseFloat(usdtBalance?.free || '0');

  // Debug log
  console.log('🔍 Rendering balances:', {
    gcbBalance,
    usdtBalance,
    gcbFree,
    usdtFree,
    balanceLoading,
    totalBalances: balances.length
  });

  // Show loading state during hydration or when checking auth
  // Only show loading on client-side after initial render
  if (typeof window === 'undefined' || !token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
       {/* Professional Navigation Header */}
       <header className="sticky top-0 z-50 bg-[#0d0d0d] backdrop-blur-xl border-b border-[#27272a] shadow-2xl">
         <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between items-center h-14">
             {/* Logo & Brand */}
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2.5">
                 {/* Logo */}
                 <div className="relative flex-shrink-0">
                   <img
                     src="/gcblogo.png"
                     alt="GCBEX"
                     className="w-8 h-8 object-contain"
                   />
                 </div>
                 
                 {/* Brand Text */}
                 <div>
                   <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                     GCBEX Trading Bot
                   </h1>
                   <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider leading-tight">Market Maker Platform</p>
                 </div>
               </div>

               {/* Status Badge */}
               <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                 <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">Live</span>
               </div>
             </div>

            {/* Compact Nav Actions */}
            <div className="flex items-center gap-2">
              {/* GCB Market Price */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition-colors">
                <span className="text-[10px] font-bold text-purple-400 uppercase">GCB Price</span>
                <span className="text-xs font-bold text-white">
                  {gcbPrice === null ? '...' : `$${gcbPrice.toFixed(6)}`}
                </span>
              </div>

              {/* GCB Balance */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-blue-500/20 rounded-lg hover:border-blue-500/40 transition-colors">
                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-xs font-bold text-white">
                  {balanceLoading ? '...' : `${gcbFree.toFixed(2)} GCB`}
                </span>
              </div>

              {/* USDT Balance */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-green-500/20 rounded-lg hover:border-green-500/40 transition-colors">
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-bold text-white">
                  {balanceLoading ? '...' : `$${usdtFree.toFixed(2)}`}
                </span>
              </div>

               {/* Refresh Button */}
               <button
                 onClick={async () => {
                   setBalanceUpdating(true);
                   setTimeout(() => setBalanceUpdating(false), 2000);
                 }}
                 disabled={balanceUpdating}
                 className="hidden md:flex items-center justify-center w-8 h-8 bg-[#1a1a1a] hover:bg-[#252525] border border-[#27272a] rounded-lg transition-all disabled:opacity-50"
                 title="Refresh Balances"
               >
                 <svg className={`w-3.5 h-3.5 text-gray-400 ${balanceUpdating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
               </button>

               {/* Divider */}
               <div className="hidden md:block w-px h-6 bg-[#27272a]"></div>

               {/* Global Bot Control */}
               {hasValidCredentials && (
                 <div className="hidden sm:block">
                   <BotControl token={token} compact={true} />
                 </div>
               )}

               {/* User Info */}
               <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#27272a] rounded-lg hover:border-[#3a3a3a] transition-colors">
                 <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                 </svg>
                 <span className="text-xs font-semibold text-white">{uid?.substring(0, 8) || 'N/A'}</span>
               </div>

               {/* Logout Button */}
               <button
                 onClick={handleLogout}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-[#27272a] hover:border-red-500/30 rounded-lg transition-all text-xs font-semibold group"
               >
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
                 <span className="hidden sm:inline">Logout</span>
               </button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
         {/* Tab Navigation - Improved Design */}
         <div className="mb-6 relative">
           {/* Gradient Background Effect */}
           <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl blur-xl"></div>
           
           <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-1.5 border border-[#27272a] shadow-2xl">
             <div className="flex flex-wrap gap-1.5">
               <button
                 onClick={() => setActiveTab('analysis')}
                 className={`group flex-1 min-w-[140px] px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 relative overflow-hidden ${
                   activeTab === 'analysis'
                     ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50 scale-[1.02]'
                     : 'bg-[#27272a] text-gray-400 hover:bg-[#2f2f32] hover:text-white hover:scale-[1.01]'
                 }`}
               >
                 {activeTab === 'analysis' && (
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                 )}
                 <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                 </svg>
                 <span className="relative z-10">Analysis</span>
               </button>
               
               <button
                onClick={() => setActiveTab('createbot')}
                className={`group flex-1 min-w-[140px] px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 relative overflow-hidden ${
                  activeTab === 'createbot'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 scale-[1.02]'
                    : 'bg-[#27272a] text-gray-400 hover:bg-[#2f2f32] hover:text-white hover:scale-[1.01]'
                }`}
              >
                {activeTab === 'createbot' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                )}
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="relative z-10">Create Bot</span>
              </button>
              
              <button
                onClick={() => setActiveTab('mybots')}
                className={`group flex-1 min-w-[140px] px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 relative overflow-hidden ${
                  activeTab === 'mybots'
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/50 scale-[1.02]'
                    : 'bg-[#27272a] text-gray-400 hover:bg-[#2f2f32] hover:text-white hover:scale-[1.01]'
                }`}
              >
                {activeTab === 'mybots' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                )}
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="relative z-10">My Bots</span>
              </button>
              
              <button
                onClick={() => setActiveTab('orders')}
                className={`group flex-1 min-w-[140px] px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 relative overflow-hidden ${
                  activeTab === 'orders'
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50 scale-[1.02]'
                    : 'bg-[#27272a] text-gray-400 hover:bg-[#2f2f32] hover:text-white hover:scale-[1.01]'
                }`}
              >
                {activeTab === 'orders' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                )}
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="relative z-10">Orders</span>
              </button>
              
              <button
                onClick={() => setActiveTab('logs')}
                className={`group flex-1 min-w-[140px] px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 relative overflow-hidden ${
                  activeTab === 'logs'
                    ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/50 scale-[1.02]'
                    : 'bg-[#27272a] text-gray-400 hover:bg-[#2f2f32] hover:text-white hover:scale-[1.01]'
                }`}
              >
                {activeTab === 'logs' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                )}
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="relative z-10">Logs</span>
              </button>
             </div>
           </div>
         </div>

         <style jsx>{`
           @keyframes shimmer {
             0% { transform: translateX(-100%); }
             100% { transform: translateX(100%); }
           }
           .animate-shimmer {
             animation: shimmer 2s infinite;
           }
         `}</style>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* TAB 1: ANALYSIS */}
          {activeTab === 'analysis' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Executive KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Account Balance */}
          <div className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-5 shadow-2xl border border-[#6366F1]/20 hover:border-[#6366F1]/50 hover:shadow-[#6366F1]/20 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#6366F1]/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#7C3AED] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6366F1]/50 group-hover:scale-110 group-hover:shadow-[#6366F1]/70 transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                {balanceLoading ? (
                  <div className="w-16 h-6 bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-[#6366F1]/20 text-[#A5B4FC] text-xs font-bold rounded-lg border border-[#6366F1]/30">2 Assets</span>
                    {balanceUpdating && (
                      <div className="w-1.5 h-1.5 bg-[#6366F1] rounded-full animate-pulse"></div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">Account Balance</p>
              {balanceLoading ? (
                <div className="space-y-2">
                  <div className="h-8 bg-gray-700 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className={`space-y-1.5 transition-all duration-300 ${balanceUpdating ? 'blur-sm opacity-70' : 'blur-0 opacity-100'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-white">{gcbFree.toFixed(2)}</span>
                      <span className="text-sm text-gray-400">GCB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-green-400">{usdtFree.toFixed(2)}</span>
                      <span className="text-sm text-gray-400">USDT</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bot Conditions */}
          <div className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-5 shadow-2xl border border-[#FF007A]/20 hover:border-[#FF007A]/50 hover:shadow-[#FF007A]/20 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF007A]/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF007A] to-[#E91E63] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF007A]/50 group-hover:scale-110 group-hover:shadow-[#FF007A]/70 transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${botStats.running > 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-[#FF007A]/20 text-[#FF007A] border-[#FF007A]/30'}`}>
                  {botStats.running} Running
                </span>
              </div>
              <p className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">Bot Conditions</p>
              <p className="text-3xl font-black text-white">{botStats.total}</p>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="w-1 h-1 bg-[#FF007A] rounded-full shadow-lg shadow-[#FF007A]/50"></span>
                {botStats.total > 0 ? `${botStats.total} condition${botStats.total > 1 ? 's' : ''} configured` : 'Ready to configure'}
              </p>
            </div>
          </div>

          {/* Total Running Bots */}
          <div className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-5 shadow-2xl border border-[#10B981]/20 hover:border-[#10B981]/50 hover:shadow-[#10B981]/20 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#10B981]/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl flex items-center justify-center shadow-lg shadow-[#10B981]/50 group-hover:scale-110 group-hover:shadow-[#10B981]/70 transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                {botStats.running > 0 ? (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-green-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    Active
                  </div>
                ) : (
                  <span className="px-2.5 py-1 bg-gray-500/20 text-gray-400 text-xs font-bold rounded-lg border border-gray-500/30">Idle</span>
                )}
              </div>
              <p className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">Total Running Bots</p>
              <p className="text-3xl font-black text-white">{botStats.running}</p>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="w-1 h-1 bg-[#10B981] rounded-full shadow-lg shadow-[#10B981]/50"></span>
                {botStats.running > 0 ? `${botStats.running} bot${botStats.running > 1 ? 's' : ''} active` : 'No active bots'}
              </p>
            </div>
          </div>

          {/* Total Executed */}
          <div className="group bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-5 shadow-2xl border border-[#6366F1]/20 hover:border-[#6366F1]/50 hover:shadow-[#6366F1]/20 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#6366F1]/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#7C3AED] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6366F1]/50 group-hover:scale-110 group-hover:shadow-[#6366F1]/70 transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="px-2.5 py-1 bg-[#6366F1]/20 text-[#A5B4FC] text-xs font-bold rounded-lg border border-[#6366F1]/30">All Time</span>
              </div>
              <p className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">Total Executed</p>
              <p className="text-3xl font-black text-white">{botStats.executed}</p>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="w-1 h-1 bg-[#6366F1] rounded-full shadow-lg shadow-[#6366F1]/50"></span>
                {botStats.executed > 0 ? `${botStats.executed} trade${botStats.executed > 1 ? 's' : ''} executed` : 'No executions yet'}
              </p>
            </div>
          </div>
        </div>

               {/* Market Data Widget */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 <MarketData token={token} />
                 
                 {/* Quick Actions Card */}
                 <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
                   <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                     <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                     </svg>
                     <span>Quick Actions</span>
                   </h3>
                   <div className="space-y-3">
                     <button
                      onClick={() => setActiveTab('createbot')}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/30 rounded-xl text-purple-300 text-sm font-semibold transition-all flex items-center justify-between group"
                    >
                      <span>Create New Bot</span>
                       <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                       </svg>
                     </button>
                     <button
                      onClick={() => setActiveTab('mybots')}
                      className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500/20 to-indigo-600/20 hover:from-indigo-500/30 hover:to-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-300 text-sm font-semibold transition-all flex items-center justify-between group"
                    >
                      <span>Manage My Bots</span>
                       <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                       </svg>
                     </button>
                     <button
                      onClick={() => setActiveTab('logs')}
                      className="w-full px-4 py-3 bg-gradient-to-r from-pink-500/20 to-pink-600/20 hover:from-pink-500/30 hover:to-pink-600/30 border border-pink-500/30 rounded-xl text-pink-300 text-sm font-semibold transition-all flex items-center justify-between group"
                    >
                      <span>View Bot Logs</span>
                       <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                       </svg>
                     </button>
                     <button
                      onClick={() => setActiveTab('orders')}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 border border-green-500/30 rounded-xl text-green-300 text-sm font-semibold transition-all flex items-center justify-between group"
                    >
                      <span>Check Orders</span>
                       <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                       </svg>
                     </button>
                   </div>
                 </div>
               </div>

               {/* TradingView Chart */}
               <TradingViewChart />
            </div>
          )}

           {/* TAB 2: CREATE BOT */}
          {activeTab === 'createbot' && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                 <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center">
                   <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                 </div>
                 <span>Create New Bot</span>
               </h2>

               {/* API Credentials */}
               <ApiCredentialsSetup
                 token={token}
                 onCredentialsUpdate={(isValid) => {
                   setHasValidCredentials(isValid);
                   setRefreshConditions(prev => prev + 1);
                 }}
               />

               {hasValidCredentials ? (
                 <>
                   {/* Two Column Layout - 50/50 Split with Borders */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* LEFT: Conditional Bot */}
                     <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border-2 border-blue-500/30 shadow-xl shadow-blue-500/10 overflow-hidden">
                       <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-b border-blue-500/30">
                         <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                           <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                           </svg>
                         </div>
                         <span className="font-bold text-lg text-white">Conditional Bot</span>
                       </div>
                       <div className="p-6">
                         <BotConditionBuilder
                           token={token}
                           onConditionCreated={() => {
                             setRefreshConditions(prev => prev + 1);
                           }}
                         />
                       </div>
                     </div>

                     {/* RIGHT: Stabilizer Bot */}
                     <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border-2 border-green-500/30 shadow-xl shadow-green-500/10 overflow-hidden">
                       <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500/10 to-emerald-600/10 border-b border-green-500/30">
                         <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                           <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                           </svg>
                         </div>
                         <span className="font-bold text-lg text-white">Stabilizer Bot</span>
                       </div>
                       <div className="p-6">
                         <StabilizerBotBuilder
                           token={token}
                           onBotCreated={() => {
                             setRefreshStabilizerBots(prev => prev + 1);
                           }}
                         />
                       </div>
                     </div>
                   </div>
                 </>
               ) : (
                 <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 shadow-xl border border-gray-700 text-center">
                   <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                     <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                     </svg>
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Setup Required</h3>
                   <p className="text-gray-400 text-sm max-w-md mx-auto">
                     Add valid API credentials above to start creating bots.
                   </p>
                 </div>
               )}
             </div>
           )}

           {/* TAB 3: MY BOTS */}
          {activeTab === 'mybots' && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                   <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                   </svg>
                 </div>
                 <span>Manage Active Bots</span>
               </h2>

               {hasValidCredentials ? (
                 <>
                   {/* Traditional Bots Lists */}
                   <div>
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                       <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                       <span>Traditional Bots</span>
                     </h3>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                       <BotConditionsList token={token} refreshTrigger={refreshConditions} />
                       <StabilizerBotsList token={token} refreshTrigger={refreshStabilizerBots} />
                     </div>
                   </div>

                   {/* Market Maker Bots */}
                   {/* <div>
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                       <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                       <span>Market Maker Bots</span>
                     </h3>
                     <MarketMakerBotsList token={token} refreshTrigger={refreshMarketMakerBots} />
                   </div> */}
                 </>
               ) : (
                 <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 shadow-xl border border-gray-700 text-center">
                   <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                     <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                     </svg>
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Bots Unavailable</h3>
                   <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                     Add valid API credentials in the Create Bot tab to view and manage your bots.
                   </p>
                   <button
                     onClick={() => setActiveTab('createbot')}
                     className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 font-semibold transition-all"
                   >
                     Go to Create Bot
                   </button>
                 </div>
               )}
             </div>
           )}

           {/* TAB 4: ORDERS */}
          {activeTab === 'orders' && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                 <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                   <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                   </svg>
                 </div>
                 <span>Order Book & Open Orders</span>
               </h2>

               {hasValidCredentials ? (
                <>
                  {/* Order Book */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <OrderBookDisplay />
                    <OpenOrders token={token} />
                  </div>
                </>
              ) : (
                 <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 shadow-xl border border-gray-700 text-center">
                   <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                     <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                     </svg>
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Orders Unavailable</h3>
                   <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                     Add valid API credentials in the Create Bot tab to view your open orders.
                   </p>
                   <button
                     onClick={() => setActiveTab('createbot')}
                     className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 font-semibold transition-all"
                   >
                     Go to Create Bot
                   </button>
                 </div>
               )}

               {/* Order Book is always visible */}
               {!hasValidCredentials && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-white mb-4">Order Book (Read-Only)</h3>
                  <OrderBookDisplay />
                </div>
              )}
             </div>
           )}

          {/* TAB 5: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span>Bot Activity Logs & Trade History</span>
              </h2>

              {hasValidCredentials ? (
                <>
                  {/* Bot Logs - Two Columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <StabilizerBotActivityLogs token={token} />
                    <BotActivityLogs token={token} />
                    
                  </div>

                  {/* Trade History - Full Width */}
                  <div>
                    <BotTradeHistory token={token} />
                  </div>
                </>
              ) : (
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 shadow-xl border border-gray-700 text-center">
                  <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Logs Unavailable</h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                    Add valid API credentials in the Create Bot tab to view bot logs and trade history.
                  </p>
                  <button
                    onClick={() => setActiveTab('createbot')}
                    className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 font-semibold transition-all"
                  >
                    Go to Create Bot
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
