import type { StudentResult, Subject, Exam, GradeScale } from "@/types/result";

export async function generateResultSheetPDF(
  element: HTMLElement,
  examName: string,
  className: string
): Promise<void> {
  const html2canvasMod = await import("html2canvas");
  const h2c = html2canvasMod.default || html2canvasMod;
  const jsPdfMod = await import("jspdf");
  const JsPDF = jsPdfMod.default || jsPdfMod.jsPDF;

  const canvas = await h2c(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new JsPDF("l", "mm", "a4");
  const pdfWidth = 297;
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${examName}-${className}-result-sheet.pdf`);
}

export async function generateReportCardPDF(
  element: HTMLElement,
  studentName: string,
  examName: string
): Promise<void> {
  const html2canvasMod = await import("html2canvas");
  const h2c = html2canvasMod.default || html2canvasMod;
  const jsPdfMod = await import("jspdf");
  const JsPDF = jsPdfMod.default || jsPdfMod.jsPDF;

  const canvas = await h2c(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new JsPDF("p", "mm", "a4");
  const pdfWidth = 210;
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  if (pdfHeight > 297) {
    const pageHeight = 297;
    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }
  } else {
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  }

  pdf.save(`${examName}-${studentName}-report-card.pdf`);
}

export function printElement(elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const w = window.open("", "_blank");
  if (!w) return;

  const styles = Array.from(document.styleSheets)
    .map((ss) => {
      try {
        return Array.from(ss.cssRules || []).map((r) => r.cssText).join("");
      } catch {
        return "";
      }
    })
    .join("");

  w.document.write(`
    <html><head><title>Print</title>
    <style>${styles} @page { margin: 10mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }</style>
    </head><body>${el.innerHTML}</body></html>
  `);
  w.document.close();
  w.focus();
  w.print();
}
