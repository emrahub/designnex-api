import React, { useRef } from 'react';
import { fabric } from 'fabric';

const UploadTab = ({ canvasRef, onCanvasChange }) => {
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file || !canvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      
      fabric.Image.fromURL(imageUrl, (img) => {
        img.set({
          left: 400,
          top: 300,
          originX: 'center',
          originY: 'center',
          scaleX: 0.5,
          scaleY: 0.5
        });

        canvasRef.current.add(img);
        canvasRef.current.setActiveObject(img);
        canvasRef.current.renderAll();
        onCanvasChange();
      });
    };
    
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-tab">
      <div className="tab-header">
        <h3>Upload Image</h3>
        <p>Add your own images to the design</p>
      </div>

      <div className="upload-section">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        
        <button onClick={triggerFileInput} className="upload-btn">
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            <div>Choose Image</div>
            <div className="upload-subtitle">PNG, JPG, GIF up to 10MB</div>
          </div>
        </button>

        <div className="upload-tips">
          <h4>Tips for best results:</h4>
          <ul>
            <li>Use high-resolution images (300 DPI or higher)</li>
            <li>PNG files with transparent backgrounds work best</li>
            <li>Square images (1:1 ratio) are recommended</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadTab;