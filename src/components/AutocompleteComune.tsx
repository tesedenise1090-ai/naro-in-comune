import React, { useState, useEffect, useRef } from 'react';

// Cache global per evitare richieste multiple e mantenere la lista in memoria
let cachedComuni: any[] | null = null;

interface AutocompleteComuneProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (comune: { nome: string; codiceCatastale: string; sigla: string; [key: string]: any }) => void;
  placeholder?: string;
  className?: string; // Per classes tailwind
  inputStyle?: React.CSSProperties; // Per stili inline
  containerStyle?: React.CSSProperties; // Per stili inline del contenitore
}

export function AutocompleteComune({ value, onChange, onSelect, placeholder = "Cerca comune...", className, inputStyle, containerStyle }: AutocompleteComuneProps) {
  const [comuniList, setComuniList] = useState<any[]>(cachedComuni || []);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cachedComuni) {
      fetch("https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json")
        .then(res => res.json())
        .then(data => {
          cachedComuni = data;
          setComuniList(data);
        })
        .catch(err => console.error("Errore caricamento comuni:", err));
    }
  }, []);

  useEffect(() => { 
    setSearch(value || ""); 
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = search.length >= 2 
    ? comuniList.filter(c => c.nome.toLowerCase().includes(search.toLowerCase())).slice(0, 50)
    : [];

  return (
    <div ref={containerRef} style={{ position: "relative", ...containerStyle }}>
      <input 
        type="text" 
        className={className}
        style={inputStyle ? { width: '100%', boxSizing: 'border-box', ...inputStyle } : { width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', outline: 'none' }}
        placeholder={placeholder}
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => search.length >= 2 && setIsOpen(true)}
      />
      {isOpen && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, maxHeight: 200, overflowY: "auto", zIndex: 100, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
          {filtered.map(c => {
            const isExact = c.nome.toLowerCase() === search.toLowerCase();
            return (
              <div 
                key={c.codiceCatastale}
                style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: "0.85rem", background: isExact ? "#dcfce7" : "#fff", color: isExact ? "#166534" : "#111827", fontWeight: isExact ? 600 : 400 }}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click
                  setSearch(c.nome);
                  onChange(c.nome);
                  if (onSelect) onSelect(c);
                  setIsOpen(false);
                }}
              >
                {c.nome} {c.sigla ? `(${c.sigla})` : ''}
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
