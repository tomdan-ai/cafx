/**
 * Token Logo Utility
 * Maps cryptocurrency symbols to their logo URLs
 */

// Using CoinGecko's asset platform for reliable logos
const COINGECKO_CDN = 'https://assets.coingecko.com/coins/images';

// Map of common crypto symbols to their CoinGecko image IDs
const COINGECKO_ICONS: Record<string, string> = {
    BTC: `${COINGECKO_CDN}/1/small/bitcoin.png`,
    ETH: `${COINGECKO_CDN}/279/small/ethereum.png`,
    BNB: `${COINGECKO_CDN}/825/small/bnb-icon2_2x.png`,
    SOL: `${COINGECKO_CDN}/4128/small/solana.png`,
    XRP: `${COINGECKO_CDN}/44/small/xrp-symbol-white-128.png`,
    ADA: `${COINGECKO_CDN}/975/small/cardano.png`,
    DOGE: `${COINGECKO_CDN}/5/small/dogecoin.png`,
    AVAX: `${COINGECKO_CDN}/12559/small/Avalanche_Circle_RedWhite_Trans.png`,
    DOT: `${COINGECKO_CDN}/12171/small/polkadot.png`,
    MATIC: `${COINGECKO_CDN}/4713/small/polygon.png`,
    SHIB: `${COINGECKO_CDN}/11939/small/shiba.png`,
    LTC: `${COINGECKO_CDN}/2/small/litecoin.png`,
    LINK: `${COINGECKO_CDN}/877/small/chainlink-new-logo.png`,
    UNI: `${COINGECKO_CDN}/12504/small/uniswap-logo.png`,
    ATOM: `${COINGECKO_CDN}/1481/small/cosmos_hub.png`,
    FIL: `${COINGECKO_CDN}/12817/small/filecoin.png`,
    APT: `${COINGECKO_CDN}/26455/small/aptos_round.png`,
    ARB: `${COINGECKO_CDN}/16547/small/photo_2023-03-29_21.47.00.jpeg`,
    OP: `${COINGECKO_CDN}/25244/small/Optimism.png`,
    NEAR: `${COINGECKO_CDN}/10365/small/near.jpg`,
    TRX: `${COINGECKO_CDN}/1094/small/tron-logo.png`,
    PEPE: `${COINGECKO_CDN}/29850/small/pepe-token.jpeg`,
    WIF: `${COINGECKO_CDN}/33566/small/dogwifhat.jpg`,
    SUI: `${COINGECKO_CDN}/26375/small/sui_asset.jpeg`,
    SEI: `${COINGECKO_CDN}/28205/small/Sei_Logo_-_Transparent.png`,
    INJ: `${COINGECKO_CDN}/12220/small/injective-protocol.png`,
    FET: `${COINGECKO_CDN}/5681/small/Fetch.jpg`,
    RENDER: `${COINGECKO_CDN}/11636/small/rndr.png`,
    AAVE: `${COINGECKO_CDN}/12645/small/AAVE.png`,
    CRV: `${COINGECKO_CDN}/12124/small/Curve.png`,
    SAND: `${COINGECKO_CDN}/12129/small/sandbox_logo.jpg`,
    MANA: `${COINGECKO_CDN}/878/small/decentraland-mana.png`,
    AXS: `${COINGECKO_CDN}/13029/small/axie_infinity_logo.png`,
    GALA: `${COINGECKO_CDN}/12493/small/GALA-COINGECKO.png`,
    IMX: `${COINGECKO_CDN}/17233/small/immutableX-symbol-BLK-RGB.png`,
    GMT: `${COINGECKO_CDN}/23597/small/gmt.png`,
    APE: `${COINGECKO_CDN}/24383/small/apecoin.jpg`,
    LDO: `${COINGECKO_CDN}/13573/small/Lido_DAO.png`,
    MKR: `${COINGECKO_CDN}/1364/small/Mark_Maker.png`,
    SNX: `${COINGECKO_CDN}/3406/small/SNX.png`,
    COMP: `${COINGECKO_CDN}/10775/small/COMP.png`,
    '1INCH': `${COINGECKO_CDN}/13469/small/1inch-token.png`,
    SUSHI: `${COINGECKO_CDN}/12271/small/512x512_Logo_no_chop.png`,
    YFI: `${COINGECKO_CDN}/11849/small/yearn.jpg`,
    BAL: `${COINGECKO_CDN}/11683/small/Balancer.png`,
    ENS: `${COINGECKO_CDN}/19785/small/acatxTm8_400x400.jpg`,
    GRT: `${COINGECKO_CDN}/13397/small/Graph_Token.png`,
    RUNE: `${COINGECKO_CDN}/6595/small/Rune200x200.png`,
    KAS: `${COINGECKO_CDN}/25751/small/kaspa-icon-exchanges.png`,
    TIA: `${COINGECKO_CDN}/31967/small/tia.jpg`,
    JTO: `${COINGECKO_CDN}/33228/small/jto.png`,
    JUP: `${COINGECKO_CDN}/34188/small/jup.png`,
    BONK: `${COINGECKO_CDN}/28600/small/bonk.jpg`,
    WLD: `${COINGECKO_CDN}/31069/small/worldcoin.jpeg`,
    BLUR: `${COINGECKO_CDN}/28453/small/blur.png`,
    PYTH: `${COINGECKO_CDN}/31924/small/pyth.png`,
    STRK: `${COINGECKO_CDN}/26997/small/starknet.png`,
};

// Fallback to cryptocurrency icon CDN 
const CRYPTO_ICONS_CDN = 'https://cryptoicons.org/api/icon';

/**
 * Get token logo URL for a symbol
 * @param symbol Token symbol (e.g., 'BTC', 'ETH')
 * @returns URL to the token logo
 */
export const getTokenLogo = (symbol: string): string => {
    // Clean the symbol (remove USDT, BUSD suffixes)
    const cleanSymbol = symbol
        .replace(/USDT$/, '')
        .replace(/BUSD$/, '')
        .replace(/USD$/, '')
        .toUpperCase();

    // Check if we have a CoinGecko icon
    if (COINGECKO_ICONS[cleanSymbol]) {
        return COINGECKO_ICONS[cleanSymbol];
    }

    // Fallback to cryptoicons.org
    return `${CRYPTO_ICONS_CDN}/${cleanSymbol.toLowerCase()}/200`;
};

/**
 * Get base and quote symbols from a pair
 * @param pair Trading pair (e.g., 'BTCUSDT')
 * @returns { base: 'BTC', quote: 'USDT' }
 */
export const parsePairSymbols = (pair: string): { base: string; quote: string } => {
    const quoteAssets = ['USDT', 'BUSD', 'USDC', 'BTC', 'ETH', 'BNB'];

    for (const quote of quoteAssets) {
        if (pair.endsWith(quote)) {
            return {
                base: pair.slice(0, -quote.length),
                quote
            };
        }
    }

    // Default fallback
    return { base: pair, quote: 'USDT' };
};

/**
 * Generate a gradient placeholder for tokens without logos
 */
export const getPlaceholderGradient = (symbol: string): string => {
    // Generate consistent color based on symbol
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
        hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h1 = Math.abs(hash % 360);
    const h2 = (h1 + 40) % 360;

    return `linear-gradient(135deg, hsl(${h1}, 70%, 50%), hsl(${h2}, 70%, 40%))`;
};

export default {
    getTokenLogo,
    parsePairSymbols,
    getPlaceholderGradient
};
