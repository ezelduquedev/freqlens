import React, { useEffect, useState, useRef } from 'react';

interface TextCarouselProps {
  /** List of text items to display */
  items: string[];
  /** Number of items visible at once */
  visibleCount?: number;
  /** Auto‑slide interval in milliseconds */
  autoSlideInterval?: number;
  /** Show navigation arrows (optional) */
  showArrows?: boolean;
}

export const TextCarousel: React.FC<TextCarouselProps> = ({
  items,
  visibleCount = 4,
  autoSlideInterval = 4000,
  showArrows = true,
}) => {
  const [current, setCurrent] = useState(0);
  const length = items.length;
  const timeoutRef = useRef<number | null>(null);

  // Ensure at least one visible item
  const visible = Math.max(1, visibleCount);

  // Auto‑slide effect
  useEffect(() => {
    if (length <= visible) return; // no need to slide
    const tick = () => {
      setCurrent((prev) => (prev + 1) % length);
    };
    timeoutRef.current = window.setInterval(tick, autoSlideInterval);
    return () => {
      if (timeoutRef.current) clearInterval(timeoutRef.current);
    };
  }, [length, visible, autoSlideInterval]);

  // Manual navigation (optional)
  const goPrev = () => {
    setCurrent((prev) => (prev - 1 + length) % length);
  };
  const goNext = () => {
    setCurrent((prev) => (prev + 1) % length);
  };

  // Compute transform percentage based on current index
  const translatePct = -(current * (100 / visible));

  return (
    <div className="relative overflow-hidden w-full">
      {/* Items container */}
      <div
        className="flex"
        style={{
          width: `${(length * 100) / visible}%`,
          transform: `translateX(${translatePct}%)`,
          transition: 'transform 0.5s ease-in-out',
        }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-center mx-2"
            style={{ width: `${100 / length}%` }}
          >
            <span className="mono text-[10px] text-text-muted flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
              {item}
            </span>
          </div>
        ))}
      </div>

      {/* Optional navigation arrows */}
      {showArrows && length > visible && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Previous"
          >
            ◀
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Next"
          >
            ▶
          </button>
        </>
      )}
    </div>
  );
};
