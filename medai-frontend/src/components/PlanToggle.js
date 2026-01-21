"use client";

import { usePlanStore } from "@/store/planStore";

export default function PlanToggle() {
  const { plan, togglePlan } = usePlanStore();
  const isPro = plan === "PRO";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">Plan {isPro ? "Pro" : "Básico"}</span>

      <button
        onClick={togglePlan}
        className={`w-12 h-7 rounded-full relative transition ${
          isPro ? "bg-green-500" : "bg-gray-300"
        }`}
        aria-label="Toggle plan"
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full transition ${
            isPro ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
