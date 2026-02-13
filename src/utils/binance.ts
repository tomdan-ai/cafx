/**
 * Binance Public API Utility
 * Provides price data, candlestick data, and 24h ticker information
 * Falls back to realistic simulated data when API is unreachable
 */

// Use Vite dev proxy to avoid CORS/DNS errors when calling from the browser
const BINANCE_API_BASE = '/binance-api';

export interface PriceData {
    symbol: string;
    price: number;
}

export interface Kline {
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
}

export interface Ticker24h {
    symbol: string;
    priceChange: number;
    priceChangePercent: number;
    lastPrice: number;
    highPrice: number;
    lowPrice: number;
    volume: number;
    quoteVolume: number;
}

// Cache for price data to avoid excessive API calls
const priceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10000; // 10 seconds

// ============================================
// FALLBACK DATA GENERATORS
// ============================================

// Approximate base prices for popular symbols
const BASE_PRICES: Record<string, number> = {
    BTCUSDT: 97500, ETHUSDT: 2650, BNBUSDT: 680, SOLUSDT: 195,
    XRPUSDT: 2.35, ADAUSDT: 0.78, DOGEUSDT: 0.25, AVAXUSDT: 36,
    DOTUSDT: 7.2, MATICUSDT: 0.42, LINKUSDT: 18.5, UNIUSDT: 12.8,
    ATOMUSDT: 9.5, APTUSDT: 8.2, ARBUSDT: 1.15, NEARUSDT: 5.8,
    SUIUSDT: 3.45, INJUSDT: 24.5, PEPEUSDT: 0.000012, SHIBUSDT: 0.000024,
    LTCUSDT: 110, TRXUSDT: 0.24, FILUSDT: 5.6, OPUSDT: 2.1,
};

// Simple seeded random for consistent per-symbol results
const seededRandom = (seed: string, index: number): number => {
    let hash = 0;
    const str = seed + index;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return ((hash & 0x7fffffff) % 10000) / 10000;
};

const getBasePrice = (symbol: string): number => {
    return BASE_PRICES[symbol.toUpperCase()] || 100;
};

const generateFallbackKlines = (symbol: string, limit: number): Kline[] => {
    const basePrice = getBasePrice(symbol);
    const volatility = basePrice * 0.015; // 1.5% volatility
    const now = Date.now();
    const hourMs = 3600000;
    const klines: Kline[] = [];
    let currentPrice = basePrice;

    for (let i = 0; i < limit; i++) {
        const rand = seededRandom(symbol, i);
        const direction = rand > 0.48 ? 1 : -1; // slight upward bias
        const change = direction * volatility * seededRandom(symbol, i + 1000);
        const open = currentPrice;
        const close = open + change;
        const high = Math.max(open, close) + volatility * 0.3 * seededRandom(symbol, i + 2000);
        const low = Math.min(open, close) - volatility * 0.3 * seededRandom(symbol, i + 3000);
        const openTime = now - (limit - i) * hourMs;

        klines.push({
            openTime,
            open: +open.toFixed(8),
            high: +high.toFixed(8),
            low: +low.toFixed(8),
            close: +close.toFixed(8),
            volume: +(1000 + seededRandom(symbol, i + 4000) * 50000).toFixed(2),
            closeTime: openTime + hourMs - 1,
        });

        currentPrice = close;
    }

    return klines;
};

const generateFallbackTicker = (symbol: string): Ticker24h => {
    const basePrice = getBasePrice(symbol);
    const changePercent = (seededRandom(symbol, 999) - 0.45) * 8; // -3.6% to +4.4%
    const change = basePrice * (changePercent / 100);
    const lastPrice = basePrice + change * 0.5;

    return {
        symbol,
        priceChange: +change.toFixed(8),
        priceChangePercent: +changePercent.toFixed(2),
        lastPrice: +lastPrice.toFixed(8),
        highPrice: +(lastPrice * 1.025).toFixed(8),
        lowPrice: +(lastPrice * 0.975).toFixed(8),
        volume: +(5000 + seededRandom(symbol, 888) * 100000).toFixed(2),
        quoteVolume: +(lastPrice * (5000 + seededRandom(symbol, 777) * 100000)).toFixed(2),
    };
};

// ============================================
// API FUNCTIONS (with fallback)
// ============================================

/**
 * Get current price for a symbol
 */
export const getCurrentPrice = async (symbol: string): Promise<PriceData | null> => {
    try {
        const cacheKey = `price_${symbol}`;
        const cached = priceCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        const response = await fetch(`${BINANCE_API_BASE}/ticker/price?symbol=${symbol}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const result = {
            symbol: data.symbol,
            price: parseFloat(data.price)
        };

        priceCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    } catch (error) {
        console.warn('Binance API unavailable, using fallback price for', symbol);
        const fallback = { symbol, price: getBasePrice(symbol) };
        priceCache.set(`price_${symbol}`, { data: fallback, timestamp: Date.now() });
        return fallback;
    }
};

/**
 * Get kline (candlestick) data for charting
 */
export const getKlines = async (
    symbol: string,
    interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
    limit: number = 50
): Promise<Kline[]> => {
    try {
        const cacheKey = `kline_${symbol}_${interval}_${limit}`;
        const cached = priceCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 3) {
            return cached.data;
        }

        const response = await fetch(
            `${BINANCE_API_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const klines: Kline[] = data.map((k: any[]) => ({
            openTime: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            closeTime: k[6]
        }));

        priceCache.set(cacheKey, { data: klines, timestamp: Date.now() });
        return klines;
    } catch (error) {
        console.warn('Binance API unavailable, using fallback klines for', symbol);
        const fallback = generateFallbackKlines(symbol, limit);
        priceCache.set(`kline_${symbol}_${interval}_${limit}`, { data: fallback, timestamp: Date.now() });
        return fallback;
    }
};

/**
 * Get 24h ticker statistics
 */
export const get24hTicker = async (symbol: string): Promise<Ticker24h | null> => {
    try {
        const cacheKey = `ticker_${symbol}`;
        const cached = priceCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        const response = await fetch(`${BINANCE_API_BASE}/ticker/24hr?symbol=${symbol}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const result: Ticker24h = {
            symbol: data.symbol,
            priceChange: parseFloat(data.priceChange),
            priceChangePercent: parseFloat(data.priceChangePercent),
            lastPrice: parseFloat(data.lastPrice),
            highPrice: parseFloat(data.highPrice),
            lowPrice: parseFloat(data.lowPrice),
            volume: parseFloat(data.volume),
            quoteVolume: parseFloat(data.quoteVolume)
        };

        priceCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    } catch (error) {
        console.warn('Binance API unavailable, using fallback ticker for', symbol);
        const fallback = generateFallbackTicker(symbol);
        priceCache.set(`ticker_${symbol}`, { data: fallback, timestamp: Date.now() });
        return fallback;
    }
};

/**
 * Get sparkline data (simplified price array for mini charts)
 */
export const getSparklineData = async (symbol: string, points: number = 24): Promise<number[]> => {
    const klines = await getKlines(symbol, '1h', points);
    return klines.map(k => k.close);
};

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    if (price >= 0.0001) return price.toFixed(6);
    return price.toFixed(8);
};

/**
 * Format large numbers (volume, market cap)
 */
export const formatVolume = (volume: number): string => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
};

