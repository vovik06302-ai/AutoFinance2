import React from 'react';

interface Props {
  progress: number;
}

export const RainbowProgressBar: React.FC<Props> = ({ progress }) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden shadow-inner p-0.5">
      <div
        className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
};
