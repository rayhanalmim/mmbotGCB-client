'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface QRCodeData {
  qrcode: string;
  qrcodeId: string;
  appTitle: string | null;
}

interface QRStatusData {
  uid: string | null;
  token: string;
  status: string; // "0" = waiting, "1" = scanned, "2" = confirmed
}

const QR_EXPIRY_SECONDS = 60;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mmbotservergcb.vercel.app';

export default function LoginPage() {
  const router = useRouter();
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [status, setStatus] = useState<string>('loading');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(QR_EXPIRY_SECONDS);
  const qrcodeIdRef = useRef<string | null>(null);
  const hasFetched = useRef(false);

  // Fetch new QR code
  const fetchQRCode = async () => {
    try {
      setStatus('loading');
      setError(null);
      setCountdown(QR_EXPIRY_SECONDS);
      
      const response = await fetch(`${API_URL}/api/auth/qrcode`);
      const result = await response.json();

      if (result.code === '0' && result.data) {
        setQrData(result.data);
        qrcodeIdRef.current = result.data.qrcodeId;
        setStatus('waiting');
        setCountdown(QR_EXPIRY_SECONDS);
      } else {
        setError(result.msg || 'Failed to generate QR code');
        setStatus('error');
      }
    } catch {
      setError('Network error. Please try again.');
      setStatus('error');
    }
  };

  // Check QR code status
  const checkStatus = async () => {
    const qrcodeId = qrcodeIdRef.current;
    if (!qrcodeId) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/qrcode/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrcodeId }),
      });

      const result = await response.json();

      if (result.code === '0' && result.data) {
        const statusData: QRStatusData = result.data;

        switch (statusData.status) {
          case '0':
            setStatus('waiting');
            break;
          case '1':
            setStatus('scanned');
            break;
          case '2':
            setStatus('confirmed');
            // Store token and redirect
            if (statusData.token) {
              localStorage.setItem('gcbex_token', statusData.token);
              localStorage.setItem('gcbex_uid', statusData.uid || '');
              router.push('/dashboard');
            }
            break;
          default:
            setStatus('waiting');
        }
      }
    } catch (err) {
      console.error('Status check error:', err);
    }
  };

  // Initial QR code fetch
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchQRCode();
    }
  }, []);

  // Poll status every 3 seconds
  useEffect(() => {
    if (status !== 'waiting' && status !== 'scanned') return;

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [status]);

  // Countdown timer - expires after 60 seconds
  useEffect(() => {
    if (status !== 'waiting' && status !== 'scanned') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, qrData?.qrcodeId]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">GCBex Login</h1>
          <p className="text-gray-400">Scan QR code with GCBex mobile app</p>
        </div>

        {/* QR Code Container */}
        <div className="bg-white rounded-xl p-4 mb-6">
          {status === 'loading' && (
            <div className="w-64 h-64 mx-auto flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}

          {status === 'error' && (
            <div className="w-64 h-64 mx-auto flex flex-col items-center justify-center text-center">
              <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchQRCode}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {(status === 'waiting' || status === 'scanned') && qrData?.qrcode && (
            <div className="w-64 h-64 mx-auto relative">
              <Image
                src={qrData.qrcode}
                alt="Login QR Code"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {status === 'expired' && qrData?.qrcode && (
            <div className="w-64 h-64 mx-auto relative">
              {/* Blurred QR code background */}
              <Image
                src={qrData.qrcode}
                alt="Expired QR Code"
                fill
                className="object-contain blur-sm opacity-50"
                unoptimized
              />
              {/* Overlay with expired message */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg">
                <p className="text-white text-lg font-semibold mb-4">QR code expired</p>
                <button
                  onClick={fetchQRCode}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

          {status === 'confirmed' && (
            <div className="w-64 h-64 mx-auto flex flex-col items-center justify-center">
              <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-600 font-semibold">Login Successful!</p>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="text-center">
          {status === 'waiting' && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span>Waiting for scan...</span>
              </div>
              <span className="text-gray-500 text-sm">Expires in {countdown}s</span>
            </div>
          )}

          {status === 'scanned' && (
            <div className="flex items-center justify-center gap-2 text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>QR Scanned! Confirm on your phone...</span>
            </div>
          )}

          {status === 'expired' && (
            <div className="flex items-center justify-center gap-2 text-red-400">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>QR code expired. Click Refresh to get a new one.</span>
            </div>
          )}

          {status === 'confirmed' && (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Redirecting to dashboard...</span>
            </div>
          )}
        </div>


        {/* QR Code ID (for debugging) */}
        {qrData?.qrcodeId && (
          <p className="mt-4 text-xs text-gray-500 text-center truncate">
            ID: {qrData.qrcodeId}
          </p>
        )}
      </div>
    </div>
  );
}
