import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Center, OrbitControls } from '@react-three/drei';
import { useSnapshot } from 'valtio';
import { Shirt } from '../three-components/Shirt';
import { Backdrop } from '../three-components/Backdrop';
import { CameraRig } from '../three-components/CameraRig';
import { unifiedState } from '../store/unifiedState';

const ThreeJSCanvas: React.FC = () => {
  const snap = useSnapshot(unifiedState);
  
  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ preserveDrawingBuffer: true }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.5} />
        <Environment preset="city" />
        
        <OrbitControls 
          autoRotate={snap.autoRotate}
          autoRotateSpeed={1}
          screenSpacePanning={true}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1.5}
          maxDistance={8}
          dampingFactor={0.05}
          enableDamping={true}
          target={[0, 0, 0]}
        />

        <CameraRig>
          <Backdrop />
          <Center>
            <group scale={[1.6, 1.6, 1.6]} position={[0, 0, 0]}>
              <Shirt />
            </group>
          </Center>
        </CameraRig>
      </Canvas>
      
      {/* 3D Controls Info */}
      <div className="absolute top-4 left-4">
        <div className="bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg text-white text-xs">
          <div className="space-y-1">
            <div>🖱️ Drag to rotate</div>
            <div>🔍 Scroll to zoom</div>
            <div>⌘ Right-click to pan</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeJSCanvas;