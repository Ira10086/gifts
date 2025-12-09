import React, { useEffect, useRef, useState, useCallback } from 'react';
import Experience from './components/Experience';
import { GestureRecognizer } from './utils/gestureService';
import { GestureType, HandData } from './types';
import { Camera, Fullscreen, Hand, Heart, Sparkles, Move } from 'lucide-react';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [handData, setHandData] = useState<HandData>({
    gesture: GestureType.CLOSED_FIST,
    rotation: 0,
    position: { x: 0, y: 0 },
    isPresent: false
  });
  const [showWebcam, setShowWebcam] = useState(true);

  // Initialize Gesture Recognizer
  useEffect(() => {
    const init = async () => {
      try {
        const recognizer = new GestureRecognizer();
        await recognizer.initialize();
        recognizerRef.current = recognizer;
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load AI Model. Please refresh.");
        setLoading(false);
      }
    };
    init();
  }, []);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user' 
          }
        });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        if (recognizerRef.current) {
            recognizerRef.current.setVideoElement(videoRef.current);
        }
      } catch (err) {
        setError("Camera access denied or unavailable.");
      }
    };

    if (!loading && !error) {
      startCamera();
    }
  }, [loading, error]);

  // Detection Loop
  const animate = useCallback(() => {
    if (recognizerRef.current && videoRef.current) {
      const data = recognizerRef.current.detect();
      setHandData(data);
    }
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden text-white">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Experience handData={handData} />
      </div>

      {/* Hidden Video Element for MediaPipe */}
      <video
        ref={videoRef}
        className={`absolute bottom-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white/20 z-20 transition-opacity duration-300 ${showWebcam ? 'opacity-50 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
        muted
        playsInline
        style={{ transform: 'scaleX(-1)' }} // Mirror locally
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8">
        {/* Header */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-500">
              Gesture Magic 3D
            </h1>
            <p className="text-white/60 text-sm mt-1">Computer Vision Particles</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowWebcam(!showWebcam)}
              className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition"
              title="Toggle Webcam View"
            >
              <Camera size={20} />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition"
              title="Fullscreen"
            >
              <Fullscreen size={20} />
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {(loading || error) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
            <div className="text-center">
              {loading && (
                 <div className="flex flex-col items-center gap-4">
                   <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-xl font-light animate-pulse">Initializing AI Vision Model...</p>
                 </div>
              )}
              {error && (
                <div className="text-red-400 bg-red-900/20 p-6 rounded-xl border border-red-500/50">
                  <p className="text-xl font-bold mb-2">Error</p>
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legend / Status */}
        <div className="flex flex-col items-center gap-4 mb-4 pointer-events-auto">
            {/* Active Gesture Indicator */}
            <div className={`px-6 py-2 rounded-full backdrop-blur-xl border transition-all duration-300 ${
                handData.isPresent 
                ? 'bg-blue-500/20 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                : 'bg-white/5 border-white/10'
            }`}>
                <span className="text-lg font-medium flex items-center gap-2">
                    {handData.isPresent ? (
                        <>
                            {handData.gesture === GestureType.OPEN_PALM && <><Sparkles className="text-yellow-400"/> Fireworks</>}
                            {handData.gesture === GestureType.VICTORY && <><Hand className="text-pink-400"/> I LOVE YOU</>}
                            {handData.gesture === GestureType.CLOSED_FIST && <><Move className="text-blue-400"/> Nebula</>}
                            {handData.gesture === GestureType.PINCH && <><Heart className="text-red-500 fill-red-500"/> Heart</>}
                            {handData.gesture === GestureType.NONE && "Hand Detected"}
                        </>
                    ) : "Show Hand to Control"}
                </span>
            </div>

            {/* Guide */}
            <div className="hidden md:flex gap-6 text-sm text-white/70 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">✊</span>
                    <span>Fist (Nebula)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🖐</span>
                    <span>Open (Firework)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-2xl">✌️</span>
                    <span>V (Text)</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="text-2xl">👌</span>
                    <span>Pinch (Heart)</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;