import React, { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import BackToTop from "./BackToTop";
import BackButton from "./BackButton";

/* ─────────────────────────────────────────────────────────────────────────────
   DelibereNaro.tsx
   Portale pubblico delibere & atti amministrativi – Comune di Naro (AG)

   Props:
     apiBase  string   URL base API PHP  es. "https://tuosito.it/api"
     preview  boolean  true = dati mock (sviluppo/test)
───────────────────────────────────────────────────────────────────────────── */

interface Atto {
  id: number;
  tipo: string;
  tipo_label: string;
  anno: number;
  titolo: string;
  data_pub: string;
  dimensione: string;
  url: string;
}

interface Filters {
  anni: number[];
  tipi: { tipo: string; tipo_label: string }[];
}

interface Meta {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
const MOCK: Atto[] = [
  { id:1,  tipo:"CC", tipo_label:"Delibere Consiglio Comunale", anno:2024, titolo:"Approvazione del bilancio di previsione 2024-2026 e relativi allegati", data_pub:"15/01/2024", dimensione:"245 KB", url:"#" },
  { id:2,  tipo:"CC", tipo_label:"Delibere Consiglio Comunale", anno:2024, titolo:"Modifica al regolamento edilizio comunale — variante strutturale n.3", data_pub:"02/02/2024", dimensione:"318 KB", url:"#" },
  { id:3,  tipo:"DG", tipo_label:"Delibere Giunta Comunale",    anno:2024, titolo:"Approvazione schema di convenzione per i servizi socio-assistenziali", data_pub:"10/02/2024", dimensione:"190 KB", url:"#" },
  { id:4,  tipo:"DD", tipo_label:"Determine Dirigenziali",       anno:2024, titolo:"Affidamento servizio manutenzione strade comunali — annualità 2024", data_pub:"18/02/2024", dimensione:"122 KB", url:"#" },
  { id:5,  tipo:"DD", tipo_label:"Determine Dirigenziali",       anno:2024, titolo:"Liquidazione compenso RUP progetto riqualificazione Piazza Garibaldi", data_pub:"25/02/2024", dimensione:"98 KB",  url:"#" },
  { id:11, tipo:"DS", tipo_label:"Determinazioni Sindacali",     anno:2024, titolo:"Nomina Responsabile Protezione Civile Comunale", data_pub:"12/03/2024", dimensione:"110 KB", url:"#" },
  { id:6,  tipo:"CC", tipo_label:"Delibere Consiglio Comunale", anno:2023, titolo:"Adozione preliminare Piano Urbanistico Generale (PUG) del territorio", data_pub:"12/11/2023", dimensione:"540 KB", url:"#" },
  { id:7,  tipo:"DG", tipo_label:"Delibere Giunta Comunale",    anno:2023, titolo:"Nomina commissione valutazione offerte gara pubblica illuminazione LED", data_pub:"05/12/2023", dimensione:"88 KB",  url:"#" },
  { id:8,  tipo:"DS", tipo_label:"Determinazioni Sindacali",     anno:2023, titolo:"Ordinanza contingibile e urgente n.12 — sicurezza idrogeologica zona nord", data_pub:"30/10/2023", dimensione:"76 KB", url:"#" },
  { id:9,  tipo:"DD", tipo_label:"Determine Dirigenziali",       anno:2023, titolo:"Approvazione progetto definitivo restauro Chiesa Madre — lotto 2", data_pub:"08/09/2023", dimensione:"210 KB", url:"#" },
  { id:12, tipo:"DG", tipo_label:"Delibere Giunta Comunale",    anno:2023, titolo:"Piano di Azione per l'Energia Sostenibile (PAES) — Aggiornamento", data_pub:"15/07/2023", dimensione:"420 KB", url:"#" },
  { id:10, tipo:"CC", tipo_label:"Delibere Consiglio Comunale", anno:2022, titolo:"Approvazione Regolamento per la disciplina del COSAP", data_pub:"20/04/2022", dimensione:"155 KB", url:"#" },
  { id:13, tipo:"DS", tipo_label:"Determinazioni Sindacali",     anno:2022, titolo:"Ordinanza limitazione traffico centro storico periodo estivo", data_pub:"01/06/2022", dimensione:"65 KB", url:"#" },
];

const MOCK_FILTERS: Filters = {
  anni:[2024,2023,2022,2021,2020,2019],
  tipi:[
    {tipo:"CC",tipo_label:"Delibere Consiglio Comunale"},
    {tipo:"DG",tipo_label:"Delibere Giunta Comunale"},
    {tipo:"DD",tipo_label:"Determine Dirigenziali"},
    {tipo:"DS",tipo_label:"Determinazioni Sindacali"},
  ],
};

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C: any = {
  // Neutri carta
  bg:        "#f7f5f0",
  paper:     "#ffffff",
  paperWarm: "#fdfbf7",
  line:      "#e8e4dc",
  lineMid:   "#d4cfc4",
  // Testo
  ink:       "#1c1a16",
  inkMid:    "#4a4640",
  inkLight:  "#8a8680",
  inkFaint:  "#b8b4ac",
  // Accento istituzionale
  blue:      "#1a3d6b",
  blueMid:   "#2c5f8a",
  blueLight: "#4a85b8",
  blueFaint: "#e8f0f8",
  blueBorder:"#c0d4e8",
  // Status colori tipo
  CC: { bg:"#eef6ee", border:"#aed4ae", text:"#1e5c1e", pill:"#c8e8c8", label:"Consiglio Comunale" },
  DG: { bg:"#eef0f8", border:"#aab8d8", text:"#1a3068", pill:"#c8d4f0", label:"Giunta Comunale"    },
  DD: { bg:"#fdf3e8", border:"#d8bA88", text:"#6a3808", pill:"#f0d8a8", label:"Determine Dirig."   },
  DS: { bg:"#f5eef8", border:"#c4aad8", text:"#4a1870", pill:"#e0c8f0", label:"Det. Sindacali"     },
};

const tc = (t: string) => C[t] || { bg:"#f5f5f5", border:"#ddd", text:"#555", pill:"#eee", label:"—" };

// ── LEGGE INFO ────────────────────────────────────────────────────────────────
const LEGGE = [
  { id:"pub", icon:"📢", color:C.blue,
    title:"Obblighi di pubblicazione",
    norm:"TUEL D.Lgs. 267/2000 · D.Lgs. 33/2013",
    body:"I Comuni devono pubblicare i propri atti tramite l'Albo Pretorio online e la sezione «Amministrazione Trasparente». Sono soggetti a pubblicazione obbligatoria: delibere del Consiglio e della Giunta, determine dirigenziali, ordinanze del Sindaco, bandi di concorso e procedure di affidamento.",
    tags:["Albo Pretorio Online","Amm. Trasparente","15 giorni consecutivi"],
  },
  { id:"acc", icon:"🔓", color:"#1e6b3a",
    title:"Diritto di accesso del cittadino",
    norm:"L. 241/1990 · FOIA D.Lgs. 33/2013 art. 5",
    body:"L'Accesso Documentale (L. 241/90) consente a chiunque abbia un interesse diretto di richiedere copia di atti. L'Accesso Civico Generalizzato (FOIA) permette a chiunque di richiedere documenti ulteriori rispetto a quelli già pubblicati, senza necessità di motivare la richiesta. Il canale è l'Ufficio URP.",
    tags:["Accesso Documentale","FOIA","Ufficio URP","30 gg risposta"],
  },
  { id:"con", icon:"🗳️", color:"#5a2a80",
    title:"Diritti dei Consiglieri Comunali",
    norm:"Art. 43 TUEL — accesso ampliato",
    body:"I consiglieri comunali hanno accesso a tutte le notizie e informazioni utili all'espletamento del mandato, senza motivare la richiesta. Questo diritto più ampio rispetto al semplice cittadino è funzionale al controllo democratico sull'operato dell'amministrazione.",
    tags:["Art. 43 TUEL","Senza motivazione","Mandato elettivo"],
  },
  { id:"exc", icon:"🔒", color:"#6a3808",
    title:"Eccezioni al diritto di accesso",
    norm:"Limiti previsti dalla normativa",
    body:"Il diritto di accesso non è assoluto. Può essere negato per: tutela della riservatezza di terzi (dati sensibili, privacy), ragioni di sicurezza pubblica, segretezza istruttoria per atti preparatori ancora in corso di formazione.",
    tags:["Privacy","Sicurezza pubblica","Atti preparatori"],
  },
  { id:"san", icon:"⚠️", color:"#8a3010",
    title:"Sanzioni per omessa pubblicazione",
    norm:"D.Lgs. 33/2013 art. 46",
    body:"La mancata o tardiva pubblicazione costituisce illecito disciplinare con responsabilità erariale. Il responsabile è soggetto a sanzione amministrativa pecuniaria da 500 a 10.000 euro, oltre alle eventuali conseguenze disciplinari e penali.",
    tags:["500–10.000 €","Illecito disciplinare","Resp. erariale"],
  },
];

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
const Svg = {
  Search:   ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Download: ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  ChevronL: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronR: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  X:        ()=><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ExternalL:()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Balance:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 9l4-4 4 4"/><path d="M17 9l4-4-4-4"/><path d="M5 21H3a2 2 0 0 1-2-2v-1a5 5 0 0 1 10 0v1a2 2 0 0 1-2 2H5z"/><path d="M21 21h-2a2 2 0 0 1-2-2v-1a5 5 0 0 1 10 0v1a2 2 0 0 1-2 2h-4z"/></svg>,
  Doc:      ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
};

// ── MICRO COMPONENTI ──────────────────────────────────────────────────────────

function TipoBadge({ tipo, size = "sm" }: { tipo: string; size?: "sm" | "lg" }) {
  const c = tc(tipo);
  const isLg = size === "lg";
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      background:c.pill, border:`1px solid ${c.border}`, color:c.text,
      borderRadius:3, padding: isLg ? "3px 10px" : "2px 7px",
      fontSize: isLg ? 11 : 9.5, fontWeight:700,
      letterSpacing:"0.07em", fontFamily:"'Courier New', monospace",
      whiteSpace:"nowrap",
    }}>
      {tipo}
    </span>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void; [key: string]: any }) {
  const [h,setH]=useState(false);
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:C.blueFaint, border:`1px solid ${C.blueBorder}`,
      borderRadius:20, padding:"3px 10px 3px 12px",
      fontSize:11.5, color:C.blueMid, fontWeight:500,
    }}>
      {label}
      <button onClick={onRemove} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
        style={{ background:h?C.blueBorder:"none", border:"none", cursor:"pointer",
          color:C.inkLight, padding:2, display:"flex", alignItems:"center",
          borderRadius:"50%", transition:"background .1s" }}>
        <Svg.X/>
      </button>
    </span>
  );
}

