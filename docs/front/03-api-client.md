# Frontend — API Client (src/services/api.js)

## 1. Overview
Este módulo centraliza todas las llamadas al backend FastAPI.

- `API_BASE`: `http://localhost:8000/api`
- `USER_ID`: `local-user-1` (hardcode MVP)
- `baseHeaders(plan)` agrega:
  - `Content-Type: application/json`
  - `x-user-id`
  - `x-plan` (BASIC/PRO)

> Nota: aunque algunos endpoints no requieren `x-plan`, el cliente lo envía siempre por consistencia.

---

## 2. Funciones (contratos)

### 2.1 Chats
#### `fetchChats(plan)`
- `GET /chats`
- retorna `Array<Chat>`

#### `createChat(type="GENERAL", plan)`
- `POST /chats`
- body: `{ type }`
- retorna `Chat`

### 2.2 Messages
#### `fetchMessages(chatId, plan)`
- `GET /chats/{chatId}/messages`
- retorna `Array<Message>`

#### `sendMessage(chatId, content, plan)`
- `POST /chats/{chatId}/messages`
- (nota: este endpoint podría no existir si solo se usa streaming)
- retorna respuesta del backend si está implementado

### 2.3 Attachments
#### `createUploadSas(chatId, fileMeta, plan)`
- `POST /chats/{chatId}/attachments/sas`
- body: `{ file_name, mime_type, size_bytes }`
- retorna `{ attachment_id, blob_path, upload_url }`
- si `res.ok` no es true: lanza error con `await res.text()`

#### `commitAttachment(chatId, payload, plan)`
- `POST /chats/{chatId}/attachments/commit`
- body: `{ attachment_id, blob_path, file_name, mime_type, size_bytes }`
- retorna metadata del attachment persistido
- maneja errores con `throw new Error(await res.text())`

#### `listAttachments(chatId, plan)`
- `GET /chats/{chatId}/attachments`
- retorna `Array<Attachment>`

---

## 3. Streaming SSE: `sendMessageStream(...)`

### Firma
`sendMessageStream(chatId, content, plan, onDelta, onDone, onError)`

### Request
- `POST /chats/{chatId}/messages/stream`
- body: `{ content }`

### Parsing implementado
- Lee `res.body.getReader()`
- Decodifica con `TextDecoder("utf-8")`
- Acumula en `buffer`
- Separa eventos por `\n\n`
- Para cada evento:
  - busca línea que empiece con `data: `
  - parsea JSON:
    - `type === "delta"` → `onDelta(evt.content)`
    - `type === "done"` → `onDone()`

### Errores
- Si `res.ok` es falso: lanza error con `await res.text()`
- Cualquier excepción → `onError(e)`

### Contrato SSE esperado del backend
Eventos en texto con formato:

data: {"type":"delta","content":"..."}\n\n
data: {"type":"done"}\n\n


---

## 4. Implicaciones para UI
La UI debe:
- agregar un placeholder assistant antes de iniciar stream
- concatenar deltas en el placeholder (ej: `appendToLastAssistant`)
- manejar “done” para re-habilitar input
