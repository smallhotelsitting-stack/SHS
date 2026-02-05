import { useState } from 'react';
import { Upload, X, ChevronUp, ChevronDown, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

interface MediaManagerProps {
  images: string[];
  videos: string[];
  onImagesChange: (images: string[]) => void;
  onVideosChange: (videos: string[]) => void;
  onFileUpload: (files: File[]) => Promise<{ images: string[], videos: string[] }>;
  maxImages?: number;
  maxVideos?: number;
  uploading?: boolean;
}

export default function MediaManager({
  images,
  videos,
  onImagesChange,
  onVideosChange,
  onFileUpload,
  maxImages = 10,
  maxVideos = 3,
  uploading = false
}: MediaManagerProps) {
  const [dragActive, setDragActive] = useState(false);

  const canAddMore = images.length < maxImages || videos.length < maxVideos;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await processFiles(files);
      e.target.value = '';
    }
  };

  const processFiles = async (files: File[]) => {
    const currentImageCount = images.length;
    const currentVideoCount = videos.length;

    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 52428800;

      if (isImage && currentImageCount >= maxImages) return false;
      if (isVideo && currentVideoCount >= maxVideos) return false;

      return (isImage || isVideo) && isValidSize;
    });

    if (validFiles.length > 0) {
      const { images: newImages, videos: newVideos } = await onFileUpload(validFiles);
      onImagesChange([...images, ...newImages]);
      onVideosChange([...videos, ...newVideos]);
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    onVideosChange(videos.filter((_, i) => i !== index));
  };

  const moveImageUp = (index: number) => {
    if (index > 0) {
      const newImages = [...images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      onImagesChange(newImages);
    }
  };

  const moveImageDown = (index: number) => {
    if (index < images.length - 1) {
      const newImages = [...images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      onImagesChange(newImages);
    }
  };

  const moveVideoUp = (index: number) => {
    if (index > 0) {
      const newVideos = [...videos];
      [newVideos[index - 1], newVideos[index]] = [newVideos[index], newVideos[index - 1]];
      onVideosChange(newVideos);
    }
  };

  const moveVideoDown = (index: number) => {
    if (index < videos.length - 1) {
      const newVideos = [...videos];
      [newVideos[index], newVideos[index + 1]] = [newVideos[index + 1], newVideos[index]];
      onVideosChange(newVideos);
    }
  };

  return (
    <div className="space-y-6">
      {canAddMore && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 bg-white'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="media-upload"
            disabled={uploading}
          />
          <div className="flex flex-col items-center justify-center text-center pointer-events-none">
            <Upload className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">
              {dragActive ? 'Drop files here' : 'Drop files here or click to upload'}
            </p>
            <p className="text-xs text-gray-500">
              Images ({images.length}/{maxImages}) & Videos ({videos.length}/{maxVideos}) - Max 50MB each
            </p>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <span className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Images ({images.length}/{maxImages})
            </span>
          </label>
          <div className="space-y-3">
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-gray-50"
              >
                <img
                  src={imageUrl}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23ddd" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="flex-1 text-xs text-gray-600 truncate">{imageUrl}</div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveImageUp(index)}
                    disabled={index === 0}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImageDown(index)}
                    disabled={index === images.length - 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-2 text-red-600 hover:text-red-700"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <span className="flex items-center gap-2">
              <VideoIcon className="w-4 h-4" />
              Videos ({videos.length}/{maxVideos})
            </span>
          </label>
          <div className="space-y-3">
            {videos.map((videoUrl, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-gray-50"
              >
                <div className="w-20 h-20 bg-gray-800 rounded flex items-center justify-center">
                  <VideoIcon className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1 text-xs text-gray-600 truncate">{videoUrl}</div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveVideoUp(index)}
                    disabled={index === 0}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveVideoDown(index)}
                    disabled={index === videos.length - 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="p-2 text-red-600 hover:text-red-700"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
