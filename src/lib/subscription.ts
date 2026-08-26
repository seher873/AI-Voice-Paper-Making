export type PlanId = "paper" | "results" | "full";

export interface Plan {
  id: PlanId;
  label: string;
  description: string;
  features: {
    paper: boolean;
    results: boolean;
    fees: boolean;
  };
}

export const PLANS: Plan[] = [
  {
    id: "paper",
    label: "Paper Generator",
    description: "Paper Generator Only",
    features: { paper: true, results: false, fees: false },
  },
  {
    id: "results",
    label: "Result Management",
    description: "Result Management Only",
    features: { paper: false, results: true, fees: true },
  },
  {
    id: "full",
    label: "Full Access",
    description: "Paper Generator + Result Management",
    features: { paper: true, results: true, fees: true },
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

export function hasFeature(feature: "paper" | "results" | "fees"): boolean {
  return getPlan().features[feature];
}

