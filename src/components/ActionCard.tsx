import React from 'react';

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  color: string;
}

export function ActionCard({ icon, title, desc, onClick, color }: ActionCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 hover:border-naro-navy/20 cursor-pointer transition-all transform hover:-translate-y-2 group relative overflow-hidden`}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${color.includes('naro-gold') ? 'from-naro-gold to-naro-vivid-gold' : color.includes('orange') ? 'from-orange-400 to-red-500' : color.includes('naro-navy') ? 'from-naro-navy to-naro-vivid-blue' : 'from-emerald-400 to-emerald-600'}`}></div>
      <div className="mb-4 transform group-hover:scale-110 transition-transform duration-500">{icon}</div>
      <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
      
      <div className="mt-4 flex items-center text-[10px] font-black text-naro-navy uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
        Esplora <span className="ml-2">→</span>
      </div>
    </div>
  );
}
