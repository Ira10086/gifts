import { FilesetResolver, HandLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { GestureType, HandData } from "../types";

export class GestureRecognizer {
  private handLandmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private lastVideoTime = -1;

  async initialize() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });
  }

  setVideoElement(video: HTMLVideoElement) {
    this.video = video;
  }

  detect(): HandData {
    if (!this.handLandmarker || !this.video || this.video.readyState < 2) {
      return { gesture: GestureType.NONE, rotation: 0, position: { x: 0, y: 0 }, isPresent: false };
    }

    const startTimeMs = performance.now();
    
    // Only detect if video has advanced
    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const results = this.handLandmarker.detectForVideo(this.video, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        // --- 1. Calculate Rotation (Roll) ---
        const wrist = landmarks[0];
        const middleMCP = landmarks[9];
        const dy = middleMCP.y - wrist.y;
        const dx = middleMCP.x - wrist.x;
        const rotation = Math.atan2(dx, -dy);

        // --- 2. Position for Swipe ---
        // Use wrist as stable anchor
        const position = { x: wrist.x, y: wrist.y };

        // --- 3. Gesture Classification ---
        const isExtended = (tipIdx: number, pipIdx: number) => {
           const dTip = Math.hypot(landmarks[tipIdx].x - wrist.x, landmarks[tipIdx].y - wrist.y);
           const dPip = Math.hypot(landmarks[pipIdx].x - wrist.x, landmarks[pipIdx].y - wrist.y);
           return dTip > dPip * 1.2; // Significant extension
        };

        const thumbExt = isExtended(4, 2);
        const indexExt = isExtended(8, 6);
        const middleExt = isExtended(12, 10);
        const ringExt = isExtended(16, 14);
        const pinkyExt = isExtended(20, 18);

        let gesture = GestureType.NONE;

        const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

        // 🖐 Open Hand (5 extended)
        if (thumbExt && extendedCount === 4) {
          gesture = GestureType.OPEN_PALM;
        }
        // ✊ Closed Fist (0 extended)
        else if (extendedCount === 0) {
           gesture = GestureType.CLOSED_FIST;
        }
        // ✌️ Victory (Index & Middle)
        else if (indexExt && middleExt && !ringExt && !pinkyExt) {
          gesture = GestureType.VICTORY;
        }
        // 🫰 Pinch / Heart
        else {
           const dPinch = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);
           if (dPinch < 0.1) {
             gesture = GestureType.PINCH;
           }
        }
        
        return { gesture, rotation, position, isPresent: true };
      }
    }

    return { gesture: GestureType.NONE, rotation: 0, position: { x: 0, y: 0 }, isPresent: false };
  }
}