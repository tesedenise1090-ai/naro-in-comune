import React from 'react';
import { Download, Calendar } from 'lucide-react';
import { WASTE_SCHEDULE, getColorForMaterial } from '../lib/wasteSchedule';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function WasteCalendarWidget({ id, navigate }: { id: string, navigate: (path: string) => void }) {
  const todayDate = new Date();
  const todayDay = todayDate.getDay();
  const tomorrowDay = (todayDay + 1) % 7;
  
  const todaySchedule = WASTE_SCHEDULE[todayDay as keyof typeof WASTE_SCHEDULE];
  const tomorrowSchedule = WASTE_SCHEDULE[tomorrowDay as keyof typeof WASTE_SCHEDULE];

  return (
    <div id={id} className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 mt-8 mb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1 w-full grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Oggi</p>
            <p className="text-sm font-black text-slate-900 line-clamp-1">{todaySchedule.materials.join(', ')}</p>
          </div>
          <div className="bg-naro-navy/5 p-4 rounded-xl">
            <p className="text-[10px] font-bold text-naro-navy uppercase tracking-widest mb-1">Domani</p>
            <p className="text-sm font-black text-naro-navy line-clamp-1">{tomorrowSchedule.materials.join(', ')}</p>
          </div>
        </div>
        <button 
          onClick={() => {
            navigate('utility');
            setTimeout(() => {
              const element = document.getElementById('sezione-rifiuti-completa');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }}
          className="whitespace-nowrap px-6 py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
        >
          Vedi Calendario Completo
        </button>
      </div>
    </div>
  );
}
