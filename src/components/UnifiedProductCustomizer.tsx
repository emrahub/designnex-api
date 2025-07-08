import React, { useState, useRef, useMemo } from 'react';
import { fabric } from 'fabric';
import { useSnapshot } from 'valtio';
import Canvas from './Canvas';
import ThreeJSCanvas from './ThreeJSCanvas';
import ResponsiveProductViewer from './ResponsiveProductViewer';
import Sidebar from './Sidebar';
import DraggableToolbar from './DraggableToolbar';
import { CanvasProvider } from '../context/CanvasContext';
import { unifiedState } from '../store/unifiedState';
import { Zap, Palette, Box, Save, Download } from 'lucide-react';

const UnifiedProductCustomizer: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [activeTab, setActiveTab] = useState('designs');
  const [show3DModal, setShow3DModal] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const snap = useSnapshot(unifiedState);

  // Get URL parameters for Shopify integration
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product_id');
  const productTitle = urlParams.get('product_title');
  const mode = urlParams.get('mode');
  const isShopifyMode = mode === 'customize' && productId;

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleObjectSelected = (obj: fabric.Object | null) => {
    setSelectedObject(obj);
  };

  // Shopify Integration Functions
  const handleSaveToCart = () => {
    try {
      if (!canvasRef.current || !isShopifyMode) return;

      // Capture design data
      const designData = {
        canvasData: canvasRef.current.toJSON(),
        designId: `design_${Date.now()}`,
        productId: productId,
        productTitle: productTitle,
        timestamp: new Date().toISOString(),
        preview: canvasRef.current.toDataURL('image/png', 0.8)
      };

      // Send message to parent Shopify window
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type: 'designnex-customization-complete',
          data: designData,
          design_id: designData.designId
        }, '*');
        
        // Show success and close window
        alert('🎉 Design saved successfully! Closing customizer...');
        setTimeout(() => window.close(), 1000);
      }
    } catch (error) {
      console.error('Save to cart error:', error);
      alert('❌ Error saving design. Please try again.');
    }
  };

  const handleDiscardChanges = () => {
    if (confirm('Are you sure you want to discard all changes?')) {
      if (window.opener && !window.opener.closed) {
        window.close();
      }
    }
  };

  const handleTogglePreview = () => {
    console.log('🎬 Toggle preview triggered');
    
    // CRITICAL: Store canvas state BEFORE any operations
    let canvasBackup: string | null = null;
    try {
      if (canvasRef.current && !canvasRef.current.isDisposed) {
        console.log('📸 Creating canvas backup before toggle...');
        canvasRef.current.renderAll();
        canvasBackup = JSON.stringify(canvasRef.current.toJSON());
        console.log('✅ Canvas backup created with', canvasRef.current.getObjects().length, 'objects');
        
        // Single sync with current state
        unifiedState.syncCanvasToThreeJS();
        console.log('🔄 Pre-toggle sync completed');
      }
    } catch (syncError) {
      console.error('❌ Sync error:', syncError);
    }
    
    setIsPreviewExpanded(!isPreviewExpanded);
    
    // Restore and sync after state change - with more time for UI to settle
    setTimeout(() => {
      if (canvasRef.current && !canvasRef.current.isDisposed) {
        const currentObjects = canvasRef.current.getObjects();
        console.log('🔍 Post-toggle canvas objects count:', currentObjects.length);
        
        if (currentObjects.length === 0 && canvasBackup) {
          console.log('🚨 Canvas objects lost! Attempting restore...');
          try {
            canvasRef.current.loadFromJSON(canvasBackup, () => {
              console.log('✅ Canvas state restored from backup');
              canvasRef.current!.renderAll();
              unifiedState.syncCanvasToThreeJS();
              console.log('🔄 Post-restore sync completed');
            });
          } catch (restoreError) {
            console.error('❌ Canvas restore failed:', restoreError);
          }
        } else {
          console.log('✅ Canvas objects preserved, syncing...');
          unifiedState.syncCanvasToThreeJS();
          console.log('🔄 Post-toggle sync completed');
        }
      }
    }, 500);
  };

  // Legacy function for backward compatibility
  const handleSyncToThreeJS = handleTogglePreview;

  const handleStartCustomizing = () => {
    unifiedState.intro = false;
  };

  const handleSaveDesign = () => {
    if (!canvasRef.current) return;
    
    try {
      // Generate design data
      const designData = {
        id: Date.now().toString(),
        name: `Design ${new Date().toLocaleDateString()}`,
        timestamp: new Date().toISOString(),
        canvasData: JSON.stringify(canvasRef.current.toJSON()),
        preview: canvasRef.current.toDataURL('image/png'),
        thumbnailData: canvasRef.current.toDataURL('image/png', 0.3) // Lower quality for thumbnail
      };
      
      // Save to localStorage
      const savedDesigns = JSON.parse(localStorage.getItem('designex_saved_designs') || '[]');
      savedDesigns.unshift(designData); // Add to beginning
      
      // Keep only last 50 designs
      if (savedDesigns.length > 50) {
        savedDesigns.splice(50);
      }
      
      localStorage.setItem('designex_saved_designs', JSON.stringify(savedDesigns));
      
      // Trigger event to update My Designs tab
      window.dispatchEvent(new Event('designSaved'));
      
      alert('✅ Design saved successfully!');
      console.log('✅ Design saved:', designData.name);
    } catch (error) {
      console.error('❌ Save error:', error);
      alert('❌ Failed to save design');
    }
  };

  const handleDownloadDesign = () => {
    if (!canvasRef.current) return;
    
    try {
      // Export high quality image
      const dataURL = canvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 3 // High resolution
      });
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `designex-design-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Design downloaded');
    } catch (error) {
      console.error('❌ Download error:', error);
      alert('❌ Failed to download design');
    }
  };

  if (snap.intro) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center space-y-8 max-w-2xl mx-auto px-6">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DesignNex Studio
            </h1>
          </div>

          {/* Hero Text */}
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-gray-900 leading-tight">
              Design & Visualize
              <span className="block text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                Your Custom Products
              </span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Professional canvas design tools meets stunning 3D visualization. 
              Create, customize, and preview your designs in real-time.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Palette className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Canvas Designer</h3>
              </div>
              <p className="text-gray-600">Professional design tools with layers, undo/redo, and drag-drop functionality</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Box className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">3D Preview</h3>
              </div>
              <p className="text-gray-600">Real-time 3D visualization with interactive controls and lighting</p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleStartCustomizing}
            className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <Zap className="w-5 h-5" />
            <span>Start Designing</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <CanvasProvider>
      <div className="h-screen w-full flex bg-gray-50 pt-16">
        {/* Canvas Area - Center - Stable wrapper to prevent Canvas unmounting */}
        <div className="flex-1 relative transition-all duration-500" style={{ width: '100%' }}>
          <Canvas 
            key="stable-canvas"
            canvasRef={canvasRef} 
            onObjectSelected={handleObjectSelected}
            isPreviewExpanded={isPreviewExpanded}
            onTogglePreview={handleTogglePreview}
          />
          
          {/* Draggable Canvas Toolbar - Default position below canvas */}
          <DraggableToolbar 
            canvasRef={canvasRef}
            defaultPosition={{ x: 400, y: 700 }}
          />
        </div>

        {/* Sidebar - Right Side - Hide when preview expanded */}
        {isSidebarOpen && !isPreviewExpanded && (
          <div className="w-80 bg-white border-l border-gray-200 shadow-sm overflow-hidden transition-all duration-500">
            <div className="h-full pt-4">
              <Sidebar 
                isOpen={isSidebarOpen}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                selectedObject={selectedObject}
                canvasRef={canvasRef}
              />
            </div>
          </div>
        )}

        {/* Enhanced 3D Preview Modal */}
        {show3DModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-5xl max-h-[95vh] relative overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Box className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">3D Preview</h2>
                      <p className="text-sm text-gray-500">Interactive T-shirt visualization</p>
                    </div>
                    <div className="ml-4 px-3 py-1 bg-gray-100 rounded-lg">
                      <div className="text-xs text-gray-600">
                        <div>Logo: {snap.isLogoTexture ? '✅' : '❌'}</div>
                        <div>Data: {snap.logoDecal?.length || 0} chars</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => unifiedState.autoRotate = !unifiedState.autoRotate}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                        snap.autoRotate 
                          ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {snap.autoRotate ? 'Stop Rotation' : 'Auto Rotate'}
                    </button>
                    
                    <button
                      onClick={() => setShow3DModal(false)}
                      className="p-3 rounded-xl hover:bg-gray-100 transition-colors group"
                    >
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 3D Canvas - Flexible height - Using same logic as mini preview */}
              <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 min-h-0 p-8">
                <div className="w-full h-full bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
                  <ResponsiveProductViewer 
                    key="stable-modal-preview"
                    productType="tshirt" 
                    isFullscreen={false}
                    className="w-full h-full"
                  />
                </div>
              </div>
              
              {/* Modal Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-xl text-white">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>Live Preview</span>
                    </div>
                    <div className="w-px h-3 bg-white/30"></div>
                    <span>🖱️ Drag • 🔍 Zoom</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Top Toolbar */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-full mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Logo & Brand */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    DesignNex Studio
                  </h1>
                </div>
                
                {/* Sidebar Toggle */}
                <button
                  onClick={handleToggleSidebar}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <Palette className="w-4 h-4" />
                  <span>{isSidebarOpen ? 'Hide Tools' : 'Show Tools'}</span>
                </button>
              </div>

              {/* Center: Quick Actions */}
              <div className="flex items-center space-x-3">
                {isShopifyMode ? (
                  /* Shopify Mode - Cart Integration Buttons */
                  <>
                    <div className="bg-blue-50 px-3 py-1 rounded-lg">
                      <span className="text-blue-700 text-sm font-medium">
                        📱 {productTitle}
                      </span>
                    </div>
                    <button
                      onClick={handleSaveToCart}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                    >
                      <Save className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={handleDiscardChanges}
                      className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                    >
                      <span>Cancel</span>
                    </button>
                  </>
                ) : (
                  /* Normal Mode - Save/Download Buttons */
                  <>
                    <button
                      onClick={handleSaveDesign}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Design</span>
                    </button>
                    
                    <button
                      onClick={handleDownloadDesign}
                      className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </>
                )}
                
                <button
                  onClick={handleTogglePreview}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                >
                  <Box className="w-4 h-4" />
                  <span>{isPreviewExpanded ? 'Normal View' : 'Large Preview'}</span>
                  {snap.isLogoTexture && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
                </button>
                
                <button
                  onClick={() => unifiedState.autoRotate = !unifiedState.autoRotate}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                    snap.autoRotate 
                      ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${snap.autoRotate ? 'bg-purple-400 animate-spin' : 'bg-gray-400'}`}></div>
                  <span className="text-sm">{snap.autoRotate ? 'Stop Rotation' : 'Auto Rotate'}</span>
                </button>
              </div>

              {/* Right: Status & Settings */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CanvasProvider>
  );
};

export default UnifiedProductCustomizer;