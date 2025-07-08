import React from 'react';

const Toolbar = ({ 
  onToggleSidebar, 
  isSidebarOpen, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo, 
  canvasRef 
}) => {
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
    canvasRef.current.viewportCenterObject(canvasRef.current.getObjects()[0] || canvasRef.current);
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

  return (
    <div className="toolbar">
      <div className="toolbar-content">
        <button
          onClick={onToggleSidebar}
          className="toolbar-btn primary"
          title={isSidebarOpen ? 'Hide Panel' : 'Show Panel'}
        >
          {isSidebarOpen ? '❮' : '❯'}
        </button>
        
        <div className="toolbar-divider"></div>
        
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="toolbar-btn"
          title="Undo"
        >
          ↶
        </button>
        
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="toolbar-btn"
          title="Redo"
        >
          ↷
        </button>
        
        <div className="toolbar-divider"></div>
        
        <button
          onClick={handleZoomIn}
          className="toolbar-btn"
          title="Zoom In"
        >
          🔍+
        </button>
        
        <button
          onClick={handleZoomOut}
          className="toolbar-btn"
          title="Zoom Out"
        >
          🔍-
        </button>
        
        <button
          onClick={handleReset}
          className="toolbar-btn"
          title="Reset View"
        >
          ⟲
        </button>
        
        <div className="toolbar-divider"></div>
        
        <button
          onClick={handleDelete}
          className="toolbar-btn danger"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default Toolbar;