"use client";

import { useState } from "react";
import { usePaper } from "@/context/PaperContext";
import { useToast } from "@/context/ToastContext";

export default function ExportBar() {
  const { state } = usePaper();
  const { addToast } = useToast();
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);

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

      const html2canvas = (await import("html2canvas")).default;
      const { default: jsPDF } = await import("jspdf");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      pdf.save(`${state.schoolName || "paper"}-${state.paperTitle || "examination"}.pdf`);

      addToast("PDF downloaded successfully", "success");
    } catch (err) {
      console.error("PDF export error:", err);
      addToast(`PDF failed: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadDOCX = async () => {
    if (state.questions.length === 0) {
      addToast("Add at least one question before exporting", "warning");
      return;
    }

    setExporting("docx");
    try {
      const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import("docx");

      const children: import("docx").Paragraph[] = [];

      if (state.schoolName) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: state.schoolName, bold: true, size: 28 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          })
        );
      }

      if (state.paperTitle) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: state.paperTitle, bold: true, size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );
      }

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Time: ${state.time || "___"}        Total Marks: ${state.totalMarks || "___"}`,
              size: 20,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 200 },
        })
      );

      const sep = "________________________________________";
      children.push(new Paragraph({ children: [new TextRun(sep)], spacing: { after: 200 } }));

      children.push(
        new Paragraph({
          children: [
            new TextRun(
              `${state.studentNameLabel || "Student Name"}: ___________________    ${state.fatherNameLabel || "Father Name"}: ___________________            Obtained Marks: ${state.obtainedMarks || "___"}`
            ),
          ],
          spacing: { after: 100 },
        })
      );

      if (state.className || state.subject) {
        const parts: string[] = [];
        if (state.className) parts.push(`Class: ${state.className}`);
        if (state.subject) parts.push(`Subject: ${state.subject}`);
        children.push(new Paragraph({ children: [new TextRun(parts.join("    "))], spacing: { after: 200 } }));
      }

      state.questions.forEach((q, i) => {
        children.push(
          new Paragraph({
            children: [new TextRun(`Q${i + 1}. ${q.text}`)],
            spacing: { after: 200 },
          })
        );
      });

      if (state.date) {
        children.push(new Paragraph({ children: [new TextRun(`Date: ${state.date}`)], spacing: { after: 200 } }));
      }

      children.push(new Paragraph({ children: [new TextRun(sep)], spacing: { before: 400, after: 200 } }));

      if (state.teacherSignature) {
        children.push(
          new Paragraph({
            children: [new TextRun(`Teacher's Signature: ${state.teacherSignature}`)],
            spacing: { after: 100 },
          })
        );
      }

      if (state.principalSignature) {
        children.push(
          new Paragraph({
            children: [new TextRun(`Principal's Signature: ${state.principalSignature}`)],
            spacing: { after: 100 },
          })
        );
      }

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
              },
            },
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${state.schoolName || "paper"}-${state.paperTitle || "examination"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast("DOCX downloaded successfully", "success");
    } catch (err) {
      console.error("DOCX export error:", err);
      addToast(`DOCX failed: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
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
        onClick={handleDownloadDOCX}
        disabled={exporting === "docx" || state.questions.length === 0}
        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all text-sm font-medium shadow-sm flex-1"
      >
        {exporting === "docx" ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        <span>{exporting === "docx" ? "Generating..." : "DOCX"}</span>
      </button>
    </div>
  );
}
