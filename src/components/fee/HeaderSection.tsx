"use client";

interface Props {
  search: string;
  setSearch: (v: string) => void;
  filterClass: string;
  setFilterClass: (v: string) => void;
  filterSession: string;
  setFilterSession: (v: string) => void;
  uniqueClasses: string[];
  sessions: string[];
  onCollect: () => void;
}

export default function HeaderSection({ search, setSearch, filterClass, setFilterClass, filterSession, setFilterSession, uniqueClasses, sessions, onCollect }: Props) {
  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="hover:text-indigo-600 cursor-pointer transition-colors">Dashboard</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-slate-700 font-semibold">Fees</span>
      </div>

      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Fees</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage student fees, collections and payment history</p>
        </div>
        <button
          onClick={onCollect}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.97] transition-all shadow-md shadow-indigo-600/20 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Collect Fee
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
          />
        </div>
        <select
          value={filterSession}
          onChange={(e) => setFilterSession(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all min-w-[140px]"
        >
          <option value="">All Years</option>
          {sessions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all min-w-[140px]"
        >
          <option value="">All Classes</option>
          {uniqueClasses.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}
