import React, { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import LoadingSpinner from './components/LoadingSpinner';

const Designer = ({ variantId, productId, productTitle, variantPrice, currency }) => {
  const [activeTab, setActiveTab] = useState('designs');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedObject, setSelectedObject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canvasRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const addToHistory = () => {
    if (!canvasRef.current) return;
    
    const canvasData = JSON.stringify(canvasRef.current.toJSON());
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(canvasData);
    
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0 && canvasRef.current) {
      const prevState = canvasHistory[historyIndex - 1];
      canvasRef.current.loadFromJSON(prevState, () => {
        canvasRef.current.renderAll();
        setHistoryIndex(historyIndex - 1);
      });
    }
  };

  const redo = () => {
    if (historyIndex < canvasHistory.length - 1 && canvasRef.current) {
      const nextState = canvasHistory[historyIndex + 1];
      canvasRef.current.loadFromJSON(nextState, () => {
        canvasRef.current.renderAll();
        setHistoryIndex(historyIndex + 1);
      });
    }
  };

  const addToCart = async () => {
    if (!canvasRef.current || !variantId) {
      alert('Please select a product variant first');
      return;
    }

    setIsLoading(true);

    try {
      const designData = JSON.stringify(canvasRef.current.toJSON());
      const snapshot = canvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });

      const cartData = {
        items: [{
          id: parseInt(variantId),
          quantity: 1,
          properties: {
            'Custom Design': 'Yes',
            'Design Data': designData,
            'Design Preview': snapshot,
            'Customized On': new Date().toLocaleDateString()
          }
        }]
      };

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartData)
      });

      if (response.ok) {
        // Redirect to cart page
        window.location.href = '/cart';
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveDesign = () => {
    if (!canvasRef.current) return;

    const designData = {
      id: Date.now(),
      name: `Design ${new Date().toLocaleDateString()}`,
      canvas: JSON.stringify(canvasRef.current.toJSON()),
      snapshot: canvasRef.current.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 1
      }),
      timestamp: new Date().toISOString()
    };

    // Save to localStorage (in a real app, this would be saved to a database)
    const savedDesigns = JSON.parse(localStorage.getItem('customizer_designs') || '[]');
    savedDesigns.push(designData);
    localStorage.setItem('customizer_designs', JSON.stringify(savedDesigns));

    alert('Design saved successfully! 💾');
  };

  return (
    <div className="product-customizer">
      {isLoading && <LoadingSpinner />}
      
      {/* Header */}
      <header className="customizer-header-bar">
        <div className="header-content">
          <div className="product-info">
            <h1 className="product-title">{productTitle}</h1>
            <div className="product-price">
              {currency} {variantPrice}
            </div>
          </div>
          <div className="header-actions">
            <button
              onClick={saveDesign}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Save Design
            </button>
            <button
              onClick={addToCart}
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </header>

      <div className="customizer-body">
        {/* Main Canvas Area */}
        <div className={`canvas-container ${isSidebarOpen ? 'with-sidebar' : 'full-width'}`}>
          <Toolbar 
            onToggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
            onUndo={undo}
            onRedo={redo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < canvasHistory.length - 1}
            canvasRef={canvasRef}
          />
          <Canvas 
            canvasRef={canvasRef}
            onObjectSelected={setSelectedObject}
            onCanvasChange={addToHistory}
          />
        </div>

        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedObject={selectedObject}
          canvasRef={canvasRef}
          onCanvasChange={addToHistory}
        />
      </div>
    </div>
  );
};

export default Designer;