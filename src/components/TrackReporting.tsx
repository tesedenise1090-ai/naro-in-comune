import React, { useState } from 'react';
import { Search, Clock, CheckCircle2, History, ArrowRight, ShieldCheck, Mail, Phone, MapPin, ExternalLink, Zap, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageService } from '../services/storage';
import BackButton from './BackButton';
import BackToTop from './BackToTop';

const STATUS_CONFIG = {
  'ricevuta': { label: 'Inviata / Ricevuta', color: 'bg-slate-100 text-slate-700', icon: <Mail className="w-4 h-4" /> },
  'in_revisione': { label: 'In Revisione', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" /> },
  'presa_in_carico': { label: 'Presa in Carico', color: 'bg-blue-100 text-blue-700', icon: <ShieldCheck className="w-4 h-4" /> },
  'in_lavorazione': { label: 'In Lavorazione', color: 'bg-orange-100 text-orange-700', icon: <MapPin className="w-4 h-4" /> },
  'chiusa': { label: 'Risolta / Conclusa', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" /> },
  'risolto': { label: 'Risolta / Conclusa', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" /> }
};

const STEP_ORDER = ['ricevuta', 'in_revisione', 'presa_in_carico', 'in_lavorazione', 'chiusa'];

export function TrackReporting() {
  const [searchId, setSearchId] = useState('');
  const [searchCf, setSearchCf] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!searchId.trim() || !searchCf.trim()) {
      setError('Inserisci sia il Codice Pratica che il tuo Codice Fiscale.');
      return;
    }

    const reports = StorageService.getReports();
    const cleanId = searchId.trim().toUpperCase().replace('#', '');
    const cleanCf = searchCf.trim().toUpperCase();

    const found = reports.find((r: any) => 
      (r.id.toUpperCase() === cleanId || 
      (r.id.includes('-') && r.id.split('-').pop() === cleanId.split('-').pop())) &&
      (r.codiceFiscale?.toUpperCase() === cleanCf || !r.codiceFiscale) // Fallback if old data doesn't have CF
    );

    if (found) {
      if (found.codiceFiscale && found.codiceFiscale.toUpperCase() !== cleanCf) {
         setTrackingResult(null);
         setError('Codice Fiscale non associato a questa pratica. Accesso negato (GDPR).');
      } else {
         setTrackingResult(found);
      }
    } else {
      setTrackingResult(null);
      setError('Spiacente, non abbiamo trovato nessuna istanza con questi dati. Verifica il codice BGS e il Codice Fiscale.');
    }
  };

  const getStatusInfo = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || { label: status, color: 'bg-slate-100 text-slate-700', icon: <History className="w-4 h-4" /> };
  };

  const currentStatusIndex = STEP_ORDER.indexOf(trackingResult?.status || trackingResult?.stato || 'ricevuta');

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-500">
      <BackToTop />
      <div className="mb-8">
        <BackButton to="/" label="Dashboard Cittadino" />
      </div>

      <div className="text-center mb-12">
        <div className="inline-flex items-center px-3 py-1 bg-naro-navy text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
          <History className="w-3 h-3 mr-2" /> Trasparenza Amministrativa
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Tracking Istanza BGS-2026</h1>
        <p className="text-slate-600 max-w-2xl mx-auto italic">
          Inserisci il codice di protocollo ricevuto al momento della segnalazione per monitorare lo stato dell'intervento geospaziale nel Comune di Naro.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto mb-16">
        <form onSubmit={handleSearch} className="space-y-4 relative group">
          <input 
            type="text" 
            placeholder="Codice Pratica (Es: BGS-2026-NARO-001)" 
            className="w-full pl-6 pr-6 py-5 bg-white border-2 border-slate-200 rounded-[2rem] text-lg font-bold focus:border-naro-navy focus:ring-4 focus:ring-naro-navy/5 outline-none transition-all shadow-xl shadow-slate-200/50"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <div className="relative">
             <input 
               type="text" 
               placeholder="Il tuo Codice Fiscale (GDPR Security)" 
               className="w-full pl-6 pr-32 py-5 bg-white border-2 border-slate-200 rounded-[2rem] text-lg font-bold focus:border-naro-navy focus:ring-4 focus:ring-naro-navy/5 outline-none transition-all shadow-xl shadow-slate-200/50 uppercase"
               value={searchCf}
               onChange={(e) => setSearchCf(e.target.value)}
             />
             <button 
               type="submit"
               className="absolute right-2 top-2 bottom-2 px-8 bg-naro-navy text-white rounded-[1.5rem] font-bold hover:bg-slate-800 transition-all flex items-center group-hover:scale-[1.02]"
             >
               <Search className="w-5 h-5 mr-2" /> Traccia
             </button>
          </div>
        </form>
        {error && (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-center text-sm text-red-600 font-medium">
            {error}
          </motion.p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {trackingResult ? (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Status Summary Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 md:p-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Identificativo Protocollo</p>
                  <h2 className="text-2xl font-black text-slate-900 group">
                    <span className="text-naro-navy">#</span>{trackingResult.id}
                  </h2>
                </div>
                <div className={`px-5 py-2 rounded-2xl flex items-center font-bold text-sm shadow-sm ${getStatusInfo(trackingResult.status || trackingResult.stato).color}`}>
                  <span className="mr-2">{getStatusInfo(trackingResult.status || trackingResult.stato).icon}</span>
                  {getStatusInfo(trackingResult.status || trackingResult.stato).label}
                </div>
              </div>

              {/* Workflow Stepper */}
              <div className="relative mb-12 px-4">
                <div className="absolute top-5 left-0 right-0 h-1 bg-slate-100 hidden md:block"></div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4 relative z-10">
                  {STEP_ORDER.map((step, idx) => {
                    const info = getStatusInfo(step);
                    const isCompleted = idx <= currentStatusIndex;
                    const isCurrent = idx === currentStatusIndex;

                    return (
                      <div key={step} className="flex md:flex-col items-center text-center group">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 mb-0 md:mb-4 mr-4 md:mr-0 ${
                          isCompleted ? 'bg-naro-navy border-blue-100 text-white shadow-lg shadow-blue-900/20' : 'bg-white border-slate-100 text-slate-300'
                        } ${isCurrent ? 'scale-125 ring-4 ring-blue-50 animate-pulse' : ''}`}>
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div className="text-left md:text-center">
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isCompleted ? 'text-naro-navy' : 'text-slate-400'}`}>Fase {idx + 1}</p>
                          <p className={`text-xs font-bold leading-tight ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>{info.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Detail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-100">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <History className="w-3 h-3 mr-2" /> Cronologia Eventi
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-600 shadow-sm shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Istanza Acquisita - Protocollo {trackingResult.id}</p>
                        <p className="text-[10px] text-slate-500">Trasmessa PEC dal cittadino il {new Date(trackingResult.data || trackingResult.date).toLocaleDateString()} alle 08:34</p>
                      </div>
                    </div>
                    {currentStatusIndex >= 1 && (
                      <div className="flex gap-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-yellow-600 shadow-sm shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-yellow-800">In Revisione Documentale</p>
                          <p className="text-[10px] text-yellow-600">Verifica conformità requisiti tecnici</p>
                        </div>
                      </div>
                    )}
                    {currentStatusIndex >= 2 && (
                      <div className="flex gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-800">Presa in Carico dall'Ufficio Tecnico</p>
                          <p className="text-[10px] text-blue-600">Assegnata a {trackingResult.responsabile || 'Area Tecnica'}</p>
                        </div>
                      </div>
                    )}
                    {currentStatusIndex >= 3 && (
                      <div className="flex gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                          <Settings className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-orange-800">In Lavorazione Operativa</p>
                          <p className="text-[10px] text-orange-600">Squadre in loco o procedure in corso</p>
                        </div>
                      </div>
                    )}
                    {currentStatusIndex >= 4 && (
                      <div className="flex gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-800">Pratica Conclusa / Risolta</p>
                          <p className="text-[10px] text-emerald-600">Fascicolo digitale archiviato storicamente</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Zap className="w-3 h-3 mr-2" /> Dettagli Amministrativi
                  </h3>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Tipologia:</span>
                      <span className="font-bold text-slate-800 uppercase">{trackingResult.tipoGuasto || 'Generale BGS'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Posizione:</span>
                      <span className="font-bold text-slate-800">{trackingResult.ubicazione || 'Sito monitorato'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Priorità:</span>
                      <span className={`px-2 py-0.5 rounded-full font-black text-[8px] uppercase tracking-tighter ${
                        trackingResult.priorita === 'alta' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'
                      }`}>{trackingResult.priorita || 'media'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assistance Section */}
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Hai bisogno di assistenza diretta?</h3>
                <p className="text-white/60 text-sm max-w-md">Per urgenze o rettifiche sui dati dell'istanza {trackingResult.id}, contatta direttamente il responsabile d'ufficio.</p>
              </div>
              <div className="flex gap-4 relative z-10 shrink-0">
                <a href="tel:0922123456" className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 text-white transition-all">
                  <Phone className="w-5 h-5" />
                </a>
                <a href={`mailto:${trackingResult.responsabileEmail || 'protocollo@comune.naro.ag.it'}`} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 text-white transition-all">
                  <Mail className="w-5 h-5" />
                </a>
                <button className="px-6 py-4 bg-naro-gold text-naro-navy rounded-2xl font-bold text-sm shadow-xl hover:scale-105 transition-all">
                  Supporto Digital PA
                </button>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-naro-gold opacity-5 rotate-45 translate-x-20 -translate-y-20 pointer-events-none"></div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty" className="text-center py-12">
             <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
               <Search className="w-8 h-8" />
             </div>
             <p className="text-slate-400 font-medium">In attesa dell'identificativo protocollo...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
