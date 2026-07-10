export type PlanId = "paper" | "results" | "complete";

export interface Plan {
  id: PlanId;
  label: string;
  description: string;
  features: {
    paper: boolean;
    results: boolean;
  };
}

export const PLANS: Plan[] = [
  {
    id: "paper",
    label: "Paper Generator",
    description: "Paper Generator Only",
    features: { paper: true, results: false },
  },
  {
    id: "results",
    label: "Result Management",
    description: "Result Management Only",
    features: { paper: false, results: true },
  },
  {
    id: "complete",
    label: "Complete Package",
    description: "Paper Generator + Result Management",
    features: { paper: true, results: true },
  },
];

const STORAGE_KEY = "subscription_plan";

export function getPlan(): Plan {
  if (typeof window === "undefined") return PLANS[2];
  const id = localStorage.getItem(STORAGE_KEY) as PlanId | null;
  return PLANS.find((p) => p.id === id) || PLANS[2];
}

export function setPlan(id: PlanId): void {
  localStorage.setItem(STORAGE_KEY, id);
}

export function hasFeature(feature: "paper" | "results"): boolean {
  return getPlan().features[feature];
}
