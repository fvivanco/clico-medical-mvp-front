const API_BASE = "http://localhost:8000/api";
const USER_ID = "local-user-1";

const headers = {
  "Content-Type": "application/json",
  "x-user-id": USER_ID,
};

export async function fetchChats() {
  const res = await fetch(`${API_BASE}/chats`, { headers });
  return res.json();
}

export async function createChat(type = "GENERAL") {
  const res = await fetch(`${API_BASE}/chats`, {
    method: "POST",
    headers,
    body: JSON.stringify({ type }),
  });
  return res.json();
}

export async function fetchMessages(chatId) {
  const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, { headers });
  return res.json();
}

export async function sendMessage(chatId, content) {
  const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content }),
  });
  return res.json();
}
