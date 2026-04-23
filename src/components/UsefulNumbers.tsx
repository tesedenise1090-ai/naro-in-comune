import React from 'react';
import { Phone, PhoneCall, HeartPulse, Shield, Flame, Truck, Info, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import BackButton from './BackButton';

const EMERGENCY_NUMBERS = [
  { id: '112', label: 'Numero Unico Emergenza', number: '112', icon: <Shield className="w-5 h-5" />, color: 'bg-red-600' },
  { id: '118', label: 'Emergenza Sanitaria', number: '118', icon: <HeartPulse className="w-5 h-5" />, color: 'bg-red-500' },
  { id: '115', label: 'Vigili del Fuoco', number: '115', icon: <Flame className="w-5 h-5" />, color: 'bg-orange-600' },
  { id: '113', label: 'Polizia di Stato', number: '113', icon: <Shield className="w-5 h-5" />, color: 'bg-blue-700' },
];

const WASTE_SERVICES = [
  { id: 'w1', ufficio: 'Roma Costruzioni SRL (Segnalazioni)', numero: '+39 350 5096789', orari: 'Servizio Segnalazioni Rapide' },
  { id: 'w2', ufficio: 'Ufficio ARO Comune di Naro', numero: '0922 953011', orari: 'Sede Amministrativa' },
];

const MUNICIPAL_OFFICES = [
  { id: 'm1', ufficio: 'Ufficio Protocollo', numero: '0922 123456', orari: 'Lun-Ven 09:00-13:00' },
  { id: 'm2', ufficio: 'Anagrafe e Stato Civile', numero: '0922 123457', orari: 'Mar-Gio 15:00-17:00' },
  { id: 'm3', ufficio: 'Ufficio Tecnico', numero: '0922 123458', orari: 'Lun-Mer 09:00-12:00' },
  { id: 'm4', ufficio: 'Polizia Municipale', numero: '0922 123459', orari: 'Sempre Attivo' },
  { id: 'm5', ufficio: 'Servizi Sociali', numero: '0922 123460', orari: 'Ven 09:00-13:00' },
];

export function UsefulNumbers() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-slate-50 pb-20"
    >
      <div className="bg-naro-navy text-white pt-12 pb-24 px-6 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto">
          <BackButton />
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Numeri Utili</h1>
          <p className="text-white/60 font-medium">Contatti di emergenza e uffici del Comune di Naro</p>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="full" height="full" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12 space-y-8">
        {/* Emergenze Nazionali */}
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center">
            <Shield className="w-4 h-4 mr-2" /> Emergenze Nazionali
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EMERGENCY_NUMBERS.map((num) => (
              <a 
                key={num.id}
                href={`tel:${num.number.replace(/\s/g, '').replace('+', '')}`}
                className="flex items-center p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100 group"
              >
                <div className={`w-12 h-12 ${num.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  {num.icon}
                </div>
                <div className="ml-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase">{num.label}</p>
                  <p className="text-xl font-black text-slate-800">{num.number}</p>
                </div>
                <PhoneCall className="w-5 h-5 ml-auto text-slate-200 group-hover:text-blue-500 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* Servizi Ambiente */}
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-emerald-50">
          <h2 className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em] mb-8 flex items-center">
            <Truck className="w-4 h-4 mr-2" /> Servizi Ambientali & Gestione Rifiuti
          </h2>
          <div className="space-y-3 mb-6">
            {WASTE_SERVICES.map((office) => (
              <div key={office.id} className="p-5 rounded-2xl border border-emerald-50 flex flex-col md:flex-row md:items-center justify-between hover:border-emerald-100 transition-all group">
                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{office.ufficio}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{office.orari}</p>
                </div>
                <a 
                  href={`tel:${office.numero.replace(/\s/g, '').replace('+', '')}`} 
                  className="mt-3 md:mt-0 flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-600 hover:text-white transition-all"
                >
                  <Phone className="w-4 h-4 mr-2" /> {office.numero}
                </a>
              </div>
            ))}
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl text-xs text-emerald-800 border border-emerald-100">
             <p className="font-bold mb-1">Nota Servizio Pannolini:</p>
             Il servizio di ritiro pannolini avviene il Giovedì e il Sabato. Per l'attivazione è necessaria l'iscrizione all'albo presso l'Ufficio ARO (Primo Piano Palazzo Comunale).
          </div>
        </div>

        {/* Uffici Comunali */}
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center">
            <Phone className="w-4 h-4 mr-2" /> Centralini ed Uffici
          </h2>
          <div className="space-y-3">
            {MUNICIPAL_OFFICES.map((office) => (
              <div key={office.id} className="p-5 rounded-2xl border border-slate-50 flex flex-col md:flex-row md:items-center justify-between hover:border-blue-100 transition-all group">
                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-naro-navy transition-colors">{office.ufficio}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Orari: {office.orari}</p>
                </div>
                <a 
                  href={`tel:${office.numero.replace(/\s/g, '').replace('+', '')}`} 
                  className="mt-3 md:mt-0 flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-600 hover:text-white transition-all"
                >
                  <Phone className="w-4 h-4 mr-2" /> {office.numero}
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start">
          <Info className="w-6 h-6 text-blue-600 mr-4 flex-shrink-0 mt-1" />
          <p className="text-xs text-blue-800 leading-relaxed">
            In caso di emergenza segnalata tramite l'app <strong>NaroInComune</strong>, il sistema invierà automaticamente una copia della pratica agli uffici competenti. 
            Tuttavia, per pericoli imminenti alla pubblica incolumità, si raccomanda di contattare sempre prima i numeri di emergenza nazionale (112).
          </p>
        </div>
      </div>
    </motion.div>
  );
}
