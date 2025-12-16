'use client';

import { useState, useEffect } from 'react';
import { API } from '@/lib/api';
import type { BotLog } from '@/lib/api';

interface BotActivityLogsProps {
  token: string;
}

export default function BotActivityLogs({ token }: BotActivityLogsProps) {
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await API.bot.getLogs(100, token);
      if (response.code === '0' && response.data) {
        setLogs(response.data);
      }
    } catch (err) {
      console.error('Error fetching bot logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [token]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'trade':
        return '💱';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'error':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'trade':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'info':
      default:
        return 'text-gray-400 bg-gray-700/50 border-gray-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  if (loading && logs.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
        <h2 className="text-lg font-bold text-white mb-4">Bot Activity Logs</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF007A] to-[#E91E63] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF007A]/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Conditional Bot Logs</h2>
            <p className="text-xs text-gray-400">Real-time monitoring events</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 rounded-lg text-sm font-medium transition border border-[#3f3f46]"
          title="Refresh logs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'all'
              ? 'bg-[#6366F1] text-white'
              : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46]'
          }`}
        >
          All ({logs.length})
        </button>
        <button
          onClick={() => setFilter('trade')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'trade'
              ? 'bg-blue-500 text-white'
              : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46]'
          }`}
        >
          💱 Trades ({logs.filter(l => l.level === 'trade').length})
        </button>
        <button
          onClick={() => setFilter('success')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46]'
          }`}
        >
          ✅ Success ({logs.filter(l => l.level === 'success').length})
        </button>
        <button
          onClick={() => setFilter('error')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46]'
          }`}
        >
          ❌ Errors ({logs.filter(l => l.level === 'error').length})
        </button>
        <button
          onClick={() => setFilter('warning')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'warning'
              ? 'bg-amber-500 text-white'
              : 'bg-[#27272a] text-gray-400 hover:bg-[#3f3f46]'
          }`}
        >
          ⚠️ Warnings ({logs.filter(l => l.level === 'warning').length})
        </button>
      </div>

      {/* Logs List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400 text-sm">No logs available</p>
            <p className="text-gray-500 text-xs mt-1">Start the bot to see activity</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={index}
              className={`border rounded-lg p-3 ${getLevelColor(log.level)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{getLevelIcon(log.level)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      log.level === 'trade' ? 'bg-blue-500/30 text-blue-300' :
                      log.level === 'success' ? 'bg-green-500/30 text-green-300' :
                      log.level === 'error' ? 'bg-red-500/30 text-red-300' :
                      log.level === 'warning' ? 'bg-amber-500/30 text-amber-300' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-medium break-words">{log.message}</p>
                  {log.data && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer hover:text-white transition">
                        View details
                      </summary>
                      <pre className="mt-2 text-xs bg-black/30 rounded p-2 overflow-x-auto">
                        {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #27272a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6366F1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #7C3AED;
        }
      `}</style>
    </div>
  );
}
