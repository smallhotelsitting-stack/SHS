import { useRef, useEffect, useState } from 'react';
import { Hotel, Home, Coffee, PawPrint } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ListingCategory } from '../types/database';

interface CategoryCarouselProps {
  value: ListingCategory | string;
  onChange: (category: ListingCategory | string) => void;
  customCategories?: any[];
  onCustomCategoryChange?: (categoryId: string | null) => void;
}

const STANDARD_CATEGORIES = [
  { id: 'hotel', label: 'Hotel', icon: Hotel, color: 'bg-hotel-500' },
  { id: 'house', label: 'House', icon: Home, color: 'bg-house-400' },
];

export function CategoryCarousel({
  value,
  onChange,
  customCategories = [],
  onCustomCategoryChange,
}: CategoryCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  const handleStandardCategoryClick = (categoryId: string) => {
    onChange(categoryId as ListingCategory);
    if (onCustomCategoryChange) {
      onCustomCategoryChange(null);
    }
  };

  const handleCustomCategoryClick = (categoryId: string) => {
    onChange(categoryId);
    if (onCustomCategoryChange) {
      onCustomCategoryChange(categoryId);
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-neutral-500 mb-4 uppercase tracking-wider">
        Property Type
      </label>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow border border-neutral-200"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-600" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-0"
          onScroll={checkScroll}
        >
          {STANDARD_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = value === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleStandardCategoryClick(cat.id)}
                className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all whitespace-nowrap ${
                  isSelected
                    ? `${cat.color} text-white border-${cat.color.split('-')[1]}-600 shadow-md`
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="font-semibold">{cat.label}</span>
              </button>
            );
          })}

          {customCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCustomCategoryClick(cat.id)}
              className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all whitespace-nowrap ${
                value === cat.id
                  ? 'bg-primary-600 text-white border-primary-700 shadow-md'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <span className="font-semibold">{cat.name}</span>
            </button>
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow border border-neutral-200"
          >
            <ChevronRight className="w-5 h-5 text-neutral-600" />
          </button>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
