"use client";

import { useState } from "react";
import FeeStudentList from "./fee/FeeStudentList";
import CollectFee from "./fee/CollectFee";
import FeeReport from "./fee/FeeReport";
import FeeSlipSender from "./fee/FeeSlipSender";
import type { FeeTab } from "@/types/fee";

const menuItems: { id: FeeTab; label: string; icon: string }[] = [
  {
    id: "students",
    label: "Students & Fees",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    id: "collect",
    label: "Collect Fee",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "report",
    label: "Fee Report",
    icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    id: "slips",
    label: "Send Slips 📱",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
];

const components: Record<FeeTab, React.FC> = {
  students: FeeStudentList,
  collect: CollectFee,
  report: FeeReport,
  slips: FeeSlipSender,
};

export default function FeeManagement() {
  const [activeTab, setActiveTab] = useState<FeeTab>("students");
  const ActiveComponent = components[activeTab];

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Fee Management</h1>
            <p className="text-[10px] text-green-200">Student fees, collection & WhatsApp slips</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 flex gap-0 border-b border-slate-200 bg-slate-50/95 overflow-x-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
              activeTab === item.id
                ? "border-green-600 text-green-700 bg-white"
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

      {/* Content */}
      <div className="p-4">
        <ActiveComponent />
      </div>
    </div>
  );
}
