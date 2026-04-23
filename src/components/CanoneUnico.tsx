import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  ShieldCheck, 
  Printer, 
  Megaphone, 
  Layout, 
  ChevronRight, 
  ChevronLeft,
  Info,
  MapPin,
  Clock,
  FileText,
  AlertTriangle,
  Settings,
  CreditCard,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Home,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BackToTop from './BackToTop';
import BackButton from './BackButton';
import { PDFService, PDFData } from "../services/pdfService";

const CanoneUnico = () => {
  const [sezione, setSezione] = useState('occupazione');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const generatePDF = () => {
    // Generate a temporary protocol for the simulation or use the counter
    const protocolPrefix = `NAR-${new Date().getFullYear()}-SIM`;
    const protocolCode = `${protocolPrefix}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const uuid = crypto.randomUUID ? crypto.randomUUID() : `CUN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const pdfData: PDFData = {
      title: "Prospetto Canone Unico",
      subtitle: "Simulazione calcolo Canone Patrimoniale Unificato",
      year: new Date().getFullYear(),
      date: new Date().toLocaleDateString("it-IT"),
      protocollo: protocolCode,
      uuid: uuid,
      contribuente: {
        nome: `${payer.nome} ${payer.cognome}`,
        cf: payer.cf
      },
      summaryItems: [
        { label: "Totale Canone", value: `€ ${totali.totale.toFixed(2)}`, isAccent: true },
        { label: "Suolo", value: `€ ${totali.occupazione.toFixed(2)}` },
        { label: "Pubblicità", value: `€ ${totali.pubblicita.toFixed(2)}` }
      ],
      tables: [
        {
          title: "Dettaglio Calcolo per Sezione",
          head: [["Sezione", "Dettaglio", "Importo"]],
          body: [
            ["Occupazione Suolo", `${occTipo.toUpperCase()} - ${occMq}mq${occTipo === 'temporanea' ? ` (${occGiorni}gg)` : ''}`, `€ ${totali.occupazione.toFixed(2)}`],
            ["Pubblicità", `${pubTipo.toUpperCase()} - ${pubMq}mq`, `€ ${totali.pubblicita.toFixed(2)}`],
            ["Affissioni", `${affFogli} Manifesti - ${affGiorni}gg`, `€ ${totali.affissioni.toFixed(2)}`]
          ],
          columnStyles: { 2: { halign: "right" } }
        }
      ]
    };

    PDFService.generateInstitutionalPDF(pdfData, `PROSPETTO_CANONE_NARO_2025.pdf`);
  };

  // Coefficienti configurabili
  const [config, setConfig] = useState({
    occTempRate: 1.50,
    occPermRate: 40,
    pubOrdRate: 15,
    pubLumRate: 25,
    affBaseRate: 1.80,
    coeffZona1: 1.2,
    coeffZona2: 0.8
  });

  // Stato Occupazione
  const [occTipo, setOccTipo] = useState('temporanea');
  const [occMq, setOccMq] = useState(10);
  const [occGiorni, setOccGiorni] = useState(1);
  const [occZona, setOccZona] = useState('1');

  // Stato Pubblicità
  const [pubTipo, setPubTipo] = useState('ordinaria');
  const [pubMq, setPubMq] = useState(2);

  // Stato Contribuente
  const [payer, setPayer] = useState({
    nome: '',
    cognome: '',
    cf: ''
  });

  // Stato Affissioni
  const [affFogli, setAffFogli] = useState(10);
  const [affGiorni, setAffGiorni] = useState(10);

  // Errori di validazione
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [totali, setTotali] = useState({
    occupazione: 0,
    pubblicita: 0,
    affissioni: 0,
    totale: 0
  });

  // Validazione
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Validazione Occupazione
    if (sezione === 'occupazione') {
      if (occMq <= 0 || occMq > 5000) newErrors.occMq = "Inserire superficie valida (0.1-5000 mq)";
      if (occTipo === 'temporanea' && (occGiorni <= 0 || occGiorni > 365)) newErrors.occGiorni = "Inserire giorni validi (1-365)";
    }
    
    // Validazione Pubblicità
    if (sezione === 'pubblicita') {
      if (pubMq <= 0 || pubMq > 1000) newErrors.pubMq = "Inserire superficie valida (0.1-1000 mq)";
    }
    
    // Validazione Affissioni
    if (sezione === 'affissioni') {
      if (affFogli <= 0 || affFogli > 1000) newErrors.affFogli = "Inserire numero manifesti valido (1-1000)";
      if (affGiorni <= 0 || affGiorni > 90) newErrors.affGiorni = "Inserire giorni validi (1-90)";
    }

    // Validazione Contribuente (Obbligatoria per procedere)
    if (!payer.nome.trim()) newErrors.nome = "Il nome è obbligatorio.";
    if (!payer.cognome.trim()) newErrors.cognome = "Il cognome è obbligatorio.";
    if (!payer.cf || payer.cf.length !== 16) newErrors.cf = "Inserire un Codice Fiscale valido di 16 caratteri.";

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      alert("Attenzione: Compila correttamente tutti i campi segnalati prima di proseguire.");
    }

    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    // Validazione parziale (solo numeri) per il calcolo live, validazione completa al pagamento
    
    // 1. Calcolo Occupazione
    let coeffZona = occZona === '1' ? config.coeffZona1 : config.coeffZona2;
    let quotaOcc = 0;
    if (occTipo === 'temporanea') {
      quotaOcc = Math.max(0, occMq) * config.occTempRate * Math.max(0, occGiorni) * coeffZona;
    } else {
      quotaOcc = Math.max(0, occMq) * config.occPermRate * coeffZona;
    }

    // 2. Calcolo Pubblicità
    let tariffaPub = pubTipo === 'ordinaria' ? config.pubOrdRate : config.pubLumRate;
    if (pubMq < 5 && pubTipo === 'ordinaria') tariffaPub = 0;
    let quotaPub = Math.max(0, pubMq) * tariffaPub;

    // 3. Calcolo Affissioni
    let quotaAff = Math.max(0, affFogli) * config.affBaseRate * (Math.max(0, affGiorni) / 10);

    setTotali({
      occupazione: quotaOcc,
      pubblicita: quotaPub,
      affissioni: quotaAff,
      totale: quotaOcc + quotaPub + quotaAff
    });
  }, [occTipo, occMq, occGiorni, occZona, pubTipo, pubMq, affFogli, affGiorni, config]);

  const handlePrint = () => {
    window.print();
  };

  const handlePayment = () => {
    if (!validate()) {
      alert("Compila tutti i dati del contribuente e verifica gli importi.");
      return;
    }
    setPaymentStatus('processing');
    setTimeout(() => {
      setPaymentStatus('success');
    }, 2000);
  };

  const toggleAdmin = () => {
    const pass = prompt("Inserire password amministratore:");
    if (pass === "naro2026") {
      setIsAdminMode(true);
      setShowAdminModal(true);
    } else {
      alert("Password errata");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 text-sm">
      <BackToTop />
      {/* Navigation */}
      <div className="max-w-[1400px] mx-auto px-6 pt-5 flex justify-between items-center print:hidden">
        <BackButton />
        <div className="flex gap-2">
           {isAdminMode && (
              <button 
                onClick={() => setShowAdminModal(true)}
                className="p-2 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                title="Configurazione Tariffe"
              >
                <Settings size={16} />
              </button>
            )}
            <div 
              className="p-2 bg-[#003366] text-white rounded cursor-pointer opacity-20 hover:opacity-100 transition-opacity"
              onDoubleClick={toggleAdmin}
              title="Admin Mode (Double Click)"
            >
              <ShieldCheck size={16} />
            </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b-2 border-slate-200 px-7 py-5 mt-5 print:border-none">
        <div className="max-w-[1400px] mx-auto flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="inline-block px-2.5 py-0.5 bg-[#F0F4F8] border border-[#CCD6E0] rounded text-[#003366] text-[0.68rem] font-bold tracking-wider uppercase mb-1.5 print:hidden">
              Canone Unico 2025
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-1 font-serif text-[#003366]">
              Comune di Naro
            </h1>
            <p className="text-slate-500 text-sm max-w-lg font-bold uppercase tracking-widest">
              Canone Unico Patrimoniale — NaroInComune
            </p>
            <p className="text-[#C5A059] font-serif italic mt-2 text-[10px] tracking-wide">"Partecipare è un dovere, digitale è un diritto"</p>
            <div className="h-1 w-[100px] bg-gradient-to-r from-[#C5A059] to-[#B08D45] mt-3 rounded-sm print:hidden"></div>
          </div>
          
          {/* Header Cards (Metrics) */}
          <div className="flex gap-2 flex-wrap print:hidden">
             <div className="bg-[#003366] border border-[#003366] rounded p-2.5 min-w-[140px]">
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-[#F0F4F8] mb-1">Totale Dovuto</div>
                <div className="text-[1.4rem] font-extrabold text-white tabular-nums font-serif">
                  € {totali.totale.toFixed(2)}
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="flex max-w-[1400px] mx-auto min-h-[calc(100vh-180px)]">
        {/* Sidebar */}
        <aside 
          className={`bg-white border-r border-slate-200 shrink-0 overflow-y-auto transition-all duration-300 print:hidden ${isSidebarOpen ? 'w-[420px] min-w-[320px] opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'}`}
        >
           {/* Section Selector */}
           <div className="p-4 border-b border-slate-200 bg-slate-50">
             <div className="flex gap-1">
                {[
                  { id: 'occupazione', label: 'Suolo', icon: <Layout size={14} /> },
                  { id: 'pubblicita', label: 'Pubblicità', icon: <Megaphone size={14} /> },
                  { id: 'affissioni', label: 'Affissioni', icon: <FileText size={14} /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSezione(item.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-bold transition-all ${
                      sezione === item.id 
                        ? 'bg-[#003366] text-white shadow-sm' 
                        : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {item.icon}
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                ))}
             </div>
           </div>

           {/* Input Forms */}
           <div className="p-4">
              {/* Dati Contribuente (Sempre visibili o in una sezione dedicata? Mettiamoli in cima o in fondo. Mettiamoli in fondo come riepilogo dati) */}
              <div className="mb-6 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-2 text-[#003366] font-bold mb-3">
                  <ShieldCheck size={16} className="text-[#C5A059]" /> Dati Contribuente
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nome</label>
                      <input 
                        type="text" 
                        value={payer.nome}
                        onChange={e => setPayer({...payer, nome: e.target.value})}
                        className={`w-full p-2 bg-white border rounded text-xs font-bold focus:ring-1 focus:ring-[#003366] outline-none ${errors.nome ? 'border-red-500' : 'border-slate-300'}`}
                        placeholder="Mario"
                      />
                    </div>
                    <div>
                      <label className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider block mb-1">Cognome</label>
                      <input 
                        type="text" 
                        value={payer.cognome}
                        onChange={e => setPayer({...payer, cognome: e.target.value})}
                        className={`w-full p-2 bg-white border rounded text-xs font-bold focus:ring-1 focus:ring-[#003366] outline-none ${errors.cognome ? 'border-red-500' : 'border-slate-300'}`}
                        placeholder="Rossi"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider block mb-1">Codice Fiscale</label>
                    <input 
                      type="text" 
                      value={payer.cf}
                      onChange={e => setPayer({...payer, cf: e.target.value.toUpperCase()})}
                      maxLength={16}
                      className={`w-full p-2 bg-white border rounded text-xs font-bold focus:ring-1 focus:ring-[#003366] outline-none font-mono ${errors.cf ? 'border-red-500' : 'border-slate-300'}`}
                      placeholder="RSSMRA80A01H501Z"
                    />
                    {errors.cf && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">{errors.cf}</p>}
                  </div>
                </div>
              </div>

              {sezione === 'occupazione' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-left-4">
                  <div className="flex items-center gap-2 text-[#003366] font-bold border-b border-slate-100 pb-2">
                    <MapPin size={16} className="text-[#C5A059]" /> Occupazione Suolo
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">Durata</span>
                      <div className="flex mt-1.5 bg-slate-100 p-1 rounded">
                        <button onClick={() => setOccTipo('temporanea')} className={`flex-1 py-1.5 text-xs font-bold rounded ${occTipo === 'temporanea' ? 'bg-white shadow-sm text-[#003366]' : 'text-slate-500'}`}>Temporanea</button>
                        <button onClick={() => setOccTipo('permanente')} className={`flex-1 py-1.5 text-xs font-bold rounded ${occTipo === 'permanente' ? 'bg-white shadow-sm text-[#003366]' : 'text-slate-500'}`}>Permanente</button>
                      </div>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">Superficie (mq)</span>
                        <input 
                          type="number" 
                          value={occMq} 
                          onChange={(e) => setOccMq(parseFloat(e.target.value) || 0)} 
                          className={`w-full mt-1.5 p-2 bg-white border rounded text-sm font-bold focus:ring-1 focus:ring-[#003366] outline-none ${errors.occMq ? 'border-red-500' : 'border-slate-300'}`} 
                        />
                        {errors.occMq && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">{errors.occMq}</p>}
                      </label>
                      {occTipo === 'temporanea' && (
                        <label className="block">
                          <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">Giorni</span>
                          <input 
                            type="number" 
                            value={occGiorni} 
                            onChange={(e) => setOccGiorni(parseFloat(e.target.value) || 0)} 
                            className={`w-full mt-1.5 p-2 bg-white border rounded text-sm font-bold focus:ring-1 focus:ring-[#003366] outline-none ${errors.occGiorni ? 'border-red-500' : 'border-slate-300'}`} 
                          />
                          {errors.occGiorni && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">{errors.occGiorni}</p>}
                        </label>
                      )}
                    </div>

                    <label className="block">
                      <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">Zona Stradale</span>
                      <select value={occZona} onChange={(e) => setOccZona(e.target.value)} className="w-full mt-1.5 p-2 bg-white border border-slate-300 rounded text-sm font-bold">
                        <option value="1">Zona 1 (Centro Storico / Vie Principali)</option>
                        <option value="2">Zona 2 (Periferia / Altre vie)</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {sezione === 'pubblicita' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-left-4">
                  <div className="flex items-center gap-2 text-[#003366] font-bold border-b border-slate-100 pb-2">
                    <Megaphone size={16} className="text-[#C5A059]" /> Pubblicità
                  </div>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">Tipologia Mezzo</span>
                      <select value={pubTipo} onChange={(e) => setPubTipo(e.target.value)} className="w-full mt-1.5 p-2 bg-white border border-slate-300 rounded text-sm font-bold">
                        <option value="ordinaria">Insegna Ordinaria di Esercizio</option>
                        <option value="luminosa">Insegna Luminosa / Illuminata</option>
                        <option value="veicoli">Pubblicità su Veicoli</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">Superficie Espositiva (mq)</span>
                      <input 
                        type="number" 
                        value={pubMq} 
                        onChange={(e) => setPubMq(parseFloat(e.target.value) || 0)} 
                        className={`w-full mt-1.5 p-2 bg-white border rounded text-sm font-bold focus:ring-1 focus:ring-[#003366] outline-none ${errors.pubMq ? 'border-red-500' : 'border-slate-300'}`} 
                      />
                      {errors.pubMq && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">{errors.pubMq}</p>}
                      {pubMq < 5 && pubTipo === 'ordinaria' && pubMq > 0 && (
                        <p className="mt-2 text-[10px] text-green-600 font-bold uppercase">✓ Esente (Insegna esercizio &lt; 5mq)</p>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {sezione === 'affissioni' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-left-4">
                  <div className="flex items-center gap-2 text-[#003366] font-bold border-b border-slate-100 pb-2">
                    <FileText size={16} className="text-[#C5A059]" /> Pubbliche Affissioni
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">Numero Manifesti</span>
                        <input 
                          type="number" 
                          value={affFogli} 
                          onChange={(e) => setAffFogli(parseFloat(e.target.value) || 0)} 
                          className={`w-full mt-1.5 p-2 bg-white border rounded text-sm font-bold focus:ring-1 focus:ring-[#003366] outline-none ${errors.affFogli ? 'border-red-500' : 'border-slate-300'}`} 
                        />
                        {errors.affFogli && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">{errors.affFogli}</p>}
                      </label>
                      <label className="block">
                        <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">Giorni Esposizione</span>
                        <input 
                          type="number" 
                          value={affGiorni} 
                          onChange={(e) => setAffGiorni(parseFloat(e.target.value) || 0)} 
                          className={`w-full mt-1.5 p-2 bg-white border rounded text-sm font-bold focus:ring-1 focus:ring-[#003366] outline-none ${errors.affGiorni ? 'border-red-500' : 'border-slate-300'}`} 
                        />
                        {errors.affGiorni && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">{errors.affGiorni}</p>}
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Format standard foglio: 70x100 cm</p>
                  </div>
                </div>
              )}
           </div>

           <div className="p-4 border-b border-slate-200 bg-amber-50/50 mt-4">
              <div className="flex items-start gap-2 text-xs text-amber-800 leading-relaxed">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p>Le tariffe caricate sono puramente indicative. Fare riferimento al Regolamento Comunale vigente.</p>
              </div>
           </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-7 bg-slate-50">
          <div className="flex justify-between items-center border-b-2 border-slate-200 mb-5 pb-2 print:hidden">
            <div className="flex gap-4">
              <button className="flex items-center gap-1.5 px-0 py-2 text-[#003366] border-b-2 border-[#003366] font-bold text-sm">
                <Home size={14} /> Riepilogo Canone
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={generatePDF} className="flex items-center gap-1.5 text-xs font-bold text-[#003366] hover:bg-slate-100 px-2 py-1 rounded border border-slate-200">
                <Download size={14} /> Esporta PDF
              </button>
              <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-bold text-[#003366] hover:bg-slate-100 px-2 py-1 rounded">
                <Printer size={14} /> Stampa
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

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-2xl mx-auto print:shadow-none print:border-none print:max-w-none">
            <div className="bg-[#003366] p-6 text-white print:bg-white print:text-black print:border-b print:border-black">
              <h3 className="text-xl font-bold font-serif text-[#C5A059] print:text-black">Riepilogo Canone Unico</h3>
              <p className="text-[10px] opacity-70 uppercase tracking-widest mt-1 font-bold text-white print:text-slate-600">Calcolo Automatico L. 160/2019</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Occupazione Suolo</span>
                  <span className="font-serif font-bold text-lg text-[#003366]">€ {totali.occupazione.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pubblicità</span>
                  <span className="font-serif font-bold text-lg text-[#003366]">€ {totali.pubblicita.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Affissioni</span>
                  <span className="font-serif font-bold text-lg text-[#003366]">€ {totali.affissioni.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 text-center bg-[#fdfbf7] rounded-lg p-4 border border-[#C5A059]/20 print:bg-transparent print:border-none">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Totale Dovuto (Stima)</p>
                <div className="text-4xl font-black text-[#003366] tracking-tight font-serif">€ {totali.totale.toFixed(2)}</div>
              </div>

              <div className="space-y-3 pt-2 print:hidden">
                <button 
                  onClick={handlePayment}
                  disabled={paymentStatus !== 'idle' || totali.totale <= 0}
                  className={`w-full py-3 rounded-lg font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm text-xs ${
                    paymentStatus === 'success' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-[#C5A059] text-[#003366] hover:bg-[#B08D45] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {paymentStatus === 'processing' ? (
                    <div className="w-4 h-4 border-2 border-[#003366] border-t-transparent rounded-full animate-spin"></div>
                  ) : paymentStatus === 'success' ? (
                    <><CheckCircle2 size={16} /> Avviso Generato</>
                  ) : (
                    <><CreditCard size={16} /> Genera Avviso PagoPA</>
                  )}
                </button>
                
                <div className="text-center">
                  <a href="#" className="text-[10px] font-bold text-[#003366] hover:underline flex items-center justify-center gap-1">
                    <FileText size={10} /> Leggi Regolamento Canone Unico 2025 (PDF)
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Avviso PagoPA */}
      {paymentStatus === 'success' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto print:bg-white print:p-0 print:absolute">
          <div className="bg-white w-full max-w-3xl shadow-2xl animate-in zoom-in duration-300 print:shadow-none print:w-full">
            {/* Intestazione Avviso */}
            <div className="border-b-2 border-[#003366] p-8 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <ShieldCheck size={48} className="text-[#003366]" />
                <div>
                  <h2 className="text-2xl font-bold text-[#003366] uppercase">Comune di Naro</h2>
                  <p className="text-sm font-bold text-slate-500">Servizio Tributi - Canone Unico Patrimoniale</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-[#003366] text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-2 inline-block">Avviso di Pagamento</div>
                <div className="text-xs text-slate-500 font-mono">IUV: 0000 1234 5678 9012 3456</div>
              </div>
            </div>

            {/* Corpo Avviso */}
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-1">Ente Creditore</h3>
                  <p className="font-bold text-slate-900">Comune di Naro</p>
                  <p className="text-sm text-slate-600">Piazza Garibaldi, 1</p>
                  <p className="text-sm text-slate-600">92028 Naro (AG)</p>
                  <p className="text-sm text-slate-600">C.F. 80000000000</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-1">Soggetto Debitore</h3>
                  <p className="font-bold text-slate-900 uppercase">{payer.cognome} {payer.nome}</p>
                  <p className="text-sm text-slate-600 font-mono">{payer.cf}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-1">Dettaglio Importi</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 text-xs">
                      <th className="pb-2">Descrizione</th>
                      <th className="pb-2 text-right">Anno</th>
                      <th className="pb-2 text-right">Importo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {totali.occupazione > 0 && (
                      <tr>
                        <td className="py-2">Canone Occupazione Suolo Pubblico</td>
                        <td className="py-2 text-right">2025</td>
                        <td className="py-2 text-right font-mono">€ {totali.occupazione.toFixed(2)}</td>
                      </tr>
                    )}
                    {totali.pubblicita > 0 && (
                      <tr>
                        <td className="py-2">Canone Esposizione Pubblicitaria</td>
                        <td className="py-2 text-right">2025</td>
                        <td className="py-2 text-right font-mono">€ {totali.pubblicita.toFixed(2)}</td>
                      </tr>
                    )}
                    {totali.affissioni > 0 && (
                      <tr>
                        <td className="py-2">Diritti Pubbliche Affissioni</td>
                        <td className="py-2 text-right">2025</td>
                        <td className="py-2 text-right font-mono">€ {totali.affissioni.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="font-bold text-[#003366]">
                      <td className="pt-4 uppercase">Totale da Versare</td>
                      <td className="pt-4"></td>
                      <td className="pt-4 text-right text-xl">€ {totali.totale.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bollettino PagoPA Simulato */}
              <div className="border-2 border-slate-200 border-dashed rounded-lg p-4 bg-slate-50 flex items-center justify-between gap-6">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Codice Avviso (IUV)</p>
                  <p className="font-mono text-lg font-bold text-slate-900 tracking-widest">3020 0000 1234 5678 90</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Scadenza</p>
                  <p className="font-bold text-slate-900">{new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString()}</p>
                </div>
                <div className="w-24 h-24 bg-white p-1 border border-slate-200 flex items-center justify-center">
                  <div className="w-20 h-20 bg-slate-900"></div>
                </div>
              </div>
            </div>

            {/* Footer Azioni */}
            <div className="bg-slate-100 p-4 flex justify-between items-center print:hidden">
              <button onClick={() => setPaymentStatus('idle')} className="text-slate-500 font-bold text-xs hover:text-slate-800">
                &larr; Chiudi e Torna
              </button>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="bg-[#003366] text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2 hover:bg-[#002244]">
                  <Printer size={14} /> Stampa Avviso
                </button>
                <button onClick={() => alert("Reindirizzamento al portale PagoPA...")} className="bg-[#0066CC] text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2 hover:bg-[#0055AA]">
                  Paga Online
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Admin */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-[#003366] p-5 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings className="text-[#C5A059]" size={18} /> Configurazione Tariffe
              </h3>
              <button onClick={() => setShowAdminModal(false)} className="text-white/60 hover:text-white">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occ. Temp (€/mq/gg)</label>
                  <input type="number" step="0.01" value={config.occTempRate} onChange={(e) => setConfig({...config, occTempRate: parseFloat(e.target.value)})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occ. Perm (€/mq/anno)</label>
                  <input type="number" step="0.01" value={config.occPermRate} onChange={(e) => setConfig({...config, occPermRate: parseFloat(e.target.value)})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pub. Ord (€/mq/anno)</label>
                  <input type="number" step="0.01" value={config.pubOrdRate} onChange={(e) => setConfig({...config, pubOrdRate: parseFloat(e.target.value)})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pub. Lum (€/mq/anno)</label>
                  <input type="number" step="0.01" value={config.pubLumRate} onChange={(e) => setConfig({...config, pubLumRate: parseFloat(e.target.value)})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Affissione Foglio (€)</label>
                  <input type="number" step="0.01" value={config.affBaseRate} onChange={(e) => setConfig({...config, affBaseRate: parseFloat(e.target.value)})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold" />
                </div>
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => setShowAdminModal(false)}
                  className="w-full py-2.5 bg-[#003366] text-white rounded-lg font-bold uppercase tracking-widest hover:bg-[#002244] transition-colors text-xs"
                >
                  Salva Configurazione
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanoneUnico;
