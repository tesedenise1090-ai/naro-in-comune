import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Droplets, Trash2, Coins, Phone, Calculator, Calendar, FileText, X, Check, ExternalLink, Lightbulb, Landmark, ShieldCheck, Info, ArrowRight, AlertTriangle, Download, ArrowLeft, Globe, Leaf, Box, Newspaper, Wine, Settings, Save, Edit2, LayoutGrid, Plus, History, CreditCard, Trash } from 'lucide-react';
import BackToTop from './BackToTop';
import BackButton from './BackButton';
import { StorageService } from '../services/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WASTE_SCHEDULE } from '../lib/wasteSchedule';
import { calendarioRifiuti } from '../calendarioData';

interface UtilityTabProps {
  isAdmin?: boolean;
}

export function UtilityTab({ isAdmin = false }: UtilityTabProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Bills State
  const [bills, setBills] = useState<any[]>([]);
  const [showBillForm, setShowBillForm] = useState(false);
  const [newBill, setNewBill] = useState({ fornitore: '', importo: '', scadenza: '', stato: 'Da Pagare' });

  useEffect(() => {
    setBills(StorageService.getBills());
  }, []);

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedBills = StorageService.addBill(newBill);
    setBills(updatedBills);
    setNewBill({ fornitore: '', importo: '', scadenza: '', stato: 'Da Pagare' });
    setShowBillForm(false);
  };

  const handleUpdateStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Pagata' ? 'Da Pagare' : 'Pagata';
    const bill = bills.find(b => b.id === id);
    if (bill) {
      const updatedBills = StorageService.updateBill({ ...bill, stato: newStatus });
      setBills(updatedBills);
    }
  };

  const handleDeleteBill = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa bolletta?')) {
      const updatedBills = StorageService.deleteBill(id);
      setBills(updatedBills);
    }
  };
  
  const handleDownloadPDF = () => {
    setIsDownloading(true);
    setTimeout(() => {
       const doc = new jsPDF();
       doc.setFontSize(18);
       doc.text('Calendario Raccolta Differenziata - Comune di Naro', 14, 15);
       doc.setFontSize(10);
       doc.text('Gestore: Roma Costruzioni SRL', 14, 22);

       const tableData = calendarioRifiuti.map((s: any) => [
          s.day,
          s.type
       ]);
       
       autoTable(doc, {
          head: [['Giorno', 'Materiali da Conferire']],
          body: tableData,
          startY: 30,
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: { fillColor: [22, 60, 107], textColor: [255, 255, 255] },
          didParseCell: (data) => {
             if (data.section === 'body') {
                const type = data.row.cells[1].raw as string;
                if (type.includes('Organico (Umido)')) {
                    data.cell.styles.fillColor = [209, 250, 229]; // Emerald 100
                } else if (type.includes('RSU (Indifferenziata)')) {
                    data.cell.styles.fillColor = [226, 232, 240]; // Slate 200
                } else if (type.includes('Organico + Vetro')) {
                    data.cell.styles.fillColor = [153, 246, 228]; // Teal 200 (a bit darker for readability)
                } else if (type.includes('Plastica + Alluminio')) {
                    data.cell.styles.fillColor = [254, 240, 138]; // Yellow 200
                } else if (type.includes('Carta e Cartone')) {
                    data.cell.styles.fillColor = [191, 219, 254]; // Blue 200
                } else if (type.includes('Nessun Ritiro')) {
                    data.cell.styles.fillColor = [254, 202, 202]; // Red 200
                }
             }
          }
       });

       doc.setFontSize(8);
       doc.setTextColor(220, 38, 38);
       doc.text('ATTENZIONE: È severamente vietato l\'uso di sacchi neri per il conferimento dell\'organico.', 14, (doc as any).lastAutoTable.finalY + 10);
       doc.setTextColor(50, 50, 50);
       doc.text('NOTA: Controlla sempre il portale per eventuali variazioni nei giorni festivi.', 14, (doc as any).lastAutoTable.finalY + 14);
       
       // Force download strategy
       const blob = doc.output('blob');
       const url = URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.download = 'Calendario_Naro_2026.pdf';
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       
       setIsDownloading(false);
    }, 800);
  };
  
  const megaMenuLinks = [
    { name: 'IMU', path: '/calcolo-imu', icon: Calculator, color: 'text-[#C5A059]' },
    { name: 'TARI', path: '/calcolo-tari', icon: Coins, color: 'text-[#C5A059]' },
    { name: 'Canone Unico', path: '/canone-unico', icon: Landmark, color: 'text-[#C5A059]' },
    { name: 'Immutabili', path: '/immutabili', icon: ShieldCheck, color: 'text-[#C5A059]' },
    { name: 'Delibere', path: '/delibere', icon: FileText, color: 'text-[#C5A059]' },
  ];

  const [waterReading, setWaterReading] = useState({ code: '', reading: '' });
  const [readingSubmitted, setReadingSubmitted] = useState(false);
  
  // Waste Calendar State
  const [isEditingCalendar, setIsEditingCalendar] = useState(false);
  const [calendarData, setCalendarData] = useState(calendarioRifiuti);

  const wasteTypes = [
    { type: 'Organico', color: 'bg-emerald-100 text-emerald-800', icon: Leaf },
    { type: 'Plastica/Metalli', color: 'bg-yellow-100 text-yellow-800', icon: Box },
    { type: 'Carta/Cartone', color: 'bg-blue-100 text-blue-800', icon: Newspaper },
    { type: 'Indifferenziata', color: 'bg-slate-200 text-slate-800', icon: Trash2 },
    { type: 'Organico/Vetro', color: 'bg-teal-100 text-teal-800', icon: Wine },
    { type: 'Nessun Ritiro', color: 'bg-red-100 text-red-800', icon: X },
  ];

  const handleCalendarChange = (index: number, newType: string) => {
    const newCalendar = [...calendarData];
    const typeConfig = wasteTypes.find(t => t.type === newType);
    if (typeConfig) {
      newCalendar[index] = { 
        ...newCalendar[index], 
        type: newType,
        color: typeConfig.color 
      };
      setCalendarData(newCalendar);
    }
  };

  const getWasteIcon = (type: string) => {
    const config = wasteTypes.find(t => t.type === type);
    const Icon = config ? config.icon : Trash2;
    return <Icon className="w-6 h-6 mb-2" />;
  };


  const submitWaterReading = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulazione invio
    setTimeout(() => {
      setReadingSubmitted(true);
      setTimeout(() => {
        setReadingSubmitted(false);
        setWaterReading({ code: '', reading: '' });
        setActiveModal(null);
      }, 2000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <BackToTop />
      
      {/* Header Semplificato */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <BackButton to="/" label="Torna alla Home" className="!bg-slate-50 !border-slate-200 !text-slate-700 hover:!bg-slate-100" />
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Hub Utility</h1>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center justify-center mb-4">
            <Landmark className="w-10 h-10 text-[#C5A059] mr-3" />
            Hub Utility NaroInComune
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Il punto di accesso unico per tutti i servizi di pubblica utilità. Gestisci le tue utenze, calcola i tributi e accedi agli strumenti digitali.
          </p>
          <p className="mt-4 p-4 bg-amber-50 text-amber-800 rounded-xl text-sm border border-amber-200 inline-block text-left">
            💡 Nota: Il calendario viene monitorato e aggiornato costantemente in base alle disposizioni ufficiali di Roma Costruzioni SRL per il Comune di Naro. In occasione di festività, il sistema indicherà automaticamente la sospensione.
          </p>
          <p className="text-[#C5A059] font-serif italic mt-4 text-sm tracking-wide">"Partecipare è un dovere, digitale è un diritto"</p>
        </div>

      {/* SEZIONE 1: Tributi e Fiscalità Locale */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8 pb-2 border-b-2 border-[#C5A059]/20">
          <Coins className="w-8 h-8 text-[#C5A059]" />
          <h2 className="text-3xl font-bold text-slate-900">Tributi e Fiscalità Locale</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            <p className="text-slate-600 leading-relaxed mb-6 text-lg">
              Il Comune di Naro gestisce i tributi locali per garantire il finanziamento dei servizi essenziali alla comunità. 
              Qui puoi accedere agli strumenti di calcolo per IMU e TARI, consultare le aliquote e gestire i pagamenti.
            </p>
            <div className="bg-[#fdfbf7] p-5 rounded-2xl border border-[#C5A059]/20 flex items-start">
              <ShieldCheck className="w-6 h-6 text-[#003366] mr-4 mt-0.5" />
              <div>
                <p className="text-[#003366] font-bold mb-1">Trasparenza Fiscale</p>
                <p className="text-sm text-slate-700">
                  Tutte le aliquote sono deliberate dal Consiglio Comunale e pubblicate sul portale del Ministero dell'Economia e delle Finanze. Codice Catastale di Naro: <strong>F845</strong>.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-[#C5A059]" />
              Dati Identificativi Ente
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Codice Catastale:</span>
                <span className="font-mono font-bold text-slate-900">F845</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Codice Ente:</span>
                <span className="font-bold text-slate-900">Comune di Naro</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Provincia:</span>
                <span className="font-bold text-slate-900">Agrigento (AG)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* IMU Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="bg-[#003366] p-6 text-white">
              <div className="flex justify-between items-start">
                <Calculator className="w-10 h-10 text-[#C5A059]" />
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/20">ANNO 2026</span>
              </div>
              <h3 className="text-2xl font-bold mt-4">IMU</h3>
              <p className="text-slate-300 text-sm mt-1">Imposta Municipale Propria</p>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm mb-6">
                Dovuta per il possesso di fabbricati, aree fabbricabili e terreni agricoli. Esente per l'abitazione principale (non di lusso).
              </p>
              <Link 
                to="/calcolo-imu"
                className="flex items-center justify-between p-4 bg-[#fdfbf7] text-[#003366] border border-[#C5A059]/20 rounded-xl font-bold hover:bg-[#f9f5eb] transition-colors group"
              >
                <div className="flex items-center">
                  <Calculator className="w-5 h-5 mr-3 text-[#C5A059]" />
                  <span>Calcolo IMU Online 2026</span>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* TARI Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="bg-[#1a1a1a] p-6 text-white">
              <div className="flex justify-between items-start">
                <Trash2 className="w-10 h-10 text-[#C5A059]" />
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/20">ANNO 2024/25</span>
              </div>
              <h3 className="text-2xl font-bold mt-4">TARI</h3>
              <p className="text-slate-300 text-sm mt-1">Tassa sui Rifiuti</p>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm mb-6">
                Destinata alla copertura dei costi relativi al servizio di gestione dei rifiuti urbani. Calcolata su superficie e occupanti.
              </p>
              <div className="space-y-3">
                <Link 
                  to="/calcolo-tari"
                  className="w-full flex items-center justify-between p-4 bg-slate-50 text-[#1a1a1a] border border-slate-200 rounded-xl font-bold hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center">
                    <Calculator className="w-5 h-5 mr-3 text-[#C5A059]" />
                    <span>Simulatore Calcolo TARI</span>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/tari-timeline"
                  className="w-full flex items-center justify-between p-4 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-3 text-[#C5A059]" />
                    <span>Storico Tariffe TARI</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Canone Unico Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="bg-[#C5A059] p-6 text-[#003366]">
              <div className="flex justify-between items-start">
                <FileText className="w-10 h-10 opacity-80" />
                <span className="bg-[#003366]/10 px-3 py-1 rounded-full text-xs font-bold border border-[#003366]/20">L. 160/2019</span>
              </div>
              <h3 className="text-2xl font-bold mt-4">Canone Unico</h3>
              <p className="text-[#003366]/70 text-sm mt-1">Patrimoniale (Ex TOSAP/ICP)</p>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm mb-6">
                Sostituisce TOSAP, COSAP, ICP, CIMP e DPA. Dovuto per occupazione suolo pubblico e diffusione messaggi pubblicitari.
              </p>
              <Link 
                to="/canone-unico"
                className="flex items-center justify-between p-4 bg-[#003366]/5 text-[#003366] border border-[#003366]/10 rounded-xl font-bold hover:bg-[#003366]/10 transition-colors group"
              >
                <div className="flex items-center">
                  <Calculator className="w-5 h-5 mr-3 text-[#C5A059]" />
                  <span>Simulatore Canone Unico</span>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Registri Immutabili Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="bg-[#003366] p-6 text-white">
              <div className="flex justify-between items-start">
                <ShieldCheck className="w-10 h-10 text-[#C5A059]" />
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/20">BLOCKCHAIN</span>
              </div>
              <h3 className="text-2xl font-bold mt-4">Immutabili</h3>
              <p className="text-slate-300 text-sm mt-1">Registri & Notarizzazione</p>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm mb-6">
                Verifica l'autenticità e l'integrità degli atti amministrativi notarizzati su network blockchain pubblico.
              </p>
              <Link 
                to="/immutabili"
                className="flex items-center justify-between p-4 bg-[#fdfbf7] text-[#003366] border border-[#C5A059]/20 rounded-xl font-bold hover:bg-[#f9f5eb] transition-colors group"
              >
                <div className="flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-3 text-[#C5A059]" />
                  <span>Verifica Atti Immutabili</span>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">Addizionale IRPEF</h4>
            <p className="text-sm text-slate-600 mb-4">Aliquota comunale applicata al reddito imponibile delle persone fisiche.</p>
            <div className="text-2xl font-bold text-slate-800">0,80%</div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">Diritti Segreteria</h4>
            <p className="text-sm text-slate-600 mb-4">Costi per il rilascio di certificati, atti e pratiche edilizie (SUAP/SUE).</p>
            <button className="text-blue-600 font-bold text-sm hover:underline">Tabella Diritti →</button>
          </div>
        </div>
      </section>

      {/* SEZIONE 2: Trasparenza e Atti Amministrativi */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8 pb-2 border-b-2 border-[#C5A059]/20">
          <FileText className="w-8 h-8 text-[#003366]" />
          <h2 className="text-3xl font-bold text-slate-900">Trasparenza e Atti Amministrativi</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <p className="text-slate-600 leading-relaxed mb-6 text-lg">
              L'Albo Pretorio Online è lo strumento attraverso il quale il Comune rende pubblici i propri atti amministrativi, garantendo la trasparenza dell'azione amministrativa e la partecipazione dei cittadini.
            </p>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="bg-[#003366] p-6 text-white">
                <div className="flex justify-between items-start">
                  <FileText className="w-10 h-10 text-[#C5A059]" />
                  <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/20">ALBO PRETORIO</span>
                </div>
                <h3 className="text-2xl font-bold mt-4">Delibere & Atti</h3>
                <p className="text-slate-300 text-sm mt-1">Consultazione Atti Amministrativi</p>
              </div>
              <div className="p-6">
                <p className="text-slate-600 text-sm mb-6">
                  Accedi all'archivio digitale delle Delibere di Giunta, Consiglio Comunale, Determine Dirigenziali e Ordinanze Sindacali.
                </p>
                <Link 
                  to="/delibere"
                  className="flex items-center justify-between p-4 bg-[#fdfbf7] text-[#003366] border border-[#C5A059]/20 rounded-xl font-bold hover:bg-[#f9f5eb] transition-colors group"
                >
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-3 text-[#C5A059]" />
                    <span>Consulta Albo Pretorio Online</span>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-[#C5A059]" />
              Obblighi di Pubblicazione
            </h3>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#C5A059] mt-0.5 shrink-0" />
                <span>Pubblicazione per 15 giorni consecutivi per la validità legale degli atti.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#C5A059] mt-0.5 shrink-0" />
                <span>Accessibilità totale ai documenti in formato aperto e riutilizzabile.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#C5A059] mt-0.5 shrink-0" />
                <span>Diritto di accesso civico generalizzato (FOIA) per atti non pubblicati.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SEZIONE 3: Utenze e Servizi */}
      <section>
        <div className="flex items-center gap-3 mb-8 pb-2 border-b-2 border-[#C5A059]/20">
          <Zap className="w-8 h-8 text-[#C5A059]" />
          <h2 className="text-3xl font-bold text-slate-900">Utenze e Servizi</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Energia */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#C5A059] transition-colors">
              <Lightbulb className="w-8 h-8 text-[#C5A059] group-hover:text-[#003366] transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Energia</h3>
            <p className="text-slate-500 mb-6">Gestione forniture, controllo consumi e portale offerte ARERA.</p>
            <div className="space-y-3">
              <a href="https://www.consumienergia.it/portaleConsumi/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-slate-50 rounded-xl text-sm text-slate-700 hover:bg-[#C5A059]/10 transition-colors font-medium">
                <ExternalLink className="w-4 h-4 mr-2 text-[#C5A059]" /> Portale Consumi
              </a>
              <a href="https://www.ilportaleofferte.it/portaleOfferte/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-slate-50 rounded-xl text-sm text-slate-700 hover:bg-[#C5A059]/10 transition-colors font-medium">
                <ExternalLink className="w-4 h-4 mr-2 text-[#C5A059]" /> Confronta Offerte
              </a>
            </div>
          </div>

          {/* Acqua */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#003366] transition-colors">
              <Droplets className="w-8 h-8 text-[#003366] group-hover:text-[#C5A059] transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Acqua</h3>
            <p className="text-slate-500 mb-6">Gestione idrica, autolettura contatore e segnalazione guasti rete.</p>
            <button onClick={() => setActiveModal('water')} className="w-full py-3 bg-[#003366] text-white rounded-xl font-bold hover:bg-[#002244] transition-all shadow-sm flex items-center justify-center">
              <Droplets className="w-5 h-5 mr-2 text-[#C5A059]" /> Invia Autolettura
            </button>
          </div>

          {/* Rifiuti */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#1a1a1a] transition-colors">
              <Trash2 className="w-8 h-8 text-[#1a1a1a] group-hover:text-[#C5A059] transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Rifiuti</h3>
            <p className="text-slate-500 mb-6">Calendario raccolta differenziata, ritiro ingombranti e isole ecologiche.</p>
            <button onClick={() => setActiveModal('waste')} className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl font-bold hover:bg-black transition-all shadow-sm flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5 mr-2 text-[#C5A059]" /> Calendario Raccolta
            </button>
            <a href="https://www.facebook.com/profile.php?id=100057035126727" target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center">
              <Globe className="w-5 h-5 mr-2" /> Avvisi su Facebook
            </a>
          </div>
[diff_block_end]
        </div>

        {/* Strumenti Rapidi & Supporto */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-50 rounded-2xl p-8 border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <Calculator className="w-6 h-6 mr-2 text-slate-600" />
              Strumenti Rapidi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href="https://www.pagopa.gov.it/" target="_blank" rel="noopener noreferrer" className="flex items-center p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-500 transition-colors group">
                <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-600 transition-colors">
                  <FileText className="w-5 h-5 text-blue-700 group-hover:text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Paga con PagoPA</p>
                  <p className="text-xs text-slate-500">Pagamenti verso la PA</p>
                </div>
              </a>
              <a href="https://www.arera.it/it/consumatori/conciliazione.htm" target="_blank" rel="noopener noreferrer" className="flex items-center p-4 bg-white rounded-xl border border-slate-200 hover:border-orange-500 transition-colors group">
                <div className="p-2 bg-orange-100 rounded-lg mr-3 group-hover:bg-orange-600 transition-colors">
                  <AlertTriangle className="w-5 h-5 text-orange-700 group-hover:text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Conciliazione</p>
                  <p className="text-xs text-slate-500">Risoluzione controversie</p>
                </div>
              </a>
              <Link to="/rndt" className="flex items-center p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-500 transition-colors group">
                <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-600 transition-colors">
                  <Globe className="w-5 h-5 text-blue-700 group-hover:text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Dati Territoriali (RNDT)</p>
                  <p className="text-xs text-slate-500">Mappe e dataset comunali</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-[#003366] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4 flex items-center">
                <Phone className="w-6 h-6 mr-2 text-[#C5A059]" />
                Assistenza Diretta
              </h3>
              <p className="text-slate-300 mb-6">
                Hai dubbi su tributi o utenze? I nostri uffici sono a tua disposizione.
              </p>
              <div className="space-y-3">
                <a href="mailto:tributi@comune.naro.ag.it" className="flex items-center justify-center w-full py-3 bg-[#C5A059] text-[#003366] rounded-xl font-bold hover:bg-[#b08d45] transition-colors">
                  Invia Email
                </a>
                <a href="tel:+393505096789" className="flex items-center justify-center w-full py-3 bg-transparent text-white rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/20">
                  Chiama Ufficio
                </a>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#C5A059] rounded-full opacity-10 blur-3xl"></div>
          </div>
        </div>

        {/* NUOVA SEZIONE: Gestione Bollette & Scadenze */}
        <div id="sezione-bollette" className="mt-20 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-[#C5A059]" />
                Bollette & Scadenze
              </h2>
              <p className="text-slate-500 font-medium">Digitalizza le tue spese e attiva gli alert automatici.</p>
            </div>
            <button 
              onClick={() => setShowBillForm(!showBillForm)}
              className="flex items-center gap-2 px-6 py-3 bg-naro-navy text-white rounded-2xl font-black hover:bg-blue-800 transition-all shadow-xl shadow-blue-100"
            >
              {showBillForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showBillForm ? 'Annulla' : 'Nuova Bolletta'}
            </button>
          </div>

          <AnimatePresence>
            {showBillForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-12"
              >
                <form onSubmit={handleAddBill} className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-2xl grid md:grid-cols-4 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Fornitore / Ente</label>
                    <input 
                      required
                      type="text" 
                      placeholder="es. Enel, Acquedotto..."
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newBill.fornitore}
                      onChange={e => setNewBill({...newBill, fornitore: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Importo (€)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newBill.importo}
                      onChange={e => setNewBill({...newBill, importo: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Data Scadenza</label>
                    <input 
                      required
                      type="date"
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newBill.scadenza}
                      onChange={e => setNewBill({...newBill, scadenza: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 uppercase tracking-widest text-sm">
                    Salva Record
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {bills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bills.map((bill) => {
                const isOverdue = new Date(bill.scadenza) < new Date() && bill.stato === 'Da Pagare';
                return (
                  <motion.div 
                    layout
                    key={bill.id}
                    className={`bg-white p-6 rounded-3xl border-2 transition-all relative overflow-hidden group ${
                      bill.stato === 'Pagata' ? 'border-emerald-50 bg-emerald-50/20' : 
                      isOverdue ? 'border-red-100 bg-red-50/20' : 'border-slate-50'
                    }`}
                  >
                    {isOverdue && (
                      <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 text-[8px] font-black uppercase tracking-tighter rounded-bl-xl">
                        SCADUTA
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${bill.stato === 'Pagata' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <button 
                        onClick={() => handleDeleteBill(bill.id)}
                        className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="text-xl font-black text-slate-800 leading-none mb-1">{bill.fornitore}</h4>
                    <p className="text-2xl font-black text-blue-600 mb-6">€{bill.importo}</p>

                    <div className="flex items-center gap-2 mb-6">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scadenza: {new Date(bill.scadenza).toLocaleDateString('it-IT')}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${bill.stato === 'Pagata' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${bill.stato === 'Pagata' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {bill.stato}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleUpdateStatus(bill.id, bill.stato)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          bill.stato === 'Pagata' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700'
                        }`}
                      >
                        {bill.stato === 'Pagata' ? 'Segna Da Pagare' : 'Segna Pagata'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-20 rounded-[40px] border-4 border-dashed border-slate-100 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <History className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">Nessun Archivio Spese</h3>
              <p className="text-slate-400 font-medium max-w-xs mx-auto">Aggiungi la tua prima bolletta per monitorare le scadenze e ricevere alert personalizzati.</p>
            </div>
          )}
          
          <div className="mt-12 bg-amber-50 rounded-3xl p-6 border-2 border-amber-100 flex gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">Privacy Totale Cloud-Local</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Le informazioni sulle tue bollette sono salvate esclusivamente nel tuo storage locale crittografato. Il sistema di Alert agisce lato client: riceverai notifiche sulla campana in alto solo in base ai dati inseriti qui.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className={`bg-white rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto z-[999] relative animate-in zoom-in-95 duration-200 ${activeModal === 'waste' ? 'max-w-5xl' : 'max-w-2xl'}`}>
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                {activeModal === 'tari' && 'Simulatore TARI'}
                {activeModal === 'waste' && <><Trash2 className="w-5 h-5" /> Calendario Raccolta Differenziata</>}
                {activeModal === 'water' && 'Autolettura Idrica'}
              </h3>
              <div className="flex items-center gap-2">
                {activeModal === 'waste' && isAdmin && (
                  <button 
                    onClick={() => setIsEditingCalendar(!isEditingCalendar)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isEditingCalendar ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                  >
                    {isEditingCalendar ? <><Save className="w-3 h-3" /> Salva Modifiche</> : <><Edit2 className="w-3 h-3" /> Modifica Calendario</>}
                  </button>
                )}
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </div>
            </div>
            
            <div className="p-6">
              {activeModal === 'waste' && (
                <div className="space-y-6">
                  <div className="bg-[#eefcf3] p-5 rounded-xl border border-[#d1f4e0]">
                    <h4 className="font-bold text-[#0f5c3d] mb-2 flex items-center text-lg">
                      <Trash2 className="w-5 h-5 mr-2" />
                      Regole di Conferimento
                    </h4>
                    <p className="text-sm text-[#1b7351] leading-relaxed">
                      I mastelli devono essere esposti la sera prima del giorno di raccolta, dalle ore 22:00 alle ore 06:00.
                    </p>
                  </div>
                  

                    <div id="sezione-rifiuti-completa" className="overflow-x-auto pb-4 -mx-2 px-2">
                    <div className="flex gap-4 min-w-max">
                      {calendarData.map((item, idx) => {
                        const Icon = (({ Leaf, Trash2, Wine, Box, Newspaper, X }) => {
                          const icons: any = { Leaf, Trash2, Wine, Box, Newspaper, X };
                          return icons[item.icon as any] || Trash2;
                        })({ Leaf, Trash2, Wine, Box, Newspaper, X });

                        return (
                          <div key={idx} className="flex flex-col items-center p-6 rounded-3xl border border-slate-200 bg-white w-56 shrink-0 shadow-lg hover:shadow-xl transition-all">
                            <span className="font-black text-slate-800 text-xl mb-1 uppercase tracking-tight">{item.day}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Entro le 06:00</span>
                            
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${item.color.split(' ')[0]}`}>
                              <Icon className="w-10 h-10" />
                            </div>

                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-center w-full mb-4 ${item.color}`}>
                              {item.type}
                            </span>
                            
                            <div className="w-full text-left text-[10px] text-slate-600 space-y-2">
                                {item.dos.length > 0 && <div><strong className="text-emerald-700">SÌ:</strong> {item.dos.join(', ')}</div>}
                                {item.donts.length > 0 && <div><strong className="text-red-700">NO:</strong> {item.donts.join(', ')}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Servizi su Richiesta - Area Dedicata */}
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-6 flex items-center text-lg">
                      <Settings className="w-5 h-5 mr-2 text-[#C5A059]" />
                      Servizi su Richiesta
                    </h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h5 className="font-bold text-slate-700">🧴 Ritiro Pannolini</h5>
                        <p className="text-sm text-slate-600">Servizio attivo il <strong>Giovedì</strong> e il <strong>Sabato</strong>.</p>
                        <p className="text-xs text-slate-500">Riservato agli utenti registrati presso l'Ufficio ARO.</p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-bold text-slate-700">🚛 Ingombranti e Sfalci</h5>
                        <p className="text-sm text-slate-600">Non esporre con i mastelli. Richiedi il ritiro gratuito:</p>
                        <div className="flex gap-2">
                          <a href="tel:+393505096789" className="text-xs px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 hover:border-blue-500 shadow-sm">Chiama Numero Dedicato</a>
                          <span className="text-xs text-slate-500 pt-1">o CCR Contrada Margonia</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Facebook Alert Banner */}
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-4">
                    <div className="p-2 bg-blue-600 rounded-lg shrink-0">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h5 className="font-black text-blue-900 mb-1">Avvisi Live (Roma Costruzioni)</h5>
                      <p className="text-sm text-blue-800 mb-3">Controlla sempre la bacheca ufficiale per eventuali variazioni straordinarie nei giorni festivi o emergenze.</p>
                      <a href="https://www.facebook.com/profile.php?id=100057035126727" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-900 underline">
                        Vai alla pagina Facebook Ufficiale →
                      </a>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                    <button 
                      onClick={handleDownloadPDF}
                      disabled={isDownloading}
                      className="w-full md:w-auto px-8 py-3.5 bg-[#059669] text-white rounded-xl font-bold hover:bg-[#047857] transition-colors flex items-center justify-center shadow-sm text-lg mx-auto disabled:opacity-70"
                    >
                      {isDownloading ? 'Generazione...' : <><Download className="w-5 h-5 mr-2" /> Scarica Calendario PDF</>}
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'water' && (
                <form onSubmit={submitWaterReading} className="space-y-4">
                  {readingSubmitted ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="font-bold text-slate-900">Lettura Inviata!</h4>
                      <p className="text-slate-500 text-sm">Grazie per la tua collaborazione.</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Codice Utente</label>
                        <input type="text" required placeholder="Es. 12345678" className="w-full px-3 py-2 border rounded-lg" value={waterReading.code} onChange={e => setWaterReading({...waterReading, code: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Lettura Contatore (mc)</label>
                        <input type="number" required placeholder="00123" className="w-full px-3 py-2 border rounded-lg" value={waterReading.reading} onChange={e => setWaterReading({...waterReading, reading: e.target.value})} />
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 flex items-start">
                        <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                        Inserisci solo le cifre nere del contatore, ignorando quelle rosse.
                      </div>
                      <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Invia Lettura</button>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
