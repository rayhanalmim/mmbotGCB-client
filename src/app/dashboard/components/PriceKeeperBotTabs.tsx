'use client';

import { useState } from 'react';
import PriceKeeperBotBuilder from './PriceKeeperBotBuilder';
import PriceKeeperBotsList from './PriceKeeperBotsList';
import PriceKeeperBotActivityLogs from './PriceKeeperBotActivityLogs';

interface PriceKeeperBotTabsProps {
  token: string | null;
  onBotCreated: () => void;
  refreshTrigger: number;
}

export default function PriceKeeperBotTabs({ token, onBotCreated, refreshTrigger }: PriceKeeperBotTabsProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'mybots' | 'logs'>('create');

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl shadow-2xl border border-[#27272a] overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-[#27272a]">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 px-6 py-4 font-semibold text-sm transition-all relative ${
            activeTab === 'create'
              ? 'text-white bg-[#27272a]'
              : 'text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a]'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Bot
          </div>
          {activeTab === 'create' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('mybots')}
          className={`flex-1 px-6 py-4 font-semibold text-sm transition-all relative ${
            activeTab === 'mybots'
              ? 'text-white bg-[#27272a]'
              : 'text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a]'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            My Bots
          </div>
          {activeTab === 'mybots' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 px-6 py-4 font-semibold text-sm transition-all relative ${
            activeTab === 'logs'
              ? 'text-white bg-[#27272a]'
              : 'text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a]'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Activity Logs
          </div>
          {activeTab === 'logs' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'create' && (
          <div>
            <div className="mb-4">
              <h3 className="text-white font-bold text-lg mb-1">Price Keeper Bot</h3>
              <p className="text-gray-400 text-sm">
                Keep the visible market price synced with the best ask price. When someone sells and the last trade price drops below the best ask, bot places a small market buy to refresh the displayed price.
              </p>
            </div>
            <PriceKeeperBotBuilder token={token} onBotCreated={onBotCreated} />
          </div>
        )}

        {activeTab === 'mybots' && (
          <PriceKeeperBotsList token={token} refreshTrigger={refreshTrigger} />
        )}

        {activeTab === 'logs' && (
          <PriceKeeperBotActivityLogs token={token} />
        )}
      </div>
    </div>
  );
}
