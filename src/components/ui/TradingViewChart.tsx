import React, { useEffect, useRef, memo } from 'react';

/**
 * TradingView Advanced Chart Widget
 * Embeds TradingView's free widget for real-time price charts.
 * No API key needed — uses the public TradingView widget library.
 */

interface TradingViewChartProps {
    symbol?: string;        // e.g. "BTCUSDT" → converted to "BINANCE:BTCUSDT"
    height?: number;
    theme?: 'dark' | 'light';
    interval?: string;      // "1", "5", "15", "60", "D", "W"
    className?: string;
    showToolbar?: boolean;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
    symbol = 'BTCUSDT',
    height = 400,
    theme = 'dark',
    interval = '60',
    className = '',
    showToolbar = true,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef(`tradingview_${symbol}_${Math.random().toString(36).slice(2, 8)}`);

    // Convert common pair formats to TradingView symbol format
    const getTVSymbol = (sym: string): string => {
        const clean = sym.toUpperCase().replace(/[^A-Z0-9]/g, '');
        // If it already has an exchange prefix, use as-is
        if (clean.includes(':')) return clean;
        return `BINANCE:${clean}`;
    };

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous widget
        const container = containerRef.current;
        container.innerHTML = '';

        // Create script element for TradingView widget
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if (typeof (window as any).TradingView !== 'undefined' && container) {
                new (window as any).TradingView.widget({
                    autosize: true,
                    symbol: getTVSymbol(symbol),
                    interval: interval,
                    timezone: 'Etc/UTC',
                    theme: theme,
                    style: '1',
                    locale: 'en',
                    toolbar_bg: '#0f0f1a',
                    enable_publishing: false,
                    hide_top_toolbar: !showToolbar,
                    hide_legend: false,
                    save_image: false,
                    container_id: widgetId.current,
                    backgroundColor: 'rgba(15, 15, 26, 1)',
                    gridColor: 'rgba(45, 45, 74, 0.3)',
                    studies: [],
                    disabled_features: [
                        'header_symbol_search',
                        'header_compare',
                        'header_undo_redo',
                        'header_screenshot',
                        'header_saveload',
                        'use_localstorage_for_settings',
                    ],
                    enabled_features: ['hide_left_toolbar_by_default'],
                    overrides: {
                        'mainSeriesProperties.candleStyle.upColor': '#10B981',
                        'mainSeriesProperties.candleStyle.downColor': '#EF4444',
                        'mainSeriesProperties.candleStyle.wickUpColor': '#10B981',
                        'mainSeriesProperties.candleStyle.wickDownColor': '#EF4444',
                        'mainSeriesProperties.candleStyle.borderUpColor': '#10B981',
                        'mainSeriesProperties.candleStyle.borderDownColor': '#EF4444',
                        'paneProperties.background': '#0f0f1a',
                        'paneProperties.vertGridProperties.color': 'rgba(45, 45, 74, 0.3)',
                        'paneProperties.horzGridProperties.color': 'rgba(45, 45, 74, 0.3)',
                        'scalesProperties.textColor': '#94a3b8',
                    },
                });
            }
        };

        // Create the widget container div
        const widgetDiv = document.createElement('div');
        widgetDiv.id = widgetId.current;
        widgetDiv.style.width = '100%';
        widgetDiv.style.height = `${height}px`;
        container.appendChild(widgetDiv);
        container.appendChild(script);

        return () => {
            // Cleanup
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [symbol, interval, theme, height, showToolbar]);

    return (
        <div
            ref={containerRef}
            className={`rounded-xl overflow-hidden border border-[var(--color-border)] ${className}`}
            style={{ height: `${height}px`, minHeight: `${height}px` }}
        />
    );
};

export default memo(TradingViewChart);
