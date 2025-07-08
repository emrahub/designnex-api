import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { Type, Bold, Italic, Plus, Palette } from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';
import { unifiedState } from '../../store/unifiedState';

interface TextTabProps {
  selectedObject: fabric.Object | null;
  canvasRef?: React.MutableRefObject<fabric.Canvas | null>;
}

const TextTab: React.FC<TextTabProps> = ({ selectedObject }) => {
  const { canvas, addToHistory } = useCanvas();
  const [text, setText] = useState('Your Text Here');
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textColor, setTextColor] = useState('#ffffff');
  const [isBold, setIsBold] = useState(true);
  const [isItalic, setIsItalic] = useState(false);

  useEffect(() => {
    if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox')) {
      const textObj = selectedObject as fabric.Text;
      setText(textObj.text || '');
      setFontSize(textObj.fontSize || 48);
      setFontFamily(textObj.fontFamily || 'Arial');
      setTextColor(textObj.fill as string || '#ffffff');
      setIsBold(textObj.fontWeight === 'bold');
      setIsItalic(textObj.fontStyle === 'italic');
    }
  }, [selectedObject]);

  const addTextToCanvas = () => {
    if (!canvas) return;

    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;
    
    const textObject = new fabric.Textbox(text, {
      left: centerX,
      top: centerY,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: textColor,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      originX: 'center',
      originY: 'center',
      name: `text_${Date.now()}`,
      opacity: 1,
      visible: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      borderColor: '#3b82f6',
      cornerColor: '#3b82f6',
      cornerSize: 12,
      editable: true,
      width: 300,
      textAlign: 'center',
      splitByGrapheme: false,
      stroke: textColor === '#ffffff' ? '#000000' : (textColor === '#000000' ? '#ffffff' : 'transparent'),
      strokeWidth: textColor === '#ffffff' || textColor === '#000000' ? 2 : 0
    });

    console.log('🎨 Adding text object to canvas...');
    console.log('📝 Text object properties:', {
      text: textObject.text,
      left: textObject.left,
      top: textObject.top,
      fontSize: textObject.fontSize,
      fill: textObject.fill
    });
    
    // Add object and force immediate sync
    canvas.add(textObject);
    canvas.setActiveObject(textObject);
    
    console.log('📊 Canvas objects after add:', canvas.getObjects().length);
    console.log('✅ Active object:', canvas.getActiveObject());
    
    // Ensure rendering with multiple render calls for visibility
    canvas.renderAll();
    
    requestAnimationFrame(() => {
      if (canvas && !canvas.isDisposed) {
        canvas.renderAll();
        
        // Additional render after 100ms to ensure visibility
        setTimeout(() => {
          if (canvas && !canvas.isDisposed) {
            canvas.renderAll();
            console.log('🎨 Text object final render completed');
          }
        }, 100);
      }
    });
    
    // Ensure unified state has current canvas
    unifiedState.canvas = canvas;
    
    console.log('📊 Canvas objects after add:', canvas.getObjects().length);
    console.log('🎯 Text object details:', {
      type: textObject.type,
      text: textObject.text,
      left: textObject.left,
      top: textObject.top,
      visible: textObject.visible
    });
    
    // Immediate sync - no waiting
    console.log('🚀 IMMEDIATE SYNC after text add');
    try {
      unifiedState.syncCanvasToThreeJS();
      console.log('✅ Text immediately synced to 3D');
    } catch (syncError) {
      console.error('❌ Immediate sync failed:', syncError);
    }
    
    // Start editing after sync
    setTimeout(() => {
      if (textObject && canvas && !canvas.isDisposed) {
        textObject.enterEditing();
        textObject.selectAll();
        console.log('📝 Text editing started');
      }
    }, 100);
    
    // Add to history after sync
    addToHistory();
  };

  const updateSelectedText = () => {
    if (!selectedObject || (selectedObject.type !== 'text' && selectedObject.type !== 'textbox') || !canvas) {
      return;
    }

    const textObj = selectedObject as fabric.Text;
    textObj.set({
      text: text,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: textColor,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      borderColor: '#3b82f6',
      cornerColor: '#3b82f6',
      opacity: 1,
      visible: true,
      stroke: textColor === '#ffffff' ? '#000000' : (textColor === '#000000' ? '#ffffff' : 'transparent'),
      strokeWidth: textColor === '#ffffff' || textColor === '#000000' ? 2 : 0
    });

    canvas.renderAll();
    addToHistory();
    
    // Immediate sync to 3D for text updates
    setTimeout(() => {
      unifiedState.syncCanvasToThreeJS();
      console.log('✏️ Text updated - syncing to 3D');
    }, 150);
  };

  const fonts = [
    'Arial', 
    'Arial Black',
    'Helvetica', 
    'Times New Roman', 
    'Courier New', 
    'Georgia', 
    'Verdana',
    'Impact',
    'Comic Sans MS'
  ];

  const colorPresets = [
    { name: 'White', value: '#ffffff' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Yellow', value: '#fbbf24' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Gray', value: '#9ca3af' }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Type className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Text Tools</h3>
        </div>
        <p className="text-sm text-gray-600">
          Add and customize text elements
        </p>
      </div>

      <div className="space-y-5">
        {/* Quick Add Button */}
        <button
          onClick={addTextToCanvas}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Add Text</span>
        </button>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Content
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            placeholder="Enter your text..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Family
          </label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {fonts.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value) || 48)}
              min="12"
              max="200"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Color
            </label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Color Presets
          </label>
          <div className="grid grid-cols-4 gap-2">
            {colorPresets.map(color => (
              <button
                key={color.value}
                onClick={() => setTextColor(color.value)}
                className={`p-2 rounded-lg border-2 text-xs font-medium transition-all duration-200 ${
                  textColor === color.value 
                    ? 'border-blue-500 bg-blue-50 scale-105' 
                    : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                }`}
                style={{ 
                  backgroundColor: color.value === '#ffffff' ? '#f8fafc' : color.value + '20',
                  color: color.value === '#ffffff' ? '#1f2937' : color.value
                }}
              >
                {color.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <input
              type="checkbox"
              checked={isBold}
              onChange={(e) => setIsBold(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Bold className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Bold</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <input
              type="checkbox"
              checked={isItalic}
              onChange={(e) => setIsItalic(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Italic className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Italic</span>
          </label>
        </div>

        {selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'textbox') && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={updateSelectedText}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl mb-2"
            >
              Update Selected Text
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default TextTab;