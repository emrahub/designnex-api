import React, { useState, useEffect } from 'react';

const MyDesignsTab = ({ canvasRef, onCanvasChange }) => {
  const [savedDesigns, setSavedDesigns] = useState([]);

  useEffect(() => {
    const designs = JSON.parse(localStorage.getItem('customizer_designs') || '[]');
    setSavedDesigns(designs);
  }, []);

  const loadDesign = (design) => {
    if (!canvasRef.current) return;

    canvasRef.current.loadFromJSON(design.canvas, () => {
      canvasRef.current.renderAll();
      onCanvasChange();
    });
  };

  const deleteDesign = (designId) => {
    const updatedDesigns = savedDesigns.filter(design => design.id !== designId);
    setSavedDesigns(updatedDesigns);
    localStorage.setItem('customizer_designs', JSON.stringify(updatedDesigns));
  };

  return (
    <div className="my-designs-tab">
      <div className="tab-header">
        <h3>My Designs</h3>
        <p>Load your previously saved designs</p>
      </div>

      {savedDesigns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💾</div>
          <div className="empty-text">No saved designs yet</div>
          <div className="empty-subtitle">Create and save your first design!</div>
        </div>
      ) : (
        <div className="designs-list">
          {savedDesigns.map(design => (
            <div key={design.id} className="saved-design">
              <div className="design-preview">
                <img src={design.snapshot} alt={design.name} />
              </div>
              <div className="design-info">
                <div className="design-name">{design.name}</div>
                <div className="design-date">
                  {new Date(design.timestamp).toLocaleDateString()}
                </div>
              </div>
              <div className="design-actions">
                <button
                  onClick={() => loadDesign(design)}
                  className="btn btn-primary btn-sm"
                >
                  Load
                </button>
                <button
                  onClick={() => deleteDesign(design.id)}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDesignsTab;