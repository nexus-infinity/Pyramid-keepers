
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

interface Stage {
  frequency: string;
  name: string;
  message: string;
  color: string;
}

const solfegeStages: Stage[] = [
  { frequency: "396 Hz", name: "Do - Akron Gateway", message: "Halt! Signal intake and biometric validation...", color: "bg-red-500" },
  { frequency: "417 Hz", name: "Re - Queens Chamber", message: "Filtering The Static. Clarifying intent...", color: "bg-orange-500" },
  { frequency: "528 Hz", name: "Mi - Grand Gallery", message: "Crossing threshold. Routing through chambers...", color: "bg-yellow-500" },
  { frequency: "639 Hz", name: "Fa - Keepers Domain", message: "Obi, Tata, and Atlas are processing data...", color: "bg-green-500" },
  { frequency: "741 Hz", name: "Sol - Arkadaş Brain", message: "Translating code into human experience...", color: "bg-blue-500" },
  { frequency: "852 Hz", name: "La - Validation Apex", message: "Paying the price. Final pattern check...", color: "bg-purple-500" },
  { frequency: "963 Hz", name: "Ti - DOJO Manifestation", message: "Crystal vision emerging. Returning wisdom...", color: "bg-pink-500" }
];

const LoadingIndicator: React.FC = () => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, solfegeStages.length - 1));
    }, 15000); // 15s per stage for a total ~2min generation cycle visual

    return () => clearInterval(intervalId);
  }, []);

  const currentStage = solfegeStages[stageIndex];

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-black/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(99,102,241,0.2)] max-w-lg w-full">
      <div className="relative mb-12">
        {/* Animated Pyramid Loading */}
        <div className="w-24 h-24 relative">
          <div className={`absolute inset-0 border-b-[80px] border-b-indigo-500/30 border-l-[48px] border-l-transparent border-r-[48px] border-r-transparent animate-pulse`}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/5 rotate-45 animate-[spin_10s_linear_infinite]"></div>
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-[stageIndex * 15%] bg-white shadow-[0_0_20px_#fff] transition-all duration-1000`} style={{ height: `${(stageIndex + 1) * 14}%` }}></div>
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-xs font-mono text-indigo-400 mb-1 uppercase tracking-widest animate-pulse">
          {currentStage.frequency}
        </div>
        <h2 className="text-2xl font-black text-white mb-3">
          {currentStage.name}
        </h2>
        <p className="text-gray-400 text-sm italic mb-8 h-10">
          "{currentStage.message}"
        </p>
      </div>

      <div className="w-full grid grid-cols-7 gap-1">
        {solfegeStages.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-500 ${i <= stageIndex ? currentStage.color : 'bg-white/10'}`}
          />
        ))}
      </div>
      <div className="mt-4 text-[10px] text-white/30 font-mono">SIGNAL JOURNEY KANBAN: S{stageIndex}</div>
    </div>
  );
};

export default LoadingIndicator;
