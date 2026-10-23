'use client';

import { useState } from 'react';

interface XtCredentialsSetupProps {
  onSuccess: () => void;
  apiUrl: string;
  getAuthHeaders: () => { 'Content-Type': string; 'Authorization': string };
}

export default function XtCredentialsSetup({ onSuccess, apiUrl, getAuthHeaders }: XtCredentialsSetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/xt-user/add-credentials`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ apiKey, apiSecret }),
      });

      const data = await response.json();

      if (data.code === '0') {
        onSuccess();
      } else {
        setError(data.msg || 'Failed to add XT credentials');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-[#12161C]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FFB800] to-[#FF9500] p-0.5 shadow-xl">
            <div className="w-full h-full rounded-2xl bg-[#0B0E11] flex items-center justify-center">
              <span className="text-3xl font-bold text-[#FFB800]">XT</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect XT Exchange</h2>
          <p className="text-gray-400">Add your XT API credentials to enable trading</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              XT API Key (AppKey)
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
                placeholder="Enter your XT API Key"
                className="w-full bg-[#1E2329] border border-[#2B3139] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800]/50 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              XT API Secret (SecretKey)
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
                placeholder="Enter your XT API Secret"
                className="w-full bg-[#1E2329] border border-[#2B3139] rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800]/50 transition-all"
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
            className="w-full bg-gradient-to-r from-[#FFB800] to-[#FF9500] text-black font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-[#FFB800]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                Connecting...
              </span>
            ) : (
              'Connect XT Exchange'
            )}
          </button>
        </form>

        {/* <div className="mt-6">
          <div className="text-gray-400 text-sm font-light mb-3">Where to find XT API credentials?</div>
          <div className="p-4 bg-[#1E2329] rounded-lg text-gray-400">
            <p className="mb-1 text-sm font-light">1. Go to XT.com → API Management</p>
            <p className="mb-1 text-sm font-light">2. Create a new API key</p>
            <p className="mb-1 text-sm font-light">3. Enable &quot;Spot Trading&quot; permissions</p>
            <p className="text-sm font-light">4. Copy the AppKey and SecretKey</p>
          </div>
        </div> */}
      </div>
    </div>
  );
}
