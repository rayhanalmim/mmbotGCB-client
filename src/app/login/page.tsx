'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('mexc_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/mexc-user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, apiSecret }),
      });

      const data = await response.json();

      if (data.code === '0') {
        localStorage.setItem('mexc_token', data.data.token);
        localStorage.setItem('mexc_user', JSON.stringify({ id: data.data.userId, apiKey }));
        router.push('/dashboard');
      } else {
        setError(data.msg || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#00B897]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E31B6D]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1E88E5]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="text-center lg:text-left space-y-6">
          <div className="flex items-center justify-center lg:justify-start gap-4">
            <div className="w-36 h-16 rounded-2xl bg-gradient-to-br from-[#00B897] to-[#00D4AA] p-0.5 shadow-xl">
              <div className="w-full h-full rounded-2xl bg-[#0B0E11] flex items-center justify-center">
                <Image src="/download.svg" alt="MEXC" width={70} height={32} className="" />
              </div>
            </div>
            <span className="text-4xl font-bold text-gray-400">×</span>
            <div className="w-32 h-16 rounded-2xl bg-gradient-to-br from-[#E31B6D] to-[#FF6B9D] p-0.5 shadow-xl">
              <div className="w-full h-full rounded-2xl bg-[#0B0E11] flex items-center justify-center pt-1.5">
                <Image src="/gcblogo.png" alt="GCB" width={55} height={32} />
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-[#E31B6D] to-[#FF6B9D] bg-clip-text text-transparent">GCB</span>
            <span className="text-gray-400 mx-3">×</span>
            <span className="bg-gradient-to-r from-[#00B897] to-[#00D4AA] bg-clip-text text-transparent">MEXC</span>
          </h1>
          <p className="text-2xl text-gray-400 mb-8">Trading Bot</p>
            
          {/* <p className="text-gray-500 text-lg leading-relaxed mb-12">
            Automated market making and gap filling bot for GCB/USDT trading pair on MEXC Exchange.
          </p> */}

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-[#00B897]/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#00B897]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Auto Trading</h3>
              <p className="text-gray-500 text-sm">24/7 automated execution</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-[#E31B6D]/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#E31B6D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Secure</h3>
              <p className="text-gray-500 text-sm">API key encryption</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-[#1E88E5]/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#1E88E5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Analytics</h3>
              <p className="text-gray-500 text-sm">Real-time monitoring</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-[#FFB800]/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#FFB800]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Alerts</h3>
              <p className="text-gray-500 text-sm">Telegram notifications</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#12161C]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400">Connect with your MEXC API credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                API Key
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                </div>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your MEXC API Key"
                  className="w-full bg-[#1E2329] border border-[#2B3139] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00B897] focus:ring-1 focus:ring-[#00B897]/50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                API Secret
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Enter your MEXC API Secret"
                  className="w-full bg-[#1E2329] border border-[#2B3139] rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00B897] focus:ring-1 focus:ring-[#00B897]/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showSecret ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00B897] to-[#00D4AA] text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-[#00B897]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Connecting...
                </span>
              ) : (
                'Connect to MEXC'
              )}
            </button>
          </form>

          {/* API Help */}
          <div className="mt-6">
            <div className="text-gray-400 text-sm font-light mb-3">Where to find API credentials?</div>
            <div className="p-4 bg-[#1E2329] rounded-lg text-gray-400">
              <p className="mb-1 text-sm font-light">1. Go to MEXC Exchange → API Management</p>
              <p className="mb-1 text-sm font-light">2. Create a new API key</p>
              <p className="mb-1 text-sm font-light">3. Enable &quot;Spot Trading&quot; permissions</p>
              <p className="text-sm font-light">4. Whitelist your IP if required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
