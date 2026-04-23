import React, { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <button 
      onClick={toggleFullscreen}
      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all flex items-center justify-center shadow-sm border border-slate-200 group"
      title={isFullscreen ? "Esci da Schermo Intero" : "Attiva Schermo Intero"}
      id="fullscreen-toggle"
    >
      {isFullscreen ? (
        <Minimize className="w-4 h-4 text-naro-navy" />
      ) : (
        <Maximize className="w-4 h-4 text-slate-500 group-hover:text-naro-navy" />
      )}
      <span className="ml-2 text-[10px] font-black uppercase tracking-tighter hidden lg:inline-block">
        {isFullscreen ? "Esci" : "Control Room"}
      </span>
    </button>
  );
}
