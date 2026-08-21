import type { MutationAction } from "./voiceQuery";
import type { Exam, StudentMark, Subject, ResultState } from "@/types/result";

interface MutationContext {
  resultState: ResultState;
  resultDispatch: React.Dispatch<any>;
}

function findStudent(ctx: MutationContext, action: { studentName: string | null; rollNo: string | null }): StudentMark | undefined {
  const students = ctx.resultState.students;
  if (action.rollNo) {
    return students.find((s) => s.rollNo === action.rollNo);
  }
  if (action.studentName) {
    const lower = action.studentName.toLowerCase();
    return students.find((s) => s.studentName.toLowerCase().includes(lower));
  }
  return undefined;
}

export function executeMutation(action: MutationAction, ctx: MutationContext): string {
  const exam = ctx.resultState.currentExam;
  if (!exam) return "Koi exam select nahi hai. Pehle exam create ya select karein.";

  switch (action.type) {
    case "add_marks":
    case "update_marks": {
      const student = findStudent(ctx, action);
      if (!student) {
        const who = action.studentName || `roll ${action.rollNo}`;
        return `${who} ka record current exam mein nahi mila. Pehle student add karein.`;
      }
      const updated = { ...student, subjectMarks: { ...student.subjectMarks, [action.subject]: action.marks } };
      ctx.resultDispatch({ type: "UPDATE_STUDENT", payload: updated });
      ctx.resultDispatch({ type: "CALCULATE_RESULTS" });
      return `${student.studentName} ko ${action.subject} mein ${action.marks} marks set kar diye gaye.`;
    }

    case "delete_student": {
      const student = findStudent(ctx, action);
      if (!student) {
        const who = action.studentName || `roll ${action.rollNo}`;
        return `${who} current exam mein nahi mila.`;
      }
      ctx.resultDispatch({ type: "REMOVE_STUDENT", payload: student.rollNo });
      ctx.resultDispatch({ type: "CALCULATE_RESULTS" });
      return `${student.studentName} (roll ${student.rollNo}) ko current exam se hata diya gaya.`;
    }

    case "add_student": {
      const exists = ctx.resultState.students.find((s) => s.rollNo === action.rollNo);
      if (exists) return `Roll number ${action.rollNo} pehle se maujood hai.`;
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
