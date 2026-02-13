import React, { useState, useEffect } from 'react';
import { Search, Star, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { getTokenLogo, parsePairSymbols, getPlaceholderGradient } from '../../utils/tokenLogos';
import { get24hTicker, Ticker24h } from '../../utils/binance';
import { MiniSparkline } from './PriceChart';

interface Pair {
    value: string;
    label: string;
}

interface PairSelectorProps {
    pairs: Pair[];
    selectedPair: string;
    onSelect: (pair: string) => void;
    disabled?: boolean;
}

const popularPairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];

// Token logo component with fallback
const TokenLogo: React.FC<{ symbol: string; size?: number }> = ({ symbol, size = 32 }) => {
    const [hasError, setHasError] = useState(false);
    const { base } = parsePairSymbols(symbol);
    const logoUrl = getTokenLogo(base);

    if (hasError) {
        return (
            <div
                className="rounded-lg flex items-center justify-center"
                style={{
                    width: size,
                    height: size,
                    background: getPlaceholderGradient(base)
                }}
            >
                <span className="text-white font-bold text-xs">
                    {base.slice(0, 2)}
                </span>
            </div>
        );
    }

    return (
        <img
            src={logoUrl}
            alt={base}
            className="rounded-lg object-cover"
            style={{ width: size, height: size }}
            onError={() => setHasError(true)}
        />
    );
};

// Price change badge component
const PriceChangeBadge: React.FC<{ symbol: string }> = ({ symbol }) => {
    const [ticker, setTicker] = useState<Ticker24h | null>(null);

    useEffect(() => {
        const fetchTicker = async () => {
            const data = await get24hTicker(symbol);
            setTicker(data);
        };
        fetchTicker();
    }, [symbol]);

    if (!ticker) {
        return <div className="w-12 h-4 bg-gray-700/50 rounded animate-pulse" />;
    }

    const isPositive = ticker.priceChangePercent >= 0;

    return (
        <div className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
            {isPositive ? (
                <TrendingUp className="w-3 h-3" />
            ) : (
                <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? '+' : ''}{ticker.priceChangePercent.toFixed(2)}%
        </div>
    );
};

export const PairSelector: React.FC<PairSelectorProps> = ({
    pairs,
    selectedPair,
    onSelect,
    disabled
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [favorites, setFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('favoritePairs');
        return saved ? JSON.parse(saved) : popularPairs;
    });

    const toggleFavorite = (pair: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newFavorites = favorites.includes(pair)
            ? favorites.filter(p => p !== pair)
            : [...favorites, pair];
        setFavorites(newFavorites);
        localStorage.setItem('favoritePairs', JSON.stringify(newFavorites));
    };

    const filteredPairs = pairs.filter(pair =>
        pair.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.value.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedPairData = pairs.find(p => p.value === selectedPair);

    return (
        <div className="space-y-2">
            <label className="input-label">Trading Pair</label>

            {/* Selected pair display / trigger */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          w-full p-4 rounded-xl text-left transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen
                        ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-light)]'
                    }
          border
        `}
            >
                {selectedPair ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TokenLogo symbol={selectedPair} size={40} />
                            <div>
                                <p className="font-semibold text-white">{selectedPairData?.label || selectedPair}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-500">{selectedPair}</p>
                                    <PriceChangeBadge symbol={selectedPair} />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MiniSparkline symbol={selectedPair} width={50} height={20} />
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500">Select a trading pair</span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Search */}
                    <div className="p-3 border-b border-[var(--color-border)]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search pairs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface-dark)] border border-[var(--color-border)] rounded-lg text-white text-sm focus:outline-none focus:border-[var(--color-primary)]"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Favorites */}
                    {!searchQuery && favorites.length > 0 && (
                        <div className="p-3 border-b border-[var(--color-border)]">
                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <Star className="w-3 h-3" /> Favorites
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {favorites.slice(0, 6).map(pair => (
                                    <button
                                        key={pair}
                                        type="button"
                                        onClick={() => {
                                            onSelect(pair);
                                            setIsOpen(false);
                                        }}
                                        className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                      ${selectedPair === pair
                                                ? 'bg-[var(--color-primary)] text-white'
                                                : 'bg-[var(--color-surface-light)] text-gray-300 hover:bg-[var(--color-surface-dark)]'
                                            }
                    `}
                                    >
                                        <TokenLogo symbol={pair} size={20} />
                                        <span className="font-medium">{pair.replace('USDT', '')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pair list */}
                    <div className="max-h-72 overflow-y-auto">
                        {filteredPairs.length > 0 ? (
                            filteredPairs.map(pair => {
                                const isFavorite = favorites.includes(pair.value);
                                const isSelected = selectedPair === pair.value;

                                return (
                                    <button
                                        key={pair.value}
                                        type="button"
                                        onClick={() => {
                                            onSelect(pair.value);
                                            setIsOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className={`
                      w-full p-3 flex items-center justify-between transition-colors
                      ${isSelected
                                                ? 'bg-[var(--color-primary)]/10'
                                                : 'hover:bg-[var(--color-surface-light)]'
                                            }
                    `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e) => toggleFavorite(pair.value, e)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFavorite(pair.value, e as any); } }}
                                                className="p-1 hover:bg-[var(--color-surface-dark)] rounded cursor-pointer"
                                            >
                                                <Star
                                                    className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                                                />
                                            </div>
                                            <TokenLogo symbol={pair.value} size={32} />
                                            <div className="text-left">
                                                <p className={`font-medium ${isSelected ? 'text-[var(--color-primary)]' : 'text-white'}`}>
                                                    {pair.label}
                                                </p>
                                                <p className="text-xs text-gray-500">{pair.value}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <PriceChangeBadge symbol={pair.value} />
                                            <MiniSparkline symbol={pair.value} width={40} height={16} />
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="p-6 text-center text-gray-500">
                                No pairs found for "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
