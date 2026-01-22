"use client";

import { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { usePlanStore } from "@/store/planStore";
import { sendMessageStream, fetchMessages } from "@/services/api";

export default function ChatInput() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const { activeChatId, addMessage, appendToLastAssistant, setMessages } = useChatStore();
  const { plan } = usePlanStore();

  async function onSend() {
    const input = text.trim();
    if (!input || !activeChatId || loading) return;

    setText("");
    setLoading(true);

    // 1) Render inmediato: user
    addMessage({
      id: `local-user-${Date.now()}`,
      role: "user",
      content: input,
    });

    // 2) Placeholder assistant (vacío)
    addMessage({
      id: `local-assistant-${Date.now()}`,
      role: "assistant",
      content: "",
    });

    // 3) Streaming real
    await sendMessageStream(
      activeChatId,
      input,
      plan,
      (delta) => {
        appendToLastAssistant(delta);
      },
      async () => {
        // done: refresca desde backend para asegurar consistencia/persistencia
        try {
          const res = await fetchMessages(activeChatId, plan);
          const data = Array.isArray(res) ? res : res.messages;
          setMessages(data || []);
        } catch {}
        setLoading(false);
      },
      (err) => {
        console.error(err);
        addMessage({
          id: `local-error-${Date.now()}`,
          role: "assistant",
          content: "[Error en streaming. Reintenta.]",
        });
        setLoading(false);
      }
    );
  }

  return (
    <div className="p-4 border-t flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 border rounded p-2"
        placeholder="Escribe tu mensaje..."
        disabled={!activeChatId || loading}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSend();
        }}
      />
      <button
        onClick={onSend}
        disabled={!activeChatId || loading}
        className={`px-4 rounded ${
          loading ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 text-white"
        }`}
      >
        {loading ? "..." : "Enviar"}
      </button>
    </div>
  );
}
