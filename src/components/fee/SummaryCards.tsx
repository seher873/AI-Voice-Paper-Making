"use client";

import { formatPKR } from "@/types/fee";

interface Props {
  totalStudents: number;
  totalFeesYear: number;
  totalCollected: number;
  totalPending: number;
}

const cards = (p: Props) => [
  {
    label: "Total Students",
    value: String(p.totalStudents),
    sub: "All Classes",
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    label: "Total Fees (Year)",
    value: formatPKR(p.totalFeesYear),
    sub: "Expected Collection",
    color: "bg-slate-50 border-slate-200",
    iconColor: "text-slate-600",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    label: "Collected",
    value: formatPKR(p.totalCollected),
    sub: p.totalFeesYear > 0 ? `${Math.round((p.totalCollected / p.totalFeesYear) * 100)}% Collected` : "0% Collected",
    color: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    bar: true,
    barPct: p.totalFeesYear > 0 ? Math.min((p.totalCollected / p.totalFeesYear) * 100, 100) : 0,
    barColor: "bg-green-500",
  },
  {
    label: "Pending",
    value: formatPKR(p.totalPending),
    sub: p.totalFeesYear > 0 ? `${Math.round((p.totalPending / p.totalFeesYear) * 100)}% Pending` : "0% Pending",
    color: "bg-red-50 border-red-200",
    iconColor: "text-red-600",
    icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    bar: true,
    barPct: p.totalFeesYear > 0 ? Math.min((p.totalPending / p.totalFeesYear) * 100, 100) : 0,
    barColor: "bg-red-400",
  },
];

export default function SummaryCards(props: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards(props).map((c) => (
        <div key={c.label} className={`relative p-4 rounded-2xl border ${c.color} transition-all hover:shadow-md`}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{c.label}</p>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.color.replace("border-", "bg-").replace("-200", "-100")}`}>
              <svg className={`w-4 h-4 ${c.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={c.icon} />
              </svg>
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-800 tracking-tight">{c.value}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{c.sub}</p>
          {"bar" in c && c.bar && (
            <div className="mt-2.5 h-1.5 w-full bg-white/60 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${c.barColor} transition-all duration-500`} style={{ width: `${c.barPct}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
