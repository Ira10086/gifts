import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Particles from './Particles';
import { HandData } from '../types';

interface ExperienceProps {
  handData: HandData;
}

const Experience: React.FC<ExperienceProps> = ({ handData }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: false, alpha: false }} // Optimization for post-processing
      dpr={[1, 2]} // Support high DPI
    >
      <color attach="background" args={['#050505']} />
      
      <Particles handData={handData} />

      <EffectComposer enableNormalPass={false}>
        <Bloom 
            luminanceThreshold={0.2} 
            mipmapBlur 
            intensity={1.5} 
            radius={0.4}
        />
      </EffectComposer>
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        enableRotate={false} // Disable mouse rotation, we use hand rotation
      />
    </Canvas>
  );
};

export default Experience;