import { PLANS } from "@/lib/subscription";
import type { PlanId } from "@/lib/subscription";

export default function UpgradeBanner({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">Upgrade Required</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-3">
        <span className="font-semibold">{feature}</span> is not included in your current package. Please upgrade to unlock this module.
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        {PLANS.filter((p) =>
          feature === "Paper Generator" ? p.features.paper : p.features.results
        ).map((plan) => (
          <button
            key={plan.id}
            onClick={() => {
              localStorage.setItem("subscription_plan", plan.id);
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
          >
            {plan.label}
          </button>
        ))}
      </div>
    </div>
  );
}
