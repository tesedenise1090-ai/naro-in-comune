import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFService } from './pdfService';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

// --- INITIAL MOCK DATA ---
const INITIAL_NEWS = [
  { 
    id: 1, 
    titolo: "Nuovo piano viabilità centro storico", 
    categoria: "Viabilità",
    descrizione_breve: "Approvato il nuovo piano traffico.",
    descrizione_lunga: "Il comune ha approvato il nuovo piano per la viabilità del centro storico, prevedendo nuove aree pedonali e limiti di velocità a 30km/h. I lavori inizieranno a breve.", 
    immagine_url: "https://picsum.photos/seed/viabilita/800/400", 
    data: "2023-10-15", 
    evidenza: true,
    views: 120,
    likes: 45,
    comments: []
  },
  { 
    id: 2, 
    titolo: "Allerta meteo arancione per il weekend", 
    categoria: "Ambiente",
    descrizione_breve: "Previste forti piogge.",
    descrizione_lunga: "Previste forti piogge e temporali per tutto il fine settimana. Si raccomanda prudenza negli spostamenti e di evitare le zone a rischio idrogeologico.", 
    immagine_url: "https://picsum.photos/seed/meteo/800/400", 
    data: "2023-10-18", 
    evidenza: true,
    views: 350,
    likes: 12,
    comments: []
  },
];

const INITIAL_ENTITIES = [
  { id: 1, nome: "Comune di Naro", email: "protocollo@comune.naro.ag.it", tipo: "Comune" },
  { id: 2, nome: "Protezione Civile", email: "protezionecivile@regione.sicilia.it", tipo: "Ente Regionale" },
  { id: 3, nome: "ASP Agrigento", email: "urp@aspag.it", tipo: "Sanità" }
];

const INITIAL_PETITIONS = [
  { 
    id: 1, 
    titolo: "Messa in sicurezza Via Roma", 
    descrizione: "Richiesta di dossi artificiali e nuovo asfalto.", 
    ente_id: 1, 
    stato: "aperta", 
    quorum: 500, 
    firme: 342, 
    lat: 37.294, 
    lng: 13.794, 
    categoria: "Viabilità",
    immagine_url: "https://picsum.photos/seed/viaroma/800/400",
    data_invio: "2023-09-01",
    data_scadenza: "2023-12-31",
    data_modifica: "2023-09-01"
  },
];

const INITIAL_MONITORING = [
  { id: 1, zona: "Versante Nord (Ex Frana 2004)", rischio: "Idrogeologico", stato: "gialla" },
  { id: 2, zona: "Torrente Valle", rischio: "Esondazione", stato: "verde" },
];

const INITIAL_CATEGORIES = [
  { id: 1, nome: "Viabilità", immagine_url: "https://picsum.photos/seed/road/200/200", descrizione: "Gestione strade e traffico" },
  { id: 2, nome: "Sanità", immagine_url: "https://picsum.photos/seed/health/200/200", descrizione: "Servizi sanitari e ospedalieri" },
  { id: 3, nome: "Ambiente", immagine_url: "https://picsum.photos/seed/nature/200/200", descrizione: "Tutela del territorio e verde pubblico" },
  { id: 4, nome: "Sicurezza", immagine_url: "https://picsum.photos/seed/security/200/200", descrizione: "Ordine pubblico e sicurezza urbana" }
];

// --- STORAGE SERVICE ---

const STORAGE_KEYS = {
  NEWS: 'civica_news',
  PETITIONS: 'civica_petitions',
  MONITORING: 'civica_monitoring',
  CATEGORIES: 'civica_categories',
  USER_SIGNATURES: 'civica_user_signatures', // IDs of petitions signed by current user
  ENTITIES: 'civica_entities',
  ALL_SIGNATURES: 'civica_all_signatures', // Detailed signatures: { petitionId, name, surname, cf, date }
  REPORTS: 'civica_reports',
  REPORT_DRAFT: 'civica_report_draft',
  AUDIT_LOG: 'civica_audit_log',
  SYSTEM_CONFIG: 'civica_system_config',
  PROTOCOL_COUNTER: 'civica_protocol_counter',
  BILLS: 'civica_bills',
  NOTIFICATIONS: 'civica_notifications'
};

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SIGN' | 'LOGIN' | 'PDF_GEN';
  entityType: string;
  entityId: string | number;
  metadata?: any;
}

