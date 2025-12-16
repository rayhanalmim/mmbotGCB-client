'use client';

import { useEffect, useState } from 'react';
import apiClient, { type StabilizerBotLog } from '@/lib/api';

interface StabilizerBotActivityLogsProps {
  token: string | null;
  selectedBotId?: string | null;
}

export default function StabilizerBotActivityLogs({ token, selectedBotId }: StabilizerBotActivityLogsProps) {
  const [logs, setLogs] = useState<StabilizerBotLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!token) return;

    const fetchLogs = async () => {
      try {
        const response = selectedBotId 
          ? await apiClient.stabilizerBot.getLogs(selectedBotId, 100, token)
          : await apiClient.stabilizerBot.getAllLogs(100, token);
        
        if (response.code === '0' && response.data) {
          setLogs(response.data);
        }
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    
    // Poll every 2 seconds for real-time updates
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [token, selectedBotId]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'error':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'trade':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'calculate':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'monitor':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getLevelEmoji = (level: string) => {
    switch (level) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'trade': return '💱';
      case 'calculate': return '🧮';
      case 'monitor': return '👁️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = selectedBotId 
        ? await apiClient.stabilizerBot.getLogs(selectedBotId, 100, token!)
        : await apiClient.stabilizerBot.getAllLogs(100, token!);
      
      if (response.code === '0' && response.data) {
        setLogs(response.data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Stabilize Bot Logs</h2>
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
              ? 'bg-purple-500 text-white'
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

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">No activity logs yet</p>
          <p className="text-gray-600 text-xs mt-1">Start a stabilizer bot to see real-time logs</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredLogs.map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className={`p-3 rounded-lg border ${getLevelColor(log.level)} transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{getLevelEmoji(log.level)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase">{log.level}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm break-words">{log.message}</p>
                  {log.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-black/30 rounded p-2 overflow-x-auto">
                        {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #27272a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #06B6D4;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0891B2;
        }
      `}</style>
    </div>
  );
}
