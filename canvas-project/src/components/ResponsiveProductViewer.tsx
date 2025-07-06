import React, { Suspense, useEffect, useState } from 'react';
import { Canvas as ThreeCanvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { useSnapshot } from 'valtio';
import { Shirt } from '../three-components/Shirt';
import { unifiedState } from '../store/unifiedState';
import ErrorBoundary from './ErrorBoundary';

interface ProductConfig {
  scale: number;
  position: [number, number, number];
  cameraDistance: number;
  fov: number;
  rotationLimits: {
    maxPolar: number;
    minPolar: number;
  };
}

const PRODUCT_CONFIGS: { [key: string]: ProductConfig } = {
  'tshirt': {
    scale: 1.8,
    position: [0, 0, 0],
    cameraDistance: 2.2,
    fov: 45,
    rotationLimits: {
      maxPolar: Math.PI / 1.6,
      minPolar: Math.PI / 3.5
    }
  },
  'hoodie': {
    scale: 1.6,
    position: [0, 0.1, 0],
    cameraDistance: 2.5,
    fov: 42,
    rotationLimits: {
      maxPolar: Math.PI / 1.5,
      minPolar: Math.PI / 4
    }
  },
  'mug': {
    scale: 2.2,
    position: [0, -0.1, 0],
    cameraDistance: 1.8,
    fov: 50,
    rotationLimits: {
      maxPolar: Math.PI / 1.3,
      minPolar: Math.PI / 6
    }
  },
  'cap': {
    scale: 2.0,
    position: [0, 0.05, 0],
    cameraDistance: 2.0,
    fov: 48,
    rotationLimits: {
      maxPolar: Math.PI / 1.4,
      minPolar: Math.PI / 5
    }
  }
};

interface ResponsiveProductViewerProps {
  productType?: string;
  isFullscreen?: boolean;
  className?: string;
}

const ResponsiveProductViewer: React.FC<ResponsiveProductViewerProps> = ({ 
  productType = 'tshirt', 
  isFullscreen = false,
  className = '' 
}) => {
  const snap = useSnapshot(unifiedState);
  const [config, setConfig] = useState<ProductConfig>(PRODUCT_CONFIGS[productType]);

  useEffect(() => {
    setConfig(PRODUCT_CONFIGS[productType] || PRODUCT_CONFIGS['tshirt']);
  }, [productType]);

  // Adjust scale for fullscreen to prevent masking
  const finalScale = isFullscreen ? config.scale * 1.1 : config.scale;
  const finalCameraDistance = isFullscreen ? config.cameraDistance * 0.9 : config.cameraDistance;

  return (
    <ErrorBoundary>
      <div className={`w-full h-full rounded-lg overflow-hidden relative ${className}`}>
        <ThreeCanvas
        shadows={true} // Always enable shadows
        camera={{ position: [0, 0, 0], fov: isFullscreen ? config.fov + 5 : config.fov }}
        gl={{ 
          preserveDrawingBuffer: true,
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
          depth: true,
          stencil: false,
          logarithmicDepthBuffer: false
        }}
        style={{ 
          background: isFullscreen ? '#ffffff' : 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)'
        }}
        performance={{ min: 0.8 }} // Higher performance threshold
        frameloop="always" // Always render for consistent updates
      >
        <Suspense fallback={
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#f0f0f0" />
          </mesh>
        }>
          <PerspectiveCamera 
            makeDefault 
            position={[0, 0, finalCameraDistance]} 
            fov={isFullscreen ? config.fov + 5 : config.fov}
            near={0.01}
            far={1000}
          />
          
          {/* Enhanced Lighting for realistic fabric */}
          <ambientLight intensity={0.4} />
          
          {/* Key Light */}
          <directionalLight 
            position={[5, 10, 5]} 
            intensity={0.8}
            castShadow={true}
            shadow-mapSize={1024}
            shadow-camera-far={20}
            shadow-camera-near={0.1}
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={5}
            shadow-camera-bottom={-5}
          />
          
          {/* Fill Light */}
          <directionalLight 
            position={[-3, 5, 2]} 
            intensity={0.3}
            color="#fff"
          />
          
          {/* Enhanced environment */}
          <Environment preset="warehouse" environmentIntensity={0.6} />
          
          {/* Product Model - Responsive Scale */}
          <group 
            scale={[finalScale, finalScale, finalScale]} 
            position={config.position}
          >
            <Shirt />
          </group>
          
          {/* Controls - Consistent for both views */}
          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            autoRotate={snap.autoRotate}
            autoRotateSpeed={1.5}
            maxPolarAngle={config.rotationLimits.maxPolar}
            minPolarAngle={config.rotationLimits.minPolar}
            target={[0, 0, 0]}
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={isFullscreen ? 1.2 : 1.5}
            maxDistance={isFullscreen ? 10 : 8}
          />
        </Suspense>
      </ThreeCanvas>
      
      {/* Product Info Overlay */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
        3D Preview
      </div>
      
      {/* Texture Status Indicator */}
      <div className="absolute top-2 right-2">
        <div className={`w-3 h-3 rounded-full ${snap.isLogoTexture && snap.logoDecal.startsWith('data:') ? 'bg-green-400' : 'bg-gray-400'}`}></div>
      </div>
      
      {/* Product Type Indicator */}
      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
        {productType.charAt(0).toUpperCase() + productType.slice(1)}
      </div>
      </div>
    </ErrorBoundary>
  );
};

export default ResponsiveProductViewer;