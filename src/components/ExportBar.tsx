"use client";

import { useState } from "react";
import { usePaper } from "@/context/PaperContext";
import { useToast } from "@/context/ToastContext";

export default function ExportBar() {
  const { state } = usePaper();
  const { addToast } = useToast();
  const [exporting, setExporting] = useState<"pdf" | null>(null);

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

    </div>
  );
}
