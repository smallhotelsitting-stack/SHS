import { useState } from 'react';
import { ChevronLeft, ChevronRight, Home as HomeIcon, Hotel } from 'lucide-react';

interface MediaCarouselProps {
  images: string[];
  videos: string[];
  category: 'house' | 'hotel';
  altText: string;
}

export default function MediaCarousel({ images, videos, category, altText }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const allMedia = [...images, ...videos];
  const totalMedia = allMedia.length;

  if (totalMedia === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-900">
        {category === 'house' ? (
          <HomeIcon className="w-32 h-32 text-neutral-600" />
        ) : (
          <Hotel className="w-32 h-32 text-neutral-600" />
        )}
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalMedia - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === totalMedia - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentMedia = allMedia[currentIndex];
  const isVideo = currentIndex >= images.length;

  return (
    <div className="relative w-full h-full bg-neutral-900 group">
      {isVideo ? (
        <video
          src={currentMedia}
          controls
          className="w-full h-full object-cover"
          key={currentIndex}
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <img
          src={currentMedia}
          alt={`${altText} - ${currentIndex + 1}`}
          className="w-full h-full object-cover opacity-90"
        />
      )}

      {totalMedia > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition opacity-0 group-hover:opacity-100"
            aria-label="Previous media"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition opacity-0 group-hover:opacity-100"
            aria-label="Next media"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {allMedia.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition ${
                  index === currentIndex
                    ? 'bg-white w-3 h-3'
                    : 'bg-gray-400 hover:bg-gray-300'
                }`}
                aria-label={`Go to media ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
