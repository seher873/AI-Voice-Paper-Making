import * as XLSX from "xlsx";
import type { StudentMark, Subject } from "@/types/result";

export function parseExcelFile(
  buffer: ArrayBuffer,
  subjects: Subject[]
): { students: StudentMark[]; errors: string[] } {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet);

  const students: StudentMark[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rollNo = String(row["Roll No"] || row["RollNo"] || "").trim();
    const studentName = String(row["Student Name"] || row["StudentName"] || row["Name"] || "").trim();

    if (!rollNo || !studentName) {
      errors.push(`Row ${i + 2}: Missing Roll No or Student Name`);
      continue;
    }

    const subjectMarks: Record<string, number> = {};
    let hasError = false;

    for (const sub of subjects) {
      const val = row[sub.name];
      if (val === undefined || val === null || val === "") {
        errors.push(`Row ${i + 2} (${studentName}): Missing marks for ${sub.name}`);
        hasError = true;
        continue;
      }
      const num = Number(val);
      if (isNaN(num) || num < 0) {
        errors.push(`Row ${i + 2} (${studentName}): Invalid marks for ${sub.name}: "${val}"`);
        hasError = true;
        continue;
      }
      if (num > sub.totalMarks) {
        errors.push(`Row ${i + 2} (${studentName}): Marks exceed total (${sub.totalMarks}) for ${sub.name}: ${num}`);
        hasError = true;
        continue;
      }
      subjectMarks[sub.name] = num;
    }

    if (!hasError) {
      students.push({ rollNo, studentName, subjectMarks });
    }
  }

  return { students, errors };
}

export function generateExcelBuffer(
  headers: string[],
  data: (string | number)[][],
  sheetName = "Sheet1"
): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 2, 12) }));
  ws["!cols"] = colWidths;

  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

export function downloadExcel(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
