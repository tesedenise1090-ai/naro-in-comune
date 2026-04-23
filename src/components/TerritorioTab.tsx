import React from 'react';
import { AlertTriangle, Map as MapIcon, ShieldAlert, ExternalLink, Download, Info, ArrowRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { jsPDF } from 'jspdf';
import BackToTop from './BackToTop';
import BackButton from './BackButton';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { StorageService } from '../services/storage';

interface TerritorioTabProps {
  monitoring: any[];
}

export function TerritorioTab({ monitoring }: TerritorioTabProps) {
  // Center map on Naro (AG)
  const position: [number, number] = [37.294, 13.794];

  const handleDownloadVademecum = async () => {
    await StorageService.generateTerritoryPDF();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
      <BackToTop />
      <div className="mb-6">
        <BackButton to="/" label="Torna alla Home" />
      </div>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            <AlertTriangle className="w-8 h-8 text-orange-500 mr-3" />
            Monitoraggio Territorio
          </h1>
          <p className="text-slate-600 mt-2 text-lg">Dati in tempo reale sul rischio idrogeologico e storico frane.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            to="/segnalazione-guasti?emergency=true"
            className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 animate-pulse border-2 border-red-500"
          >
            <ShieldAlert className="w-5 h-5 mr-2" />
            ATTIVA EMERGENZA
          </Link>
          <Link 
            to="/segnalazione-guasti"
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Segnala Criticità
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[500px] overflow-hidden relative z-0">
             <MapContainer center={position} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {monitoring.map((zona) => (
                <React.Fragment key={zona.id}>
                  <Marker position={zona.lat && zona.lng ? [zona.lat, zona.lng] : position}>
                    <Popup>
                      <strong>{zona.zona}</strong><br />
                      Rischio: {zona.rischio}<br />
                      Stato: {zona.stato}
                    </Popup>
                  </Marker>
                  <Circle 
                    center={zona.lat && zona.lng ? [zona.lat, zona.lng] : position}
                    pathOptions={{ 
                      color: zona.stato === 'verde' ? 'green' : zona.stato === 'gialla' ? 'yellow' : 'red',
                      fillColor: zona.stato === 'verde' ? 'green' : zona.stato === 'gialla' ? 'yellow' : 'red',
                      fillOpacity: 0.2
                    }}
                    radius={300}
                  />
                </React.Fragment>
              ))}
            </MapContainer>
          </div>

          {/* Detailed Risk Zones Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-800">Dettaglio Zone a Rischio</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">Zona</th>
                    <th className="px-6 py-3">Livello Rischio</th>
                    <th className="px-6 py-3">Stato Attuale</th>
                    <th className="px-6 py-3">Ultimo Aggiornamento</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoring.map((zona) => (
                    <tr key={zona.id} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{zona.zona}</td>
                      <td className="px-6 py-4">{zona.rischio}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                          ${zona.stato === 'verde' ? 'bg-emerald-100 text-emerald-700' : 
                            zona.stato === 'gialla' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'}`}>
                          {zona.stato}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">Oggi, 10:30</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Vademecum Card */}
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
            <h3 className="font-bold text-orange-900 flex items-center mb-2">
              <ShieldAlert className="w-5 h-5 mr-2" />
              Norme di Comportamento
            </h3>
            <p className="text-sm text-orange-800 mb-4">In caso di allerta arancione o rossa per rischio idrogeologico, segui le direttive della Protezione Civile.</p>
            <button 
              onClick={handleDownloadVademecum}
              className="w-full py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Scarica Vademecum PDF
            </button>
          </div>

          {/* External Tools */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg mb-4 border-b pb-2 flex items-center">
              <ExternalLink className="w-5 h-5 mr-2 text-slate-500" />
              Strumenti Esterni
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 mb-4">
                 <p className="text-[10px] text-blue-800 font-black uppercase tracking-widest mb-1">Gateway Istituzionale</p>
                 <p className="text-xs text-blue-600 leading-tight">Accesso diretto ai nodi cartografici regionali e nazionali per l'analisi del rischio.</p>
              </div>

              <a href="https://idrogeo.isprambiente.it/app/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all group">
                <div className="p-2.5 bg-slate-100 text-naro-navy rounded-lg mr-3 group-hover:bg-naro-navy group-hover:text-white transition-colors">
                  <MapIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-naro-navy transition-colors text-sm">ISPRA IdroGEO</p>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Piattaforma Nazionale Dissesto</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-naro-navy group-hover:translate-x-1 transition-all" />
              </a>

              <a href="https://rischi.protezionecivile.gov.it/it/meteo-idro/allertamento" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all group">
                <div className="p-2.5 bg-orange-100 text-orange-600 rounded-lg mr-3 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors text-sm">Protezione Civile</p>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Bollettini di Criticità H24</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
              </a>

              <a href="https://sitr.regione.sicilia.it/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-white border border-emerald-100 rounded-xl hover:shadow-lg hover:border-emerald-200 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 h-full w-1 bg-emerald-500"></div>
                <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-lg mr-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors text-sm">SISTAM Sicilia</p>
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded border border-emerald-100 animate-pulse">LIVE BRIDGE</span>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">Sistema Informativo Territoriale Regionale</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
