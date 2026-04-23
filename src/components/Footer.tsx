import React from 'react';
import { Link } from 'react-router-dom';
import { municipalInfo } from '../data/municipalInfo';

interface FooterProps {
  customLinks?: { label: string; href: string }[];
}

export const Footer: React.FC<FooterProps> = ({ customLinks }) => {
  const defaultLinks = [
    { label: 'Utility', href: '/utility' },
    { label: 'Territorio', href: '/territorio' },
    { label: 'Tracking BGS', href: '/tracking-istanza' },
    { label: 'Istanze Civiche', href: '/petizioni' },
  ];
  const links = customLinks || defaultLinks;

  return (
    <footer className="bg-slate-900 text-slate-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <span className="font-bold text-lg text-white tracking-tight">NaroInComune<span className="text-[#C5A059]"> | </span></span>
            <p className="text-sm mt-1">Piattaforma Civic Tech & Utility per il cittadino.</p>
            <div className="mt-4 text-xs text-slate-500">
              <p>Comune di {municipalInfo.name} ({municipalInfo.province})</p>
              <p>{municipalInfo.contacts.address}</p>
              <p>Email: {municipalInfo.contacts.email}</p>
              <p>PEC: {municipalInfo.contacts.pec}</p>
            </div>
          </div>
          <nav className="flex flex-wrap justify-center md:justify-start gap-6 mb-4 md:mb-0">
            {links.map(link => (
              <Link key={link.label} to={link.href} className="text-sm text-slate-300 hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="text-sm text-center md:text-right max-w-md">
            <p className="font-semibold text-slate-300">Disclaimer Sicurezza & Privacy (GDPR)</p>
            <p className="mt-1">Iniziativa civica indipendente. Alcuni servizi richiedono autenticazione SPID esterna. I dati inseriti per la firma legale (Zero-Storage) non vengono salvati nei nostri database, ma utilizzati solo per la generazione istantanea del PDF.</p>
            <p className="mt-2 text-[#C5A059] font-serif italic">"Partecipare è un dovere, digitale è un diritto"</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
