import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChatId: null,

  // mensajes del chat activo
  messages: [],

  setChats: (payload) =>
  set({
    chats: Array.isArray(payload) ? payload : payload?.chats || [],
  }),
  setActiveChat: (id) => set({ activeChatId: id, messages: [] }),

  setMessages: (messages) => set({ messages }),

  // ✅ NUEVO: agrega mensaje al array
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),

  // ✅ NUEVO: concatena delta al ÚLTIMO mensaje assistant
  appendToLastAssistant: (delta) =>
    set((state) => {
      const msgs = [...state.messages];
      if (msgs.length === 0) return { messages: msgs };

      const lastIdx = msgs.length - 1;
      const last = msgs[lastIdx];

      if (!last || last.role !== "assistant") {
        // Si por alguna razón el último no es assistant, no hacemos nada
        return { messages: msgs };
      }

      msgs[lastIdx] = { ...last, content: (last.content || "") + delta };
      return { messages: msgs };
    }),
}));
