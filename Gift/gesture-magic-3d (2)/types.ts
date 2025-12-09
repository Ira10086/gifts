export enum GestureType {
  NONE = 'NONE',
  OPEN_PALM = 'OPEN_PALM', // Fireworks
  CLOSED_FIST = 'CLOSED_FIST', // Nebula/Planet
  VICTORY = 'VICTORY', // I LOVE YOU
  PINCH = 'PINCH', // Heart (Simulates "Finger Heart" or generic pinch)
}

export interface HandData {
  gesture: GestureType;
  rotation: number; // Z-axis rotation in radians
  position: { x: number, y: number }; // Normalized screen coordinates
  isPresent: boolean;
}

export interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
}