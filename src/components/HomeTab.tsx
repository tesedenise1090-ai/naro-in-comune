import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Zap, AlertTriangle, FileSignature, Phone, Eye, ThumbsUp, MessageSquare, ArrowRight, BarChart3 } from 'lucide-react';
import { ActionCard } from './ActionCard';
import { WasteCalendarWidget } from './WasteCalendarWidget';
import { StorageService } from '../services/storage';
import BackToTop from './BackToTop';

interface HomeTabProps {
  navigate: (tab: string) => void;
  news: any[];
  onRefresh: () => void;
}

export function HomeTab({ navigate, news, onRefresh }: HomeTabProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderNews = news.filter(n => n.evidenza);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'evidenza', 'archivio'

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % sliderNews.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + sliderNews.length) % sliderNews.length);

  // Auto-advance slider
  useEffect(() => {
    if (sliderNews.length > 1) {
      const timer = setInterval(nextSlide, 8000);
      return () => clearInterval(timer);
    }
  }, [sliderNews.length]);

  const handleLike = (id: number) => {
    StorageService.likeNews(id);
    onRefresh();
  };

  // Filter Logic
  const filteredNews = news.filter(n => {
    const matchesSearch = n.titolo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' 
      ? true 
      : filterType === 'evidenza' ? n.evidenza 
      : !n.evidenza;
    return matchesSearch && matchesFilter;
  });

  // Pagination Logic
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
  
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="animate-in fade-in duration-700 bg-slate-50/50">
      <BackToTop />

      {/* Live Update Banner */}
      <div className="bg-red-600 text-white py-2 px-4 text-center text-xs font-bold uppercase tracking-widest shadow-lg z-50">
         <span className="animate-pulse mr-2">LIVE:</span> Roma Costruzioni Comunica: Servizio Regolare. Eventuali variazioni festività saranno aggiornate qui.
      </div>
      
      {/* Immersive Image Hero Section */}
      <div 
        className="relative h-[85vh] md:h-[75vh] flex items-center justify-center overflow-hidden bg-[url('https://www.siciliafan.it/wp-content/uploads/sites/3/2024/03/Naro-1-1.jpeg')] bg-cover bg-center"
      >
        {/* Accessibility/Readability Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        
        {/* Gradient Overlays for smooth blend */}
        <div className="absolute inset-0 bg-gradient-to-b from-naro-navy/50 via-transparent to-slate-50/100"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-naro-navy/60 via-transparent to-transparent"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-white">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 bg-naro-gold/20 backdrop-blur-md border border-naro-gold/30 text-naro-gold text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-6">
              Piattaforma Istituzionale BGS-2026
            </span>
            <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight tracking-tighter drop-shadow-2xl">
              Naro in <span className="text-gradient-gold">Digitale.</span><br />
              <span className="text-3xl md:text-5xl opacity-90 font-bold">La forza della trasparenza.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed font-medium">
              Gestisci le tue istanze civiche, monitora il territorio in tempo reale e partecipa attivamente al futuro del nostro Comune.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('segnalazione-guasti')}
                className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-red-700 hover:scale-105 transition-all flex items-center"
              >
                Segnala Criticità <Zap className="ml-2 w-4 h-4 fill-current" />
              </button>
              <Link 
                to="/utility"
                className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                Servizi Online
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions / Missioni */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <ActionCard 
            icon={<Zap className="w-8 h-8 text-naro-gold" />}
            title="Hub Utility"
            desc="Consumi e bollette."
            onClick={() => navigate('utility')}
            color="border-naro-gold"
          />
          <ActionCard 
            icon={<AlertTriangle className="w-8 h-8 text-orange-500" />}
            title="Tracking"
            desc="Stato segnalazioni BGS."
            onClick={() => navigate('tracking-istanza')}
            color="border-orange-500"
          />
          <ActionCard 
            icon={<FileSignature className="w-8 h-8 text-naro-navy" />}
            title="Istanze"
            desc="Firme e petizioni civiche."
            onClick={() => navigate('petizioni')}
            color="border-naro-navy"
          />
          <ActionCard 
            icon={<BarChart3 className="w-8 h-8 text-indigo-500" />}
            title="Open Data"
            desc="Statistiche e Trasparenza."
            onClick={() => navigate('opendata')}
            color="border-indigo-500"
          />
          <ActionCard 
            icon={<Phone className="w-8 h-8 text-emerald-500" />}
            title="Emergenze"
            desc="Segnalazione priorità BGS."
            onClick={() => navigate('segnalazione-guasti?emergency=true')}
            color="border-emerald-500"
          />
        </div>
      </div>

      {/* Waste Calendar Widget */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <WasteCalendarWidget id="waste-calendar-widget" navigate={navigate} />
      </div>

      {/* News Section with Search & Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 md:mb-0">Ultime Notizie</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
               <input 
                 type="text" 
                 placeholder="Cerca notizie..." 
                 className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-naro-navy outline-none"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
               <div className="absolute left-3 top-2.5 text-slate-400">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
               </div>
            </div>
            
            <select 
              className="px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-naro-navy outline-none"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Tutte le notizie</option>
              <option value="evidenza">In Evidenza</option>
              <option value="archivio">Archivio</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedNews.map(item => (
            <div key={item.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 group flex flex-col h-full hover:-translate-y-1">
              <div className="h-56 overflow-hidden relative">
                <img src={item.immagine_url} alt={item.titolo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center border border-white/20">
                  <Eye className="w-3 h-3 mr-1" /> {item.views || 0} VISUALIZZAZIONI
                </div>
                {item.evidenza && (
                  <div className="absolute top-4 left-4 bg-naro-gold text-white text-[10px] font-black px-3 py-1.5 rounded-full tracking-widest outline outline-4 outline-naro-gold/20">
                    TOP STORY
                  </div>
                )}
              </div>
              <div className="p-8 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(item.data).toLocaleDateString('it-IT')}</span>
                  <span className="text-[10px] font-black text-naro-navy bg-naro-navy/5 px-2 py-1 rounded tracking-widest uppercase">{item.categoria}</span>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-3 line-clamp-2 leading-tight tracking-tight group-hover:text-naro-navy transition-colors">{item.titolo}</h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-3 flex-grow leading-relaxed font-medium">{item.descrizione_breve || item.contenuto}</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                  <div className="flex space-x-6 text-slate-400">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`news/${item.id}`); }} className="flex items-center hover:text-naro-navy transition-colors text-xs font-bold group/like">
                      <ThumbsUp className="w-4 h-4 mr-1.5 group-hover/like:scale-120 transition-transform" /> {item.likes || 0}
                    </button>
                    <div className="flex items-center text-xs font-bold">
                      <MessageSquare className="w-4 h-4 mr-1.5" /> {item.comments?.filter((c: any) => c.status === 'approved').length || 0}
                    </div>
                  </div>
                  <button onClick={() => navigate(`news/${item.id}`)} className="text-[10px] font-black text-naro-navy uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center group/btn">
                    Leggi Istanza <ArrowRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredNews.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              Nessuna notizia trovata con i filtri selezionati.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12 space-x-2">
            <button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-10 h-10 rounded-lg font-bold ${currentPage === page ? 'bg-naro-navy text-white' : 'border border-slate-300 hover:bg-slate-50 text-slate-700'}`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
