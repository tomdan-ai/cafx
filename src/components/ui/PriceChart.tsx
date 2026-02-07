import React, { useEffect, useState, useMemo } from 'react';
import { getKlines, get24hTicker, formatPrice, formatVolume, Kline, Ticker24h } from '../../utils/binance';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PriceChartProps {
    symbol: string;
    height?: number;
    showToggle?: boolean;
    showStats?: boolean;
    className?: string;
}

type ChartView = 'sparkline' | 'candlestick';

export const PriceChart: React.FC<PriceChartProps> = ({
    symbol,
    height = 120,
    showToggle = true,
    showStats = true,
    className = ''
}) => {
    const [chartView, setChartView] = useState<ChartView>('sparkline');
    const [klines, setKlines] = useState<Kline[]>([]);
    const [ticker, setTicker] = useState<Ticker24h | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!symbol) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const [klinesData, tickerData] = await Promise.all([
                    getKlines(symbol, '1h', 24),
                    get24hTicker(symbol)
                ]);

                if (klinesData.length === 0) {
                    setError('No data available');
                } else {
                    setKlines(klinesData);
                    setTicker(tickerData);
                }
            } catch (err) {
                setError('Failed to load chart data');
                console.error('Chart data error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [symbol]);

    const chartData = useMemo(() => {
        if (klines.length === 0) return null;

        const prices = klines.map(k => k.close);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;

        return {
            prices,
            min,
            max,
            range,
            isPositive: prices[prices.length - 1] >= prices[0]
        };
    }, [klines]);

    // Sparkline SVG path
    const sparklinePath = useMemo(() => {
        if (!chartData) return '';

        const { prices, min, range } = chartData;
        const width = 100;
        const chartHeight = height - 20;
        const points = prices.map((price, i) => {
            const x = (i / (prices.length - 1)) * width;
            const y = chartHeight - ((price - min) / range) * (chartHeight * 0.8) - 10;
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    }, [chartData, height]);

    // Candlestick rendering
    const renderCandlesticks = () => {
        if (!chartData || klines.length === 0) return null;

        const { min, range } = chartData;
        const chartHeight = height - 20;
        const candleWidth = 100 / klines.length;
        const bodyWidth = candleWidth * 0.6;

        return klines.map((kline, i) => {
            const x = i * candleWidth + candleWidth / 2;
            const isGreen = kline.close >= kline.open;

            // Calculate Y positions (inverted because SVG Y grows downward)
            const highY = chartHeight - ((kline.high - min) / range) * (chartHeight * 0.8) - 10;
            const lowY = chartHeight - ((kline.low - min) / range) * (chartHeight * 0.8) - 10;
            const openY = chartHeight - ((kline.open - min) / range) * (chartHeight * 0.8) - 10;
            const closeY = chartHeight - ((kline.close - min) / range) * (chartHeight * 0.8) - 10;

            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.abs(openY - closeY) || 1;

            return (
                <g key={i}>
                    {/* Wick */}
                    <line
                        x1={x}
                        y1={highY}
                        x2={x}
                        y2={lowY}
                        stroke={isGreen ? 'var(--color-accent)' : 'var(--color-error)'}
                        strokeWidth={0.5}
                    />
                    {/* Body */}
                    <rect
                        x={x - bodyWidth / 2}
                        y={bodyTop}
                        width={bodyWidth}
                        height={bodyHeight}
                        fill={isGreen ? 'var(--color-accent)' : 'var(--color-error)'}
                        rx={0.5}
                    />
                </g>
            );
        });
    };

    if (!symbol) {
        return (
            <div className={`flex items-center justify-center text-gray-500 ${className}`} style={{ height }}>
                Select a trading pair
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`flex items-center justify-center ${className}`} style={{ height }}>
                <div className="flex items-center gap-2 text-gray-400">
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span className="text-sm">Loading chart...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex items-center justify-center text-gray-500 ${className}`} style={{ height }}>
                {error}
            </div>
        );
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Stats bar */}
            {showStats && ticker && (
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-white">
                            ${formatPrice(ticker.lastPrice)}
                        </span>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium ${ticker.priceChangePercent >= 0
                                ? 'bg-green-500/15 text-green-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}>
                            {ticker.priceChangePercent >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            {ticker.priceChangePercent >= 0 ? '+' : ''}{ticker.priceChangePercent.toFixed(2)}%
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>24h Vol: <span className="text-gray-300">${formatVolume(ticker.quoteVolume)}</span></span>
                        <span>H: <span className="text-green-400">${formatPrice(ticker.highPrice)}</span></span>
                        <span>L: <span className="text-red-400">${formatPrice(ticker.lowPrice)}</span></span>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="relative bg-[var(--color-surface-dark)] rounded-lg p-2 overflow-hidden">
                <svg
                    viewBox={`0 0 100 ${height}`}
                    preserveAspectRatio="none"
                    className="w-full"
                    style={{ height }}
                >
                    {/* Grid lines */}
                    <defs>
                        <pattern id="grid" width="10" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100" height={height} fill="url(#grid)" />

                    {chartView === 'sparkline' ? (
                        <>
                            {/* Gradient fill */}
                            <defs>
                                <linearGradient id={`gradient-${symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop
                                        offset="0%"
                                        stopColor={chartData?.isPositive ? 'var(--color-accent)' : 'var(--color-error)'}
                                        stopOpacity="0.3"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor={chartData?.isPositive ? 'var(--color-accent)' : 'var(--color-error)'}
                                        stopOpacity="0"
                                    />
                                </linearGradient>
                            </defs>

                            {/* Area fill */}
                            {sparklinePath && (
                                <path
                                    d={`${sparklinePath} L 100,${height} L 0,${height} Z`}
                                    fill={`url(#gradient-${symbol})`}
                                />
                            )}

                            {/* Line */}
                            <path
                                d={sparklinePath}
                                fill="none"
                                stroke={chartData?.isPositive ? 'var(--color-accent)' : 'var(--color-error)'}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </>
                    ) : (
                        renderCandlesticks()
                    )}
                </svg>

                {/* Toggle button */}
                {showToggle && (
                    <button
                        onClick={() => setChartView(v => v === 'sparkline' ? 'candlestick' : 'sparkline')}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] transition-colors"
                        title={`Switch to ${chartView === 'sparkline' ? 'candlestick' : 'sparkline'} view`}
                    >
                        <BarChart3 className={`w-4 h-4 ${chartView === 'candlestick' ? 'text-[var(--color-primary)]' : 'text-gray-400'}`} />
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * Mini sparkline for compact displays (like in dropdowns)
 */
export const MiniSparkline: React.FC<{
    symbol: string;
    width?: number;
    height?: number;
}> = ({ symbol, width = 60, height = 24 }) => {
    const [prices, setPrices] = useState<number[]>([]);
    const [isPositive, setIsPositive] = useState(true);

    useEffect(() => {
        if (!symbol) return;

        const fetchData = async () => {
            const klines = await getKlines(symbol, '1h', 12);
            if (klines.length > 0) {
                const closePrices = klines.map(k => k.close);
                setPrices(closePrices);
                setIsPositive(closePrices[closePrices.length - 1] >= closePrices[0]);
            }
        };

        fetchData();
    }, [symbol]);

    if (prices.length === 0) {
        return <div style={{ width, height }} className="bg-gray-800/50 rounded animate-pulse" />;
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = prices.map((price, i) => {
        const x = (i / (prices.length - 1)) * width;
        const y = height - ((price - min) / range) * (height * 0.8) - 2;
        return `${x},${y}`;
    });

    const path = `M ${points.join(' L ')}`;

    return (
        <svg width={width} height={height} className="overflow-visible">
            <path
                d={path}
                fill="none"
                stroke={isPositive ? 'var(--color-accent)' : 'var(--color-error)'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default PriceChart;
