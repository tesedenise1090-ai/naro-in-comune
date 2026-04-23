export const WASTE_SCHEDULE = {
  1: { day: 'Lunedì', materials: ['Organico'] },
  2: { day: 'Martedì', materials: ['Secco Residuo (Indifferenziata)'] },
  3: { day: 'Mercoledì', materials: ['Organico', 'Vetro'] },
  4: { day: 'Giovedì', materials: ['Plastica', 'Metalli'] },
  5: { day: 'Venerdì', materials: ['Carta', 'Cartone'] },
  6: { day: 'Sabato', materials: ['Organico'] },
  0: { day: 'Domenica', materials: ['NESSUN RITIRO'] },
};

export const getColorForMaterial = (material: string): string => {
  switch (material) {
    case 'Organico': return 'bg-emerald-600';
    case 'Secco Residuo (Indifferenziata)': return 'bg-slate-600';
    case 'Vetro': return 'bg-teal-600';
    case 'Plastica': return 'bg-yellow-500';
    case 'Metalli': return 'bg-zinc-500';
    case 'Carta': return 'bg-blue-600';
    case 'Cartone': return 'bg-blue-700';
    case 'NESSUN RITIRO': return 'bg-red-600';
    default: return 'bg-slate-400';
  }
};
