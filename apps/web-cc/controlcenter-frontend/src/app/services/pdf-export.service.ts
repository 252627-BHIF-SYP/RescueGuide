import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmergencyProtocol } from './emergency.service';

export interface PdfExportMetadata {
  emergencyId?: number | string | null;
  startedAt?: string | Date | null;
  endedAt?: string | Date | null;
  status?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  /**
   * Generiert und lädt das offizielle PDF-Einsatzprotokoll herunter.
   * Dateiname: Protokoll_<NotfallID>_<Datum>.pdf
   */
  async exportProtocol(protocol: EmergencyProtocol, meta?: PdfExportMetadata): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const emergencyId = meta?.emergencyId || protocol.emergencyId || protocol.id || 'Einsatz';
    const rawDate = protocol.date || new Date().toISOString().split('T')[0];
    const safeDate = rawDate.replace(/[^0-9-]/g, '_');
    const fileName = `Protokoll_${emergencyId}_${safeDate}.pdf`;

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Farben
    const primaryColor: [number, number, number] = [163, 29, 88]; // #a31d58
    const darkSlate: [number, number, number] = [30, 41, 59]; // #1e293b
    const mutedColor: [number, number, number] = [100, 116, 139]; // #64748b

    // Dekorativer Farbbalken ganz oben
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Logo laden oder Fallback-Kopfbereich zeichnen
    let logoLoaded = false;
    try {
      const logoImg = await this.loadImage('/assets/logo.png');
      doc.addImage(logoImg, 'PNG', margin, 10, 26, 26);
      logoLoaded = true;
    } catch {
      // Fallback: Logo-Badge mit Text
      doc.setFillColor(252, 231, 240);
      doc.roundedRect(margin, 10, 24, 24, 3, 3, 'F');
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('RG', margin + 6, 24);
      logoLoaded = false;
    }

    // Kopfzeilen-Titel & Systemname
    const titleX = margin + 30;
    doc.setTextColor(...darkSlate);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('RescueGuide Leitstelle', titleX, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...mutedColor);
    doc.text('Integriertes Notfall- & Dispositions-Einsatzprotokoll', titleX, 23);

    // Rechtsbündige Dokument-Kennung
    const rightX = pageWidth - margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text(`Einsatz #${emergencyId}`, rightX, 17, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedColor);
    const printedAt = new Date().toLocaleString('de-AT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    doc.text(`Exportiert: ${printedAt} Uhr`, rightX, 23, { align: 'right' });
    doc.text(`Status: ${meta?.status || 'Dokumentiert'}`, rightX, 28, { align: 'right' });

    // Trennlinie
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, 38, pageWidth - margin, 38);

    // ── STAMMDATEN ÜBERSICHT (Key-Value Grid via autoTable) ──
    const formatTimestamp = (ts?: string | Date | null): string => {
      if (!ts) return '–';
      try {
        const d = new Date(ts);
        if (isNaN(d.getTime())) return String(ts);
        return d.toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' }) + ' Uhr';
      } catch {
        return String(ts);
      }
    };

    let startY = 43;

    // Sektion 1: Einsatz- & Ortsdaten (inkl. Datum, Uhrzeit, Art, Adresse, Verletzte)
    autoTable(doc, {
      startY: startY,
      theme: 'grid',
      head: [['1. EINSATZ-KERNINFORMATIONEN & ORT', 'ANGABEN']],
      body: [
        ['Einsatzart / Meldebild', protocol.type?.trim() || 'Nicht erfasst'],
        ['Einsatzadresse / Standort', protocol.address?.trim() || 'Nicht erfasst'],
        [
          'Datum & Uhrzeit des Notrufs',
          `${protocol.date || '–'} um ${protocol.time ? protocol.time + ' Uhr' : '–'}`,
        ],
        ['Anzahl der verletzten Personen', protocol.injuredCount !== '' && protocol.injuredCount !== null && protocol.injuredCount !== undefined ? String(protocol.injuredCount) : '0'],
        ['Lagebeschreibung / Details', protocol.description?.trim() || 'Keine detaillierte Lagebeschreibung erfasst.'],
      ],
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.6,
        textColor: darkSlate,
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 62 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });

