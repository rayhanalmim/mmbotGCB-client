'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { type BotCondition } from '@/lib/api';

interface BotConditionsListProps {
  token: string | null;
  refreshTrigger: number;
}

export default function BotConditionsList({ token, refreshTrigger }: BotConditionsListProps) {
  const [conditions, setConditions] = useState<BotCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchConditions = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.bot.getConditions(token);

      if (response.code === '0' && response.data) {
        setConditions(response.data);
      } else {
        setError(response.msg || 'Failed to fetch conditions');
      }
    } catch (err) {
      setError('Error fetching bot conditions');
      console.error('Bot conditions fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConditions();
  }, [fetchConditions, refreshTrigger]);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (!token) return;

    try {
      setTogglingId(id);
      // Optimistically update UI
      setConditions(prev => 
        prev.map(c => c._id === id ? { ...c, isActive: !currentStatus, updatedAt: new Date() } : c)
      );
      
      const response = await apiClient.bot.toggleCondition(id, !currentStatus, token);
      
      if (response.code !== '0') {
        // Revert on error
        setConditions(prev => 
          prev.map(c => c._id === id ? { ...c, isActive: currentStatus } : c)
        );
      }
      // Success: Keep the optimistic update, no refetch needed
    } catch (err) {
      console.error('Error toggling condition:', err);
      // Revert on error
      setConditions(prev => 
        prev.map(c => c._id === id ? { ...c, isActive: currentStatus } : c)
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this condition?')) return;

    try {
      const response = await apiClient.bot.deleteCondition(id, token);
      
      if (response.code === '0') {
        // Refetch to update counts and ensure sync
        await fetchConditions();
      }
    } catch (err) {
      console.error('Error deleting condition:', err);
    }
  };

  const formatFieldName = (field: string) => {
    return field.replace(/_/g, ' ');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeConditions = conditions.filter(c => c.isActive);
  const inactiveConditions = conditions.filter(c => !c.isActive);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Bot Conditions</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Bot Conditions</h2>
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-[#6366F1]/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Bot Conditions</h2>
            <p className="text-xs text-gray-400">Manage trading automation rules</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg font-semibold border border-green-500/30">
            ✓ {activeConditions.length} Active
          </span>
          <span className="px-3 py-1.5 bg-gray-700/50 text-gray-400 rounded-lg font-semibold border border-gray-600">
            ○ {inactiveConditions.length} Inactive
          </span>
        </div>
      </div>

      {conditions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <p className="text-gray-300 text-lg mb-2">No bot conditions yet</p>
          <p className="text-gray-500 text-sm">Create your first condition above to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Conditions */}
          {activeConditions.length > 0 && (
            <div>
              <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
                Active Conditions
              </h3>
              <div className="space-y-3">
                {activeConditions.map((condition) => (
                  <ConditionCard
                    key={condition._id}
                    condition={condition}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    formatFieldName={formatFieldName}
                    formatDate={formatDate}
                    isToggling={togglingId === condition._id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Conditions */}
          {inactiveConditions.length > 0 && (
            <div>
              <h3 className="text-gray-500 font-semibold mb-2 text-sm">Inactive Conditions</h3>
              <div className="space-y-3">
                {inactiveConditions.map((condition) => (
                  <ConditionCard
                    key={condition._id}
                    condition={condition}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    formatFieldName={formatFieldName}
                    formatDate={formatDate}
                    isToggling={togglingId === condition._id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ConditionCardProps {
  condition: BotCondition;
  onToggle: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  formatFieldName: (field: string) => string;
  formatDate: (date: Date) => string;
  isToggling: boolean;
}

function ConditionCard({ 
  condition, 
  onToggle, 
  onDelete, 
  formatFieldName, 
  formatDate,
  isToggling
}: ConditionCardProps) {
  const isActive = condition.isActive;
  
  return (
    <div className={`p-4 rounded-lg border-2 transition ${
      isActive 
        ? 'bg-green-900/20 border-green-500/30' 
        : 'bg-gray-700/50 border-gray-600/30'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-white font-semibold mb-1">{condition.name}</h4>
          <p className="text-sm text-gray-300">
            <span className="text-yellow-400">IF</span>{' '}
            {formatFieldName(condition.conditionField)}{' '}
            <span className="text-yellow-400">{condition.conditionOperator.toLowerCase()}</span>{' '}
            <span className="font-semibold">{condition.conditionValue}</span>{' '}
            <span className="text-green-400">THEN</span>{' '}
            {formatFieldName(condition.actionType)}{' '}
            {formatFieldName(condition.actionField)}{' '}
            <span className="font-semibold">{condition.actionValue}</span>
            {condition.limitPrice && ` at ${condition.limitPrice}`}
          </p>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {/* Toggle Button */}
          <button
            onClick={() => onToggle(condition._id!, condition.isActive)}
            disabled={isToggling}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              isToggling
                ? 'bg-gray-700 text-gray-400 cursor-wait'
                : isActive
                ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg hover:shadow-green-600/30'
                : 'bg-gray-600 hover:bg-gray-500 text-gray-300 hover:shadow-lg'
            }`}
            title={isActive ? 'Deactivate' : 'Activate'}
          >
            {isToggling ? (
              <>
                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>...</span>
              </>
            ) : (
              <>
                <div className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-green-300 shadow-lg shadow-green-300/50' : 'bg-gray-400'
                }`}></div>
                <span>{isActive ? 'ON' : 'OFF'}</span>
              </>
            )}
          </button>
          
          {/* Delete Button */}
          <button
            onClick={() => onDelete(condition._id!)}
            className="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded text-xs font-semibold transition"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-600/50">
        <span>Created: {formatDate(condition.createdAt)}</span>
        {condition.triggerCount > 0 && (
          <span className="text-blue-400">
            Triggered {condition.triggerCount}x
          </span>
        )}
        {condition.lastTriggered && (
          <span className="text-purple-400">
            Last: {formatDate(condition.lastTriggered)}
          </span>
        )}
      </div>
    </div>
  );
}
