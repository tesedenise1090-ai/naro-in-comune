import { useState, useRef, useEffect } from "react";
import { Link } from 'react-router-dom';
import { Plus, Trash2, Download, Upload, Calculator, Home, Edit3, ChevronDown, ChevronUp, FileJson, AlertCircle, CheckCircle2, X, FileText, Printer, ArrowLeft, ChevronLeft, ChevronRight, CheckSquare, Square } from "lucide-react";
import BackToTop from "./BackToTop";
import BackButton from "./BackButton";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument } from 'pdf-lib';
import { PDFService, PDFData } from "../services/pdfService";

import { RNDTPanel } from "../services/rndtService";
import { AutocompleteComune } from "./AutocompleteComune";

const CURRENT_YEAR = new Date().getFullYear();
const TODAY = new Date();

const TIPOLOGIE = [
  { id: "ab_principale",        label: "Abitazione principale (Cat. A2–A7) + pertinenze",    moltiplicatore: 160, rivalutazione: 1.05, aliquotaBase: 6,    esente: true,  gruppo: "Residenziale" },
  { id: "ab_principale_pregio", label: "Ab. principale di pregio (Cat. A1, A8, A9)",          moltiplicatore: 160, rivalutazione: 1.05, aliquotaBase: 6,    esente: false, gruppo: "Residenziale", detrMax: 200 },
  { id: "iacp",                 label: "Immobili IACP / ARES / ALER assegnati",               moltiplicatore: 160, rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Residenziale" },
  { id: "altri_a",              label: "Altre abitazioni – Cat. A (tranne A/10)",             moltiplicatore: 160, rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Residenziale" },
  { id: "comodato_50",          label: "Comodato gratuito – riduzione 50% base imponibile",  moltiplicatore: 160, rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Residenziale", riduzione: 0.5 },
  { id: "comodato_no",          label: "Comodato gratuito senza riduzione imponibile",        moltiplicatore: 160, rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Residenziale" },
  { id: "concordato",           label: "Locazione a canone concordato (riduzione 25%)",       moltiplicatore: 160, rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Residenziale", riduzione: 0.25 },
  { id: "a10",                  label: "Cat. A/10 – Uffici e studi privati",                  moltiplicatore: 80,  rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Commerciale" },
  { id: "c1",                   label: "Cat. C/1 – Negozi e botteghe",                        moltiplicatore: 55,  rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Commerciale" },
  { id: "c2",                   label: "Cat. C/2 – Magazzini e locali di deposito",           moltiplicatore: 140, rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Commerciale" },
  { id: "c3",                   label: "Cat. C/3 – Laboratori per arti e mestieri",           moltiplicatore: 140, rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Commerciale" },
  { id: "bc4c5",                label: "Cat. B, C/4, C/5 – Fabbricati comuni",                moltiplicatore: 140, rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Commerciale" },
  { id: "c6c7",                 label: "Cat. C/6, C/7 – Rimesse, autorimesse, tettoie",       moltiplicatore: 140, rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Commerciale" },
  { id: "d",                    label: "Cat. D (tranne D/5, D/10) – Industriali/commerciali", moltiplicatore: 65,  rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Produttivo" },
  { id: "d5",                   label: "Cat. D/5 – Istituti di credito e assicurazioni",      moltiplicatore: 80,  rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Produttivo" },
  { id: "d10",                  label: "Fabbricati rurali strumentali (D/10)",                 moltiplicatore: 65,  rivalutazione: 1.05, aliquotaBase: 1,    esente: false, gruppo: "Agricolo" },
  { id: "d10_ac",               label: "Fabbricati rurali strumentali (Cat. A, C/2, C/6, C/7)",moltiplicatore:140, rivalutazione:1.05, aliquotaBase: 1,    esente: false, gruppo: "Agricolo" },
  { id: "beni_merce",           label: "Beni Merce – Imprese edili (invenduti)",              moltiplicatore: 160, rivalutazione: 1.05, aliquotaBase: 10.6, esente: false, gruppo: "Produttivo" },
  { id: "area",                 label: "Area fabbricabile – valore venale",                   moltiplicatore: null,rivalutazione: null, aliquotaBase: 10.6, esente: false, gruppo: "Altro", isArea: true },
  { id: "terreno",              label: "Terreno agricolo",                                    moltiplicatore: 135, rivalutazione: 1.25, aliquotaBase: 10.6, esente: false, gruppo: "Agricolo" },
  { id: "terreno_agricolo",     label: "Terreno agricolo posseduto da IAP/CD",                moltiplicatore: 135, rivalutazione: 1.25, aliquotaBase: 0,    esente: true,  gruppo: "Agricolo" },
];

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

const COMUNI_SUGGESTIONS = [
  "Naro", "Canicattì", "Agrigento", "Favara", "Licata", "Palma di Montechiaro", 
  "Ravanusa", "Campobello di Licata", "Castrofilippo", "Camastra", "Grotte", "Racalmuto"
];

function validateCF(cf: string) {
  const regex = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/i;
  return regex.test(cf);
}

const EMPTY_FORM = {
  tipologia: "altri_a", riferimento: "", rendita: "", percentuale: "100",
  meseInizio: 0, meseFine: 11, aliquota: "", detrazione: "200",
  storico: "no", areaValore: "", codComune: "", codTributo: "3918",
  annoRiferimento: CURRENT_YEAR,
};

// ─── CALCOLO ───────────────────────────────────────────────────────────────

function calcolaRavvedimento(importo, scadenza, oggi) {
  if (oggi <= scadenza) return { sanzione: 0, interessi: 0, totale: importo, giorni: 0, late: false };
  
  const diffTime = Math.abs(oggi.getTime() - scadenza.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let percSanzione = 0;
  if (diffDays <= 14) percSanzione = 0.001 * diffDays; 
  else if (diffDays <= 30) percSanzione = 0.015; 
  else if (diffDays <= 90) percSanzione = 0.0167; 
  else percSanzione = 0.0375; 
  
  const sanzione = importo * percSanzione;
  const tassoInteresse = 0.025; // 2.5%
  const interessi = (importo * tassoInteresse * diffDays) / 365;
  
  return {
    sanzione: +sanzione.toFixed(2),
    interessi: +interessi.toFixed(2),
    totale: +(importo + sanzione + interessi).toFixed(2),
    giorni: diffDays,
    late: true
  };
}

function calcolaIMU(f, dataVersamento = new Date()) {
  const tip = TIPOLOGIE.find(t => t.id === f.tipologia);
  if (!tip) return null;
  if (tip.esente) return { esente: true, baseImponibile: 0, imposta: 0, importo: 0, acconto: 0, saldo: 0 };

  const anno = f.annoRiferimento || CURRENT_YEAR;

  let base = 0;
  if (tip.isArea) {
    base = parseFloat(f.areaValore) || 0;
  } else {
    const r = parseFloat(f.rendita) || 0;
    base = r * tip.rivalutazione * tip.moltiplicatore;
  }
  if (tip.riduzione) base *= (1 - tip.riduzione);
  if (f.storico === "storico" || f.storico === "inagibile") base *= 0.5;

  const perc = (parseFloat(f.percentuale) || 100) / 100;
  const mesi = (parseInt(f.meseFine) - parseInt(f.meseInizio) + 1);
  base = base * perc * (mesi / 12);

  const aliq = (parseFloat(f.aliquota) || tip.aliquotaBase) / 1000;
  const imposta = base * aliq;
  const detr = (f.tipologia === "ab_principale_pregio") ? (parseFloat(f.detrazione) || 0) : 0;
  const importo = Math.max(0, imposta - detr);

  const accontoBase = +(Math.round(importo / 2 * 100) / 100).toFixed(2);
  const saldoBase = +(Math.round(importo / 2 * 100) / 100).toFixed(2);

  const ravAcconto = calcolaRavvedimento(accontoBase, new Date(anno, 5, 16), dataVersamento);
  const ravSaldo = calcolaRavvedimento(saldoBase, new Date(anno, 11, 16), dataVersamento);

  return {
    esente: false,
    baseImponibile: Math.round(base),
    imposta: +imposta.toFixed(2),
    detrazione: +detr.toFixed(2),
    importo: +importo.toFixed(2),
    acconto: accontoBase,
    saldo: saldoBase,
    ravAcconto,
    ravSaldo,
    mesi,
    anno
  };
}

function fmt(n) { return (n ?? 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtInt(n) { return (n ?? 0).toLocaleString("it-IT"); }
let idSeq = 1;
function newId() { return `imm_${Date.now()}_${idSeq++}`; }

// ─── PDF GENERATOR ─────────────────────────────────────────────────────────

function generatePDF(immobili, totali, datiContribuente, dataVersamento) {
  const dv = new Date(dataVersamento);
  const anno = immobili[0]?.annoRiferimento || CURRENT_YEAR;

  const tableBody = immobili.map((imm, i) => {
    const r = calcolaIMU(imm, dv);
    const t = TIPOLOGIE.find(x => x.id === imm.tipologia);
    const aliq = parseFloat(imm.aliquota) || t?.aliquotaBase || 0;
    if (r?.esente) return [imm.riferimento || `Imm. ${i+1}`, t?.label || "", "ESENTE", "—", "—", "—"];
    return [
      imm.riferimento || `Imm. ${i+1}`,
      t?.label || "",
      t?.isArea ? `€ ${fmt(parseFloat(imm.areaValore)||0)}` : `€ ${fmt(parseFloat(imm.rendita)||0)}`,
      `€ ${fmtInt(r?.baseImponibile||0)}`,
      `${imm.percentuale}% · ${r?.mesi}m`,
      `€ ${fmt(r?.importo||0)}`
    ];
  });

  const f24Data = immobili.filter(imm => { const r = calcolaIMU(imm, dv); return r && !r.esente; }).map(imm => {
    const r = calcolaIMU(imm, dv);
    const t = TIPOLOGIE.find(x => x.id === imm.tipologia);
    const aliq = parseFloat(imm.aliquota) || t?.aliquotaBase || 0;
    const ravv = r.ravAcconto.sanzione + r.ravAcconto.interessi;
    return [
      imm.codComune || "F845",
      imm.codTributo || "3918",
      `${aliq}‰`,
      r.anno,
      `€ ${fmt(r.acconto)}`,
      `€ ${fmt(ravv)}`,
      `€ ${fmt(r.acconto + ravv)}`
    ];
  });

  const protocolCode = `IMU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const uuid = crypto.randomUUID ? crypto.randomUUID() : `BGS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const pdfData: PDFData = {
    title: "Prospetto Informativo IMU",
    subtitle: "Riepilogo calcolo Imposta Municipale Unica",
    year: anno,
    date: new Date().toLocaleDateString("it-IT"),
    protocollo: protocolCode,
    uuid: uuid,
    contribuente: {
      nome: datiContribuente.nome,
      cf: datiContribuente.codFiscale,
      comune: datiContribuente.comune
    },
    summaryItems: [
      { label: "Totale Dovuto", value: `€ ${fmt(totali.totaleDovuto)}`, isAccent: true },
      { label: "Acconto 16/06", value: `€ ${fmt(totali.ravAcconto)}`, subValue: totali.ravAcconto > totali.acconto ? `incl. ravv.` : undefined },
      { label: "Saldo 16/12", value: `€ ${fmt(totali.ravSaldo)}`, subValue: totali.ravSaldo > totali.saldo ? `incl. ravv.` : undefined }
    ],
    tables: [
      {
        title: "Elenco Immobili e Dettaglio Calcolo",
        head: [["Riferimento", "Tipologia", "Valore Catastale", "Base Imp.", "Possesso", "Imposta"]],
        body: tableBody,
        columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } }
      },
      {
        title: "Dati per la compilazione Modello F24",
        head: [["Cod. Comune", "Cod. Tributo", "Aliq.", "Anno", "Imposta", "Ravv.", "Totale Debito"]],
        body: f24Data,
        columnStyles: { 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } }
      }
    ]
  };

  PDFService.generateInstitutionalPDF(pdfData, `PROSPETTO_IMU_NARO_${anno}.pdf`);
}

// ─── COMPONENTE PRINCIPALE ────────────────────────────────────────────────

export default function CalcoloIMU2026() {
  const [immobili, setImmobili] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(true);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState("lista"); // "lista" | "f24"
  const [datiContribuente, setDatiContribuente] = useState({ nome: "", codFiscale: "", comune: "" });
  const [isCfValid, setIsCfValid] = useState(true);
  const [dataVersamento, setDataVersamento] = useState(new Date().toISOString().split('T')[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pagamentoUnico, setPagamentoUnico] = useState(false);
  const fileRef = useRef();

  // Carica dati salvati all'avvio
  useEffect(() => {
    const saved = localStorage.getItem("imu_contribuente");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDatiContribuente(parsed);
        setIsCfValid(validateCF(parsed.codFiscale));
      } catch (e) { console.error("Errore caricamento dati", e); }
    }
  }, []);

  // Salva dati automaticamente
  const handleContribuenteChange = (field, value) => {
    const newDati = { ...datiContribuente, [field]: value };
    setDatiContribuente(newDati);
    if (field === "codFiscale") {
      setIsCfValid(validateCF(value) || value === "");
    }
    localStorage.setItem("imu_contribuente", JSON.stringify(newDati));
  };

  const dv = new Date(dataVersamento);
  const tip = TIPOLOGIE.find(t => t.id === form.tipologia);
  const risultato = calcolaIMU(form, dv);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const totali = immobili.reduce((acc, imm) => {
    const r = calcolaIMU(imm, dv);
    if (!r || r.esente) return acc;
    const rAcc = r.ravAcconto?.totale || r.acconto;
    const rSal = r.ravSaldo?.totale || r.saldo;
    return { 
      importo: acc.importo + r.importo, 
      acconto: acc.acconto + r.acconto, 
      saldo: acc.saldo + r.saldo,
      ravAcconto: acc.ravAcconto + rAcc,
      ravSaldo: acc.ravSaldo + rSal,
      totaleDovuto: acc.totaleDovuto + rAcc + rSal
    };
  }, { importo: 0, acconto: 0, saldo: 0, ravAcconto: 0, ravSaldo: 0, totaleDovuto: 0 });

  const aggiungiImmobile = () => {
    const r = calcolaIMU(form, dv);
    if (!r) return;
    if (!tip?.isArea && !parseFloat(form.rendita) && !tip?.esente) { notify("Inserisci la rendita catastale.", "error"); return; }
    if (tip?.isArea && !parseFloat(form.areaValore)) { notify("Inserisci il valore venale dell'area.", "error"); return; }
    if (editingId) {
      setImmobili(list => list.map(i => i.id === editingId ? { ...form, id: editingId } : i));
      setEditingId(null); notify("Immobile aggiornato.");
    } else {
      setImmobili(list => [...list, { ...form, id: newId() }]);
      notify("Immobile aggiunto alla lista.");
    }
    setForm(EMPTY_FORM); setFormOpen(false);
  };

  const eliminaImmobile = (id) => {
    setImmobili(list => list.filter(i => i.id !== id));
    if (editingId === id) { setEditingId(null); setForm(EMPTY_FORM); }
    notify("Immobile eliminato.", "info");
  };

  const modificaImmobile = (imm) => {
    setForm({ ...imm }); setEditingId(imm.id); setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fillF24 = async (type: 'semplificato' | 'ordinario') => {
    try {
      const url = type === 'semplificato' 
        ? "/Modello F24 Semplificato nuovo_F24 semplificato_mod.pdf"
        : "/Modello di versamento unificato - F24 Ordinario_i Modello F24 (2).pdf";
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("File PDF non trovato");
      const existingPdfBytes = await response.arrayBuffer();
      
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const formPdf = pdfDoc.getForm();
      
      // DEBUG: List all fields
      const fields = formPdf.getFields();
      console.log("PDF Fields:", fields.map(f => f.getName()));

      // Dati Contribuente
      try {
        const fieldsToFill = [
          { name: 'f1_1[0]', value: datiContribuente.codFiscale || "" },
          { name: 'f1_2[0]', value: datiContribuente.nome?.split(' ')[0] || "" },
          { name: 'f1_3[0]', value: datiContribuente.nome?.split(' ').slice(1).join(' ') || "" },
        ];

        for (const f of fieldsToFill) {
          try {
            const field = formPdf.getTextField(f.name);
            field.setText(f.value);
          } catch (e) {
            console.warn(`Campo non trovato: ${f.name}`);
          }
        }
      } catch (e) { console.warn("Errore campi contribuente", e); }

      // Dati Immobili (Sezione IMU)
      const filtered = immobili.filter(imm => {
         const r = calcolaIMU(imm, dv);
         return r && !r.esente;
      });
      
      filtered.slice(0, 4).forEach((imm, idx) => {
        const r = calcolaIMU(imm, dv);
        const ravvTot = r.ravAcconto.sanzione + r.ravAcconto.interessi + (pagamentoUnico ? r.ravSaldo.sanzione + r.ravSaldo.interessi : 0);
        const versare = (pagamentoUnico ? r.importo : r.acconto);
        const aDebito = versare + ravvTot;

        try {
          if (type === 'semplificato') {
            const fieldsToFill = [
              { name: `f1_17[${idx}]`, value: "EL" }, // Sezione
              { name: `f1_18[${idx}]`, value: imm.codTributo || "3918" }, // Tributo
              { name: `f1_19[${idx}]`, value: imm.codComune || "" }, // Ente
              { name: `f1_24[${idx}]`, value: String(r.anno) }, // Anno
              { name: `f1_26[${idx}]`, value: fmt(aDebito).replace('.', ',') }, // Debito
            ];

            if (ravvTot > 0) fieldsToFill.push({ name: `f1_20[${idx}]`, value: "X" }); // Ravv
            if (pagamentoUnico) {
               fieldsToFill.push({ name: `f1_21[${idx}]`, value: "X" }); // Acc
               fieldsToFill.push({ name: `f1_22[${idx}]`, value: "X" }); // Sal
            } else {
               fieldsToFill.push({ name: `f1_21[${idx}]`, value: "X" }); // Acc
            }

            for (const f of fieldsToFill) {
              try {
                const field = formPdf.getTextField(f.name);
                field.setText(f.value);
              } catch (e) {
                console.warn(`Campo riga ${idx} non trovato: ${f.name}`);
              }
            }
          }
        } catch (e) { console.warn(`Errore campi riga ${idx}`, e); }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `F24_${type}_${datiContribuente.codFiscale || 'compilato'}.pdf`;
      link.click();
      notify(`F24 ${type === 'semplificato' ? 'Semplificato' : 'Ordinario'} generato con successo.`, "success");
    } catch (err) {
      console.error("Errore compilazione PDF:", err);
      notify("Errore durante la compilazione del PDF. Scarico il modello vuoto.", "error");
      const link = document.createElement("a");
      link.href = type === 'semplificato' ? "/Modello F24 Semplificato nuovo_F24 semplificato_mod.pdf" : "/Modello di versamento unificato - F24 Ordinario_i Modello F24 (2).pdf";
      link.download = `F24_${type}_vuoto.pdf`;
      link.click();
    }
  };

  const downloadJSON = () => {
    const data = { versione: `IMU${CURRENT_YEAR}`, dataEsportazione: new Date().toISOString(), datiContribuente, immobili, totali, dataVersamento };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `immobili_imu_${CURRENT_YEAR}.json`; a.click();
    URL.revokeObjectURL(url);
    notify("File JSON scaricato.");
  };

  const caricaJSON = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = ev.target?.result;
        if (typeof result !== 'string') return;
        const data = JSON.parse(result);
        const list = data.immobili || data;
        if (!Array.isArray(list)) throw new Error();
        setImmobili(list.map(i => ({ ...i, id: i.id || newId() })));
        if (data.datiContribuente) setDatiContribuente(data.datiContribuente);
        if (data.dataVersamento) setDataVersamento(data.dataVersamento);
        notify(`${list.length} immobili caricati.`);
      } catch { notify("File JSON non valido.", "error"); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  const gruppi = [...new Set(TIPOLOGIE.map(t => t.gruppo))];
  const immobiliF24 = immobili.filter(imm => { const r = calcolaIMU(imm, dv); return r && !r.esente; });

  return (
    <div style={S.page}>
      <BackToTop />
      {/* Navigation */}
      <div style={{ padding: "20px 24px 0", maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BackButton />
        
        {/* Gestione Dati in Header */}
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...S.btnGray, padding: "6px 12px" }} onClick={() => fileRef.current.click()}>
            <Upload size={14}/> Importa JSON
          </button>
          <button style={{ ...S.btnGray, padding: "6px 12px", opacity: immobili.length ? 1 : 0.5 }} onClick={downloadJSON} disabled={!immobili.length}>
            <Download size={14}/> Esporta JSON
          </button>
          <button style={{ ...S.btnBlue, padding: "6px 12px", flex: "none", opacity: immobili.length ? 1 : 0.5 }}
            onClick={() => generatePDF(immobili, totali, datiContribuente, dv)} disabled={!immobili.length}>
            <Printer size={14}/> Report PDF
          </button>
          <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }} onChange={caricaJSON} />
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{ ...S.notif, background: notification.type === "error" ? "#dc2626" : notification.type === "info" ? "#003366" : "#15803d" }}>
          {notification.type === "error" ? <AlertCircle size={15}/> : <CheckCircle2 size={15}/>}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div>
            <div style={S.badge}>IMU · IMI · IMIS · ILIA — Anno {CURRENT_YEAR}</div>
            <h1 style={S.h1}>Calcolo IMU {CURRENT_YEAR} — NaroInComune</h1>
            <p style={S.sub}>Imposta Municipale Unica — stima rapida e immediata</p>
            <p style={{ color: "#C5A059", fontFamily: "serif", fontStyle: "italic", marginTop: "8px", fontSize: "11px", letterSpacing: "0.05em" }}>"Partecipare è un dovere, digitale è un diritto"</p>
            <div style={{ height: "4px", width: "100px", background: "linear-gradient(90deg, #C5A059 0%, #B08D45 100%)", marginTop: "12px", borderRadius: "2px" }}></div>
          </div>
          <div style={S.headerCards}>
            {[
              { l: "Immobili", v: immobili.length, a: false },
              { l: "Totale annuo (Dovuto)", v: `€ ${fmt(totali.totaleDovuto)}`, a: true, labelColor: "#F0F4F8" },
              { l: "Acconto 16/06", v: `€ ${fmt(totali.ravAcconto)}`, a: false, sub: totali.ravAcconto > totali.acconto ? `(di cui €${fmt(totali.ravAcconto - totali.acconto)} ravv.)` : null },
              { l: "Saldo 16/12", v: `€ ${fmt(totali.ravSaldo)}`, a: false, sub: totali.ravSaldo > totali.saldo ? `(di cui €${fmt(totali.ravSaldo - totali.saldo)} ravv.)` : null },
            ].map(({ l, v, a, labelColor, sub }) => (
              <div key={l} style={{ ...S.hCard, ...(a ? S.hCardAccent : {}) }}>
                <div style={{ ...S.hCardLabel, ...(labelColor ? { color: labelColor } : {}) }}>{l}</div>
                <div style={{ ...S.hCardVal, ...(a ? { color: "#fff", fontSize: "1.4rem" } : {}) }}>{v}</div>
                {sub && <div style={{ fontSize: "0.6rem", color: "#dc2626", marginTop: 2, fontWeight: 600 }}>{sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div style={{ ...S.layout, maxWidth: 1400 }}>
        {/* ── SIDEBAR ── */}
        <aside style={{
          ...S.sidebar,
          width: isSidebarOpen ? 420 : 0,
          minWidth: isSidebarOpen ? 320 : 0,
          opacity: isSidebarOpen ? 1 : 0,
          padding: isSidebarOpen ? undefined : 0,
          borderRightWidth: isSidebarOpen ? 1 : 0,
          overflow: isSidebarOpen ? "auto" : "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}>

          {/* Dati contribuente */}
          <div style={S.sectionBlock}>
            <div style={S.sectionTitle}><Calculator size={13}/> Dati contribuente</div>
            <div style={S.inputWrap}>
              <label style={S.label}>Nome / Ragione sociale</label>
              <input style={S.input} type="text" placeholder="Mario Rossi" value={datiContribuente.nome} onChange={e => handleContribuenteChange("nome", e.target.value)} />
            </div>
            <div style={S.inputWrap}>
              <label style={S.label}>
                Codice Fiscale 
                {datiContribuente.codFiscale && (
                  <span style={{ marginLeft: 8, fontSize: "0.6rem", color: isCfValid ? "#15803d" : "#dc2626" }}>
                    {isCfValid ? "✓ Valido" : "✗ Formato errato"}
                  </span>
                )}
              </label>
              <input 
                style={{ ...S.input, borderColor: !isCfValid && datiContribuente.codFiscale ? "#dc2626" : "#d1d5db" }} 
                type="text" 
                placeholder="RSSMRA80A01H501Z" 
                value={datiContribuente.codFiscale} 
                onChange={e => handleContribuenteChange("codFiscale", e.target.value.toUpperCase())} 
              />
            </div>
            <div style={S.inputWrap}>
              <label style={S.label}>Comune di residenza</label>
              <AutocompleteComune 
                value={datiContribuente.comune} 
                onChange={val => handleContribuenteChange("comune", val)} 
                inputStyle={S.input} 
                placeholder="Inizia a digitare..." 
              />
            </div>
            <div style={{ ...S.inputWrap, marginTop: 12, borderTop: "1px dashed #e5e7eb", paddingTop: 12 }}>
              <label style={S.label}>Data di versamento</label>
              <input style={S.input} type="date" value={dataVersamento} onChange={e => setDataVersamento(e.target.value)} />
              <div style={{ fontSize: "0.65rem", color: "#6b7280", marginTop: 4 }}>
                Usata per il calcolo di sanzioni e interessi (Ravvedimento Operoso)
              </div>
            </div>
          </div>

          {/* RNDT Panel */}
          <div style={S.sectionBlock}>
            <RNDTPanel 
              comuneNome={datiContribuente.comune} 
              comuneCodice={form.codComune} 
              comuneSigla={undefined}
              bbox={undefined}
            />
          </div>

          {/* Form immobile */}
          <div style={S.sectionBlock}>
            <div style={{ ...S.sectionTitle, cursor: "pointer", justifyContent: "space-between" }} onClick={() => setFormOpen(o => !o)}>
              <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                {editingId ? <Edit3 size={13} color="#C5A059"/> : <Plus size={13} color="#003366"/>}
                {editingId ? "Modifica immobile" : "Inserisci immobile"}
              </span>
              {formOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </div>

            {formOpen && (
              <div style={{ marginTop: 12 }}>
                <div style={S.inputWrap}>
                  <label style={S.label}>Anno di riferimento</label>
                  <select style={S.select} value={form.annoRiferimento} onChange={e => handleChange("annoRiferimento", +e.target.value)}>
                    {Array.from({length: 6}, (_, i) => CURRENT_YEAR - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div style={S.inputWrap}>
                  <label style={S.label}>Tipologia immobile</label>
                  <select style={S.select} value={form.tipologia} onChange={e => handleChange("tipologia", e.target.value)}>
                    {gruppi.map(g => (
                      <optgroup key={g} label={`── ${g} ──`}>
                        {TIPOLOGIE.filter(t => t.gruppo === g).map(t => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div style={S.inputWrap}>
                  <label style={S.label}>Riferimento immobile</label>
                  <input style={S.input} type="text" placeholder="Via Roma 5 – Foglio 3, Part. 12" value={form.riferimento} onChange={e => handleChange("riferimento", e.target.value)} />
                </div>

                <div style={S.row2}>
                  <div style={S.inputWrap}>
                    <label style={S.label}>Comune immobile</label>
                    <AutocompleteComune 
                      value={form.comuneImmobile || ""} 
                      onChange={val => handleChange("comuneImmobile", val)} 
                      onSelect={c => handleChange("codComune", c.codiceCatastale)}
                      inputStyle={S.input}
                      placeholder="Cerca comune..." 
                    />
                  </div>
                  <div style={S.inputWrap}>
                    <label style={S.label}>Cod. Comune (F24)</label>
                    <input style={S.input} type="text" placeholder="H501" maxLength={4} value={form.codComune} onChange={e => handleChange("codComune", e.target.value.toUpperCase())} />
                  </div>
                </div>

                <div style={S.inputWrap}>
                  <label style={S.label}>Cod. Tributo</label>
                  <select style={S.select} value={form.codTributo} onChange={e => handleChange("codTributo", e.target.value)}>
                    <option value="3912">3912 – Ab. principale</option>
                    <option value="3913">3913 – Pertinenze ab. princ.</option>
                    <option value="3914">3914 – Terreni agricoli</option>
                    <option value="3916">3916 – Aree fabbricabili</option>
                    <option value="3918">3918 – Altri fabbricati</option>
                    <option value="3925">3925 – Cat. D (Stato)</option>
                    <option value="3930">3930 – Cat. D (Comune)</option>
                  </select>
                </div>

                {tip?.esente ? (
                  <div style={S.esenteBox}>
                    <CheckCircle2 size={15} color="#16a34a"/>
                    <span>Questa tipologia è <strong>esente IMU</strong>. Nessun versamento dovuto.</span>
                  </div>
                ) : (
                  <>
                    <div style={S.inputWrap}>
                      <label style={S.label}>{tip?.isArea ? "Valore venale area (€)" : "Rendita catastale non rivalutata (€)"}</label>
                      <div style={S.inputPrefix}>
                        <span style={S.prefixLabel}>€</span>
                        <input style={S.inputInner} type="number" min="0" step="0.01" placeholder="0,00"
                          value={tip?.isArea ? form.areaValore : form.rendita}
                          onChange={e => handleChange(tip?.isArea ? "areaValore" : "rendita", e.target.value)} />
                      </div>
                      {!tip?.isArea && tip && (
                        <div style={S.hint}>Base imponibile ≈ <strong>€ {fmtInt(Math.round((parseFloat(form.rendita)||0) * tip.rivalutazione * tip.moltiplicatore))}</strong> (×{tip.rivalutazione} × {tip.moltiplicatore})</div>
                      )}
                    </div>

                    <div style={S.row3}>
                      <div style={S.inputWrap}>
                        <label style={S.label}>% possesso</label>
                        <div style={S.inputSuffix}>
                          <input style={S.inputInner} type="number" min="1" max="100" value={form.percentuale} onChange={e => handleChange("percentuale", e.target.value)} />
                          <span style={S.suffixLabel}>%</span>
                        </div>
                      </div>
                      <div style={S.inputWrap}>
                        <label style={S.label}>Mese inizio</label>
                        <select style={S.select} value={form.meseInizio} onChange={e => handleChange("meseInizio", +e.target.value)}>
                          {MESI.map((m, i) => <option key={i} value={i}>{m.slice(0,3)}</option>)}
                        </select>
                      </div>
                      <div style={S.inputWrap}>
                        <label style={S.label}>Mese fine</label>
                        <select style={S.select} value={form.meseFine} onChange={e => handleChange("meseFine", +e.target.value)}>
                          {MESI.map((m, i) => <option key={i} value={i} disabled={i < form.meseInizio}>{m.slice(0,3)}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={S.row2}>
                      <div style={S.inputWrap}>
                        <label style={S.label}>Aliquota (‰) — Base: {tip?.aliquotaBase}‰</label>
                        <div style={S.inputSuffix}>
                          <input style={S.inputInner} type="number" min="0" max="10.6" step="0.1"
                            placeholder={`${tip?.aliquotaBase ?? ""}`} value={form.aliquota}
                            onChange={e => handleChange("aliquota", e.target.value)} />
                          <span style={S.suffixLabel}>‰</span>
                        </div>
                        <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: 2 }}>
                          Lascia vuoto per usare l'aliquota base del {tip?.aliquotaBase}‰
                        </div>
                      </div>
                      <div style={S.inputWrap}>
                        <label style={S.label}>Storico / Inagibile</label>
                        <select style={S.select} value={form.storico} onChange={e => handleChange("storico", e.target.value)}>
                          <option value="no">Nessuna riduzione</option>
                          <option value="storico">Storico (−50%)</option>
                          <option value="inagibile">Inagibile (−50%)</option>
                        </select>
                      </div>
                    </div>

                    {form.tipologia === "ab_principale_pregio" && (
                      <div style={S.inputWrap}>
                        <label style={S.label}>Detrazione ab. principale (€)</label>
                        <div style={S.inputPrefix}>
                          <span style={S.prefixLabel}>€</span>
                          <input style={S.inputInner} type="number" min="0" value={form.detrazione} onChange={e => handleChange("detrazione", e.target.value)} />
                        </div>
                      </div>
                    )}

                    {risultato && !risultato.esente && (
                      <div style={S.preview}>
                        <div style={S.previewTitle}>Anteprima calcolo</div>
                        
                        {/* Alert Ravvedimento */}
                        {(risultato.ravAcconto.late || risultato.ravSaldo.late) && (
                          <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "8px 10px", borderRadius: 4, marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#92400e", fontWeight: 700, fontSize: "0.7rem", marginBottom: 4 }}>
                              <AlertCircle size={12}/> ATTENZIONE: SCADENZA SUPERATA
                            </div>
                            <div style={{ fontSize: "0.65rem", color: "#b45309", lineHeight: 1.4 }}>
                              La data di versamento ({dv.toLocaleDateString("it-IT")}) è successiva alle scadenze ordinarie. 
                              Verranno applicate sanzioni e interessi.
                            </div>
                          </div>
                        )}

                        <div style={S.previewGrid}>
                          <div style={S.pvRow}><span>Base imponibile</span><span>€ {fmtInt(risultato.baseImponibile)}</span></div>
                          <div style={S.pvRow}><span>Aliquota applicata</span><span>{parseFloat(form.aliquota) || tip?.aliquotaBase || 0} ‰</span></div>
                          <div style={S.pvRow}><span>Imposta annua</span><span>€ {fmt(risultato.imposta)}</span></div>
                          {risultato.detrazione > 0 && <div style={S.pvRow}><span>Detrazione</span><span style={{color:"#16a34a"}}>− € {fmt(risultato.detrazione)}</span></div>}
                          <div style={{ borderTop: "1px solid #e5e7eb", margin: "6px 0" }}/>
                          <div style={{ ...S.pvRow, fontWeight: 700, color: "#111827", fontSize: "1rem" }}><span>Totale dovuto</span><span style={{color:"#003366"}}>€ {fmt(risultato.importo)}</span></div>
                        </div>
                        <div style={S.rateRow}>
                          <div style={S.rata}>
                            <div style={S.rataLabel}>Acconto (16/06)</div>
                            <div style={S.rataVal}>€ {fmt(risultato.ravAcconto.totale)}</div>
                            {risultato.ravAcconto.late && <div style={{ fontSize: "0.55rem", color: "#92400e" }}>Incl. sanz/int</div>}
                          </div>
                          <div style={S.rata}>
                            <div style={S.rataLabel}>Saldo (16/12)</div>
                            <div style={S.rataVal}>€ {fmt(risultato.ravSaldo.totale)}</div>
                            {risultato.ravSaldo.late && <div style={{ fontSize: "0.55rem", color: "#92400e" }}>Incl. sanz/int</div>}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div style={S.formBtns}>
                  <button style={editingId ? S.btnAmber : S.btnBlue} onClick={aggiungiImmobile}>
                    {editingId ? <><Edit3 size={14}/> Aggiorna immobile</> : <><Plus size={14}/> Aggiungi alla lista</>}
                  </button>
                  {editingId && (
                    <button style={S.btnGray} onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>
                      <X size={13}/> Annulla
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

        </aside>

        {/* ── MAIN ── */}
        <main style={{ ...S.main, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
          {/* Tab bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottomWidth:"2px", borderBottomStyle:"solid", borderBottomColor:"#e5e7eb", marginBottom:20 }}>
            <div style={{ display: "flex", gap: 0 }}>
              <button style={{ ...S.tab, ...(activeTab === "lista" ? S.tabActive : {}) }} onClick={() => setActiveTab("lista")}>
                <Home size={14}/> Lista Immobili ({immobili.length})
              </button>
              <button style={{ ...S.tab, ...(activeTab === "f24" ? S.tabActive : {}) }} onClick={() => setActiveTab("f24")}>
                <Printer size={14}/> Modello F24
              </button>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 600, padding: "8px 12px" }}
            >
              {isSidebarOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
              {isSidebarOpen ? "Nascondi Sidebar" : "Mostra Sidebar"}
            </button>
          </div>

          {/* ── TAB: Lista ── */}
          {activeTab === "lista" && (
            <>
              {immobili.length === 0 ? (
                <div style={S.empty}>
                  <Home size={52} color="#d1d5db" strokeWidth={1}/>
                  <p style={{ color:"#9ca3af", marginTop:14, fontSize:"0.95rem", lineHeight:1.6 }}>
                    Nessun immobile aggiunto.<br/>Compila il modulo a sinistra per iniziare.
                  </p>
                </div>
              ) : (
                <>
                  <div style={S.listHead}>
                    <span style={S.listTitle}>Immobili in lista — {immobili.length}</span>
                    <button style={S.btnRed} onClick={() => { setImmobili([]); notify("Lista svuotata.", "info"); }}>
                      <Trash2 size={12}/> Svuota lista
                    </button>
                  </div>

                  <div style={S.tableWrap}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          {["#","Immobile / Tipologia","Anno","Rendita","Base imp.","Possesso","Aliquota","Imposta","Acconto","Saldo",""].map((h, i) => (
                            <th key={i} style={i <= 1 ? S.th : S.thR}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {immobili.map((imm, idx) => {
                          const r = calcolaIMU(imm, dv);
                          const t = TIPOLOGIE.find(x => x.id === imm.tipologia);
                          const aliq = parseFloat(imm.aliquota) || t?.aliquotaBase || 0;
                          const isEd = editingId === imm.id;
                          return (
                            <tr key={imm.id} style={{ ...S.tr, ...(isEd ? S.trEd : {}), ...(idx%2===0 ? {} : S.trAlt) }}>
                              <td style={{ ...S.td, color:"#9ca3af", width:30 }}>{idx+1}</td>
                              <td style={S.td}>
                                <div style={{ fontWeight:700, fontSize:"0.875rem", color:"#111827" }}>{imm.riferimento || `Immobile ${idx+1}`}</div>
                                <div style={{ fontSize:"0.72rem", color:"#6b7280", marginTop:2, maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t?.label}</div>
                              </td>
                              <td style={S.tdR}>{imm.annoRiferimento || CURRENT_YEAR}</td>
                              <td style={S.tdR}>{t?.isArea ? <span style={{color:"#9ca3af"}}>—</span> : `€ ${fmt(parseFloat(imm.rendita)||0)}`}</td>
                              <td style={S.tdR}>{r?.esente ? <span style={S.tag}>Esente</span> : `€ ${fmtInt(r?.baseImponibile||0)}`}</td>
                              <td style={S.tdR}>{imm.percentuale}% · {r?.mesi}m</td>
                              <td style={S.tdR}>{r?.esente ? "—" : `${aliq} ‰`}</td>
                              <td style={{ ...S.tdR, fontWeight:700, color:"#111827" }}>{r?.esente ? "—" : `€ ${fmt(r?.importo||0)}`}</td>
                              <td style={{ ...S.tdR, color:"#003366", fontWeight:600 }}>
                                {r?.esente ? "—" : (
                                  <div>
                                    <div>€ {fmt(r?.ravAcconto.totale)}</div>
                                    {r?.ravAcconto.late && <div style={{ fontSize: "0.6rem", color: "#92400e" }}>Ravv.</div>}
                                  </div>
                                )}
                              </td>
                              <td style={{ ...S.tdR, color:"#003366", fontWeight:600 }}>
                                {r?.esente ? "—" : (
                                  <div>
                                    <div>€ {fmt(r?.ravSaldo.totale)}</div>
                                    {r?.ravSaldo.late && <div style={{ fontSize: "0.6rem", color: "#92400e" }}>Ravv.</div>}
                                  </div>
                                )}
                              </td>
                              <td style={{ ...S.tdR, whiteSpace:"nowrap" }}>
                                <button style={S.iconBtn} onClick={() => modificaImmobile(imm)} title="Modifica"><Edit3 size={14}/></button>
                                <button style={{ ...S.iconBtn, color:"#dc2626" }} onClick={() => eliminaImmobile(imm.id)} title="Elimina"><Trash2 size={14}/></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Totali */}
                  <div style={S.totaliBar}>
                    <div style={S.totItem}>
                      <div style={S.totLabel}>Totale annuo IMU (Dovuto)</div>
                      <div style={{ ...S.totVal, color:"#003366", fontSize:"1.4rem" }}>€ {fmt(totali.totaleDovuto)}</div>
                      {totali.totaleDovuto > totali.importo && <div style={{ fontSize: "0.65rem", color: "#6b7280" }}>Imposta base: € {fmt(totali.importo)}</div>}
                    </div>
                    <div style={S.totItem}>
                      <div style={S.totLabel}>1ª Rata · Acconto (16 giugno 2026)</div>
                      <div style={S.totVal}>€ {fmt(totali.ravAcconto)}</div>
                      {totali.ravAcconto > totali.acconto && <div style={{ fontSize: "0.7rem", color: "#dc2626", marginTop: 4, fontWeight: 600 }}>Include € {fmt(totali.ravAcconto - totali.acconto)} di ravvedimento</div>}
                    </div>
                    <div style={S.totItem}>
                      <div style={S.totLabel}>2ª Rata · Saldo (16 dicembre 2026)</div>
                      <div style={S.totVal}>€ {fmt(totali.ravSaldo)}</div>
                      {totali.ravSaldo > totali.saldo && <div style={{ fontSize: "0.7rem", color: "#dc2626", marginTop: 4, fontWeight: 600 }}>Include € {fmt(totali.ravSaldo - totali.saldo)} di ravvedimento</div>}
                    </div>
                  </div>

                  <div style={S.disclaimer}>
                    <AlertCircle size={13} color="#9ca3af"/>
                    <span>Stima indicativa. Verifica le aliquote deliberate dal Comune prima del versamento. Scadenze 2026: acconto 16 giugno · saldo 16 dicembre.</span>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── TAB: F24 ── */}
          {activeTab === "f24" && (
            <div>
              <div style={S.f24Header}>
                <div>
                  <div style={{ fontWeight:800, fontSize:"1.1rem", color:"#111827", letterSpacing:"-0.02em" }}>Modello F24 — Compilazione automatica</div>
                  <div style={{ fontSize:"0.8rem", color:"#6b7280", marginTop:2 }}>Sezione IMU e altri tributi locali · Anno 2026</div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <button 
                    onClick={() => setPagamentoUnico(!pagamentoUnico)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: pagamentoUnico ? "#e0f2fe" : "white", border: pagamentoUnico ? "1px solid #bae6fd" : "1px solid #cbd5e1", cursor: "pointer", padding: "6px 12px", borderRadius: 6, transition: "all 0.2s" }}
                  >
                    {pagamentoUnico ? <CheckSquare size={18} color="#0369a1" /> : <Square size={18} color="#6b7280" />}
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: pagamentoUnico ? "#0369a1" : "#4b5563" }}>Soluzione Unica</span>
                  </button>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button 
                      onClick={() => fillF24('semplificato')}
                      style={{ ...S.btnBlue, padding:"6px 12px", fontSize:"0.8rem", cursor: "pointer" }}
                    >
                      <Download size={14}/> F24 Semplificato (PDF)
                    </button>
                    <button 
                      onClick={() => fillF24('ordinario')}
                      style={{ ...S.btnBlue, background: "#002244", borderColor: "#002244", padding:"6px 12px", fontSize:"0.8rem", cursor: "pointer" }}
                    >
                      <Download size={14}/> F24 Ordinario (PDF)
                    </button>
                  </div>
                </div>
              </div>

              {immobiliF24.length === 0 ? (
                <div style={{ ...S.empty, minHeight:200 }}>
                  <p style={{ color:"#9ca3af", fontSize:"0.9rem" }}>Nessun immobile imponibile in lista. Aggiungi immobili dalla colonna sinistra.</p>
                </div>
              ) : (
                <>
                  {/* Dati contribuente nel F24 */}
                  <div style={S.f24Section}>
                    <div style={S.f24STitle}>CONTRIBUENTE</div>
                    <div style={S.f24ContribRow}>
                      <div style={S.f24Field}><div style={S.f24FieldLabel}>Codice fiscale</div><div style={S.f24FieldVal}>{datiContribuente.codFiscale || <span style={{color:"#d1d5db"}}>_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _</span>}</div></div>
                      <div style={S.f24Field}><div style={S.f24FieldLabel}>Cognome e nome / Ragione sociale</div><div style={S.f24FieldVal}>{datiContribuente.nome || <span style={{color:"#d1d5db"}}>________________________________</span>}</div></div>
                      <div style={S.f24Field}><div style={S.f24FieldLabel}>Comune di residenza</div><div style={S.f24FieldVal}>{datiContribuente.comune || <span style={{color:"#d1d5db"}}>________________</span>}</div></div>
                    </div>
                  </div>

                  {/* Sezione IMU */}
                  <div style={S.f24Section}>
                    <div style={S.f24STitle}>SEZIONE "IMU E ALTRI TRIBUTI LOCALI"</div>
                    <div style={{ overflowX:"auto" }}>
                      <table style={{ ...S.table, minWidth:780 }}>
                        <thead>
                          <tr style={{ background:"#002244" }}>
                            {["Cod.\nComune","Cod.\nTributo","Aliq.","Anno\nrif.","Importo\nimposta","Rata\n(✓/✗)","Ravv.\n(Sanz+Int)","Versare","Detr./\nRid.","A debito"].map((h, i) => (
                              <th key={i} style={{ ...S.f24Th, textAlign: i >= 4 ? "right" : "center" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {immobiliF24.map((imm, idx) => {
                            const r = calcolaIMU(imm, dv);
                            const t = TIPOLOGIE.find(x => x.id === imm.tipologia);
                            const aliq = parseFloat(imm.aliquota) || t?.aliquotaBase || 0;
                            
                            const ravvTot = pagamentoUnico 
                              ? (r?.ravAcconto.sanzione + r?.ravAcconto.interessi + r?.ravSaldo.sanzione + r?.ravSaldo.interessi)
                              : r?.ravAcconto.sanzione + r?.ravAcconto.interessi;
                            
                            const versare = pagamentoUnico 
                              ? (r?.acconto + r?.saldo)
                              : r?.acconto;

                            const aDebito = versare + ravvTot;

                            return (
                              <tr key={imm.id} style={{ ...S.tr, ...(idx%2===0 ? {} : S.trAlt) }}>
                                <td style={{ ...S.f24Td, textAlign:"center", fontWeight:700, letterSpacing:"0.05em" }}>
                                  {imm.codComune || <span style={{color:"#d1d5db", fontStyle:"italic"}}>F???</span>}
                                </td>
                                <td style={{ ...S.f24Td, textAlign:"center", fontWeight:700, color:"#003366" }}>{imm.codTributo || "3918"}</td>
                                <td style={{ ...S.f24Td, textAlign:"center" }}>{aliq}‰</td>
                                <td style={{ ...S.f24Td, textAlign:"center" }}>{imm.annoRiferimento || CURRENT_YEAR}</td>
                                <td style={{ ...S.f24Td, textAlign:"right", fontWeight:600 }}>€ {fmt(r?.importo||0)}</td>
                                <td style={{ ...S.f24Td, textAlign:"center", fontSize:"0.75rem", fontWeight: 700 }}>{pagamentoUnico ? "ACC/SAL" : "ACC"}</td>
                                <td style={{ ...S.f24Td, textAlign:"right", color: ravvTot > 0 ? "#b91c1c" : "#9ca3af", fontWeight: ravvTot > 0 ? 600 : 400 }}>{ravvTot > 0 ? `€ ${fmt(ravvTot)}` : "0,00"}</td>
                                <td style={{ ...S.f24Td, textAlign:"right", fontWeight:700, color:"#003366" }}>€ {fmt(versare)}</td>
                                <td style={{ ...S.f24Td, textAlign:"right" }}>–</td>
                                <td style={{ ...S.f24Td, textAlign:"right", fontWeight:800, fontSize:"0.95rem" }}>€ {fmt(aDebito)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ background:"#F0F4F8", borderTop:"2px solid #003366" }}>
                            <td colSpan={9} style={{ padding:"10px 12px", fontWeight:700, fontSize:"0.8rem", textTransform:"uppercase", letterSpacing:"0.07em", color:"#003366" }}>
                              {pagamentoUnico ? "Totale Soluzione Unica (Acconto + Saldo)" : "Totale 1ª Rata · Acconto"}
                            </td>
                            <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:800, fontSize:"1.1rem", color:"#003366" }}>
                              € {fmt(pagamentoUnico ? totali.ravAcconto + totali.ravSaldo : totali.ravAcconto)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <div style={S.f24Note}>
                      <strong>N.B.</strong> In caso di aliquote diverse tra acconto e saldo, per il calcolo della prima rata viene applicata l'aliquota stabilita per l'acconto e quindi l'importo prima rata potrebbe essere diverso dal 50% dell'imposta.
                    </div>
                  </div>

                  {/* Scadenze */}
                  <div style={S.f24Section}>
                    <div style={S.f24STitle}>SCADENZE DI VERSAMENTO 2026</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:10 }}>
                      {[
                        { label:"1ª Rata · Acconto", date:"16 Giugno 2026", imp: totali.ravAcconto, cod:"Prima rata" },
                        { label:"2ª Rata · Saldo", date:"16 Dicembre 2026", imp: totali.ravSaldo, cod:"Seconda rata" },
                      ].map(s => (
                        <div key={s.label} style={S.scadBox}>
                          <div style={{ fontSize:"0.7rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:"#6b7280", marginBottom:6 }}>{s.label}</div>
                          <div style={{ fontSize:"0.875rem", fontWeight:700, color:"#111827", marginBottom:4 }}>Entro il <strong>{s.date}</strong></div>
                          <div style={{ fontSize:"1.6rem", fontWeight:800, color:"#003366", fontVariantNumeric:"tabular-nums" }}>€ {fmt(s.imp)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Codici tributo */}
                  <div style={S.f24Section}>
                    <div style={S.f24STitle}>RIFERIMENTO CODICI TRIBUTO IMU</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:6, marginTop:8 }}>
                      {[
                        ["3912","Abitazione principale e pertinenze (A1,A8,A9)"],
                        ["3913","Pertinenze abitazione principale"],
                        ["3914","Terreni agricoli"],
                        ["3916","Aree fabbricabili"],
                        ["3918","Altri fabbricati"],
                        ["3925","Fabbricati Cat. D – quota Stato"],
                        ["3930","Fabbricati Cat. D – quota Comune"],
                      ].map(([cod, desc]) => (
                        <div key={cod} style={S.codRow}>
                          <span style={S.codBadge}>{cod}</span>
                          <span style={{ fontSize:"0.75rem", color:"#4b5563", lineHeight:1.3 }}>{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={S.disclaimer}>
                    <AlertCircle size={13} color="#9ca3af"/>
                    <span>Il Modello F24 definitivo deve essere compilato e presentato tramite i canali ufficiali dell'Agenzia delle Entrate (F24 online, banca, CAF). Questo prospetto è solo indicativo.</span>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── STILI ─────────────────────────────────────────────────────────────────

const S = {
  page: { minHeight:"100vh", background:"#f8fafc", fontFamily:"'IBM Plex Sans','Segoe UI',system-ui,sans-serif", color:"#111827", fontSize:"14px" },

  notif: { position:"fixed", top:16, right:16, zIndex:9999, display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:4, color:"#fff", fontSize:"0.83rem", fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,0.2)" },

  header: { background:"#fff", borderBottomWidth:"2px", borderBottomStyle:"solid", borderBottomColor:"#e5e7eb", padding:"20px 28px" },
  headerInner: { maxWidth:1400, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16 },
  badge: { display:"inline-block", padding:"2px 10px", background:"#F0F4F8", border:"1px solid #CCD6E0", borderRadius:3, color:"#003366", fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 },
  h1: { margin:"0 0 4px", fontSize:"clamp(1.4rem,3vw,1.9rem)", fontWeight:800, letterSpacing:"-0.03em", color:"#0f172a" },
  sub: { margin:0, color:"#6b7280", fontSize:"0.8rem", maxWidth:480 },
  headerCards: { display:"flex", gap:8, flexWrap:"wrap" },
  hCard: { background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:4, padding:"10px 16px", minWidth:120 },
  hCardAccent: { background:"#003366", border:"1px solid #003366" },
  hCardLabel: { fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#6b7280", marginBottom:4 },
  hCardVal: { fontSize:"1.1rem", fontWeight:800, color:"#111827", fontVariantNumeric:"tabular-nums" },

  layout: { display:"flex", maxWidth:1400, margin:"0 auto", minHeight:"calc(100vh - 90px)" },

  sidebar: { width:420, minWidth:320, background:"#fff", borderRight:"1px solid #e5e7eb", flexShrink:0, overflowY:"auto" },
  sectionBlock: { borderBottomWidth:"1px", borderBottomStyle:"solid", borderBottomColor:"#e5e7eb", padding:"16px" },
  sectionTitle: { display:"flex", alignItems:"center", gap:6, fontSize:"0.7rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:"#374151", marginBottom:10 },

  label: { display:"block", fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#6b7280", marginBottom:4 },
  inputWrap: { marginBottom:10 },
  input: { width:"100%", padding:"7px 10px", border:"1px solid #d1d5db", borderRadius:4, fontSize:"0.875rem", color:"#111827", background:"#fff", outline:"none", boxSizing:"border-box" },
  select: { width:"100%", padding:"7px 10px", border:"1px solid #d1d5db", borderRadius:4, fontSize:"0.85rem", color:"#111827", background:"#fff", outline:"none" },
  inputPrefix: { display:"flex", alignItems:"stretch", border:"1px solid #d1d5db", borderRadius:4, overflow:"hidden" },
  inputSuffix: { display:"flex", alignItems:"stretch", border:"1px solid #d1d5db", borderRadius:4, overflow:"hidden" },
  inputInner: { flex:1, padding:"7px 10px", border:"none", outline:"none", fontSize:"0.875rem", color:"#111827", background:"#fff" },
  prefixLabel: { padding:"0 10px", background:"#f3f4f6", borderRight:"1px solid #d1d5db", display:"flex", alignItems:"center", fontSize:"0.85rem", color:"#6b7280", fontWeight:600 },
  suffixLabel: { padding:"0 10px", background:"#f3f4f6", borderLeft:"1px solid #d1d5db", display:"flex", alignItems:"center", fontSize:"0.85rem", color:"#6b7280", fontWeight:600 },
  hint: { fontSize:"0.68rem", color:"#9ca3af", marginTop:3, lineHeight:1.4 },
  row2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 },
  row3: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 },

  esenteBox: { display:"flex", alignItems:"flex-start", gap:8, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:4, padding:"10px 12px", color:"#15803d", fontSize:"0.8rem", lineHeight:1.5, marginBottom:10 },

  preview: { background:"#F0F4F8", border:"1px solid #CCD6E0", borderRadius:4, padding:"12px 14px", marginTop:8, marginBottom:10 },
  previewTitle: { fontSize:"0.68rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:"#003366", marginBottom:8 },
  previewGrid: {},
  pvRow: { display:"flex", justifyContent:"space-between", fontSize:"0.8rem", color:"#374151", padding:"2px 0" },
  rateRow: { display:"flex", gap:8, marginTop:10 },
  rata: { flex:1, background:"#fff", border:"1px solid #CCD6E0", borderRadius:4, padding:"8px 10px" },
  rataLabel: { fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#6b7280", marginBottom:2 },
  rataVal: { fontSize:"1.05rem", fontWeight:800, color:"#003366", fontVariantNumeric:"tabular-nums" },

  formBtns: { display:"flex", gap:8, marginTop:12 },
  btnBlue: { flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px 14px", background:"#003366", border:"1px solid #003366", borderRadius:4, color:"#fff", fontWeight:700, fontSize:"0.82rem", cursor:"pointer" },
  btnAmber: { flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px 14px", background:"#C5A059", border:"1px solid #C5A059", borderRadius:4, color:"#003366", fontWeight:700, fontSize:"0.82rem", cursor:"pointer" },
  btnGray: { display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"9px 12px", background:"#fff", border:"1px solid #d1d5db", borderRadius:4, color:"#6b7280", fontWeight:600, fontSize:"0.8rem", cursor:"pointer" },
  btnFull: { display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"8px 14px", background:"#fff", border:"1px solid #d1d5db", borderRadius:4, color:"#374151", fontWeight:600, fontSize:"0.8rem", cursor:"pointer", width:"100%" },
  btnRed: { display:"flex", alignItems:"center", gap:5, padding:"5px 12px", background:"#fff", border:"1px solid #fca5a5", borderRadius:4, color:"#dc2626", fontWeight:600, fontSize:"0.75rem", cursor:"pointer" },

  main: { flex:1, padding:"24px 28px", background:"#f8fafc" },

  tabBar: { display:"flex", gap:0, borderBottomWidth:"2px", borderBottomStyle:"solid", borderBottomColor:"#e5e7eb", marginBottom:20 },
  tab: { display:"flex", alignItems:"center", gap:6, padding:"10px 20px", background:"transparent", border:"none", borderBottomWidth:"2px", borderBottomStyle:"solid", borderBottomColor:"transparent", marginBottom:-2, cursor:"pointer", fontSize:"0.85rem", fontWeight:600, color:"#6b7280" },
  tabActive: { color:"#003366", borderBottomColor:"#003366" },

  empty: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:300, textAlign:"center" },

  listHead: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 },
  listTitle: { fontWeight:700, fontSize:"0.9rem", color:"#374151" },

  tableWrap: { overflowX:"auto", border:"1px solid #e5e7eb", borderRadius:4 },
  table: { width:"100%", borderCollapse:"collapse" },
  th: { padding:"9px 12px", textAlign:"left", fontSize:"0.68rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.07em", color:"#6b7280", background:"#f9fafb", borderBottomWidth:"1px", borderBottomStyle:"solid", borderBottomColor:"#e5e7eb", whiteSpace:"nowrap" },
  thR: { padding:"9px 12px", textAlign:"right", fontSize:"0.68rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.07em", color:"#6b7280", background:"#f9fafb", borderBottomWidth:"1px", borderBottomStyle:"solid", borderBottomColor:"#e5e7eb", whiteSpace:"nowrap" },
  tr: { borderBottomWidth:"1px", borderBottomStyle:"solid", borderBottomColor:"#f1f5f9" },
  trAlt: { background:"#fafafa" },
  trEd: { background:"#fffbeb", outline:"2px solid #f59e0b", outlineOffset:"-2px" },
  td: { padding:"10px 12px", verticalAlign:"middle" },
  tdR: { padding:"10px 12px", textAlign:"right", verticalAlign:"middle", fontVariantNumeric:"tabular-nums", fontSize:"0.85rem", color:"#374151" },
  iconBtn: { background:"none", border:"none", cursor:"pointer", color:"#9ca3af", padding:"3px 5px", borderRadius:3 },
  tag: { background:"#dcfce7", color:"#16a34a", borderRadius:3, padding:"1px 7px", fontSize:"0.68rem", fontWeight:700 },

  totaliBar: { display:"flex", gap:0, marginTop:16, border:"1px solid #e5e7eb", borderRadius:4, background:"#fff", overflow:"hidden" },
  totItem: { flex:1, padding:"14px 18px", borderRight:"1px solid #e5e7eb" },
  totLabel: { fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#6b7280", marginBottom:4 },
  totVal: { fontSize:"1.1rem", fontWeight:800, color:"#111827", fontVariantNumeric:"tabular-nums" },
  disclaimer: { display:"flex", alignItems:"flex-start", gap:6, marginTop:12, fontSize:"0.72rem", color:"#9ca3af", lineHeight:1.6 },

  // F24
  f24Header: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, padding:"0 0 16px", borderBottomWidth:"1px", borderBottomStyle:"solid", borderBottomColor:"#e5e7eb" },
  f24Section: { border:"1px solid #e5e7eb", borderRadius:4, marginBottom:14, overflow:"hidden" },
  f24STitle: { background:"#002244", color:"#fff", padding:"8px 14px", fontSize:"0.7rem", fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase" },
  f24ContribRow: { display:"grid", gridTemplateColumns:"1fr 2fr 1fr", gap:0, borderBottomWidth:"1px", borderBottomStyle:"solid", borderBottomColor:"#e5e7eb" },
  f24Field: { padding:"10px 14px", borderRight:"1px solid #e5e7eb" },
  f24FieldLabel: { fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#9ca3af", marginBottom:4 },
  f24FieldVal: { fontSize:"0.9rem", fontWeight:700, color:"#111827", fontFamily:"'IBM Plex Mono',monospace" },
  f24Th: { padding:"8px 10px", fontSize:"0.65rem", fontWeight:800, letterSpacing:"0.07em", textTransform:"uppercase", color:"#93c5fd", whiteSpace:"pre-line", lineHeight:1.3 },
  f24Td: { padding:"9px 10px", fontSize:"0.83rem", borderRight:"1px solid #f1f5f9", verticalAlign:"middle" },
  f24Note: { padding:"8px 14px", background:"#fffbeb", borderTopWidth:"1px", borderTopStyle:"solid", borderTopColor:"#fde68a", fontSize:"0.72rem", color:"#78350f", lineHeight:1.7 },
  scadBox: { border:"1px solid #e5e7eb", borderRadius:4, padding:"14px 18px", background:"#fff" },
  codRow: { display:"flex", alignItems:"flex-start", gap:8, padding:"6px 10px", background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:3 },
  codBadge: { background:"#002244", color:"#fff", padding:"2px 8px", borderRadius:2, fontSize:"0.72rem", fontWeight:800, fontFamily:"monospace", whiteSpace:"nowrap", flexShrink:0 },
};