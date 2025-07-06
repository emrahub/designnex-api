import React from 'react';
import { 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Trash2,
  Copy,
  Layers,
  Move
} from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';

interface CanvasToolbarProps {
  canvasRef: React.MutableRefObject<fabric.Canvas | null>;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ canvasRef }) => {
  const { canUndo, canRedo, undo, redo } = useCanvas();

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
      });
    }
  };

  const handleBringToFront = () => {
    if (!canvasRef.current) return;
    const activeObject = canvasRef.current.getActiveObject();
    if (activeObject) {
      canvasRef.current.bringToFront(activeObject);
      canvasRef.current.renderAll();
    }
  };

  const toolbarButtons = [
    {
      icon: Undo2,
      label: 'Undo',
      onClick: undo,
      disabled: !canUndo,
      variant: 'default'
    },
    {
      icon: Redo2,
      label: 'Redo',
      onClick: redo,
      disabled: !canRedo,
      variant: 'default'
    },
    { type: 'divider' },
    {
      icon: ZoomIn,
      label: 'Zoom In',
      onClick: handleZoomIn,
      variant: 'default'
    },
    {
      icon: ZoomOut,
      label: 'Zoom Out',
      onClick: handleZoomOut,
      variant: 'default'
    },
    {
      icon: RotateCcw,
      label: 'Reset View',
      onClick: handleReset,
      variant: 'default'
    },
    { type: 'divider' },
    {
      icon: Copy,
      label: 'Duplicate',
      onClick: handleCopy,
      variant: 'default'
    },
    {
      icon: Layers,
      label: 'Bring to Front',
      onClick: handleBringToFront,
      variant: 'default'
    },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: handleDelete,
      variant: 'danger'
    }
  ];

  return (
    <div className="flex flex-col space-y-1">
      {toolbarButtons.map((button, index) => {
        if (button.type === 'divider') {
          return <div key={index} className="h-px bg-gray-200 my-1" />;
        }

        const Icon = button.icon;
        const baseClasses = "p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 group relative";
        
        let buttonClasses = baseClasses;
        if (button.disabled) {
          buttonClasses += " text-gray-400 cursor-not-allowed bg-gray-50";
        } else if (button.variant === 'danger') {
          buttonClasses += " text-red-600 hover:bg-red-50 focus:ring-red-500 hover:shadow-md";
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
            <Icon size={18} />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {button.label}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CanvasToolbar;