'use client';

import { useEffect, useRef } from 'react';

export default function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== 'undefined') {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: 'GCBUSDT',
          interval: '30',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0a0a0a',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: 'tradingview_chart',
          studies: [
            'MASimple@tv-basicstudies'
          ],
          backgroundColor: '#0a0a0a',
          gridColor: 'rgba(255, 255, 255, 0.06)',
          hide_side_toolbar: false,
          allow_symbol_change: false,
          details: true,
          hotlist: false,
          calendar: false,
          show_popup_button: false,
          popup_width: '1000',
          popup_height: '650'
        });
      }
    };

    containerRef.current.appendChild(script);

    return () => {
      // Cleanup
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl shadow-2xl border border-[#27272a] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4  border-[#27272a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">GCB/USDT Chart</h3>
            <p className="text-xs text-gray-400">Real-time price chart with technical indicators</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30">
            Live
          </span>
        </div>
      </div>
      <div 
        ref={containerRef}
        id="tradingview_chart"
        className="w-full"
        style={{ height: '500px' }}
      />
    </div>
  );
}

