import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';

const TextTab = ({ canvasRef, selectedObject, onCanvasChange }) => {
  const [text, setText] = useState('Your Text');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textColor, setTextColor] = useState('#000000');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  useEffect(() => {
    if (selectedObject && selectedObject.type === 'text') {
      setText(selectedObject.text);
      setFontSize(selectedObject.fontSize);
      setFontFamily(selectedObject.fontFamily);
      setTextColor(selectedObject.fill);
      setIsBold(selectedObject.fontWeight === 'bold');
      setIsItalic(selectedObject.fontStyle === 'italic');
    }
  }, [selectedObject]);

  const addTextToCanvas = () => {
    if (!canvasRef.current) return;

    const textObject = new fabric.Text(text, {
      left: 400,
      top: 300,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: textColor,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      originX: 'center',
      originY: 'center'
    });

    canvasRef.current.add(textObject);
    canvasRef.current.setActiveObject(textObject);
    canvasRef.current.renderAll();
    onCanvasChange();
  };

  const updateSelectedText = () => {
    if (!selectedObject || selectedObject.type !== 'text') return;

    selectedObject.set({
      text: text,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: textColor,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal'
    });

    canvasRef.current.renderAll();
    onCanvasChange();
  };

  const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

  return (
    <div className="text-tab">
      <div className="tab-header">
        <h3>Add Text</h3>
        <p>Customize text for your design</p>
      </div>

      <div className="text-controls">
        <div className="control-group">
          <label>Text Content</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="text-input"
            rows="3"
            placeholder="Enter your text here..."
          />
        </div>

        <div className="control-group">
          <label>Font Family</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="font-select"
          >
            {fonts.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        <div className="control-row">
          <div className="control-group">
            <label>Size</label>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              min="8"
              max="200"
              className="size-input"
            />
          </div>

          <div className="control-group">
            <label>Color</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="color-input"
            />
          </div>
        </div>

        <div className="control-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isBold}
              onChange={(e) => setIsBold(e.target.checked)}
            />
            <span>Bold</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isItalic}
              onChange={(e) => setIsItalic(e.target.checked)}
            />
            <span>Italic</span>
          </label>
        </div>

        <div className="button-group">
          <button onClick={addTextToCanvas} className="btn btn-primary">
            Add Text
          </button>
          {selectedObject && selectedObject.type === 'text' && (
            <button onClick={updateSelectedText} className="btn btn-secondary">
              Update Text
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextTab;