/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { API } from '@/lib/api';
import type { BotStatus } from '@/lib/api';

interface BotControlProps {
  token: string;
  compact?: boolean;
}

export default function BotControl({ token, compact = false }: BotControlProps) {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await API.bot.getStatus(token);
      if (response.code === '0' && response.data) {
        setStatus(response.data);
      }
    } catch (err) {
      console.error('Error fetching bot status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const handleStart = async () => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      const response = await API.bot.start(token);
      if (response.code === '0') {
        setSuccess('Bot started successfully! 🚀');
        await fetchStatus();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.msg || 'Failed to start bot');
      }
    } catch (err: any) {
      setError(err.message || 'Error starting bot');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      const response = await API.bot.stop(token);
      if (response.code === '0') {
        setSuccess('Bot stopped successfully');
        await fetchStatus();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.msg || 'Failed to stop bot');
      }
    } catch (err: any) {
      setError(err.message || 'Error stopping bot');
    } finally {
      setActionLoading(false);
    }
  };

  // Compact version for top navigation
  if (compact) {
    if (loading) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
          <div className="animate-spin rounded-full h-3 w-3 border border-[#6366F1] border-t-transparent"></div>
          <span className="text-xs text-gray-400">Loading...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {/* Status Indicator */}
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${
          status?.isRunning
            ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : 'bg-gray-700/50 text-gray-400 border-gray-600'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            status?.isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
          }`}></div>
          <span className="text-[10px] font-bold uppercase">{status?.isRunning ? 'Bot ON' : 'Bot OFF'}</span>
        </div>

        {/* Toggle Button */}
        <button
          onClick={status?.isRunning ? handleStop : handleStart}
          disabled={actionLoading}
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all disabled:opacity-50 ${
            status?.isRunning
              ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400'
              : 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400'
          }`}
          title={status?.isRunning ? 'Stop Bot' : 'Start Bot'}
        >
          {actionLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : status?.isRunning ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" strokeWidth={2} />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  // Full version for main content
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a] h-full">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Bot Control Section */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a] h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
              status?.isRunning 
                ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/50' 
                : 'bg-gradient-to-br from-gray-500 to-gray-600 shadow-gray-500/50'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Bot Control</h2>
              <p className="text-xs text-gray-400">
                {status?.isRunning ? 'Monitoring market 24/7' : 'Ready to start'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
              status?.isRunning
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-gray-700/50 text-gray-400 border-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full transition-all ${
                status?.isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-semibold">{status?.isRunning ? 'ACTIVE' : 'STOPPED'}</span>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleStart}
            disabled={actionLoading || status?.isRunning}
            className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              status?.isRunning
                ? 'bg-gray-700/30 text-gray-500 border border-gray-700 cursor-not-allowed'
                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 hover:shadow-lg hover:shadow-green-500/20'
            }`}
          >
            {actionLoading && !status?.isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                Starting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Bot
              </>
            )}
          </button>

          <button
            onClick={handleStop}
            disabled={actionLoading || !status?.isRunning}
            className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              !status?.isRunning
                ? 'bg-gray-700/30 text-gray-500 border border-gray-700 cursor-not-allowed'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:shadow-lg hover:shadow-red-500/20'
            }`}
          >
            {actionLoading && status?.isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                Stopping...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Stop Bot
              </>
            )}
          </button>
        </div>

        {/* Messages */}
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

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-300">
                <strong>How it works:</strong> The bot continuously monitors GCB/USDT price from GCBEX Open API and evaluates your active conditions. When a condition is met, it automatically executes the trade using your stored API credentials.
              </p>
              {status?.isRunning && (
                <p className="text-xs text-blue-400 mt-2">
                  ⚡ Monitoring {status.activeConditionsCount || 0} active condition(s) • Updates every 10 seconds
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
