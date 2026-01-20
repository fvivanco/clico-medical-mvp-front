"use client";

import { usePlanStore } from "@/store/planStore";

export default function UploadButton() {
  const { plan } = usePlanStore();

  return (
    <button
      disabled={plan === "BASIC"}
      className={`px-3 py-1 rounded ${
        plan === "BASIC"
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-green-600 text-white"
      }`}
    >
      Cargar archivos
    </button>
  );
}
