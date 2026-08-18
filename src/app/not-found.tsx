export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
        <div className="text-6xl font-black text-indigo-100 mb-4">404</div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Page nahi mila</h2>
        <p className="text-sm text-slate-500 mb-6">
          Ye page exist nahi karta ya hata diya gaya hai.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Home Page Par Jayein
        </a>
      </div>
    </div>
  );
}
