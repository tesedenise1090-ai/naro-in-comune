/**
 * Utilità per il calcolo del Codice Fiscale Italiano
 * Implementato secondo gli standard ministeriali.
 */

const MESI = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'T'];

const DISPARI: { [key: string]: number } = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
  'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
  'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
};

const PARI: { [key: string]: number } = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
  'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
  'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
};

const RESTO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function calcolaConsonanti(str: string): string {
  return str.replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/gi, '').toUpperCase();
}

function calcolaVocali(str: string): string {
  return str.replace(/[^AEIOU]/gi, '').toUpperCase();
}

/**
 * Calcola il codice fiscale (Nota: il codice catastale è semplificato o deve essere passato)
 */
export function calcolaCodiceFiscale(data: {
  nome: string;
  cognome: string;
  dataNascita: string; // ISO format YYYY-MM-DD
  sesso: 'M' | 'F';
  codiceCatastale: string; // Es. F845 per Naro
}): string {
  let cf = '';

  // 1. Cognome (3 lettere)
  let cognomeCons = calcolaConsonanti(data.cognome);
  let cognomeVoc = calcolaVocali(data.cognome);
  let cognomeCF = (cognomeCons + cognomeVoc + 'XXX').slice(0, 3);
  cf += cognomeCF.toUpperCase();

  // 2. Nome (3 lettere)
  let nomeCons = calcolaConsonanti(data.nome);
  let nomeVoc = calcolaVocali(data.nome);
  let nomeCF = '';
  if (nomeCons.length >= 4) {
    nomeCF = nomeCons[0] + nomeCons[2] + nomeCons[3];
  } else {
    nomeCF = (nomeCons + nomeVoc + 'XXX').slice(0, 3);
  }
  cf += nomeCF.toUpperCase();

  // 3. Data di nascita e Sesso
  const date = new Date(data.dataNascita);
  const anno = date.getFullYear().toString().slice(-2);
  const mese = MESI[date.getMonth()];
  let giorno = date.getDate();
  if (data.sesso === 'F') giorno += 40;
  const giornoStr = giorno.toString().padStart(2, '0');
  cf += anno + mese + giornoStr;

  // 4. Codice Catastale
  cf += data.codiceCatastale.toUpperCase();

  // 5. Carattere di Controllo
  let somma = 0;
  for (let i = 0; i < cf.length; i++) {
    const char = cf[i];
    if ((i + 1) % 2 === 0) {
      somma += PARI[char];
    } else {
      somma += DISPARI[char];
    }
  }
  cf += RESTO[somma % 26];

  return cf;
}

// Codici catastali comuni nel territorio per il tool
export const CODICI_CATASTALI: { [key: string]: string } = {
  'Naro': 'F845',
  'Agrigento': 'A089',
  'Canicattì': 'B602',
  'Campobello di Licata': 'B520',
  'Camastra': 'B448',
  'Palma di Montechiaro': 'G282',
  'Ravanusa': 'H194'
};
