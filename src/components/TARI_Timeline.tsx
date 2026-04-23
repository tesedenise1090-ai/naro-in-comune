import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Home, 
  TrendingUp, 
  Calendar, 
  Timer, 
  ExternalLink, 
  ShieldCheck, 
  BarChart3,
  Printer,
  Megaphone,
  Layout,
  ChevronRight,
  Info,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BackToTop from './BackToTop';
import BackButton from './BackButton';

const App = () => {
  const [mq, setMq] = useState(123);
  const [occupanti, setOccupanti] = useState(2);
  const [annoRiferimento, setAnnoRiferimento] = useState(2025);
  const [isVisible, setIsVisible] = useState(true);

  const storicoTariffe = {
    2016: { fissa: 2.10, var: 165.00, pareggio: "98.2%", nota: "Gestione transitoria post-ATO. Emergenza discariche in Sicilia.", doc: "Delibera CC n.12/2016" },
    2017: { fissa: 2.15, var: 168.00, pareggio: "99.1%", nota: "Inizio potenziamento raccolta differenziata.", doc: "Delibera CC n.15/2017" },
    2018: { fissa: 2.30, var: 175.00, pareggio: "100%", nota: "Aumento costi di conferimento in discarica fuori provincia.", doc: "Delibera CC n.08/2018" },
    2019: { fissa: 2.35, var: 178.00, pareggio: "100%", nota: "Assestamento costi servizio porta a porta.", doc: "Delibera CC n.22/2019" },
    2020: { fissa: 2.40, var: 182.00, pareggio: "100%", nota: "Introduzione Metodo ARERA (MTR). Costi COVID-19 inclusi.", doc: "Delibera CC n.05/2020" },
    2021: { fissa: 2.45, var: 185.00, pareggio: "98.5%", nota: "Recupero scostamenti PEF anni precedenti.", doc: "Delibera CC n.11/2021" },
    2022: { fissa: 2.48, var: 185.50, pareggio: "100%", nota: "Stabilità tariffe post-pandemia.", doc: "Delibera CC n.14/2022" },
    2023: { fissa: 2.48, var: 185.50, pareggio: "100%", nota: "Tariffe confermate in proroga.", doc: "Delibera CC n.02/2023" },
    2024: { fissa: 2.75, var: 195.00, pareggio: "100%", nota: "Forte inflazione e aumento costi energia/trasporto.", doc: "Delibera CC n.19/2024" },
    2025: { fissa: 2.93, var: 203.33, pareggio: "100%", nota: "Nuovo PEF 2024-2025. Inserimento componenti perequazione UR.", doc: "Delibera CC n.23/2025" },
    2026: { fissa: 3.05, var: 212.00, pareggio: "100%", nota: "Previsione: adeguamento ISTAT e nuovi target raccolta.", doc: "Previsionale 2026" }
  };

  const anni = Object.keys(storicoTariffe).map(Number);

  const [calcolo, setCalcolo] = useState({
    fissa: 0,
    variabile: 0,
    tefa: 0,
    arera: 0,
    totale: 0
  });

  // Effect TARI
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      const t = storicoTariffe[annoRiferimento];
      const qFissa = mq * t.fissa;
      const moltiplicatoreOccupanti = [0, 0.7, 1, 1.2, 1.4, 1.6, 1.8];
      const qVar = t.var * (moltiplicatoreOccupanti[occupanti] || 1);
      const arera = annoRiferimento >= 2024 ? 7.60 : 0.10;
      const subtot = qFissa + qVar;
      const tefa = subtot * 0.05;
      
      setCalcolo({
        fissa: qFissa,
        variabile: qVar,
        tefa: tefa,
        arera: arera,
        totale: subtot + tefa + arera
      });
      setIsVisible(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [mq, occupanti, annoRiferimento]);

  const calcolaVariazione = () => {
    const t2016 = storicoTariffe[2016];
    const tot2016 = (mq * t2016.fissa + t2016.var) * 1.05 + 0.10;
    return (((calcolo.totale / tot2016) - 1) * 100).toFixed(1);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 print:bg-white print:p-0">
      <BackToTop />
      {/* Navigation */}
      <div className="max-w-[1400px] mx-auto px-6 pt-5 flex justify-between items-center print:hidden">
        <BackButton />
      </div>

      <div className="max-w-[1400px] mx-auto p-4 md:p-8">
        
        {/* Header Istituzionale */}
        <header className="bg-white border-b-2 border-slate-200 px-7 py-5 mb-8 print:border-none rounded-t-xl shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-block px-2.5 py-0.5 bg-[#F0F4F8] border border-[#CCD6E0] rounded text-[#003366] text-[0.68rem] font-bold tracking-wider uppercase mb-1.5">
                Osservatorio Tributario
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#003366] uppercase tracking-tight">
                Comune di Naro
              </h1>
              <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Storico Tariffe TARI 2016-2026</p>
              <div className="h-1 w-[100px] bg-gradient-to-r from-[#C5A059] to-[#B08D45] mt-3 rounded-sm print:hidden"></div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-400 uppercase">Settore Economico Finanziario</p>
              <p className="text-sm font-serif italic text-[#003366]">Archivio Digitale Delibere</p>
            </div>
          </div>
        </header>

        {/* SEZIONE TARI */}
        <section className="mb-24 relative px-6 print:hidden">
              <div className="relative h-3 bg-slate-200 rounded-full mb-12 shadow-inner">
                <div 
                  className="absolute h-full bg-[#C5A059] rounded-full transition-all duration-700"
                  style={{ width: `${((annoRiferimento - 2016) / (2026 - 2016)) * 100}%` }}
                ></div>
                <input 
                  type="range" min="2016" max="2026" step="1" value={annoRiferimento}
                  onChange={(e) => setAnnoRiferimento(parseInt(e.target.value))}
                  className="absolute -top-3 w-full h-10 opacity-0 cursor-pointer z-20"
                />
                <div className="absolute w-full flex justify-between -bottom-10">
                  {anni.map(anno => (
                    <div key={anno} className="flex flex-col items-center">
                      <div className={`w-1.5 h-4 mb-2 transition-colors duration-300 ${annoRiferimento === anno ? 'bg-[#003366]' : 'bg-slate-300'}`}></div>
                      <span className={`text-xs font-black transition-all duration-300 ${annoRiferimento === anno ? 'text-[#003366] scale-150' : 'text-slate-400'}`}>
                        {anno}
                      </span>
                    </div>
                  ))}
                </div>
                <div 
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white border-4 border-[#003366] rounded-full shadow-2xl transition-all duration-700 flex items-center justify-center pointer-events-none"
                  style={{ left: `${((annoRiferimento - 2016) / (2026 - 2016)) * 100}%` }}
                >
                  <div className="text-[10px] font-bold text-[#003366]">{annoRiferimento}</div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className={`lg:col-span-7 space-y-8 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="bg-white p-8 rounded-2xl shadow-xl border-t-8 border-[#C5A059] relative">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="text-[#003366]" />
                    <h3 className="font-bold uppercase tracking-tighter text-lg text-[#003366]">Contesto Storico {annoRiferimento}</h3>
                  </div>
                  <p className="text-xl leading-relaxed font-serif italic text-slate-700 mb-6 italic">"{storicoTariffe[annoRiferimento].nota}"</p>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500 underline decoration-[#C5A059]">
                      <ExternalLink size={14} /> {storicoTariffe[annoRiferimento].doc}
                    </div>
                    <div className="flex items-center gap-2 bg-[#003366] text-white px-4 py-1.5 rounded-full text-xs font-bold">
                      <BarChart3 size={14} /> Pareggio: {storicoTariffe[annoRiferimento].pareggio}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 print:hidden">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2">
                    <Calculator size={16} /> Parametri Utenza
                  </h2>
                  <div className="space-y-12">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-bold text-slate-600 uppercase">Metratura</label>
                        <span className="text-3xl font-black text-[#003366]">{mq} mq</span>
                      </div>
                      <input type="range" min="30" max="300" value={mq} onChange={(e) => setMq(parseInt(e.target.value))} className="w-full accent-[#C5A059]" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 uppercase block mb-4">Occupanti</label>
                      <div className="grid grid-cols-6 gap-3">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <button key={n} onClick={() => setOccupanti(n)} className={`py-3 rounded-lg font-black transition-all ${occupanti === n ? 'bg-[#003366] text-white' : 'bg-slate-50 text-slate-400'}`}>{n}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="sticky top-8 bg-[#003366] text-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:text-black print:bg-white print:border print:border-slate-300">
                  <div className="p-8 border-b border-white/10 bg-[#002244] print:bg-slate-50 print:border-slate-300">
                    <div className="flex justify-between items-start">
                      <h3 className="text-2xl font-serif">Prospetto TARI {annoRiferimento}</h3>
                      <ShieldCheck className="text-[#C5A059]" size={32} />
                    </div>
                  </div>
                  <div className="p-8 space-y-4">
                    <div className="flex justify-between border-b border-white/5 pb-2 print:border-slate-200"><span className="opacity-60 italic">Quota Fissa</span><span className="font-bold">€ {calcolo.fissa.toFixed(2)}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-2 print:border-slate-200"><span className="opacity-60 italic">Quota Variabile</span><span className="font-bold">€ {calcolo.variabile.toFixed(2)}</span></div>
                    <div className="flex justify-between text-xs opacity-40 italic"><span>Addizionale TEFA 5%</span><span>€ {calcolo.tefa.toFixed(2)}</span></div>
                    <div className="pt-8 text-center">
                      <div className="text-6xl font-black tracking-tighter mb-2">€ {calcolo.totale.toFixed(2)}</div>
                      <p className="text-[10px] opacity-30 uppercase font-bold tracking-widest">Totale Annuale Stimato</p>
                    </div>
                  </div>
                  <div className="bg-[#C5A059] p-6 text-[#003366] text-center font-black italic print:hidden">
                    VARIAZIONE VS 2016: +{calcolaVariazione()}%
                  </div>
                </div>
                <button onClick={handlePrint} className="w-full mt-6 bg-white border-2 border-[#003366] text-[#003366] font-bold py-3 rounded-xl flex items-center justify-center gap-2 print:hidden shadow-sm hover:bg-slate-50 transition-colors">
                  <Printer size={16} /> Stampa Pre-Bollettino
                </button>
              </div>
            </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-200 text-center print:hidden">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
            Servizio Tributi • Comune di Naro • Piazza Garibaldi
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;