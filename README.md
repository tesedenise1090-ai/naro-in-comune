# NaroInComune

**Piattaforma Civic Tech & Utility per la Pubblica Amministrazione e la Protezione Civile.**

## 🚀 Panoramica del Progetto

NaroInComune è un'applicazione web progettata per facilitare la comunicazione e i servizi tra i cittadini e le istituzioni locali.

### Stack Tecnologico
- **Frontend**: React, Tailwind CSS, Motion
- **Mappe**: Leaflet, React-Leaflet
- **Backend**: Express.js
- **Database**: SQLite (via better-sqlite3)
- **AI Integration**: Google Gemini API

## 🛠 Installazione e Avvio

1.  **Installare le dipendenze**:
    ```bash
    npm install
    ```

2.  **Avviare il server di sviluppo**:
    ```bash
    npm run dev
    ```
    L'applicazione sarà disponibile su `http://localhost:3000`.

## ♿ Accessibilità (Skill Integrata)

Abbiamo integrato la skill **Accessibility Compliance Audit** per garantire che la piattaforma sia inclusiva e conforme alle normative vigenti per la PA.

- **Documentazione**: Vedi `docs/accessibility/README.md`
- **Playbook**: Vedi `docs/accessibility/playbook.md` per le procedure di audit.
- **Audit Rapido**: Esegui `npx pa11y http://localhost:3000` per un controllo veloce.

## 📚 Skill Disponibili

Il progetto include un catalogo di skill AI pronte all'uso nella cartella `skills/`.
Vedi `SKILLS_LIST.md` per l'elenco completo.

---
*Progetto sviluppato con il supporto di Antigravity Skills.*
