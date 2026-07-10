"use client";

import { useResult } from "@/context/ResultContext";
import CreateExam from "./CreateExam";
import ManageSubjects from "./ManageSubjects";
import EnterMarks from "./EnterMarks";
import BulkExcelUpload from "./BulkExcelUpload";
import GenerateResultSheet from "./GenerateResultSheet";
import GenerateReportCard from "./GenerateReportCard";
import ClassPosition from "./ClassPosition";
import ResultAnalytics from "./ResultAnalytics";

const menuItems: { id: string; label: string; icon: string }[] = [
  { id: "create-exam", label: "Create Exam", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { id: "manage-subjects", label: "Manage Subjects", icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" },
  { id: "enter-marks", label: "Enter Marks", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { id: "bulk-upload", label: "Bulk Upload", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L5 8m4-4v12" },
  { id: "result-sheet", label: "Result Sheet", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "report-cards", label: "Report Cards", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { id: "position", label: "Class Position", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { id: "analytics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
];

const components: Record<string, React.FC> = {
  "create-exam": CreateExam,
  "manage-subjects": ManageSubjects,
  "enter-marks": EnterMarks,
  "bulk-upload": BulkExcelUpload,
  "result-sheet": GenerateResultSheet,
  "report-cards": GenerateReportCard,
  "position": ClassPosition,
  "analytics": ResultAnalytics,
};

export default function ResultManagement() {
  const { activeTab, setActiveTab } = useResult();

  const ActiveComponent = components[activeTab] || CreateExam;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-base font-bold text-white">Result Management</h1>
        </div>
      </div>

      <div className="flex gap-0 border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
              activeTab === item.id
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            <span className="inline text-[10px] sm:text-xs">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ActiveComponent />
      </div>
    </div>
  );
}
