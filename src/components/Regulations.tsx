import React from 'react';
import { Book, FileText, ExternalLink, ShieldCheck, Scale, Info, ScrollText, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import BackButton from './BackButton';

const REGULATIONS_DATA = [
  {
    id: 'reg1',
    title: 'Codice dell\'Amministrazione Digitale (CAD)',
    tag: 'D.Lgs. 82/2005',
    category: 'Digitale',
    abstract: 'L\'insieme di norme che disciplinano l\'informatizzazione della pubblica amministrazione e i rapporti tra cittadini, imprese e PA.',
    link: 'https://www.agid.gov.it/it/agenzia/strategia-quadro-normativo/codice-amministrazione-digitale'
  },
  {
    id: 'reg2',
    title: 'Regolamento Generale sulla Protezione Dati (GDPR)',
    tag: 'UE 2016/679',
    category: 'Privacy',
    abstract: 'La normativa europea sulla protezione delle persone fisiche con riguardo al trattamento dei dati personali.',
    link: 'https://www.garanteprivacy.it/regolamentoue'
  },
  {
    id: 'reg3',
    title: 'Linee Guida Accessibilità AgID',
    tag: 'WCAG 2.1',
    category: 'Accessibilità',
    abstract: 'Requisiti tecnici e metodologici per rendere i servizi digitali accessibili a tutti i cittadini, incluse le persone con disabilità.',
    link: 'https://www.agid.gov.it/it/design-servizi/accessibilita'
  },
  {
    id: 'reg4',
    title: 'Piano Triennale per l\'Informatica nella PA',
    tag: 'Programmazione',
    category: 'Strategia',
    abstract: 'Documento di indirizzo strategico ed economico per la trasformazione digitale del settore pubblico italiano.',
    link: 'https://www.agid.gov.it/it/agenzia/piano-triennale'
  },
  {
    id: 'reg5',
    title: 'Statuto del Comune di Naro',
    tag: 'Autonomia Locale',
    category: 'Territorio',
    abstract: 'La "costituzione" locale che definisce l\'ordinamento, l\'organizzazione e il funzionamento del Comune di Naro.',
    link: '#'
  }
];

export function Regulations() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-[#FDFDFD] pb-20"
    >
      <div className="bg-slate-900 text-white pt-12 pb-24 px-6 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto">
          <BackButton />
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center p-4 shadow-2xl">
            <Scale className="w-full h-full text-white" />
          </div>
          <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">Quadro Normativo</h1>
          <p className="text-white/50 font-medium">Standard istituzionali, leggi e regolamenti digitali</p>
        </div>
        
        {/* Abstract background design */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,_rgba(59,130,246,0.2)_0%,_transparent_50%)]"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12 space-y-6">
        {REGULATIONS_DATA.map((reg) => (
          <motion.div 
            key={reg.id}
            whileHover={{ y: -5 }}
            className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden group hover:border-blue-200 transition-all"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">{reg.category}</span>
                <span className="text-[10px] font-mono text-blue-600 font-bold px-2 py-1 bg-blue-50 rounded italic">{reg.tag}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center group-hover:text-blue-700 transition-colors">
                <FileText className="w-5 h-5 mr-3 text-slate-300" /> {reg.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {reg.abstract}
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Disponibile nel registro AgID
                </div>
                <a 
                  href={reg.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors"
                >
                  Documentazione Ufficiale <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </div>
            </div>
          </motion.div>
        ))}

        <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-10 mt-12">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
               <ShieldCheck className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Sicurezza e Trasparenza</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tutte le procedure gestite dalla piattaforma <strong>NaroInComune</strong> sono state progettate per essere conformi ai pilastri del CAD (Codice Amministrazione Digitale) e alle linee guida sulla privacy. 
                Ogni documento generato possiede validità amministrativa secondo le normative vigenti sulla dematerializzazione dei processi pubblici.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
