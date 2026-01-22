
---

## 2) `docs/backend/02-architecture.md`

```md
# Backend (FastAPI) — Arquitectura interna

## 1. Objetivo
Implementar el backend cognitivo del MVP:

- Persistencia en Postgres (schema `medai`)
- Streaming tipo ChatGPT (SSE)
- RAG: indexación de documentos y retrieval por vector search (Azure AI Search)
- Upload directo a Blob con SAS (sin pasar el archivo por el backend)

---

## 2. Estructura del proyecto

backend/
main.py
app/
config.py
db.py
models.py
schemas.py
routers/
health.py
chats.py
attachments.py
services/
openai_service.py
openai_stream_service.py
embeddings_service.py
chat_service.py
search_query_service.py
search_index_service.py
indexer_service.py
text_extract_service.py
chunking_service.py
blob_service.py
blob_read_service.py


### 2.1 `main.py`
- Crea la instancia FastAPI
- Configura CORS (MVP abierto)
- Incluye routers (`health`, `chats`, `attachments`)

### 2.2 `app/config.py`
Carga variables de entorno mediante `dotenv`.

**Settings actuales**
- `DATABASE_URL`
- `AZURE_OPENAI_*` (endpoint, key, api_version, deployments)
- `AZURE_STORAGE_*` (account, key, container)
- `AZURE_SEARCH_*` (endpoint, admin_key, index)

### 2.3 `app/db.py`
- Crea `engine` SQLAlchemy
- Expone `SessionLocal` y `get_db()` para inyección en endpoints

### 2.4 `app/models.py`
Modelos ORM (SQLAlchemy), schema `medai`.

**Chat**
- `id` (UUID) generado en Python: `default=uuid.uuid4`
- `user_id`, `type`, `title`, `created_at`
- relación `messages`

**Message**
- `id` (UUID) generado en Python: `default=uuid.uuid4`
- `chat_id` FK a `medai.chats`
- `role`, `content`, `created_at`

> Nota: Se genera UUID en Python porque Azure PG puede bloquear extensiones `pgcrypto` / `uuid-ossp` en algunos tenants.

### 2.5 `app/schemas.py`
Pydantic models para request/response:
- `AttachmentSasRequest/Response`
- `AttachmentCommitRequest`
- `AttachmentResponse`
(además de los que apliquen en chat/mensajes)

---

## 3. Routers y responsabilidades

### 3.1 `routers/health.py`
- `GET /api/health`

### 3.2 `routers/chats.py`
- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/{chatId}/messages`
- `POST /api/chats/{chatId}/messages/stream` (SSE)

**Responsabilidades clave**
- Validación de `x-user-id`
- Ownership: chat debe pertenecer al user
- Persistencia de mensajes
- Orquestación de RAG (si el chat tiene attachments indexados)

### 3.3 `routers/attachments.py`
- `POST /api/chats/{chatId}/attachments/sas`
- `POST /api/chats/{chatId}/attachments/commit`
- `GET /api/chats/{chatId}/attachments`

**Responsabilidades clave**
- Validación `x-user-id` + ownership del chat
- Bloqueo si `x-plan != PRO`
- Generación de `attachment_id`
- Construcción de `blob_path`
- Inserción en `medai.attachments`
- Trigger de indexación (sincrónico en MVP)

---

## 4. Servicios: Integraciones externas

## 4.1 Azure OpenAI
### `services/openai_stream_service.py`
- Implementa streaming desde Azure OpenAI
- Convierte el stream en “deltas” de texto para SSE

### `services/openai_service.py`
- (Si existe) Implementa llamadas no-stream (útil para tareas internas futuras)

### `services/embeddings_service.py`
- Genera embeddings para:
  - indexación de chunks
  - búsqueda por similitud (query embedding)
- Deployment: `AZURE_OPENAI_EMBEDDING_DEPLOYMENT`
- Modelo elegido: `text-embedding-3-small` (1536 dims)

---

## 4.2 Azure Blob Storage
### `services/blob_service.py`
- Generación de SAS (write/put) para un `blob_path`
- Construcción de URL final

**Ruta actual**
- Container: `attachments`
- Path: `/{userId}/{chatId}/{attachmentId}/{originalFileName}`

### `services/blob_read_service.py`
- Descarga/lee el blob para extracción e indexación

---

## 4.3 Azure AI Search (RAG)
### Índice: `medai-chunks`
Campos relevantes:
- `id` (key)
- `user_id`, `chat_id` (filtros)
- `attachment_id`, `file_name`
- `chunk_id`
- `content` (texto)
- `contentVector` (vector, dims 1536, HNSW cosine)
- `created_at`

### `services/search_query_service.py`
- Ejecuta vector search
- Debe filtrar por:
  - `user_id eq '{user_id}' and chat_id eq '{chat_id}'`
- Retorna top-k chunks para contexto

### `services/search_index_service.py`
- Realiza `upload_documents` / upsert de chunks

### `services/indexer_service.py`
Orquestación de indexación al commit:
1) leer blob
2) `text_extract_service` (extrae texto)
3) `chunking_service` (split)
4) `embeddings_service` (vectores)
5) `search_index_service` (upsert a Azure AI Search)

---

## 5. Flujos críticos (backend)

## 5.1 Upload → Commit → Indexación
1) `POST /attachments/sas`
2) Front `PUT` a Blob con `upload_url`
3) `POST /attachments/commit`
4) `indexer_service.index_attachment(...)`

## 5.2 Streaming (con o sin RAG)
1) Insert `Message(role=user)`
2) Si hay attachments:
   - embed query
   - vector search top-k (Azure AI Search)
   - construir prompt con contexto
3) Azure OpenAI streaming
4) Emitir SSE `delta`
5) Persist `Message(role=assistant)` completo al final

---

## 6. Decisiones de diseño MVP
- `x-user-id` como identidad MVP (sin auth real)
- `x-plan` como gating simple (toggle UI)
- Streaming con SSE (simple + compatible con fetch/ReadableStream)
- Indexación síncrona en commit (se migra a async después)
- Filtrado RAG por chat (evita mezclar contextos de distintos chats)
