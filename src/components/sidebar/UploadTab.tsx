import React, { useRef } from 'react';
import { fabric } from 'fabric';
import { Upload, FileImage, AlertCircle } from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';
import { unifiedState } from '../../store/unifiedState';

interface UploadTabProps {
  canvasRef?: React.MutableRefObject<fabric.Canvas | null>;
}

const UploadTab: React.FC<UploadTabProps> = () => {
  const { canvas, addToHistory } = useCanvas();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      fabric.Image.fromURL(imageUrl, (img) => {
        const centerX = canvas.width! / 2;
        const centerY = canvas.height! / 2;
        
        const maxWidth = 300;
        const maxHeight = 300;
        const scaleX = maxWidth / img.width!;
        const scaleY = maxHeight / img.height!;
        const scale = Math.min(scaleX, scaleY);

        img.set({
          left: centerX,
          top: centerY,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          name: `image_${Date.now()}`,
          borderColor: '#3b82f6',
          cornerColor: '#3b82f6',
          cornerSize: 12
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        
        // Ensure rendering with multiple render calls for visibility
        canvas.renderAll();
        
        requestAnimationFrame(() => {
          if (canvas && !canvas.isDisposed) {
            canvas.renderAll();
            
            // Additional render after 100ms to ensure visibility
            setTimeout(() => {
              if (canvas && !canvas.isDisposed) {
                canvas.renderAll();
                console.log('🖼️ Image object final render completed');
              }
            }, 100);
          }
        });
        
        // Ensure unified state has current canvas
        unifiedState.canvas = canvas;
        
        // Immediate sync - no waiting
        console.log('🚀 IMMEDIATE SYNC after image upload');
        try {
          unifiedState.syncCanvasToThreeJS();
          console.log('✅ Image immediately synced to 3D');
        } catch (syncError) {
          console.error('❌ Immediate sync failed:', syncError);
        }
        
        addToHistory();
      });
    };
    
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <FileImage className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Upload Image</h3>
        </div>
        <p className="text-sm text-gray-600">
          Add your own images to the design
        </p>
      </div>

      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <button 
          onClick={triggerFileInput} 
          className="w-full bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-8 text-center transition-all duration-200 hover:shadow-lg group"
        >
          <div className="flex flex-col items-center space-y-4">
            <Upload className="w-12 h-12 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
            <div>
              <div className="text-lg font-semibold text-gray-900 mb-1">
                Choose Image
              </div>
              <div className="text-sm text-gray-500">
                PNG, JPG, GIF up to 10MB
              </div>
            </div>
          </div>
        </button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Tips for best results:
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Use high-resolution images (300 DPI or higher)</li>
                <li>• PNG files with transparent backgrounds work best</li>
                <li>• Square images (1:1 ratio) are recommended</li>
                <li>• Ensure you have rights to use the image commercially</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadTab;