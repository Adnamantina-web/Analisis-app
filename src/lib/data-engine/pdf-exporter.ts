import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  FinalReport, 
  ProjectContract, 
  DecisionLog, 
  EDASummary, 
  EDAChart,
  InferentialSummary, 
  MLSummary, 
  CleaningSummary 
} from '../../types/pipeline';

export interface PDFExportOptions {
  edaSummary?: EDASummary | null;
  inferentialSummary?: InferentialSummary | null;
  mlSummary?: MLSummary | null;
  cleaningSummary?: CleaningSummary | null;
  contract?: ProjectContract | null;
  elementIdToCapture?: string;
}

export class PDFReportExporter {
  /**
   * Generates a high-fidelity PDF report combining DOM elements (charts and layout) 
   * and structured vector/text styling using jsPDF and html2canvas.
   */
  static async exportHighFidelityPDF(
    report: FinalReport,
    decisionLogOrContract: ProjectContract | DecisionLog | any,
    options?: PDFExportOptions
  ): Promise<void> {
    const contract = options?.contract || 
      ('contract' in decisionLogOrContract && decisionLogOrContract.contract ? decisionLogOrContract.contract : decisionLogOrContract) || 
      report.contract;
    
    const seed = contract?.randomSeed ?? decisionLogOrContract?.randomSeed ?? 42;
    const targetVar = contract?.targetVariable ? contract.targetVariable.replace(/[^a-zA-Z0-9_]/g, '_') : 'dataset';
    const filename = `informe_ejecutivo_pareto_${targetVar}_seed${seed}.pdf`;

    // Try DOM capture first if element exists on page for exact high-fidelity visual replication
    const targetElement = options?.elementIdToCapture 
      ? document.getElementById(options.elementIdToCapture) 
      : document.getElementById('report-document-container') || document.querySelector('.report-printable-area');

    if (targetElement) {
      await this.exportFromDOMElement(targetElement as HTMLElement, filename, {
        reportTitle: report.title,
        seed,
        createdAt: report.createdAt
      });
    } else {
      // Direct vector-based PDF generation fallback
      await this.generateVectorPDF(report, contract, options, filename);
    }
  }

