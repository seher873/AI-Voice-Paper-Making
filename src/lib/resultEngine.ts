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
    const passed = subjects.length > 0 && subjects.every((sub) => (s.subjectMarks[sub.name] ?? 0) >= sub.passingMarks);

    return {
      rollNo: s.rollNo,
      studentName: s.studentName,
      fatherName: s.fatherName,
      photo: s.photo,
      subjectMarks: s.subjectMarks,
      totalObtained,
      totalMarks,
      percentage,
      grade: passed ? gradeInfo.grade : "F",
      remark: passed ? gradeInfo.remark : "Failed in one or more subjects",
      passed,
      position: s.position && s.position > 0 ? s.position : 0,
    };
  });

  const manualPositions = new Map(
    students.filter((s) => s.positionOverridden).map((s) => [s.rollNo, s.position && s.position > 0 ? s.position : 0])
  );

  results.sort((a, b) => Number(b.passed) - Number(a.passed) || b.percentage - a.percentage);

  const used = new Set<number>();
  for (const r of results) {
    const manual = manualPositions.get(r.rollNo) || 0;
    if (manual > 0) used.add(manual);
  }

  let nextPos = 1;
  let i = 0;
  while (i < results.length) {
    const r = results[i];
    if (!r.passed) {
      r.position = manualPositions.get(r.rollNo) || 0;
      i++;
      continue;
    }
    let j = i;
    const group: StudentResult[] = [];
    while (j < results.length && results[j].passed && results[j].percentage === r.percentage) {
      group.push(results[j]);
      j++;
    }
    while (used.has(nextPos)) nextPos++;
    const groupPos = nextPos;
    for (const g of group) {
      const manual = manualPositions.get(g.rollNo) || 0;
      if (manual > 0) {
        g.position = manual;
      } else {
        g.position = groupPos;
        used.add(groupPos);
      }
    }
    nextPos = groupPos + group.length;
    i = j;
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

  const topPerformers = results.filter((r) => r.passed).sort((a, b) => b.percentage - a.percentage).slice(0, 10);
  const weakStudents = results.filter((r) => !r.passed).sort((a, b) => a.percentage - b.percentage).slice(0, 10);

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
    topPerformers,
    weakStudents,
    gradeDistribution,
    subjectStats,
  };
}
