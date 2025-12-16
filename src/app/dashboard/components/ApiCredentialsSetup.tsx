/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { API } from '@/lib/api';

interface ApiCredentialsSetupProps {
  token: string;
  onCredentialsUpdate?: (isValid: boolean) => void;
}

export default function ApiCredentialsSetup({ token, onCredentialsUpdate }: ApiCredentialsSetupProps) {
  const [hasCredentials, setHasCredentials] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [credentialsData, setCredentialsData] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if user already has API credentials
  useEffect(() => {
    checkCredentials();
  }, [token]);

  const checkCredentials = async () => {
    try {
      setIsChecking(true);
      const response = await API.credentials.getStatus(token);
      if (response.code === '0' && response.data) {
        const isValid = response.data.hasCredentials && response.data.valid;
        setHasCredentials(response.data.hasCredentials);
        setCredentialsData(response.data);
        // Notify parent component about credential status
        if (onCredentialsUpdate) {
          onCredentialsUpdate(isValid);
        }
      }
    } catch (err) {
      console.error('Error checking credentials:', err);
      if (onCredentialsUpdate) {
        onCredentialsUpdate(false);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey || !apiSecret) {
      setError('Both API Key and Secret are required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const response = await API.credentials.save({ apiKey, apiSecret }, token);

      if (response.code === '0') {
        setSuccess('✅ API credentials saved successfully!');
        setApiKey('');
        setApiSecret('');
        setShowForm(false);
        setHasCredentials(true);
        await checkCredentials();
      } else {
        setError(response.msg || 'Failed to save credentials');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove your API credentials? This will deactivate all bot conditions.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const response = await API.credentials.remove(token);

      if (response.code === '0') {
        setSuccess('✅ API credentials removed successfully');
        setHasCredentials(false);
        setCredentialsData(null);
        if (onCredentialsUpdate) {
          onCredentialsUpdate(false);
        }
      } else {
        setError(response.msg || 'Failed to remove credentials');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 shadow-2xl border border-[#27272a]">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl shadow-2xl border border-[#27272a] hover:border-[#6366F1]/30 transition-all overflow-hidden">
      {/* Collapsible Header - When credentials exist */}
      {hasCredentials && credentialsData && !isExpanded ? (
        <div 
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1f1f1f] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">API Credentials</h3>
              <p className="text-xs text-green-400">Active • {credentialsData.apiKey}</p>
            </div>
          </div>
          <button 
            type="button"
            className="p-2 hover:bg-[#27272a] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          {/* Expanded Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#27272a]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6366F1]/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[#6366F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">API Credentials</h3>
                <p className="text-xs text-gray-400">Required for automated bot trading</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasCredentials && (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-lg border border-green-500/30">
                  ✓ Active
                </span>
              )}
              {hasCredentials && credentialsData && (
                <button 
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-[#27272a] rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Expanded Content */}
          <div className="p-6">
            {/* Status Display */}
            {hasCredentials && credentialsData && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-400">API Credentials Configured</p>
              <p className="text-xs text-green-300 mt-1">API Key: {credentialsData.apiKey}</p>
              {credentialsData.updatedAt && (
                <p className="text-xs text-green-300 mt-1">
                  Updated: {new Date(credentialsData.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[#27272a] border border-green-500/30 text-green-400 rounded-lg text-sm font-medium hover:bg-[#3f3f46] transition"
            >
              Update Credentials
            </button>
            <button
              onClick={handleRemove}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition disabled:opacity-50"
            >
              {isLoading ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      )}

      {/* Warning for users without credentials */}
      {!hasCredentials && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-400">Bot Trading Disabled</p>
              <p className="text-xs text-amber-300 mt-1">
                Add your GCBEX API credentials to enable automated bot trading. Your session token expires after 1 hour, but API credentials work continuously.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-semibold transition"
          >
            Add API Credentials
          </button>
        </div>
      )}

      {/* Credentials Form */}
      {showForm && (
        <div className="bg-[#27272a]/30 border border-[#3f3f46] rounded-xl p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your GCBEX API Key"
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#3f3f46] text-white rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent placeholder-gray-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Secret
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Enter your GCBEX API Secret"
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#3f3f46] text-white rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent placeholder-gray-500"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#6366F1] hover:bg-[#7C3AED] text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#6366F1]/30"
            >
              {isLoading ? 'Validating...' : 'Save Credentials'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setApiKey('');
                setApiSecret('');
                setError('');
                setSuccess('');
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 rounded-lg font-semibold transition border border-[#3f3f46]"
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 p-3 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-lg">
            <p className="text-xs text-[#6366F1]">
              <strong>Note:</strong> Your credentials will be validated before saving. Get your API credentials from GCBEX settings.
            </p>
          </div>
        </div>
      )}
          </div>
        </>
      )}
    </div>
  );
}