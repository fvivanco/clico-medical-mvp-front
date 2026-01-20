"use client";

export default function DicomButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mb-2 w-full bg-purple-600 p-2 rounded text-white"
    >
      Análisis DICOM
    </button>
  );
}
