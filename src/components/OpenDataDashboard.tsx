import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
import { 
  TrendingUp, Users, Activity, CheckCircle, Clock, Map as MapIcon, AlertTriangle,
  Download, Filter, Calendar, LayoutDashboard, Database, FileText
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';
import { PDFService } from '../services/pdfService';
import { StorageService } from '../services/storage';

import { SegnalazioniList } from './SegnalazioniList';

interface OpenDataProps {
  reports: any[];
}

export function OpenDataDashboard({ reports }: OpenDataProps) {
  const handleGenerateImpactReport = async () => {
    const stats_data = {
      total: reports.length,
      resolved: reports.filter(r => r.status === 'completata' || r.status === 'chiusa').length,
      pending: reports.filter(r => r.status === 'pending').length,
      highPriority: reports.filter(r => r.priorita === 'alta').length,
    };

    const pdfData: any = {
      title: "Rendiconto di Impatto Territoriale",
      subtitle: "Relazione Pubblica sull'Efficienza Amministrativa - Naro 2026",
      year: 2026,
      date: new Date().toLocaleDateString("it-IT"),
      protocollo: `REPORT-OD-${Date.now().toString().slice(-4)}`,
      uuid: `OD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      status: 'DOCUMENTO PUBBLICO DI TRASPARENZA',
      contribuente: {
        nome: "COMRE DI NARO",
        cf: "ISTITUZIONALE",
        comune: "Naro (AG)"
      },
      summaryItems: [
        { label: "Totale Istanze", value: stats_data.total.toString(), isAccent: true },
        { label: "Rate Risoluzione", value: `${Math.round((stats_data.resolved / (stats_data.total || 1)) * 100)}%` },
        { label: "Tempo Risposta", value: "4.2 Giorni (Media)" },
        { label: "Indice Trasparenza", value: "98/100" }
      ],
      tables: [
        {
          title: "Analisi Quantitativa per Tipologia",
          head: [["Ambito di Intervento", "Volume Segnalazioni", "Stato Avanzamento"]],
          body: [
            ["Infrastrutture & Strade", reports.filter(r => r.tipoGuasto === 'buche' || r.tipoGuasto === 'asfalto').length.toString(), "In Corso"],
            ["Illuminazione Pubblica", reports.filter(r => r.tipoGuasto === 'lampioni' || r.tipoGuasto === 'elettrico').length.toString(), "Presidiata"],
            ["Verde & Decoro Urbano", reports.filter(r => r.tipoGuasto === 'verde' || r.tipoGuasto === 'rifiuti').length.toString(), "Ottimale"],
            ["Emergenze Protezione Civile", stats_data.highPriority.toString(), "PRIORITÀ MASSIMA"]
          ]
        }
      ],
      images: []
    };

    await PDFService.generateInstitutionalPDF(pdfData, `REPORT_IMPATTO_NARO_2026.pdf`);
    
    // Log the report generation
    StorageService.logAction('PDF_GEN', 'OPEN_DATA_REPORT', 'PUBLIC', { type: 'ImpactReport' });
  };

  // Process Data for Charts
  const stats = useMemo(() => {
    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'completata' || r.status === 'chiusa').length;
    const pending = reports.filter(r => r.status === 'pending').length;
    const highPriority = reports.filter(r => r.priorita === 'alta').length;
    
    // Status Distribution
    const statusData = [
      { name: 'In Attesa', value: pending, color: '#F59E0B' },
      { name: 'In Lavoro', value: reports.filter(r => r.status === 'in_carico' || r.status === 'presa_in_carico').length, color: '#3B82F6' },
      { name: 'Completate', value: resolved, color: '#10B981' },
    ];

    // Priority Distribution
    const priorityData = [
      { name: 'Alta', value: highPriority, color: '#EF4444' },
      { name: 'Media', value: reports.filter(r => r.priorita === 'media').length, color: '#F59E0B' },
      { name: 'Bassa', value: reports.filter(r => r.priorita === 'bassa').length, color: '#3B82F6' },
    ];

    // Trend Data (Last 30 days)
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 30),
      end: new Date()
    });

    const trendData = last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = reports.filter(r => r.date && r.date.startsWith(dayStr)).length;
      return {
        date: format(day, 'dd MMM', { locale: it }),
        segnalazioni: count
      };
    });

    return { total, resolved, pending, highPriority, statusData, priorityData, trendData };
  }, [reports]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-naro-navy rounded-lg shadow-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Naro <span className="text-naro-navy">Open Data</span></h1>
          </div>
          <p className="text-slate-600 max-w-2xl leading-relaxed">
            Monitoraggio trasparente delle attività amministrative e civiche. Benvenuti nella "Control Room" pubblica del Comune di Naro.
          </p>
        </header>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Totale Segnalazioni', value: stats.total, icon: Activity, color: 'text-naro-navy', bg: 'bg-naro-navy/5' },
            { label: 'Problemi Risolti', value: stats.resolved, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Priorità Alta BGS', value: stats.highPriority, icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'In Attesa', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`${item.bg} p-6 rounded-3xl border border-white/20 shadow-sm`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-xl bg-white shadow-sm`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo reale</span>
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-1">{item.value}</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{item.label}</p>
            </motion.div>
          ))}
        </div>

        {/* High Priority Alerts Section */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 mb-12">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
               <AlertTriangle className="w-6 h-6 text-red-600" /> Segnalazioni Critiche / Alta Priorità
            </h3>
            <div className="space-y-4">
              {reports.filter(r => r.priorita === 'alta').length > 0 ? (
                reports.filter(r => r.priorita === 'alta').map((r, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-red-50 border border-red-100 rounded-2xl">
                    <div>
                      <p className="font-bold text-red-900">{r.tipoGuasto}</p>
                      <p className="text-xs text-red-700">{r.ubicazione}</p>
                    </div>
                    <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-lg uppercase">Priorità Alta</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">Nessuna segnalazione critica al momento.</p>
              )}
            </div>
        </div>

        <SegnalazioniList reports={reports} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Trend Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100"
          >
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-naro-navy" /> Trend Segnalazioni (30gg)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trendData}>
                  <defs>
                    <linearGradient id="colorSeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#003366" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#003366" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="segnalazioni" stroke="#003366" strokeWidth={3} fillOpacity={1} fill="url(#colorSeg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Status Distribution */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100"
          >
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-naro-navy" /> Stato Gestione Istanze
            </h3>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Interventions Map Placeholder / Section */}
        <section className="bg-naro-navy text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-naro-gold/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-md text-center lg:text-left">
              <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Geografia del Benessere</h2>
              <p className="text-white/60 mb-8 leading-relaxed">
                Stiamo mappando ogni intervento per garantire una distribuzione equa ed efficiente delle risorse su tutto il territorio comunale di Naro.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-widest">32 Interventi in corso</span>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-xs font-bold uppercase tracking-widest">14 Zone rinvigorite</span>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 aspect-square max-w-[400px] bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-white/10 overflow-hidden cursor-pointer">
               <MapContainer center={[37.294, 13.794]} zoom={13} style={{ height: '100%', width: '100%' }}>
                 <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                 {reports
                   .filter(r => ['chiusa', 'risolto', 'in_lavorazione', 'presa_in_carico'].includes(r.stato || r.status))
                   .map(r => (
                     <Marker 
                       key={r.id} 
                       position={[r.lat || 37.294, r.lng || 13.794]}
                       icon={new L.Icon({
                         iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${
                           ['in_lavorazione', 'presa_in_carico'].includes(r.stato || r.status) ? 'red' : 'green'
                         }.png`,
                         shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                         iconSize: [25, 41],
                         iconAnchor: [12, 41],
                         popupAnchor: [1, -34],
                         shadowSize: [41, 41]
                       })}
                     >
                       <Popup>
                         <div className="text-xs font-sans">
                           <p className="font-bold">{r.tipoGuasto || 'Intervento'}</p>
                           <p>Stato: {(r.stato || r.status || '').toUpperCase()}</p>
                           <p>Data: {new Date(r.date || r.data).toLocaleDateString()}</p>
                         </div>
                       </Popup>
                     </Marker>
                   ))}
               </MapContainer>
            </div>
          </div>
        </section>

        {/* Accessibility & Transparency Footer */}
        <footer className="mt-12 text-center p-8 bg-slate-100 rounded-3xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium max-w-xl mx-auto">
            Questo portale riflette i dati grezzi estratti dal database istituzionale nel rispetto della privacy (GDPR). Nessun dato sensibile viene esposto pubblicamente. Report ai sensi del Protocollo Trasparenza PA 2026.
          </p>
          <div className="flex justify-center gap-4 mt-4">
             <button 
               onClick={handleGenerateImpactReport}
               className="text-[10px] font-black uppercase text-naro-navy hover:underline flex items-center gap-1"
             >
               <FileText className="w-3 h-3" /> Download Report Mensile (PDF)
             </button>
             <span className="text-slate-300">|</span>
             <button className="text-[10px] font-black uppercase text-naro-navy hover:underline">Richiedi Accesso agli Atti</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
