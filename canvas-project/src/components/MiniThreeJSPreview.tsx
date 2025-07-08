import React, { Suspense } from 'react';
import { Canvas as ThreeCanvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { useSnapshot } from 'valtio';
import { Shirt } from '../three-components/Shirt';
import { unifiedState } from '../store/unifiedState';

const MiniThreeJSPreview: React.FC = () => {
  const snap = useSnapshot(unifiedState);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative">
      <ThreeCanvas
        shadows
        camera={{ position: [0, 0, 0], fov: 45 }}
        gl={{ preserveDrawingBuffer: true }}
        style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)' }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 2.2]} />
          
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1}
            castShadow
            shadow-mapSize={1024}
          />
          <spotLight
            position={[0, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={0.3}
            castShadow
          />
          
          {/* Environment */}
          <Environment preset="city" />
          
          {/* T-shirt Model - Scaled up */}
          <group scale={[1.8, 1.8, 1.8]} position={[0, 0, 0]}>
            <Shirt />
          </group>
          
          {/* Controls - Limited for mini preview */}
          <OrbitControls 
            enablePan={false}
            enableZoom={false}
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={0.8}
            maxPolarAngle={Math.PI / 1.6}
            minPolarAngle={Math.PI / 3.5}
            target={[0, 0, 0]}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Suspense>
      </ThreeCanvas>
      
      {/* Mini Preview Overlay */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
        Mini Preview
      </div>
      
      {/* Texture Status Indicator */}
      <div className="absolute top-2 right-2">
        <div className={`w-3 h-3 rounded-full ${snap.isLogoTexture && snap.logoDecal.startsWith('data:') ? 'bg-green-400' : 'bg-gray-400'}`}></div>
      </div>
    </div>
  );
};

export default MiniThreeJSPreview;