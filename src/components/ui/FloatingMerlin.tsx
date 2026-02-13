import React, { useMemo } from 'react';

/**
 * FloatingMerlin - Ambient background MERLIN mascot decorations
 * Random positions, sizes, and animation delays for a living feel.
 */

const MERLIN_IMAGES = [
    '/MERLIN.jpg',
    '/MERLIN_DANCE.jpg',
    '/MERLIN_FLY.jpg',
    '/MERLIN_FOLD.jpg',
    '/MERLIN_HANDS.jpg',
    '/MERLIN_HEAD.jpg',
    '/MERLIN_HI.png',
    '/MERLIN_POINT.jpg',
    '/MERLIN_POINT2.jpg',
    '/MERLIN_POTRAIT.jpg',
    '/MERLIN_SIDES.jpg',
];

interface FloatingItem {
    src: string;
    x: number;     // % from left
    y: number;     // % from top
    size: number;  // px
    delay: number; // animation delay in seconds
    duration: number; // animation duration in seconds
    rotation: number;
    opacity: number;
}

const FloatingMerlin: React.FC = () => {
    const items = useMemo<FloatingItem[]>(() => {
        const result: FloatingItem[] = [];
        // Pick ~5 random Merlin images spread around the viewport
        const count = 5;
        const shuffled = [...MERLIN_IMAGES].sort(() => Math.random() - 0.5);

        for (let i = 0; i < count; i++) {
            result.push({
                src: shuffled[i % shuffled.length],
                x: 5 + (i * 20) + Math.random() * 12,      // spread across width
                y: 10 + Math.random() * 70,                  // random vertical
                size: 60 + Math.random() * 60,               // 60-120px
                delay: i * 1.5 + Math.random() * 2,          // staggered start
                duration: 12 + Math.random() * 10,            // 12-22s float cycle
                rotation: -15 + Math.random() * 30,           // -15° to +15°
                opacity: 0.06 + Math.random() * 0.06,         // 6-12% opacity — really subtle
            });
        }

        return result;
    }, []);

    return (
        <div className="merlin-floating-container" aria-hidden="true">
            {items.map((item, i) => (
                <div
                    key={i}
                    className="merlin-floating-item"
                    style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        width: `${item.size}px`,
                        height: `${item.size}px`,
                        animationDelay: `${item.delay}s`,
                        animationDuration: `${item.duration}s`,
                        transform: `rotate(${item.rotation}deg)`,
                        opacity: item.opacity,
                    }}
                >
                    <img
                        src={item.src}
                        alt=""
                        className="merlin-floating-img"
                        loading="lazy"
                        draggable={false}
                    />
                    <div className="merlin-glow" />
                </div>
            ))}
        </div>
    );
};

export default FloatingMerlin;