  /**
   * High-fidelity multi-page capture from DOM using html2canvas and jsPDF with pagination,
   * high resolution (scale 2), margins, headers and footers.
   */
  static async exportFromDOMElement(
    element: HTMLElement, 
    filename: string,
    meta: { reportTitle: string; seed: number; createdAt: string }
  ): Promise<void> {
    // Render element at 2x resolution for retina-crisp typography
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const margin = 10; // 10mm margins
    const contentWidth = pageWidth - margin * 2;
    const headerHeight = 12;
    const footerHeight = 12;
    const availableHeightPerPage = pageHeight - margin * 2 - headerHeight - footerHeight;

    // Calculate total height in mm
    const imgHeight = (canvas.height * contentWidth) / canvas.width;
    let heightLeft = imgHeight;
    let positionY = 0;
    let pageNum = 1;

    // First page
    pdf.addImage(
      imgData,
      'JPEG',
      margin,
      margin + headerHeight,
      contentWidth,
      imgHeight,
      undefined,
      'FAST'
    );

    this.addHeaderAndFooter(pdf, pageNum, meta);
    heightLeft -= availableHeightPerPage;

    // Subsequent pages
    while (heightLeft > 0) {
      pdf.addPage();
      pageNum++;
      positionY = -((pageNum - 1) * availableHeightPerPage) + margin + headerHeight;

      pdf.addImage(
        imgData,
        'JPEG',
        margin,
        positionY,
        contentWidth,
        imgHeight,
        undefined,
        'FAST'
      );

      this.addHeaderAndFooter(pdf, pageNum, meta);
      heightLeft -= availableHeightPerPage;
    }

    // Set total page numbers in footer
    const totalPages = pageNum;
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        `Página ${p} de ${totalPages}`,
        pageWidth - margin - 20,
        pageHeight - 5,
        { align: 'right' }
      );
    }

    pdf.save(filename);
  }

  /**
   * Vector-based multi-page PDF generation fallback
   */
  static async generateVectorPDF(
    report: FinalReport,
    contract: ProjectContract | any,
    options: PDFExportOptions | undefined,
    filename: string
  ): Promise<void> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const seed = contract?.randomSeed ?? 42;
    const meta = { reportTitle: report.title, seed, createdAt: report.createdAt };
    let pageNum = 1;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin - 15) {
        this.addHeaderAndFooter(pdf, pageNum, meta);
        pdf.addPage();
        pageNum++;
        y = margin + 15;
      }
    };

    // --- COVER HEADER ---
    pdf.setFillColor(26, 26, 26);
    pdf.rect(margin, y, contentWidth, 8, 'F');
    pdf.setFillColor(230, 57, 70); // #E63946 accent
    pdf.rect(margin, y, 4, 8, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text('PARETO ANALYTICS  //  DOCUMENTO EJECUTIVO OFICIAL', margin + 8, y + 5.5);

    y += 14;

    // Title
    pdf.setFont('times', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(26, 26, 26);
    const splitTitle = pdf.splitTextToSize(report.title, contentWidth);
    pdf.text(splitTitle, margin, y);
    y += splitTitle.length * 8 + 4;

    // Meta badges bar
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Fecha: ${report.createdAt}  |  Alcance: ${(report.scopeLevel || 'Predictivo').toUpperCase()}  |  Semilla RNG: ${seed}`, margin, y);
    y += 8;

    // Divider
    pdf.setDrawColor(26, 26, 26);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, margin + contentWidth, y);
    y += 10;

    // --- SECTIONS ---
    for (const sec of report.sections) {
      checkPageBreak(30);

      // Section Number + Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(230, 57, 70);
      pdf.text(`APARTADO ${String(sec.number).padStart(2, '0')}`, margin, y);
      y += 5;

      pdf.setFont('times', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(26, 26, 26);
      pdf.text(sec.title, margin, y);
      y += 7;

      // Section Body Content
      pdf.setFont('times', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(40, 40, 40);
      const splitContent = pdf.splitTextToSize(sec.content, contentWidth);
      
      for (const line of splitContent) {
        checkPageBreak(5);
        pdf.text(line, margin, y);
        y += 4.8;
      }
      y += 4;

      // Highlights Box
      if (sec.highlights && sec.highlights.length > 0) {
        checkPageBreak(25);
        pdf.setFillColor(250, 248, 245);
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(margin, y, contentWidth, sec.highlights.length * 6 + 8, 'FD');
        pdf.setFillColor(26, 26, 26);
        pdf.rect(margin, y, 2.5, sec.highlights.length * 6 + 8, 'F');

        let boxY = y + 5;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 100, 100);
        pdf.text('PUNTOS CLAVE & ACCIONABLES:', margin + 6, boxY);
        boxY += 4.5;

        pdf.setFont('times', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(30, 30, 30);
        for (const h of sec.highlights) {
          const splitH = pdf.splitTextToSize(`•  ${h}`, contentWidth - 10);
          pdf.text(splitH, margin + 6, boxY);
          boxY += splitH.length * 4.5;
        }
        y = boxY + 4;
      }

      // Evidence Badges
      if (sec.groundedEvidences && sec.groundedEvidences.length > 0) {
        checkPageBreak(20);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`EVIDENCIAS CUANTITATIVAS (${sec.groundedEvidences.length})`, margin, y);
        y += 4.5;

        for (const ev of sec.groundedEvidences.slice(0, 4)) {
          checkPageBreak(12);
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(200, 200, 200);
          pdf.roundedRect(margin, y, contentWidth, 10, 1, 1, 'FD');

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(26, 26, 26);
          pdf.text(`${ev.sourceLayer || 'Capa Analítica'} [${ev.type}]`, margin + 3, y + 4);

          pdf.setFont('times', 'italic');
          pdf.setFontSize(8);
          pdf.setTextColor(80, 80, 80);
          pdf.text(ev.metricOrTest || ev.description || '', margin + 3, y + 8);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8.5);
          pdf.setTextColor(230, 57, 70);
          pdf.text(String(ev.value), margin + contentWidth - 3, y + 6, { align: 'right' });

          y += 12;
        }
      }

      y += 6;
      pdf.setDrawColor(240, 240, 240);
      pdf.line(margin, y, margin + contentWidth, y);
      y += 8;
    }

    // --- CERTIFICATION BOX ---
    checkPageBreak(35);
    pdf.setFillColor(26, 26, 26);
    pdf.rect(margin, y, contentWidth, 28, 'F');
    pdf.setFillColor(230, 57, 70);
    pdf.rect(margin, y, contentWidth, 1.5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('CERTIFICACIÓN DE INTEGRIDAD ANALÍTICA', margin + 6, y + 7);

    pdf.setFont('times', 'italic');
    pdf.setFontSize(8.5);
    pdf.setTextColor(220, 220, 220);
    const certText = 'Este informe fue computado de forma determinista mediante el motor analítico Pareto 20/80. Todos los contrastes de hipótesis, parámetros y métricas son reproducibles byte-a-byte utilizando la semilla RNG fijada.';
    const splitCert = pdf.splitTextToSize(certText, contentWidth - 12);
    pdf.text(splitCert, margin + 6, y + 13);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Firmado: Lead Data Scientist  |  Semilla RNG: ${seed}`, margin + 6, y + 24);

    this.addHeaderAndFooter(pdf, pageNum, meta);

    // Set page counts
    const totalPages = pageNum;
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        `Página ${p} de ${totalPages}`,
        pageWidth - margin - 20,
        pageHeight - 5,
        { align: 'right' }
      );
    }

    pdf.save(filename);
  }

  private static addHeaderAndFooter(
    pdf: jsPDF, 
    pageNum: number, 
    meta: { reportTitle: string; seed: number; createdAt: string }
  ): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    // Running Header
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(130, 130, 130);
    pdf.text('PARETO ANALYTICS  •  INFORME ESTRATÉGICO EJECUTIVO', margin, 7);
    pdf.text(meta.createdAt, pageWidth - margin, 7, { align: 'right' });

    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.2);
    pdf.line(margin, 9, pageWidth - margin, 9);

    // Running Footer
    pdf.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);
    pdf.text(`Semilla RNG = ${meta.seed}  |  Documento Auditado & Certificado`, margin, pageHeight - 5);
  }
}
