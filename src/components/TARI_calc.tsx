import React, { useState } from 'react';
import { Calculator, Info, ArrowLeft, Trash2, Printer, Home, Edit3, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackToTop from './BackToTop';
import BackButton from './BackButton';
import { PDFService, PDFData } from "../services/pdfService";

export default function TARI_calc() {
  const [tariForm, setTariForm] = useState({ mq: '', occupants: 1 });
  const [tariResult, setTariResult] = useState<{base: number, tefa: number, arera: number, total: number} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const generatePDF = () => {
    if (!tariResult) return;

    const protocolCode = `TARI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const uuid = crypto.randomUUID ? crypto.randomUUID() : `BGS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const pdfData: PDFData = {
      title: "Prospetto Informativo TARI",
      subtitle: "Simulazione calcolo Tassa sui Rifiuti - Utenze Domestiche",
      year: 2025,
      date: new Date().toLocaleDateString("it-IT"),
      protocollo: protocolCode,
      uuid: uuid,
      summaryItems: [
        { label: "Totale Stimato", value: `€ ${tariResult.total.toFixed(2)}`, isAccent: true },
        { label: "Superficie", value: `${tariForm.mq} mq` },
        { label: "Occupanti", value: `${tariForm.occupants}` }
      ],
      tables: [
        {
          title: "Dettaglio Voci di Costo",
          head: [["Descrizione Voce", "Metodo Calcolo", "Importo"]],
          body: [
            ["Quota Base (Fissa + Variabile)", "Mq × Tariffa + Quota Occupanti", `€ ${tariResult.base.toFixed(2)}`],
            ["TEFA (Tributo Provinciale)", "5% su Quota Base", `€ ${tariResult.tefa.toFixed(2)}`],
            ["Componenti Perequative ARERA", "Quota Fissa per utenza", `€ ${tariResult.arera.toFixed(2)}`]
          ],
          columnStyles: { 2: { halign: "right" } }
        }
      ]
    };

    PDFService.generateInstitutionalPDF(pdfData, `CALCOLO_TARI_NARO_2025.pdf`);
  };

  const calculateTari = () => {
    const mq = parseFloat(tariForm.mq) || 0;
    const occupanti = tariForm.occupants;
    
    // Tariffe 2025
    const fissa = 2.93;
    const varBase = 203.33;
    
    const qFissa = mq * fissa;
    const moltiplicatoreOccupanti = [0, 0.7, 1, 1.2, 1.4, 1.6, 1.8];
    const qVar = varBase * (moltiplicatoreOccupanti[occupanti] || (occupanti > 6 ? 1.8 : 1));
    
    const subtot = qFissa + qVar;
    const tefa = subtot * 0.05; // 5% Tributo provinciale
    const arera = 7.60; // Componenti perequative aggiornate
    
    setTariResult({
      base: subtot,
      tefa: tefa,
      arera: arera,
      total: subtot + tefa + arera
    });
  };

  const handleReset = () => {
    setTariForm({ mq: '', occupants: 1 });
    setTariResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 text-sm">
      <BackToTop />
      {/* Navigation */}
      <div className="max-w-[1400px] mx-auto px-6 pt-5 flex justify-between items-center">
        <BackButton />
      </div>

      {/* Header */}
      <header className="bg-white border-b-2 border-slate-200 px-7 py-5 mt-5">
        <div className="max-w-[1400px] mx-auto flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="inline-block px-2.5 py-0.5 bg-[#F0F4F8] border border-[#CCD6E0] rounded text-[#003366] text-[0.68rem] font-bold tracking-wider uppercase mb-1.5">
              TARI 2025
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              Calcolo TARI 2025 — NaroInComune
            </h1>
            <p className="text-slate-500 text-sm max-w-lg">
              Tassa Rifiuti — Simulazione calcolo utenze domestiche
            </p>
            <p className="text-[#C5A059] font-serif italic mt-2 text-[10px] tracking-wide">"Partecipare è un dovere, digitale è un diritto"</p>
            <div className="h-1 w-[100px] bg-gradient-to-r from-[#C5A059] to-[#B08D45] mt-3 rounded-sm"></div>
          </div>
          
          {/* Header Cards (Metrics) */}
          <div className="flex gap-2 flex-wrap">
             <div className="bg-[#1a1a1a] border border-[#1a1a1a] rounded p-2.5 min-w-[140px]">
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-[#F0F4F8] mb-1">Totale Stimato</div>
                <div className="text-[1.4rem] font-extrabold text-white tabular-nums">
                  {tariResult ? `€ ${tariResult.total.toFixed(2)}` : "€ 0,00"}
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="flex max-w-[1400px] mx-auto min-h-[calc(100vh-180px)]">
        {/* Sidebar */}
        <aside 
          className={`bg-white border-r border-slate-200 shrink-0 overflow-y-auto transition-all duration-300 ${isSidebarOpen ? 'w-[420px] min-w-[320px] opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'}`}
        >
           <div className="p-4 border-b border-slate-200">
             <div className="flex items-center gap-1.5 text-[0.7rem] font-extrabold uppercase tracking-widest text-slate-700 mb-2.5">
               <Calculator size={13} /> Dati Immobile
             </div>
             
             <div className="space-y-3">
               <div>
                 <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-slate-500 mb-1">Metri Quadri (mq)</label>
                 <input 
                   type="number" 
                   min="1" 
                   className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#003366] focus:ring-1 focus:ring-[#003366]"
                   placeholder="Es. 100"
                   value={tariForm.mq} 
                   onChange={e => setTariForm({...tariForm, mq: e.target.value})} 
                 />
               </div>
               <div>
                 <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-slate-500 mb-1">Numero Occupanti</label>
                 <select 
                    className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#003366] focus:ring-1 focus:ring-[#003366]"
                    value={tariForm.occupants} 
                    onChange={e => setTariForm({...tariForm, occupants: parseInt(e.target.value)})}
                 >
                   {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                 </select>
               </div>
             </div>

             <div className="flex gap-2 mt-4">
               <button 
                 onClick={calculateTari}
                 className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#C5A059] text-[#003366] rounded font-bold text-xs hover:bg-[#b08d45] transition-colors"
               >
                 <Calculator size={14} /> Calcola
               </button>
               <button 
                 onClick={handleReset}
                 className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-500 rounded font-bold text-xs hover:bg-slate-50 transition-colors"
               >
                 <Trash2 size={14} />
               </button>
             </div>
           </div>

           <div className="p-4 border-b border-slate-200 bg-amber-50/50">
              <div className="flex items-start gap-2 text-xs text-amber-800 leading-relaxed">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p>Il calcolo utilizza le tariffe 2025 (Delibera CC n.23/2025): Quota Fissa € 2,93/mq, Quota Variabile base € 203,33.</p>
              </div>
           </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-7 bg-slate-50">
          <div className="flex justify-between items-center border-b-2 border-slate-200 mb-5 pb-2">
            <div className="flex gap-4">
              <button className="flex items-center gap-1.5 px-0 py-2 text-[#003366] border-b-2 border-[#003366] font-bold text-sm">
                <Home size={14} /> Risultato Calcolo
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={generatePDF} className="flex items-center gap-1.5 text-xs font-bold text-[#003366] hover:bg-slate-100 px-2 py-1 rounded border border-slate-200">
                <Download size={14} /> Esporta PDF
              </button>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-slate-500 flex items-center gap-1.5 text-xs font-bold hover:text-[#003366]"
              >
                {isSidebarOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
                {isSidebarOpen ? "Nascondi Sidebar" : "Mostra Sidebar"}
              </button>
            </div>
          </div>

          {tariResult ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-[#F0F4F8] border-b border-[#CCD6E0] p-4 flex justify-between items-center">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#003366]">Dettaglio Importi</span>
                  <span className="text-xs font-bold text-slate-400">Anno 2025</span>
                </div>
                <div className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[0.65rem] uppercase tracking-wider font-bold border-b border-slate-100">
                        <th className="text-left py-3 px-4">Voce</th>
                        <th className="text-right py-3 px-4">Importo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-3 px-4 font-medium text-slate-700">Quota Base (Fissa + Variabile)</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">€ {tariResult.base.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-slate-700">TEFA (5% Tributo Prov.)</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">€ {tariResult.tefa.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-slate-700">Componenti ARERA</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">€ {tariResult.arera.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-[#F0F4F8]">
                        <td className="py-4 px-4 font-bold text-[#003366] uppercase text-xs tracking-wider">Totale Annuo</td>
                        <td className="py-4 px-4 text-right font-extrabold text-[#003366] text-xl tabular-nums">€ {tariResult.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 bg-white border border-slate-200 rounded p-4">
                  <div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 mb-2">Acconto (16 Giugno)</div>
                  <div className="text-lg font-bold text-[#003366]">€ {(tariResult.total / 2).toFixed(2)}</div>
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded p-4">
                  <div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 mb-2">Saldo (16 Dicembre)</div>
                  <div className="text-lg font-bold text-[#003366]">€ {(tariResult.total / 2).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Calculator size={48} className="text-slate-200 mb-4" strokeWidth={1} />
              <p className="text-slate-400 text-sm">Inserisci i dati nel pannello laterale<br/>per visualizzare il calcolo.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