// ── RIGA DELIBERA ─────────────────────────────────────────────────────────────
function Row({ item, idx }: { item: Atto; idx: number; [key: string]: any }) {
  const c = tc(item.tipo);
  const [h,setH] = useState(false);
  return (
    <div
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        display:"grid", gridTemplateColumns:"72px 1fr 100px",
        borderBottom:`1px solid ${C.line}`,
        background: h ? C.paperWarm : C.paper,
        transition:"background .15s",
        animation:`rowIn .25s ease ${idx*.035}s both`,
        cursor:"default",
      }}
    >
      {/* Colonna tipo */}
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        gap:6, padding:"14px 8px",
        borderRight:`1px solid ${C.line}`,
        background: h ? c.bg : "transparent", transition:"background .15s",
      }}>
        <TipoBadge tipo={item.tipo}/>
        <span style={{ fontSize:10, color:C.inkFaint, fontFamily:"'Courier New', monospace", fontWeight:600 }}>
          {item.anno}
        </span>
      </div>

      {/* Colonna titolo */}
      <div style={{ padding:"13px 18px", display:"flex", flexDirection:"column", justifyContent:"center", gap:5 }}>
        <div style={{
          fontSize:13.5, lineHeight:1.45, color: h ? C.blue : C.ink,
          transition:"color .15s", fontFamily:"'Georgia', 'Times New Roman', serif",
          fontWeight:400,
        }}>
          {item.titolo}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
          {item.data_pub && (
            <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:C.inkLight }}>
              <span style={{ opacity:.6 }}>📅</span> {item.data_pub}
            </span>
          )}
          {item.dimensione && (
            <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:C.inkLight }}>
              <span style={{ opacity:.6 }}>📎</span> {item.dimensione}
            </span>
          )}
          <span style={{ fontSize:10.5, color:C.inkFaint, fontStyle:"italic" }}>{c.label}</span>
        </div>
      </div>

      {/* Colonna azione */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"12px 14px", borderLeft:`1px solid ${C.line}` }}>
        {item.url ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              padding:"8px 14px", borderRadius:6,
              background: h ? c.bg : C.bg,
              border:`1px solid ${h ? c.border : C.lineMid}`,
              color: h ? c.text : C.inkMid,
              textDecoration:"none", transition:"all .15s",
              fontSize:11, fontWeight:600, letterSpacing:"0.04em",
            }}>
            <Svg.Download/>
            <span>PDF</span>
          </a>
        ) : (
          <span style={{ fontSize:11, color:C.inkFaint }}>—</span>
        )}
      </div>
    </div>
  );
}

