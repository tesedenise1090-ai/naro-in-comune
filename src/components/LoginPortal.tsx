import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageService } from '../services/storage';
import { ShieldCheck, UserPlus, LogIn, Mail, Lock, Eye, EyeOff, Calendar, User, ArrowRight, CheckCircle2, ShieldAlert, ChevronRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';

interface LoginPortalProps {
  onLogin: (role: 'citizen' | 'technician' | 'admin', userData?: any) => void;
}

export function LoginPortal({ onLogin }: LoginPortalProps) {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Registration Form State
  const [regForm, setRegForm] = useState({
    nome: '',
    cognome: '',
    dataNascita: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if "Remember Me" is active on load
  useEffect(() => {
    const savedUser = localStorage.getItem('naro_remembered_user');
    if (savedUser) {
      const data = JSON.parse(savedUser);
      onLogin('citizen', data);
    }
  }, [onLogin]);

  const validatePassword = (pw: string) => {
    return pw.length >= 8;
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (regForm.password !== regForm.confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }

    if (!validatePassword(regForm.password)) {
      setError('La password deve essere di almeno 8 caratteri.');
      return;
    }

    // Simulate account creation
    const userId = `NARO-${Math.floor(Math.random() * 100000)}`;
    const userData = { ...regForm, userId };
    
    // Log registration
    StorageService.logAction('CREATE', 'USER_ACCOUNT', userId, { email: regForm.email });

    setSuccess(`Account creato con successo! Il tuo ID è ${userId}`);
    
    setTimeout(async () => {
      try { await signInAnonymously(auth); } catch (e) { console.error("Anonymous auth failed", e); }
      if (rememberMe) {
        localStorage.setItem('naro_remembered_user', JSON.stringify(userData));
      }
      onLogin('citizen', userData);
    }, 1500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // For staff/admin simulation
    if (loginForm.identifier === 'admin' && loginForm.password === 'admin123') {
      try { await signInAnonymously(auth); } catch (e) {}
      StorageService.logAction('LOGIN', 'STAFF_ACCOUNT', 'admin', { type: 'administrator' });
      onLogin('admin');
      return;
    }

    // Typical citizen login simulation
    if (loginForm.identifier && loginForm.password.length >= 8) {
      try { await signInAnonymously(auth); } catch (e) {}
      const userData = { email: loginForm.identifier, nome: 'Cittadino' };
      StorageService.logAction('LOGIN', 'USER_ACCOUNT', loginForm.identifier);
      if (rememberMe) {
        localStorage.setItem('naro_remembered_user', JSON.stringify(userData));
      }
      onLogin('citizen', userData);
    } else {
      setError('Credenziali non valide o password troppo corta.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-900">
      {/* Dynamic Video Background Container */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          poster="https://tse1.mm.bing.net/th/id/OIP.Mg8o-eoGL04NCS6lqzdbVQHaEK?cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3"
          className="absolute min-w-full min-h-full object-cover opacity-70 scale-105"
          style={{ filter: 'brightness(0.4) saturate(1.4) contrast(1.1)' }}
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-clouds-and-sun-over-a-mountain-landscape-11667-large.mp4" type="video/mp4" />
          {/* Sostituire il link sopra con un video istituzionale di Naro quando disponibile */}
        </video>
        
        {/* Layer cinematici di profondità */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/40"></div>
        <div className="absolute inset-0 bg-naro-navy/20 backdrop-blur-[1px]"></div>
        
        {/* Storytelling Digitale - Captions */}
        <div className="absolute bottom-10 left-10 hidden lg:block max-w-sm">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2, duration: 1 }}
            className="text-white border-l-2 border-naro-gold pl-6"
          >
            <p className="text-[10px] font-black tracking-widest uppercase text-naro-gold mb-2">Benvenuti a Naro</p>
            <h2 className="text-3xl font-black leading-none mb-3">La Fulgentissima</h2>
            <p className="text-xs text-white/60 leading-relaxed font-medium">Scopri il portale dei servizi digitali evoluti del Comune di Naro. Sicurezza, trasparenza e partecipazione.</p>
          </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 1, ease: "easeOut" }}
        className="max-w-md w-full bg-white/10 backdrop-blur-[40px] rounded-[3.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 relative z-10"
      >
        <div className="p-12 relative overflow-hidden">
          {/* Elemento decorativo interno */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-naro-gold/10 rounded-full blur-3xl"></div>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            className="w-28 h-28 bg-white/95 backdrop-blur-md rounded-[2.5rem] mx-auto mb-10 flex items-center justify-center p-4 shadow-[0_20px_40px_rgba(0,0,0,0.2)] relative z-20 group"
          >
            <div className="absolute inset-0 bg-naro-gold rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-700"></div>
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Naro-Stemma.svg/960px-Naro-Stemma.svg.png" alt="Stemma Naro" className="w-full h-full object-contain relative z-10" />
          </motion.div>

          <div className="text-center mb-12 relative z-20">
            <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter leading-none">Comune di <span className="text-naro-gold underline decoration-4 underline-offset-8">Naro</span></h1>
            <p className="text-white/50 text-[10px] font-black tracking-[0.4em] uppercase mt-6">Gateway Istituzionale</p>
          </div>

          <AnimatePresence mode="wait">
            {view === 'login' ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    required 
                    type="text" 
                    placeholder="Email o ID Utente" 
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-naro-gold outline-none transition-all"
                    value={loginForm.identifier}
                    onChange={e => setLoginForm({...loginForm, identifier: e.target.value})}
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password" 
                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-naro-gold outline-none transition-all"
                    value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between px-2">
                  <label className="flex items-center text-xs text-white/60 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                    />
                    <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-naro-gold border-naro-gold' : 'bg-white/10 border-white/20 group-hover:border-naro-gold'}`}>
                      {rememberMe && <CheckCircle2 className="w-3 h-3 text-naro-navy" />}
                    </div>
                    Ricordami
                  </label>
                  <button type="button" className="text-xs font-bold text-naro-gold hover:underline">Password dimenticata?</button>
                </div>

                {error && <div className="p-3 bg-red-500/20 backdrop-blur-md text-red-200 text-xs rounded-xl flex items-center border border-red-500/30"><ShieldAlert className="w-4 h-4 mr-2" /> {error}</div>}

                <button type="submit" className="w-full py-5 bg-naro-gold text-naro-navy rounded-[1.5rem] font-black shadow-2xl shadow-naro-gold/20 hover:bg-white active:scale-95 transition-all flex items-center justify-center uppercase tracking-widest text-xs group">
                  Entra nel Sistema <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-center text-xs text-white/40">
                  Non hai un account? <button type="button" onClick={() => setView('register')} className="text-naro-gold font-bold hover:underline">Registrati ora</button>
                </p>
              </motion.form>
            ) : (
              <motion.form 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input required placeholder="Nome" className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-white/30 focus:ring-2 focus:ring-naro-gold outline-none" value={regForm.nome} onChange={e => setRegForm({...regForm, nome: e.target.value})} />
                  </div>
                  <div className="relative">
                    <input required placeholder="Cognome" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-white/30 focus:ring-2 focus:ring-naro-gold outline-none" value={regForm.cognome} onChange={e => setRegForm({...regForm, cognome: e.target.value})} />
                  </div>
                </div>

                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input required type="date" placeholder="Data di Nascita" className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white/60 focus:ring-2 focus:ring-naro-gold outline-none" value={regForm.dataNascita} onChange={e => setRegForm({...regForm, dataNascita: e.target.value})} />
                </div>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input required type="email" placeholder="Indirizzo Email" className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-white/30 focus:ring-2 focus:ring-naro-gold outline-none" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password" 
                    className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-white/30 focus:ring-2 focus:ring-naro-gold outline-none"
                    value={regForm.password}
                    onChange={e => setRegForm({...regForm, password: e.target.value})}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    required 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Conferma Password" 
                    className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-white/30 focus:ring-2 focus:ring-naro-gold outline-none"
                    value={regForm.confirmPassword}
                    onChange={e => setRegForm({...regForm, confirmPassword: e.target.value})}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && <div className="p-3 bg-red-500/20 backdrop-blur-md text-red-200 text-[10px] rounded-lg border border-red-500/30"> {error} </div>}
                {success && <div className="p-3 bg-emerald-500/20 backdrop-blur-md text-emerald-200 text-[10px] rounded-lg flex items-center font-bold border border-emerald-500/30"> <CheckCircle2 className="w-3 h-3 mr-2" /> {success} </div>}

                <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/40 mt-2 active:scale-95 transition-all uppercase tracking-widest text-[10px]">
                  Crea Account Istituzionale
                </button>

                <p className="text-center text-[10px] text-white/40">
                  Hai già un account? <button type="button" onClick={() => setView('login')} className="text-naro-gold font-bold hover:underline">Accedi qui</button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em]">Sessione Protetta da Crittografia AES-256</p>
        </div>
      </motion.div>
    </div>
  );
}
