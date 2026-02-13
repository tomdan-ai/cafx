/**
 * Exchange Logo Utility
 * Maps exchange names to their logo URLs for consistent display
 */

// Well-known exchange logos using public CDN sources
const EXCHANGE_LOGOS: Record<string, string> = {
    binance: 'https://assets.coingecko.com/markets/images/52/small/binance.jpg',
    bybit: 'https://assets.coingecko.com/markets/images/698/small/bybit_spot.png',
    bitget: 'https://assets.coingecko.com/markets/images/540/small/Bitget.jpeg',
    okx: 'https://assets.coingecko.com/markets/images/96/small/WeChat_Image_20220117220452.png',
    kucoin: 'https://assets.coingecko.com/markets/images/61/small/kucoin.png',
    gateio: 'https://assets.coingecko.com/markets/images/60/small/gate_io_logo1.jpg',
    'gate.io': 'https://assets.coingecko.com/markets/images/60/small/gate_io_logo1.jpg',
    kraken: 'https://assets.coingecko.com/markets/images/29/small/kraken.jpg',
    coinbase: 'https://assets.coingecko.com/markets/images/23/small/Coinbase_Coin_Primary.png',
    huobi: 'https://assets.coingecko.com/markets/images/25/small/logo_V_colour_black.png',
    htx: 'https://assets.coingecko.com/markets/images/25/small/logo_V_colour_black.png',
    mexc: 'https://assets.coingecko.com/markets/images/409/small/MEXC_logo_square.jpeg',
    bingx: 'https://assets.coingecko.com/markets/images/812/small/bingx.png',
    phemex: 'https://assets.coingecko.com/markets/images/460/small/phemex.png',
};

/**
 * Get exchange logo URL for a given exchange name/value
 * @param name Exchange name or value (e.g., 'binance', 'Bybit')
 * @returns URL to the exchange logo, or null if not found
 */
export const getExchangeLogo = (name: string): string | null => {
    const key = name.toLowerCase().replace(/\s+/g, '');
    return EXCHANGE_LOGOS[key] || null;
};

/**
 * Generate a gradient placeholder for exchanges without logos
 */
export const getExchangeGradient = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash % 360);
    const h2 = (h1 + 45) % 360;
    return `linear-gradient(135deg, hsl(${h1}, 60%, 45%), hsl(${h2}, 60%, 35%))`;
};
