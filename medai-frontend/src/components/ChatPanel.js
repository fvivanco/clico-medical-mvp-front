"use client";

import { useChatStore } from "@/store/chatStore";
import { fetchMessages } from "@/services/api";
import { useEffect } from "react";
import ChatInput from "./ChatInput";
import UploadButton from "./UploadButton";
import PlanToggle from "./PlanToggle";

export default function ChatPanel() {
  const { activeChatId, messages, setMessages } = useChatStore();

  useEffect(() => {
    if (!activeChatId) return;

    fetchMessages(activeChatId).then((res) => {
      // soporta ambos formatos: array directo o {messages: [...]}
      const data = Array.isArray(res) ? res : res.messages;
      setMessages(data || []);
    });
  }, [activeChatId, setMessages]);

  if (!activeChatId) {
    return <div className="flex-1 p-10">Selecciona o crea un chat</div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b flex justify-between">
        <UploadButton />
        <PlanToggle />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((m, idx) => (
          <div key={m.id || idx} className="mb-3">
            <b>{m.role}:</b> {m.content}
          </div>
        ))}
      </div>

      <ChatInput />
    </div>
  );
}
