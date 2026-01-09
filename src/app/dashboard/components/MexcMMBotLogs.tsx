'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface BotLog {
  _id: string;
  botId: string;
  botName: string;
  action: string;
  symbol: string;
  amount: number;
  marketPrice: number;
  bestAskPrice: number;
  priceGap: number;
  orderId?: string;
  status: string;
  message: string;
  createdAt: string;
}

interface MonitorLog {
  timestamp: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
}

const LOGS_PER_PAGE = 10;
const MAX_MONITOR_LOGS = 50;

export default function MexcMMBotLogs() {
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);
  const [monitorLogs, setMonitorLogs] = useState<MonitorLog[]>([]);
  const [activeLogTab, setActiveLogTab] = useState<'trades' | 'monitor'>('trades');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const monitorLogsRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';

  const fetchLogs = useCallback(async () => {
    try {
      const [botLogsRes, monitorLogsRes] = await Promise.all([
        fetch(`${API_URL}/api/mexc/bot/logs?limit=100`),
        fetch(`${API_URL}/api/mexc/bot/monitor/logs?limit=${MAX_MONITOR_LOGS}`)
      ]);

      const botLogsData = await botLogsRes.json();
      const monitorLogsData = await monitorLogsRes.json();

      if (botLogsData.code === '0') {
        setBotLogs(botLogsData.data || []);
      }
      if (monitorLogsData.code === '0') {
        const newLogs = (monitorLogsData.data || []).slice(0, MAX_MONITOR_LOGS);
        setMonitorLogs(newLogs);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Auto-scroll to top when new logs arrive
  useEffect(() => {
    if (monitorLogsRef.current && activeLogTab === 'monitor') {
      monitorLogsRef.current.scrollTop = 0;
    }
  }, [monitorLogs, activeLogTab]);

  // Pagination calculations for trade logs
  const totalPages = Math.ceil(botLogs.length / LOGS_PER_PAGE);
  const paginatedLogs = botLogs.slice(
    (currentPage - 1) * LOGS_PER_PAGE,
    currentPage * LOGS_PER_PAGE
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'trade': return '💱';
      default: return 'ℹ️';
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'trade': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B897]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-3">
              <span className="text-2xl">📜</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">MEXC MM Bot Logs</h2>
              <p className="text-white/80 text-sm">Trade history and monitor activity</p>
            </div>
          </div>
          <button
            onClick={fetchLogs}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Log Type Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveLogTab('trades')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeLogTab === 'trades'
              ? 'bg-[#00B897] text-white'
              : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
          }`}
        >
          Trade Logs ({botLogs.length})
        </button>
        <button
          onClick={() => setActiveLogTab('monitor')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeLogTab === 'monitor'
              ? 'bg-[#00B897] text-white'
              : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
          }`}
        >
          Monitor Logs ({monitorLogs.length})
        </button>
      </div>

      {/* Trade Logs */}
      {activeLogTab === 'trades' && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          {botLogs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📭</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">No Trade Logs Yet</h3>
              <p className="text-gray-400 text-sm">Trade logs will appear here when your bots execute orders</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#2a2a2a] text-gray-400 text-sm">
                      <th className="text-left px-4 py-3">Time</th>
                      <th className="text-left px-4 py-3">Bot</th>
                      <th className="text-left px-4 py-3">Action</th>
                      <th className="text-right px-4 py-3">Amount</th>
                      <th className="text-right px-4 py-3">Market</th>
                      <th className="text-right px-4 py-3">Best Ask</th>
                      <th className="text-right px-4 py-3">Gap</th>
                      <th className="text-center px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((log) => (
                      <tr key={log._id} className="border-t border-[#2a2a2a] hover:bg-[#2a2a2a]/50">
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {formatTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          {log.botName}
                        </td>
                        <td className={`px-4 py-3 font-medium ${log.action === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                          {log.action}
                        </td>
                        <td className="px-4 py-3 text-white text-right">
                          ${log.amount?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-white text-right">
                          ${log.marketPrice?.toFixed(6)}
                        </td>
                        <td className="px-4 py-3 text-white text-right">
                          ${log.bestAskPrice?.toFixed(6)}
                        </td>
                        <td className="px-4 py-3 text-yellow-400 text-right">
                          {log.priceGap?.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            log.status === 'SUCCESS' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#2a2a2a]">
                  <div className="text-gray-400 text-sm">
                    Showing {(currentPage - 1) * LOGS_PER_PAGE + 1} - {Math.min(currentPage * LOGS_PER_PAGE, botLogs.length)} of {botLogs.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded bg-[#2a2a2a] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ««
                    </button>
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded bg-[#2a2a2a] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      «
                    </button>
                    <span className="px-3 py-1 text-white">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded bg-[#2a2a2a] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      »
                    </button>
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded bg-[#2a2a2a] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      »»
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Monitor Logs */}
      {activeLogTab === 'monitor' && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-[#2a2a2a] bg-[#2a2a2a]/50">
            <span className="text-gray-400 text-sm">Showing last {MAX_MONITOR_LOGS} logs (auto-updates every 5s)</span>
          </div>
          {monitorLogs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📭</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">No Monitor Logs</h3>
              <p className="text-gray-400 text-sm">Monitor logs will appear when bots are running</p>
            </div>
          ) : (
            <div ref={monitorLogsRef} className="max-h-[500px] overflow-y-auto">
              {monitorLogs.map((log, index) => (
                <div
                  key={`${log.timestamp}-${index}`}
                  className="border-b border-[#2a2a2a] px-4 py-3 hover:bg-[#2a2a2a]/50"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getLogTypeIcon(log.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium text-sm ${getLogTypeColor(log.type)}`}>
                          {log.type.toUpperCase()}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {formatTime(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-white text-sm">{log.message}</p>
                      {log.data && (
                        <pre className="mt-2 text-xs text-gray-500 bg-[#2a2a2a] rounded p-2 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
