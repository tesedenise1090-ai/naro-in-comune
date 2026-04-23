import React from 'react';
import { ArrowLeft, Calculator, Coins, FileText, Info, ExternalLink, ArrowRight, ShieldCheck, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackToTop from './BackToTop';
import BackButton from './BackButton';

export function Tributi() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <BackToTop />
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <BackButton />
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-[#003366] px-8 py-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=2070')] opacity-5 bg-cover bg-center"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#C5A059] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Landmark className="w-8 h-8 text-[#003366]" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 uppercase tracking-tight">Tributi e Fiscalità Locale</h1>
              <p className="text-slate-300 text-lg">Comune di Naro — Gestione Trasparente delle Imposte</p>
              <p className="text-[#C5A059] font-serif italic mt-4 text-sm tracking-wide">"Partecipare è un dovere, digitale è un diritto"</p>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-12">
            {/* Intro Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Informazioni per il Contribuente</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Il Comune di Naro gestisce i tributi locali per garantire il finanziamento dei servizi essenziali alla comunità. 
                  In questa sezione puoi consultare le aliquote, le scadenze e accedere agli strumenti di calcolo per IMU, TARI e Addizionale IRPEF.
                </p>
                <div className="bg-[#fdfbf7] p-4 rounded-xl border border-[#C5A059]/20 flex items-start">
                  <ShieldCheck className="w-5 h-5 text-[#003366] mr-3 mt-0.5" />
                  <p className="text-sm text-slate-700">
                    <strong className="text-[#003366]">Trasparenza Fiscale:</strong> Tutte le aliquote sono deliberate dal Consiglio Comunale e pubblicate sul portale del Ministero dell'Economia e delle Finanze.
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-[#C5A059]" />
                  Dati Identificativi
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
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Provincia:</span>
                    <span className="font-bold text-slate-900">Agrigento (AG)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Taxes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* IMU Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="bg-[#003366] p-6 text-white">
                  <div className="flex justify-between items-start">
                    <Calculator className="w-10 h-10 text-[#C5A059]" />
                    <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/20">2026</span>
                  </div>
                  <h3 className="text-2xl font-bold mt-4">IMU</h3>
                  <p className="text-slate-300 text-sm mt-1">Imposta Municipale Propria</p>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 text-sm mb-6">
                    Dovuta per il possesso di fabbricati, aree fabbricabili e terreni agricoli. Esente per l'abitazione principale (non di lusso).
                  </p>
                  <div className="space-y-4">
                    <Link 
                      to="/calcolo-imu"
                      className="flex items-center justify-between p-4 bg-[#fdfbf7] text-[#003366] border border-[#C5A059]/20 rounded-xl font-bold hover:bg-[#f9f5eb] transition-colors group"
                    >
                      <span>Calcolo IMU Online</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a 
                      href="https://www.amministrazionicomunali.it/imu/calcolo_imu.php" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                      <span>Calcolo & Stampa F24</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* TARI Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                <div className="bg-[#1a1a1a] p-6 text-white">
                  <div className="flex justify-between items-start">
                    <Coins className="w-10 h-10 text-[#C5A059]" />
                    <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/20">2024/2025</span>
                  </div>
                  <h3 className="text-2xl font-bold mt-4">TARI</h3>
                  <p className="text-slate-300 text-sm mt-1">Tassa sui Rifiuti</p>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 text-sm mb-6">
                    Destinata alla copertura dei costi relativi al servizio di gestione dei rifiuti urbani. Calcolata su superficie e occupanti.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">Scadenza Acconto:</span>
                        <span className="font-bold text-slate-900">30 Giugno</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Scadenza Saldo:</span>
                        <span className="font-bold text-slate-900">2 Dicembre</span>
                      </div>
                    </div>
                    <Link to="/calcolo-tari" className="w-full flex items-center justify-between p-4 bg-[#1a1a1a] text-white rounded-xl font-bold hover:bg-black transition-colors">
                      <span>Verifica Posizione TARI</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Taxes */}
            <div className="border-t border-slate-200 pt-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Altri Tributi e Canoni</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-2">Addizionale IRPEF</h4>
                  <p className="text-sm text-slate-600 mb-4">Aliquota comunale applicata al reddito imponibile delle persone fisiche.</p>
                  <div className="text-2xl font-bold text-[#003366]">0,80%</div>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-2">Canone Unico</h4>
                  <p className="text-sm text-slate-600 mb-4">Ex TOSAP/ICP. Per l'occupazione di suolo pubblico e l'esposizione pubblicitaria.</p>
                  <Link to="/canone-unico" className="text-[#003366] font-bold text-sm hover:underline">Consulta Tariffe →</Link>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-2">Diritti Segreteria</h4>
                  <p className="text-sm text-slate-600 mb-4">Costi per il rilascio di certificati, atti e pratiche edilizie (SUAP/SUE).</p>
                  <button className="text-[#003366] font-bold text-sm hover:underline">Tabella Diritti →</button>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div className="bg-[#003366] rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
              <div>
                <h3 className="text-2xl font-bold mb-2">Hai bisogno di assistenza?</h3>
                <p className="text-slate-300">L'Ufficio Tributi riceve il Martedì e Giovedì dalle 9:00 alle 12:00.</p>
              </div>
              <div className="flex gap-4">
                <a href="mailto:tributi@comune.naro.ag.it" className="px-6 py-3 bg-[#C5A059] text-[#003366] rounded-xl font-bold hover:bg-[#b08d45] transition-colors">
                  Invia Email
                </a>
                <a href="tel:0922953011" className="px-6 py-3 bg-transparent text-white border border-white/20 rounded-xl font-bold hover:bg-white/10 transition-colors">
                  Chiama Ufficio
                </a>
              </div>
            </div>
          </div>
          
          {/* Footer Quote */}
          <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 text-center">
            <p className="text-slate-500 italic text-sm">"Partecipare è un dovere, digitale è un diritto"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
