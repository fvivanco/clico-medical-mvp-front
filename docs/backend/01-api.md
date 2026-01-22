# Backend (FastAPI) — API Reference

## 1. Overview
Este backend implementa la capa cognitiva del MVP de chat médico, incluyendo:

- CRUD mínimo de chats
- Persistencia de mensajes en Postgres (schema `medai`)
- Mensajería con Azure OpenAI en modo **streaming (SSE)**
- Subida de archivos (attachments) con **SAS + Azure Blob Storage**
- Indexación para RAG en **Azure AI Search** al confirmar el upload (`commit`)
- Listado de attachments por chat

**Base URL (local):** `http://localhost:8000`

---

## 2. Headers (MVP)
### 2.1 Identidad
- `x-user-id` (string)
  - Identifica al usuario en modo MVP (sin auth real).
  - Se utiliza para aislamiento de datos (multi-tenant lógico).

Ejemplo:
- `x-user-id: local-user-1`

### 2.2 Plan
- `x-plan` (string)
  - `BASIC` o `PRO`
  - Se usa para habilitar o bloquear **upload** de archivos.

Regla actual:
- Upload solo permitido si `x-plan=PRO`

---

## 3. Endpoints

### 3.1 Health
#### `GET /api/health`
Verifica disponibilidad del servicio.

**Response**
```json
{ "status": "ok" }

3.2 Chats
GET /api/chats

Lista chats del usuario.

Headers

x-user-id: <userId>

Response (array)

[
  { "id":"<uuid>", "type":"GENERAL", "title":"Chat 1", "created_at":"..." }
]

POST /api/chats

Crea un chat.

Headers

x-user-id: <userId>

Content-Type: application/json

Body

{ "type":"GENERAL", "title":"Chat 1" }


Response

{ "id":"<uuid>", "type":"GENERAL", "title":"Chat 1", "created_at":"..." }

3.3 Messages (historial)
GET /api/chats/{chatId}/messages

Lista mensajes del chat.

Headers

x-user-id: <userId>

Response (array)

[
  { "id":"<uuid>", "role":"user", "content":"...", "created_at":"..." },
  { "id":"<uuid>", "role":"assistant", "content":"...", "created_at":"..." }
]

3.4 Messages (streaming SSE)
POST /api/chats/{chatId}/messages/stream

Envia mensaje y recibe la respuesta del assistant en streaming (SSE).

Headers

x-user-id: <userId>

Content-Type: application/json

Body

{ "content":"Hola, explica hipertensión" }


Response

Content-Type: text/event-stream

Eventos SSE con data: <json>

Eventos

{"type":"delta","content":"..."}: fragmento de texto

{"type":"done"}: fin del stream

Ejemplo:

data: {"type":"delta","content":"La "}
data: {"type":"delta","content":"hipertensión "}
data: {"type":"done"}


Persistencia

Inserta Message(role=user) al inicio.

Inserta Message(role=assistant) al final (contenido completo).

3.5 Attachments (SAS + commit + list)
POST /api/chats/{chatId}/attachments/sas

Genera una URL SAS para que el frontend haga PUT directo a Blob.

Headers

x-user-id: <userId>

x-plan: PRO

Content-Type: application/json

Body

{
  "file_name": "lab.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 12345
}


Response

{
  "attachment_id": "<uuid>",
  "blob_path": "<userId>/<chatId>/<attachmentId>/lab.pdf",
  "upload_url": "https://<account>.blob.core.windows.net/attachments/<blob_path>?<sas>"
}


Blob path (actual)

Container: attachments

Path: /{userId}/{chatId}/{attachmentId}/{originalFileName}

POST /api/chats/{chatId}/attachments/commit

Confirma el upload y dispara indexación (RAG).

Headers

x-user-id: <userId>

x-plan: PRO

Content-Type: application/json

Body

{
  "attachment_id": "<uuid>",
  "blob_path": "<userId>/<chatId>/<attachmentId>/lab.pdf",
  "file_name": "lab.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 12345
}


Acciones

Inserta metadata en Postgres: medai.attachments

Ejecuta indexación síncrona en Azure AI Search:

read blob → extract text → chunking → embeddings → upsert chunks

Response

{
  "id": "<uuid>",
  "chat_id": "<uuid>",
  "blob_path": "...",
  "file_name": "...",
  "mime_type": "...",
  "size_bytes": 12345
}


Notas

Si falla la indexación, no rompe el commit (MVP): solo loggea [INDEXING_ERROR].

GET /api/chats/{chatId}/attachments

Lista attachments del chat.

Headers

x-user-id: <userId>

Response

[
  {
    "id":"<uuid>",
    "chat_id":"<uuid>",
    "blob_path":"...",
    "file_name":"...",
    "mime_type":"...",
    "size_bytes":12345
  }
]

4. Ejemplos (Windows CMD)
Health
curl http://localhost:8000/api/health

Crear chat
curl -X POST http://localhost:8000/api/chats ^
  -H "Content-Type: application/json" ^
  -H "x-user-id: local-user-1" ^
  -d "{\"type\":\"GENERAL\",\"title\":\"Chat 1\"}"

Listar chats
curl http://localhost:8000/api/chats ^
  -H "x-user-id: local-user-1"

Streaming (SSE)
curl -N -X POST http://localhost:8000/api/chats/<CHAT_ID>/messages/stream ^
  -H "Content-Type: application/json" ^
  -H "x-user-id: local-user-1" ^
  -d "{\"content\":\"Hola\"}"

Generar SAS (PRO)
curl -X POST http://localhost:8000/api/chats/<CHAT_ID>/attachments/sas ^
  -H "Content-Type: application/json" ^
  -H "x-user-id: local-user-1" ^
  -H "x-plan: PRO" ^
  -d "{\"file_name\":\"lab.pdf\",\"mime_type\":\"application/pdf\",\"size_bytes\":12345}"