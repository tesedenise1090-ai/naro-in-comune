import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileSignature, CheckCircle, Users, MapPin, Calendar, Building, X, ChevronRight, Share2, Link as LinkIcon, Check, Plus } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { StorageService } from '../services/storage';
import { FirmaModal } from './FirmaModal';
import BackToTop from './BackToTop';
import BackButton from './BackButton';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PetizioniTabProps {
  petitions: any[];
  userSignatures: number[];
  onRefresh: () => void;
}

export function PetizioniTab({ petitions, userSignatures, onRefresh }: PetizioniTabProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedPetizione, setSelectedPetizione] = useState<any>(null);
  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [newProposal, setNewProposal] = useState({ titolo: '', descrizione: '', quorum: 50, immagine_url: '' });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProposal(prev => ({ ...prev, immagine_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  useEffect(() => {
    if (id && petitions.length > 0) {
      const petition = petitions.find(p => p.id.toString() === id);
      if (petition) {
        setSelectedPetizione(petition);
        setShowDetailsModal(true);
      }
    }
  }, [id, petitions]);

  const handleOpenDetails = (petition: any) => {
    setSelectedPetizione(petition);
    setShowDetailsModal(true);
    navigate(`/istanza/${petition.id}`, { replace: true });
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedPetizione(null);
    navigate('/petizioni', { replace: true });
  };

  const handleShare = async () => {
    if (!selectedPetizione) return;

    const shareUrl = `${window.location.origin}/#/istanza/${selectedPetizione.id}`;
    const shareData = {
      title: `Naro In Comune - ${selectedPetizione.titolo}`,
      text: `Sostieni questa istanza civica per il Comune di Naro: ${selectedPetizione.titolo}`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    if (!selectedPetizione) return;
    const shareUrl = `${window.location.origin}/#/istanza/${selectedPetizione.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenFirma = (petition: any) => {
    setSelectedPetizione(petition);
    setShowFirmaModal(true);
  };

  // Calculate total signatures
  const totalSignatures = petitions.reduce((acc, p) => acc + p.firme, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
      <Helmet>
        <title>{selectedPetizione ? `${selectedPetizione.titolo} - Istanze Civiche Naro` : 'Istanze Civiche - NaroInComune'}</title>
        {selectedPetizione && (
          <>
            <meta property="og:title" content={selectedPetizione.titolo} />
            <meta property="og:description" content={selectedPetizione.descrizione.substring(0, 150) + '...'} />
            <meta property="og:image" content={selectedPetizione.immagine_url || `https://source.unsplash.com/800x400/?${selectedPetizione.categoria}`} />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={`${window.location.origin}/#/istanza/${selectedPetizione.id}`} />
            <meta name="twitter:card" content="summary_large_image" />
          </>
        )}
      </Helmet>
      <BackToTop />
      <div className="mb-6">
        <BackButton to="/" label="Torna alla Home" />
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center">
          <FileSignature className="w-8 h-8 text-naro-navy mr-3" />
          Istanze Civiche
        </h1>
        <button 
          onClick={() => setShowProposalModal(true)}
          className="mt-4 md:mt-0 flex items-center bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5 mr-2" /> Avvia una Petizione
        </button>
        <p className="text-slate-600 mt-2 text-lg">Partecipa attivamente alla vita del comune. Firma le petizioni o proponine di nuove.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lista Petizioni */}
        <div className="space-y-6">
          {petitions.map(p => {
            const isSigned = userSignatures.includes(p.id);
            return (
              <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase rounded mb-2">{p.categoria}</span>
                    <h3 className="text-xl font-bold text-slate-900">{p.titolo}</h3>
                    <p className="text-sm text-slate-500 mt-1 flex items-center"><Building className="w-3 h-3 mr-1"/> Destinatario: {p.ente}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                    ${p.stato === 'aperta' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-naro-navy'}`}>
                    {p.stato.replace('_', ' ')}
                  </div>
                </div>
                
                <p className="text-slate-700 mb-6 line-clamp-3">{p.descrizione}</p>
                
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{p.firme} firme raccolte</span>
                    <span className="text-slate-500">Obiettivo: {p.quorum}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-naro-navy h-2.5 rounded-full" style={{ width: `${Math.min((p.firme / p.quorum) * 100, 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  {isSigned ? (
                    <button disabled className="flex-1 bg-emerald-100 text-emerald-700 py-2 px-4 rounded-lg font-medium flex items-center justify-center cursor-default">
                      <CheckCircle className="w-4 h-4 mr-2" /> Firmata
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleOpenFirma(p)}
                      className="flex-1 bg-naro-navy hover:opacity-90 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <FileSignature className="w-4 h-4 mr-2" /> Firma Ora
                    </button>
                  )}
                  <button 
                    onClick={() => handleOpenDetails(p)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors flex items-center"
                  >
                    Dettagli <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mappa */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm h-[600px] sticky top-24 flex flex-col">
          <div className="bg-slate-50 p-3 rounded-t-xl border-b border-slate-200 flex justify-between items-center text-sm text-naro-navy">
             <span className="font-bold flex items-center"><Users className="w-4 h-4 mr-2"/> Firme Totali Raccolte:</span>
             <span className="bg-naro-navy text-white px-3 py-1 rounded-full font-bold">{totalSignatures}</span>
          </div>
          <div className="flex-grow relative rounded-b-xl overflow-hidden">
            <MapContainer center={[37.294, 13.794]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {petitions.map(p => (
                <Marker key={p.id} position={[p.lat, p.lng]}>
                  <Popup>
                    <div className="font-sans">
                      <h4 className="font-bold text-sm mb-1">{p.titolo}</h4>
                      <p className="text-xs text-slate-600">{p.firme} firme su {p.quorum}</p>
                      <button onClick={() => handleOpenDetails(p)} className="text-naro-navy text-xs hover:underline mt-1">Vedi Dettagli</button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Modal Firma Legale */}
      {showFirmaModal && selectedPetizione && (
        <FirmaModal 
          petizione={selectedPetizione} 
          onClose={() => setShowFirmaModal(false)}
          onSuccess={async (userData) => {
            let result;
            try {
              result = await StorageService.signPetitionFirestore(selectedPetizione.id, userData);
            } catch (error) {
              console.error("Errore salvataggio signature Firestore, fallback locale:", error);
              result = await StorageService.signPetition(selectedPetizione.id, userData);
            }
            const protocol = result.protocol;
            onRefresh();
            setShowFirmaModal(false);
            alert(`Istanza acquisita con successo!\nProtocollo N. ${protocol}\nAbbiamo generato la tua ricevuta PDF certificata.`);
          }}
        />
      )}

      {/* Modal Dettagli Petizione ("Stanza") */}
      {showDetailsModal && selectedPetizione && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="relative h-64 flex-shrink-0">
               {/* Use Unsplash source if available, otherwise placeholder */}
               <img 
                src={selectedPetizione.immagine_url || `https://source.unsplash.com/800x400/?${selectedPetizione.categoria}`} 
                alt={selectedPetizione.titolo} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
               />
               <button onClick={handleCloseDetails} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
                 <X className="w-6 h-6" />
               </button>
               <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                 <span className="inline-block px-3 py-1 bg-naro-navy text-white text-xs font-bold uppercase tracking-wider rounded-full mb-2">{selectedPetizione.categoria}</span>
                 <h2 className="text-2xl md:text-3xl font-bold text-white">{selectedPetizione.titolo}</h2>
               </div>
            </div>

            <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
              <div className="p-6 md:w-2/3 overflow-y-auto">
                <div className="flex flex-wrap gap-4 mb-6 text-sm text-slate-600">
                  <div className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> Scadenza: {new Date(selectedPetizione.data_scadenza).toLocaleDateString('it-IT')}</div>
                  <div className="flex items-center"><Building className="w-4 h-4 mr-1"/> Destinatario: {selectedPetizione.ente}</div>
                  <div className="flex items-center"><MapPin className="w-4 h-4 mr-1"/> {selectedPetizione.lat.toFixed(4)}, {selectedPetizione.lng.toFixed(4)}</div>
                </div>

                <h3 className="font-bold text-lg text-slate-900 mb-2">Descrizione</h3>
                <p className="text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap">{selectedPetizione.descrizione}</p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                  <h4 className="font-bold text-naro-navy mb-2">Stato Avanzamento</h4>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-naro-navy">{selectedPetizione.firme} firme raccolte</span>
                    <span className="text-naro-navy">Obiettivo: {selectedPetizione.quorum}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-naro-navy h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min((selectedPetizione.firme / selectedPetizione.quorum) * 100, 100)}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Al raggiungimento del quorum, la petizione verrà inviata automaticamente via PEC all'ente destinatario.
                  </p>
                </div>
              </div>

              <div className="md:w-1/3 bg-slate-50 border-l border-slate-200 p-0 flex flex-col">
                 <div className="h-48 md:h-1/2 w-full">
                    <MapContainer center={[selectedPetizione.lat, selectedPetizione.lng]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[selectedPetizione.lat, selectedPetizione.lng]} />
                    </MapContainer>
                 </div>
                 <div className="p-6 flex-grow flex flex-col justify-center">
                    <h4 className="font-bold text-slate-900 mb-4">Azioni Disponibili</h4>
                    {userSignatures.includes(selectedPetizione.id) ? (
                      <button disabled className="w-full bg-emerald-100 text-emerald-700 py-3 px-4 rounded-xl font-bold flex items-center justify-center mb-3 cursor-default">
                        <CheckCircle className="w-5 h-5 mr-2" /> Hai Firmato
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setShowDetailsModal(false); handleOpenFirma(selectedPetizione); }}
                        className="w-full bg-naro-navy hover:opacity-90 text-white py-3 px-4 rounded-xl font-bold shadow-lg shadow-slate-200 transition-all transform hover:scale-105 flex items-center justify-center mb-3"
                      >
                        <FileSignature className="w-5 h-5 mr-2" /> Firma Adesso
                      </button>
                    )}
                    <div className="flex gap-2 mb-3">
                      <button 
                        onClick={handleShare}
                        className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 px-4 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-5 h-5" /> Condividi
                      </button>
                      <button 
                        onClick={handleCopyLink}
                        className={`flex-1 border py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-5 h-5" /> Copiato!
                          </>
                        ) : (
                          <>
                            <LinkIcon className="w-5 h-5" /> Copia Link
                          </>
                        )}
                      </button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Proposta Petizione */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Nuova Istanza Civica</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              StorageService.addPetition({ ...newProposal, stato: 'in_attesa', firme: 0, lat: 37.294, lng: 13.794 });
              setShowProposalModal(false);
              alert("Proposta inviata con successo! In attesa di revisione da parte del Comune.");
              onRefresh();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Oggetto</label>
                <input required className="w-full p-3 rounded-xl border border-slate-300" value={newProposal.titolo} onChange={e => setNewProposal({...newProposal, titolo: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descrizione</label>
                <textarea required className="w-full p-3 rounded-xl border border-slate-300 h-32" value={newProposal.descrizione} onChange={e => setNewProposal({...newProposal, descrizione: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Obiettivo Firme (Quorum)</label>
                  <input type="number" required className="w-full p-3 rounded-xl border border-slate-300" value={newProposal.quorum} onChange={e => setNewProposal({...newProposal, quorum: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Allegato (Foto/Doc)</label>
                  <input type="file" accept="image/*,.pdf" className="w-full p-2 rounded-xl border border-slate-300 text-sm" onChange={handleImageUpload} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowProposalModal(false)} className="flex-1 py-3 text-slate-600 font-bold">Annulla</button>
                <button type="submit" className="flex-1 bg-naro-navy text-white rounded-xl font-bold py-3">Invia Proposta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
