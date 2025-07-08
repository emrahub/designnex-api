import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useCanvas } from '../context/CanvasContext';
import { unifiedState } from '../store/unifiedState';
import { Zap } from 'lucide-react';
import ResponsiveProductViewer from './ResponsiveProductViewer';

interface CanvasProps {
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
  onObjectSelected: (obj: fabric.Object | null) => void;
  isPreviewExpanded?: boolean;
  onTogglePreview?: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ canvasRef, onObjectSelected, isPreviewExpanded = false, onTogglePreview }) => {
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, addToHistory } = useCanvas();
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const isDisposedRef = useRef(false);

  // Helper function to add timeout with tracking
  const addTimeout = (callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      timeoutRefs.current = timeoutRefs.current.filter(id => id !== timeoutId);
      
      if (!isDisposedRef.current && canvasRef.current && !canvasRef.current.isDisposed) {
        callback();
      }
    }, delay);
    timeoutRefs.current.push(timeoutId);
    return timeoutId;
  };

  // Helper function to clear all timeouts
  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current = [];
  };

  // Safe canvas operation wrapper
  const safeCanvasOperation = (operation: () => void) => {
    if (!isDisposedRef.current && canvasRef.current && !canvasRef.current.isDisposed) {
      try {
        operation();
      } catch (error) {
        console.error('Canvas operation failed:', error);
      }
    }
  };

  useEffect(() => {
    if (!canvasElementRef.current) return;

    console.log('🎨 DesignNex Canvas initializing...');
    isDisposedRef.current = false;

    // Professional DesignNex Canvas - Transparent for 3D sync but with white visual background
    const canvas = new fabric.Canvas(canvasElementRef.current, {
      width: 800,
      height: 600,
      backgroundColor: 'transparent', // Transparent for 3D texture export
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      skipOffscreen: false,
      enableRetinaScaling: true,
      allowTouchScrolling: false,
      imageSmoothingEnabled: true,
      isDrawingMode: false,
      selectionColor: 'rgba(59, 130, 246, 0.1)',
      selectionBorderColor: '#3b82f6',
      selectionLineWidth: 2
    });

    // Set canvas references
    canvasRef.current = canvas;
    setCanvas(canvas);

    // Initial render
    canvas.renderAll();
    
    console.log('✅ DesignNex Canvas initialized successfully');

    // Event handlers
    canvas.on('selection:created', (e) => {
      if (isDisposedRef.current) return;
      const target = e.selected?.[0] || e.target;
      onObjectSelected(target || null);
    });

    canvas.on('selection:updated', (e) => {
      if (isDisposedRef.current) return;
      const target = e.selected?.[0] || e.target;
      onObjectSelected(target || null);
    });

    canvas.on('selection:cleared', () => {
      if (isDisposedRef.current) return;
      onObjectSelected(null);
    });

    // Real-time sync function - non-blocking
    const performRealTimeSync = () => {
      if (isDisposedRef.current || !canvas || canvas.isDisposed) return;
      
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        try {
          const objects = canvas.getObjects();
          console.log('🚀 REAL-TIME SYNC triggered');
          console.log('📊 Canvas objects:', objects.length);
          console.log('📊 Canvas objects details:', objects.map(obj => ({
            type: obj.type,
            visible: obj.visible,
            left: obj.left,
            top: obj.top
          })));
          
          // Simple canvas update
          canvas.renderAll();
          unifiedState.canvas = canvas;
          
          // Simple direct sync
          try {
            const directDataURL = canvas.toDataURL({
              format: 'png',
              quality: 0.8,
              multiplier: 1
            });
            
            console.log('📊 Direct export data length:', directDataURL.length);
            console.log('📊 Direct export preview:', directDataURL.substring(0, 100));
            
            unifiedState.logoDecal = directDataURL;
            unifiedState.isLogoTexture = objects.length > 0;
            unifiedState.canvasDesign = directDataURL;
            
            console.log('✅ Quick sync completed - isLogoTexture:', objects.length > 0);
          } catch (directError) {
            console.log('⚠️ Sync skipped due to error:', directError);
          }
        } catch (error) {
          console.log('⚠️ Sync error (non-critical):', error);
        }
      });
    };

    // Debounced sync function with immediate sync option
    let debounceTimer: NodeJS.Timeout | null = null;
    const debouncedSync = (delay: number = 150) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        performRealTimeSync();
        debounceTimer = null;
      }, delay);
    };
    
    // Immediate sync function for instant updates
    const immediateSync = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      console.log('🚑 IMMEDIATE SYNC called');
      const objects = canvas.getObjects();
      console.log('🚑 Canvas has', objects.length, 'objects before immediate sync');
      performRealTimeSync();
    };

    // Object events with immediate sync for important changes
    canvas.on('object:added', (e) => {
      if (isDisposedRef.current) return;
      const addedObject = e.target;
      console.log('📝 Object added to canvas:', addedObject?.type);
      console.log('📝 Canvas total objects after add:', canvas.getObjects().length);
      immediateSync(); // Immediate sync for new objects
      addToHistory();
    });
    
    canvas.on('object:removed', () => {
      if (isDisposedRef.current) return;
      console.log('🗑️ Object removed from canvas');
      immediateSync(); // Immediate sync for removed objects
      addToHistory();
    });
    
    canvas.on('object:modified', () => {
      if (isDisposedRef.current) return;
      console.log('✏️ Object modified on canvas');
      immediateSync(); // Immediate sync for modifications
      addToHistory();
    });

    // Sync when interaction is complete
    canvas.on('mouse:up', () => {
      if (isDisposedRef.current) return;
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        console.log('🎯 Interaction completed - syncing');
        debouncedSync(100); // Faster sync for interactions
      }
    });

    // Path creation (drawing) - immediate sync
    canvas.on('path:created', () => {
      if (isDisposedRef.current) return;
      console.log('✏️ Path created on canvas');
      immediateSync(); // Immediate sync for new paths
      addToHistory();
    });
    
    // Selection events - immediate sync to update mini preview
    canvas.on('selection:created', () => {
      if (isDisposedRef.current) return;
      debouncedSync(50); // Very fast sync for selections
    });
    
    canvas.on('selection:updated', () => {
      if (isDisposedRef.current) return;
      debouncedSync(50); // Very fast sync for selection updates
    });
    
    canvas.on('selection:cleared', () => {
      if (isDisposedRef.current) return;
      debouncedSync(50); // Very fast sync when selection cleared
    });

    // Add initial state to history - with better timing
    addTimeout(() => {
      if (!isDisposedRef.current && canvas && !canvas.isDisposed) {
        console.log('📚 Adding initial canvas state to history');
        addToHistory();
      } else {
        console.log('⏳ Canvas not ready for initial history, skipping');
      }
    }, 1000);

    // Cleanup
    return () => {
      console.log('🧹 DesignNex Canvas cleaning up...');
      
      isDisposedRef.current = true;
      clearAllTimeouts();
      
      if (canvas && !canvas.isDisposed) {
        canvas.off();
        try {
          canvas.dispose();
        } catch (error) {
          console.error('Canvas dispose error:', error);
        }
      }
      
      canvasRef.current = null;
    };
  }, []);

  // PREVIEW TOGGLE MONITORING - Enhanced to trigger sync when needed
  useEffect(() => {
    if (canvasRef.current && !canvasRef.current.isDisposed) {
      const objects = canvasRef.current.getObjects();
      console.log('🔍 CANVAS EFFECT: Preview mode changed, canvas objects:', objects.length);
      console.log('🔍 CANVAS EFFECT: isPreviewExpanded:', isPreviewExpanded);
      
      if (objects.length === 0) {
        console.log('❌ CRITICAL: Canvas objects lost during preview toggle!');
        console.log('🚨 INVESTIGATION: Canvas objects disappeared during toggle!');
      } else {
        console.log('✅ Canvas objects preserved during toggle');
        // Trigger sync when objects are confirmed to exist
        if (typeof unifiedState.syncCanvasToThreeJS === 'function') {
          unifiedState.syncCanvasToThreeJS();
        }
      }
    }
  }, [isPreviewExpanded]);

  // Professional Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    
    if (canvasContainerRef.current) {
      canvasContainerRef.current.style.borderColor = '#3b82f6';
      canvasContainerRef.current.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
      canvasContainerRef.current.style.transform = 'scale(1.02)';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (canvasContainerRef.current) {
      canvasContainerRef.current.style.borderColor = '';
      canvasContainerRef.current.style.backgroundColor = '';
      canvasContainerRef.current.style.transform = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (canvasContainerRef.current) {
      canvasContainerRef.current.style.borderColor = '';
      canvasContainerRef.current.style.backgroundColor = '';
      canvasContainerRef.current.style.transform = '';
    }
    
    const data = e.dataTransfer?.getData('text/plain');
    
    if (!data || isDisposedRef.current || !canvasRef.current || canvasRef.current.isDisposed) {
      return;
    }
    
    try {
      const dropData = JSON.parse(data);
      
      if (dropData.type === 'design') {
        const canvasElement = canvasRef.current.getElement();
        const canvasRect = canvasElement.getBoundingClientRect();
        const clientX = e.clientX - canvasRect.left;
        const clientY = e.clientY - canvasRect.top;
        
        const designObject = new fabric.Text(dropData.preview, {
          left: clientX,
          top: clientY,
          fontSize: 80,
          originX: 'center',
          originY: 'center',
          selectable: true,
          moveable: true,
          name: `design_${dropData.id}_${Date.now()}`,
          fill: '#fbbf24',
          fontFamily: 'Arial',
          fontWeight: 'bold',
          opacity: 1,
          visible: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          borderColor: '#f59e0b',
          cornerColor: '#f59e0b',
          cornerSize: 15,
          stroke: '#ffffff',
          strokeWidth: 1
        });
        
        safeCanvasOperation(() => {
          canvasRef.current!.add(designObject);
          canvasRef.current!.setActiveObject(designObject);
          canvasRef.current!.renderAll();
        });
        
        addToHistory();
      }
    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  return (
    <div className={`flex-1 flex p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 gap-6 transition-all duration-500`}>
      {/* Sol Taraf - 3D Preview - Expandable */}
      <div className={`flex-shrink-0 transition-all duration-500 ${isPreviewExpanded ? 'w-full' : 'w-80'}`}>
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 h-full">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">3D Preview</h3>
                  <p className="text-xs text-gray-500">Live T-shirt visualization</p>
                </div>
              </div>
              
              {onTogglePreview && (
                <button
                  onClick={onTogglePreview}
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {isPreviewExpanded ? 'Minimize' : 'Expand'}
                </button>
              )}
            </div>
          </div>
          
          <div className={`transition-all duration-500 ${isPreviewExpanded ? 'p-2 h-[calc(100vh-180px)]' : 'p-4 h-96'}`}>
            <div className={`w-full h-full ${isPreviewExpanded ? 'bg-white' : 'bg-gradient-to-br from-gray-50 to-blue-50'} rounded-xl border-2 border-gray-200 ${isPreviewExpanded ? 'overflow-visible' : 'overflow-hidden'}`}>
              <ResponsiveProductViewer 
                productType="tshirt" 
                isFullscreen={isPreviewExpanded}
                className="w-full h-full"
              />
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live Preview</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs">{unifiedState.isLogoTexture ? '✅' : '❌'}</span>
                <span className="text-xs">{isPreviewExpanded ? 'Full Screen' : 'Mini'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Main Canvas - Always rendered, hidden with CSS when expanded */}
      <div className={`${isPreviewExpanded ? 'hidden' : 'flex-1'} flex items-center justify-center transition-all duration-500`}>
        <div 
          ref={canvasContainerRef}
          className="relative border-2 border-gray-300 rounded-2xl transition-all duration-300 bg-white shadow-2xl"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ 
            width: '820px',
            height: '620px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <canvas
            ref={canvasElementRef}
            className="rounded-xl"
            width={800}
            height={600}
            style={{ 
              backgroundColor: '#ffffff',
              backgroundImage: `
                linear-gradient(45deg, #f8f8f8 25%, transparent 25%), 
                linear-gradient(-45deg, #f8f8f8 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #f8f8f8 75%), 
                linear-gradient(-45deg, transparent 75%, #f8f8f8 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          />
          
          {/* Professional Canvas Status */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm border border-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="font-medium">DesignNex Canvas • Ready for Creation</span>
            </div>
          </div>

          {/* Professional Corner Branding */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-700">DesignNex</span>
            </div>
          </div>

          {/* Drop Zone Indicator */}
          <div className="absolute inset-4 border-2 border-dashed border-transparent rounded-xl pointer-events-none transition-all duration-300" />
        </div>
      </div>
    </div>
  );
};

export default Canvas;