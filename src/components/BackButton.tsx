import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export default function BackButton({ to = "/utility", label = "Torna all'Hub Utility", className = "" }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#003366] hover:bg-slate-50 hover:border-[#C5A059]/30 transition-all shadow-sm ${className}`}
    >
      <ArrowLeft className="w-4 h-4 text-[#C5A059]" />
      {label}
    </button>
  );
}
