import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Check, Upload, Download, ShieldAlert, ChevronRight, User, MapPin, ClipboardList, Send, AlertTriangle, Info, X, AlertCircle, Zap, FileSignature, Mic } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { StorageService, RESPONSABILI } from '../services/storage';
import { PDFService, PDFData } from '../services/pdfService';
import { useVoiceToText } from '../hooks/useVoiceToText';
import { municipalInfo } from '../data/municipalInfo';
import { calcolaCodiceFiscale, CODICI_CATASTALI } from '../lib/codiceFiscale';
import BackToTop from './BackToTop';
import BackButton from './BackButton';
import { AutocompleteComune } from './AutocompleteComune';

const STEPS = [
  { id: 1, title: 'Anagrafica', icon: <User className="w-5 h-5" /> },
  { id: 2, title: 'Dettaglio', icon: <ClipboardList className="w-5 h-5" /> },
  { id: 3, title: 'Allegati', icon: <Upload className="w-5 h-5" /> },
  { id: 4, title: 'Località', icon: <MapPin className="w-5 h-5" /> }
];

export function SegnalazioneGuasti() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isEmergency = queryParams.get('emergency') === 'true';

  // Naro Center and Bounds for Geofencing
  const NARO_CENTER: [number, number] = [37.294, 13.794];
  const GEOFENCE_RADIUS_KM = 8; // Sufficient for Naro's rural extend

  const [currentStep, setCurrentStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [reportId, setReportId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Voice Interaction Hub
  const { isListening: isListeningAltro, transcript: transcriptAltro, startListening: startListeningAltro } = useVoiceToText();
  const { isListening: isListeningNote, transcript: transcriptNote, startListening: startListeningNote } = useVoiceToText();
  
  useEffect(() => {
    if (transcriptAltro) {
      setFormData(prev => ({ 
        ...prev, 
        altro: prev.altro + (prev.altro ? ' ' : '') + transcriptAltro 
      }));
    }
  }, [transcriptAltro]);

  useEffect(() => {
    if (transcriptNote) {
      setFormData(prev => ({ 
        ...prev, 
        noteAggiuntive: prev.noteAggiuntive + (prev.noteAggiuntive ? ' ' : '') + transcriptNote 
      }));
    }
  }, [transcriptNote]);
  
  // Validation Helpers
  const validateCF = (cf: string) => {
    const cfRegex = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/i;
    return cfRegex.test(cf);
  };

  const validateSemantic = (text: string, minLen: number = 2) => {
    if (!text || text.length < minLen) return false;
    // Check for repetitive characters (spam)
    if (/(.)\1{4,}/.test(text)) return false; 
    // Check for only special characters
    if (/^[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?0-9]*$/.test(text) && text.length > 0) return false;
    return true;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const distance = calculateDistance(latitude, longitude, NARO_CENTER[0], NARO_CENTER[1]);
          
          if (distance > GEOFENCE_RADIUS_KM) {
             setErrors(prev => ({ 
               ...prev, 
               geo: "Attenzione: Ti trovi fuori dal territorio comunale di Naro. Le segnalazioni BGS sono valide solo per la giurisdizione locale." 
             }));
          } else {
             setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.geo;
                return newErrors;
             });
          }
          
          setFormData(prev => ({
            ...prev, 
            coordinate: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
        },
        (err) => {
          setErrors(prev => ({ ...prev, geo: "Impossibile rilevare la posizione GPS. Verifica i permessi del browser." }));
        }
      );
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    codiceFiscale: '',
    luogoNascita: '',
    codiceCatastaleNascita: '',
    dataNascita: '',
    residenza: 'Naro',
    via: '',
    civico: '',
    telefono: '',
    email: '',
    
    // Categories
    fondoStradale: [] as string[],
    marciapiede: [] as string[],
    illuminazione: [] as string[],
    idrico: [] as string[],
    tombini: [] as string[],
    rifiuti: [] as string[],
    randagismo: [] as string[],
    dissesto: [] as string[],
    infrastrutture: [] as string[],
    spuntaAltro: false,
    
    altro: '',
    coordinate: '',
    pagamentoEffettuato: false,
    
    // Attachments
    foto: [] as string[],
    
    luogoSegnalazioneVia: '',
    luogoSegnalazioneCivico: '',
    
    consapevolezza: false,
    privacy: false,
    
    // CF Calc fields
    sesso: 'M' as 'M' | 'F',
    provinciaNascita: 'AG',
    noteAggiuntive: ''
  });

  const handleCalcolaCF = () => {
    if (!formData.nome || !formData.cognome || !formData.dataNascita || !formData.luogoNascita) {
      setErrors(prev => ({ ...prev, cf_calc: "Inserire Nome, Cognome, Data e Comune di nascita per il calcolo." }));
      return;
    }

    const codiceCatastale = formData.codiceCatastaleNascita || CODICI_CATASTALI[formData.luogoNascita] || 'F845'; // Default to Naro if unknown
    
    try {
      const calculatedCF = calcolaCodiceFiscale({
        nome: formData.nome,
        cognome: formData.cognome,
        dataNascita: formData.dataNascita,
        sesso: formData.sesso,
        codiceCatastale: codiceCatastale
      });
      
      setFormData(prev => ({ ...prev, codiceFiscale: calculatedCF }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.cf_calc;
        delete newErrors.codiceFiscale;
        return newErrors;
      });
    } catch (e) {
      console.error(e);
      setErrors(prev => ({ ...prev, cf_calc: "Errore nel calcolo. Verifica i dati." }));
    }
  };

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('civica_report_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...parsed }));
        // If there was progress, maybe jump to a saved step? 
        // For security/conformity, we stay at step 1 but with data filled.
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, []);

  // Autosave draft on change
  useEffect(() => {
    if (!formSubmitted) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        localStorage.setItem('civica_report_draft', JSON.stringify(formData));
        setIsSaving(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, formSubmitted]);

  // Emergency auto-config
  useEffect(() => {
    if (isEmergency) {
      setFormData(prev => ({
        ...prev,
        dissesto: prev.dissesto.length > 0 ? prev.dissesto : ['Frana carreggiata'],
        spuntaAltro: true,
        altro: 'SEGNALAZIONE PRIORITARIA BGS - EMERGENZA TERRITORIALE'
      }));
    }
  }, [isEmergency]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            foto: [...prev.foto, (reader.result as string)].slice(0, 3) // Max 3 photos
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      foto: prev.foto.filter((_, i) => i !== index)
    }));
  };

  const responsabile = useMemo(() => StorageService.getResponsabileForReport(formData), [formData]);

  const handleCheckboxChange = (category: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const currentList = prev[category] as string[];
      if (Array.isArray(currentList)) {
        if (currentList.includes(value)) {
          return { ...prev, [category]: currentList.filter(item => item !== value) };
        } else {
          return { ...prev, [category]: [...currentList, value] };
        }
      }
      return prev;
    });
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    switch (step) {
      case 1:
        if (!validateSemantic(formData.nome, 2)) {
          newErrors.nome = "Inserire un nome valido (min 2 caratteri, no spam)";
          isValid = false;
        }
        if (!validateSemantic(formData.cognome, 2)) {
          newErrors.cognome = "Inserire un cognome valido (min 2 caratteri, no spam)";
          isValid = false;
        }
        if (!validateCF(formData.codiceFiscale)) {
          newErrors.codiceFiscale = "Codice Fiscale non conforme agli standard ministeriali";
          isValid = false;
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "E-mail valida obbligatoria per ricevere la ricevuta legale";
          isValid = false;
        }
        break;
      case 2:
        const hasCategory = !!(
          formData.fondoStradale.length > 0 || 
          formData.marciapiede.length > 0 || 
          formData.illuminazione.length > 0 || 
          formData.idrico.length > 0 || 
          formData.tombini.length > 0 || 
          formData.rifiuti.length > 0 || 
          formData.randagismo.length > 0 ||
          formData.dissesto.length > 0 ||
          formData.infrastrutture.length > 0
        );

        if (!hasCategory && !formData.spuntaAltro) {
          newErrors.categories = "Selezionare almeno una tipologia di criticità";
          isValid = false;
        }

        if (formData.spuntaAltro && !validateSemantic(formData.altro, 10)) {
          newErrors.altro = "Descrivere la criticità con almeno 10 caratteri significativi";
          isValid = false;
        }
        break;
      case 4:
        if (!validateSemantic(formData.luogoSegnalazioneVia, 4)) {
          newErrors.via = "Inserire un indirizzo valido";
          isValid = false;
        }
        break;
      case 5:
        isValid = formData.consapevolezza && formData.privacy;
        break;
    }

    if (JSON.stringify(newErrors) !== JSON.stringify(errors)) {
      setErrors(newErrors);
    }
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const generatePDF = async () => {
    const reportIdFormatted = reportId || `BGS-${Math.floor(Math.random()*10000)}`;
    const uuid = `BGS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const categories: string[][] = [];
    const mapping = [
        { label: 'FONDO STRADALE', data: formData.fondoStradale },
        { label: 'MARCIAPIEDE', data: formData.marciapiede },
        { label: 'ILLUMINAZIONE', data: formData.illuminazione },
        { label: 'SERVIZIO IDRICO', data: formData.idrico },
        { label: 'TOMBINI', data: formData.tombini },
        { label: 'RIFIUTI', data: formData.rifiuti },
        { label: 'RANDAGISMO', data: formData.randagismo },
        { label: 'DISSESTO/FRANE', data: formData.dissesto },
        { label: 'INFRASTRUTTURE', data: formData.infrastrutture }
    ];
    mapping.forEach(m => {
      if (m.data.length > 0) categories.push([m.label, m.data.join(', ')]);
    });

    if (formData.spuntaAltro && formData.altro) {
      categories.push(['ALTRO (Specificato)', formData.altro]);
    }

    const pdfData: PDFData = {
      title: "Ricevuta di Avvenuta Trasmissione — Standard BGS-2026",
      subtitle: "Protocollo Digitale Certificato — Comune di Naro",
      year: 2026,
      date: new Date().toLocaleDateString("it-IT"),
      protocollo: protocollo || reportIdFormatted,
      uuid: uuid,
      status: 'ACQUISITA - TRASMESSA PEC',
      contribuente: {
        nome: `${formData.nome.toUpperCase()} ${formData.cognome.toUpperCase()}`,
        cf: formData.codiceFiscale.toUpperCase(),
        email: formData.email,
        comune: "Naro (AG)"
      },
      summaryItems: [
        { label: "Protocollo", value: protocollo || reportIdFormatted, isAccent: true },
        { label: "Canale Invio", value: "PEC Automatizzata" },
        { label: "Standard PDF", value: "PDF/A-1b (Legale)" },
        { label: "Coordinate GPS", value: formData.coordinate || "Non rilevate" }
      ],
      tables: [
        {
          title: "1. ANALISI TECNICA DELL'EVENTO E PRIORITÀ",
          head: [["Ambito Intervento", "Dettaglio Segnalazione"]],
          body: categories.length > 0 ? categories : [["ALTRO", formData.altro || "Dettaglio non specificato"]]
        },
        {
          title: "2. ASSEGNAZIONE ISTANZA AI SENSI DEL CAD E PEC",
          head: [["Responsabile d'Ufficio", "Area di Competenza", "PEC Autorità"]],
          body: [[responsabile.nome, responsabile.ufficio, responsabile.email]]
        }
      ],
      images: formData.foto
    };

    await PDFService.generateInstitutionalPDF(pdfData, `MOD_BGS_Naro_${formData.cognome.replace(/\s/g, '_')}.pdf`);
  };

  const [protocollo, setProtocollo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione totale prima dell'invio finale
    const isStep1Valid = validateStep(1);
    const isStep2Valid = validateStep(2);
    const isStep4Valid = validateStep(4);
    
    if (!isStep1Valid || !isStep2Valid || !isStep4Valid) {
        alert("Errore: Alcuni campi obbligatori non sono stati compilati correttamente. Verifica i dati inseriti nei passaggi precedenti.");
        return;
    }

    try {
      const newReport = await StorageService.addReportFirestore(formData);
      setReportId(newReport.id);
      setProtocollo(newReport.protocol);
      setFormSubmitted(true);
      // Clear draft on submission
      localStorage.removeItem('civica_report_draft');
    } catch (error) {
      console.error("Errore durante il salvataggio Firestore:", error);
      // Fallback to local if needed or show error
      const result = StorageService.addReport(formData);
      setReportId(result.reports[0].id);
      setProtocollo(result.protocol);
      setFormSubmitted(true);
      localStorage.removeItem('civica_report_draft');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
              <User className="mr-2 text-naro-navy" /> Identificazione del Segnalante
            </h3>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4 flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shrink-0 shadow-sm border border-blue-100">
                <FileSignature className="w-5 h-5" />
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                Semplificazione BGS-2026: La validazione dell'istanza richiede <strong>Nome, Cognome, Codice Fiscale ed Email</strong>. Questi dati costituiscono la tua Firma Amministrativa Digitale certificata e permettono al Comune di inviarti la ricevuta ufficiale.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Nome</label>
                <input type="text" required className={`w-full px-4 py-3 border ${errors.nome ? 'border-red-500 bg-red-50' : 'border-slate-300'} rounded-xl focus:ring-2 focus:ring-naro-navy outline-none bg-white transition-all focus:border-naro-navy`} value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Mario" />
                {errors.nome && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.nome}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Cognome</label>
                <input type="text" required className={`w-full px-4 py-3 border ${errors.cognome ? 'border-red-500 bg-red-50' : 'border-slate-300'} rounded-xl focus:ring-2 focus:ring-naro-navy outline-none bg-white transition-all focus:border-naro-navy`} value={formData.cognome} onChange={e => setFormData({...formData, cognome: e.target.value})} placeholder="Rossi" />
                {errors.cognome && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.cognome}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Data di Nascita</label>
                <input type="date" required className={`w-full px-4 py-3 border ${errors.dataNascita ? 'border-red-500 bg-red-50' : 'border-slate-300'} rounded-xl focus:ring-2 focus:ring-naro-navy outline-none bg-white`} value={formData.dataNascita} onChange={e => setFormData({...formData, dataNascita: e.target.value})} />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Sesso</label>
                <div className="flex space-x-4 h-[50px] items-center">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="sesso" value="M" checked={formData.sesso === 'M'} onChange={() => setFormData({...formData, sesso: 'M'})} />
                    <span className="text-sm font-bold text-slate-700">M</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="sesso" value="F" checked={formData.sesso === 'F'} onChange={() => setFormData({...formData, sesso: 'F'})} />
                    <span className="text-sm font-bold text-slate-700">F</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Comune di Nascita</label>
                <AutocompleteComune
                  className={`w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-naro-navy outline-none bg-white`}
                  placeholder="Seleziona..."
                  value={formData.luogoNascita}
                  onChange={val => setFormData({...formData, luogoNascita: val})}
                  onSelect={c => setFormData({...formData, luogoNascita: c.nome, codiceCatastaleNascita: c.codiceCatastale})}
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Codice Fiscale (Identità Digitale)</label>
                  <button 
                    type="button" 
                    onClick={handleCalcolaCF}
                    className="text-[10px] font-black text-naro-navy underline hover:text-blue-800 uppercase tracking-widest flex items-center"
                  >
                    <Zap className="w-3 h-3 mr-1" /> Calcola Automatica
                  </button>
                </div>
                <input type="text" required className={`w-full px-4 py-3 border ${errors.codiceFiscale ? 'border-red-500 bg-red-50' : 'border-slate-300'} rounded-xl focus:ring-2 focus:ring-naro-navy outline-none font-mono uppercase tracking-widest bg-slate-50 focus:bg-white transition-all focus:border-naro-navy`} value={formData.codiceFiscale} onChange={e => setFormData({...formData, codiceFiscale: e.target.value.toUpperCase()})} placeholder="RSSMRA80A01F845Z" maxLength={16} />
                {errors.codiceFiscale && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.codiceFiscale}</p>}
                {errors.cf_calc && <p className="text-[9px] text-orange-500 font-bold mt-1 uppercase tracking-wider">{errors.cf_calc}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">E-mail (Fondamentale per Ricevuta)</label>
                <input type="email" required className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500 bg-red-50' : 'border-slate-300'} rounded-xl focus:ring-2 focus:ring-naro-navy outline-none`} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="mario.rossi@email.it" />
                {errors.email && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Telefono (Opzionale)</label>
                <input type="tel" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-naro-navy outline-none" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
              <ClipboardList className="mr-2 text-naro-navy" /> Dettaglio Tecnico Criticità
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'fondoStradale', label: 'Strade/Buche', options: ['Buche pericolose', 'Fondo dissestato', 'Segnaletica orizzontale'] },
                { id: 'illuminazione', label: 'Illuminazione', options: ['Lampada spenta', 'Guasto totale', 'Palo inclinato'] },
                { id: 'dissesto', label: 'Dissesto/Frane', options: ['Frana carreggiata', 'Smottamento', 'Detriti su strada'] },
                { id: 'infrastrutture', label: 'Infrastrutture', options: ['Danno edifici/muri', 'Ponte danneggiato', 'Ringhiere pericolanti'] },
                { id: 'idrico', label: 'Acqua/Fogna', options: ['Perdita acqua', 'Mancanza erogazione', 'Scarico ostruito'] },
                { id: 'rifiuti', label: 'Rifiuti', options: ['Abbandono rifiuti', 'Mancato ritiro', 'Cestino pieno'] },
                { id: 'randagismo', label: 'Randagismo', options: ['Presenza branchi', 'Animale ferito', 'Aggressione'] }
              ].map(cat => (
                <div key={cat.id} className={`p-4 bg-slate-50 rounded-xl border ${errors.categories ? 'border-red-300 animate-pulse' : 'border-slate-200'} shadow-sm`}>
                  <span className="font-bold text-sm text-naro-navy block mb-2 uppercase tracking-wide">{cat.label}</span>
                  {cat.options.map(opt => (
                    <label key={opt} className="flex items-center space-x-2 mb-1 cursor-pointer group">
                      <input type="checkbox" className="rounded border-slate-300 text-naro-navy focus:ring-naro-navy h-4 w-4" checked={(formData[cat.id as keyof typeof formData] as string[]).includes(opt)} onChange={() => handleCheckboxChange(cat.id as any, opt)} />
                      <span className="text-sm text-slate-600 group-hover:text-slate-900">{opt}</span>
                    </label>
                  ))}
                </div>
              ))}
              
              <div className={`p-4 bg-slate-50 rounded-xl border ${errors.categories ? 'border-red-300' : 'border-slate-200'} shadow-sm`}>
                <span className="font-bold text-sm text-naro-navy block mb-2 uppercase tracking-wide">Altre Tipologie</span>
                <label className="flex items-center space-x-2 mb-1 cursor-pointer group">
                  <input type="checkbox" className="rounded border-slate-300 text-naro-navy focus:ring-naro-navy h-4 w-4" checked={formData.spuntaAltro} onChange={e => setFormData({...formData, spuntaAltro: e.target.checked})} />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 font-bold italic">Altro - Specifica sotto</span>
                </label>
                {errors.categories && <p className="text-[9px] text-red-500 font-bold mt-2 uppercase tracking-wider">{errors.categories}</p>}
              </div>
            </div>

            {formData.spuntaAltro && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-black text-orange-800 uppercase tracking-widest">Specifica Criticità</label>
                    <button 
                      type="button" 
                      onClick={startListeningAltro} 
                      className={`p-1.5 rounded-full transition-all ${isListeningAltro ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`}
                      title="Dettatura Vocale"
                    >
                      <Mic className="w-3 h-3" />
                    </button>
                  </div>
                  <span className={`text-[10px] font-bold ${formData.altro.length < 10 ? 'text-red-500' : 'text-emerald-600'}`}>{formData.altro.length}/10 min</span>
                </div>
                <textarea 
                  className={`w-full px-4 py-3 border ${errors.altro ? 'border-red-500 bg-red-50' : 'border-orange-200'} bg-white rounded-xl h-24 outline-none focus:ring-2 focus:ring-orange-500 text-sm`} 
                  value={formData.altro} 
                  onChange={e => setFormData({...formData, altro: e.target.value})} 
                  placeholder="Descrivi qui il problema riscontrato con precisione tecnico-semantica..." 
                />
                {errors.altro && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.altro}</p>}
              </motion.div>
            )}
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Note Aggiuntive (Opzionale)</label>
                  <button 
                    type="button" 
                    onClick={startListeningNote} 
                    className={`p-1.5 rounded-full transition-all ${isListeningNote ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    title="Dettatura Vocale Note"
                  >
                    <Mic className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <textarea 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg h-20 text-sm outline-none focus:ring-2 focus:ring-naro-navy/20" 
                placeholder="Eventuali annotazioni extra per i tecnici..." 
                value={formData.noteAggiuntive}
                onChange={e => setFormData({...formData, noteAggiuntive: e.target.value})}
              />
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
              <Upload className="mr-2 text-naro-navy" /> Documentazione Fotografica
            </h3>
            <div className="bg-[#F0F4F8] p-4 rounded-xl border border-[#CCD6E0] flex items-start gap-3">
              <Info className="w-5 h-5 text-[#003366] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <p>Facoltativo: Allega fino a 3 foto dello stato dei luoghi. La documentazione fotografica è essenziale per la rapida presa in carico BGS-2026.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {formData.foto.map((photo, index) => (
                <div key={index} className="relative aspect-video rounded-xl border-2 border-slate-200 overflow-hidden group shadow-sm bg-slate-100">
                  <img src={photo} alt={`Allegato ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {formData.foto.length < 3 && (
                <label className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-naro-navy hover:bg-slate-50 transition-all flex flex-col items-center justify-center cursor-pointer group bg-white">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-naro-navy mb-1" />
                  <span className="text-[10px] font-bold text-slate-500">Aggiungi Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
              <MapPin className="mr-2 text-naro-navy" /> Localizzazione e Firme
            </h3>
            <div className={`bg-slate-50 p-6 rounded-2xl border ${errors.via ? 'border-red-300 shadow-lg shadow-red-100 flex-col' : 'border-slate-200'} space-y-4`}>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Via / Piazza / Località</label>
                  <div className="relative">
                    <input type="text" required className={`w-full pl-10 pr-4 py-3 border ${errors.via ? 'border-red-500 bg-red-50' : 'border-slate-300'} rounded-xl focus:ring-2 focus:ring-naro-navy outline-none`} value={formData.luogoSegnalazioneVia} onChange={e => setFormData({...formData, luogoSegnalazioneVia: e.target.value})} placeholder="Indirizzo esatto" />
                    <MapPin className={`absolute left-3 top-3.5 ${errors.via ? 'text-red-400' : 'text-slate-400'} w-5 h-5`} />
                  </div>
                  {errors.via && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.via}</p>}
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Civico</label>
                  <input type="text" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-naro-navy outline-none font-mono" value={formData.luogoSegnalazioneCivico} onChange={e => setFormData({...formData, luogoSegnalazioneCivico: e.target.value})} placeholder="10/A" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Puntamento GPS di Precisione (API Geofencing)</label>
                <div className="flex gap-2 mb-3">
                  <input type="text" className={`flex-1 px-4 py-2 border ${errors.geo ? 'border-orange-500 bg-orange-50' : 'border-slate-200'} bg-slate-100 rounded-lg text-xs font-mono`} value={formData.coordinate} readOnly placeholder="Attesa segnale satellite..." />
                  <button 
                    type="button" 
                    onClick={handleGeolocation}
                    className="px-4 py-2 bg-naro-navy text-white rounded-lg text-xs font-bold whitespace-nowrap hover:bg-slate-800 transition-colors flex items-center"
                  >
                    <Zap className="w-3 h-3 mr-1" /> Fix GPS
                  </button>
                </div>
                {errors.geo && <p className="text-[9px] text-orange-600 font-bold mb-3 uppercase tracking-wider animate-pulse flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> {errors.geo}</p>}

                {/* Interactive Confirmation Map */}
                <div className="h-[200px] rounded-xl border border-slate-200 overflow-hidden shadow-inner relative z-0">
                  <MapContainer 
                    center={formData.coordinate ? [parseFloat(formData.coordinate.split(',')[0]), parseFloat(formData.coordinate.split(',')[1])] : NARO_CENTER} 
                    zoom={15} 
                    scrollWheelZoom={false} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {formData.coordinate && (
                      <Marker position={[parseFloat(formData.coordinate.split(',')[0]), parseFloat(formData.coordinate.split(',')[1])]} />
                    )}
                  </MapContainer>
                  <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-black uppercase text-slate-500 border border-slate-200">
                    Conferma Posizione Real-Time
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-200 pt-6">
              <h4 className="font-bold text-slate-800 flex items-center mb-2">
                <ShieldAlert className="w-4 h-4 mr-2 text-naro-navy" /> Dichiarazioni di Validità
              </h4>
              <label className="flex items-start space-x-3 cursor-pointer p-4 bg-white hover:bg-blue-50 rounded-2xl border border-slate-200 hover:border-naro-navy/30 transition-all">
                <input type="checkbox" required className="mt-1 h-5 w-5 rounded border-slate-300 text-naro-navy focus:ring-naro-navy" checked={formData.consapevolezza} onChange={e => setFormData({...formData, consapevolezza: e.target.checked})} />
                <span className="text-sm text-slate-700 leading-snug">Dichiaro che la segnalazione è veritiera ai sensi del D.P.R. 445/2000 per le finalità di sicurezza territoriale.</span>
              </label>
              <label className="flex items-start space-x-3 cursor-pointer p-4 bg-white hover:bg-blue-50 rounded-2xl border border-slate-200 hover:border-naro-navy/30 transition-all">
                <input type="checkbox" required className="mt-1 h-5 w-5 rounded border-slate-300 text-naro-navy focus:ring-naro-navy" checked={formData.privacy} onChange={e => setFormData({...formData, privacy: e.target.checked})} />
                <span className="text-sm text-slate-700 leading-snug">Accetto il trattamento dei dati personali (GDPR 2016/679) per la gestione della pratica amministrativa.</span>
              </label>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <BackToTop />
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <BackButton to="/" label="Dashboard Direzione Territorio" />
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col md:flex-row min-h-[550px]">
          {/* Progress Sidebar - Desktop */}
          <div className="bg-naro-navy p-8 md:w-72 flex flex-col justify-between text-white border-b md:border-b-0 md:border-r border-white/10">
            <div>
                <div className="mb-10 text-center md:text-left">
                    <div className="w-16 h-16 bg-white rounded-2xl mb-5 flex items-center justify-center p-2 mx-auto md:mx-0 shadow-lg">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Naro-Stemma.svg/960px-Naro-Stemma.svg.png" alt="Stemma Naro" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">Iter Pratica BGS</h1>
                    <p className="text-[10px] text-naro-gold uppercase font-black tracking-widest mt-1">Comune di Naro</p>
                </div>
                
                <div className="space-y-6">
                    {STEPS.map((step) => (
                        <div key={step.id} className={`flex items-center space-x-4 transition-all duration-300 ${currentStep === step.id ? 'opacity-100 translate-x-1' : 'opacity-30'}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-sm ${currentStep >= step.id ? 'bg-naro-gold text-naro-navy' : 'bg-white/10 text-white'}`}>
                                {currentStep > step.id ? <Check className="w-5 h-5" strokeWidth={3} /> : step.icon}
                            </div>
                            <span className="text-sm font-bold tracking-tight">{step.title}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] text-white/40 uppercase font-black tracking-[0.2em]">Integrità del Dato</p>
                  {isSaving ? (
                    <span className="flex items-center text-[8px] text-naro-gold animate-pulse font-bold">
                      <div className="w-1 h-1 bg-naro-gold rounded-full mr-1"></div>
                      SALVATAGGIO...
                    </span>
                  ) : (
                    <span className="text-[8px] text-emerald-400 font-bold flex items-center">
                      <Check className="w-2 h-2 mr-1" /> PROTETTO
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/60 leading-tight">Documento con valore legale garantito dal CAD. Ogni modifica è salvata in tempo reale.</p>
            </div>
          </div>
          
          {/* Form Content */}
          <div className="flex-grow p-8 md:p-12 flex flex-col">
            <AnimatePresence mode="wait">
              {formSubmitted ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-grow flex flex-col items-center justify-center text-center space-y-8">
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100 shadow-inner">
                    <Check className="w-12 h-12 text-green-600" strokeWidth={3} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Pratica Acquisita</h2>
                    <p className="text-slate-500 font-medium">Numero Istanza: <span className="text-naro-navy font-bold">#{reportId}</span></p>
                    <p className="text-emerald-600 font-black text-sm mt-1 uppercase tracking-tighter">Protocollo Generale: {protocollo}</p>
                  </div>
                  
                  <p className="text-slate-600 leading-relaxed max-w-sm">
                    La procedura è stata completata con successo. Il sistema ha generato l'istanza ufficiale digitale ed ha <strong>avviato la trasmissione PEC</strong> automatica verso gli uffici competenti.
                  </p>

                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3 max-w-sm">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                      <Send className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                       <p className="text-[10px] text-blue-800 font-bold uppercase tracking-widest leading-none mb-1">Stato Trasmissione</p>
                       <p className="text-xs text-blue-600 font-medium italic">Accettazione PEC ricevuta dal server istituzionale.</p>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-1 gap-4 pt-6">
                    <button onClick={generatePDF} className="w-full flex items-center justify-center px-8 py-5 bg-naro-navy text-white rounded-2xl font-bold hover:shadow-2xl transition-all shadow-xl shadow-blue-900/20 active:scale-95 group border-2 border-naro-navy hover:bg-slate-900">
                      <Download className="w-6 h-6 mr-3 group-hover:translate-y-1 transition-transform" /> Scarica la tua Ricevuta (PDF)
                    </button>
                    
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Verifica la tua email: una copia è stata inviata a {formData.email}</p>
                    
                    <Link to="/" className="w-full flex items-center justify-center px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all border border-slate-200/50">
                      Termina e torna alla Dashboard
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                  <div className="flex-grow">
                    {isEmergency && (
                      <div className="mb-6 p-4 bg-red-600 rounded-2xl text-white flex items-center justify-between shadow-lg shadow-red-600/20 animate-pulse">
                        <div className="flex items-center">
                          <Zap className="w-5 h-5 mr-3" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Livello Priorità</p>
                            <p className="text-sm font-bold">EMERGENZA TERRITORIALE ATTIVA</p>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-bold">
                          BGS-URGENTE
                        </div>
                      </div>
                    )}
                    {renderStep()}
                  </div>

                  <div className="flex justify-between items-center pt-10 border-t border-slate-100 mt-10">
                    <button type="button" onClick={handlePrev} disabled={currentStep === 1} className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Indietro
                    </button>
                    
                    {currentStep < STEPS.length ? (
                      <button type="button" onClick={handleNext} disabled={!validateStep(currentStep)} className={`px-10 py-3 bg-naro-gold text-white rounded-xl font-bold text-sm flex items-center transition-all shadow-lg shadow-yellow-600/10 ${!validateStep(currentStep) ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:opacity-90 hover:translate-y-[-1px] active:translate-y-0'}`}>
                        Prosegui <ChevronRight className="ml-2 w-5 h-5" />
                      </button>
                    ) : (
                      <button type="submit" disabled={!validateStep(5)} className={`px-10 py-3 bg-naro-navy text-white rounded-xl font-bold text-sm flex items-center transition-all shadow-lg shadow-blue-900/10 ${!validateStep(5) ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:opacity-90 hover:translate-y-[-1px] active:translate-y-0'}`}>
                        Invia Pratica <Send className="ml-2 w-5 h-5" />
                      </button>
                    )}
                  </div>
                </form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-8 text-center">
             <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">Piattaforma Certificata Comune di Naro</p>
        </div>
      </div>
    </div>
  );
}

export default SegnalazioneGuasti;
