import type { Subject, StudentMark, StudentResult, ClassStats, SubjectStat, GradeScale } from "@/types/result";
import { assignGrade } from "./gradeEngine";

export function calculateResults(
  students: StudentMark[],
  subjects: Subject[],
  gradeScale: GradeScale[]
): StudentResult[] {
  const results: StudentResult[] = students.map((s) => {
    let totalObtained = 0;
    let totalMarks = 0;

    for (const sub of subjects) {
      const obtained = s.subjectMarks[sub.name] ?? 0;
      totalObtained += obtained;
      totalMarks += sub.totalMarks;
    }

    const percentage = totalMarks > 0 ? Math.round((totalObtained / totalMarks) * 100) : 0;
    const gradeInfo = assignGrade(percentage, gradeScale);

    return {
      rollNo: s.rollNo,
      studentName: s.studentName,
      subjectMarks: s.subjectMarks,
      totalObtained,
      totalMarks,
      percentage,
      grade: gradeInfo.grade,
      remark: gradeInfo.remark,
      passed: gradeInfo.grade !== "F",
      position: 1,
    };
  });

  results.sort((a, b) => b.percentage - a.percentage);

  let currentPos = 1;
  for (let i = 0; i < results.length; i++) {
    if (i > 0 && results[i].percentage < results[i - 1].percentage) {
      currentPos = i + 1;
    }
    results[i].position = currentPos;
  }

  return results;
}

export function calculateClassStats(
  results: StudentResult[],
  subjects: Subject[]
): ClassStats {
  const totalStudents = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = totalStudents - passed;
  const totalPct = results.reduce((sum, r) => sum + r.percentage, 0);
  const average = totalStudents > 0 ? Math.round(totalPct / totalStudents) : 0;

  const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
  const highest = sorted.length > 0 ? sorted[0].percentage : 0;
  const lowest = sorted.length > 0 ? sorted[sorted.length - 1].percentage : 0;

  const gradeDistribution: Record<string, number> = {};
  for (const r of results) {
    gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
  }

  const subjectStats: SubjectStat[] = subjects.map((sub) => {
    const marks = results.map((r) => r.subjectMarks[sub.name] ?? 0);
    const subAverage = marks.length > 0 ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : 0;
    const subPassed = marks.filter((m) => m >= sub.passingMarks).length;
    return {
      subject: sub.name,
      average: subAverage,
      highest: marks.length > 0 ? Math.max(...marks) : 0,
      lowest: marks.length > 0 ? Math.min(...marks) : 0,
      passed: subPassed,
      failed: marks.length - subPassed,
    };
  });

  return {
    totalStudents,
    passed,
    failed,
    passPercentage: totalStudents > 0 ? Math.round((passed / totalStudents) * 100) : 0,
    failPercentage: totalStudents > 0 ? Math.round((failed / totalStudents) * 100) : 0,
    average,
    highest,
    lowest,
    topPerformers: sorted.slice(0, 10),
    weakStudents: sorted.slice(-10).reverse(),
    gradeDistribution,
    subjectStats,
  };
}
