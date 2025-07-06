import React, { useMemo, useEffect, useState } from 'react';
import { easing } from 'maath';
import { useSnapshot } from 'valtio';
import { useFrame, useLoader } from '@react-three/fiber';
import { Decal, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { unifiedState } from '../store/unifiedState';

export const Shirt: React.FC = () => {
  const snap = useSnapshot(unifiedState);
  const { nodes, materials } = useGLTF('/shirt_baked.glb') as any;
  
  // Override the original material to prevent DoubleSide rendering
  if (materials?.lambert1) {
    materials.lambert1.side = THREE.FrontSide;
  }
  
  
  console.log('👕 Shirt component rendering...');
  console.log('🎯 Nodes:', !!nodes);
  console.log('🎯 Materials:', !!materials);
  console.log('🎯 T_Shirt_male geometry:', !!nodes?.T_Shirt_male?.geometry);

  // Default texture loading
  const defaultTexture = useLoader(THREE.TextureLoader, '/threejs.png');
  
  // Define a fallback for empty textures to avoid crashing useLoader
  const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  // Load textures with proper configuration for front-only display
  const logoTexture = useMemo(() => {
    console.log('🎨 Shirt texture loading check:', {
      hasLogoDecal: !!snap.logoDecal,
      logoDecalLength: snap.logoDecal?.length || 0,
      isLogoTexture: snap.isLogoTexture,
      logoDecalPreview: snap.logoDecal?.substring(0, 50)
    });
    
    if (snap.logoDecal && snap.logoDecal.startsWith('data:') && snap.logoDecal.length > 200) {
      const texture = new THREE.TextureLoader().load(snap.logoDecal);
      texture.flipY = true;  // Flip Y to match canvas orientation
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      texture.generateMipmaps = false;
      
      // Force texture update
      texture.needsUpdate = true;
      
      console.log('✅ Shirt texture loaded successfully');
      return texture;
    }
    console.log('❌ Shirt texture not loaded - conditions not met');
    return null;
  }, [snap.logoDecal, snap.isLogoTexture]);
  
  const fullTexture = useLoader(THREE.TextureLoader, snap.fullDecal);

  

  return (
    <group>
      {/* Single mesh with DoubleSide but Decal configured for front only */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.T_Shirt_male.geometry}
        dispose={null}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color={snap.color}
          roughness={0.85}
          metalness={0.0}
          transparent={false}
          opacity={1.0}
          side={THREE.DoubleSide}
          flatShading={false}
          envMapIntensity={0.3}
        />
        
        {snap.isFullTexture && (
          <Decal 
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={1}
            map={fullTexture}
          />
        )}

        {snap.isLogoTexture && logoTexture && snap.logoDecal && snap.logoDecal.length > 200 && (
          <mesh 
            position={[0, 0.08, 0.16]}
            rotation={[0, 0, 0]}
            scale={[0.5, 0.4, 1]}
            frustumCulled={false}
          >
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial
              map={logoTexture}
              transparent={true}
              side={THREE.FrontSide}
              alphaTest={0.5}
              depthTest={true}
              depthWrite={false}
            />
          </mesh>
        )}
      </mesh>
    </group>
  );
};