    startY = (doc as any).lastAutoTable.finalY + 6;

    // Sektion 2: Anrufer & Disposition
    autoTable(doc, {
      startY: startY,
      theme: 'grid',
      head: [['2. ANRUFER & DISPOSITION', 'ANGABEN']],
      body: [
        ['Name des Anrufers', protocol.callerName?.trim() || 'Unbekannt'],
        ['Anrufer-Typ / Rolle', protocol.callerType?.trim() || 'Ersthelfer'],
        ['Rückrufnummer', protocol.callbackNumber?.trim() || 'Keine Angabe'],
        ['Zuständiger Disponent (Leitstelle)', protocol.dispatcherName?.trim() || '–'],
      ],
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.6,
        textColor: darkSlate,
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 62 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });

    startY = (doc as any).lastAutoTable.finalY + 6;

    // Sektion 3: Einsatzmittel-Alarmierung
    const alarmUnits: string[] = [];
    if (protocol.alarmedRD) alarmUnits.push('Rettungsdienst (RD)');
    if (protocol.alarmedNA) alarmUnits.push('Notarzt (NA)');
    if (protocol.alarmedPol) alarmUnits.push('Polizei (Pol)');
    if (protocol.alarmedFW) alarmUnits.push('Feuerwehr (FW)');

    const alarmSummary =
      alarmUnits.length > 0 ? alarmUnits.join('  •  ') : 'Keine externen Einsatzmittel alarmiert';

    autoTable(doc, {
      startY: startY,
      theme: 'grid',
      head: [['3. ALARMIERTE EINSATZMITTEL', 'STATUS']],
      body: [
        ['Rettungsdienst (RD)', protocol.alarmedRD ? '[X] ALARMIERT' : '[ ] Nicht angefordert'],
        ['Notarzt (NA)', protocol.alarmedNA ? '[X] ALARMIERT' : '[ ] Nicht angefordert'],
        ['Polizei (Pol)', protocol.alarmedPol ? '[X] ALARMIERT' : '[ ] Nicht angefordert'],
        ['Feuerwehr (FW)', protocol.alarmedFW ? '[X] ALARMIERT' : '[ ] Nicht angefordert'],
        ['Zusammenfassung', alarmSummary],
      ],
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.6,
        textColor: darkSlate,
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 62 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });

    startY = (doc as any).lastAutoTable.finalY + 6;

    // Sektion 4: Zeitstempel relevanter Ereignisse
    const timelineBody = [
      ['Notrufeingang / Einsatzstart', formatTimestamp(meta?.startedAt), 'Eröffnung des Notfalls im System'],
      [
        'Protokollerfassung / Dokumentation',
        `${protocol.date || '–'} ${protocol.time || '–'}`,
        'Primäre Erfassung der Einsatzdetails',
      ],
      ['Einsatzbeendigung', formatTimestamp(meta?.endedAt), 'Videoanruf beendet / Einsatz archiviert'],
      ['PDF-Protokollexport', `${printedAt} Uhr`, 'Offizielles Protokolldokument erzeugt'],
    ];

    autoTable(doc, {
      startY: startY,
      theme: 'grid',
      head: [['EREIGNIS', 'ZEITSTEMPEL', 'HINWEIS / DETAILS']],
      body: timelineBody,
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.6,
        textColor: darkSlate,
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55 },
        1: { cellWidth: 45 },
        2: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });

    // Fußzeile für alle Seiten
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(margin, 285, pageWidth - margin, 285);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...mutedColor);
      doc.text(
        'RescueGuide Notrufsystem • Vertrauliches Leitstellen-Einsatzprotokoll • Elektronisch erstellt',
        margin,
        290,
      );
      doc.text(`Seite ${i} von ${pageCount}`, rightX, 290, { align: 'right' });
    }

    doc.save(fileName);
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }
}
