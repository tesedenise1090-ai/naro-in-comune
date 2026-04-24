import { Download, Calendar } from 'lucide-react';
import { calendarioRifiuti } from '../calendarioData';
import { isTomorrowHoliday } from '../lib/holidays';

export function WasteCalendarWidget({ id, navigate }: { id: string, navigate: (path: string) => void }) {
  const todayDate = new Date();
  const dayOfWeek = todayDate.getDay(); // 0 is Sunday, 1 is Monday...

  const todaySchedule = calendarioRifiuti.find(d => d.id === dayOfWeek) || calendarioRifiuti[6];
  const tomorrowDay = (dayOfWeek + 1) % 7;
  const tomorrowSchedule = calendarioRifiuti.find(d => d.id === tomorrowDay) || calendarioRifiuti[0];

  const holiday = isTomorrowHoliday();

  return (
    <div id={id} className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 mt-8 mb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1 w-full grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Oggi</p>
            <p className="text-sm font-black text-slate-900 line-clamp-1">{todaySchedule.type}</p>
          </div>
          <div className={`p-4 rounded-xl ${holiday ? 'bg-red-50' : 'bg-naro-navy/5'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${holiday ? 'text-red-600' : 'text-naro-navy'}`}>Domani</p>
            <p className={`text-sm font-black line-clamp-1 ${holiday ? 'text-red-700' : 'text-naro-navy'}`}>
              {holiday ? 'SERVIZIO SOSPESO (Festività) 🚩' : tomorrowSchedule.type}
            </p>
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