// ── PAGINAZIONE ───────────────────────────────────────────────────────────────
function Pager({ meta, onPage }: { meta: Meta; onPage: (p: number) => void }) {
  if (meta.pages <= 1) return null;
  const { page, pages, total, limit } = meta;
  const from = (page-1)*limit+1, to = Math.min(page*limit, total);
  const start = Math.max(1, Math.min(pages-4, page-2));
  const nums = Array.from({length:Math.min(5,pages)}, (_,i) => start+i);
  const Btn = ({active, disabled, children, onClick}: any) => (
    <button onClick={onClick} disabled={disabled}
      style={{
        minWidth:32, height:32, borderRadius:5, fontSize:12,
        border:`1.5px solid ${active?C.blue:C.line}`,
        background:active?C.blue:C.paper,
        color:disabled?C.inkFaint:active?"#fff":C.inkMid,
        cursor:disabled?"default":"pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontWeight:active?700:400, opacity:disabled?.4:1,
        transition:"all .12s",
      }}>
      {children}
    </button>
  );
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"12px 20px", borderTop:`1px solid ${C.line}`,
      background:C.bg, fontSize:12, color:C.inkLight,
    }}>
      <span>Risultati <strong style={{color:C.inkMid}}>{from}–{to}</strong> di <strong style={{color:C.inkMid}}>{total}</strong></span>
      <div style={{ display:"flex", gap:4 }}>
        <Btn disabled={page<=1} onClick={()=>onPage(page-1)}><Svg.ChevronL/></Btn>
        {nums.map(n=><Btn key={n} active={n===page} onClick={()=>onPage(n)}>{n}</Btn>)}
        <Btn disabled={page>=pages} onClick={()=>onPage(page+1)}><Svg.ChevronR/></Btn>
      </div>
    </div>
  );
}

