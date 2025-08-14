/**
 * Test component for EnhancedImageGallery
 * Use this to test the image gallery functionality independently
 */

import { EnhancedImageGallery } from './image-gallery';

// Sample test images
const testImages = [
  'https://picsum.photos/400/300?random=1',
  'https://picsum.photos/400/300?random=2',
  'https://picsum.photos/400/300?random=3',
  'https://picsum.photos/400/300?random=4',
  'https://picsum.photos/400/300?random=5',
];

export function ImageGalleryTest() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Image Gallery Test</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Test Gallery with Sample Images</h2>
          <EnhancedImageGallery
            images={testImages}
            title="Test Images"
            maxPreviewImages={4}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Empty Gallery Test</h2>
          <EnhancedImageGallery
            images={[]}
            title="Empty Gallery"
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Single Image Test</h2>
          <EnhancedImageGallery
            images={[testImages[0]]}
            title="Single Image"
          />
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click on any image thumbnail to open the gallery dialog</li>
            <li>Check browser console for debug logs</li>
            <li>Use arrow keys or navigation buttons to browse images</li>
            <li>Press Escape or click X to close the dialog</li>
            <li>Test download and external link buttons</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default ImageGalleryTest;
