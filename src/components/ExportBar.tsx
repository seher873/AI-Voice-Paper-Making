"use client";

import { useState } from "react";
import { usePaper } from "@/context/PaperContext";
import { useToast } from "@/context/ToastContext";
import { sharePaperPdfWhatsApp, sharePaperWhatsApp } from "@/lib/whatsapp";

export default function ExportBar() {
  const { state } = usePaper();
  const { addToast } = useToast();
  const [exporting, setExporting] = useState<"pdf" | null>(null);
  const [sendingPdf, setSendingPdf] = useState(false);

  const handlePrint = () => {
    if (state.questions.length === 0) {
      addToast("Add at least one question before printing", "warning");
      return;
    }
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (state.questions.length === 0) {
      addToast("Add at least one question before exporting", "warning");
      return;
    }

    setExporting("pdf");
    try {
      const element = document.getElementById("paper-preview");
      if (!element) {
        addToast("Preview element not found", "error");
        return;
      }

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

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${state.schoolName || "paper"}-${state.paperTitle || "examination"}.pdf`);

      addToast("PDF downloaded successfully", "success");
    } catch (err) {
      console.error("PDF export error:", err);
      addToast(`PDF failed: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
      <button
        onClick={handlePrint}
        disabled={state.questions.length === 0}
        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all text-sm font-medium shadow-sm flex-1"
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        <span>Print</span>
      </button>
      <button
        onClick={handleDownloadPDF}
        disabled={exporting === "pdf" || state.questions.length === 0}
        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all text-sm font-medium shadow-sm flex-1"
      >
        {exporting === "pdf" ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        <span>{exporting === "pdf" ? "Generating..." : "PDF"}</span>
      </button>
      <button
        onClick={async () => {
          if (state.questions.length === 0) {
            addToast("Add questions first", "warning");
            return;
          }
          setSendingPdf(true);
          try {
            const sent = await sharePaperPdfWhatsApp(state);
            if (!sent) addToast("PDF cancelled", "warning");
          } finally {
            setSendingPdf(false);
          }
        }}
        disabled={sendingPdf || state.questions.length === 0}
        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all text-sm font-medium shadow-sm flex-1"
      >
        {sendingPdf ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        )}
        <span>{sendingPdf ? "Generating..." : "WhatsApp PDF"}</span>
      </button>

    </div>
  );
}
