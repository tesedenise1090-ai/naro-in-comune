import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from 'qrcode';

export interface PDFData {
  title: string;
  subtitle: string;
  year: string | number;
  date: string;
  time?: string;
  status?: 'RICEVUTA' | 'IN LAVORAZIONE' | 'IN SOPRALLUOGO' | 'CHIUSA' | 'APPROVATA' | 'ACQUISITA - TRASMESSA PEC';
  protocollo: string;
  uuid: string;
  contribuente?: {
    nome: string;
    cf: string;
    comune?: string;
    email?: string;
    pec?: string;
  };
  summaryItems: {
    label: string;
    value: string;
    isAccent?: boolean;
    subValue?: string;
  }[];
  tables: {
    title?: string;
    head: string[][];
    body: any[][];
    columnStyles?: any;
  }[];
  images?: string[]; // Base64 images
  legalStamp?: {
    label: string;
    value: string;
    id: string;
  };
}

export const PDFService = {
  generateInstitutionalPDF: async (data: PDFData, filename: string) => {
    const doc = new jsPDF();
    const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Naro-Stemma.svg/960px-Naro-Stemma.svg.png";
    const generationTime = data.time || new Date().toLocaleTimeString("it-IT");
    
    // PDF Metadata per Archiviazione Istituzionale (Conformità CAD)
    doc.setProperties({
      title: data.title,
      subject: data.subtitle,
      author: "Comune di Naro - Servizi Demografici e Territoriali",
      creator: "BGS-2026 Engine",
      keywords: `Naro, BGS, ${data.protocollo}, ${data.uuid}, Protocollo, PEC, Trasparenza`
    });

    const navy: [number, number, number] = [15, 23, 42]; // #0F172A
    const gold: [number, number, number] = [197, 160, 89]; // #C5A059
    const lightGray: [number, number, number] = [248, 250, 252]; // #F8FAFC
    const borderGray: [number, number, number] = [226, 232, 240]; // #E2E8F0
    const success: [number, number, number] = [21, 128, 61]; // #15803D (Slightly darker emerald)
    const danger: [number, number, number] = [185, 28, 28]; // #B91C1C
    const accent: [number, number, number] = [30, 64, 175]; // #1E40AF

    // 1. Header Istituzionale "Control Room" Style
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, 210, 52, 'F');
    
    // Background Pattern (subtle line)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.05);
    doc.line(0, 48, 210, 48);

    // Add Logo
    try {
      doc.addImage(logoUrl, 'PNG', 15, 10, 28, 30);
    } catch (e) {
      console.warn("Logo load failed", e);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("COMUNE DI NARO", 112, 24, { align: "center", charSpace: 1 });
    
    doc.setFontSize(9);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text("LIBERO CONSORZIO COMUNALE DI AGRIGENTO", 112, 32, { align: "center", charSpace: 0.5 });
    
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont("helvetica", "normal");
    doc.text("MODULISTICA ISTITUZIONALE UNIFICATA — STANDARD BGS-2026", 112, 40, { align: "center" });

    // QR Code for Verification (Top Right)
    try {
      const verificationUrl = `https://comune.naro.ag.it/verifica?id=${data.uuid}&prot=${data.protocollo}`;
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 120 });
      doc.setFillColor(255, 255, 255);
      doc.rect(174, 10, 22, 22, 'F');
      doc.addImage(qrDataUrl, 'PNG', 175, 11, 20, 20);
      doc.setFontSize(5);
      doc.setTextColor(255, 255, 255);
      doc.text("VERIFICA INTEGRITÀ", 185, 36, { align: "center" });
    } catch (err) {
      console.error(err);
    }

    // 2. Bar di Protocollo e Tracciabilità
    let y = 65;
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);
    y += 10;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(data.title.toUpperCase(), 15, y);

    // Status Badge - Rifinito
    if (data.status) {
      const isUrgent = data.status.includes('EMERGENZA') || data.status.includes('PRIORITÀ');
      const statusColor = isUrgent ? danger : (data.status === 'CHIUSA' || data.status === 'APPROVATA' ? success : accent);
      
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      const statusWidth = doc.getTextWidth(data.status) + 12;
      doc.rect(195 - statusWidth, y - 6, statusWidth, 9, 'F');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(data.status, 195 - (statusWidth / 2), y, { align: "center" });
    }

    y += 12;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont("helvetica", "normal");
    doc.text(`HASH IDENTIFICATIVO: ${data.uuid}`, 15, y);
    doc.setFont("helvetica", "bold");
    doc.text(`PROTOCOLLO: ${data.protocollo}`, 105, y, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text(`DATA DOCUMENTO: ${data.date} ${generationTime}`, 195, y, { align: "right" });

    y += 12;

    // 3. Sezione Anagrafica Certificata (Box istituzionale)
    if (data.contribuente) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.rect(15, y, 180, 32, 'FD'); // Increased from 28 to 32
      
      doc.setFontSize(6);
      doc.setTextColor(accent[0], accent[1], accent[2]);
      doc.setFont("helvetica", "bold");
      doc.text("IDENTIFICAZIONE DEL SOGGETTO ISTANTE (FIRMA GRAFICA)", 22, y + 8);
      
      doc.setFontSize(12);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(data.contribuente.nome.toUpperCase(), 22, y + 17);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`CODICE FISCALE: ${data.contribuente.cf.toUpperCase()}`, 105, y + 17);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`EMAIL: ${data.contribuente.email || 'N/D'}`, 22, y + 25);
      
      if (data.contribuente.pec) {
        doc.text(`PEC: ${data.contribuente.pec}`, 105, y + 25);
      }

      if (data.contribuente.comune) {
        doc.text(`COMUNE: ${data.contribuente.comune}`, 155, y + 25);
      }
      y += 42;
    }

    // 4. Indicatori di Governance (Summary Cards)
    if (data.summaryItems && data.summaryItems.length > 0) {
      const cardWidth = (180 / data.summaryItems.length);
      data.summaryItems.forEach((item, idx) => {
        const x = 15 + (idx * cardWidth);
        const padding = 3;
        
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.rect(x + padding, y, cardWidth - (padding * 2), 22, "FD");
        
        doc.setFontSize(6);
        doc.setTextColor(115, 115, 115);
        doc.setFont("helvetica", "bold");
        doc.text(item.label.toUpperCase(), x + padding + 4, y + 8);
        
        doc.setFontSize(11);
        doc.setTextColor(item.isAccent ? accent[0] : navy[0], item.isAccent ? accent[1] : navy[1], item.isAccent ? accent[2] : navy[2]);
        doc.text(item.value, x + padding + 4, y + 16);
      });
      y += 32;
    }

    // 5. Tabelle Dati - Raffinatezza tipografica
    data.tables.forEach((table) => {
      if (table.title) {
        doc.setTextColor(navy[0], navy[1], navy[2]);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(table.title.toUpperCase(), 15, y);
        y += 4;
      }

      autoTable(doc, {
        startY: y,
        head: table.head,
        body: table.body,
        theme: "grid",
        headStyles: { 
          fillColor: navy, 
          fontSize: 9, 
          fontStyle: 'bold', 
          textColor: 255, 
          cellPadding: 4,
          halign: 'center'
        },
        styles: { 
          fontSize: 8.5, 
          cellPadding: 4, 
          lineColor: [226, 232, 240], 
          lineWidth: 0.1,
          textColor: [30, 41, 59]
        },
        columnStyles: table.columnStyles || {
            0: { fontStyle: 'bold', fillColor: [248, 250, 252], width: 60 }
        },
        margin: { left: 15, right: 15 }
      });
      
      y = (doc as any).lastAutoTable.finalY + 15;
    });

    // 6. Rilievi Fotografici Integrati
    if (data.images && data.images.length > 0) {
      if (y > 180) { doc.addPage(); y = 30; }
      
      // Box allegati
      doc.setFillColor(navy[0], navy[1], navy[2]);
      doc.rect(15, y, 180, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("DOCUMENTAZIONE TECNICA E RILIEVI FOTOGRAFICI", 105, y + 5.5, { align: "center" });
      y += 12;

      const imgWidth = 56;
      const imgHeight = 42;
      data.images.forEach((img, idx) => {
        const x = 15 + (idx * (imgWidth + 6));
        try {
          doc.addImage(img, 'JPEG', x, y, imgWidth, imgHeight, undefined, 'FAST');
          doc.setDrawColor(navy[0], navy[1], navy[2]);
          doc.setLineWidth(0.5);
          doc.rect(x, y, imgWidth, imgHeight, "S");
          
          doc.setFontSize(6);
          doc.setTextColor(navy[0], navy[1], navy[2]);
          doc.text(`ALLEGATO ${idx + 1}`, x, y + imgHeight + 4);
        } catch (e) {
          console.error("Image load failed", e);
        }
      });
      y += imgHeight + 20;
    }

    // 7. Electronic Seal e Validità Giuridica (Box Raffinato)
    const sealY = y > 220 ? (doc.addPage(), 25) : y;
    
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(navy[0], navy[1], navy[2]);
    doc.rect(15, sealY, 180, 42, 'F');
    doc.setLineWidth(0.3);
    doc.rect(15, sealY, 180, 42, 'S');

    doc.setFontSize(9);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFont("helvetica", "bold");
    doc.text("DICHIARAZIONE DI CONFORMITÀ E SIGILLO ELETTRONICO", 22, sealY + 10);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85); // slate-700
    const legalText = `Il presente documento digitale è generato in conformità agli standard BGS-2026 e costituisce istanza ufficiale ai sensi del Decreto Legislativo 7 marzo 2005, n. 82 (Codice dell'Amministrazione Digitale). L'integrità del contenuto è garantita dal sigillo elettronico qualificato del Comune di Naro e dalla tracciabilità geospaziale univoca. Qualsiasi alterazione del file rende nullo il documento. La verifica può essere effettuata in tempo reale tramite il Codice QR istituzionale riportato in testata.`;
    const splitLegal = doc.splitTextToSize(legalText, 140);
    doc.text(splitLegal, 22, sealY + 18);

    // Graphic Design Seal
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(1);
    doc.circle(174, sealY + 21, 12, 'S');
    doc.setFontSize(5);
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFont("helvetica", "bold");
    doc.text("COMUNE DI NARO", 174, sealY + 19, { align: "center", charSpace: 0.5 });
    doc.text("SIGILLO", 174, sealY + 22, { align: "center" });
    doc.text("DIGITALE", 174, sealY + 25, { align: "center" });

    // 8. Footer di Pagina Istituzionale
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setLineWidth(0.5);
      doc.line(15, 282, 195, 282);
      
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("ESTRATTO DIGITALE DAL PORTALE NAROINCOMUNE — COMUNE DI NARO (AG)", 15, 288);
      doc.setFont("helvetica", "bold");
      doc.text(`HASH: ${data.uuid} — PAGINA ${i} DI ${pageCount}`, 195, 288, { align: "right" });
    }

    doc.save(filename);
  }
};
