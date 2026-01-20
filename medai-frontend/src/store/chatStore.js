import { create } from "zustand";

export const useChatStore = create((set) => ({
  chats: [],
  activeChatId: null,
  messages: [],

  setChats: (chats) => set({ chats }),
  setActiveChat: (id) => set({ activeChatId: id }),
  setMessages: (messages) => set({ messages }),
}));
