import { Canvas } from '@react-three/fiber'
import { Environment, Center, OrbitControls } from '@react-three/drei';

import Shirt from './Shirt';
import Backdrop from './Backdrop';
import CameraRig from './CameraRig';
import { useSnapshot } from 'valtio';
import state from '../store';

const CanvasModel = () => {
  const snap = useSnapshot(state);
  
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 4], fov: 25 }}
      gl={{ preserveDrawingBuffer: true }}
      className="w-full max-w-full h-full transition-all ease-in"
    >
      <ambientLight intensity={0.5} />
      
      <OrbitControls 
        autoRotate={snap.autoRotate}
        autoRotateSpeed={1}
        screenSpacePanning={true}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={20}
        dampingFactor={0.05}
        enableDamping={true}
      />

      <CameraRig>
        <Backdrop />
        <Center>
          <Shirt />
        </Center>
      </CameraRig>
    </Canvas>
  )
}

export default CanvasModel