import { create } from "zustand";
import { persist } from "zustand/middleware";

export const usePlanStore = create(
  persist(
    (set) => ({
      plan: "BASIC",
      togglePlan: () =>
        set((state) => ({
          plan: state.plan === "BASIC" ? "PRO" : "BASIC"
        }))
    }),
    { name: "plan-storage" }
  )
);
