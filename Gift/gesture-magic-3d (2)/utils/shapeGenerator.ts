import * as THREE from 'three';

// Total number of particles
export const PARTICLE_COUNT = 4000;

const tempVec = new THREE.Vector3();

// Helper: Random point in sphere
const randomInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return {
    x: r * sinPhi * Math.cos(theta),
    y: r * sinPhi * Math.sin(theta),
    z: r * Math.cos(phi)
  };
};

export const generateSphere = (): Float32Array => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const { x, y, z } = randomInSphere(3);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
};

export const generatePlanetWithRing = (): Float32Array => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  
  // 70% particles for the planet body, 30% for the ring
  const planetCutoff = Math.floor(PARTICLE_COUNT * 0.7);
  
  // 1. Planet Body (Sphere)
  for (let i = 0; i < planetCutoff; i++) {
    const { x, y, z } = randomInSphere(2.2); // Slightly tighter sphere
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  // 2. Ring
  const innerRadius = 3.0;
  const outerRadius = 5.5;
  const tiltAngle = 25 * (Math.PI / 180); // 25 degree tilt
  const cosTilt = Math.cos(tiltAngle);
  const sinTilt = Math.sin(tiltAngle);

  for (let i = planetCutoff; i < PARTICLE_COUNT; i++) {
    // Random angle
    const theta = Math.random() * Math.PI * 2;
    // Random radius between inner and outer
    const r = innerRadius + Math.random() * (outerRadius - innerRadius);
    
    // Flat ring coordinates on XZ plane initially
    const xBase = r * Math.cos(theta);
    const zBase = r * Math.sin(theta);
    // Slight thickness
    const yBase = (Math.random() - 0.5) * 0.15;

    // Apply Tilt (Rotate around X axis)
    // y' = y*cos - z*sin
    // z' = y*sin + z*cos
    const x = xBase;
    const y = yBase * cosTilt - zBase * sinTilt;
    const z = yBase * sinTilt + zBase * cosTilt;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  
  return positions;
};

export const generateHeart = (): Float32Array => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Heart parametric equation
    // x = 16sin^3(t)
    // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
    const t = Math.random() * Math.PI * 2;
    // Add some volume (random spread)
    const spread = 0.5; 
    
    // Distribute t to fill outline primarily, but some fill
    const r = Math.sqrt(Math.random()); // Even distribution in circle for cross-section
    
    const xBase = 16 * Math.pow(Math.sin(t), 3);
    const yBase = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    
    // Scale down
    const scale = 0.15;
    
    positions[i * 3] = (xBase * scale) + (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (yBase * scale) + (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2; // Thickness
  }
  return positions;
};

export const generateFireworks = (): Float32Array => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  // Fireworks are just a very large sphere/explosion
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const { x, y, z } = randomInSphere(8); // Large radius
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
};

// Generate "I LOVE YOU" text using a canvas
export const generateText = (): Float32Array => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  
  const canvas = document.createElement('canvas');
  // Use a wider canvas to fit text nicely
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return generateSphere(); // Fallback

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  // Reduced font size slightly and added spacing
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Explicitly ensuring "I" is present and text is centered with spaces
  ctx.fillText('I  LOVE  YOU', canvas.width / 2, canvas.height / 2);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  const validPixels: {x: number, y: number}[] = [];
  
  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      const index = (y * canvas.width + x) * 4;
      if (data[index] > 128) { 
        validPixels.push({ x, y });
      }
    }
  }

  if (validPixels.length === 0) return generateSphere();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const pixel = validPixels[i % validPixels.length];
    
    // Normalize to 3D space
    // Scale reduced implies smaller overall text
    
    // Tighter scaling
    const x = (pixel.x / canvas.width - 0.5) * 14; 
    const y = -(pixel.y / canvas.height - 0.5) * 3.5; 
    
    positions[i * 3] = x + (Math.random() - 0.5) * 0.1;
    positions[i * 3 + 1] = y + (Math.random() - 0.5) * 0.1;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5; 
  }
  
  return positions;
};

// Colors
export const COLORS = {
  NEBULA: new THREE.Color('#00bfff'), // Blue
  FIREWORKS: [new THREE.Color('#ff0000'), new THREE.Color('#0000ff'), new THREE.Color('#ffff00')], // Red, Blue, Yellow
  HEART: new THREE.Color('#ff0055'), // Red/Pinkish
  TEXT: new THREE.Color('#ff69b4'), // Pink
};

export const generateColors = (type: 'NEBULA' | 'FIREWORKS' | 'HEART' | 'TEXT'): Float32Array => {
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let color: THREE.Color;
    
    if (type === 'FIREWORKS') {
      color = COLORS.FIREWORKS[Math.floor(Math.random() * COLORS.FIREWORKS.length)];
    } else if (type === 'HEART') {
      color = COLORS.HEART;
    } else if (type === 'TEXT') {
      color = COLORS.TEXT;
    } else {
      // Nebula - varied blue/cyan
      color = COLORS.NEBULA.clone().offsetHSL((Math.random() - 0.5) * 0.1, 0, 0);
    }
    
    // Add slight random variation to all for "sparkle"
    color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  return colors;
};