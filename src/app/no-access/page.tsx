import Link from "next/link";

export default function NoAccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
        <p className="text-sm text-slate-500 mb-8">
          Your email is not authorized to access this application.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-medium"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
