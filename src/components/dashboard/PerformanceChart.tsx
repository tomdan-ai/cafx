import React, { useState } from 'react';
import { Card } from '../ui/Card';
import TradingViewChart from '../ui/TradingViewChart';

const QUICK_SYMBOLS = [
  { symbol: 'BTCUSDT', label: 'BTC' },
  { symbol: 'ETHUSDT', label: 'ETH' },
  { symbol: 'SOLUSDT', label: 'SOL' },
  { symbol: 'BNBUSDT', label: 'BNB' },
  { symbol: 'XRPUSDT', label: 'XRP' },
];

export const PerformanceChart: React.FC = () => {
  const [activeSymbol, setActiveSymbol] = useState('BTCUSDT');

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-white">Market Overview</h3>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {QUICK_SYMBOLS.map(({ symbol, label }) => (
            <button
              key={symbol}
              onClick={() => setActiveSymbol(symbol)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeSymbol === symbol
                  ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                  : 'bg-[var(--color-surface-light)] text-gray-400 border border-transparent hover:text-white'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <TradingViewChart
        symbol={activeSymbol}
        height={typeof window !== 'undefined' && window.innerWidth < 640 ? 300 : 400}
        interval="60"
        showToolbar={typeof window !== 'undefined' && window.innerWidth >= 640}
      />
    </Card>
  );
};