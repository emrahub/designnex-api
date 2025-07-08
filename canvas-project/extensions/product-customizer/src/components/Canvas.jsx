import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

const Canvas = ({ canvasRef, onObjectSelected, onCanvasChange }) => {
  const canvasElementRef = useRef(null);

  useEffect(() => {
    if (!canvasElementRef.current) return;

    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasElementRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    canvasRef.current = canvas;

    // Add default product base (simulating a patch/cap)
    const productBase = new fabric.Rect({
      left: 300,
      top: 200,
      width: 200,
      height: 200,
      fill: '#1f2937',
      rx: 20,
      ry: 20,
      selectable: false,
      evented: false,
      opacity: 0.8
    });

    canvas.add(productBase);

    // Add sample patch area
    const patchArea = new fabric.Rect({
      left: 325,
      top: 225,
      width: 150,
      height: 150,
      fill: 'transparent',
      stroke: '#3b82f6',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      opacity: 0.7
    });

    canvas.add(patchArea);

    // Add sample text
    const sampleText = new fabric.Text('Your Design', {
      left: 400,
      top: 300,
      fontFamily: 'Arial',
      fontSize: 24,
      fill: '#ffffff',
      textAlign: 'center',
      originX: 'center',
      originY: 'center'
    });

    canvas.add(sampleText);
    canvas.renderAll();

    // Event handlers
    canvas.on('selection:created', (e) => {
      onObjectSelected(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e) => {
      onObjectSelected(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      onObjectSelected(null);
    });

    canvas.on('object:added', () => onCanvasChange());
    canvas.on('object:removed', () => onCanvasChange());
    canvas.on('object:modified', () => onCanvasChange());

    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, []);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasElementRef}
        className="design-canvas"
      />
      <div className="canvas-help-text">
        Click and drag to customize • Use toolbar controls for advanced editing
      </div>
    </div>
  );
};

export default Canvas;