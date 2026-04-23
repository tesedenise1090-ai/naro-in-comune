# ♿ Accessibilità e Inclusione per NaroInComune

## Perché questa skill?
Essendo **NaroInComune** una piattaforma per la Pubblica Amministrazione e la Protezione Civile, l'accessibilità non è solo una "feature", ma un **requisito fondamentale** (spesso legale, vedi Legge Stanca in Italia e direttive UE).

Abbiamo integrato la skill `accessibility-compliance-accessibility-audit` per garantire che la piattaforma sia utilizzabile da tutti i cittadini, indipendentemente dalle loro abilità.

## Strumenti Integrati
In questa cartella troverai:

1.  **`playbook.md`**: Una guida completa (Playbook) su come condurre audit di accessibilità, test automatici e manuali.
2.  **`AUDIT_REPORT_TEMPLATE.md`**: Un modello per documentare i risultati degli audit.

## Come eseguire un audit rapido

Puoi utilizzare strumenti come `pa11y` o `axe-core` direttamente da riga di comando.

Esempio con `npx`:

```bash
# Audit della homepage (assicurati che il server sia attivo su localhost:3000)
npx pa11y http://localhost:3000
```

## Checklist Rapida (WCAG 2.1 AA)

- [ ] **Contrasto**: Il testo ha un rapporto di contrasto sufficiente (almeno 4.5:1)?
- [ ] **Tastiera**: È possibile navigare tutto il sito usando solo la tastiera (Tab, Enter, Space)?
- [ ] **Screen Reader**: Le immagini hanno `alt` text? I form hanno `label` collegate?
- [ ] **Focus**: L'elemento attivo ha un indicatore visivo chiaro?
- [ ] **Zoom**: Il sito è leggibile e funzionante con lo zoom al 200%?

---
*Skill integrata dal catalogo Antigravity.*
