import React from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Scale, 
  ExternalLink, 
  Search, 
  ChevronRight, 
  Download,
  Lock,
  Eye,
  Info,
  Clock,
  CheckCircle2
} from 'lucide-react';
import BackButton from './BackButton';

export default function TrasparenzaTab() {
  const transparencyCategories = [
    { title: 'Disposizioni Generali', icon: FileText, items: ['Programma per la Trasparenza e l\'Integrità', 'Atti generali', 'Oneri informativi per cittadini e imprese'] },
    { title: 'Organizzazione', icon: ShieldCheck, items: ['Organi di indirizzo politico-amministrativo', 'Sanzioni per mancata comunicazione dei dati', 'Rendiconti gruppi consiliari regionali/provinciali'] },
    { title: 'Consulenti e Collaboratori', icon: FileText, items: ['Incarichi a dipendenti e collaboratori', 'Incarichi esterni'] },
    { title: 'Personale', icon: FileText, items: ['Incarichi amministrativi di vertice', 'Dirigenti', 'Incarichi conferiti e autorizzati ai dipendenti'] },
    { title: 'Bandi di concorso', icon: ChevronRight, items: ['Concorsi attivi', 'Graduatorie'] },
    { title: 'Enti Controllati', icon: Scale, items: ['Società partecipate', 'Enti di diritto privato controllati'] },
    { title: 'Attività e procedimenti', icon: FileText, items: ['Tipologie di procedimento', 'Monitoraggio tempi procedimentali'] },
    { title: 'Provvedimenti', icon: FileText, items: ['Provvedimenti organi indirizzo politico', 'Provvedimenti dirigenti'] },
    { title: 'Controlli sulle imprese', icon: ExternalLink, items: ['Elenco tipologie di controllo'] },
    { title: 'Bandi di gara e contratti', icon: FileText, items: ['AVCP', 'Delibera ANAC 39/2016'] }
  ];

  const recentActs = [
    { type: 'Delibera di Giunta', number: '2026/00045', date: '22/04/2026', title: 'Approvazione bilancio di previsione 2026-2028' },
    { type: 'Determina Dirigenziale', number: '2026/00089', date: '21/04/2026', title: 'Affidamento lavori manutenzione straordinaria plesso scolastico' },
    { type: 'Ordinanza Sindacale', number: '2026/00012', date: '20/04/2026', title: 'Limitazione traffico veicolare per evento religioso San Calogero' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
      <div className="mb-6">
        <BackButton to="/" label="Torna alla Home" />
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        {/* Header Istituzionale */}
        <div className="bg-naro-navy p-8 md:p-12 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                <ShieldCheck className="w-8 h-8 text-naro-gold" />
              </div>
              <span className="text-naro-gold font-bold tracking-widest text-xs uppercase">Conformità D.lgs. 33/2013</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4">Amministrazione Trasparente</h1>
            <p className="text-slate-300 max-w-2xl text-lg leadning-relaxed italic">
              "La trasparenza è intesa come accessibilità totale delle informazioni concernenti l'organizzazione e l'attività delle pubbliche amministrazioni."
            </p>
          </div>
          <div className="absolute top-0 right-0 opacity-10 filter grayscale brightness-200">
             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Naro-Stemma.svg/960px-Naro-Stemma.svg.png" className="w-64 transform translate-x-12 -translate-y-12" />
          </div>
        </div>

        <div className="p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left/Middle: Section Index */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-naro-navy pl-4">Indice della Trasparenza</h2>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Cerca tra i documenti..." 
                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-naro-navy/20 outline-none w-64"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {transparencyCategories.map((cat, idx) => (
                  <div key={idx} className="group p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-lg transition-all duration-300 border-l-4 hover:border-l-naro-gold">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white rounded-lg text-naro-navy group-hover:bg-naro-navy group-hover:text-white transition-colors">
                        <cat.icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900">{cat.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {cat.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-500 hover:text-naro-navy cursor-pointer">
                          <ChevronRight className="w-3 h-3 mt-1 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Albo Pretorio / Recent Acts */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 rounded-3xl p-8 text-white sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-naro-gold" />
                  <h2 className="text-xl font-bold italic">Albo Pretorio On-Line</h2>
                </div>
                
                <p className="text-slate-400 text-sm mb-8">
                  Pubblicazione degli atti prodotti dal Comune per i quali è previsto l'obbligo di pubblicità legale.
                </p>

                <div className="space-y-6">
                  {recentActs.map((act, idx) => (
                    <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase text-naro-gold tracking-widest">{act.type}</span>
                        <span className="text-[10px] text-slate-500">{act.date}</span>
                      </div>
                      <h4 className="font-bold text-sm mb-3 group-hover:text-naro-gold transition-colors">{act.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">N. {act.number}</span>
                        <Download className="w-4 h-4 text-slate-500 group-hover:text-naro-gold" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-10 border-t border-white/10">
                   <div className="flex items-center gap-3 mb-4">
                      <Lock className="w-5 h-5 text-naro-gold" />
                      <h3 className="font-bold text-white uppercase text-xs tracking-widest">Validazione Digitale</h3>
                   </div>
                   <p className="text-[10px] text-slate-500 leading-relaxed italic mb-6">
                     Ogni documento estratto digitalmente è firmato elettronicamente e dotato di QR-Code per la verifica di autenticità presso gli uffici comunali.
                   </p>
                   <button className="w-full py-3 bg-naro-gold text-naro-navy rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                     <CheckCircle2 className="w-4 h-4" /> Portale di Verifica
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PA Digital Compliance Footer */}
      <div className="mt-12 flex flex-col items-center gap-6 text-slate-400 border-t border-slate-200 pt-12">
        <div className="flex items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
           <img src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Agid_logo.svg?uselang=it" alt="AgID" className="h-8" />
           <img src="https://upload.wikimedia.org/wikipedia/commons/e/e5/Logo_Regno_d%27Italia_1870.svg" alt="Repubblica Italiana" className="h-10" />
        </div>
        <p className="text-[10px] font-black text-center tracking-[0.2em] uppercase">
          Digital Transition Governance — Standard BGS-2026 — Comune di Naro
        </p>
      </div>
    </div>
  );
}
