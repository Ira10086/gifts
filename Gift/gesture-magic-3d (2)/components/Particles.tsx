import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GestureType, HandData } from '../types';
import { 
  PARTICLE_COUNT, 
  generatePlanetWithRing,
  generateHeart, 
  generateFireworks, 
  generateText, 
  generateColors 
} from '../utils/shapeGenerator';

interface ParticlesProps {
  handData: HandData;
}

const Particles: React.FC<ParticlesProps> = ({ handData }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  // Track Rotation
  const autoRotationY = useRef(0);
  const prevGesture = useRef<GestureType>(GestureType.NONE);

  // --- Precompute Geometries ---
  const shapes = useMemo(() => ({
    [GestureType.NONE]: { pos: generatePlanetWithRing(), col: generateColors('NEBULA') },
    [GestureType.CLOSED_FIST]: { pos: generatePlanetWithRing(), col: generateColors('NEBULA') },
    [GestureType.OPEN_PALM]: { pos: generateFireworks(), col: generateColors('FIREWORKS') },
    [GestureType.VICTORY]: { pos: generateText(), col: generateColors('TEXT') },
    [GestureType.PINCH]: { pos: generateHeart(), col: generateColors('HEART') },
  }), []);

  // State buffers for smooth transition
  const currentPositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const currentColors = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  
  // Initialize
  useEffect(() => {
    // Start with sphere/nebula
    const initial = shapes[GestureType.CLOSED_FIST];
    currentPositions.set(initial.pos);
    currentColors.set(initial.col);
  }, [shapes, currentPositions, currentColors]);

  // Create texture for particles (soft dot)
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  useFrame((state, delta) => {
    if (!geometryRef.current || !pointsRef.current) return;

    // 1. Determine Target Shape
    // If no hand is present, default to CLOSED_FIST (Nebula/Planet)
    const activeGesture = handData.isPresent ? handData.gesture : GestureType.CLOSED_FIST;
    // Map gesture to shape key, fallback to CLOSED_FIST
    const targetKey = shapes[activeGesture] ? activeGesture : GestureType.CLOSED_FIST;
    const target = shapes[targetKey];

    // 2. Interpolate Positions & Colors
    // Increased stability by adjusting lerp speed if needed, but 4.0 provides good responsiveness
    const lerpSpeed = 4.0 * delta; 

    const posAttr = geometryRef.current.attributes.position as THREE.BufferAttribute;
    const colAttr = geometryRef.current.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      currentPositions[i] += (target.pos[i] - currentPositions[i]) * lerpSpeed;
      currentColors[i] += (target.col[i] - currentColors[i]) * lerpSpeed;
    }

    posAttr.set(currentPositions);
    colAttr.set(currentColors);
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // 3. Rotation Logic
    
    // Reset auto-rotation accumulator when switching gestures to ensure clean start
    if (targetKey !== prevGesture.current) {
        if (targetKey === GestureType.CLOSED_FIST) {
            autoRotationY.current = 0;
        }
        prevGesture.current = targetKey;
    }

    let finalRotationY = 0;

    // Only rotate for Planet (CLOSED_FIST or NONE fallback)
    if (targetKey === GestureType.CLOSED_FIST) {
        autoRotationY.current += delta * 0.2; // Slow spin
        finalRotationY = autoRotationY.current;
    } else {
        // For all other shapes (Text, Heart, Fireworks), keep them static and facing forward
        finalRotationY = 0;
    }

    // Apply rotation (only Y axis, others 0 for stability)
    pointsRef.current.rotation.set(0, finalRotationY, 0);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={currentPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={currentColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.9}
      />
    </points>
  );
};

export default Particles;