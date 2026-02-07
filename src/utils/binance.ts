/**
 * Binance Public API Utility
 * Provides price data, candlestick data, and 24h ticker information
 */

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

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
            console.warn(`Failed to fetch price for ${symbol}`);
            return null;
        }

        const data = await response.json();
        const result = {
            symbol: data.symbol,
            price: parseFloat(data.price)
        };

        priceCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    } catch (error) {
        console.error('Error fetching price:', error);
        return null;
    }
};

/**
 * Get kline (candlestick) data for charting
 * @param symbol Trading pair symbol (e.g., 'BTCUSDT')
 * @param interval Kline interval (e.g., '1h', '4h', '1d')
 * @param limit Number of klines to fetch (default: 50)
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
            console.warn(`Failed to fetch klines for ${symbol}`);
            return [];
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
        console.error('Error fetching klines:', error);
        return [];
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
            console.warn(`Failed to fetch 24h ticker for ${symbol}`);
            return null;
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
        console.error('Error fetching 24h ticker:', error);
        return null;
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
