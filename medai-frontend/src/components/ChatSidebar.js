"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { createChat, fetchChats } from "@/services/api";
import DicomButton from "./DicomButton";

export default function ChatSidebar() {
  const { chats, setChats, setActiveChat } = useChatStore();

  useEffect(() => {
    fetchChats().then(setChats);
  }, [setChats]);

  async function newChat(type = "GENERAL") {
    const chat = await createChat(type);
    const updated = await fetchChats();
    setChats(updated);
    setActiveChat(chat.id);
  }

  return (
    <div className="w-64 bg-gray-900 text-white p-4 flex flex-col">
      <button
        onClick={() => newChat("GENERAL")}
        className="mb-2 bg-blue-600 p-2 rounded"
      >
        Nuevo Chat
      </button>

      <DicomButton onClick={() => newChat("DICOM")} />

      <div className="mt-4 flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setActiveChat(chat.id)}
            className="p-2 hover:bg-gray-700 cursor-pointer rounded"
          >
            {chat.title || (chat.type === "DICOM" ? "DICOM" : "Chat")}
          </div>
        ))}
      </div>
    </div>
  );
}
