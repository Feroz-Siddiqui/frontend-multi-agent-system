/**
 * ResponsiveImageGallery Component
 * A responsive image gallery component built with react-image-gallery and ShadCN UI
 */

import React from 'react';
import ImageGallery, { type ReactImageGalleryItem } from 'react-image-gallery';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-image-gallery/styles/css/image-gallery.css';

export interface ResponsiveImageItem {
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  source?: string;
  alt?: string;
  downloadUrl?: string;
}

interface ResponsiveImageGalleryProps {
  images: ResponsiveImageItem[];
  showThumbnails?: boolean;
  showFullscreenButton?: boolean;
  showPlayButton?: boolean;
  autoPlay?: boolean;
  slideInterval?: number;
  className?: string;
  onImageClick?: (image: ResponsiveImageItem, index: number) => void;
}

export function ResponsiveImageGallery({
  images,
  showThumbnails = true,
  showFullscreenButton = true,
  showPlayButton = false,
  autoPlay = false,
  slideInterval = 3000,
  className,
  onImageClick
}: ResponsiveImageGalleryProps) {
  // Convert our image format to react-image-gallery format
  const galleryItems: ReactImageGalleryItem[] = images.map((image, index) => ({
    original: image.url,
    thumbnail: image.thumbnail || image.url,
    description: image.title || image.description,
    originalAlt: image.alt || image.title || `Image ${index + 1}`,
    thumbnailAlt: image.alt || image.title || `Thumbnail ${index + 1}`,
    renderItem: () => (
      <div className="relative">
        <img
          src={image.url}
          alt={image.alt || image.title || `Image ${index + 1}`}
          className="w-full h-auto max-h-[500px] object-contain rounded-lg"
          onClick={() => onImageClick?.(image, index)}
        />
        
        {/* Overlay with image info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0">
              {image.title && (
                <h3 className="text-white font-medium text-sm truncate mb-1">
                  {image.title}
                </h3>
              )}
              {image.description && (
                <p className="text-white/80 text-xs line-clamp-2">
                  {image.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-3">
              {image.source && (
                <Badge variant="secondary" className="text-xs">
                  {image.source}
                </Badge>
              )}
              
              <div className="flex gap-1">
                {image.url && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(image.url, '_blank');
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
                
                {image.downloadUrl && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      const link = document.createElement('a');
                      link.href = image.downloadUrl!;
                      link.download = image.title || `image-${index + 1}`;
                      link.click();
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }));

  if (images.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-8 text-center">
          <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No images available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-0">
        <div className="responsive-image-gallery-wrapper">
          <ImageGallery
            items={galleryItems}
            showThumbnails={showThumbnails}
            showFullscreenButton={showFullscreenButton}
            showPlayButton={showPlayButton}
            autoPlay={autoPlay}
            slideInterval={slideInterval}
            showNav={images.length > 1}
            showBullets={images.length > 1 && images.length <= 5}
            thumbnailPosition="bottom"
            useBrowserFullscreen={true}
            lazyLoad={true}
            additionalClass="shadcn-image-gallery"
          />
        </div>
        
        {/* Image counter */}
        {images.length > 1 && (
          <div className="p-3 border-t bg-muted/30">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{images.length} images</span>
              <span>Swipe or use arrows to navigate</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Single responsive image component for simple use cases
interface ResponsiveImageProps {
  src: string;
  alt?: string;
  title?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function ResponsiveImage({
  src,
  alt,
  title,
  className,
  aspectRatio = 'auto',
  fallbackSrc,
  onLoad,
  onError
}: ResponsiveImageProps) {
  const [imageSrc, setImageSrc] = React.useState(src);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      return;
    }
    onError?.();
  };

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: ''
  }[aspectRatio];

  return (
    <div className={cn('relative overflow-hidden rounded-lg', aspectRatioClass, className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <Eye className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={alt || title || 'Image'}
        title={title}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          hasError ? 'hidden' : ''
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {hasError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-center">
            <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load image</p>
          </div>
        </div>
      )}
      
      {title && !isLoading && !hasError && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <p className="text-white text-sm font-medium truncate">{title}</p>
        </div>
      )}
    </div>
  );
}