// ── CARD NORMATIVA ────────────────────────────────────────────────────────────
function NormaCard({ item, defaultOpen=false }: { item: any; defaultOpen?: boolean; [key: string]: any }) {
  const [open,setOpen] = useState(defaultOpen);
  return (
    <div style={{
      border:`1px solid ${open?C.blueBorder:C.line}`,
      borderRadius:8, overflow:"hidden",
      background:open?C.blueFaint:C.paper,
      boxShadow:open?"0 2px 12px rgba(26,61,107,.08)":"none",
      transition:"all .2s",
    }}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{
          width:"100%", display:"flex", alignItems:"center", gap:14,
          padding:"15px 18px", background:"none", border:"none",
          cursor:"pointer", textAlign:"left",
        }}>
        <div style={{
          width:38, height:38, borderRadius:8, flexShrink:0,
          background:`${item.color}15`, border:`1px solid ${item.color}30`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:19,
        }}>
          {item.icon}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:open?C.blue:C.ink, fontFamily:"'Georgia',serif", lineHeight:1.2 }}>
            {item.title}
          </div>
          <div style={{ fontSize:10.5, color:C.inkLight, marginTop:3, fontFamily:"'Courier New',monospace" }}>
            {item.norm}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.inkLight} strokeWidth="2.5" strokeLinecap="round"
          style={{ transform:open?"rotate(180deg)":"none", transition:"transform .2s", flexShrink:0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding:"0 18px 18px 70px" }}>
          <p style={{ margin:"0 0 12px", fontSize:13, color:C.inkMid, lineHeight:1.8 }}>{item.body}</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {item.tags.map((t: string)=>(
              <span key={t} style={{
                background:C.blueFaint, border:`1px solid ${C.blueBorder}`,
                color:C.blueMid, borderRadius:20, padding:"2px 10px",
                fontSize:10.5, fontFamily:"'Courier New',monospace", fontWeight:600,
              }}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string; [key: string]: any }) {
  return (
    <div style={{
      background:C.paper, border:`1px solid ${C.line}`, borderRadius:10,
      padding:"16px 20px", display:"flex", alignItems:"center", gap:14,
      boxShadow:"0 1px 4px rgba(0,0,0,.05)",
    }}>
      <div style={{
        width:44, height:44, borderRadius:10, flexShrink:0,
        background:`${color}18`, border:`1px solid ${color}30`,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:22, fontWeight:700, color:C.ink, lineHeight:1, fontFamily:"'Georgia',serif" }}>{value}</div>
        <div style={{ fontSize:11, color:C.inkLight, marginTop:3, letterSpacing:"0.04em" }}>{label}</div>
      </div>
    </div>
  );
}

// ── TAB BUTTON ────────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:8,
      padding:"12px 22px", background:"none", border:"none", cursor:"pointer",
      borderBottom:active?`2.5px solid ${C.blue}`:"2.5px solid transparent",
      color:active?C.blue:C.inkLight,
      fontSize:12.5, fontWeight:active?700:500,
      letterSpacing:"0.05em", transition:"all .15s",
      fontFamily:"'Courier New',monospace",
    }}>
      <span style={{ fontSize:15 }}>{icon}</span>
      <span style={{ textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</span>
      {count!==undefined && (
        <span style={{
          background:active?C.blue:C.bg, border:`1px solid ${active?C.blue:C.line}`,
          color:active?"#fff":C.inkLight,
          borderRadius:20, padding:"1px 8px", fontSize:10, fontWeight:700,
        }}>{count}</span>
      )}
    </button>
  );
}

// ── SELECT ────────────────────────────────────────────────────────────────────
function Select({ value, onChange, id, children }: { value: string | number; onChange: (v: string) => void; id?: string; children: React.ReactNode }) {
  return (
    <div style={{ position:"relative" }}>
      <select id={id} value={value} onChange={e=>onChange(e.target.value)}
        style={{
          appearance:"none", width:"100%", padding:"10px 36px 10px 14px",
          background:C.paper, border:`1.5px solid ${value?C.blue:C.line}`,
          borderRadius:8, color:value?C.blue:C.inkLight, fontSize:12.5,
          cursor:"pointer", fontFamily:"'Georgia',serif",
          boxShadow:"0 1px 3px rgba(0,0,0,.05)", outline:"none",
          transition:"border-color .15s",
        }}>
        {children}
      </select>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={value?C.blue:C.inkFaint} strokeWidth="2.5" strokeLinecap="round"
        style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  );
}