export interface ReportContent {
  nome: string;
  luogoNascita: string;
  dataNascita: string;
  residenza: string;
  via: string;
  civico: string;
  telefono: string;
  email: string;
  fondoStradale: string[];
  marciapiede: string[];
  illuminazione: string[];
  idrico: string[];
  tombini: string[];
  rifiuti: string[];
  randagismo: string[];
  dissesto: string[];
  infrastrutture: string[];
  spuntaAltro: boolean;
  altro: string;
  coordinate?: string;
  pagamentoEffettuato: boolean;
  luogoSegnalazioneVia: string;
  luogoSegnalazioneCivico: string;
  consapevolezza: boolean;
  privacy: boolean;
  responsabileId?: number;
}

export const RESPONSABILI = [
  { id: 1, nome: "Geom. Calogero Rizzo", ufficio: "Settore Tecnico - Manutenzioni Stradali", email: "manutenzioni@comune.naro.ag.it", ambiti: ["fondoStradale", "marciapiede", "tombini"] },
  { id: 2, nome: "Ing. Salvatore Amato", ufficio: "Settore Tecnico - Impianti e Illuminazione", email: "impianti@comune.naro.ag.it", ambiti: ["illuminazione"] },
  { id: 3, nome: "Geom. Filippo Bellanca", ufficio: "Settore Tecnico - Servizio Idrico", email: "idrico@comune.naro.ag.it", ambiti: ["idrico"] },
  { id: 4, nome: "Dott.ssa Rosa Maria Gallo", ufficio: "Ufficio Ecologia e Ambiente", email: "ambiente@comune.naro.ag.it", ambiti: ["rifiuti"] },
  { id: 5, nome: "Comando P.M.", ufficio: "Polizia Municipale", email: "poliziamunicipale@comune.naro.ag.it", ambiti: ["randagismo"] },
  { id: 6, nome: "Ufficio Protocollo", ufficio: "Affari Generali", email: "protocollo@comune.naro.ag.it", ambiti: ["altro"] },
  { id: 7, nome: "Dott. Ing. G. Di Gangi", ufficio: "Protezione Civile — Area Tecnica", email: "protezionecivile@pec.comunenaro.it", ambiti: ["dissesto", "infrastrutture"] }
];

