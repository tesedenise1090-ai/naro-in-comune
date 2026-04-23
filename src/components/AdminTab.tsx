import React, { useState, useMemo, useEffect } from 'react';
import { Settings, FileCheck, Download, Users, Plus, Edit3, Trash2, Zap, X, Building2, ShieldAlert, Map, Filter, Activity } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';

import { StorageService } from '../services/storage';
import { GeminiService } from '../services/gemini';
import { PDFService } from '../services/pdfService';
import BackToTop from './BackToTop';
import BackButton from './BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface AdminTabProps {
  news: any[];
  petitions: any[];
  categories: any[];
  reports: any[];
  onRefresh: () => void;
}

export function AdminTab({ news, petitions, categories, reports, onRefresh }: AdminTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'news' | 'gis' | 'practicies' | 'settings' | 'audit'>('practicies');
  const [showAddNews, setShowAddNews] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  const [newNews, setNewNews] = useState({ 
    id: 0, titolo: '', categoria: categories[0]?.nome || '', descrizione_breve: '', descrizione_lunga: '', immagine_url: '', evidenza: true, views: 0, likes: 0, comments: [] as any[]
  });
  const [isGenerating, setIsGenerating] = useState(false);
  
  // News Filters
  const [newsSearch, setNewsSearch] = useState('');
  const [newsFilter, setNewsFilter] = useState('all');
  const [newsCategoryFilter, setNewsCategoryFilter] = useState('all');

  // Petitions & Categories State
  const [petitionStatusFilter, setPetitionStatusFilter] = useState('all');
  const [showPetitionModal, setShowPetitionModal] = useState(false);
  const [editingPetition, setEditingPetition] = useState<any>(null);
  const [petitionForm, setPetitionForm] = useState({
    titolo: '', descrizione: '', ente_id: '', quorum: 500, categoria: categories[0]?.nome || '', immagine_url: '', lat: 37.294, lng: 13.794, stato: 'aperta', firme: 0
  });

  const [newCategory, setNewCategory] = useState({ nome: '', immagine_url: '', descrizione: '' });
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const [entities, setEntities] = useState<any[]>(StorageService.getEntities());
  const [newEntity, setNewEntity] = useState({ nome: '', email: '', tipo: '' });
  const [editingEntity, setEditingEntity] = useState<any>(null);

  // Advanced GIS Dashboard State
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const handleUpdateStatus = (reportId: string, status: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      StorageService.updateReportStatus(reportId, status, adminNote);
      onRefresh();
      setIsProcessing(false);
      setAdminNote('');
      if (selectedReport?.id === reportId) {
        const updated = StorageService.getReports().find((r: any) => r.id === reportId);
        setSelectedReport(updated);
      }
    }, 800);
  };

  const stats = {
    open: reports.filter(r => (r.stato || r.status) === 'ricevuta').length,
    processing: reports.filter(r => (r.stato || r.status) === 'in_lavorazione' || (r.stato || r.status) === 'presa_in_carico' || (r.stato || r.status) === 'in_revisione').length,
    closed: reports.filter(r => (r.stato || r.status) === 'chiusa' || (r.stato || r.status) === 'risolto').length,
    petitions: petitions.length
  };

  // Handlers

  const handleExportReport = async (report: any) => {
    if (!report) return;
    
    // Convert status for PDF
    const statusMap: Record<string, string> = {
      'ricevuta': 'RICEVUTA',
      'in_revisione': 'IN REVISIONE',
      'presa_in_carico': 'PRESA IN CARICO',
      'in_lavorazione': 'IN LAVORAZIONE',
      'chiusa': 'CHIUSA / RISOLTA',
      'risolto': 'CHIUSA / RISOLTA'
    };

    const pdfData: any = {
      title: "Fascicolo Elettronico di Criticità",
      subtitle: "Documentazione Amministrativa - Audit AgID",
      year: new Date(report.date || report.data).getFullYear(),
      date: new Date(report.date || report.data).toLocaleDateString("it-IT"),
      protocollo: report.id,
      uuid: report.uuid || `BGS-${report.id.split('-')[1] || report.id}`,
      status: statusMap[report.status || report.stato] || 'RICEVUTA',
      contribuente: {
        nome: report.nome,
        cf: report.codiceFiscale || "NON SPECIFICATO",
        comune: "Naro (AG)"
      },
      summaryItems: [
        { label: "Priorità", value: (report.priorita || "media").toUpperCase(), isAccent: true },
        { label: "Ufficio", value: report.responsabileUfficio || report.responsabile || "Tecnico" },
        { label: "ID Pratica", value: report.id }
      ],
      tables: [
        {
          title: "Dettagli dell'Intervento",
          head: [["Campo", "Valore"]],
          body: [
            ["Tipologia", report.tipoGuasto || "Generale"],
            ["Ubicazione", report.ubicazione || "Vedi mappa"],
            ["Descrizione", report.descrizione || report.altro || "Nessuna descrizione"]
          ]
        }
      ],
      images: report.foto || []
    };

    await PDFService.generateInstitutionalPDF(pdfData, `FASCICOLO_${report.id}.pdf`);
  };

  const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNewsId) {
      StorageService.updateNews({ ...newNews, id: editingNewsId });
    } else {
      StorageService.addNews(newNews);
    }
    setShowAddNews(false);
    setEditingNewsId(null);
    onRefresh();
  };

  const handleEditNews = (newsItem: any) => {
    setEditingNewsId(newsItem.id);
    setNewNews({ ...newsItem });
    setShowAddNews(true);
  };

  const handleDeleteNews = (id: number) => {
    if (confirm('Eliminare questa notizia?')) {
      StorageService.deleteNews(id);
      onRefresh();
    }
  };

  const handleGenerateContent = async () => {
    if (!newNews.titolo) return alert('Inserisci un titolo per generare il contenuto');
    setIsGenerating(true);
    try {
      const result = await GeminiService.generateNewsContent(newNews.titolo);
      // Ensure result is parsed if it returns a string with special markers or just use as is
      // Assuming generateNewsContent returns the structured object but for safety:
      const content = typeof result === 'string' ? JSON.parse(result) : result;
      
      setNewNews(prev => ({ 
        ...prev, 
        descrizione_breve: content.breve || content.descrizione_breve, 
        descrizione_lunga: content.lunga || content.descrizione_lunga,
        immagine_url: content.immagine || content.immagine_url || prev.immagine_url
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommentAction = (newsId: number, commentId: string, action: 'approve' | 'reject' | 'delete') => {
    StorageService.moderateComment(newsId, commentId, action);
    onRefresh();
    if (editingNewsId === newsId) {
      const updatedNews = StorageService.getNews().find(n => n.id === newsId);
      if (updatedNews) setNewNews(updatedNews);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      StorageService.updateCategory({ ...editingCategory, ...newCategory });
      setEditingCategory(null);
    } else {
      StorageService.addCategory(newCategory);
    }
    setNewCategory({ nome: '', immagine_url: '', descrizione: '' });
    onRefresh();
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setNewCategory({ nome: cat.nome, immagine_url: cat.immagine_url, descrizione: cat.descrizione });
  };

  const handleAddEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntity) {
      StorageService.updateEntity({ ...editingEntity, ...newEntity });
      setEditingEntity(null);
    } else {
      StorageService.addEntity(newEntity);
    }
    setEntities(StorageService.getEntities());
    setNewEntity({ nome: '', email: '', tipo: '' });
  };

  const handleSavePetition = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPetition) {
      StorageService.updatePetition({ ...editingPetition, ...petitionForm });
    } else {
      StorageService.addPetition(petitionForm);
    }
    setShowPetitionModal(false);
    onRefresh();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: any, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter((prev: any) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredNews = news.filter(n => {
    const matchesSearch = n.titolo.toLowerCase().includes(newsSearch.toLowerCase());
    const matchesFilter = newsFilter === 'all' ? true : newsFilter === 'evidenza' ? n.evidenza : !n.evidenza;
    const matchesCategory = newsCategoryFilter === 'all' ? true : n.categoria === newsCategoryFilter;
    return matchesSearch && matchesFilter && matchesCategory;
  });

  // Heatmap helper component
  const HeatmapLayer = ({ points }: { points: [number, number, number][] }) => {
    const map = useMap();
    useEffect(() => {
        if (!map || points.length === 0) return;
        // @ts-ignore
        const heat = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red' }
        }).addTo(map);
        return () => { map.removeLayer(heat); };
    }, [map, points]);
    return null;
  };

  const renderPracticies = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Nuove Istanze', count: String(stats.open), color: 'border-blue-500 bg-blue-50 text-blue-700' },
          { label: 'In Gestione', count: String(stats.processing), color: 'border-amber-500 bg-amber-50 text-amber-700' },
          { label: 'Concluse', count: String(stats.closed), color: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
          { label: 'Indice Evasione', count: '92%', color: 'border-slate-800 bg-slate-900 text-white' }
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border-l-4 shadow-sm ${s.color}`}>
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">{s.label}</p>
            <p className="text-2xl font-black">{s.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <FileCheck className="w-5 h-5 mr-2 text-naro-navy" /> Gestione Amministrativa Pratiche
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                <th className="px-6 py-4">ID Pratica</th>
                <th className="px-6 py-4">Soggetto / Data</th>
                <th className="px-6 py-4">Tipologia</th>
                <th className="px-6 py-4 text-center">Priorità</th>
                <th className="px-6 py-4">Stato Attuale</th>
                <th className="px-6 py-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer group" onClick={() => setSelectedReport(report)}>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400 group-hover:text-naro-navy">#{report.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{report.nome}</p>
                    <p className="text-[10px] text-slate-500">{new Date(report.data || report.date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{report.tipoGuasto || 'Generale'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${
                      report.priorita === 'alta' ? 'bg-red-100 text-red-600' :
                      report.priorita === 'media' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {report.priorita || 'bassa'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        (report.stato || report.status) === 'ricevuta' ? 'bg-slate-400' :
                        (report.stato || report.status) === 'in_revisione' ? 'bg-yellow-500' :
                        (report.stato || report.status) === 'presa_in_carico' ? 'bg-blue-500' :
                        (report.stato || report.status) === 'in_lavorazione' ? 'bg-orange-500' : 'bg-emerald-500'
                      }`} />
                      <span className="text-[10px] font-bold uppercase text-slate-600">
                        {(report.stato || report.status || '').replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
                      className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-naro-navy transition-all shadow-sm">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="bg-naro-navy text-white pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="px-2 py-1 bg-naro-gold text-naro-navy text-[10px] font-black rounded uppercase tracking-tighter shadow-lg shadow-black/20">Dashboard Strategica v3.0</div>
                <div className="text-[10px] text-white/50 font-bold uppercase tracking-widest flex items-center">
                  <Zap className="w-3 h-3 mr-1 text-naro-gold" /> Audit PA Attivo
                </div>
              </div>
              <h1 className="text-4xl font-black tracking-tight leading-none mb-1">
                Direzione Digitale <span className="text-naro-gold">Territorio</span>
              </h1>
              <p className="text-white/60 font-medium">Portale di monitoraggio e governance del Comune di Naro</p>
            </div>
            
            <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/10">
              {[
                { id: 'practicies', label: 'Gestione Pratiche', icon: <FileCheck className="w-4 h-4" /> },
                { id: 'gis', label: 'Dashboard GIS', icon: <Building2 className="w-4 h-4" /> },
                { id: 'news', label: 'Hub News & IA', icon: <Edit3 className="w-4 h-4" /> },
                { id: 'audit', label: 'Audit Log', icon: <Activity className="w-4 h-4" /> },
                { id: 'settings', label: 'Configurazione', icon: <Settings className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeSubTab === tab.id ? 'bg-white text-naro-navy shadow-xl' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M0,50 Q25,0 50,50 T100,50" fill="none" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeSubTab === 'practicies' && renderPracticies()}
            
            {activeSubTab === 'audit' && (
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-200">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center uppercase tracking-tight">
                      <Activity className="w-6 h-6 mr-3 text-naro-navy" /> Registro Audit Trail
                    </h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Tracciabilità millimetrica delle attività istituzionali</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => onRefresh()} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                        <Zap className="w-5 h-5" />
                     </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Soggetto</th>
                        <th className="px-6 py-4">Azione</th>
                        <th className="px-6 py-4">Entità</th>
                        <th className="px-6 py-4">ID Entità</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {StorageService.getAuditLogs().map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-[10px] font-mono text-slate-500">
                            {format(new Date(log.timestamp), 'dd/MM HH:mm:ss.SSS')}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-700">{log.userId}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-[6px] text-white text-[9px] font-black uppercase tracking-tighter ${
                              log.action === 'CREATE' ? 'bg-emerald-500' :
                              log.action === 'UPDATE' ? 'bg-blue-500' :
                              log.action === 'DELETE' ? 'bg-red-500' :
                              log.action === 'SIGN' ? 'bg-purple-500' : 'bg-slate-400'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {log.entityType}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">
                            #{log.entityId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeSubTab === 'gis' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Controls Card */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl">
                      <h3 className="font-black text-slate-800 flex items-center mb-4 uppercase text-xs tracking-widest">
                        <Filter className="w-4 h-4 mr-2 text-naro-navy" /> Strategia Prevenzione
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-wider">Layer Rischio</label>
                          <select className="w-full text-sm border-slate-200 rounded-xl focus:ring-naro-navy bg-slate-50">
                            <option>Tutte le Criticità</option>
                            <option>Dissesto Idrogeologico</option>
                            <option>Infrastrutture Critiche</option>
                          </select>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <p className="text-[10px] font-bold text-emerald-800 uppercase mb-1 flex items-center tracking-wider">
                            <Activity className="w-3 h-3 mr-1" /> Analisi Predittiva
                          </p>
                          <p className="text-xs text-emerald-600 leading-tight">Densità segnalazioni in aumento nell'area Nord-Est. Intervento preventivo suggerito.</p>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs mb-2">
                             <span className="text-slate-500 font-medium tracking-tight">Capacità Evasione</span>
                             <span className="font-black text-naro-navy">88%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="bg-naro-navy h-full w-[88%]"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-naro-navy p-6 rounded-[2rem] text-white shadow-xl">
                       <p className="text-[10px] font-black uppercase text-naro-gold tracking-widest mb-1">Decision Support</p>
                       <h4 className="font-bold text-sm mb-3">Governance Geospaziale</h4>
                       <p className="text-[10px] text-white/60 leading-relaxed mb-4 italic">
                         "La mappatura dinamica trasmette valore legale all'attivazione della Protezione Civile."
                       </p>
                       <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-[10px] font-bold uppercase transition-all">
                         Scarica Report GIS
                       </button>
                    </div>
                  </div>

                  {/* Map Card */}
                  <div className="lg:col-span-3 bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden h-[600px] relative">
                    <MapContainer center={[37.294, 13.794]} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      {/* Heatmap Layer */}
                      <HeatmapLayer 
                        points={reports
                          .filter(r => r.coordinate)
                          .map(r => {
                            const [lat, lng] = r.coordinate.split(',').map(Number);
                            return [lat, lng, 1]; // Intensity 1
                          })
                        }
                      />

                      {/* Individual Markers for Critical Points */}
                      {reports.filter(r => r.priorita === 'alta' && r.coordinate).map(r => {
                         const [lat, lng] = r.coordinate.split(',').map(Number);
                         return (
                           <Marker key={r.id} position={[lat, lng]} icon={L.divIcon({
                             className: 'custom-div-icon',
                             html: `<div class="w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow-lg animate-pulse"></div>`,
                             iconSize: [24, 24]
                           })}>
                             <Popup className="custom-popup">
                               <div className="p-1">
                                 <p className="text-[10px] font-black uppercase text-red-600 tracking-wider mb-1">Priorità Alta</p>
                                 <p className="font-bold text-slate-800 text-sm mb-1">{r.tipoGuasto || 'Criticità Territoriale'}</p>
                                 <p className="text-[10px] text-slate-500 line-clamp-2 italic">"{r.descrizione || r.altro}"</p>
                               </div>
                             </Popup>
                           </Marker>
                         );
                      })}
                    </MapContainer>
                    
                    {/* Legend Overlay */}
                    <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl max-w-[180px]">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Legenda Rischio</p>
                       <div className="space-y-2">
                         <div className="flex items-center text-[10px] font-bold text-slate-700">
                           <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                           Emergenza Attiva
                         </div>
                         <div className="flex items-center text-[10px] font-bold text-slate-700">
                           <div className="w-3 h-3 bg-orange-400 rounded-full mr-2 opacity-60"></div>
                           Densità Medio-Alta
                         </div>
                         <div className="flex items-center text-[10px] font-bold text-slate-700">
                           <div className="w-3 h-3 bg-cyan-400 rounded-full mr-2 opacity-40"></div>
                           Bacino Monitorato
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'news' && (
               <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-200">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center uppercase tracking-tight">
                      <Edit3 className="w-6 h-6 mr-3 text-naro-gold" /> Digital Content & AI Hub
                    </h2>
                    <button onClick={() => { setShowAddNews(true); setEditingNewsId(null); setNewNews({ id: 0, titolo: '', categoria: categories[0]?.nome || '', descrizione_breve: '', descrizione_lunga: '', immagine_url: '', evidenza: true, views: 0, likes: 0, comments: [] }); }} className="px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 flex items-center hover:scale-105 transition-transform">
                      <Plus className="w-5 h-5 mr-2" /> Pubblica Notizia
                    </button>
                  </div>
                  
                  {showAddNews && (
                    <div className="mb-12 p-8 bg-slate-50 rounded-[2rem] border border-slate-200">
                      <h4 className="font-bold text-slate-800 mb-6">{editingNewsId ? 'Redazione Notizia Eesistente' : 'Predisposizione Nuovo Comunicato'}</h4>
                      <form onSubmit={handleAddNews} className="space-y-4">
                        <div className="flex gap-4">
                          <input required placeholder="Titolo Comunicato Istituzionale" className="flex-1 px-4 py-3 rounded-xl border-slate-200" value={newNews.titolo} onChange={e => setNewNews({...newNews, titolo: e.target.value})} />
                          <button type="button" onClick={handleGenerateContent} disabled={isGenerating} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center shadow-lg shadow-purple-200">
                            {isGenerating ? 'IA in elaborazione...' : <><Zap className="w-5 h-5 mr-2" /> Genera con AI</>}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <select className="px-4 py-3 rounded-xl border-slate-200" value={newNews.categoria} onChange={e => setNewNews({...newNews, categoria: e.target.value})}>
                            {categories.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                          </select>
                          <input placeholder="URL Immagine Istituzionale" className="px-4 py-3 rounded-xl border-slate-200" value={newNews.immagine_url} onChange={e => setNewNews({...newNews, immagine_url: e.target.value})} />
                        </div>
                        <textarea placeholder="Abstract / Occhiello della notizia" className="w-full px-4 py-3 rounded-xl border-slate-200" rows={2} value={newNews.descrizione_breve} onChange={e => setNewNews({...newNews, descrizione_breve: e.target.value})} />
                        <textarea placeholder="Testo integrale del comunicato..." className="w-full px-4 py-3 rounded-xl border-slate-200" rows={8} value={newNews.descrizione_lunga} onChange={e => setNewNews({...newNews, descrizione_lunga: e.target.value})} />
                        <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setShowAddNews(false)} className="px-6 py-3 text-slate-500 font-bold">Annulla</button>
                          <button type="submit" className="px-8 py-3 bg-naro-navy text-white rounded-xl font-bold shadow-xl">Salva e Pubblica</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredNews.map(n => (
                      <div key={n.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group flex gap-4">
                        <img src={n.immagine_url} className="w-24 h-24 rounded-2xl object-cover shadow-sm bg-slate-200" alt="" />
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{n.categoria}</span>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditNews(n)} className="p-1.5 text-slate-400 hover:text-naro-navy bg-white rounded-lg shadow-sm"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteNews(n.id)} className="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-lg shadow-sm"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                          <h4 className="font-bold text-slate-800 line-clamp-1">{n.titolo}</h4>
                          <p className="text-xs text-slate-400 mt-2 flex items-center">
                            <Users className="w-3 h-3 mr-1" /> {n.views || 0} visualizzazioni • {n.comments?.length || 0} commenti
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            )}

            {activeSubTab === 'settings' && (
              <div className="space-y-8 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Categorie */}
                  <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-200">
                    <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-widest">Assetto Categorie</h3>
                    <form onSubmit={handleAddCategory} className="space-y-3 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <input required placeholder="Nome Categoria" className="w-full px-4 py-3 rounded-xl border-slate-200 text-sm" value={newCategory.nome} onChange={e => setNewCategory({...newCategory, nome: e.target.value})} />
                      <input placeholder="URL Icona" className="w-full px-4 py-3 rounded-xl border-slate-200 text-sm" value={newCategory.immagine_url} onChange={e => setNewCategory({...newCategory, immagine_url: e.target.value})} />
                      <button type="submit" className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm shadow-lg">{editingCategory ? 'Aggiorna' : 'Crea Nuova Categoria'}</button>
                    </form>
                    <div className="space-y-2">
                       {categories.map(c => (
                         <div key={c.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                           <span className="font-bold text-slate-700">{c.nome}</span>
                           <div className="flex gap-2">
                             <button onClick={() => handleEditCategory(c)} className="text-slate-400 hover:text-blue-500"><Edit3 className="w-4 h-4" /></button>
                             <button onClick={() => { StorageService.deleteCategory(c.id); onRefresh(); }} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* Enti */}
                  <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-200">
                    <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-widest">Anagrafica Enti</h3>
                    <form onSubmit={handleAddEntity} className="space-y-3 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <input required placeholder="Nome Ente" className="w-full px-4 py-3 rounded-xl border-slate-200 text-sm" value={newEntity.nome} onChange={e => setNewEntity({...newEntity, nome: e.target.value})} />
                      <input required type="email" placeholder="Email PEC" className="w-full px-4 py-3 rounded-xl border-slate-200 text-sm" value={newEntity.email} onChange={e => setNewEntity({...newEntity, email: e.target.value})} />
                      <button type="submit" className="w-full py-3 bg-naro-navy text-white rounded-xl font-bold text-sm shadow-lg">{editingEntity ? 'Aggiorna Ente' : 'Nuovo Ente Strategico'}</button>
                    </form>
                    <div className="space-y-2">
                       {entities.map(e => (
                         <div key={e.id} className="p-3 hover:bg-slate-50 rounded-2xl flex justify-between items-center group">
                           <div>
                              <p className="font-bold text-slate-700">{e.nome}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{e.email}</p>
                           </div>
                           <button onClick={() => { StorageService.deleteEntity(e.id); setEntities(StorageService.getEntities()); }} className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Dashboard Petizioni */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-200 overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Istanze Civiche & Firme</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {petitions.map(p => (
                         <div key={p.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group overflow-hidden">
                            <div className="relative z-10">
                              <h4 className="font-black text-slate-800 mb-1">{p.titolo}</h4>
                              <div className="flex justify-between items-end mt-4">
                                <div>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Firme Raccolte</p>
                                  <p className="text-2xl font-black text-naro-navy">{p.firme} <span className="text-xs text-slate-300">/ {p.quorum}</span></p>
                                </div>
                                <div className="text-right">
                                   <div className={`px-2 py-1 rounded text-[8px] font-black uppercase ${p.stato === 'aperta' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{p.stato}</div>
                                </div>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full mt-4 overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((p.firme / p.quorum) * 100, 100)}%` }}></div>
                              </div>
                              <div className="flex gap-2 mt-4">
                                <button 
                                  onClick={() => StorageService.generatePDF(p)}
                                  className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center"
                                >
                                  <Download className="w-3 h-3 mr-1" /> Firme
                                </button>
                                <button 
                                  onClick={() => StorageService.generateSinglePetitionReport(p)}
                                  className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center"
                                >
                                  <FileCheck className="w-3 h-3 mr-1" /> Report
                                </button>
                              </div>
                            </div>
                         </div>
                       ))}
                    </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="px-2 py-1 bg-naro-navy/10 text-naro-navy text-[10px] font-black rounded uppercase tracking-widest mb-1 inline-block">Audit Tracciabilità AgID</span>
                <h3 className="text-xl font-bold text-slate-800">Pratica #{selectedReport.id}</h3>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 flex-grow">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3">Soggetto Segnalante</h4>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="font-bold text-slate-800">{selectedReport.nome}</p>
                    <p className="text-xs text-slate-500 font-mono">{selectedReport.codiceFiscale || 'CITTADINO_CERTIFICATO'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3">Nota Interna Amministratore</h4>
                  <textarea 
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm italic"
                    rows={3}
                    placeholder="Aggiungi una nota interna..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3">Gestione Workflow</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'ricevuta', label: 'Ricevuta' },
                      { val: 'in_revisione', label: 'In Revisione' },
                      { val: 'presa_in_carico', label: 'In Carico' },
                      { val: 'in_lavorazione', label: 'In Lavorazione' },
                      { val: 'chiusa', label: 'Conclusa' }
                    ].map((s) => (
                      <button
                        key={s.val}
                        onClick={() => handleUpdateStatus(selectedReport.id, s.val)}
                        disabled={isProcessing}
                        className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          (selectedReport.stato || selectedReport.status) === s.val 
                          ? 'bg-naro-navy text-white shadow-lg' 
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {isProcessing && (selectedReport.stato || selectedReport.status) !== s.val ? '...' : s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3">Descrizione Criticità</h4>
                <div className="p-5 bg-white border border-slate-200 rounded-2xl text-sm leading-relaxed text-slate-600 italic">
                  "{selectedReport.descrizione || selectedReport.altro}"
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end items-center gap-4">
              <p className="text-[10px] text-slate-400 italic">Il cambio di stato è irreversibile ai fini dell'audit storico.</p>
              <button 
                onClick={() => handleExportReport(selectedReport)}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Esporta Fascicolo Legale
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <BackToTop />
    </div>
  );
}
