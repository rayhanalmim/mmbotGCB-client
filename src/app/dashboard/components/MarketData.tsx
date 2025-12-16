'use client';

import { useEffect, useState } from 'react';
import apiClient, { type MarketRate } from '@/lib/api';

interface MarketDataProps {
  token: string;
}

// Define featured coins outside component to prevent re-creation
const FEATURED_COINS = ['GCB', 'USDT'];

export default function MarketData({ token }: MarketDataProps) {
  const [rates, setRates] = useState<MarketRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingPrices, setUpdatingPrices] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isFirstLoad = true;
    
    const fetchRates = async () => {
      try {
        // Only show loading skeleton on initial load
        if (isFirstLoad) {
          setLoading(true);
        } else {
          // Trigger blur effect for price updates
          setUpdatingPrices(() => {
            const updated: Record<string, boolean> = {};
            FEATURED_COINS.forEach(coin => { updated[coin] = true; });
            return updated;
          });
        }
        
        const response = await apiClient.market.getRates('USD');
        
        if (response.code === '0' && response.data) {
          setRates(response.data.rate.USD);
          setError(null); // Clear any previous errors
          
          // Remove blur effect after a short delay
          if (!isFirstLoad) {
            setTimeout(() => {
              setUpdatingPrices({});
            }, 300);
          }
        } else {
          // Only show error on first load, keep old data on refresh failures
          if (isFirstLoad) {
            setError('Failed to fetch market rates');
          } else {
            console.warn('⚠️ Failed to refresh market rates, keeping previous data');
          }
        }
      } catch (err) {
        // Only show error on first load, keep old data on refresh failures
        if (isFirstLoad) {
          setError('Error fetching market data');
        } else {
          console.warn('⚠️ Error refreshing market data, keeping previous data:', err);
        }
      } finally {
        if (isFirstLoad) {
          setLoading(false);
          isFirstLoad = false;
        }
      }
    };

    fetchRates();
    
    // Refresh every 8 seconds
    const interval = setInterval(fetchRates, 8000);
    
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-5 shadow-2xl border border-[#27272a]">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 bg-[#27272a] rounded w-32 animate-pulse"></div>
          <div className="w-16 h-6 bg-[#27272a] rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#27272a]/30 rounded-xl p-3 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#3f3f46] rounded-lg"></div>
                  <div className="h-4 bg-[#3f3f46] rounded w-16"></div>
                </div>
                <div className="h-4 bg-[#3f3f46] rounded w-20"></div>
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
        <h2 className="text-xl font-semibold text-white mb-4">Market Prices</h2>
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return price.toFixed(8);
    } else if (price < 1) {
      return price.toFixed(6);
    } else if (price < 100) {
      return price.toFixed(4);
    } else {
      return price.toFixed(2);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-5 shadow-2xl border border-[#27272a] hover:border-[#6366F1]/30 transition-all">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-white">Live Market Prices</h2>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
          <span className="text-green-400 text-xs font-semibold">Live</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {rates && FEATURED_COINS.slice(0, 6).map((coin) => {
          const price = rates[coin];
          if (!price) return null;
          
          const priceNum = typeof price === 'string' ? parseFloat(price) : price;
          
          return (
            <div
              key={coin}
              className="bg-[#27272a]/30 hover:bg-[#27272a]/60 rounded-xl p-3 transition cursor-pointer border border-[#3f3f46]/30 hover:border-[#6366F1]/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#7C3AED] rounded-lg flex items-center justify-center shadow-lg shadow-[#6366F1]/30">
                    <span className="text-white font-bold text-xs">{coin.substring(0, 2)}</span>
                  </div>
                  <div>
                    <span className="text-white font-bold text-sm">{coin}</span>
                    {coin === 'GCB' && (
                      <span className="ml-2 text-xs bg-[#FF007A]/20 text-[#FF007A] px-2 py-0.5 rounded-full font-semibold border border-[#FF007A]/30">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-white font-bold text-sm transition-all duration-300 ${
                    updatingPrices[coin] ? 'blur-sm opacity-50' : 'blur-0 opacity-100'
                  }`}>
                    ${formatPrice(priceNum)}
                  </div>
                  <div className="text-gray-400 text-xs">
                    +0.0%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-[#27272a] text-gray-500 text-xs text-center flex items-center justify-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Updates every 3 seconds
      </div>
    </div>
  );
}
