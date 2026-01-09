'use client';

import { useState, useEffect, useCallback } from 'react';
import MexcTrading from './MexcTrading';
import MexcMMBotBuilder from './MexcMMBotBuilder';
import MexcMMBotsList from './MexcMMBotsList';
import MexcMMBotLogs from './MexcMMBotLogs';

interface Balance {
    asset: string;
    free: string;
    locked: string;
}

interface TickerData {
    symbol: string;
    price: string;
    priceChange?: string;
    priceChangePercent?: string;
    highPrice?: string;
    lowPrice?: string;
    volume?: string;
}

type SubTab = 'spot' | 'create' | 'manage' | 'logs';

export default function MexcDashboard() {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('create');
    const [refreshBots, setRefreshBots] = useState(0);
    const [balances, setBalances] = useState<Balance[]>([]);
    const [ticker, setTicker] = useState<TickerData | null>(null);
    const [ticker24hr, setTicker24hr] = useState<TickerData | null>(null);
    const [loading, setLoading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.gcbtoken.io';

    const fetchBalances = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/mexc/account`);
            const data = await response.json();
            if (data.code === '0' && data.data?.balances) {
                setBalances(data.data.balances);
            }
        } catch (err) {
            console.error('Error fetching MEXC balances:', err);
        }
    }, [API_URL]);

    const fetchTicker = useCallback(async () => {
        try {
            const [tickerRes, ticker24hrRes] = await Promise.all([
                fetch(`${API_URL}/api/mexc/ticker?symbol=GCBUSDT`),
                fetch(`${API_URL}/api/mexc/ticker/24hr?symbol=GCBUSDT`)
            ]);

            const tickerData = await tickerRes.json();
            const ticker24hrData = await ticker24hrRes.json();

            if (tickerData.code === '0') {
                setTicker(tickerData.data);
            }
            if (ticker24hrData.code === '0') {
                setTicker24hr(ticker24hrData.data);
            }
        } catch (err) {
            console.error('Error fetching MEXC ticker:', err);
        }
    }, [API_URL]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        await Promise.all([fetchBalances(), fetchTicker()]);
        setLoading(false);
    }, [fetchBalances, fetchTicker]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAll();
        const interval = setInterval(() => {
            fetchTicker();
            fetchBalances();
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchAll, fetchTicker, fetchBalances]);

    const handleBotCreated = () => {
        setRefreshBots(prev => prev + 1);
        setActiveSubTab('manage');
    };

    const gcbBalance = balances.find(b => b.asset === 'GCB');
    const usdtBalance = balances.find(b => b.asset === 'USDT');
    const priceChange = ticker24hr?.priceChangePercent ? parseFloat(ticker24hr.priceChangePercent) * 100 : 0;

    const subTabs = [
        // { id: 'spot' as SubTab, label: 'Spot Trading', icon: '💱', color: 'from-[#00B897] to-[#00D4AA]' },
        { id: 'create' as SubTab, label: 'Create Bot', icon: '➕', color: 'from-purple-500 to-purple-600' },
        { id: 'manage' as SubTab, label: 'Manage Bots', icon: '📋', color: 'from-indigo-500 to-purple-600' },
        { id: 'logs' as SubTab, label: 'Bot Logs', icon: '📜', color: 'from-pink-500 to-rose-600' },
    ];



    return (
        <div className="space-y-6">
            {/* MEXC Header */}
            {/* Balance and Price Cards - Visible on all tabs */}
            <div className="space-y-4">
                {/* Refresh Button */}
                <div className="flex justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00B897] to-[#00D4AA] rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">M</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            MEXC Exchanger
                        </h1>
                    </div>
                    <button
                        onClick={fetchAll}
                        className="bg-[#00B897] hover:bg-[#00D4AA] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* GCB Balance */}
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                GC
                            </div>
                            <span className="text-gray-400 text-sm">GCB Balance</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {gcbBalance ? parseFloat(gcbBalance.free).toFixed(2) : '0.00'}
                        </div>
                        <div className="text-xs text-gray-500">
                            Locked: {gcbBalance ? parseFloat(gcbBalance.locked).toFixed(2) : '0.00'}
                        </div>
                    </div>

                    {/* USDT Balance */}
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                US
                            </div>
                            <span className="text-gray-400 text-sm">USDT Balance</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {usdtBalance ? parseFloat(usdtBalance.free).toFixed(2) : '0.00'}
                        </div>
                        <div className="text-xs text-gray-500">
                            Locked: {usdtBalance ? parseFloat(usdtBalance.locked).toFixed(2) : '0.00'}
                        </div>
                    </div>

                    {/* Current Price */}
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                💱
                            </div>
                            <span className="text-gray-400 text-sm">GCB/USDT Price</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            ${ticker?.price ? parseFloat(ticker.price).toFixed(6) : '0.000000'}
                        </div>
                        <div className={`text-xs ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}% (24h)
                        </div>
                    </div>
                </div>

                {/* 24hr Stats */}
                {ticker24hr && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
                            <div className="text-gray-400 text-xs">24h High</div>
                            <div className="text-white font-semibold">${parseFloat(ticker24hr.highPrice || '0').toFixed(6)}</div>
                        </div>
                        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
                            <div className="text-gray-400 text-xs">24h Low</div>
                            <div className="text-white font-semibold">${parseFloat(ticker24hr.lowPrice || '0').toFixed(6)}</div>
                        </div>
                        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
                            <div className="text-gray-400 text-xs">24h Volume</div>
                            <div className="text-white font-semibold">{parseFloat(ticker24hr.volume || '0').toFixed(0)} GCB</div>
                        </div>
                        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
                            <div className="text-gray-400 text-xs">Price Change</div>
                            <div className={`font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sub-Tab Navigation */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-2">
                <div className="flex flex-wrap gap-2">
                    {subTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex-1 min-w-[140px] px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${activeSubTab === tab.id
                                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                                : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>



            {/* Sub-Tab Content */}
            <div>
                {activeSubTab === 'spot' && <MexcTrading />}
                {activeSubTab === 'create' && <MexcMMBotBuilder onBotCreated={handleBotCreated} />}
                {activeSubTab === 'manage' && <MexcMMBotsList refreshTrigger={refreshBots} />}
                {activeSubTab === 'logs' && <MexcMMBotLogs />}
            </div>
        </div>
    );
}
