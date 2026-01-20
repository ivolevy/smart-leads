import React from 'react';

const ProgressBar = ({ progress, label }) => {
  const isAnimating = progress > 0 && progress < 100;

  return (
    <div className="w-full mt-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-text-secondary">{label || 'Procesando...'}</span>
        <span className="text-sm font-bold text-primary-color">{progress}%</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
        <div 
          className={`progress-bar-inner h-full ${isAnimating ? 'animating' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
