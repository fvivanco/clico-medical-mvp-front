"use client";

import { usePlanStore } from "@/store/planStore";

export default function PlanToggle() {
  const { plan, togglePlan } = usePlanStore();

  return (
    <button
      onClick={togglePlan}
      className="px-3 py-1 border rounded"
    >
      Plan: {plan}
    </button>
  );
}
