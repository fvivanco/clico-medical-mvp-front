"use client";

import { useState } from "react";
import { sendMessage, fetchMessages } from "@/services/api";
import { useChatStore } from "@/store/chatStore";

export default function ChatInput() {
  const [text, setText] = useState("");
  const { activeChatId, setMessages } = useChatStore();

  async function submit() {
    if (!text.trim()) return;
    await sendMessage(activeChatId, text);
    const res = await fetchMessages(activeChatId);
    setMessages(res.messages);
    setText("");
  }

  return (
    <div className="p-4 border-t flex gap-2">
      <input
        className="flex-1 border p-2 rounded"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe tu mensaje..."
      />
      <button
        onClick={submit}
        className="bg-blue-600 text-white px-4 rounded"
      >
        Enviar
      </button>
    </div>
  );
}
