import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { ShieldAlert, Menu, X, Accessibility, Mic } from 'lucide-react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollToTop from './components/ScrollToTop';
import { StorageService } from './services/storage';
import { useVoiceCommand } from './hooks/useVoiceCommand';
import { AIAssistant } from './components/AIAssistant';
import { Footer } from './components/Footer';
import { LoginPortal } from './components/LoginPortal';
import { FullscreenToggle } from './components/FullscreenToggle';

// Lazy load components for better performance
const HomeTab = React.lazy(() => import('./components/HomeTab').then(module => ({ default: module.HomeTab })));
const UtilityTab = React.lazy(() => import('./components/UtilityTab').then(module => ({ default: module.UtilityTab })));
const TerritorioTab = React.lazy(() => import('./components/TerritorioTab').then(module => ({ default: module.TerritorioTab })));
const PetizioniTab = React.lazy(() => import('./components/PetizioniTab').then(module => ({ default: module.PetizioniTab })));
const AdminTab = React.lazy(() => import('./components/AdminTab').then(module => ({ default: module.AdminTab })));
const NewsDetail = React.lazy(() => import('./components/NewsDetail').then(module => ({ default: module.NewsDetail })));
const SegnalazioneGuasti = React.lazy(() => import('./components/SegnalazioneGuasti').then(module => ({ default: module.SegnalazioneGuasti })));
const CalcoloIMU = React.lazy(() => import('./components/IMU_calc').then(module => ({ default: module.default })));
const Tributi = React.lazy(() => import('./components/Tributi').then(module => ({ default: module.Tributi })));
const RNDTPage = React.lazy(() => import('./components/RNDTPage').then(module => ({ default: module.RNDTPage })));
const TARITimeline = React.lazy(() => import('./components/TARI_Timeline').then(module => ({ default: module.default })));
const TARICalc = React.lazy(() => import('./components/TARI_calc').then(module => ({ default: module.default })));
const CanoneUnico = React.lazy(() => import('./components/CanoneUnico').then(module => ({ default: module.default })));
const DelibereNaro = React.lazy(() => import('./components/DelibereNaro').then(module => ({ default: module.default })));
const Immutabili = React.lazy(() => import('./components/Immutabili').then(module => ({ default: module.default })));
const UsefulNumbers = React.lazy(() => import('./components/UsefulNumbers').then(module => ({ default: module.UsefulNumbers })));
const Regulations = React.lazy(() => import('./components/Regulations').then(module => ({ default: module.Regulations })));
const TrackReporting = React.lazy(() => import('./components/TrackReporting').then(module => ({ default: module.TrackReporting })));
const OpenDataDashboard = React.lazy(() => import('./components/OpenDataDashboard').then(module => ({ default: module.OpenDataDashboard })));
const TrasparenzaTab = React.lazy(() => import('./components/TrasparenzaTab'));

function AppContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'citizen' | 'technician' | 'admin' | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // App State
  const [news, setNews] = useState<any[]>([]);
  const [petitions, setPetitions] = useState<any[]>([]);
  const [monitoring, setMonitoring] = useState<any[]>([]);
  const [userSignatures, setUserSignatures] = useState<number[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [voiceAssistantActive, setVoiceAssistantActive] = useState(false);

  const handleVoiceCommand = useCallback((command: string) => {
    console.log("Voice Command Received:", command);
    if (command.includes('emergenza') || command.includes('aiuto') || command.includes('pericolo')) {
      navigate('/segnalazione-guasti?emergency=true');
      alert("Comando Vocale: Attivazione procedura d'emergenza.");
    }
    if (command.includes('home') || command.includes('inizio')) {
      navigate('/');
    }
  }, [navigate]);

  const { startListening: startGlobalVoice } = useVoiceCommand(handleVoiceCommand);

  // Session Timeout Logic
  useEffect(() => {
    let timeoutId: any;
    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (isAuthenticated) {
        timeoutId = setTimeout(() => {
          handleLogout();
          alert("Sessione scaduta per inattività. Per la tua sicurezza verrai disconnesso.");
        }, 15 * 60 * 1000); // 15 minutes of inactivity
      }
    };

    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keypress', resetTimeout);
    resetTimeout();

    return () => {
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keypress', resetTimeout);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated]);

  // Initialize Data
  useEffect(() => {
    StorageService.init();
    refreshData();
  }, []);

  const refreshData = () => {
    setNews(StorageService.getNews());
    setPetitions(StorageService.getPetitions());
    setMonitoring(StorageService.getMonitoring());
    setUserSignatures(StorageService.getUserSignatures());
    setCategories(StorageService.getCategories());
    setReports(StorageService.getReports());
  };

  const handleLogin = (role: 'citizen' | 'technician' | 'admin', userData?: any) => {
    setIsAuthenticated(true);
    setUserRole(role);
    if (userData) setCurrentUser(userData);
    
    if (role === 'admin' || role === 'technician') {
      setIsAdmin(true);
      navigate('/admin');
    } else {
      setIsAdmin(false);
      navigate('/');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setIsAdmin(false);
    setCurrentUser(null);
    localStorage.removeItem('naro_remembered_user');
    navigate('/');
  };

  const handleAdminToggle = () => {
    // In a real app this would require auth, but for simulation:
    setIsAdmin(!isAdmin);
    if (!isAdmin) {
      setUserRole('admin');
      setIsAuthenticated(true);
      navigate('/admin');
    } else {
      setUserRole('citizen');
      navigate('/');
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const isActive = (path: string) => location.pathname === path ? 'text-blue-600' : '';

  if (!isAuthenticated) {
    return <LoginPortal onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-all duration-300 ${isHighContrast ? 'high-contrast' : 'bg-slate-50 text-slate-900'}`}>
      <Helmet>
        <title>NaroInComune - Piattaforma di Iniziativa Popolare Digitale</title>
        <meta name="description" content="Partecipa alla vita del tuo comune con NaroInComune. Gestisci utenze, monitora il territorio e firma petizioni online." />
        <meta property="og:title" content="NaroInComune - Portale Digital Citizen" />
        <meta property="og:description" content="Partecipa alla vita del tuo comune. Segnalazione criticità BGS-2026, Open Data e Trasparenza." />
        <meta property="og:image" content="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Naro-Stemma.svg/960px-Naro-Stemma.svg.png" />
        <meta property="og:site_name" content="NaroInComune" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md text-slate-800 shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center cursor-pointer" onClick={closeMobileMenu} aria-label="NaroInComune - Torna alla Home">
              <ShieldAlert className="h-8 w-8 text-naro-navy mr-3" aria-hidden="true" />
              <span className="font-bold text-xl tracking-tight text-slate-900">Naro<span className="text-naro-navy">InComune</span></span>
            </Link>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-6 items-center">
              <button 
                onClick={() => {
                  if (!voiceAssistantActive) {
                    startGlobalVoice();
                    setVoiceAssistantActive(true);
                  }
                }} 
                className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs font-bold ${voiceAssistantActive ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title="Attiva Assistente Vocale (Dì 'Emergenza' o 'Home')"
              >
                <Mic className={`w-4 h-4 ${voiceAssistantActive ? 'fill-current' : ''}`} />
                {voiceAssistantActive ? 'Ascolto...' : 'Voce'}
              </button>
              <button 
                onClick={() => setIsHighContrast(!isHighContrast)} 
                className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs font-bold ${isHighContrast ? 'bg-naro-gold text-naro-navy' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title="Attiva Alta Legibilità (Accessibilità)"
              >
                <Accessibility className="w-4 h-4" />
                {isHighContrast ? 'Luce' : 'Contrasto'}
              </button>
              <Link to="/" className={`hover:text-naro-navy font-medium transition-colors ${isActive('/') ? 'text-naro-navy' : 'text-slate-600'}`}>Home</Link>
              <Link to="/utility" className={`hover:text-naro-navy font-medium transition-colors ${isActive('/utility') ? 'text-naro-navy' : 'text-slate-600'}`}>Hub Utility</Link>
              <Link to="/territorio" className={`hover:text-naro-navy font-medium transition-colors ${isActive('/territorio') ? 'text-naro-navy' : 'text-slate-600'}`}>Territorio</Link>
              <Link to="/petizioni" className={`hover:text-naro-navy font-medium transition-colors ${isActive('/petizioni') ? 'text-naro-navy' : 'text-slate-600'}`}>Istanze Civiche</Link>
              <Link to="/trasparenza" className={`hover:text-naro-navy font-medium transition-colors ${isActive('/trasparenza') ? 'text-naro-navy' : 'text-slate-600'}`}>Trasparenza</Link>
              <Link to="/numeri-utili" className={`hover:text-naro-navy font-medium transition-colors ${isActive('/numeri-utili') ? 'text-naro-navy' : 'text-slate-600'}`}>Numeri Utili</Link>
              <Link to="/normative" className={`hover:text-naro-navy font-medium transition-colors ${isActive('/normative') ? 'text-naro-navy' : 'text-slate-600'}`}>Normative</Link>
              
              <div className="flex items-center space-x-2">
                <FullscreenToggle />
                <Link to="/segnalazione-guasti" className="group relative px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all shadow-sm flex items-center text-sm overflow-hidden">
                  <div className="absolute top-0 right-0 h-full w-4 bg-white/20 skew-x-12 translate-x-12 group-hover:-translate-x-32 transition-transform duration-700"></div>
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  <span className="relative">Segnala Criticità</span>
                  <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-md text-[8px] font-black tracking-tighter">BGS-2026</span>
                </Link>
              </div>

              <button 
                onClick={handleAdminToggle} 
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${isAdmin ? 'bg-naro-gold text-naro-navy border-naro-gold hover:opacity-90' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
              >
                {isAdmin ? 'Esci Admin' : 'Area Admin'}
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              <button 
                onClick={() => {
                  if (!voiceAssistantActive) {
                    startGlobalVoice();
                    setVoiceAssistantActive(true);
                  }
                }} 
                className={`p-2 rounded-lg ${voiceAssistantActive ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
              >
                <Mic className={`w-5 h-5 ${voiceAssistantActive ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={() => setIsHighContrast(!isHighContrast)} 
                className={`p-2 rounded-lg ${isHighContrast ? 'bg-naro-gold text-naro-navy' : 'bg-slate-100 text-slate-600'}`}
              >
                <Accessibility className="w-5 h-5" />
              </button>
              <FullscreenToggle />
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 hover:text-naro-navy">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
            <div className="px-4 pt-2 pb-4 space-y-2">
              <Link to="/" onClick={closeMobileMenu} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-naro-navy">Home</Link>
              <Link to="/utility" onClick={closeMobileMenu} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-naro-navy">Hub Utility</Link>
              <Link to="/calcolo-imu" onClick={closeMobileMenu} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-naro-navy">Calcolo IMU</Link>
              <Link to="/tari-timeline" onClick={closeMobileMenu} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-naro-navy">TARI</Link>
              <Link to="/canone-unico" onClick={closeMobileMenu} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-naro-navy">Canone Unico</Link>
              <Link to="/territorio" onClick={closeMobileMenu} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-naro-navy">Territorio</Link>
              <Link to="/petizioni" onClick={closeMobileMenu} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-naro-navy">Istanze Civiche</Link>
              <Link to="/trasparenza" onClick={closeMobileMenu} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-naro-navy">Trasparenza</Link>
              <Link to="/numeri-utili" onClick={closeMobileMenu} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-naro-navy">Numeri Utili</Link>
              <Link to="/normative" onClick={closeMobileMenu} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-naro-navy">Normative & Leggi</Link>
              <Link to="/segnalazione-guasti" onClick={closeMobileMenu} className="block w-full text-left px-3 py-2 rounded-md text-base font-bold text-red-600 bg-red-50 hover:bg-red-100">
                Segnala Criticità
              </Link>
              <button onClick={handleAdminToggle} className="block w-full text-left px-3 py-2 rounded-md text-base font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 mt-2">
                 {isAdmin ? 'Esci Admin' : 'Area Admin'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow relative">
        <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-naro-navy"></div></div>}>
          <Routes>
            <Route path="/" element={
              <>
                <Helmet><title>Home - NaroInComune</title></Helmet>
                <HomeTab navigate={(path) => navigate(path === 'home' ? '/' : `/${path}`)} news={news} onRefresh={refreshData} />
              </>
            } />
            <Route path="/news/:id" element={
              <>
                <Helmet><title>Dettaglio Notizia - NaroInComune</title></Helmet>
                <NewsDetail news={news} onRefresh={refreshData} currentUser={currentUser} />
              </>
            } />
            <Route path="/utility" element={
              <>
                <Helmet><title>Hub Utility - NaroInComune</title></Helmet>
                <UtilityTab isAdmin={isAdmin} />
              </>
            } />
            <Route path="/calcolo-imu" element={
              <>
                <Helmet><title>Calcolo IMU - NaroInComune</title></Helmet>
                <CalcoloIMU />
              </>
            } />
            <Route path="/tributi" element={
              <>
                <Helmet><title>Tributi Locali - NaroInComune</title></Helmet>
                <Tributi />
              </>
            } />
            <Route path="/rndt" element={
              <>
                <Helmet><title>RNDT - NaroInComune</title></Helmet>
                <RNDTPage />
              </>
            } />
            <Route path="/tari-timeline" element={
              <>
                <Helmet><title>TARI Timeline - NaroInComune</title></Helmet>
                <TARITimeline />
              </>
            } />
            <Route path="/calcolo-tari" element={
              <>
                <Helmet><title>Calcolo TARI - NaroInComune</title></Helmet>
                <TARICalc />
              </>
            } />
            <Route path="/canone-unico" element={
              <>
                <Helmet><title>Canone Unico - NaroInComune</title></Helmet>
                <CanoneUnico />
              </>
            } />
            <Route path="/delibere" element={
              <>
                <Helmet><title>Delibere & Atti - NaroInComune</title></Helmet>
                <DelibereNaro preview={true} />
              </>
            } />
            <Route path="/immutabili" element={
              <>
                <Helmet><title>Registri Immutabili - NaroInComune</title></Helmet>
                <Immutabili />
              </>
            } />
            <Route path="/territorio" element={
              <>
                <Helmet><title>Monitoraggio Territorio - NaroInComune</title></Helmet>
                <TerritorioTab monitoring={monitoring} />
              </>
            } />
            <Route path="/segnalazione-guasti" element={
              <>
                <Helmet><title>Segnalazione Guasti - NaroInComune</title></Helmet>
                <SegnalazioneGuasti />
              </>
            } />
            <Route path="/tracking-istanza" element={
              <>
                <Helmet><title>Tracking Istanza - NaroInComune</title></Helmet>
                <TrackReporting />
              </>
            } />
            <Route path="/opendata" element={
              <>
                <Helmet><title>Open Data & Trasparenza - NaroInComune</title></Helmet>
                <OpenDataDashboard reports={reports} />
              </>
            } />
            <Route path="/petizioni" element={
              <>
                <Helmet><title>Istanze Civiche - NaroInComune</title></Helmet>
                <PetizioniTab petitions={petitions} userSignatures={userSignatures} onRefresh={refreshData} />
              </>
            } />
            <Route path="/istanza/:id" element={
              <PetizioniTab petitions={petitions} userSignatures={userSignatures} onRefresh={refreshData} />
            } />
            <Route path="/trasparenza" element={
              <>
                <Helmet><title>Amministrazione Trasparente - NaroInComune</title></Helmet>
                <TrasparenzaTab />
              </>
            } />
            <Route path="/numeri-utili" element={
              <>
                <Helmet><title>Numeri Utili - NaroInComune</title></Helmet>
                <UsefulNumbers />
              </>
            } />
            <Route path="/normative" element={
              <>
                <Helmet><title>Normative - NaroInComune</title></Helmet>
                <Regulations />
              </>
            } />
            <Route path="/admin" element={
              isAdmin ? (
                <>
                  <Helmet><title>Area Admin - NaroInComune</title></Helmet>
                  <AdminTab news={news} petitions={petitions} categories={categories} reports={reports} onRefresh={refreshData} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
                  <ShieldAlert className="w-16 h-16 mb-4 text-slate-300" />
                  <h2 className="text-2xl font-bold text-slate-700">Accesso Negato</h2>
                  <p>Devi attivare la modalità Admin per accedere a questa sezione.</p>
                  <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-naro-navy text-white rounded-lg font-bold hover:opacity-90 transition-colors">
                    Torna alla Home
                  </button>
                </div>
              )
            } />
          </Routes>
        </Suspense>
        
        {/* AI Assistant Floating Button */}
        <AIAssistant />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </HelmetProvider>
  );
}
