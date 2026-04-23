/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  rndtService.js — Gestione API RNDT per Calcolatore IMU 2026    ║
 * ║  Repertorio Nazionale dei Dati Territoriali — geodati.gov.it    ║
 * ║  AgID — Agenzia per l'Italia Digitale                           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * STRUTTURA DEL FILE
 * ──────────────────
 * 1. COSTANTI & CONFIGURAZIONE
 * 2. COSTRUTTORI URL
 * 3. CLIENT API (fetch + parse)
 * 4. QUERY PREDEFINITE per il dominio IMU/catasto
 * 5. PARSER & NORMALIZZATORI dei risultati
 * 6. REACT HOOKS (useRNDT, useRNDTCatasto, useRNDTComune)
 * 7. COMPONENTE REACT <RNDTPanel />
 * 8. UTILITÀ (link GeoViewer, link ricerca, icone tipo)
 *
 * USO RAPIDO
 * ──────────
 *   import { useRNDTComune, RNDTPanel } from './rndtService';
 *
 *   // Hook: cerca dataset catastali per un comune
 *   const { datasets, loading, error } = useRNDTComune("Roma");
 *
 *   // Componente completo pronto all'uso
 *   <RNDTPanel comuneNome="Roma" comuneCodice="H501" />
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Map, Database, ExternalLink, Search, AlertCircle, RefreshCw, Globe, Layers, FileText, ChevronDown, ChevronUp, Info } from "lucide-react";

// ══════════════════════════════════════════════════════════════════════
// 1. COSTANTI & CONFIGURAZIONE
// ══════════════════════════════════════════════════════════════════════

/** Base URL dell'API REST RNDT (AgID) */
export const RNDT_BASE = "https://geodati.gov.it/RNDT/rest";

/** Base URL del GeoViewer RNDT */
export const RNDT_GEOVIEWER = "https://geodati.gov.it/geoportale/geoviewer/";

/** Base URL del portale RNDT per ricerca umana */
export const RNDT_PORTAL = "https://geodati.gov.it/geoportale/";

/** Timeout default per le chiamate API (ms) */
export const RNDT_TIMEOUT_MS = 6000;

/**
 * Categorie tematiche ISO 19115 rilevanti per IMU/catasto.
 * Usate come filtro nelle query RNDT.
 */
export const CATEGORIE_IMU = {
  PIANIFICAZIONE: "planningCadastre",   // Catasto e pianificazione urbana ← principale
  STRUTTURE:      "structure",           // Edifici e strutture
  TERRITORIO:     "boundaries",          // Confini amministrativi
  SUOLO:          "geoscientificInfo",   // Uso del suolo
  TRASPORTI:      "transportation",      // Rete stradale (riferimento indirizzi)
  SOCIETA:        "society",             // Dati socioeconomici
};

/**
 * Parole chiave di ricerca per dominio catastale/IMU.
 * Usate per costruire le query searchText.
 */
export const KEYWORDS_CATASTO = [
  "catasto",
  "catastale",
  "fabbricati",
  "particelle",
  "rendita",
  "uso del suolo",
  "destinazione uso",
  "PRG",
  "piano regolatore",
  "immobili",
  "edifici",
];

/**
 * Schemi metadato RNDT supportati.
 */
export const RNDT_SCHEMI = {
  DATASET:  "rndt?dataset",
  SERIES:   "rndt?series",
  SERVICES: "rndt?services",
  RASTER:   "rndt?raster",
};

/**
 * Formati di risposta supportati dall'API RNDT.
 */
export const RNDT_FORMATI = {
  JSON:   "pjson",
  GEOJSON:"xjson",
  ATOM:   "atom",
  CSV:    "CSV",
  KML:    "kml",
  HTML:   "html",
};

/**
 * Ordinamenti disponibili.
 */
export const RNDT_ORDER = {
  DATA_DESC:  "dateDescending",
  DATA_ASC:   "dateAscending",
  TITOLO:     "title",
  RILEVANZA:  "relevance",
  AREA_ASC:   "areaAscending",
  AREA_DESC:  "areaDescending",
};

// ══════════════════════════════════════════════════════════════════════
// 2. COSTRUTTORI URL
// ══════════════════════════════════════════════════════════════════════

interface SearchParams {
  searchText?: string;
  filter?: string;
  dataCategory?: string;
  max?: number;
  start?: number;
  orderBy?: string;
  bbox?: string;
  after?: string;
  before?: string;
  formato?: string;
}

interface NormalizzaMeta {
  query?: string;
  url?: string;
  tipoFiltro?: string;
}

interface RicercaParams {
  max?: number;
  categoria?: string;
  orderBy?: string;
}

/**
 * Costruisce l'URL per la ricerca documenti RNDT.
 *
 * @param {SearchParams} params
 * @returns {string} URL completo
 */
export function buildSearchURL(params: SearchParams = {}): string {
  const {
    searchText,
    filter,
    dataCategory,
    max = 10,
    start = 1,
    orderBy = RNDT_ORDER.RILEVANZA,
    bbox,
    after,
    before,
    formato = RNDT_FORMATI.JSON,
  } = params;
  const url = new URL(`${RNDT_BASE}/find/document`);
  const p = url.searchParams;

  if (searchText)    p.set("searchText",   searchText);
  if (filter)        p.set("filter",        filter);
  if (dataCategory)  p.set("dataCategory",  dataCategory);
  if (bbox)          p.set("bbox",          bbox);
  if (after)         p.set("after",         after);
  if (before)        p.set("before",        before);

  p.set("max",     String(max));
  p.set("start",   String(start));
  p.set("orderBy", orderBy);
  p.set("f",       formato);
  p.set("maxSearchTimeMilliSec", String(RNDT_TIMEOUT_MS));

  return url.toString();
}

/**
 * Costruisce l'URL per recuperare un singolo documento per ID.
 *
 * @param {string} id - fileIdentifier del metadato RNDT
 * @returns {string}
 */
export function buildDocumentURL(id) {
  return `${RNDT_BASE}/document?id=${encodeURIComponent(id)}`;
}

interface GeoViewerParams {
  lat?: number;
  lon?: number;
  zoom?: number;
}

/**
 * Costruisce URL del GeoViewer RNDT opzionalmente centrato su coordinate.
 *
 * @param {GeoViewerParams} [opts]
 * @returns {string}
 */
export function buildGeoViewerURL({ lat, lon, zoom = 12 }: GeoViewerParams = {}): string {
  if (lat && lon) {
    return `${RNDT_GEOVIEWER}?lat=${lat}&lon=${lon}&zoom=${zoom}`;
  }
  return RNDT_GEOVIEWER;
}

/**
 * Costruisce l'URL di ricerca nel portale RNDT (interfaccia umana).
 *
 * @param {string} testo - Testo di ricerca
 * @returns {string}
 */
export function buildPortalSearchURL(testo) {
  return `${RNDT_PORTAL}?searchText=${encodeURIComponent(testo)}`;
}

// ══════════════════════════════════════════════════════════════════════
// 3. CLIENT API
// ══════════════════════════════════════════════════════════════════════

/**
 * Esegue una chiamata all'API RNDT con timeout e gestione errori.
 *
 * @param {string} url - URL completo da chiamare
 * @returns {Promise<Object>} - Dati JSON parsed
 * @throws {RNDTError}
 */
export async function rndtFetch(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RNDT_TIMEOUT_MS + 2000);

  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timer);

    if (!resp.ok) {
      throw new RNDTError(`HTTP ${resp.status}: ${resp.statusText}`, "HTTP_ERROR", resp.status);
    }

    const text = await resp.text();

    // RNDT a volte restituisce HTML anche con f=pjson se non trova nulla
    if (text.trim().startsWith("<")) {
      return { records: [], total: 0, _rndtHtmlResponse: true };
    }

    return JSON.parse(text);
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new RNDTError("Timeout: il server RNDT non ha risposto in tempo.", "TIMEOUT");
    }
    if (err instanceof RNDTError) throw err;
    throw new RNDTError(err.message, "NETWORK_ERROR");
  }
}

/**
 * Classe errore custom per le chiamate RNDT.
 */
export class RNDTError extends Error {
  code: string;
  status: number | null;
  constructor(message: string, code: string = "UNKNOWN", status: number | null = null) {
    super(message);
    this.name = "RNDTError";
    this.code = code;
    this.status = status;
  }
}

// ══════════════════════════════════════════════════════════════════════
// 4. QUERY PREDEFINITE per dominio IMU/catasto
// ══════════════════════════════════════════════════════════════════════

/**
 * Cerca dataset catastali per nome comune.
 * Usa la categoria "planningCadastre" (catasto e pianificazione urbana).
 *
 * @param {string} comuneNome - Es. "Roma", "Milano"
 * @param {Object} [opts]
 * @param {number} [opts.max=8]
 * @returns {Promise<RNDTResult>}
 */
export async function cercaDatasetCatastaliComune(comuneNome, { max = 8 } = {}) {
  const url = buildSearchURL({
    searchText: `catasto ${comuneNome}`,
    dataCategory: CATEGORIE_IMU.PIANIFICAZIONE,
    max,
    orderBy: RNDT_ORDER.RILEVANZA,
  });
  const raw = await rndtFetch(url);
  return normalizzaRisultati(raw, { query: `catasto ${comuneNome}`, url });
}

/**
 * Cerca dataset WMS/WFS di mappe catastali per nome comune.
 *
 * @param {string} comuneNome
 * @param {Object} [opts]
 * @returns {Promise<RNDTResult>}
 */
export async function cercaServiziWMSComune(comuneNome, { max = 6 } = {}) {
  const url = buildSearchURL({
    searchText: `catasto ${comuneNome}`,
    filter: `sys.schema.key:rndt?services`,
    dataCategory: CATEGORIE_IMU.PIANIFICAZIONE,
    max,
    orderBy: RNDT_ORDER.RILEVANZA,
  });
  const raw = await rndtFetch(url);
  return normalizzaRisultati(raw, { query: `WMS catasto ${comuneNome}`, url, tipoFiltro: "services" });
}

/**
 * Cerca dataset sull'uso del suolo / destinazione d'uso fabbricati.
 *
 * @param {string} comuneNome
 * @param {Object} [opts]
 * @returns {Promise<RNDTResult>}
 */
export async function cercaUsoSuoloComune(comuneNome, { max = 6 } = {}) {
  const url = buildSearchURL({
    searchText: `"uso del suolo" ${comuneNome}`,
    max,
    orderBy: RNDT_ORDER.RILEVANZA,
  });
  const raw = await rndtFetch(url);
  return normalizzaRisultati(raw, { query: `uso suolo ${comuneNome}`, url });
}

/**
 * Cerca dataset Piano Regolatore (PRG) per comune.
 *
 * @param {string} comuneNome
 * @returns {Promise<RNDTResult>}
 */
export async function cercaPRGComune(comuneNome, { max = 6 } = {}) {
  const url = buildSearchURL({
    searchText: `"piano regolatore" ${comuneNome}`,
    dataCategory: CATEGORIE_IMU.PIANIFICAZIONE,
    max,
    orderBy: RNDT_ORDER.RILEVANZA,
  });
  const raw = await rndtFetch(url);
  return normalizzaRisultati(raw, { query: `PRG ${comuneNome}`, url });
}

/**
 * Esegue tutte le query rilevanti per un comune in parallelo.
 * Utile per popolare il pannello completo RNDT.
 *
 * @param {string} comuneNome
 * @returns {Promise<{catasto, servizi, suolo, prg}>}
 */
export async function cercaTuttiDatasetComune(comuneNome) {
  const [catasto, servizi, suolo, prg] = await Promise.allSettled([
    cercaDatasetCatastaliComune(comuneNome),
    cercaServiziWMSComune(comuneNome),
    cercaUsoSuoloComune(comuneNome),
    cercaPRGComune(comuneNome),
  ]);

  return {
    catasto: catasto.status === "fulfilled" ? catasto.value : { datasets: [], total: 0, error: catasto.reason?.message },
    servizi: servizi.status === "fulfilled" ? servizi.value : { datasets: [], total: 0, error: servizi.reason?.message },
    suolo:   suolo.status   === "fulfilled" ? suolo.value   : { datasets: [], total: 0, error: suolo.reason?.message },
    prg:     prg.status     === "fulfilled" ? prg.value     : { datasets: [], total: 0, error: prg.reason?.message },
  };
}

/**
 * Ricerca libera nel catalogo RNDT.
 *
 * @param {string} testo
 * @param {Object} [opts]
 * @param {number} [opts.max=10]
 * @param {string} [opts.categoria]
 * @param {string} [opts.orderBy]
 * @returns {Promise<RNDTResult>}
 */
export async function ricercaLibera(testo: string, { max = 10, categoria, orderBy = RNDT_ORDER.RILEVANZA }: RicercaParams = {}) {
  const url = buildSearchURL({
    searchText: testo,
    dataCategory: categoria,
    max,
    orderBy,
  });
  const raw = await rndtFetch(url);
  return normalizzaRisultati(raw, { query: testo, url });
}

// ══════════════════════════════════════════════════════════════════════
// 5. PARSER & NORMALIZZATORI
// ══════════════════════════════════════════════════════════════════════

/**
 * Normalizza la risposta grezza dell'API RNDT in un formato coerente.
 *
 * @param {Object} raw   - JSON grezzo da rndtFetch
 * @param {Object} meta  - Metadata della query (query string, url, ecc.)
 * @returns {RNDTResult}
 *
 * @typedef {Object} RNDTResult
 * @property {RNDTDataset[]} datasets  - Array di dataset normalizzati
 * @property {number}        total     - Totale risultati trovati (può essere > datasets.length)
 * @property {string}        query     - Query eseguita
 * @property {string}        url       - URL chiamata
 * @property {boolean}       vuoto     - true se nessun risultato
 */
export function normalizzaRisultati(raw: any, options: NormalizzaMeta = {}) {
  const { query = "", url = "", tipoFiltro } = options;
  if (!raw || raw._rndtHtmlResponse) {
    return { datasets: [], total: 0, query, url, vuoto: true };
  }

  // Il formato pjson RNDT restituisce { records: [...], total: N }
  const items = raw.records || raw.items || [];
  const total = raw.total ?? items.length;

  const datasets = items.map(item => normalizzaDataset(item)).filter(Boolean);

  return { datasets, total, query, url, vuoto: datasets.length === 0 };
}

/**
 * Normalizza un singolo record RNDT.
 *
 * @param {Object} item - Record grezzo
 * @returns {RNDTDataset|null}
 *
 * @typedef {Object} RNDTDataset
 * @property {string}   id            - fileIdentifier
 * @property {string}   titolo        - Titolo del dataset
 * @property {string}   abstract      - Descrizione
 * @property {string}   organizzazione- Ente responsabile
 * @property {string}   dataAggiornamento - Data ultimo aggiornamento
 * @property {string}   tipo          - Tipo (dataset, services, series, raster)
 * @property {string[]} keywords      - Parole chiave
 * @property {string[]} categorie     - Categorie tematiche
 * @property {Object}   bbox          - Bounding box geografico
 * @property {string}   linkPortale   - Link al portale RNDT
 * @property {string}   linkRaw       - Link XML metadato grezzo
 * @property {boolean}  hasWMS        - Contiene servizio WMS
 * @property {boolean}  hasWFS        - Contiene servizio WFS
 * @property {string}   iconaTipo     - Icona suggerita per il tipo
 */
export function normalizzaDataset(item) {
  if (!item) return null;

  const id        = item.id || item.fileIdentifier || item.uuid || "";
  const titolo    = item.title || item.name || item.dc_title || "Dataset senza titolo";
  const abstract  = item.description || item.abstract || item.dc_description || "";
  const org       = item.publisher   || item.organization || item.dc_publisher || "";
  const dataUpd   = item.updatedDate || item.modified     || item.dc_date      || "";
  const tipo      = item.schema      || item.type         || "dataset";
  const keywords  = Array.isArray(item.keywords) ? item.keywords : (item.keywords ? [item.keywords] : []);
  const categorie = Array.isArray(item.topicCategory) ? item.topicCategory : [];

  // Bounding box
  let bbox = null;
  if (item.bbox) {
    bbox = item.bbox;
  } else if (item.geometry?.bbox) {
    const [w, s, e, n] = item.geometry.bbox;
    bbox = { west: w, south: s, east: e, north: n };
  }

  // Link
  const linkPortale = id ? `${RNDT_PORTAL}?id=${encodeURIComponent(id)}` : "";
  const linkRaw     = id ? buildDocumentURL(id) : "";

  // Detect WMS/WFS dai link o dal tipo
  const tuttoTesto = `${titolo} ${abstract} ${tipo} ${keywords.join(" ")}`.toLowerCase();
  const hasWMS = tuttoTesto.includes("wms") || tuttoTesto.includes("web map service");
  const hasWFS = tuttoTesto.includes("wfs") || tuttoTesto.includes("web feature service");

  // Icona
  const iconaTipo = tipo.includes("service") ? "service"
    : tipo.includes("raster")  ? "raster"
    : tipo.includes("series")  ? "series"
    : "dataset";

  return {
    id, titolo, abstract, organizzazione: org,
    dataAggiornamento: formattaData(dataUpd),
    tipo, keywords, categorie, bbox,
    linkPortale, linkRaw,
    hasWMS, hasWFS, iconaTipo,
    _raw: item, // conserva il raw per debug
  };
}

/**
 * Formatta una stringa data ISO in formato leggibile italiano.
 */
function formattaData(str) {
  if (!str) return "";
  try {
    return new Date(str).toLocaleDateString("it-IT", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return str;
  }
}

// ══════════════════════════════════════════════════════════════════════
// 6. REACT HOOKS
// ══════════════════════════════════════════════════════════════════════

/**
 * Hook generico per chiamate RNDT con stato loading/error/data.
 *
 * @param {Function} queryFn   - Funzione async che ritorna RNDTResult
 * @param {Array}    deps      - Dependency array per rieseguire la query
 * @param {Object}   [opts]
 * @param {boolean}  [opts.autoRun=true] - Esegui subito al mount
 * @returns {{ data, loading, error, refetch }}
 */
export function useRNDT(queryFn, deps = [], { autoRun = true } = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) setError(err.message || "Errore sconosciuto");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (autoRun) run();
  }, [run, autoRun]);

  return { data, loading, error, refetch: run };
}

/**
 * Hook per cercare tutti i dataset catastali di un comune.
 * Esegue ricerche parallele (catasto, WMS, uso suolo, PRG).
 *
 * @param {string} comuneNome  - Nome del comune (es. "Roma")
 * @param {Object} [opts]
 * @param {boolean} [opts.enabled=true] - Abilita la query
 * @returns {{ risultati, loading, error, refetch }}
 */
export function useRNDTComune(comuneNome, { enabled = true } = {}) {
  const [risultati, setRisultati] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const run = useCallback(async () => {
    if (!comuneNome || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await cercaTuttiDatasetComune(comuneNome);
      if (mountedRef.current) setRisultati(res);
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [comuneNome, enabled]);

  useEffect(() => { run(); }, [run]);

  return { risultati, loading, error, refetch: run };
}

/**
 * Hook per ricerca libera nel catalogo RNDT.
 *
 * @param {string} testo     - Testo di ricerca
 * @param {Object} [opts]
 * @param {number} [opts.max=10]
 * @param {string} [opts.categoria]
 * @returns {{ data, loading, error, cerca }}
 */
export function useRNDTSearch(testo: string = "", { max = 10, categoria }: RicercaParams = {}) {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const cerca = useCallback(async (query?: string) => {
    const q = query ?? testo;
    if (!q?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ricercaLibera(q, { max, categoria });
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [testo, max, categoria]);

  return { data, loading, error, cerca };
}

// ══════════════════════════════════════════════════════════════════════
// 7. COMPONENTE REACT <RNDTPanel />
// ══════════════════════════════════════════════════════════════════════

/**
 * Componente pronto all'uso che mostra i dataset RNDT per un comune.
 * Da usare nel calcolatore IMU dopo la selezione del comune.
 *
 * @param {Object} props
 * @param {string} props.comuneNome    - Nome del comune selezionato
 * @param {string} [props.comuneCodice] - Codice catastale
 * @param {string} [props.comuneSigla]  - Sigla provincia
 * @param {Object} [props.bbox]         - Bounding box {lat, lon} per GeoViewer
 */
export function RNDTPanel({ comuneNome, comuneCodice, comuneSigla, bbox }) {
  const [aperto, setAperto] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { risultati, loading, error, refetch } = useRNDTComune(comuneNome, {
    enabled: aperto && !!comuneNome,
  });
  const { data: searchData, loading: searchLoading, cerca } = useRNDTSearch("", { max: 8 });

  const totalDataset = risultati
    ? (risultati.catasto?.datasets?.length || 0)
      + (risultati.servizi?.datasets?.length || 0)
      + (risultati.suolo?.datasets?.length || 0)
      + (risultati.prg?.datasets?.length || 0)
    : 0;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) cerca(`${searchQuery} ${comuneNome}`);
  };

  if (!comuneNome) return null;

  return (
    <div style={ST.panel}>
      {/* Header pannello */}
      <button style={ST.panelHdr} onClick={() => setAperto(o => !o)}>
        <div style={ST.panelHdrLeft}>
          <div style={ST.panelIcon}><Globe size={15} color="#1d4ed8"/></div>
          <div>
            <div style={ST.panelTitle}>Dataset territoriali RNDT</div>
            <div style={ST.panelSub}>
              {comuneNome}{comuneSigla ? ` (${comuneSigla})` : ""}
              {comuneCodice ? ` · ${comuneCodice}` : ""}
              {totalDataset > 0 && !loading && (
                <span style={ST.badge}>{totalDataset} dataset</span>
              )}
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {loading && <RefreshCw size={14} color="#94a3b8" style={{animation:"spin 1s linear infinite"}}/>}
          {aperto ? <ChevronUp size={16} color="#64748b"/> : <ChevronDown size={16} color="#64748b"/>}
        </div>
      </button>

      {aperto && (
        <div style={ST.panelBody}>
          {/* Info */}
          <div style={ST.infoBar}>
            <Info size={12} color="#1d4ed8"/>
            <span>
              Dati dal <strong>Repertorio Nazionale dei Dati Territoriali</strong> (AgID).
              Dataset catastali, WMS, uso del suolo e PRG pubblicati dalle PA per questo comune.
            </span>
          </div>

          {/* Azioni rapide */}
          <div style={ST.quickLinks}>
            <QuickLink
              href={buildPortalSearchURL(`catasto ${comuneNome}`)}
              icon={<Search size={13}/>}
              label="Cerca nel portale RNDT"
            />
            <QuickLink
              href={buildGeoViewerURL(bbox || {})}
              icon={<Map size={13}/>}
              label="Apri GeoViewer"
            />
          </div>

          {/* Ricerca libera */}
          <form onSubmit={handleSearch} style={ST.searchForm}>
            <input
              style={ST.searchInp}
              placeholder={`Cerca nel catalogo RNDT per ${comuneNome}…`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="submit" style={ST.searchBtn} disabled={searchLoading}>
              {searchLoading ? <RefreshCw size={13}/> : <Search size={13}/>}
              Cerca
            </button>
          </form>

          {/* Risultati ricerca libera */}
          {searchData && !searchData.vuoto && (
            <Sezione
              titolo={`Risultati ricerca: "${searchQuery}"`}
              datasets={searchData.datasets}
              total={searchData.total}
              icona={<Search size={13} color="#7c3aed"/>}
              colore="#7c3aed"
            />
          )}
          {searchData?.vuoto && (
            <div style={ST.vuoto}>Nessun risultato per "{searchQuery}" nel catalogo RNDT.</div>
          )}

          {/* Stato loading/errore */}
          {loading && (
            <div style={ST.loadingBox}>
              <RefreshCw size={16} color="#94a3b8" style={{animation:"spin 1s linear infinite"}}/>
              <span style={{color:"#94a3b8",fontSize:"0.83rem"}}>Interrogazione catalogo RNDT in corso…</span>
            </div>
          )}

          {error && (
            <div style={ST.errorBox}>
              <AlertCircle size={14} color="#dc2626"/>
              <div>
                <strong>Errore connessione RNDT:</strong> {error}
                <br/><span style={{fontSize:"0.75rem",color:"#94a3b8"}}>Il server RNDT potrebbe non essere raggiungibile dalla sandbox. Prova direttamente sul <a href={RNDT_PORTAL} target="_blank" rel="noreferrer" style={{color:"#1d4ed8"}}>portale RNDT</a>.</span>
              </div>
              <button style={ST.retryBtn} onClick={refetch}><RefreshCw size={12}/> Riprova</button>
            </div>
          )}

          {/* Risultati per sezione */}
          {risultati && !loading && (
            <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
              <Sezione
                titolo="Dataset catastali"
                datasets={risultati.catasto?.datasets}
                total={risultati.catasto?.total}
                icona={<Database size={13} color="#1d4ed8"/>}
                colore="#1d4ed8"
                errore={risultati.catasto?.error}
              />
              <Sezione
                titolo="Servizi WMS / WFS"
                datasets={risultati.servizi?.datasets}
                total={risultati.servizi?.total}
                icona={<Layers size={13} color="#0891b2"/>}
                colore="#0891b2"
                errore={risultati.servizi?.error}
              />
              <Sezione
                titolo="Uso del suolo"
                datasets={risultati.suolo?.datasets}
                total={risultati.suolo?.total}
                icona={<Map size={13} color="#16a34a"/>}
                colore="#16a34a"
                errore={risultati.suolo?.error}
              />
              <Sezione
                titolo="Piano Regolatore (PRG)"
                datasets={risultati.prg?.datasets}
                total={risultati.prg?.total}
                icona={<FileText size={13} color="#d97706"/>}
                colore="#d97706"
                errore={risultati.prg?.error}
              />

              {totalDataset === 0 && !error && (
                <div style={ST.vuoto}>
                  Nessun dataset trovato per <strong>{comuneNome}</strong> nel catalogo RNDT.<br/>
                  <a href={buildPortalSearchURL(comuneNome)} target="_blank" rel="noreferrer" style={{color:"#1d4ed8",fontSize:"0.8rem"}}>
                    Cerca manualmente nel portale →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={ST.footer}>
            <span>Fonte: <a href={RNDT_PORTAL} target="_blank" rel="noreferrer" style={{color:"#1d4ed8"}}>geodati.gov.it/RNDT</a> — AgID</span>
            <span>API REST · Lucene Search · OpenAPI</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sotto-componenti del pannello ─────────────────────────────────

interface SezioneProps {
  titolo: string;
  datasets?: any[];
  total?: number;
  icona: React.ReactNode;
  colore: string;
  errore?: string;
}

function Sezione({ titolo, datasets = [], total = 0, icona, colore, errore }: SezioneProps) {
  const [espansa, setEspansa] = useState(true);

  if (errore) {
    return (
      <div style={{...ST.sezione, borderLeftColor: "#fca5a5"}}>
        <div style={ST.sezHdr}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>{icona}<span style={{...ST.sezTitolo,color:"#dc2626"}}>{titolo}</span></div>
          <span style={{fontSize:"0.72rem",color:"#dc2626"}}>Errore</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{...ST.sezione, borderLeftColor: colore}}>
      <button style={ST.sezHdr} onClick={() => setEspansa(e => !e)}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          {icona}
          <span style={{...ST.sezTitolo, color: colore}}>{titolo}</span>
          {total > 0 && <span style={{...ST.badge, background:`${colore}18`, color: colore}}>{total} trovati</span>}
        </div>
        {datasets.length > 0 && (espansa ? <ChevronUp size={13} color="#94a3b8"/> : <ChevronDown size={13} color="#94a3b8"/>)}
      </button>

      {espansa && datasets.length > 0 && (
        <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
          {datasets.map(d => <div key={d.id}><DatasetCard dataset={d} /></div>)}
        </div>
      )}

      {datasets.length === 0 && (
        <div style={{fontSize:"0.75rem",color:"#94a3b8",padding:"4px 0"}}>
          Nessun dataset trovato in questa categoria.
        </div>
      )}
    </div>
  );
}

const DatasetCard = ({ dataset: d }: { dataset: any }) => {
  const [xml, setXml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchXml = async () => {
    if (xml) {
      setXml(null);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(d.linkRaw);
      const text = await response.text();
      setXml(text);
    } catch (e) {
      console.error("Error fetching XML", e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={ST.card}>
      <div style={ST.cardTitle}>
        <TipoIcon tipo={d.iconaTipo}/>
        <span>{d.titolo}</span>
        {d.hasWMS && <span style={{...ST.mini,background:"#dbeafe",color:"#1d4ed8"}}>WMS</span>}
        {d.hasWFS && <span style={{...ST.mini,background:"#dcfce7",color:"#16a34a"}}>WFS</span>}
      </div>
      {d.abstract && (
        <div style={ST.cardAbstract}>
          {d.abstract.length > 180 ? d.abstract.slice(0, 180) + "…" : d.abstract}
        </div>
      )}
      <div style={ST.cardMeta}>
        {d.organizzazione && <span>{d.organizzazione}</span>}
        {d.dataAggiornamento && <span>Agg. {d.dataAggiornamento}</span>}
      </div>
      <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
        {d.linkPortale && (
          <a href={d.linkPortale} target="_blank" rel="noreferrer" style={ST.linkBtn}>
            <ExternalLink size={11}/> Portale RNDT
          </a>
        )}
        {d.linkRaw && (
          <>
            <a href={d.linkRaw} target="_blank" rel="noreferrer" style={{...ST.linkBtn,background:"#f8fafc",color:"#64748b",borderColor:"#e2e8f0"}}>
              <FileText size={11}/> Metadato XML
            </a>
            <button onClick={fetchXml} style={{...ST.linkBtn,background:"#f8fafc",color:"#64748b",borderColor:"#e2e8f0", cursor: 'pointer'}}>
              <FileText size={11}/> {loading ? 'Caricando...' : xml ? 'Nascondi XML' : 'Leggi XML'}
            </button>
          </>
        )}
      </div>
      {xml && (
        <pre style={{marginTop: 8, padding: 8, background: '#f1f5f9', fontSize: '0.7rem', overflowX: 'auto', maxHeight: '200px'}}>
          {xml.slice(0, 1000)}...
        </pre>
      )}
    </div>
  );
}

function TipoIcon({ tipo }) {
  const cfg = {
    service: { icon: <Globe size={12}/>,    color: "#0891b2", bg: "#e0f2fe" },
    raster:  { icon: <Layers size={12}/>,   color: "#7c3aed", bg: "#ede9fe" },
    series:  { icon: <Database size={12}/>, color: "#d97706", bg: "#fef3c7" },
    dataset: { icon: <FileText size={12}/>, color: "#1d4ed8", bg: "#dbeafe" },
  };
  const c = cfg[tipo] || cfg.dataset;
  return (
    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:20,height:20,background:c.bg,borderRadius:4,color:c.color,flexShrink:0}}>
      {c.icon}
    </span>
  );
}

function QuickLink({ href, icon, label }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={ST.quickLink}>
      {icon} {label} <ExternalLink size={11}/>
    </a>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 8. UTILITÀ
// ══════════════════════════════════════════════════════════════════════

/**
 * Genera l'URL di ricerca RNDT pre-compilato per un comune e keyword.
 * Utile per link diretti dal calcolatore IMU.
 *
 * @param {string} comuneNome
 * @param {string} [keyword="catasto"]
 * @returns {string}
 */
export function linkRicercaComune(comuneNome, keyword = "catasto") {
  return buildPortalSearchURL(`${keyword} ${comuneNome}`);
}

/**
 * Genera l'URL del GeoViewer RNDT centrato su coordinate italiane standard.
 * Se non si hanno le coordinate, usa il centro Italia.
 *
 * @param {Object} [opts]
 * @param {number} [opts.lat=41.9]
 * @param {number} [opts.lon=12.5]
 * @param {number} [opts.zoom=8]
 */
export function linkGeoViewerItalia({ lat = 41.9, lon = 12.5, zoom = 8 } = {}) {
  return buildGeoViewerURL({ lat, lon, zoom });
}

/**
 * Formatta un risultato RNDT in una stringa leggibile per log/debug.
 *
 * @param {RNDTResult} risultato
 * @returns {string}
 */
export function descrizioneTotale(risultato) {
  if (!risultato) return "Nessun risultato";
  const { datasets, total, query } = risultato;
  return `Query: "${query}" → ${total} trovati, ${datasets.length} caricati`;
}

/**
 * Controlla se un dataset contiene effettivamente dati catastali
 * basandosi su keywords e categoria.
 *
 * @param {RNDTDataset} dataset
 * @returns {boolean}
 */
export function isCatastale(dataset) {
  if (!dataset) return false;
  const testo = `${dataset.titolo} ${dataset.abstract} ${dataset.keywords.join(" ")}`.toLowerCase();
  return KEYWORDS_CATASTO.some(kw => testo.includes(kw));
}

// ══════════════════════════════════════════════════════════════════════
// STILI COMPONENTE
// ══════════════════════════════════════════════════════════════════════

const ST = {
  panel:    { background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" },
  panelHdr: { display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"14px 18px", background:"none", border:"none", cursor:"pointer", textAlign:"left" },
  panelHdrLeft: { display:"flex", alignItems:"center", gap:12 },
  panelIcon:{ width:36, height:36, background:"#eff6ff", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #bfdbfe", flexShrink:0 },
  panelTitle:{ fontWeight:700, color:"#1e293b", fontSize:"0.875rem" },
  panelSub: { fontSize:"0.75rem", color:"#64748b", marginTop:1 },
  badge:    { display:"inline-block", padding:"1px 7px", background:"#eff6ff", color:"#1d4ed8", borderRadius:10, fontSize:"0.68rem", fontWeight:700, marginLeft:6 },
  panelBody:{ padding:"0 18px 18px", borderTop:"1px solid #f1f5f9" },

  infoBar:  { display:"flex", alignItems:"flex-start", gap:7, background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:"9px 12px", marginTop:14, fontSize:"0.78rem", color:"#334155", lineHeight:1.5 },
  quickLinks:{ display:"flex", gap:8, flexWrap:"wrap", marginTop:12 },
  quickLink:{ display:"inline-flex", alignItems:"center", gap:5, padding:"6px 12px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:7, color:"#334155", fontSize:"0.78rem", fontWeight:500, textDecoration:"none" },

  searchForm:{ display:"flex", gap:8, marginTop:12 },
  searchInp:{ flex:1, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"8px 12px", color:"#1e293b", fontSize:"0.83rem", outline:"none" },
  searchBtn:{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"#1d4ed8", border:"none", borderRadius:8, color:"#fff", fontWeight:600, fontSize:"0.8rem", cursor:"pointer" },

  loadingBox:{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"24px 0" },
  errorBox: { display:"flex", alignItems:"flex-start", gap:10, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"12px 14px", fontSize:"0.8rem", color:"#7f1d1d", marginTop:12, lineHeight:1.5 },
  retryBtn: { display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:"#fff", border:"1px solid #fecaca", borderRadius:6, color:"#dc2626", fontSize:"0.75rem", cursor:"pointer", whiteSpace:"nowrap", marginLeft:"auto", flexShrink:0 },

  sezione:  { borderLeft:"3px solid #e2e8f0", paddingLeft:12, paddingTop:4, paddingBottom:4 },
  sezHdr:   { display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", background:"none", border:"none", cursor:"pointer", padding:"2px 0", textAlign:"left" },
  sezTitolo:{ fontWeight:700, fontSize:"0.8rem" },
  vuoto:    { fontSize:"0.8rem", color:"#94a3b8", padding:"12px 0", lineHeight:1.6 },

  card:     { background:"#f8fafc", border:"1px solid #f1f5f9", borderRadius:8, padding:"10px 12px" },
  cardTitle:{ display:"flex", alignItems:"center", gap:7, fontWeight:600, color:"#1e293b", fontSize:"0.83rem", flexWrap:"wrap" },
  cardAbstract:{ fontSize:"0.75rem", color:"#64748b", marginTop:4, lineHeight:1.5 },
  cardMeta: { display:"flex", gap:12, fontSize:"0.72rem", color:"#94a3b8", marginTop:5, flexWrap:"wrap" },
  linkBtn:  { display:"inline-flex", alignItems:"center", gap:4, padding:"4px 9px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, color:"#1d4ed8", fontSize:"0.72rem", fontWeight:500, textDecoration:"none" },
  mini:     { padding:"1px 6px", borderRadius:4, fontSize:"0.65rem", fontWeight:700 },

  footer:   { display:"flex", justifyContent:"space-between", fontSize:"0.68rem", color:"#94a3b8", marginTop:16, paddingTop:10, borderTop:"1px solid #f1f5f9", flexWrap:"wrap", gap:4 },
};

// ── Keyframe spin per CSS-in-JS ────────────────────────────────────
if (typeof document !== "undefined") {
  const styleEl = document.getElementById("rndt-spin") || document.createElement("style");
  styleEl.id = "rndt-spin";
  styleEl.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
  if (!document.getElementById("rndt-spin")) document.head.appendChild(styleEl);
}