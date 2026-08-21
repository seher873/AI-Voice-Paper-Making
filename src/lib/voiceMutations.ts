import type { MutationAction } from "./voiceQuery";
import type { Exam, StudentMark, Subject, ResultState } from "@/types/result";

interface MutationContext {
  resultState: ResultState;
  resultDispatch: React.Dispatch<any>;
}

function findStudent(ctx: MutationContext, action: { studentName: string | null; rollNo: string | null }): StudentMark | undefined {
  const students = ctx.resultState.students;
  if (action.rollNo) {
    const byRoll = students.find((s) => s.rollNo === action.rollNo);
    if (byRoll) return byRoll;
  }
  if (action.studentName) {
    const lower = action.studentName.toLowerCase();
    const exact = students.find((s) => s.studentName.toLowerCase() === lower);
    if (exact) return exact;
    const partial = students.find((s) => s.studentName.toLowerCase().includes(lower) || lower.includes(s.studentName.toLowerCase()));
    if (partial) return partial;
    // fuzzy: check if any student name starts with same letters
    const first = lower.split(/\s+/)[0];
    if (first && first.length > 2) {
      const fuzzy = students.find((s) => s.studentName.toLowerCase().startsWith(first));
      if (fuzzy) return fuzzy;
    }
  }
  return undefined;
}

export function executeMutation(action: MutationAction, ctx: MutationContext): string {
  const exam = ctx.resultState.currentExam;
  if (!exam) return "Koi exam select nahi hai. Pehle exam create ya select karein.";

  switch (action.type) {
    case "add_marks":
    case "update_marks": {
      let student = findStudent(ctx, action);
      // Auto-create student if roll number provided but not found
      if (!student && action.rollNo) {
        const newStudent: StudentMark = {
          rollNo: action.rollNo,
          studentName: action.studentName || `Student ${action.rollNo}`,
          fatherName: "",
          subjectMarks: { [action.subject]: action.marks },
        };
        ctx.resultDispatch({ type: "ADD_STUDENT", payload: newStudent });
        ctx.resultDispatch({ type: "CALCULATE_RESULTS" });
        return `Naya student (roll ${action.rollNo}) add kar diya aur ${action.subject} mein ${action.marks} marks set kiye.`;
      }
      if (!student) {
        const students = ctx.resultState.students;
        if (students.length === 0) {
          return "Current exam mein koi student nahi hai. Pehle student add karein.";
        }
        const list = students.slice(0, 8).map((s) => `${s.studentName} (roll ${s.rollNo})`).join(", ");
        return `${action.studentName || "Student"} nahi mila. Available students: ${list}${students.length > 8 ? ` aur ${students.length - 8} aur...` : ""}. Roll number ya sahi naam bolein.`;
      }
      const updated = { ...student, subjectMarks: { ...student.subjectMarks, [action.subject]: action.marks } };
      ctx.resultDispatch({ type: "UPDATE_STUDENT", payload: updated });
      ctx.resultDispatch({ type: "CALCULATE_RESULTS" });
      return `${student.studentName} ko ${action.subject} mein ${action.marks} marks set kar diye gaye.`;
    }

    case "delete_student": {
      const student = findStudent(ctx, action);
      if (!student) {
        const who = action.studentName || `roll ${action.rollNo || "?"}`;
        return `${who} current exam mein nahi mila.`;
      }
      ctx.resultDispatch({ type: "REMOVE_STUDENT", payload: student.rollNo });
      ctx.resultDispatch({ type: "CALCULATE_RESULTS" });
      return `${student.studentName} (roll ${student.rollNo}) ko current exam se hata diya gaya.`;
    }

    case "add_student": {
      const exists = ctx.resultState.students.find((s) => s.rollNo === action.rollNo);
      if (exists) return `Roll number ${action.rollNo} pehle se maujood hai (${exists.studentName}).`;
      const newStudent: StudentMark = {
        rollNo: action.rollNo,
        studentName: action.studentName,
        fatherName: "",
        subjectMarks: {},
      };
      ctx.resultDispatch({ type: "ADD_STUDENT", payload: newStudent });
      return `${action.studentName} (roll ${action.rollNo}) ko current exam mein add kar diya gaya.`;
    }

    case "create_exam": {
      const newExam: Exam = {
        id: crypto.randomUUID(),
        name: action.examName,
        session: "",
        className: action.className,
        section: action.section,
        date: new Date().toISOString().split("T")[0],
        subjects: exam.subjects?.length ? [...exam.subjects] : [],
        assessmentConfig: exam.assessmentConfig || { written: true, oral: false, practical: false, activity: false, skills: false },
      };
      ctx.resultDispatch({ type: "CREATE_EXAM", payload: newExam });
      return `Exam "${action.examName}" create ho gaya.${action.className ? ` Class: ${action.className}.` : ""}`;
    }
  }
}
