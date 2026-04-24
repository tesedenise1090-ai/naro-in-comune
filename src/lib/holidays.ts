
export const mainHolidays = [
  '01-01', // Capodanno
  '06-01', // Epifania
  '25-04', // Liberazione
  '01-05', // Lavoro
  '02-06', // Repubblica
  '15-08', // Ferragosto
  '01-11', // Ognissanti
  '08-12', // Immacolata
  '25-12', // Natale
  '26-12', // Santo Stefano
];

export const isTomorrowHoliday = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formatted = `${String(tomorrow.getDate()).padStart(2, '0')}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}`;
  return mainHolidays.includes(formatted);
};
