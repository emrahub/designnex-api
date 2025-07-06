import React, { useState, useRef } from 'react';
import { fabric } from 'fabric';
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import { CanvasProvider } from '../context/CanvasContext';
import { ShoppingCart, Save, Download, Share2, Zap } from 'lucide-react';

const ProductCustomizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('designs');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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

    const savedDesigns = JSON.parse(localStorage.getItem('customizer_designs') || '[]');
    savedDesigns.push(designData);
    localStorage.setItem('customizer_designs', JSON.stringify(savedDesigns));

    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
    notification.innerHTML = '<span>✅</span><span>Design saved successfully!</span>';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  const downloadDesign = () => {
    if (!canvasRef.current) return;

    const dataURL = canvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });

    const link = document.createElement('a');
    link.download = `designnex-design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
    notification.innerHTML = '<span>📥</span><span>Design downloaded!</span>';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  const shareDesign = () => {
    if (!canvasRef.current) return;

    const dataURL = canvasRef.current.toDataURL({
      format: 'png',
      quality: 0.8,
      multiplier: 1
    });

    if (navigator.share) {
      navigator.share({
        title: 'My DesignNex Creation',
        text: 'Check out my custom design created with DesignNex!',
        url: window.location.href
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-purple-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
      notification.innerHTML = '<span>🔗</span><span>Link copied to clipboard!</span>';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  };

  const addToCart = async () => {
    if (!canvasRef.current) return;

    const designData = {
      canvas: JSON.stringify(canvasRef.current.toJSON()),
      snapshot: canvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      }),
      timestamp: new Date().toISOString(),
      customizer: 'DesignNex'
    };

    console.log('Adding to cart with DesignNex design:', designData);
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
    notification.innerHTML = '<span>🛒</span><span>Added to cart successfully!</span>';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  return (
    <CanvasProvider>
      <div className="relative h-screen overflow-hidden bg-white">
        {/* Professional DesignNex Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 z-10 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* DesignNex Logo */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">✦</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
                    DesignNex
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">Professional Design Studio</p>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="hidden md:flex items-center space-x-4 pl-6 border-l border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-2xl">👕</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Premium Custom T-Shirt</h2>
                  <p className="text-sm text-gray-500">100% Cotton • High Quality Print • $29.99</p>
                </div>
              </div>
            </div>
            
            {/* Professional Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={saveDesign}
                className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
              >
                <Save size={18} />
                <span className="hidden sm:inline">Save</span>
              </button>
              
              <button
                onClick={downloadDesign}
                className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 font-medium"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Download</span>
              </button>
              
              <button 
                onClick={shareDesign}
                className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 font-medium"
              >
                <Share2 size={18} />
                <span className="hidden sm:inline">Share</span>
              </button>
              
              <div className="w-px h-8 bg-gray-200 mx-2"></div>
              
              <button
                onClick={addToCart}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ShoppingCart size={18} />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex h-full">
          {/* Main Canvas Area */}
          <div className={`flex-1 relative transition-all duration-300 ${isSidebarOpen ? 'mr-80' : 'mr-0'}`}>
            <Toolbar 
              onToggleSidebar={toggleSidebar}
              isSidebarOpen={isSidebarOpen}
            />
            <Canvas 
              canvasRef={canvasRef}
              onObjectSelected={setSelectedObject}
            />
          </div>

          {/* Professional Sidebar */}
          <Sidebar 
            isOpen={isSidebarOpen}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedObject={selectedObject}
            canvasRef={canvasRef}
          />
        </div>

        {/* DesignNex Watermark */}
        <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-gray-200">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-600">Powered by DesignNex</span>
        </div>
      </div>
    </CanvasProvider>
  );
};

export default ProductCustomizer;