// ── HOOK API ──────────────────────────────────────────────────────────────────
function useAPI(apiBase: string, isPreview: boolean) {
  const [data,    setData]    = useState<Atto[]>(isPreview ? MOCK : []);
  const [meta,    setMeta]    = useState<Meta>(isPreview ? {total:MOCK.length,page:1,pages:1,limit:20} : {total:0,page:1,pages:1,limit:20});
  const [filters, setFilters] = useState<Filters>(isPreview ? MOCK_FILTERS : {anni:[],tipi:[]});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const fetch_ = useCallback(async(tipo: string, anno: string | number, q: string, page: number) => {
    if (isPreview) {
      let d = [...MOCK];
      if (tipo) d = d.filter(r=>r.tipo===tipo);
      if (anno) d = d.filter(r=>r.anno===+anno);
      if (q)    d = d.filter(r=>r.titolo.toLowerCase().includes(q.toLowerCase()));
      setData(d); setMeta({total:d.length,page:1,pages:1,limit:20}); return;
    }
    if (abort.current) abort.current.abort();
    abort.current = new AbortController();
    setLoading(true); setError(null);
    const qs = new URLSearchParams();
    if (tipo) qs.set("tipo",tipo);
    if (anno) qs.set("anno",anno.toString());
    if (q)    qs.set("q",q);
    qs.set("page",page.toString()); qs.set("limit","20");
    try {
      const res  = await fetch(`${apiBase}/delibere.php?${qs}`, {signal:abort.current.signal});
      if (!res.ok) throw new Error(`Errore HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data||[]); setMeta(json.meta||{total:0,page:1,pages:1,limit:20});
      if (json.filters) setFilters(json.filters);
    } catch(e: any) { if(e.name!=="AbortError") setError(e.message); }
    finally   { setLoading(false); }
  }, [apiBase, isPreview]);

  return { data, meta, filters, loading, error, fetch_ };
}

// Labels usate nella legenda
const TIPO_META_LABELS: Record<string, string> = {
  CC:"Delibere Consiglio",
  DG:"Delibere Giunta",
  DD:"Determine Dirigenziali",
  DS:"Det. Sindacali",
};

// ── COMPONENTE PRINCIPALE ─────────────────────────────────────────────────────
export default function DelibereNaro({ apiBase="/api", preview=false }: { apiBase?: string; preview?: boolean }) {
  const [tab,   setTab]   = useState("atti");
  const [tipo,  setTipo]  = useState("");
  const [anno,  setAnno]  = useState<string | number>("");
  const [q,     setQ]     = useState("");
  const [page,  setPage]  = useState(1);
  const { data, meta, filters, loading, error, fetch_ } = useAPI(apiBase, preview);
  const debounce = useRef<any>(null);

  // Primo caricamento
  useEffect(() => { fetch_(tipo, anno, q, page); }, []); // eslint-disable-line

  function update(nt=tipo, na=anno, nq=q, np=1) {
    setTipo(nt); setAnno(na); setQ(nq); setPage(np);
    fetch_(nt, na, nq, np);
  }

  function onSearch(v: string) {
    setQ(v);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(()=>update(tipo,anno,v,1), 400);
  }

  const chips = [
    tipo && {key:"tipo", label:`Tipo: ${tipo}`,    clear:()=>update("",anno,q)},
    anno && {key:"anno", label:`Anno: ${anno}`,     clear:()=>update(tipo,"",q)},
    q    && {key:"q",    label:`"${q}"`,             clear:()=>{setQ("");update(tipo,anno,"");}},
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  // Stats mock per la dashboard
  const stats = [
    { icon:"⚖️", value: filters.tipi.find(t=>t.tipo==="CC") ? (preview?MOCK.filter(r=>r.tipo==="CC").length:"—") : "—", label:"Delibere Consiglio", color:C.CC.text },
    { icon:"🏛️", value: preview?MOCK.filter(r=>r.tipo==="DG").length:"—", label:"Delibere Giunta",    color:C.DG.text },
    { icon:"📋", value: preview?MOCK.filter(r=>r.tipo==="DD").length:"—", label:"Determine Dirig.",   color:C.DD.text },
    { icon:"📅", value: filters.anni[0]||"—", label:"Anno più recente",   color:C.blue },
  ];

  return (
    <div style={{ fontFamily:"'Georgia','Times New Roman',serif", background:C.bg, minHeight:"100vh", color:C.ink }}>
      <BackToTop />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap');
        @keyframes rowIn  { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:none} }
        @keyframes shimmer{ 0%{background-position:-200px 0} 100%{background-position:calc(200px + 100%) 0} }
        *{box-sizing:border-box}
        input::placeholder{color:${C.inkFaint}}
        select option{background:#fff;color:${C.ink}}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${C.bg}}
        ::-webkit-scrollbar-thumb{background:${C.lineMid};border-radius:4px}
        a{transition:color .15s}
      `}</style>

      {/* ══ TOPBAR ISTITUZIONALE ══════════════════════════════════════════════ */}
      <div style={{ background:C.blue, padding:"7px 0" }}>
        <div style={{ maxWidth:1040, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:15 }}>
            <BackButton className="!bg-transparent !border-white/20 !text-white hover:!bg-white/10 !py-1 !px-3" label="Torna Hub" />
            <span style={{ width:1, height:10, background:"rgba(255,255,255,.2)" }}></span>
            <span style={{ fontSize:10.5, color:"rgba(255,255,255,.65)", letterSpacing:"0.1em", fontFamily:"'Courier New',monospace" }}>
              COMUNE DI NARO · CITTÀ METROPOLITANA DI AGRIGENTO · SICILIA
            </span>
          </div>
          <a href="https://archiviocomunenaro.it" target="_blank" rel="noopener"
            style={{ display:"flex", alignItems:"center", gap:5, fontSize:10.5, color:"rgba(255,255,255,.65)", textDecoration:"none", fontFamily:"'Courier New',monospace" }}>
            archiviocomunenaro.it <Svg.ExternalL/>
          </a>
        </div>
      </div>

      {/* ══ HEADER PRINCIPALE ════════════════════════════════════════════════ */}
      <div style={{ background:C.paper, borderBottom:`1px solid ${C.line}`, boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
        <div style={{ maxWidth:1040, margin:"0 auto", padding:"28px 24px 0" }}>

          <div style={{ display:"flex", alignItems:"flex-start", gap:20, marginBottom:20 }}>
            {/* Simbolo istituzionale */}
            <div style={{
              width:56, height:56, borderRadius:12, flexShrink:0,
              background:`linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:`0 4px 16px ${C.blue}40`,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <h1 style={{
                margin:"0 0 5px",
                fontSize:28, fontWeight:700, color:C.ink,
                fontFamily:"'Playfair Display','Georgia',serif",
                letterSpacing:"-0.01em", lineHeight:1.1,
              }}>
                Delibere &amp; Atti Amministrativi — NaroInComune
              </h1>
              <p style={{ margin:0, fontSize:13, color:C.inkLight, lineHeight:1.5 }}>
                Portale pubblico di accesso agli atti del Comune · D.Lgs. 267/2000 (TUEL) · D.Lgs. 33/2013
              </p>
              <p style={{ color: "#C5A059", fontFamily: "serif", fontStyle: "italic", marginTop: "8px", fontSize: "11px", letterSpacing: "0.05em" }}>"Partecipare è un dovere, digitale è un diritto"</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
            {stats.map((s,i)=><StatCard key={i} {...s}/>)}
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:`1px solid ${C.line}`, marginBottom:"-1px" }}>
            <TabBtn active={tab==="atti"}  onClick={()=>setTab("atti")}  icon={<Svg.Doc/>}     label="Atti & Delibere"      count={meta.total||undefined}/>
            <TabBtn active={tab==="legge"} onClick={()=>setTab("legge")} icon={<Svg.Balance/>} label="Normativa & Diritti"/>
          </div>
        </div>
      </div>

      {/* ══ CONTENUTO ════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:1040, margin:"0 auto", padding:"28px 24px 80px" }}>

        {/* ── TAB ATTI ─────────────────────────────────────────────────────── */}
        {tab==="atti" && (
          <div style={{ animation:"fadeUp .3s ease both" }}>

            {/* Barra di ricerca e filtri */}
            <div style={{
              background:C.paper, border:`1px solid ${C.line}`, borderRadius:12,
              padding:"20px", marginBottom:16,
              boxShadow:"0 2px 10px rgba(0,0,0,.04)",
            }}>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {/* Prima riga: Ricerca */}
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:C.inkFaint, pointerEvents:"none" }}>
                    <Svg.Search/>
                  </span>
                  <input id="search-atti" type="text" value={q} onChange={e=>onSearch(e.target.value)}
                    placeholder="Cerca titolo, oggetto, numero delibera…"
                    style={{
                      width:"100%", padding:"12px 14px 12px 42px",
                      background:C.bg, border:`1.5px solid ${q?C.blue:C.line}`,
                      borderRadius:8, color:C.ink, fontSize:14,
                      fontFamily:"'Georgia',serif", outline:"none",
                      transition:"border-color .15s",
                      boxShadow:"inset 0 1px 2px rgba(0,0,0,.04)",
                    }}
                  />
                </div>

                {/* Seconda riga: Filtri specifici */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div>
                    <label htmlFor="filter-tipo" style={{ display:"block", fontSize:11, fontWeight:700, color:C.inkLight, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6, fontFamily:"'Courier New',monospace" }}>
                      Tipologia di Atto
                    </label>
                    <Select id="filter-tipo" value={tipo} onChange={v=>update(v,anno,q)}>
                      <option value="">Tutti i tipi di atto</option>
                      {filters.tipi.map(t=><option key={t.tipo} value={t.tipo}>{t.tipo} — {t.tipo_label}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="filter-anno" style={{ display:"block", fontSize:11, fontWeight:700, color:C.inkLight, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6, fontFamily:"'Courier New',monospace" }}>
                      Anno di Pubblicazione
                    </label>
                    <Select id="filter-anno" value={anno} onChange={v=>update(tipo,v,q)}>
                      <option value="">Tutti gli anni</option>
                      {filters.anni.map(a=><option key={a} value={a}>Anno {a}</option>)}
                    </Select>
                  </div>
                </div>
              </div>

              {/* Chip filtri attivi */}
              {chips.length>0 && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:16, paddingTop:16, borderTop:`1px solid ${C.line}` }}>
                  <span style={{ fontSize:11, color:C.inkFaint, alignSelf:"center", marginRight:2 }}>Filtri attivi:</span>
                  {chips.map(f=><Chip key={f.key} label={f.label} onRemove={f.clear}/>)}
                  <button onClick={()=>{setQ("");update("","","");}}
                    style={{ background:"none", border:`1px solid ${C.line}`, borderRadius:20,
                      padding:"3px 11px", fontSize:11, color:C.inkLight, cursor:"pointer" }}>
                    × Resetta tutti i filtri
                  </button>
                </div>
              )}
            </div>

            {/* Legenda tipi — filtro rapido */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:16 }}>
              {["CC","DG","DD","DS"].map(k=>{
                const c=tc(k); const active=tipo===k;
                return (
                  <button key={k} onClick={()=>update(active?"":k,anno,q)}
                    style={{
                      display:"flex", alignItems:"center", gap:8, padding:"7px 14px",
                      borderRadius:20, cursor:"pointer",
                      background:active?c.bg:C.paper,
                      border:`1.5px solid ${active?c.border:C.line}`,
                      color:active?c.text:C.inkMid, fontSize:12,
                      fontWeight:active?600:400, transition:"all .15s",
                      boxShadow:active?`0 2px 8px ${c.border}80`:"none",
                    }}>
                    <TipoBadge tipo={k}/>
                    <span>{TIPO_META_LABELS[k]}</span>
                  </button>
                );
              })}
            </div>

            {/* Tabella */}
            <div style={{
              background:C.paper, border:`1px solid ${C.line}`, borderRadius:12,
              overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,.07)",
            }}>
              {/* Header colonne */}
              <div style={{
                display:"grid", gridTemplateColumns:"72px 1fr 100px",
                background:C.bg, borderBottom:`2px solid ${C.line}`,
                padding:"9px 0",
              }}>
                <div style={{ textAlign:"center", fontSize:9, letterSpacing:"0.14em", color:C.inkFaint, textTransform:"uppercase", fontFamily:"'Courier New',monospace" }}>Tipo</div>
                <div style={{ padding:"0 18px", fontSize:9, letterSpacing:"0.14em", color:C.inkFaint, textTransform:"uppercase", fontFamily:"'Courier New',monospace" }}>Titolo / Oggetto</div>
                <div style={{ textAlign:"center", fontSize:9, letterSpacing:"0.14em", color:C.inkFaint, textTransform:"uppercase", fontFamily:"'Courier New',monospace" }}>Doc.</div>
              </div>

              {/* Errore */}
              {error && (
                <div style={{ padding:"32px 24px", textAlign:"center", color:"#c0392b" }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>⚠️</div>
                  <div style={{ fontSize:13, fontWeight:600 }}>Errore nel caricamento</div>
                  <div style={{ fontSize:12, color:C.inkLight, marginTop:4 }}>{error}</div>
                </div>
              )}

              {/* Skeleton */}
              {loading && [...Array(6)].map((_,i)=>(
                <div key={i} style={{ display:"grid", gridTemplateColumns:"72px 1fr 100px", borderBottom:`1px solid ${C.line}`, opacity:1-i*.12 }}>
                  <div style={{ padding:"14px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                    <div style={{ width:36, height:18, borderRadius:3, background:`linear-gradient(90deg,${C.line} 25%,${C.bg} 50%,${C.line} 75%)`, backgroundSize:"200px 100%", animation:"shimmer 1.4s infinite" }}/>
                    <div style={{ width:28, height:12, borderRadius:2, background:C.line }}/>
                  </div>
                  <div style={{ padding:"14px 18px" }}>
                    <div style={{ height:14, borderRadius:3, background:`linear-gradient(90deg,${C.line} 25%,${C.bg} 50%,${C.line} 75%)`, backgroundSize:"200px 100%", animation:"shimmer 1.4s infinite", width:["75%","60%","82%","55%","70%"][i%5], marginBottom:8 }}/>
                    <div style={{ height:10, borderRadius:2, background:C.bg, width:"35%" }}/>
                  </div>
                  <div style={{ padding:"14px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <div style={{ width:50, height:36, borderRadius:6, background:C.line }}/>
                  </div>
                </div>
              ))}

              {/* Empty */}
              {!loading&&!error&&data.length===0&&(
                <div style={{ padding:"56px 24px", textAlign:"center" }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>📂</div>
                  <div style={{ fontSize:15, color:C.inkMid, fontFamily:"'Playfair Display',serif", marginBottom:6 }}>Nessun atto trovato</div>
                  <div style={{ fontSize:12, color:C.inkLight }}>Prova a modificare i filtri o la ricerca</div>
                </div>
              )}

              {/* Righe */}
              {!loading&&!error&&data.map((item,i)=><Row key={item.id} item={item} idx={i}/>)}

              <Pager meta={meta} onPage={p=>{setPage(p);fetch_(tipo,anno,q,p);}}/>
            </div>

            {/* Footer */}
            <div style={{ marginTop:14, display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, color:C.inkFaint }}>
              <span>
                Dati estratti da{" "}
                <a href="https://archiviocomunenaro.it" target="_blank" rel="noopener noreferrer"
                  style={{ color:C.blueMid, textDecoration:"none" }}>
                  archiviocomunenaro.it
                </a>
                {" "}· I PDF sono ospitati sul sito del Comune
              </span>
              <span>{meta.total} atti in archivio</span>
            </div>
          </div>
        )}

        {/* ── TAB NORMATIVA ─────────────────────────────────────────────────── */}
        {tab==="legge" && (
          <div style={{ animation:"fadeUp .3s ease both" }}>

            {/* Hero normativa */}
            <div style={{
              background:`linear-gradient(135deg, ${C.blue} 0%, ${C.blueLight} 100%)`,
              borderRadius:14, padding:"28px 32px", marginBottom:24,
              position:"relative", overflow:"hidden",
              boxShadow:`0 8px 32px ${C.blue}40`,
            }}>
              <div style={{ position:"absolute", right:"-20px", top:"-20px", width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,.05)" }}/>
              <div style={{ position:"relative" }}>
                <div style={{ fontSize:10.5, letterSpacing:"0.15em", color:"rgba(255,255,255,.6)", fontFamily:"'Courier New',monospace", marginBottom:10 }}>
                  QUADRO NORMATIVO DI RIFERIMENTO
                </div>
                <h2 style={{ margin:"0 0 10px", fontSize:24, fontWeight:700, color:"#fff", fontFamily:"'Playfair Display',serif" }}>
                  Trasparenza Amministrativa
                </h2>
                <p style={{ margin:0, fontSize:13.5, color:"rgba(255,255,255,.8)", lineHeight:1.7, maxWidth:580 }}>
                  I Comuni hanno precisi obblighi di pubblicazione ai sensi del{" "}
                  <strong>TUEL — D.Lgs. 267/2000</strong> e del{" "}
                  <strong>D.Lgs. 33/2013</strong>, finalizzati alla trasparenza amministrativa
                  e al controllo democratico da parte dei cittadini.
                </p>
              </div>
            </div>

            {/* Accordion */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
              {LEGGE.map((item,i)=><NormaCard key={item.id} item={item} defaultOpen={i===0}/>)}
            </div>

            {/* Grid tipi atti */}
            <div style={{ background:C.paper, border:`1px solid ${C.line}`, borderRadius:12, overflow:"hidden", marginBottom:16, boxShadow:"0 1px 6px rgba(0,0,0,.05)" }}>
              <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.line}`, background:C.bg, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14 }}>📋</span>
                <span style={{ fontSize:11, fontWeight:700, color:C.inkMid, letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"'Courier New',monospace" }}>
                  Atti soggetti a pubblicazione obbligatoria
                </span>
              </div>
              <div style={{ padding:"16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  {tipo:"CC", desc:"Atti fondamentali: statuto, regolamenti, bilanci, piani urbanistici e varianti, approvazione aliquote e tariffe."},
                  {tipo:"DG", desc:"Atti di indirizzo politico-amministrativo e di gestione corrente dell'ente locale, piani programmatici."},
                  {tipo:"DD", desc:"Provvedimenti di spesa e gestionali adottati dai dirigenti e dai responsabili di posizione organizzativa."},
                  {tipo:"DS", desc:"Ordinanze del Sindaco, atti contingibili e urgenti, provvedimenti monocratici del Sindaco come autorità locale."},
                ].map(r=>{
                  const c=tc(r.tipo);
                  return (
                    <div key={r.tipo} style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:8, padding:"14px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <TipoBadge tipo={r.tipo} size="lg"/>
                        <span style={{ fontSize:12, color:c.text, fontWeight:700 }}>{TIPO_META_LABELS[r.tipo]}</span>
                      </div>
                      <p style={{ margin:0, fontSize:12, color:C.inkMid, lineHeight:1.6 }}>{r.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Box accesso civico */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{ padding:"18px 20px", background:"#eef8ee", border:"1px solid #aed4ae", borderRadius:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:20 }}>🔓</span>
                  <span style={{ fontSize:12.5, fontWeight:700, color:"#1e5c1e" }}>Accesso Civico — Come richiederlo</span>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#3a5a3a", lineHeight:1.7 }}>
                  Per atti non pubblicati, presenta richiesta di <strong>accesso civico FOIA</strong> o{" "}
                  <strong>accesso documentale (L. 241/90)</strong> tramite l'URP del Comune.
                  Risposta entro <strong>30 giorni</strong>.
                </p>
              </div>
              <div style={{ padding:"18px 20px", background:C.blueFaint, border:`1px solid ${C.blueBorder}`, borderRadius:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:20 }}>🗳️</span>
                  <span style={{ fontSize:12.5, fontWeight:700, color:C.blue }}>Consiglieri — Art. 43 TUEL</span>
                </div>
                <p style={{ margin:0, fontSize:12, color:C.inkMid, lineHeight:1.7 }}>
                  I consiglieri comunali hanno accesso <strong>senza obbligo di motivazione</strong> a tutte
                  le informazioni utili al mandato elettivo, con diritti più ampi del semplice cittadino.
                </p>
              </div>
            </div>

            <div style={{ marginTop:16, fontSize:11, color:C.inkFaint, textAlign:"center", fontFamily:"'Courier New',monospace" }}>
              Riferimenti normativi: TUEL art. 43 · L. 241/1990 · D.Lgs. 33/2013 · D.Lgs. 267/2000
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
