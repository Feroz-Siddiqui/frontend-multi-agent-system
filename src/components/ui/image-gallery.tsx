/**
 * Shadcn-Compatible Image Gallery Component
 * 
 * Built entirely with Shadcn/ui components for perfect theme integration
 */

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent } from './card';
import { ScrollArea } from './scroll-area';
import { Skeleton } from './skeleton';
import { 
  Eye, 
  Download, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  X,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  title?: string;
  className?: string;
  maxPreviewImages?: number;
}

interface ImageState {
  loaded: boolean;
  error: boolean;
}

export function EnhancedImageGallery({ 
  images, 
  title = "Images", 
  className = "",
  maxPreviewImages = 4
}: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageStates, setImageStates] = useState<Record<number, ImageState>>({});
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set());

  // Preload images when dialog opens
  useEffect(() => {
    if (!isOpen || !images.length) return;

    const preloadImage = (index: number) => {
      if (preloadedImages.has(index)) return;

      const img = new Image();
      img.onload = () => {
        setPreloadedImages(prev => new Set([...prev, index]));
        setImageStates(prev => ({
          ...prev,
          [index]: { loaded: true, error: false }
        }));
      };
      img.onerror = () => {
        setImageStates(prev => ({
          ...prev,
          [index]: { loaded: true, error: true }
        }));
      };
      img.src = images[index];
    };

    // Preload current image and adjacent images
    preloadImage(currentIndex);
    if (currentIndex > 0) preloadImage(currentIndex - 1);
    if (currentIndex < images.length - 1) preloadImage(currentIndex + 1);
  }, [isOpen, currentIndex, images, preloadedImages]);

  const nextImage = useCallback(() => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images]);

  const prevImage = useCallback(() => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextImage();
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextImage, prevImage]);

  if (!images || images.length === 0) {
    return null;
  }

  const previewImages = images.slice(0, maxPreviewImages);
  const remainingCount = Math.max(0, images.length - maxPreviewImages);

  const handleImageLoad = (index: number) => {
    setImageStates(prev => ({
      ...prev,
      [index]: { loaded: true, error: false }
    }));
  };

  const handleImageError = (index: number) => {
    setImageStates(prev => ({
      ...prev,
      [index]: { loaded: true, error: true }
    }));
  };

  const openGallery = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `image-${index + 1}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ImagePreview = ({ src, index, onClick }: { src: string; index: number; onClick: () => void }) => {
    const [isHovered, setIsHovered] = useState(false);
    const state = imageStates[index] || { loaded: false, error: false };

    return (
      <div 
        className="relative aspect-square cursor-pointer overflow-hidden transition-all duration-200 bg-background border rounded-lg"
        style={{
          boxShadow: isHovered ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : undefined
        }}
        onClick={() => onClick()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {!state.loaded && (
          <Skeleton className="w-full h-full rounded-lg" />
        )}
        
        {state.error ? (
          <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
            <div className="text-center">
              <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Failed to load</p>
            </div>
          </div>
        ) : (
          <img
            src={src}
            alt={`Preview ${index + 1}`}
            className="w-full h-full object-cover transition-all duration-200 rounded-lg"
            style={{
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              opacity: state.loaded ? 1 : 0
            }}
            onLoad={() => handleImageLoad(index)}
            onError={() => handleImageError(index)}
          />
        )}
        
        {/* Hover overlay */}
        <div 
          className="absolute inset-0 transition-all duration-200 flex items-center justify-center rounded-lg pointer-events-none"
          style={{
            backgroundColor: isHovered ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0)'
          }}
        >
          <Eye 
            className="w-5 h-5 text-white transition-opacity"
            style={{
              opacity: isHovered ? 1 : 0
            }}
          />
        </div>
        
        {/* Download button */}
        <div
          className="absolute top-2 right-2 h-7 w-7 p-0 transition-opacity bg-background/80 hover:bg-background z-10 rounded-md border border-input shadow-sm hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center justify-center"
          style={{
            opacity: isHovered ? 1 : 0
          }}
          onClick={(e) => {
            e.stopPropagation();
            downloadImage(src, index);
          }}
        >
          <Download className="w-3 h-3" />
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          <Badge variant="secondary" className="text-xs">
            {images.length} image{images.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        {images.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openGallery(0)}
            className="text-xs h-8"
          >
            <Eye className="w-3 h-3 mr-1" />
            View All
          </Button>
        )}
      </div>

      {/* Preview Grid */}
      <div className="grid grid-cols-4 gap-2">
        {previewImages.map((imageUrl, index) => (
          <ImagePreview
            key={index}
            src={imageUrl}
            index={index}
            onClick={() => openGallery(index)}
          />
        ))}
        
        {/* Show remaining count */}
        {remainingCount > 0 && (
          <Card 
            className="aspect-square cursor-pointer bg-muted hover:bg-muted/80 transition-colors"
            onClick={() => openGallery(maxPreviewImages)}
          >
            <CardContent className="p-0 h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">+{remainingCount}</div>
                <div className="text-xs text-muted-foreground">more</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl w-full h-[95vh] p-0 gap-0 flex flex-col [&>button]:hidden">
          <DialogTitle className="sr-only">{title} Gallery</DialogTitle>
          <DialogDescription className="sr-only">
            View and navigate through {images.length} image{images.length !== 1 ? 's' : ''} in full screen
          </DialogDescription>
          
          {/* Compact Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">{title}</h3>
              <Badge variant="outline" className="text-xs">
                {currentIndex + 1} of {images.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadImage(images[currentIndex], currentIndex)}
                className="h-8 px-2"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(images[currentIndex], '_blank')}
                className="h-8 px-2"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Main Image Display - Takes most of the space */}
          <div className="flex-1 relative bg-muted/10 min-h-0">
            <div className="absolute inset-0 flex items-center justify-center p-2">
              {/* Loading state */}
              {!imageStates[currentIndex]?.loaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skeleton className="w-3/4 h-3/4 rounded-lg" />
                </div>
              )}
              
              {/* Error state */}
              {imageStates[currentIndex]?.error ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <AlertCircle className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">Failed to load image</p>
                  <p className="text-sm">Image {currentIndex + 1} could not be displayed</p>
                </div>
              ) : (
                <img
                  key={`dialog-image-${currentIndex}`} // Force re-render on index change
                  src={images[currentIndex]}
                  alt={`Image ${currentIndex + 1}`}
                  className={cn(
                    "max-w-full max-h-full object-contain rounded-lg shadow-lg transition-opacity duration-200",
                    imageStates[currentIndex]?.loaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => {
                    setImageStates(prev => ({
                      ...prev,
                      [currentIndex]: { loaded: true, error: false }
                    }));
                  }}
                  onError={() => {
                    setImageStates(prev => ({
                      ...prev,
                      [currentIndex]: { loaded: true, error: true }
                    }));
                  }}
                />
              )}
            </div>
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 p-0 bg-background/90 hover:bg-background shadow-lg"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 p-0 bg-background/90 hover:bg-background shadow-lg"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}
            
            {/* Image counter overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
          
          {/* Compact Thumbnail Strip - Only show if more than 1 image */}
          {images.length > 1 && (
            <div className="border-t bg-background/95 backdrop-blur-sm p-2">
              <ScrollArea className="w-full">
                <div className="flex gap-1 pb-1">
                  {images.map((imageUrl, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className={cn(
                        "h-12 w-12 p-0 flex-shrink-0 overflow-hidden rounded-md",
                        currentIndex === index && "ring-2 ring-primary"
                      )}
                      onClick={() => setCurrentIndex(index)}
                    >
                      <img
                        src={imageUrl}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                        }}
                      />
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple image preview component for smaller displays
export function ImagePreview({ 
  images, 
  maxImages = 3,
  className = ""
}: {
  images: string[];
  maxImages?: number;
  className?: string;
}) {
  if (!images || images.length === 0) {
    return null;
  }

  const displayImages = images.slice(0, maxImages);
  const remainingCount = Math.max(0, images.length - maxImages);

  return (
    <div className={cn("flex gap-1", className)}>
      {displayImages.map((imageUrl, index) => (
        <div key={index} className="relative w-8 h-8 rounded border overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={`Image ${index + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              target.parentElement!.innerHTML = '<div class="w-full h-full bg-muted flex items-center justify-center"><svg class="w-3 h-3 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg></div>';
            }}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center">
          <span className="text-xs text-muted-foreground font-medium">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
}

export default EnhancedImageGallery;
