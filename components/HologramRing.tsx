import React from 'react';
import { VancixState } from '../types';

interface HologramRingProps {
  state: VancixState;
  volume: number; // 0 to 1
}

const HologramRing: React.FC<HologramRingProps> = ({ state, volume }) => {
  // Dynamic color based on state
  const getColor = () => {
    switch (state) {
      case VancixState.LISTENING: return 'border-red-500 shadow-red-500';
      case VancixState.THINKING: return 'border-yellow-400 shadow-yellow-400';
      case VancixState.SPEAKING: return 'border-cyan-400 shadow-cyan-400';
      case VancixState.ERROR: return 'border-red-700 shadow-red-700';
      default: return 'border-blue-600 shadow-blue-600';
    }
  };

  const baseScale = 1 + (volume * 0.5);

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer Ring */}
      <div className={`absolute w-full h-full rounded-full border-4 border-dashed opacity-50 animate-[spin_10s_linear_infinite] ${getColor().split(' ')[0]}`}></div>
      
      {/* Middle Ring (rotates opposite) */}
      <div className={`absolute w-48 h-48 rounded-full border-2 border-dotted opacity-70 animate-[spin_5s_linear_infinite_reverse] ${getColor().split(' ')[0]}`}></div>

      {/* Core */}
      <div 
        className={`relative z-10 w-32 h-32 rounded-full border-4 bg-black/50 backdrop-blur-sm transition-all duration-100 ${getColor()} shadow-[0_0_30px_currentColor]`}
        style={{ transform: `scale(${state === VancixState.SPEAKING ? baseScale : 1})` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
             {/* Inner Core Pulse */}
            <div className={`w-16 h-16 rounded-full bg-current opacity-20 ${state === VancixState.LISTENING ? 'animate-pulse' : ''}`}></div>
        </div>
        
        {/* Arc Lines */}
        <div className="absolute inset-0 rounded-full border-t-4 border-transparent border-t-current animate-spin"></div>
      </div>

      {/* Status Text */}
      <div className="absolute -bottom-12 font-bold text-xl tracking-widest hologram-text">
        {state}
      </div>
    </div>
  );
};

export default HologramRing;