'use client';

import { useState } from 'react';
import BotConditionBuilder from './BotConditionBuilder';
import StabilizerBotBuilder from './StabilizerBotBuilder';

interface BotBuilderTabsProps {
  token: string | null;
  onConditionCreated: () => void;
  onStabilizerBotCreated: () => void;
}

export default function BotBuilderTabs({ token, onConditionCreated, onStabilizerBotCreated }: BotBuilderTabsProps) {
  const [activeTab, setActiveTab] = useState<'condition' | 'stabilizer'>('condition');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl shadow-2xl border border-[#27272a] overflow-hidden">
        <div className="flex border-b border-[#27272a]">
          <button
            onClick={() => setActiveTab('condition')}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-all relative ${
              activeTab === 'condition'
                ? 'text-white bg-[#27272a]'
                : 'text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Condition Bot
            </div>
            {activeTab === 'condition' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FF007A] to-[#E91E63]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('stabilizer')}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-all relative ${
              activeTab === 'stabilizer'
                ? 'text-white bg-[#27272a]'
                : 'text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Stabilizer Bot
            </div>
            {activeTab === 'stabilizer' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'condition' ? (
            <div>
              <BotConditionBuilder token={token} onConditionCreated={onConditionCreated} />
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="text-white font-bold text-lg mb-1">Price Stabilizer Bot</h3>
                <p className="text-gray-400 text-sm">
                  Automatically maintain your target price. Bot monitors market every 5 seconds and executes split buy orders to restore price when it drops below target.
                </p>
              </div>
              <StabilizerBotBuilder token={token} onBotCreated={onStabilizerBotCreated} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
