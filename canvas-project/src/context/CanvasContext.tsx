import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { fabric } from 'fabric';
import { unifiedState } from '../store/unifiedState';

interface CanvasContextType {
  canvas: fabric.Canvas | null;
  setCanvas: (canvas: fabric.Canvas) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  addToHistory: () => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

interface CanvasProviderProps {
  children: ReactNode;
}

export const CanvasProvider: React.FC<CanvasProviderProps> = ({ children }) => {
  const [canvas, setCanvasState] = useState<fabric.Canvas | null>(null);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const setCanvas = useCallback((newCanvas: fabric.Canvas) => {
    console.log('🎨 Setting up canvas context');
    console.log('🎯 Canvas dimensions:', newCanvas.width, 'x', newCanvas.height);
    console.log('🎯 Canvas disposed?', newCanvas.isDisposed);
    
    setCanvasState(newCanvas);
    
    // Sync with unified state immediately
    unifiedState.canvas = newCanvas;
    
    console.log('✅ Canvas successfully set in both contexts');
    console.log('🔗 Unified state canvas:', !!unifiedState.canvas);
  }, []);

  const addToHistory = useCallback(() => {
    if (!canvas || canvas.isDisposed) {
      console.log('⚠️ Canvas not available or disposed, cannot add to history');
      return;
    }
    
    // Check if canvas context is valid before serializing
    if (!canvas.contextTop || canvas.isDisposed) {
      console.log('⚠️ Canvas context invalid, cannot add to history');
      return;
    }
    
    // Additional safety check for canvas readiness
    if (!canvas.getElement() || canvas.getElement().width === 0) {
      console.log('⚠️ Canvas element not ready, skipping history');
      return;
    }
    
    try {
      console.log('🏛️ Adding to history, current objects:', canvas.getObjects().length);
      
      const canvasData = JSON.stringify(canvas.toJSON());
      const newHistory = canvasHistory.slice(0, historyIndex + 1);
      newHistory.push(canvasData);
      
      setCanvasHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      console.log('Canvas durumu history\'ye eklendi. Toplam:', newHistory.length);
      
      // Note: Auto-sync disabled - using immediate sync in components
      
    } catch (error) {
      console.error('History\'ye eklenirken hata:', error);
    }
  }, [canvas, canvasHistory, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0 && canvas && canvas.contextTop && !canvas.isDisposed) {
      console.log('Undoing...');
      try {
        const prevState = canvasHistory[historyIndex - 1];
        canvas.loadFromJSON(prevState, () => {
          if (canvas.contextTop && !canvas.isDisposed) {
            canvas.renderAll();
            setHistoryIndex(historyIndex - 1);
            console.log('Undo successful');
            
            // Sync to 3D after undo
            setTimeout(() => {
              unifiedState.syncCanvasToThreeJS();
              console.log('↩️ Undo - syncing to 3D');
            }, 200);
          }
        });
      } catch (error) {
        console.error('Error during undo:', error);
      }
    }
  }, [canvas, canvasHistory, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < canvasHistory.length - 1 && canvas && canvas.contextTop && !canvas.isDisposed) {
      console.log('Redoing...');
      try {
        const nextState = canvasHistory[historyIndex + 1];
        canvas.loadFromJSON(nextState, () => {
          if (canvas.contextTop && !canvas.isDisposed) {
            canvas.renderAll();
            setHistoryIndex(historyIndex + 1);
            console.log('Redo successful');
            
            // Sync to 3D after redo
            setTimeout(() => {
              unifiedState.syncCanvasToThreeJS();
              console.log('↪️ Redo - syncing to 3D');
            }, 200);
          }
        });
      } catch (error) {
        console.error('Error during redo:', error);
      }
    }
  }, [canvas, canvasHistory, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < canvasHistory.length - 1;

  const value: CanvasContextType = {
    canvas,
    setCanvas,
    canUndo,
    canRedo,
    undo,
    redo,
    addToHistory
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = (): CanvasContextType => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};