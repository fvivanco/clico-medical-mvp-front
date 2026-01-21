"use client";

import { useRef, useState } from "react";
import { usePlanStore } from "@/store/planStore";
import { useChatStore } from "@/store/chatStore";
import { createUploadSas, commitAttachment, listAttachments } from "@/services/api";

export default function UploadButton() {
  const { plan } = usePlanStore();
  const { activeChatId } = useChatStore();
  const inputRef = useRef(null);

  const [status, setStatus] = useState("");

  async function onPickFile(e) {
    try {
      const file = e.target.files?.[0];
      if (!file || !activeChatId) return;

      setStatus("Solicitando permiso de carga...");

      // 1) pedir SAS al backend
      const sasRes = await createUploadSas(
        activeChatId,
        {
          file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
        },
        plan
      );

      setStatus("Subiendo a Blob...");

      // 2) subir directo a Blob con PUT (SAS)
      const putRes = await fetch(sasRes.upload_url, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!putRes.ok) {
        const text = await putRes.text();
        throw new Error(`PUT Blob failed: ${putRes.status} ${text}`);
      }

      setStatus("Confirmando metadata...");

      // 3) commit en Postgres
      await commitAttachment(
        activeChatId,
        {
          attachment_id: sasRes.attachment_id,
          blob_path: sasRes.blob_path,
          file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
        },
        plan
      );

      setStatus("Listo. Archivo cargado.");

      // opcional: refrescar attachments (si luego los muestras)
      await listAttachments(activeChatId, plan);

    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
      setTimeout(() => setStatus(""), 4000);
    }
  }

  const disabled = plan === "BASIC" || !activeChatId;

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={onPickFile}
        accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
      />

      <button
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={`px-3 py-1 rounded ${
          disabled
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-green-600 text-white"
        }`}
        title={
          !activeChatId
            ? "Selecciona un chat"
            : plan === "BASIC"
            ? "Disponible solo en Pro"
            : "Subir archivo"
        }
      >
        Cargar archivos
      </button>

      {status ? <span className="text-sm text-gray-600">{status}</span> : null}
    </div>
  );
}
