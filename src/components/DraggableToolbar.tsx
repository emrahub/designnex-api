import React, { useState, useRef, useEffect } from 'react';
import { 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Trash2,
  Copy,
  Layers,
  Move,
  Grip,
  Palette,
  Paintbrush,
  Circle,
  Minus
} from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';
import { unifiedState } from '../store/unifiedState';

interface DraggableToolbarProps {
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
  defaultPosition?: { x: number; y: number };
}

const DraggableToolbar: React.FC<DraggableToolbarProps> = ({ canvasRef, defaultPosition = { x: 20, y: 100 } }) => {
  const { canUndo, canRedo, undo, redo } = useCanvas();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(defaultPosition);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === toolbarRef.current || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  };

  // Track selected object
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    const handleSelection = (e: any) => {
      const activeObject = e.selected?.[0] || e.target;
      setSelectedObject(activeObject || null);
    };

    const handleSelectionCleared = () => {
      setSelectedObject(null);
      setShowColorPanel(false);
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleSelectionCleared);

    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleSelectionCleared);
    };
  }, [canvasRef.current]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        const maxX = window.innerWidth - (toolbarRef.current?.offsetWidth || 0);
        const maxY = window.innerHeight - (toolbarRef.current?.offsetHeight || 0);
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(64, Math.min(newY, maxY)) // 64px for top toolbar
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Canvas controls
  const handleZoomIn = () => {
    if (!canvasRef.current) return;
    const zoom = canvasRef.current.getZoom();
    canvasRef.current.setZoom(Math.min(zoom * 1.2, 3));
  };

  const handleZoomOut = () => {
    if (!canvasRef.current) return;
    const zoom = canvasRef.current.getZoom();
    canvasRef.current.setZoom(Math.max(zoom / 1.2, 0.3));
  };

  const handleReset = () => {
    if (!canvasRef.current) return;
    canvasRef.current.setZoom(1);
    const objects = canvasRef.current.getObjects();
    if (objects.length > 0) {
      canvasRef.current.viewportCenterObject(objects[0]);
    }
    canvasRef.current.renderAll();
  };

  const handleDelete = () => {
    if (!canvasRef.current) return;
    const activeObject = canvasRef.current.getActiveObject();
    if (activeObject) {
      canvasRef.current.remove(activeObject);
      canvasRef.current.renderAll();
      
      // Sync to 3D after delete
      setTimeout(() => {
        unifiedState.syncCanvasToThreeJS();
        console.log('🗑️ Object deleted - syncing to 3D');
      }, 100);
    }
  };

  const handleCopy = () => {
    if (!canvasRef.current) return;
    const activeObject = canvasRef.current.getActiveObject();
    if (activeObject) {
      activeObject.clone((cloned: fabric.Object) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        canvasRef.current!.add(cloned);
        canvasRef.current!.setActiveObject(cloned);
        canvasRef.current!.renderAll();
        
        // Sync to 3D after copy
        setTimeout(() => {
          unifiedState.syncCanvasToThreeJS();
          console.log('📋 Object copied - syncing to 3D');
        }, 150);
      });
    }
  };

  const handleBringToFront = () => {
    if (!canvasRef.current) return;
    const activeObject = canvasRef.current.getActiveObject();
    if (activeObject) {
      canvasRef.current.bringToFront(activeObject);
      canvasRef.current.renderAll();
      
      // Sync to 3D after layer change
      setTimeout(() => {
        unifiedState.syncCanvasToThreeJS();
        console.log('📚 Layer changed - syncing to 3D');
      }, 100);
    }
  };

  // Color control functions
  const handleFillColorChange = (color: string) => {
    if (!canvasRef.current || !selectedObject) return;
    
    selectedObject.set('fill', color);
    canvasRef.current.renderAll();
    
    setTimeout(() => {
      unifiedState.syncCanvasToThreeJS();
      console.log('🎨 Fill color changed - syncing to 3D');
    }, 100);
  };

  const handleStrokeColorChange = (color: string) => {
    if (!canvasRef.current || !selectedObject) return;
    
    selectedObject.set('stroke', color);
    canvasRef.current.renderAll();
    
    setTimeout(() => {
      unifiedState.syncCanvasToThreeJS();
      console.log('🖌️ Stroke color changed - syncing to 3D');
    }, 100);
  };

  const handleStrokeWidthChange = (width: number) => {
    if (!canvasRef.current || !selectedObject) return;
    
    selectedObject.set('strokeWidth', width);
    canvasRef.current.renderAll();
    
    setTimeout(() => {
      unifiedState.syncCanvasToThreeJS();
      console.log('📏 Stroke width changed - syncing to 3D');
    }, 100);
  };

  const handleOpacityChange = (opacity: number) => {
    if (!canvasRef.current || !selectedObject) return;
    
    selectedObject.set('opacity', opacity);
    canvasRef.current.renderAll();
    
    setTimeout(() => {
      unifiedState.syncCanvasToThreeJS();
      console.log('👻 Opacity changed - syncing to 3D');
    }, 100);
  };

  const toggleTransparent = () => {
    if (!canvasRef.current || !selectedObject) return;
    
    const currentFill = selectedObject.get('fill');
    if (currentFill === 'transparent' || currentFill === '') {
      selectedObject.set('fill', '#3b82f6');
    } else {
      selectedObject.set('fill', 'transparent');
    }
    canvasRef.current.renderAll();
    
    setTimeout(() => {
      unifiedState.syncCanvasToThreeJS();
      console.log('🔍 Transparency toggled - syncing to 3D');
    }, 100);
  };

  const removeStroke = () => {
    if (!canvasRef.current || !selectedObject) return;
    
    selectedObject.set('stroke', '');
    selectedObject.set('strokeWidth', 0);
    canvasRef.current.renderAll();
    
    setTimeout(() => {
      unifiedState.syncCanvasToThreeJS();
      console.log('🚫 Stroke removed - syncing to 3D');
    }, 100);
  };

  // Predefined colors
  const colorPalette = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', 
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#000000', '#6b7280', '#ffffff'
  ];

  const toolbarButtons = [
    {
      icon: Undo2,
      label: 'Undo',
      onClick: undo,
      disabled: !canUndo
    },
    {
      icon: Redo2,
      label: 'Redo',
      onClick: redo,
      disabled: !canRedo
    },
    { type: 'divider' },
    {
      icon: ZoomIn,
      label: 'Zoom In',
      onClick: handleZoomIn
    },
    {
      icon: ZoomOut,
      label: 'Zoom Out',
      onClick: handleZoomOut
    },
    {
      icon: RotateCcw,
      label: 'Reset View',
      onClick: handleReset
    },
    { type: 'divider' },
    {
      icon: Copy,
      label: 'Duplicate',
      onClick: handleCopy
    },
    {
      icon: Layers,
      label: 'Bring to Front',
      onClick: handleBringToFront
    },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: handleDelete,
      variant: 'danger'
    },
    { type: 'divider' },
    {
      icon: Palette,
      label: 'Colors',
      onClick: () => setShowColorPanel(!showColorPanel),
      variant: 'colors',
      disabled: !selectedObject
    }
  ];

  return (
    <div 
      ref={toolbarRef}
      className={`fixed z-20 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
      style={{
        left: position.x,
        top: position.y
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200 rounded-2xl overflow-hidden">
        {/* Drag Handle */}
        <div className="drag-handle flex items-center justify-center p-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 cursor-grab active:cursor-grabbing">
          <div className="flex items-center space-x-2">
            <Grip size={14} className="text-gray-500" />
            <span className="text-xs font-semibold text-gray-600">Canvas Tools</span>
            <Move size={12} className="text-gray-400" />
          </div>
        </div>

        {/* Toolbar Buttons - Horizontal Layout */}
        <div className="p-2 flex flex-row items-center space-x-1">
          {toolbarButtons.map((button, index) => {
            if (button.type === 'divider') {
              return <div key={index} className="w-px h-6 bg-gray-200 mx-1" />;
            }

            const Icon = button.icon;
            const baseClasses = "p-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 group relative";
            
            let buttonClasses = baseClasses;
            if (button.disabled) {
              buttonClasses += " text-gray-400 cursor-not-allowed bg-gray-50";
            } else if (button.variant === 'danger') {
              buttonClasses += " text-red-600 hover:bg-red-50 focus:ring-red-500 hover:shadow-md";
            } else if (button.variant === 'colors') {
              buttonClasses += ` text-purple-600 hover:bg-purple-50 focus:ring-purple-500 hover:shadow-md ${showColorPanel ? 'bg-purple-100 text-purple-700' : ''}`;
            } else {
              buttonClasses += " text-gray-700 hover:bg-blue-50 focus:ring-blue-500 hover:text-blue-600 hover:shadow-md";
            }

            return (
              <button
                key={index}
                onClick={button.onClick}
                disabled={button.disabled}
                className={buttonClasses}
                title={button.label}
              >
                <Icon size={16} />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {button.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Panel - Show when colors button is clicked and object is selected */}
      {showColorPanel && selectedObject && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200 rounded-2xl p-4 z-50">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">Object Properties</h4>
              <button
                onClick={() => setShowColorPanel(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Fill Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700 flex items-center space-x-1">
                  <Palette className="w-3 h-3" />
                  <span>Fill Color</span>
                </label>
                <button
                  onClick={toggleTransparent}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                >
                  Transparent
                </button>
              </div>
              <div className="grid grid-cols-10 gap-1">
                {colorPalette.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleFillColorChange(color)}
                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700 flex items-center space-x-1">
                  <Paintbrush className="w-3 h-3" />
                  <span>Stroke Color</span>
                </label>
                <button
                  onClick={removeStroke}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                >
                  No Stroke
                </button>
              </div>
              <div className="grid grid-cols-10 gap-1">
                {colorPalette.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleStrokeColorChange(color)}
                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <label className="text-xs font-medium text-gray-700 flex items-center space-x-1 mb-2">
                <Minus className="w-3 h-3" />
                <span>Stroke Width</span>
              </label>
              <div className="flex space-x-2">
                {[0, 1, 2, 4, 6, 8, 12].map(width => (
                  <button
                    key={width}
                    onClick={() => handleStrokeWidthChange(width)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    {width}px
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label className="text-xs font-medium text-gray-700 flex items-center space-x-1 mb-2">
                <Circle className="w-3 h-3" />
                <span>Opacity</span>
              </label>
              <div className="flex space-x-2">
                {[0.2, 0.4, 0.6, 0.8, 1.0].map(opacity => (
                  <button
                    key={opacity}
                    onClick={() => handleOpacityChange(opacity)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    {Math.round(opacity * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Drag Instructions */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
        Drag to move
      </div>
    </div>
  );
};

export default DraggableToolbar;