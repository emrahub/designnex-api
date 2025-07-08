import React, { useState, useEffect } from 'react';
import { Save, Trash2, Download, Eye } from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';

interface SavedDesign {
  id: string;
  name: string;
  timestamp: string;
  canvasData: string;
  preview: string;
  thumbnailData: string;
}

interface MyDesignsTabProps {
  canvasRef?: React.MutableRefObject<fabric.Canvas | null>;
}

const MyDesignsTab: React.FC<MyDesignsTabProps> = () => {
  const { canvas, addToHistory } = useCanvas();
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);

  useEffect(() => {
    const loadDesigns = () => {
      const designs = JSON.parse(localStorage.getItem('designex_saved_designs') || '[]');
      setSavedDesigns(designs);
    };
    
    loadDesigns();
    
    // Listen for storage changes to update in real-time
    const handleStorageChange = () => loadDesigns();
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event when design is saved
    window.addEventListener('designSaved', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('designSaved', handleStorageChange);
    };
  }, []);

  const loadDesign = (design: SavedDesign) => {
    if (!canvas) return;

    try {
      canvas.loadFromJSON(JSON.parse(design.canvasData), () => {
        canvas.renderAll();
        addToHistory();
        console.log('✅ Design loaded:', design.name);
      });
    } catch (error) {
      console.error('❌ Load error:', error);
      alert('❌ Failed to load design');
    }
  };

  const deleteDesign = (designId: string) => {
    const updatedDesigns = savedDesigns.filter(design => design.id !== designId);
    setSavedDesigns(updatedDesigns);
    localStorage.setItem('designex_saved_designs', JSON.stringify(updatedDesigns));
    console.log('✅ Design deleted');
  };

  const downloadDesign = (design: SavedDesign) => {
    try {
      const link = document.createElement('a');
      link.download = `${design.name.replace(/\s+/g, '-')}.png`;
      link.href = design.preview;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('✅ Design downloaded:', design.name);
    } catch (error) {
      console.error('❌ Download error:', error);
      alert('❌ Failed to download design');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Save className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">My Designs</h3>
        </div>
        <p className="text-sm text-gray-600">
          Load your previously saved designs
        </p>
      </div>

      {savedDesigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💾</div>
          <div className="text-lg font-semibold text-gray-900 mb-2">No saved designs yet</div>
          <div className="text-sm text-gray-600">Create and save your first design!</div>
        </div>
      ) : (
        <div className="space-y-4">
          {savedDesigns.map(design => (
            <div key={design.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={design.thumbnailData || design.preview} 
                    alt={design.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {design.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(design.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => loadDesign(design)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors duration-200"
                    title="Load Design"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => downloadDesign(design)}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-200"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteDesign(design.id)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors duration-200"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDesignsTab;