import React, { useState } from 'react';
import { FileSignature, X, ShieldAlert, Download, CheckCircle } from 'lucide-react';
import { StorageService } from '../services/storage';

interface FirmaModalProps {
  petizione: any;
  onClose: () => void;
  onSuccess: (userData: any) => void;
}

export function FirmaModal({ petizione, onClose, onSuccess }: FirmaModalProps) {
  const [formData, setFormData] = useState({ nome: '', cognome: '', cf: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setIsGenerating(false);
      setIsDone(true);
      onSuccess(formData);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center"><FileSignature className="w-5 h-5 mr-2"/> Firma Istanza</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-6 h-6"/></button>
        </div>
        
        <div className="p-6">
          {!isDone ? (
            <>
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-medium mb-1">Stai firmando per:</p>
                <p className="font-bold text-blue-900">{petizione.titolo}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                    value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cognome</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={formData.cognome} onChange={e => setFormData({...formData, cognome: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Codice Fiscale</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase" maxLength={16}
                    value={formData.cf} onChange={e => setFormData({...formData, cf: e.target.value.toUpperCase()})} />
                </div>

                <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 flex items-start mt-4">
                  <ShieldAlert className="w-4 h-4 mr-2 flex-shrink-0 text-slate-400" />
                  <p><strong>Zero-Storage Policy:</strong> I tuoi dati verranno utilizzati esclusivamente per validare la firma e generare il report finale per l'ente.</p>
                </div>

                <button type="submit" disabled={isGenerating} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center disabled:opacity-70">
                  {isGenerating ? 'Elaborazione...' : <><CheckCircle className="w-5 h-5 mr-2" /> Conferma Firma</>}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Firma Registrata!</h3>
              <p className="text-slate-600 mb-6">Grazie per aver partecipato a questa iniziativa civica.</p>
              <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-2 px-6 rounded-lg transition-colors">
                Chiudi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
