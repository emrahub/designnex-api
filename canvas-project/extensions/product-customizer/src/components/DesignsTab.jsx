import React from 'react';
import { fabric } from 'fabric';

const DesignsTab = ({ canvasRef, onCanvasChange }) => {
  const readyDesigns = [
    { id: 1, name: 'Mountain Logo', category: 'Nature', preview: '🏔️' },
    { id: 2, name: 'Eagle Wing', category: 'Animals', preview: '🦅' },
    { id: 3, name: 'Star Badge', category: 'Badges', preview: '⭐' },
    { id: 4, name: 'Lightning', category: 'Energy', preview: '⚡' },
    { id: 5, name: 'Crown Royal', category: 'Royal', preview: '👑' },
    { id: 6, name: 'Fire Flame', category: 'Energy', preview: '🔥' },
    { id: 7, name: 'Ocean Wave', category: 'Nature', preview: '🌊' },
    { id: 8, name: 'Skull Art', category: 'Edgy', preview: '💀' }
  ];

  const addDesignToCanvas = (design) => {
    if (!canvasRef.current) return;

    const designObject = new fabric.Text(design.preview, {
      left: 400,
      top: 300,
      fontSize: 48,
      originX: 'center',
      originY: 'center',
      selectable: true
    });

    canvasRef.current.add(designObject);
    canvasRef.current.setActiveObject(designObject);
    canvasRef.current.renderAll();
    onCanvasChange();
  };

  const categories = [...new Set(readyDesigns.map(design => design.category))];

  return (
    <div className="designs-tab">
      <div className="tab-header">
        <h3>Ready Designs</h3>
        <p>Choose from our collection of professional designs</p>
      </div>

      {categories.map(category => (
        <div key={category} className="design-category">
          <h4 className="category-title">{category}</h4>
          <div className="design-grid">
            {readyDesigns
              .filter(design => design.category === category)
              .map(design => (
                <button
                  key={design.id}
                  onClick={() => addDesignToCanvas(design)}
                  className="design-item"
                >
                  <div className="design-preview">{design.preview}</div>
                  <div className="design-name">{design.name}</div>
                </button>
              ))
            }
          </div>
        </div>
      ))}
    </div>
  );
};

export default DesignsTab;