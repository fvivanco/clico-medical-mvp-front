const API_BASE = "http://localhost:8000/api";
const USER_ID = "local-user-1";

function baseHeaders(plan) {
  return {
    "Content-Type": "application/json",
    "x-user-id": USER_ID,
    "x-plan": plan || "BASIC",
  };
}

export async function fetchChats(plan) {
  const res = await fetch(`${API_BASE}/chats`, { headers: baseHeaders(plan) });
  return res.json();
}

export async function createChat(type = "GENERAL", plan) {
  const res = await fetch(`${API_BASE}/chats`, {
    method: "POST",
    headers: baseHeaders(plan),
    body: JSON.stringify({ type }),
  });
  return res.json();
}

export async function fetchMessages(chatId, plan) {
  const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
    headers: baseHeaders(plan),
  });
  return res.json();
}

export async function sendMessage(chatId, content, plan) {
  const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
    method: "POST",
    headers: baseHeaders(plan),
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function createUploadSas(chatId, fileMeta, plan) {
  const res = await fetch(`${API_BASE}/chats/${chatId}/attachments/sas`, {
    method: "POST",
    headers: baseHeaders(plan),
    body: JSON.stringify(fileMeta),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function commitAttachment(chatId, payload, plan) {
  const res = await fetch(`${API_BASE}/chats/${chatId}/attachments/commit`, {
    method: "POST",
    headers: baseHeaders(plan),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listAttachments(chatId, plan) {
  const res = await fetch(`${API_BASE}/chats/${chatId}/attachments`, {
    headers: baseHeaders(plan),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
