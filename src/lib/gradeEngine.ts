import type { GradeScale, StudentResult } from "@/types/result";

const FALLBACK_GRADE: GradeScale = { grade: "F", min: 0, max: 0, remark: "Unknown" };

export function assignGrade(percentage: number, gradeScale: GradeScale[]): GradeScale {
  if (!gradeScale || gradeScale.length === 0) return FALLBACK_GRADE;
  for (const g of gradeScale) {
    if (percentage >= g.min && percentage <= g.max) return g;
  }
  return gradeScale[gradeScale.length - 1];
}

export function getGradeLabel(percentage: number, gradeScale: GradeScale[]): string {
  return assignGrade(percentage, gradeScale).grade;
}

export function getGradeRemark(percentage: number, gradeScale: GradeScale[]): string {
  return assignGrade(percentage, gradeScale).remark;
}

export function isPassed(percentage: number, gradeScale: GradeScale[]): boolean {
  return assignGrade(percentage, gradeScale).grade !== "F";
}
