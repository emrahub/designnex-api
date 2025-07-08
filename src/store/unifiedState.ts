import { proxy } from 'valtio';
import { fabric } from 'fabric';

interface UnifiedState {
  // Canvas state (using ref to avoid snapshot warnings)
  canvas: fabric.Canvas | null;
  canvasDesign: string | null;
  
  // Three.js state  
  intro: boolean;
  color: string;
  isLogoTexture: boolean;
  isFullTexture: boolean;
  logoDecal: string;
  fullDecal: string;
  autoRotate: boolean;
  
  // Sync functions
  syncCanvasToThreeJS: () => void;
  exportCanvasAsTexture: () => string | null;
}

export const unifiedState = proxy<UnifiedState>({
  // Canvas state
  canvas: null,
  canvasDesign: null,
  
  // Three.js state (inherited from original)
  intro: true,
  color: '#ffffff', // Clean white T-shirt
  isLogoTexture: false,
  isFullTexture: false,
  logoDecal: '',
  fullDecal: './threejs.png',
  autoRotate: false,
  
  // Sync canvas design to Three.js
  syncCanvasToThreeJS() {
    console.log('🔄 Starting canvas sync...');
    console.log('Canvas state:', this.canvas ? 'Available' : 'Not available');
    console.log('🔍 Canvas reference check:', !!this.canvas);
    console.log('🔍 Canvas disposed?:', this.canvas?.isDisposed);
    console.log('🔍 Current isLogoTexture before sync:', this.isLogoTexture);
    console.log('🔍 Current logoDecal length before sync:', this.logoDecal?.length || 0);
    
    if (this.canvas) {
      const objects = this.canvas.getObjects();
      console.log('🎯 CRITICAL: Canvas objects count:', objects.length);
      console.log('🎯 CRITICAL: Canvas objects details:', objects.map(obj => ({
        type: obj.type,
        visible: obj.visible,
        left: obj.left,
        top: obj.top,
        width: obj.width,
        height: obj.height
      })));
    }
    
    try {
      if (this.canvas && !this.canvas.isDisposed) {
        console.log('✅ Canvas validation passed');
        
        // Check if canvas has content
        const objects = this.canvas.getObjects();
        console.log('Canvas objects count:', objects.length);
        console.log('Canvas objects:', objects.map(obj => ({ 
          type: obj.type, 
          visible: obj.visible, 
          left: obj.left, 
          top: obj.top,
          text: obj.type === 'textbox' || obj.type === 'text' ? (obj as any).text : undefined
        })));
        console.log('🔍 Will take objects.length > 0 path:', objects.length > 0);
        
        // Only check for objects - ignore previous logoDecal to prevent phantom textures
        const hasContent = objects.length > 0;
        console.log('🔍 Content check - objects:', objects.length, 'logoDecal length:', this.logoDecal?.length || 0, 'hasContent:', hasContent);
        
        if (hasContent) {
          console.log('📸 Exporting canvas with objects using Fabric.js...');
          
          let dataURL;
          try {
            // Force render before export
            this.canvas.renderAll();
            console.log('📸 Canvas rendered, attempting export...');
            
            // Use simpler export options to avoid potential errors
            dataURL = this.canvas.toDataURL({
              format: 'png',
              quality: 0.8,
              multiplier: 1
            });
            console.log('✅ Fabric.js export successful with objects');
            console.log('📊 Data URL length:', dataURL?.length || 0);
          } catch (fabricError) {
            console.log('❌ Fabric.js export failed:', fabricError);
            console.log('🔄 Trying fallback method...');
            
            // Fallback method
            const canvasElement = this.canvas.getElement();
            if (canvasElement) {
              try {
                dataURL = canvasElement.toDataURL('image/png');
                console.log('✅ Element export successful');
                console.log('📊 Fallback data URL length:', dataURL?.length || 0);
              } catch (elementError) {
                console.log('❌ Element export failed:', elementError);
                // Last resort - create a simple texture
                dataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
                console.log('🆘 Using emergency fallback texture');
              }
            }
          }
          
          if (dataURL) {
            console.log('📸 Canvas exported successfully');
            console.log('📊 Data URL length:', dataURL.length);
            console.log('🔗 Data URL starts with:', dataURL.substring(0, 50));
            
            // Update state immediately
            this.logoDecal = dataURL;
            this.isLogoTexture = true;
            this.canvasDesign = dataURL;
            
            console.log('✅ Canvas design synced to Three.js');
            console.log('🎯 isLogoTexture SET TO:', this.isLogoTexture);
            console.log('🎯 logoDecal length:', this.logoDecal.length);
            console.log('🎯 logoDecal preview:', this.logoDecal.substring(0, 50));
          } else {
            console.log('❌ Failed to export canvas data');
          }
        } else {
          console.log('⚠️ Canvas has no objects - checking for previous texture to preserve');
          console.log('🔍 Debug - objects.length:', objects.length, 'logoDecal length:', this.logoDecal?.length || 0);
          
          // CRITICAL: If we had a texture before but now have no objects, 
          // this might be a timing issue - preserve the previous texture temporarily
          if (this.logoDecal && this.logoDecal.length > 200) {
            console.log('🔄 PRESERVING previous texture during sync - objects may be temporarily invisible');
            console.log('🔍 Previous logoDecal length:', this.logoDecal.length);
            console.log('🔍 Keeping isLogoTexture as:', this.isLogoTexture);
            // Don't change anything - keep previous state
            return;
          } else {
            console.log('🧹 No previous texture found - creating empty transparent texture');
            // Create transparent texture for empty canvas
            const emptyCanvas = document.createElement('canvas');
            emptyCanvas.width = 512;
            emptyCanvas.height = 512;
            const ctx = emptyCanvas.getContext('2d');
            
            if (ctx) {
              // Just clear - fully transparent
              ctx.clearRect(0, 0, 512, 512);
              const emptyDataURL = emptyCanvas.toDataURL('image/png');
              
              this.logoDecal = emptyDataURL;
              this.isLogoTexture = false; // Disable when empty
              this.canvasDesign = emptyDataURL;
              
              console.log('✅ Empty transparent texture created - isLogoTexture SET TO FALSE');
            }
          }
        }
      } else {
        console.log('❌ Canvas not available, disabling logo texture');
        this.isLogoTexture = false;
        this.logoDecal = '';
      }
    } catch (outerError) {
      console.error('❌ Sync function outer error:', outerError);
      // Ensure texture sync doesn't block 3D modal
      this.isLogoTexture = false;
      this.logoDecal = '';
      console.log('🆘 Sync failed but modal should still work');
      console.log('🔍 Error caused isLogoTexture to be set to FALSE');
    }
    
    // Disable emergency fix - it causes phantom textures
    // Only enable texture if we actually have canvas objects
    const currentObjects = this.canvas ? this.canvas.getObjects() : [];
    if (currentObjects.length === 0) {
      console.log('🧹 CLEAN SLATE: No objects detected, disabling texture completely');
      this.isLogoTexture = false;
      this.logoDecal = '';
    }
    
    console.log('🔍 FINAL SYNC RESULT:');
    console.log('🔍 Final isLogoTexture:', this.isLogoTexture);
    console.log('🔍 Final logoDecal length:', this.logoDecal?.length || 0);
    console.log('🔍 Sync complete!');
  },
  
  // Export canvas as texture with transparent background for 3D
  exportCanvasAsTexture() {
    if (this.canvas && !this.canvas.isDisposed) {
      try {
        // Save current background
        const originalBg = this.canvas.backgroundColor;
        
        // Set transparent background for 3D export
        this.canvas.setBackgroundColor('transparent', () => {
          // Export with transparent background
          const dataURL = this.canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2 // Higher resolution for better quality
          });
          
          // Restore original background
          this.canvas.setBackgroundColor(originalBg, () => {
            this.canvas.renderAll();
          });
          
          return dataURL;
        });
        
        // Return the export (this will be called in the callback)
        return this.canvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 2
        });
      } catch (error) {
        console.error('❌ Canvas export error:', error);
        return null;
      }
    }
    return null;
  }
});

export default unifiedState;