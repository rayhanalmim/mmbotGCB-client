'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Balance { asset: string; free: string; locked: string; }
interface TickerData { symbol: string; price: string; priceChangePercent?: string; highPrice?: string; lowPrice?: string; volume?: string; }
interface Bot { _id: string; name: string; symbol: string; orderAmount: number; gapThreshold: number; cooldownSeconds: number; telegramEnabled: boolean; isActive: boolean; isRunning: boolean; executionCount: number; totalUsdtSpent: number; lastMarketPrice?: number; lastBestAskPrice?: number; lastPriceGap?: number; lastCheckedAt?: string; lastExecutedAt?: string; createdAt: string; }
interface BotLog { _id: string; botName: string; action: string; symbol: string; amount: number; marketPrice: number; bestAskPrice: number; priceGap: number; status: string; message: string; createdAt: string; }
interface MonitorLog { timestamp: string; type: 'info' | 'success' | 'error' | 'warning' | 'trade'; message: string; data?: Record<string, unknown>; }

type ActiveTab = 'dashboard' | 'create' | 'manage' | 'logs';
type LogsSubTab = 'monitor' | 'trades';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
    const [balances, setBalances] = useState<Balance[]>([]);
    const [ticker, setTicker] = useState<TickerData | null>(null);
    const [ticker24hr, setTicker24hr] = useState<TickerData | null>(null);
    const [bots, setBots] = useState<Bot[]>([]);
    const [logs, setLogs] = useState<BotLog[]>([]);
    const [monitorLogs, setMonitorLogs] = useState<MonitorLog[]>([]);
    const [logsSubTab, setLogsSubTab] = useState<LogsSubTab>('monitor');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id: string; apiKey: string } | null>(null);
    const [botName, setBotName] = useState('');
    const [orderAmount, setOrderAmount] = useState('1');
    const [gapThreshold, setGapThreshold] = useState('3');
    const [cooldownSeconds, setCooldownSeconds] = useState('10');
    const [telegramEnabled, setTelegramEnabled] = useState(false);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('mexc_token');
        return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('mexc_token');
        const userStr = localStorage.getItem('mexc_user');
        if (!token || !userStr) { router.push('/login'); return; }
        try { const userData = JSON.parse(userStr); setUser(userData); setLoading(false); } catch { router.push('/login'); }
    }, [router]);

    const fetchAccountData = useCallback(async () => {
        try {
            const [accountRes, tickerRes, ticker24hrRes] = await Promise.all([
                fetch(`${API_URL}/api/mexc-user/account`, { headers: getAuthHeaders() }),
                fetch(`${API_URL}/api/mexc/ticker?symbol=GCBUSDT`),
                fetch(`${API_URL}/api/mexc/ticker/24hr?symbol=GCBUSDT`)
            ]);
            const [accountData, tickerData, ticker24hrData] = await Promise.all([accountRes.json(), tickerRes.json(), ticker24hrRes.json()]);
            if (accountData.code === '0' && accountData.data?.balances) setBalances(accountData.data.balances);
            if (tickerData.code === '0') setTicker(tickerData.data);
            if (ticker24hrData.code === '0') setTicker24hr(ticker24hrData.data);
        } catch (err) { console.error('Error fetching account data:', err); }
    }, [getAuthHeaders]);

    const fetchBots = useCallback(async () => {
        try { const res = await fetch(`${API_URL}/api/mexc-user/bot/list`, { headers: getAuthHeaders() }); const data = await res.json(); if (data.code === '0') setBots(data.data || []); } catch (err) { console.error('Error fetching bots:', err); }
    }, [getAuthHeaders]);

    const fetchLogs = useCallback(async () => {
        try { const res = await fetch(`${API_URL}/api/mexc-user/bot/logs?limit=50`, { headers: getAuthHeaders() }); const data = await res.json(); if (data.code === '0') setLogs(data.data || []); } catch (err) { console.error('Error fetching logs:', err); }
    }, [getAuthHeaders]);

    const fetchMonitorLogs = useCallback(async () => {
        try { const res = await fetch(`${API_URL}/api/mexc-user/bot/monitor-logs?limit=50`, { headers: getAuthHeaders() }); const data = await res.json(); if (data.code === '0') setMonitorLogs(data.data || []); } catch (err) { console.error('Error fetching monitor logs:', err); }
    }, [getAuthHeaders]);

    useEffect(() => {
        if (!loading) { fetchAccountData(); fetchBots(); fetchLogs(); fetchMonitorLogs(); const interval = setInterval(() => { fetchAccountData(); fetchBots(); fetchMonitorLogs(); fetchLogs(); }, 5000); return () => clearInterval(interval); }
    }, [loading, fetchAccountData, fetchBots, fetchLogs, fetchMonitorLogs]);

    const handleCreateBot = async (e: React.FormEvent) => {
        e.preventDefault(); setCreating(true); setMessage(null);
        try {
            const res = await fetch(`${API_URL}/api/mexc-user/bot/create`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ name: botName, symbol: 'GCBUSDT', orderAmount: parseFloat(orderAmount), gapThreshold: parseFloat(gapThreshold), cooldownSeconds: parseInt(cooldownSeconds), telegramEnabled }) });
            const data = await res.json();
            if (data.code === '0') { setMessage({ type: 'success', text: 'Bot created!' }); setBotName(''); setOrderAmount('1'); setGapThreshold('3'); setCooldownSeconds('10'); setTelegramEnabled(false); fetchBots(); setActiveTab('manage'); }
            else setMessage({ type: 'error', text: data.msg || 'Failed' });
        } catch { setMessage({ type: 'error', text: 'Network error' }); } finally { setCreating(false); }
    };

    const handleToggleBot = async (botId: string, start: boolean) => { try { await fetch(`${API_URL}/api/mexc-user/bot/${botId}/${start ? 'start' : 'stop'}`, { method: 'PUT', headers: getAuthHeaders() }); fetchBots(); } catch (err) { console.error('Error:', err); } };
    const handleDeleteBot = async (botId: string) => { if (!confirm('Delete this bot?')) return; try { await fetch(`${API_URL}/api/mexc-user/bot/${botId}`, { method: 'DELETE', headers: getAuthHeaders() }); fetchBots(); } catch (err) { console.error('Error:', err); } };
    const handleLogout = () => { localStorage.removeItem('mexc_token'); localStorage.removeItem('mexc_user'); router.push('/login'); };

    const gcbBalance = balances.find(b => b.asset === 'GCB');
    const usdtBalance = balances.find(b => b.asset === 'USDT');
    const priceChange = ticker24hr?.priceChangePercent ? parseFloat(ticker24hr.priceChangePercent) * 100 : 0;
    const runningBots = bots.filter(b => b.isRunning).length;
    const totalExecutions = bots.reduce((sum, b) => sum + b.executionCount, 0);
    const totalSpent = bots.reduce((sum, b) => sum + b.totalUsdtSpent, 0);

    if (loading) return (
        <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#00B897]/20 border-t-[#00B897] rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B0E11] text-white relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>
            <header className="bg-[#12161C]/80 backdrop-blur-xl border-b border-[#00B897]/20 sticky top-0 z-50 relative">
                <div className="max-w-[1600px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Exchange Tabs */}
                        <div className="flex items-center gap-2 mr-4">
                            <button
                                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-[#00B897] to-[#00D4AA] text-white border border-[#00B897]/50"
                            >
                                MEXC
                            </button>
                            <button
                                onClick={() => router.push('/xt')}
                                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white border border-transparent"
                            >
                                XT
                            </button>
                        </div>
                        <span className="text-[#FFB800]">×</span>
                        <div className="w-16 h-8 rounded-lg bg-gradient-to-br from-[#E31B6D] to-[#FF6B9D] p-0.5">
                            <div className="w-full h-full rounded-lg bg-[#12161C] flex items-center justify-center pt-1">
                                <Image src="/gcblogo.png" alt="GCB" width={36} height={24} />
                            </div>
                        </div>
                        <span className="hidden sm:inline font-bold">
                            <span className="text-[#E31B6D]">GCB</span>
                            <span className="text-[#FFB800] mx-1">×</span>
                            <span className="text-[#00B897]">MEXC</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#0F1419]/60 rounded-lg border border-[#00B897]/20 shadow-inner">
                            <svg className="w-4 h-4 text-[#00B897]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <span className="text-sm text-[#00B897] font-mono">{user?.apiKey?.slice(0, 10)}...</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E31B6D]/20 to-[#F6465D]/20 rounded-xl border border-[#E31B6D]/30 hover:border-[#E31B6D]/50 transition-all duration-300"
                        >
                            <svg className="w-4 h-4 text-[#E31B6D] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-sm font-medium text-[#E31B6D] group-hover:text-[#FF6B9D] transition-colors">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="relative z-10 max-w-[1600px] mx-auto px-4 lg:px-8 py-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <div className="group bg-gradient-to-br from-[#141414] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-gray-700/50 hover:border-gray-600/50 hover:shadow-gray-600/20 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#E31B6D]/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-[#E31B6D]/20 flex items-center justify-center">
                                    <Image src="/32068.png" alt="GCB" width={24} height={24} />
                                </div>
                                <span className="text-[#FFB800] text-sm font-medium">GCB</span>
                            </div>
                            <div className="text-3xl font-bold mb-1">{gcbBalance ? parseFloat(gcbBalance.free).toFixed(2) : '0.00'}</div>
                        </div>
                    </div>
                    <div className="group bg-gradient-to-br from-[#141414] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-gray-700/50 hover:border-gray-600/50 hover:shadow-gray-600/20 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00B897]/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-[#00B897]/20 flex items-center justify-center">
                                    <Image src="/825.png" alt="USDT" width={24} height={24} />
                                </div>
                                <span className="text-[#1E88E5] text-sm font-medium">USDT</span>
                            </div>
                            <div className="text-3xl font-bold mb-1">{usdtBalance ? parseFloat(usdtBalance.free).toFixed(2) : '0.00'}</div>
                        </div>
                    </div>
                    <div className="group bg-gradient-to-br from-[#141414] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-gray-700/50 hover:border-gray-600/50 hover:shadow-gray-600/20 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#1E88E5]/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-[#1E88E5]/20 flex items-center justify-center">
                                    <Image src="/32068.png" alt="Price" width={24} height={24} />
                                </div>
                                <span className="text-[#FFB800] text-sm font-medium">GCB/USDT</span>
                            </div>
                            <div className="text-3xl font-bold mb-1">${ticker?.price ? parseFloat(ticker.price).toFixed(6) : '0'}</div>
                            <div className={`text-sm ${priceChange >= 0 ? 'text-[#00B897]' : 'text-[#F6465D]'}`}>{priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%</div>
                        </div>
                    </div>
                    <div className="group bg-gradient-to-br from-[#141414] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-gray-700/50 hover:border-gray-600/50 hover:shadow-gray-600/20 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFB800]/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-[#FFB800]/20 flex items-center justify-center text-[#FFB800]">⚡</div>
                                <span className="text-[#FFB800] text-sm font-medium">Bots</span>
                            </div>
                            <div className="text-3xl font-bold mb-1">{runningBots}<span className="text-[#FFB800] text-lg">/{bots.length}</span></div>
                        </div>
                    </div>
                </div>

                {ticker24hr && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-3">
                            <div className="text-gray-400 text-xs">24h High</div>
                            <div className="text-white font-semibold">${parseFloat(ticker24hr.highPrice || '0').toFixed(6)}</div>
                        </div>
                        <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-3">
                            <div className="text-gray-400 text-xs">24h Low</div>
                            <div className="text-white font-semibold">${parseFloat(ticker24hr.lowPrice || '0').toFixed(6)}</div>
                        </div>
                        <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-3">
                            <div className="text-gray-400 text-xs">24h Volume</div>
                            <div className="text-white font-semibold">{parseFloat(ticker24hr.volume || '0').toFixed(0)} GCB</div>
                        </div>
                        <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-3">
                            <div className="text-gray-400 text-xs">Total Spent</div>
                            <div className="text-white font-semibold">${totalSpent.toFixed(2)}</div>
                        </div>
                    </div>
                )}

                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-2 mb-8">
                    <div className="flex flex-wrap gap-2">
                        {(['dashboard', 'create', 'manage', 'logs'] as const).map(t => (
                            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 min-w-[100px] py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === t ? 'bg-gradient-to-r from-[#00B897] to-[#00D4AA] text-white shadow-lg' : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white'}`}>
                                {t === 'dashboard' ? '📊 Dashboard' : t === 'create' ? '➕ Create' : t === 'manage' ? '⚙️ Manage' : '📜 Logs'}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'dashboard' && (
                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6">
                            <h2 className="font-bold mb-4 text-lg text-white">📊 Statistics</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-[#00B897]">{bots.length}</div>
                                    <div className="text-gray-400 text-sm">Total Bots</div>
                                </div>
                                <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-yellow-500">{runningBots}</div>
                                    <div className="text-gray-400 text-sm">Running</div>
                                </div>
                                <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-pink-500">{totalExecutions}</div>
                                    <div className="text-gray-400 text-sm">Executions</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6">
                            <h2 className="font-bold mb-4 text-lg text-white">⚡ Quick Actions</h2>
                            <div className="space-y-3">
                                <button onClick={() => setActiveTab('create')} className="w-full p-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg flex items-center gap-4 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-[#00B897]/20 flex items-center justify-center text-[#00B897]">+</div>
                                    <div className="text-left"><div className="font-semibold text-white">Create Bot</div><div className="text-sm text-gray-400">New automated bot</div></div>
                                </button>
                                <button onClick={() => setActiveTab('manage')} className="w-full p-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg flex items-center gap-4 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500">⚙</div>
                                    <div className="text-left"><div className="font-semibold text-white">Manage</div><div className="text-sm text-gray-400">Configure bots</div></div>
                                </button>
                                <button onClick={() => setActiveTab('logs')} className="w-full p-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg flex items-center gap-4 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">📋</div>
                                    <div className="text-left"><div className="font-semibold text-white">Logs</div><div className="text-sm text-gray-400">View activity</div></div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'create' && (
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6">
                        <h2 className="text-xl font-bold mb-6 text-white">➕ Create New Bot</h2>
                        <form onSubmit={handleCreateBot} className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-sm font-medium">Bot Name</label>
                                <input type="text" value={botName} onChange={e => setBotName(e.target.value)} className="w-full mt-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00B897]" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-gray-400 text-sm font-medium">Amount (USDT)</label>
                                    <input type="number" step="0.1" min="1" value={orderAmount} onChange={e => setOrderAmount(e.target.value)} className="w-full mt-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00B897]" required />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm font-medium">Gap (%)</label>
                                    <input type="number" step="0.01" min="0.01" value={gapThreshold} onChange={e => setGapThreshold(e.target.value)} className="w-full mt-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00B897]" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm font-medium">Cooldown (sec)</label>
                                <input type="number" step="1" min="10" value={cooldownSeconds} onChange={e => setCooldownSeconds(e.target.value)} className="w-full mt-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00B897]" required />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg">
                                <div><div className="font-medium text-white">Telegram</div><div className="text-sm text-gray-400">Get alerts</div></div>
                                <button type="button" onClick={() => setTelegramEnabled(!telegramEnabled)} className={`w-12 h-6 rounded-full ${telegramEnabled ? 'bg-[#00B897]' : 'bg-gray-600'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${telegramEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                                </button>
                            </div>
                            {message && <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{message.text}</div>}
                            <button type="submit" disabled={creating || !botName} className="w-full py-4 bg-gradient-to-r from-[#00B897] to-[#00D4AA] rounded-lg font-semibold disabled:opacity-50">{creating ? 'Creating...' : 'Create Bot'}</button>
                        </form>
                    </div>
                )}

                {activeTab === 'manage' && (
                    <div className="space-y-4">
                        {bots.length === 0 ? (
                            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-12 text-center">
                                <p className="text-gray-400 mb-4">No bots yet</p>
                                <button onClick={() => setActiveTab('create')} className="px-6 py-2 bg-gradient-to-r from-[#00B897] to-[#00D4AA] rounded-lg">Create Bot</button>
                            </div>
                        ) : bots.map(bot => (
                            <div key={bot._id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${bot.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                        <span className="font-bold text-white">{bot.name}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${bot.isRunning ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}`}>{bot.isRunning ? 'Running' : 'Stopped'}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleToggleBot(bot._id, !bot.isRunning)} className={`px-4 py-1.5 rounded-lg text-sm ${bot.isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}>{bot.isRunning ? 'Stop' : 'Start'}</button>
                                        <button onClick={() => handleDeleteBot(bot._id)} className="px-4 py-1.5 rounded-lg text-sm bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white">Delete</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="bg-[#2a2a2a] rounded-lg p-3"><div className="text-gray-400 text-xs">Amount</div><div className="font-semibold text-white">${bot.orderAmount}</div></div>
                                    <div className="bg-[#2a2a2a] rounded-lg p-3"><div className="text-gray-400 text-xs">Gap</div><div className="font-semibold text-white">{bot.gapThreshold}%</div></div>
                                    <div className="bg-[#2a2a2a] rounded-lg p-3"><div className="text-gray-400 text-xs">Cooldown</div><div className="font-semibold text-white">{bot.cooldownSeconds}s</div></div>
                                    <div className="bg-[#2a2a2a] rounded-lg p-3"><div className="text-gray-400 text-xs">Executions</div><div className="font-semibold text-white">{bot.executionCount}</div></div>
                                </div>
                                {bot.lastPriceGap !== undefined && (
                                    <div className="grid grid-cols-3 gap-3 mt-3">
                                        <div className="bg-[#2a2a2a] rounded-lg p-3"><div className="text-gray-400 text-xs">Market</div><div className="font-semibold text-white">${bot.lastMarketPrice?.toFixed(6) || '-'}</div></div>
                                        <div className="bg-[#2a2a2a] rounded-lg p-3"><div className="text-gray-400 text-xs">Best Ask</div><div className="font-semibold text-white">${bot.lastBestAskPrice?.toFixed(6) || '-'}</div></div>
                                        <div className="bg-[#2a2a2a] rounded-lg p-3"><div className="text-gray-400 text-xs">Gap</div><div className={`font-semibold ${bot.lastPriceGap >= bot.gapThreshold ? 'text-yellow-500' : 'text-green-500'}`}>{bot.lastPriceGap?.toFixed(2)}%</div></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="space-y-6">
                        <div className="max-w-md bg-[#141414] border border-[#2a2a2a] rounded-xl p-2 flex gap-2">
                            <button onClick={() => setLogsSubTab('monitor')} className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${logsSubTab === 'monitor' ? 'bg-[#00B897] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}>Monitor ({monitorLogs.length})</button>
                            <button onClick={() => setLogsSubTab('trades')} className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${logsSubTab === 'trades' ? 'bg-[#00B897] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'}`}>Trades ({logs.length})</button>
                        </div>
                        {logsSubTab === 'monitor' && (
                            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
                                <div className="flex justify-between items-center p-4 border-b border-[#2a2a2a]">
                                    <h3 className="font-bold text-white">Monitor Logs</h3>
                                    <button onClick={fetchMonitorLogs} className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-gray-400 hover:text-white text-sm transition-colors">Refresh</button>
                                </div>
                                <div className="max-h-[500px] overflow-y-auto p-4 space-y-2 font-mono text-sm">
                                    {monitorLogs.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-4xl mb-4">📋</div>
                                            <p className="text-gray-400">No logs yet</p>
                                        </div>
                                    ) : monitorLogs.map((log, i) => (
                                        <div key={i} className={`px-4 py-3 rounded-lg border-l-4 ${log.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500' : log.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500' : log.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500' : 'bg-[#2a2a2a] text-gray-300 border-gray-500'}`}>
                                            <div className="flex items-start gap-3">
                                                <span className="text-gray-500 font-mono text-xs mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                <span className="flex-1">{log.message}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {logsSubTab === 'trades' && (
                            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
                                <div className="flex justify-between items-center p-4 border-b border-[#2a2a2a]">
                                    <h3 className="font-bold text-white">Trade Logs</h3>
                                    <button onClick={fetchLogs} className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-gray-400 hover:text-white text-sm transition-colors">Refresh</button>
                                </div>
                                {logs.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="text-4xl mb-4">💰</div>
                                        <p className="text-gray-400">No trades yet</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-[#2a2a2a] text-gray-400 text-sm">
                                                    <th className="px-4 py-3 text-left font-medium">Time</th>
                                                    <th className="px-4 py-3 text-left font-medium">Bot</th>
                                                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                                                    <th className="px-4 py-3 text-right font-medium">Gap</th>
                                                    <th className="px-4 py-3 text-center font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {logs.map((log) => (
                                                    <tr key={log._id} className="border-t border-[#2a2a2a] hover:bg-[#2a2a2a]/50">
                                                        <td className="px-4 py-3 text-gray-400 font-mono text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                                                        <td className="px-4 py-3 font-medium text-white">{log.botName}</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-white">${log.amount?.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-right text-yellow-500 font-semibold">{log.priceGap?.toFixed(2)}%</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${log.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                {log.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
