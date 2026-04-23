import React, { useState } from 'react';
import { RNDTPanel } from '../services/rndtService';
import { Search, Globe } from 'lucide-react';
import BackToTop from './BackToTop';
import BackButton from './BackButton';

export const RNDTPage = () => {
  const [comune, setComune] = useState('Roma');
  const [input, setInput] = useState('Roma');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <BackToTop />
      <div className="mb-6">
        <BackButton />
      </div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 flex items-center mb-4">
          <Globe className="w-10 h-10 text-blue-600 mr-3" />
          Repertorio Nazionale dei Dati Territoriali (RNDT)
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl">
          Esplora i dataset territoriali, mappe catastali, servizi WMS e piani regolatori pubblicati dalle Pubbliche Amministrazioni.
        </p>
      </div>
      
      <div className="flex gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          className="flex-grow px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Inserisci nome comune..."
        />
        <button onClick={() => setComune(input)} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Search size={18} /> Cerca Comune
        </button>
      </div>
      
      <RNDTPanel 
        comuneNome={comune} 
        comuneCodice={undefined} 
        comuneSigla={undefined}
        bbox={undefined}
      />
    </div>
  );
};
