import React, { useState, useRef, useEffect } from 'react';
import { 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Trash2, 
  PanelRightOpen,
  PanelRightClose,
  Move,
  Copy,
  Layers,
  Zap
} from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';

interface ToolbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { canvas, canUndo, canRedo, undo, redo } = useCanvas();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Mouse down - start drag
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

  // Mouse move - drag devam
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        const maxX = window.innerWidth - (toolbarRef.current?.offsetWidth || 0);
        const maxY = window.innerHeight - (toolbarRef.current?.offsetHeight || 0);
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
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

  const handleZoomIn = () => {
    if (!canvas) return;
    const zoom = canvas.getZoom();
    canvas.setZoom(Math.min(zoom * 1.2, 3));
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    const zoom = canvas.getZoom();
    canvas.setZoom(Math.max(zoom / 1.2, 0.3));
  };

  const handleReset = () => {
    if (!canvas) return;
    canvas.setZoom(1);
    canvas.viewportCenterObject(canvas.getObjects()[0] || canvas);
    canvas.renderAll();
  };

  const handleDelete = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
    }
  };

  const handleCopy = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone((cloned: fabric.Object) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
      });
    }
  };

  const handleBringToFront = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.bringToFront(activeObject);
      canvas.renderAll();
    }
  };

  const toolbarButtons = [
    {
      icon: isSidebarOpen ? PanelRightClose : PanelRightOpen,
      label: isSidebarOpen ? 'Hide Panel' : 'Show Panel',
      onClick: onToggleSidebar,
      variant: 'primary'
    },
    { type: 'divider' },
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
    }
  ];

  return (
    <div 
      ref={toolbarRef}
      className={`fixed z-20 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: position.x || '50%',
        top: position.y || '100px',
        transform: position.x ? 'none' : 'translateX(-50%)'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200 rounded-2xl px-3 py-2 select-none">
        <div className="flex items-center space-x-1">
          {/* DesignNex Drag Handle */}
          <div className="drag-handle flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 cursor-grab active:cursor-grabbing transition-colors duration-200">
            <div className="flex items-center space-x-1">
              <Zap size={14} className="text-blue-600" />
              <Move size={14} />
            </div>
          </div>
          
          <div className="w-px h-6 bg-gray-200" />
          
          {toolbarButtons.map((button, index) => {
            if (button.type === 'divider') {
              return <div key={index} className="w-px h-8 bg-gray-200 mx-1" />;
            }

            const Icon = button.icon;
            const baseClasses = "p-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1";
            
            let buttonClasses = baseClasses;
            if (button.disabled) {
              buttonClasses += " text-gray-400 cursor-not-allowed";
            } else if (button.variant === 'primary') {
              buttonClasses += " text-blue-600 hover:bg-blue-50 focus:ring-blue-500";
            } else if (button.variant === 'danger') {
              buttonClasses += " text-red-600 hover:bg-red-50 focus:ring-red-500";
            } else {
              buttonClasses += " text-gray-700 hover:bg-gray-100 focus:ring-gray-500";
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
              </button>
            );
          })}
        </div>
      </div>
      
      {/* DesignNex Toolbar Info */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-1">
          <Zap size={12} className="text-blue-600" />
          <span>DesignNex Toolbar • Drag to move</span>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;