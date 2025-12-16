'use client';

import { useState } from 'react';
import apiClient, { 
  type ConditionField, 
  type ConditionOperator, 
  type ActionType, 
  type ActionField 
} from '@/lib/api';

interface BotConditionBuilderProps {
  token: string | null;
  onConditionCreated: () => void;
}

export default function BotConditionBuilder({ token, onConditionCreated }: BotConditionBuilderProps) {
  const [name, setName] = useState('');
  const [conditionField, setConditionField] = useState<ConditionField>('GCB_PRICE');
  const [conditionOperator, setConditionOperator] = useState<ConditionOperator>('ABOVE');
  const [conditionValue, setConditionValue] = useState('');
  const [actionType, setActionType] = useState<ActionType>('BUY_MARKET');
  const [actionField, setActionField] = useState<ActionField>('GCB_QUANTITY');
  const [actionValue, setActionValue] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Prevent scroll from changing number input values
  const preventScrollChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const fieldOptions: { value: ConditionField; label: string }[] = [
    { value: 'GCB_QUANTITY', label: 'GCB Quantity' },
    // { value: 'USDT_QUANTITY', label: 'USDT Quantity' },
    { value: 'GCB_PRICE', label: 'GCB Price' },
  ];

  const operatorOptions: { value: ConditionOperator; label: string }[] = [
    { value: 'ABOVE', label: 'Above' },
    { value: 'BELOW', label: 'Below' },
    { value: 'EQUAL', label: 'Equal' },
  ];

  const actionOptions: { value: ActionType; label: string }[] = [
    { value: 'BUY_MARKET', label: 'Buy Market' },
    { value: 'SELL_MARKET', label: 'Sell Market' },
    { value: 'BUY_LIMIT', label: 'Buy Limit' },
    { value: 'SELL_LIMIT', label: 'Sell Limit' },
  ];

  const actionFieldOptions: { value: ActionField; label: string }[] = [
    { value: 'GCB_QUANTITY', label: 'GCB Quantity' },
    { value: 'USDT_VALUE', label: 'USDT Value' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Please log in to create bot conditions');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userId = localStorage.getItem('gcbex_uid') || '';
      
      const condition = {
        userId,
        name: name || `${conditionField} ${conditionOperator} ${conditionValue}`,
        isActive: true,
        conditionField,
        conditionOperator,
        conditionValue: parseFloat(conditionValue),
        actionType,
        actionField,
        actionValue: parseFloat(actionValue),
        ...(actionType.includes('LIMIT') && limitPrice ? { limitPrice: parseFloat(limitPrice) } : {}),
      };

      const response = await apiClient.bot.createCondition(condition, token);

      if (response.code === '0') {
        setSuccess('Bot condition created successfully!');
        // Reset form
        setName('');
        setConditionValue('');
        setActionValue('');
        setLimitPrice('');
        onConditionCreated();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.msg || 'Failed to create condition');
      }
    } catch (err) {
      setError('Error creating bot condition');
      console.error('Bot condition creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isLimitOrder = actionType.includes('LIMIT');

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-[#FF007A] to-[#E91E63] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF007A]/50">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Bot Condition Builder</h2>
          <p className="text-xs text-gray-400">Create automated trading conditions</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Condition Name */}
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-2">
            Condition Name (Optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Buy GCB when price drops"
            className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] placeholder-gray-500"
          />
        </div>

        {/* Condition Builder */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg shadow-yellow-500/50">IF</span>
            Condition
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">Field</label>
              <select
                value={conditionField}
                onChange={(e) => setConditionField(e.target.value as ConditionField)}
                className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              >
                {fieldOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">Operator</label>
              <select
                value={conditionOperator}
                onChange={(e) => setConditionOperator(e.target.value as ConditionOperator)}
                className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              >
                {operatorOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">Value</label>
              <input
                type="number"
                step="any"
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>
          </div>
        </div>

        {/* Action Builder */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg shadow-green-500/50">THEN</span>
            Action
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">Action Type</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as ActionType)}
                className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              >
                {actionOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">Field</label>
              <select
                value={actionField}
                onChange={(e) => setActionField(e.target.value as ActionField)}
                className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              >
                {actionFieldOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-1">Value</label>
              <input
                type="number"
                step="any"
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
            </div>
          </div>

          {/* Limit Price (only for limit orders) */}
          {isLimitOrder && (
            <div className="mt-4">
              <label className="block text-gray-300 text-xs font-semibold mb-1">Limit Price (USDT)</label>
              <input
                type="number"
                step="any"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="0.00"
                required={isLimitOrder}
                className="w-full bg-[#27272a] text-white border border-[#3f3f46] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/30 rounded-xl p-4">
          <p className="text-gray-300 text-sm font-medium">
            <span className="font-bold text-white">Preview:</span> If{' '}
            <span className="text-amber-400 font-semibold">{conditionField.replace('_', ' ')}</span> is{' '}
            <span className="text-amber-400 font-semibold">{conditionOperator.toLowerCase()}</span>{' '}
            <span className="text-amber-400 font-semibold">{conditionValue || '___'}</span>, then{' '}
            <span className="text-green-400 font-semibold">{actionType.replace('_', ' ').toLowerCase()}</span>{' '}
            <span className="text-green-400 font-semibold">{actionField.replace('_', ' ')}</span>{' '}
            <span className="text-green-400 font-semibold">{actionValue || '___'}</span>
            {isLimitOrder && ` at price ${limitPrice || '___'}`}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-400 text-sm font-semibold">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !conditionValue || !actionValue}
          className="w-full bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:from-[#5558E3] hover:to-[#6D28D9] disabled:from-[#27272a] disabled:to-[#1f1f23] disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-[#6366F1]/20 hover:shadow-[#6366F1]/40 hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Creating...
            </>
          ) : (
            <>
              <span>➕</span> Add Condition to Bot
            </>
          )}
        </button>
      </form>
    </div>
  );
}
