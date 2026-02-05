import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface GridPriceVisualizationProps {
    upperPrice: number;
    lowerPrice: number;
    gridSize: number;
    currentPrice?: number;
    symbol?: string;
}

export const GridPriceVisualization: React.FC<GridPriceVisualizationProps> = ({
    upperPrice,
    lowerPrice,
    gridSize,
    currentPrice,
    symbol
}) => {
    const [animatedPrice, setAnimatedPrice] = useState(currentPrice);

    useEffect(() => {
        setAnimatedPrice(currentPrice);
    }, [currentPrice]);

    // Calculate grid levels
    const priceRange = upperPrice - lowerPrice;
    const gridStep = priceRange / (gridSize - 1);
    const gridLevels = Array.from({ length: gridSize }, (_, i) =>
        upperPrice - (i * gridStep)
    );

    // Calculate current price position percentage
    const currentPricePosition = currentPrice
        ? ((upperPrice - currentPrice) / priceRange) * 100
        : 50;

    const isWithinRange = currentPrice && currentPrice >= lowerPrice && currentPrice <= upperPrice;

    const formatPrice = (price: number) => {
        if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
        if (price >= 1) return price.toFixed(4);
        return price.toFixed(6);
    };

    return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--color-primary)]" />
                    <span className="text-sm font-medium text-white">Grid Price Levels</span>
                </div>
                {symbol && (
                    <span className="text-xs text-gray-500">{symbol}</span>
                )}
            </div>

            {/* Current Price Indicator */}
            {currentPrice && (
                <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-[var(--color-surface-light)] border border-[var(--color-border)]">
                    <span className="text-sm text-gray-400">Current Price</span>
                    <div className="flex items-center gap-2">
                        {isWithinRange ? (
                            <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-[var(--color-warning)]" />
                        )}
                        <span className="text-lg font-bold text-white">${formatPrice(animatedPrice || currentPrice)}</span>
                    </div>
                </div>
            )}

            {/* Grid Visualization */}
            <div className="relative">
                {/* Price range bar */}
                <div className="relative h-64 flex">
                    {/* Left side - Grid lines */}
                    <div className="w-full relative bg-[var(--color-surface-dark)] rounded-lg overflow-hidden">
                        {/* Grid level lines */}
                        {gridLevels.map((price, index) => {
                            const position = (index / (gridSize - 1)) * 100;
                            const isTop = index === 0;
                            const isBottom = index === gridSize - 1;

                            return (
                                <div
                                    key={index}
                                    className="absolute left-0 right-0 flex items-center"
                                    style={{ top: `${position}%`, transform: 'translateY(-50%)' }}
                                >
                                    {/* Line */}
                                    <div
                                        className={`flex-1 h-px ${isTop || isBottom
                                                ? 'bg-[var(--color-primary)]'
                                                : 'bg-[var(--color-border)]'
                                            }`}
                                    />
                                    {/* Price label */}
                                    <div
                                        className={`absolute right-2 text-xs font-mono ${isTop || isBottom ? 'text-[var(--color-primary)]' : 'text-gray-500'
                                            }`}
                                    >
                                        ${formatPrice(price)}
                                    </div>
                                    {/* Grid number */}
                                    <div
                                        className="absolute left-2 text-xs text-gray-600"
                                    >
                                        #{index + 1}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Current price indicator */}
                        {currentPrice && isWithinRange && (
                            <div
                                className="absolute left-0 right-0 flex items-center z-10 transition-all duration-500"
                                style={{ top: `${currentPricePosition}%`, transform: 'translateY(-50%)' }}
                            >
                                <div className="flex-1 h-0.5 bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]" />
                                <div className="absolute left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[var(--color-accent)] text-white text-xs font-bold shadow-lg">
                                    CURRENT
                                </div>
                            </div>
                        )}

                        {/* Out of range indicator */}
                        {currentPrice && !isWithinRange && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center p-4">
                                    <TrendingDown className="w-8 h-8 text-[var(--color-warning)] mx-auto mb-2" />
                                    <p className="text-sm text-[var(--color-warning)]">
                                        Current price is {currentPrice > upperPrice ? 'above' : 'below'} grid range
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 bg-[var(--color-primary)]" />
                            <span>Boundary</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 bg-[var(--color-border)]" />
                            <span>Grid Level</span>
                        </div>
                        {currentPrice && (
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-0.5 bg-[var(--color-accent)]" />
                                <span>Current</span>
                            </div>
                        )}
                    </div>
                    <span>{gridSize} Grids</span>
                </div>
            </div>
        </div>
    );
};

// Compact version for inline display
export const GridPreview: React.FC<{
    upperPrice?: number;
    lowerPrice?: number;
    gridSize: number;
    currentPrice?: number;
}> = ({ upperPrice, lowerPrice, gridSize, currentPrice }) => {
    if (!upperPrice || !lowerPrice) return null;

    const priceRange = upperPrice - lowerPrice;
    const currentPricePosition = currentPrice
        ? Math.max(0, Math.min(100, ((upperPrice - currentPrice) / priceRange) * 100))
        : null;

    return (
        <div className="flex items-center gap-3 p-3 bg-[var(--color-surface-light)] rounded-lg">
            {/* Mini grid visualization */}
            <div className="relative w-8 h-16 bg-[var(--color-surface-dark)] rounded">
                {/* Grid lines */}
                {Array.from({ length: gridSize }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute left-0 right-0 h-px bg-[var(--color-border)]"
                        style={{ top: `${(i / (gridSize - 1)) * 100}%` }}
                    />
                ))}
                {/* Current price dot */}
                {currentPricePosition !== null && (
                    <div
                        className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_4px_var(--color-accent)]"
                        style={{ top: `${currentPricePosition}%`, transform: 'translate(-50%, -50%)' }}
                    />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Upper</span>
                    <span className="text-white font-mono">${upperPrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-500">Lower</span>
                    <span className="text-white font-mono">${lowerPrice.toLocaleString()}</span>
                </div>
                {currentPrice && (
                    <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-gray-500">Current</span>
                        <span className="text-[var(--color-accent)] font-mono font-bold">${currentPrice.toLocaleString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