export const StorageService = {
  // Initialize data if empty
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.NEWS)) localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(INITIAL_NEWS));
    if (!localStorage.getItem(STORAGE_KEYS.PETITIONS)) localStorage.setItem(STORAGE_KEYS.PETITIONS, JSON.stringify(INITIAL_PETITIONS));
    if (!localStorage.getItem(STORAGE_KEYS.MONITORING)) localStorage.setItem(STORAGE_KEYS.MONITORING, JSON.stringify(INITIAL_MONITORING));
    if (!localStorage.getItem(STORAGE_KEYS.USER_SIGNATURES)) localStorage.setItem(STORAGE_KEYS.USER_SIGNATURES, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    if (!localStorage.getItem(STORAGE_KEYS.ENTITIES)) localStorage.setItem(STORAGE_KEYS.ENTITIES, JSON.stringify(INITIAL_ENTITIES));
    if (!localStorage.getItem(STORAGE_KEYS.ALL_SIGNATURES)) localStorage.setItem(STORAGE_KEYS.ALL_SIGNATURES, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      const initialReports = [
        { 
          id: `BGS-2026-NARO-001`, 
          date: new Date().toISOString(),
          status: 'presa_in_carico', 
          priorita: 'alta',
          nome: 'Esposito Francesco',
          codiceFiscale: 'SPSFNC70A01E472T',
          tipoGuasto: 'Idrico',
          ubicazione: 'Via Dante, 42',
          descrizione: 'Perdita d\'acqua copiosa dal marciapiede.',
          responsabile: 'Geom. Filippo Bellanca'
        },
        { 
          id: `BGS-2026-NARO-002`, 
          date: new Date().toISOString(),
          status: 'ricevuta', 
          priorita: 'media',
          nome: 'Bianchi Giovanni',
          codiceFiscale: 'BNCGNN80A01E472Z',
          tipoGuasto: 'Illuminazione',
          ubicazione: 'Piazza Garibaldi',
          descrizione: 'Lampione spento da tre giorni.',
          responsabile: 'Ing. Salvatore Amato'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(initialReports));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOG)) localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.PROTOCOL_COUNTER)) localStorage.setItem(STORAGE_KEYS.PROTOCOL_COUNTER, "123");
    if (!localStorage.getItem(STORAGE_KEYS.BILLS)) localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  },

  getNextProtocol: () => {
    const counter = parseInt(localStorage.getItem(STORAGE_KEYS.PROTOCOL_COUNTER) || "0");
    const next = counter + 1;
    localStorage.setItem(STORAGE_KEYS.PROTOCOL_COUNTER, next.toString());
    return `BGS-2026-NARO-${next.toString().padStart(3, '0')}`;
  },

  // Getters
  getNews: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.NEWS) || '[]'),
  getPetitions: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PETITIONS) || '[]'),
  getMonitoring: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.MONITORING) || '[]'),
  getUserSignatures: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_SIGNATURES) || '[]'),
  getCategories: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]'),
  getEntities: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTITIES) || '[]'),
  getReports: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]'),
  getBills: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.BILLS) || '[]'),
  getNotifications: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]'),
  getAllSignatures: (petitionId?: number) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.ALL_SIGNATURES) || '[]');
    return petitionId ? all.filter((s: any) => s.petitionId === petitionId) : all;
  },

  // Actions
  logAction: async (action: AuditEntry['action'], entityType: string, entityId: string | number, metadata?: any) => {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOG) || '[]');
    const userStr = localStorage.getItem('naro_remembered_user');
    const user = userStr ? JSON.parse(userStr) : { cf: 'anonymous' };
    
    const entry: AuditEntry = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId: user.email || user.cf || 'anonymous',
      action,
      entityType,
      entityId,
      metadata: metadata || null
    };
    
    // Local Save
    const updatedLogs = [entry, ...logs].slice(0, 1000); // Keep last 1000 logs
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(updatedLogs));

    // Firestore Immutability Save
    try {
      await addDoc(collection(db, 'audit_logs'), {
        ...entry,
        timestamp: serverTimestamp(), // Use server time for legal certainty
        userId: auth.currentUser?.email || entry.userId
      });
    } catch (e) {
      console.warn("Audit Log Firestore sync failed (offline?), kept locally.", e);
    }
  },

  updateReportStatus: async (reportId: string, status: string, note: string) => {
    const reports = StorageService.getReports();
    const updatedReports = reports.map((r: any) => 
      r.id === reportId ? { ...r, status, adminNote: note, updatedAt: new Date().toISOString() } : r
    );
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updatedReports));
    
    // Simulate notification
    console.log(`Notification sent for ${reportId}: Nuova nota: ${note}. Nuovo stato: ${status}`);
    StorageService.logAction('UPDATE', 'REPORT', reportId, { status, note });

    return updatedReports;
  },

  // Firestore Sync Methods
  syncReportsToFirestore: async () => {
    const localReports = StorageService.getReports();
    for (const report of localReports) {
      const reportRef = doc(db, 'reports', report.id);
      await setDoc(reportRef, {
        ...report,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  },

  addReportFirestore: async (report: any) => {
    const protocolCode = StorageService.getNextProtocol();
    const responsabile = StorageService.getResponsabileForReport(report);
    const reportId = `REP-${Date.now().toString().slice(-6)}`;
    const newReport = {
      ...report,
      id: reportId,
      protocol: protocolCode,
      date: new Date().toISOString(),
      status: 'pending',
      responsabile: responsabile.nome,
      responsabileUfficio: responsabile.ufficio,
      createdAt: serverTimestamp()
    };

    // Save to Firestore
    await setDoc(doc(db, 'reports', reportId), newReport);
    
    // Log using unified audit system
    await StorageService.logAction('CREATE', 'REPORT', reportId, { tipo: report.tipoGuasto, protocol: protocolCode });
    
    return { ...newReport, protocol: protocolCode };
  },

  signPetitionFirestore: async (petitionId: number, userData: any) => {
    const protocolCode = StorageService.getNextProtocol();
    const petitions = StorageService.getPetitions();
    const petition = petitions.find((p: any) => p.id === petitionId);
    
    if (!petition) throw new Error("Istanza non trovata");

    // L'incremento del contatore firme dovrebbe idealmente avvenire in cloud via Cloud Functions,
    // ma lo mappiamo localmente per mantenere la reattività e poi sul doc signature.
    const updatedPetitions = petitions.map((p: any) => 
      p.id === petitionId ? { ...p, firme: p.firme + 1 } : p
    );
    localStorage.setItem(STORAGE_KEYS.PETITIONS, JSON.stringify(updatedPetitions));

    const signatures = StorageService.getUserSignatures();
    if (!signatures.includes(petitionId)) {
      signatures.push(petitionId);
      localStorage.setItem(STORAGE_KEYS.USER_SIGNATURES, JSON.stringify(signatures));
    }

    const signatureId = `SIG-${Date.now()}`;
    const signatureRecord = {
      id: signatureId,
      petitionId,
      ...userData,
      protocol: protocolCode,
      date: new Date().toISOString(),
      createdAt: serverTimestamp()
    };

    // Save to Firestore Blueprint Collection
    await setDoc(doc(db, 'signatures', signatureId), signatureRecord);

    await StorageService.logAction('SIGN', 'PETITION', petitionId, { cf: userData.cf, protocol: protocolCode });

    // Generazione della Receipt
    const pdfData: any = {
      title: "RICEVUTA DI PRESENTAZIONE ISTANZA",
      subtitle: petition.titolo,
      year: new Date().getFullYear(),
      date: new Date().toLocaleDateString("it-IT"),
      protocollo: protocolCode,
      uuid: signatureRecord.id,
      status: 'ACQUISITA - TRASMESSA PEC',
      contribuente: {
        nome: `${userData.nome} ${userData.cognome}`,
        cf: userData.cf,
        email: userData.email,
        comune: "Naro (AG)"
      },
      summaryItems: [
        { label: "Oggetto Istanza", value: petition.titolo.substring(0, 20) + '...', isAccent: true },
        { label: "Tipo", value: petition.categoria.toUpperCase() },
        { label: "Validità", value: "CERTIFICATA" }
      ],
      tables: [
        {
          title: "Dettaglio Sottoscrizione Elettronica",
          head: [["Campo", "Valore Informatico"]],
          body: [
            ["ID Petizione", petition.id.toString()],
            ["Protocollo Generale", protocolCode],
            ["Data/Ora Acquisizione", new Date(signatureRecord.date).toLocaleString()],
            ["Impronta Hash Autore", btoa(userData.cf).substring(0, 16)]
          ]
        }
      ]
    };

    await PDFService.generateInstitutionalPDF(pdfData, `Ricevuta_Istanza_${protocolCode.replace('/', '_')}.pdf`);

    return { updatedPetitions, protocol: protocolCode };
  },

  signPetition: async (petitionId: number, userData: any) => {
    const protocolCode = StorageService.getNextProtocol();
    const petitions = StorageService.getPetitions();
    const petition = petitions.find((p: any) => p.id === petitionId);
    
    if (!petition) return petitions;

    const updatedPetitions = petitions.map((p: any) => 
      p.id === petitionId ? { ...p, firme: p.firme + 1 } : p
    );
    localStorage.setItem(STORAGE_KEYS.PETITIONS, JSON.stringify(updatedPetitions));

    // Track user signature
    const signatures = StorageService.getUserSignatures();
    if (!signatures.includes(petitionId)) {
      signatures.push(petitionId);
      localStorage.setItem(STORAGE_KEYS.USER_SIGNATURES, JSON.stringify(signatures));
    }

    // Store detailed signature with Protocol
    const allSignatures = JSON.parse(localStorage.getItem(STORAGE_KEYS.ALL_SIGNATURES) || '[]');
    const signatureRecord = {
      id: `SIG-${Date.now()}`,
      petitionId,
      ...userData,
      protocol: protocolCode,
      date: new Date().toISOString()
    };
    allSignatures.push(signatureRecord);
    localStorage.setItem(STORAGE_KEYS.ALL_SIGNATURES, JSON.stringify(allSignatures));

    StorageService.logAction('SIGN', 'PETITION', petitionId, { cf: userData.cf, protocol: protocolCode });

    // Automatic Receipt Generation
    const pdfData: any = {
      title: "RICEVUTA DI PRESENTAZIONE ISTANZA",
      subtitle: petition.titolo,
      year: new Date().getFullYear(),
      date: new Date().toLocaleDateString("it-IT"),
      protocollo: protocolCode,
      uuid: signatureRecord.id,
      status: 'ACQUISITA - TRASMESSA PEC',
      contribuente: {
        nome: `${userData.nome} ${userData.cognome}`,
        cf: userData.cf,
        email: userData.email,
        comune: "Naro (AG)"
      },
      summaryItems: [
        { label: "Oggetto Istanza", value: petition.titolo.substring(0, 20) + '...', isAccent: true },
        { label: "Tipo", value: petition.categoria.toUpperCase() },
        { label: "Validità", value: "CERTIFICATA" }
      ],
      tables: [
        {
          title: "Dettaglio Sottoscrizione Elettronica",
          head: [["Campo", "Valore Informatico"]],
          body: [
            ["ID Petizione", petition.id.toString()],
            ["Protocollo Generale", protocolCode],
            ["Data/Ora Acquisizione", new Date(signatureRecord.date).toLocaleString()],
            ["Impronta Hash Autore", btoa(userData.cf).substring(0, 16)]
          ]
        }
      ]
    };

    await PDFService.generateInstitutionalPDF(pdfData, `Ricevuta_Istanza_${protocolCode.replace('/', '_')}.pdf`);

    return { updatedPetitions, protocol: protocolCode };
  },

  // News Management
  addNews: (newsItem: any) => {
    const news = StorageService.getNews();
    const newItem = { 
      ...newsItem, 
      id: Date.now(), 
      data: new Date().toISOString(),
      views: newsItem.views || 0,
      likes: newsItem.likes || 0,
      comments: newsItem.comments || []
    };
    const updatedNews = [newItem, ...news];
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(updatedNews));
    
    StorageService.logAction('CREATE', 'NEWS', newItem.id, { titolo: newItem.titolo });
    
    return updatedNews;
  },

  updateNews: (updatedItem: any) => {
    const news = StorageService.getNews();
    const updatedNews = news.map((n: any) => n.id === updatedItem.id ? updatedItem : n);
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(updatedNews));
    
    StorageService.logAction('UPDATE', 'NEWS', updatedItem.id, { titolo: updatedItem.titolo });
    
    return updatedNews;
  },

  toggleNewsEvidenza: (id: number) => {
    const news = StorageService.getNews();
    const updatedNews = news.map((n: any) => 
      n.id === id ? { ...n, evidenza: !n.evidenza } : n
    );
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(updatedNews));
    return updatedNews;
  },

  deleteNews: (id: number) => {
    const news = StorageService.getNews();
    const updatedNews = news.filter((n: any) => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(updatedNews));
    return updatedNews;
  },

  likeNews: (id: number) => {
    const news = StorageService.getNews();
    const updatedNews = news.map((n: any) => 
      n.id === id ? { ...n, likes: (n.likes || 0) + 1 } : n
    );
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(updatedNews));
    return updatedNews;
  },

  incrementNewsViews: (id: number) => {
    const news = StorageService.getNews();
    const updatedNews = news.map((n: any) => 
      n.id === id ? { ...n, views: (n.views || 0) + 1 } : n
    );
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(updatedNews));
    return updatedNews;
  },

  // Moderation filter
  moderateContent: (text: string) => {
    const forbiddenWords = ['scemo', 'cretino', 'offesa', 'insulto', 'spam', 'fake'];
    let moderatedText = text;
    forbiddenWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      moderatedText = moderatedText.replace(regex, '***');
    });
    return moderatedText;
  },

  addCommentToNews: async (newsId: number, comment: string, user: { nome: string, cognome: string, email: string }, parentId?: number) => {
    const news = StorageService.getNews();
    const moderatedText = StorageService.moderateContent(comment);
    
    const newComment = { 
      id: Date.now(),
      parentId: parentId || null,
      text: moderatedText, 
      author: `${user.nome} ${user.cognome}`,
      email: user.email,
      date: new Date().toISOString(),
      status: 'approved', // Auto-approved for now, but in reality would be 'pending'
      likes: 0
    };

    const updatedNews = news.map((n: any) => 
      n.id === newsId ? { 
        ...n, 
        comments: [
          ...(n.comments || []), 
          newComment
        ] 
      } : n
    );

    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(updatedNews));

    // Database Integration (Firestore)
    try {
      await addDoc(collection(db, 'news_comments'), {
        newsId,
        ...newComment,
        serverTimestamp: serverTimestamp()
      });
      
      // Audit log
      await StorageService.logAction('CREATE', 'COMMENT', newComment.id.toString(), { 
        newsId, 
        author: newComment.author 
      });
    } catch (e) {
      console.error("Firestore comment sync failed:", e);
    }

    return updatedNews;
  },

  likeComment: (newsId: number, commentId: number) => {
    const news = StorageService.getNews();
    const updatedNews = news.map((n: any) => {
      if (n.id === newsId) {
        return {
          ...n,
          comments: (n.comments || []).map((c: any) => 
            c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
          )
        };
      }
      return n;
    });
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(updatedNews));
    return updatedNews;
  },

  updateCommentStatus: (newsId: number, commentId: number, status: 'approved' | 'rejected') => {
    const news = StorageService.getNews();
    const updatedNews = news.map((n: any) => {
      if (n.id === newsId) {
        return {
          ...n,
          comments: n.comments.map((c: any) => 
            c.id === commentId ? { ...c, status } : c
          )
        };
      }
      return n;
    });
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(updatedNews));
    return updatedNews;
  },

  deleteComment: (newsId: number, commentId: number) => {
    const news = StorageService.getNews();
    const updatedNews = news.map((n: any) => {
      if (n.id === newsId) {
        return {
          ...n,
          comments: n.comments.filter((c: any) => c.id !== commentId)
        };
      }
      return n;
    });
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(updatedNews));
    return updatedNews;
  },

  moderateComment: (newsId: number, commentId: string | number, action: 'approve' | 'reject' | 'delete') => {
    if (action === 'delete') {
      return StorageService.deleteComment(newsId, Number(commentId));
    }
    const status = action === 'approve' ? 'approved' : 'rejected';
    return StorageService.updateCommentStatus(newsId, Number(commentId), status);
  },

  // Petitions Management
  addPetition: (petition: any) => {
    const petitions = StorageService.getPetitions();
    const newPetition = { 
      ...petition, 
      id: Date.now(),
      firme: petition.firme !== undefined ? petition.firme : 0,
      stato: petition.stato || 'aperta',
      data_invio: new Date().toISOString(),
      data_modifica: new Date().toISOString(),
      lat: petition.lat || 37.294, 
      lng: petition.lng || 13.794,
      pdf_downloads: 0
    };
    
    if (!newPetition.immagine_url) {
      newPetition.immagine_url = `https://source.unsplash.com/800x400/?${encodeURIComponent(newPetition.categoria)}`;
    }

    const updatedPetitions = [newPetition, ...petitions];
    localStorage.setItem(STORAGE_KEYS.PETITIONS, JSON.stringify(updatedPetitions));
    return updatedPetitions;
  },

  updatePetition: (updatedPetition: any) => {
    const petitions = StorageService.getPetitions();
    const updatedPetitions = petitions.map((p: any) => 
      p.id === updatedPetition.id ? { ...updatedPetition, data_modifica: new Date().toISOString() } : p
    );
    localStorage.setItem(STORAGE_KEYS.PETITIONS, JSON.stringify(updatedPetitions));
    return updatedPetitions;
  },

  deletePetition: (id: number) => {
    const petitions = StorageService.getPetitions();
    const updatedPetitions = petitions.filter((p: any) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PETITIONS, JSON.stringify(updatedPetitions));
    return updatedPetitions;
  },

  incrementPdfDownload: (id: number) => {
    const petitions = StorageService.getPetitions();
    const updatedPetitions = petitions.map((p: any) => 
      p.id === id ? { ...p, pdf_downloads: (p.pdf_downloads || 0) + 1 } : p
    );
    localStorage.setItem(STORAGE_KEYS.PETITIONS, JSON.stringify(updatedPetitions));
    return updatedPetitions;
  },

  // Categories Management
  addCategory: (category: any) => {
    const categories = StorageService.getCategories();
    const newCategory = { id: Date.now(), ...category };
    const updatedCategories = [...categories, newCategory];
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updatedCategories));
    return updatedCategories;
  },

  deleteCategory: (id: number) => {
    const categories = StorageService.getCategories();
    const updatedCategories = categories.filter((c: any) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updatedCategories));
    return updatedCategories;
  },

  updateCategory: (updatedCategory: any) => {
    const categories = StorageService.getCategories();
    const updatedCategories = categories.map((c: any) => 
      c.id === updatedCategory.id ? updatedCategory : c
    );
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updatedCategories));
    return updatedCategories;
  },

  // Entities Management
  addEntity: (entity: any) => {
    const entities = StorageService.getEntities();
    const newEntity = { id: Date.now(), ...entity };
    const updatedEntities = [...entities, newEntity];
    localStorage.setItem(STORAGE_KEYS.ENTITIES, JSON.stringify(updatedEntities));
    return updatedEntities;
  },

  deleteEntity: (id: number) => {
    const entities = StorageService.getEntities();
    const updatedEntities = entities.filter((e: any) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.ENTITIES, JSON.stringify(updatedEntities));
    return updatedEntities;
  },

  updateEntity: (updatedEntity: any) => {
    const entities = StorageService.getEntities();
    const updatedEntities = entities.map((e: any) => 
      e.id === updatedEntity.id ? updatedEntity : e
    );
    localStorage.setItem(STORAGE_KEYS.ENTITIES, JSON.stringify(updatedEntities));
    return updatedEntities;
  },

  // Reports Management
  getResponsabileForReport: (report: any) => {
    if (report.dissesto && report.dissesto.length > 0) return RESPONSABILI[6];
    if (report.infrastrutture && report.infrastrutture.length > 0) return RESPONSABILI[6];
    // Check if any specific category is selected
    if (report.fondoStradale && report.fondoStradale.length > 0) return RESPONSABILI[0];
    if (report.marciapiede && report.marciapiede.length > 0) return RESPONSABILI[0];
    if (report.tombini && report.tombini.length > 0) return RESPONSABILI[0];
    if (report.illuminazione && report.illuminazione.length > 0) return RESPONSABILI[1];
    if (report.idrico && report.idrico.length > 0) return RESPONSABILI[2];
    if (report.rifiuti && report.rifiuti.length > 0) return RESPONSABILI[3];
    if (report.randagismo && report.randagismo.length > 0) return RESPONSABILI[4];
    return RESPONSABILI[5]; // Default to Protocollo
  },

  addReport: (report: any) => {
    const protocolCode = StorageService.getNextProtocol();
    const reports = StorageService.getReports();
    const responsabile = StorageService.getResponsabileForReport(report);
    const newReport = { 
      ...report, 
      id: protocolCode, 
      protocol: protocolCode,
      date: new Date().toISOString(),
      status: 'ricevuta',
      responsabile: responsabile.nome,
      responsabileUfficio: responsabile.ufficio
    };
    const updatedReports = [newReport, ...reports];
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updatedReports));
    
    StorageService.logAction('CREATE', 'REPORT', newReport.id, { 
      tipo: newReport.tipoGuasto, 
      responsabile: newReport.responsabile,
      protocol: protocolCode
    });
    
    return { reports: updatedReports, protocol: protocolCode };
  },


  deleteReport: (id: string | number) => {
    const reports = StorageService.getReports();
    const updatedReports = reports.filter((r: any) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updatedReports));
    return updatedReports;
  },

  // Bills Management
  addBill: (bill: any) => {
    const bills = StorageService.getBills();
    const newBill = { 
      ...bill, 
      id: `BILL-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updatedBills = [newBill, ...bills];
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(updatedBills));
    StorageService.logAction('CREATE', 'BILL', newBill.id, { amount: bill.importo, provider: bill.fornitore });
    StorageService.checkBillScadenza(newBill);
    return updatedBills;
  },

  updateBill: (updatedBill: any) => {
    const bills = StorageService.getBills();
    const updatedBills = bills.map((b: any) => b.id === updatedBill.id ? updatedBill : b);
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(updatedBills));
    StorageService.logAction('UPDATE', 'BILL', updatedBill.id, { status: updatedBill.stato });
    StorageService.checkBillScadenza(updatedBill);
    return updatedBills;
  },

  deleteBill: (id: string) => {
    const bills = StorageService.getBills();
    const updatedBills = bills.filter((b: any) => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(updatedBills));
    return updatedBills;
  },

  checkBillScadenza: (bill: any) => {
    if (bill.stato === 'Da Pagare') {
      const scadenza = new Date(bill.scadenza);
      const oggi = new Date();
      const diffTime = scadenza.getTime() - oggi.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
        StorageService.addNotification({
          type: 'alert',
          title: 'Scadenza Bolletta',
          message: `La bolletta di ${bill.fornitore} da €${bill.importo} scade fra ${diffDays} giorni.`,
          relatedId: bill.id
        });
      }
    }
  },

  // Notifications Management
  addNotification: (notif: { type: 'alert' | 'info' | 'success', title: string, message: string, relatedId?: string }) => {
    const notifs = StorageService.getNotifications();
    const newNotif = {
      ...notif,
      id: `NOTIF-${Date.now()}`,
      date: new Date().toISOString(),
      read: false
    };
    const updatedNotifs = [newNotif, ...notifs];
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifs));
    return updatedNotifs;
  },

  markNotificationAsRead: (id: string) => {
    const notifs = StorageService.getNotifications();
    const updatedNotifs = notifs.map((n: any) => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifs));
    return updatedNotifs;
  },

  clearNotifications: () => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    return [];
  },


  // PDF Generation
  generatePDF: async (petition: any) => {
    const signatures = StorageService.getAllSignatures(petition.id);
    
    const pdfData: any = {
      title: "Raccolta Firme Istanza Civica",
      subtitle: petition.titolo,
      year: new Date().getFullYear(),
      date: new Date().toLocaleDateString("it-IT"),
      protocollo: `PET-${petition.id}`,
      uuid: `SIGN-${petition.id}-${signatures.length}`,
      status: petition.stato === 'aperta' ? 'RICEVUTA' : 'APPROVATA',
      summaryItems: [
        { label: "Totale Firme", value: signatures.length.toString(), isAccent: true },
        { label: "Quorum", value: petition.quorum.toString() },
        { label: "Stato", value: petition.stato.toUpperCase() }
      ],
      tables: [
        {
          title: "Elenco Firmatari Certificati",
          head: [['#', 'Nome', 'Cognome', 'Codice Fiscale', 'Data']],
          body: signatures.map((s: any, index: number) => [
            index + 1,
            s.nome,
            s.cognome,
            s.cf,
            new Date(s.date).toLocaleDateString()
          ])
        }
      ]
    };

    await PDFService.generateInstitutionalPDF(pdfData, `Raccolta_Firme_${petition.id}.pdf`);
    
    // Log PDF Generation for legal audit
    StorageService.logAction('PDF_GEN', 'PETITION_SIGS', petition.id, { total: signatures.length });

    // Increment download count
    StorageService.incrementPdfDownload(petition.id);
  },

  generateSinglePetitionReport: async (petition: any) => {
    const pdfData: any = {
      title: "Report Analitico Petizione",
      subtitle: petition.titolo,
      year: new Date().getFullYear(),
      date: new Date().toLocaleDateString("it-IT"),
      protocollo: `REP-PET-${petition.id}`,
      uuid: `STAT-${petition.id}`,
      status: 'APPROVATA',
      summaryItems: [
        { label: "Firme", value: `${petition.firme} / ${petition.quorum}`, isAccent: true },
        { label: "Percentuale", value: `${Math.min(Math.round((petition.firme / petition.quorum) * 100), 100)}%` },
        { label: "Download", value: (petition.pdf_downloads || 0).toString() }
      ],
      tables: [
        {
          title: "Indicatori di Partecipazione",
          head: [["Metrica", "Valore"]],
          body: [
            ["Categoria", petition.categoria],
            ["Stato Progetto", petition.stato.toUpperCase()],
            ["Ultimo Aggiornamento", new Date(petition.data_modifica).toLocaleDateString()]
          ]
        }
      ]
    };

    await PDFService.generateInstitutionalPDF(pdfData, `Report_Petizione_${petition.id}.pdf`);
  },

  generateGlobalReport: async () => {
    const petitions = StorageService.getPetitions();
    
    const pdfData: any = {
      title: "Report Globale Partecipazione Civica",
      subtitle: "Consuntivo Attività Portale NaroInComune",
      year: new Date().getFullYear(),
      date: new Date().toLocaleDateString("it-IT"),
      protocollo: `GLOB-${Date.now()}`,
      uuid: `AUDIT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      summaryItems: [
        { label: "Totale Petizioni", value: petitions.length.toString(), isAccent: true },
        { label: "Firme Totali", value: petitions.reduce((acc: number, p: any) => acc + p.firme, 0).toString() }
      ],
      tables: [
        {
          title: "Analisi di Dettaglio Petizioni",
          head: [['Titolo Petizione', 'Categoria', 'Stato', 'Firme', 'Download PDF']],
          body: petitions.map((p: any) => [
            p.titolo,
            p.categoria,
            p.stato,
            p.firme,
            p.pdf_downloads || 0
          ])
        }
      ]
    };

    await PDFService.generateInstitutionalPDF(pdfData, 'Report_Globale_Petizioni.pdf');
  },

  generateTerritoryPDF: async () => {
    const pdfData: any = {
      title: "Vademecum Protezione Civile",
      subtitle: "Manuale Operativo e Comportamentale Allerta Meteo",
      year: 2026,
      date: new Date().toLocaleDateString("it-IT"),
      protocollo: "PC-NARO-2026",
      uuid: "SIGILLO-VAD-PC-01",
      status: 'APPROVATA',
      summaryItems: [
        { label: "Ente", value: "Protezione Civile", isAccent: true },
        { label: "Ambito", value: "Emergenze" },
        { label: "Codice", value: "VAD-PC-01" }
      ],
      tables: [
        {
          title: "Istruzioni Operative e Comportamenti",
          head: [["Fase", "Azione Obbligatoria"]],
          body: [
            ["Prevenzione", "Monitorare canali ufficiali, verificare scoli."],
            ["Emergenza", "Staccare elettricità, salire ai piani alti."],
            ["Numeri Utili", "112 Emergenza, 115 Vigili del Fuoco."]
          ]
        },
        {
          title: "Contatti di Riferimento",
          head: [["Servizio", "Numero"]],
          body: [
            ["PROTEZIONE CIVILE NARO", "0922 123456"],
            ["POLIZIA MUNICIPALE", "0922 123459"],
            ["NUMERO UNICO", "112"]
          ]
        }
      ]
    };

    await PDFService.generateInstitutionalPDF(pdfData, 'Vademecum_Protezione_Civile_Naro.pdf');
  },

  getAuditLogs: () => {
    const logs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
    return logs ? JSON.parse(logs) : [];
  },
};
