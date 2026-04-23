import React, { useState } from 'react';
import { ShieldCheck, Search, FileCheck, Lock, Globe, ArrowRight, Download, ExternalLink, Info, Database, History, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackToTop from './BackToTop';
import BackButton from './BackButton';

/* ─────────────────────────────────────────────────────────────────────────────
   Immutabili.tsx
   Portale Registri Immutabili & Notarizzazione Digitale — NaroInComune
   Basato sulla tecnologia Blockchain per la trasparenza amministrativa.
───────────────────────────────────────────────────────────────────────────── */

interface RecordImmutabile {
  id: string;
  hash: string;
  timestamp: string;
  tipo: string;
  oggetto: string;
  status: 'Verificato' | 'In attesa';
}

const MOCK_RECORDS: RecordImmutabile[] = [
  { id: 'TX-845-001', hash: '0x7f8e9a...b2c3d4', timestamp: '2024-05-20 10:30:15', tipo: 'Delibera', oggetto: 'Approvazione Bilancio Previsionale 2024', status: 'Verificato' },
  { id: 'TX-845-002', hash: '0xa1b2c3...d4e5f6', timestamp: '2024-05-19 15:45:22', tipo: 'Certificato', oggetto: 'Certificato di Destinazione Urbanistica prot. 1234', status: 'Verificato' },
  { id: 'TX-845-003', hash: '0xfedcba...987654', timestamp: '2024-05-18 09:12:05', tipo: 'Contratto', oggetto: 'Affidamento Lavori Riqualificazione Centro Storico', status: 'Verificato' },
  { id: 'TX-845-004', hash: '0x123456...abcdef', timestamp: '2024-05-17 11:20:40', tipo: 'Ordinanza', oggetto: 'Ordinanza n. 45 - Sicurezza Stradale', status: 'Verificato' },
];

export default function Immutabili() {
  const [searchHash, setSearchHash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<RecordImmutabile | null>(null);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    // Simulazione verifica blockchain
    setTimeout(() => {
      const found = MOCK_RECORDS.find(r => r.hash.includes(searchHash) || r.id === searchHash);
      setVerificationResult(found || null);
      setIsVerifying(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] font-sans text-slate-900 pb-20">
      <BackToTop />
      {/* Topbar */}
      <div className="bg-[#003366] py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <BackButton className="!bg-transparent !border-white/20 !text-white hover:!bg-white/10 !py-1 !px-3" label="Torna Hub" />
            <span className="w-px h-3 bg-white/20"></span>
            <span className="text-[10px] text-white/60 tracking-[0.2em] font-mono uppercase">
              NaroInComune · Registro Immutabile Blockchain
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              NETWORK LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-[#003366] to-[#2c5f8a] rounded-2xl flex items-center justify-center shadow-lg shadow-[#003366]/20 shrink-0">
                <ShieldCheck className="w-8 h-8 text-[#C5A059]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 font-serif tracking-tight">
                  Registri Immutabili — NaroInComune
                </h1>
                <p className="text-slate-500 mt-1 max-w-2xl">
                  Notarizzazione digitale degli atti amministrativi su tecnologia Blockchain. 
                  Garantiamo l'integrità e l'originalità dei documenti pubblici per sempre.
                </p>
                <p className="text-[#C5A059] font-serif italic mt-3 text-xs tracking-wide">
                  "Partecipare è un dovere, digitale è un diritto"
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#C5A059]" />
                Esplora Network
              </button>
              <button className="px-5 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-bold hover:bg-[#002244] transition-colors shadow-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#C5A059]" />
                Accesso Riservato
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonna Sinistra: Verifica */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Search/Verify Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Search className="w-5 h-5 text-[#C5A059]" />
                Verifica Integrità Documento
              </h2>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchHash}
                    onChange={(e) => setSearchHash(e.target.value)}
                    placeholder="Inserisci l'Hash SHA-256 o l'ID Transazione..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[#C5A059] focus:bg-white transition-all outline-none font-mono text-sm"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <button 
                  type="submit"
                  disabled={isVerifying || !searchHash}
                  className="w-full py-4 bg-[#003366] text-white rounded-xl font-bold hover:bg-[#002244] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Verifica in corso sul network...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
                      Verifica Autenticità
                    </>
                  )}
                </button>
              </form>

              {/* Risultato Verifica */}
              {verificationResult && (
                <div className="mt-8 p-6 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                      <FileCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-emerald-900 font-bold text-lg">Documento Verificato</h3>
                      <p className="text-emerald-700 text-sm mt-1">
                        L'impronta digitale corrisponde esattamente a quella registrata nel network immutabile.
                      </p>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/50 p-3 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-emerald-600 font-bold uppercase block mb-1">Oggetto</span>
                          <span className="text-sm font-medium text-slate-800">{verificationResult.oggetto}</span>
                        </div>
                        <div className="bg-white/50 p-3 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-emerald-600 font-bold uppercase block mb-1">Data Notarizzazione</span>
                          <span className="text-sm font-medium text-slate-800">{verificationResult.timestamp}</span>
                        </div>
                      </div>
                      <button className="mt-4 text-emerald-700 text-sm font-bold flex items-center gap-1 hover:underline">
                        Scarica Certificato di Autenticità <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {searchHash && !isVerifying && verificationResult === null && (
                <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-red-700 font-bold">Nessun riscontro trovato</p>
                  <p className="text-red-600 text-sm mt-1">L'hash inserito non corrisponde ad alcun documento notarizzato nel nostro registro.</p>
                </div>
              )}
            </div>

            {/* Ultimi Atti Notarizzati */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#C5A059]" />
                  Ultimi Atti Notarizzati
                </h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aggiornato in tempo reale</span>
              </div>
              <div className="divide-y divide-slate-100">
                {MOCK_RECORDS.map((record) => (
                  <div key={record.id} className="px-8 py-5 hover:bg-slate-50 transition-colors group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                            {record.tipo}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{record.id}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 group-hover:text-[#003366] transition-colors">
                          {record.oggetto}
                        </h4>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Database className="w-3 h-3" /> {record.hash}
                          </span>
                          <span className="text-xs text-slate-400">{record.timestamp}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                          {record.status}
                        </span>
                        <button className="p-2 text-slate-400 hover:text-[#C5A059] transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-8 py-4 bg-slate-50 text-center">
                <button className="text-sm font-bold text-[#003366] hover:underline flex items-center gap-1 mx-auto">
                  Visualizza Archivio Completo <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Colonna Destra: Info & FAQ */}
          <div className="space-y-8">
            {/* Cos'è la Blockchain? */}
            <div className="bg-[#003366] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#C5A059]" />
                  Cos'è questo registro?
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  NaroInComune utilizza la tecnologia Blockchain per creare un'impronta digitale (Hash) unica di ogni atto. 
                  Una volta registrato, il dato diventa <strong>immutabile</strong>: nessuno, nemmeno l'amministrazione, può alterarlo retroattivamente.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#C5A059] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[#003366]" />
                    </div>
                    <span className="text-xs text-slate-200">Integrità garantita matematicamente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#C5A059] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[#003366]" />
                    </div>
                    <span className="text-xs text-slate-200">Trasparenza totale e permanente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#C5A059] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[#003366]" />
                    </div>
                    <span className="text-xs text-slate-200">Valore legale della notarizzazione</span>
                  </li>
                </ul>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#C5A059] rounded-full opacity-10 blur-3xl"></div>
            </div>

            {/* Normativa */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Riferimenti Normativi</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-[#003366] uppercase mb-1">CAD - Art. 20</h4>
                  <p className="text-[11px] text-slate-600">Validità del documento informatico e firme elettroniche.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-[#003366] uppercase mb-1">Regolamento eIDAS</h4>
                  <p className="text-[11px] text-slate-600">Standard europeo per l'identificazione elettronica.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-[#003366] uppercase mb-1">Linee Guida AgID</h4>
                  <p className="text-[11px] text-slate-600">Formazione e conservazione dei documenti informatici.</p>
                </div>
              </div>
            </div>

            {/* Supporto */}
            <div className="p-6 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-2xl">
              <h4 className="font-bold text-[#003366] mb-2">Hai bisogno di aiuto?</h4>
              <p className="text-xs text-slate-600 mb-4">Se non riesci a verificare un documento o hai dubbi sulla validità di un hash, contatta il nostro ufficio tecnico.</p>
              <a href="mailto:tecnico@comune.naro.ag.it" className="text-xs font-bold text-[#003366] hover:underline">
                Contatta Ufficio Tecnico →
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
