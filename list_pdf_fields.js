import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function listFields(path) {
  try {
    const pdfBytes = fs.readFileSync(path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    console.log(`Fields for ${path}:`);
    fields.forEach(field => {
      const type = field.constructor.name;
      const name = field.getName();
      console.log(`${name} (${type})`);
    });
  } catch (e) {
    console.error(`Error reading ${path}:`, e.message);
  }
}

listFields('./public/Modello F24 Semplificato nuovo_F24 semplificato_mod.pdf');
listFields('./public/Modello di versamento unificato - F24 Ordinario_i Modello F24 (2).pdf');
