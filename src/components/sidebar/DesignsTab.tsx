import React, { useState } from 'react';
import { fabric } from 'fabric';
import { Sparkles, Zap, Square, Circle, Triangle, Bot, Send, Loader2 } from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';
import unifiedState from '../../store/unifiedState';
import { aiService } from '../../services/aiService';

interface DesignsTabProps {
  canvasRef?: React.MutableRefObject<fabric.Canvas | null>;
}

const DesignsTab: React.FC<DesignsTabProps> = () => {
  const { canvas, addToHistory } = useCanvas();
  const [activeTab, setActiveTab] = useState<'designs' | 'shapes' | 'ai'>('designs');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{id: string, url: string, prompt: string, revisedPrompt?: string}>>([]);
  const aiStatus = aiService.getStatus();

  const readyDesigns = [
    { id: 1, name: 'Mountain Peak', category: 'Nature', preview: '🏔️' },
    { id: 2, name: 'Eagle Wing', category: 'Animals', preview: '🦅' },
    { id: 3, name: 'Golden Star', category: 'Badges', preview: '⭐' },
    { id: 4, name: 'Lightning Bolt', category: 'Energy', preview: '⚡' },
    { id: 5, name: 'Royal Crown', category: 'Royal', preview: '👑' },
    { id: 6, name: 'Fire Flame', category: 'Energy', preview: '🔥' },
    { id: 7, name: 'Ocean Wave', category: 'Nature', preview: '🌊' },
    { id: 8, name: 'Skull Art', category: 'Edgy', preview: '💀' },
    { id: 9, name: 'Love Heart', category: 'Love', preview: '❤️' },
    { id: 10, name: 'Diamond Gem', category: 'Luxury', preview: '💎' },
    { id: 11, name: 'Space Rocket', category: 'Space', preview: '🚀' },
    { id: 12, name: 'Music Note', category: 'Art', preview: '🎵' },
    { id: 13, name: 'Sun Shine', category: 'Nature', preview: '☀️' },
    { id: 14, name: 'Moon Crescent', category: 'Space', preview: '🌙' },
    { id: 15, name: 'Tree Life', category: 'Nature', preview: '🌳' },
    { id: 16, name: 'Butterfly', category: 'Animals', preview: '🦋' }
  ];

  const geometricShapes = [
    { id: 'rect', name: 'Rectangle', icon: Square, color: '#3b82f6' },
    { id: 'circle', name: 'Circle', icon: Circle, color: '#10b981' },
    { id: 'triangle', name: 'Triangle', icon: Triangle, color: '#f59e0b' },
    { id: 'ellipse', name: 'Ellipse', icon: Circle, color: '#8b5cf6' },
    { id: 'polygon', name: 'Hexagon', icon: Square, color: '#ef4444' },
    { id: 'star', name: 'Star', icon: Sparkles, color: '#f59e0b' }
  ];

  const addDesignToCanvas = (design: any) => {
    if (!canvas) return;

    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;
    
    const designObject = new fabric.Text(design.preview, {
      left: centerX,
      top: centerY,
      fontSize: 80,
      originX: 'center',
      originY: 'center',
      selectable: true,
      moveable: true,
      name: `design_${design.id}_${Date.now()}`,
      fill: '#fbbf24',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      opacity: 1,
      visible: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      borderColor: '#f59e0b',
      cornerColor: '#f59e0b',
      cornerSize: 15,
      stroke: '#ffffff',
      strokeWidth: 1
    });

    canvas.add(designObject);
    canvas.setActiveObject(designObject);
    canvas.renderAll();
    
    addToHistory();
  };

  const addShapeToCanvas = (shape: any) => {
    if (!canvas) return;

    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;
    let shapeObject: fabric.Object;

    const commonProps = {
      left: centerX,
      top: centerY,
      originX: 'center' as const,
      originY: 'center' as const,
      selectable: true,
      fill: shape.color,
      stroke: '#ffffff',
      strokeWidth: 2,
      name: `shape_${shape.id}_${Date.now()}`
    };

    switch (shape.id) {
      case 'rect':
        shapeObject = new fabric.Rect({
          ...commonProps,
          width: 120,
          height: 80
        });
        break;
      case 'circle':
        shapeObject = new fabric.Circle({
          ...commonProps,
          radius: 50
        });
        break;
      case 'triangle':
        shapeObject = new fabric.Triangle({
          ...commonProps,
          width: 100,
          height: 100
        });
        break;
      case 'ellipse':
        shapeObject = new fabric.Ellipse({
          ...commonProps,
          rx: 60,
          ry: 40
        });
        break;
      case 'polygon':
        // Hexagon points
        const points = [];
        const sides = 6;
        const radius = 50;
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides;
          points.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
          });
        }
        shapeObject = new fabric.Polygon(points, {
          ...commonProps
        });
        break;
      case 'star':
        // Star points
        const starPoints = [];
        const outerRadius = 50;
        const innerRadius = 25;
        const starSides = 5;
        for (let i = 0; i < starSides * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / starSides;
          starPoints.push({
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
          });
        }
        shapeObject = new fabric.Polygon(starPoints, {
          ...commonProps
        });
        break;
      default:
        return;
    }

    canvas.add(shapeObject);
    canvas.setActiveObject(shapeObject);
    canvas.renderAll();
    
    addToHistory();
  };

  const generateAIDesign = async () => {
    if (!aiPrompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      console.log('🤖 Generating AI design with prompt:', aiPrompt);
      
      // Use the AI service to generate the image
      const response = await aiService.generateImage({
        prompt: aiPrompt,
        size: '512x512',
        n: 1
      });
      
      if (response.data && response.data.length > 0) {
        const newImage = {
          id: Date.now().toString(),
          url: response.data[0].url,
          prompt: aiPrompt,
          revisedPrompt: response.data[0].revised_prompt
        };
        
        setGeneratedImages(prev => [newImage, ...prev]);
        setAiPrompt('');
        
        console.log('✅ AI design generated successfully');
      } else {
        throw new Error('No image data received from AI service');
      }
    } catch (error) {
      console.error('❌ AI generation failed:', error);
      alert(`Failed to generate AI design: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const addAIImageToCanvas = async (imageUrl: string, prompt: string) => {
    if (!canvas) return;

    try {
      console.log('🖼️ Adding AI generated image to canvas:', prompt);

      // Clear the canvas before adding the new image
      canvas.clear();

      const centerX = canvas.width! / 2;
      const centerY = canvas.height! / 2;

      // Load the image and add to canvas
      fabric.Image.fromURL(imageUrl, (img) => {
        if (!img) {
          console.error('Failed to load AI generated image');
          return;
        }

        // Scale the image to reasonable size
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width!, maxSize / img.height!);

        img.set({
          left: centerX,
          top: centerY,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          selectable: true,
          name: `ai_design_${Date.now()}`,
          crossOrigin: 'anonymous'
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        addToHistory();

        // Sync with the 3D model
        unifiedState.syncCanvasToThreeJS();

        console.log('✅ AI image added to canvas and synced successfully');
      }, { crossOrigin: 'anonymous' });

    } catch (error) {
      console.error('❌ Failed to add AI image to canvas:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, design: any) => {
    const dragData = JSON.stringify({
      type: 'design',
      ...design
    });
    
    e.dataTransfer.setData('text/plain', dragData);
    e.dataTransfer.effectAllowed = 'copy';
    
    const dragImage = document.createElement('div');
    dragImage.innerHTML = design.preview;
    dragImage.style.fontSize = '48px';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 24, 24);
    
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const categories = [...new Set(readyDesigns.map(design => design.category))];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Design Tools</h3>
        </div>
        
        {/* Tab Navigation - Enhanced with better visual hierarchy */}
        <div className="space-y-3 mb-4">
          {/* Main Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('designs')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'designs'
                  ? 'bg-white text-gray-900 shadow-lg shadow-blue-100 border border-blue-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className={`w-4 h-4 ${activeTab === 'designs' ? 'text-blue-600' : ''}`} />
                <span>Designs</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('shapes')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'shapes'
                  ? 'bg-white text-gray-900 shadow-lg shadow-green-100 border border-green-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Square className={`w-4 h-4 ${activeTab === 'shapes' ? 'text-green-600' : ''}`} />
                <span>Shapes</span>
              </div>
            </button>
          </div>

          {/* AI Design - Special Featured Tab */}
          <button
            onClick={() => setActiveTab('ai')}
            className={`w-full py-4 px-4 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-200 transform scale-[1.02]'
                : 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 hover:from-purple-100 hover:to-blue-100 border border-purple-200 hover:border-purple-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-center space-x-3">
              <div className={`p-1.5 rounded-lg ${activeTab === 'ai' ? 'bg-white/20' : 'bg-purple-200'}`}>
                <Bot className={`w-5 h-5 ${activeTab === 'ai' ? 'text-white' : 'text-purple-600'}`} />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base">AI Design Generator</span>
                <span className={`text-xs ${activeTab === 'ai' ? 'text-purple-100' : 'text-purple-500'}`}>
                  ✨ Create with DALL-E
                </span>
              </div>
              {!aiStatus.mock && (
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${activeTab === 'ai' ? 'bg-green-400 text-green-900' : 'bg-green-100 text-green-700'}`}>
                  LIVE
                </div>
              )}
              {aiStatus.mock && (
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${activeTab === 'ai' ? 'bg-yellow-400 text-yellow-900' : 'bg-yellow-100 text-yellow-700'}`}>
                  DEMO
                </div>
              )}
            </div>
            
            {/* Animated background effect when active */}
            {activeTab === 'ai' && (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 animate-pulse"></div>
            )}
          </button>
        </div>
        
        <p className="text-sm text-gray-600">
          {activeTab === 'designs' 
            ? 'Professional designs crafted by our expert team' 
            : activeTab === 'shapes'
            ? 'Perfect geometric shapes for your designs'
            : 'Create unique designs with AI-powered generation'
          }
        </p>
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-blue-800 font-medium">
              <strong>Pro Tip:</strong> {activeTab === 'ai' ? 'Enter a prompt and generate custom designs with AI' : `Click to add ${activeTab} directly to the canvas`}
            </p>
          </div>
        </div>
      </div>

      {/* Designs Tab Content */}
      {activeTab === 'designs' && (
        <>
          {categories.map(category => (
            <div key={category} className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide flex items-center space-x-2">
                <span>{category}</span>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  {readyDesigns.filter(design => design.category === category).length}
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {readyDesigns
                  .filter(design => design.category === category)
                  .map(design => (
                    <div
                      key={design.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, design)}
                      onClick={() => addDesignToCanvas(design)}
                      className="group bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-purple-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 text-center transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 cursor-pointer select-none"
                      style={{ userSelect: 'none' }}
                    >
                      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200 pointer-events-none">
                        {design.preview}
                      </div>
                      <div className="text-xs font-medium text-gray-700 group-hover:text-blue-700 pointer-events-none">
                        {design.name}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          ))}
        </>
      )}

      {/* Shapes Tab Content */}
      {activeTab === 'shapes' && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide flex items-center space-x-2">
            <span>Geometric Shapes</span>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
              {geometricShapes.length}
            </span>
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {geometricShapes.map(shape => {
              const IconComponent = shape.icon;
              return (
                <div
                  key={shape.id}
                  onClick={() => addShapeToCanvas(shape)}
                  className="group bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-purple-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 text-center transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 cursor-pointer select-none"
                  style={{ userSelect: 'none' }}
                >
                  <div className="mb-2 group-hover:scale-110 transition-transform duration-200 pointer-events-none">
                    <IconComponent 
                      className="w-8 h-8 mx-auto" 
                      style={{ color: shape.color }}
                    />
                  </div>
                  <div className="text-xs font-medium text-gray-700 group-hover:text-blue-700 pointer-events-none">
                    {shape.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Design Tab Content */}
      {activeTab === 'ai' && (
        <div className="mb-6 space-y-6">
          {/* AI Hero Section */}
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">AI Design Studio</h3>
                  <p className="text-purple-100 text-sm">Powered by DALL-E Technology</p>
                </div>
                <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${aiStatus.mock ? 'bg-yellow-400 text-yellow-900' : 'bg-green-400 text-green-900'}`}>
                  {aiStatus.mock ? 'DEMO' : 'LIVE'}
                </div>
              </div>
              
              <p className="text-purple-100 text-sm mb-4">
                Transform your ideas into stunning visuals with the power of artificial intelligence.
              </p>
            </div>
          </div>

          {/* AI Prompt Input */}
          <div className="bg-white border-2 border-purple-100 rounded-2xl p-5 shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h4 className="text-base font-bold text-gray-800">Create Your Design</h4>
              </div>
              
              <div className="space-y-3">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your perfect design... ✨&#10;&#10;Examples:&#10;• A minimalist mountain logo in blue and white&#10;• Geometric tiger face with bold lines&#10;• Vintage coffee shop emblem with retro styling"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none h-24 placeholder-gray-400"
                  disabled={isGenerating}
                />
                
                <button
                  onClick={generateAIDesign}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-base group"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Your Design...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      <span>Generate AI Design</span>
                      <Sparkles className="w-4 h-4 opacity-70" />
                    </>
                  )}
                </button>
              </div>
              
              {aiStatus.mock && (
                <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-yellow-800">Demo Mode Active</span>
                  </div>
                  <p className="text-xs text-yellow-700 leading-relaxed">
                    Currently using placeholder images for demonstration. 
                    Add <code className="bg-yellow-200 px-1 rounded">VITE_OPENAI_API_KEY</code> to your environment for real DALL-E integration.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Generated Images */}
          {generatedImages.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide flex items-center space-x-2">
                <span>Generated Designs</span>
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                  {generatedImages.length}
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {generatedImages.map(image => (
                  <div
                    key={image.id}
                    onClick={() => addAIImageToCanvas(image.url, image.prompt)}
                    className="group bg-gradient-to-br from-white to-gray-50 hover:from-purple-50 hover:to-blue-50 border border-gray-200 hover:border-purple-300 rounded-xl p-3 text-center transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 cursor-pointer select-none"
                    style={{ userSelect: 'none' }}
                  >
                    <div className="mb-2 group-hover:scale-105 transition-transform duration-200 pointer-events-none">
                      <img 
                        src={image.url} 
                        alt={image.prompt}
                        className="w-full h-20 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                    <div className="text-xs font-medium text-gray-700 group-hover:text-purple-700 pointer-events-none truncate">
                      {image.prompt.length > 30 ? `${image.prompt.slice(0, 30)}...` : image.prompt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {generatedImages.length === 0 && !isGenerating && (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-700 mb-2">No AI designs yet</h3>
              <p className="text-xs text-gray-500">Enter a prompt above to generate your first AI design</p>
            </div>
          )}
        </div>
      )}

      {/* DesignNex Signature */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <Zap className="w-3 h-3 text-blue-600" />
          <span>Powered by DesignNex Studio</span>
        </div>
      </div>
    </div>
  );
};

export default DesignsTab;