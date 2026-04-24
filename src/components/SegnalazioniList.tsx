import React from 'react';
import { AlertCircle, CheckCircle, Clock, MapPin } from 'lucide-react';

export function SegnalazioniList({ reports }: { reports: any[] }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'chiusa':
      case 'risolto':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'in_lavorazione':
      case 'presa_in_carico':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 mb-12">
      <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <MapPin className="w-6 h-6 text-naro-navy" /> Lista Segnalazioni Recenti
      </h3>
      <div className="space-y-4">
        {reports.length > 0 ? (
          reports.slice(0, 10).map((r, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-naro-navy/30 transition-all">
              <div>
                <p className="font-bold text-slate-900">{r.tipoGuasto || 'Segnalazione BGS'}</p>
                <p className="text-xs text-slate-500">{r.etichetta || r.ubicazione}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase">{r.status || r.stato || 'in_attesa'}</span>
                {getStatusIcon(r.status || r.stato)}
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500 italic">Nessuna segnalazione trovata.</p>
        )}
      </div>
    </div>
  );
}
