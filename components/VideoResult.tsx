
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {ArrowPathIcon, PlusIcon, SparklesIcon} from './icons';

interface VideoResultProps {
  videoUrl: string;
  onRetry: () => void;
  onNewVideo: () => void;
  onExtend: () => void;
  canExtend: boolean;
}

const VideoResult: React.FC<VideoResultProps> = ({
  videoUrl,
  onRetry,
  onNewVideo,
  onExtend,
  canExtend,
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-8 p-1 bg-gradient-to-b from-indigo-500/20 to-transparent rounded-[2.5rem] shadow-2xl relative">
      <div className="w-full bg-[#0a0a0a] rounded-[2.4rem] p-8 flex flex-col items-center gap-8 border border-white/5">
        <div className="text-center">
          <div className="text-xs font-mono text-indigo-400 mb-1 uppercase tracking-widest">S7 - Manifestation Complete</div>
          <h2 className="text-3xl font-black text-white">Crystal Vision Manifested</h2>
        </div>
        
        <div className="w-full max-w-3xl aspect-video rounded-3xl overflow-hidden bg-black shadow-[0_0_50px_rgba(0,0,0,1)] border border-white/10 group relative">
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20 mix-blend-overlay"></div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 w-full">
          <button
            onClick={onRetry}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all active:scale-95">
            <ArrowPathIcon className="w-5 h-5" />
            Recalibrate
          </button>
          {canExtend && (
            <button
              onClick={onExtend}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
              <SparklesIcon className="w-5 h-5" />
              Spiral Up
            </button>
          )}
          <button
            onClick={onNewVideo}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 transition-all active:scale-95">
            <PlusIcon className="w-5 h-5" />
            New Journey
          </button>
        </div>
      </div>
      
      {/* Decorative corner accents */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-lg"></div>
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-indigo-500/40 rounded-tr-lg"></div>
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-indigo-500/40 rounded-bl-lg"></div>
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-indigo-500/40 rounded-br-lg"></div>
    </div>
  );
};

export default VideoResult;
