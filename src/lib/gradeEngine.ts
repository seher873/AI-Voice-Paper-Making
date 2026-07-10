import type { GradeScale, StudentResult } from "@/types/result";

export function assignGrade(percentage: number, gradeScale: GradeScale[]): GradeScale {
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
