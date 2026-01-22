# Backend (FastAPI) — Runbook (Local)

## 1. Objetivo
Guía operativa para ejecutar, validar y depurar el backend del MVP.

---

## 2. Variables de entorno (nombres)
Se cargan desde `.env` vía `dotenv` (`app/config.py`).

- `DATABASE_URL`

- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_API_VERSION` (default: `2024-06-01`)
- `AZURE_OPENAI_CHAT_DEPLOYMENT` (default: `chat-main`)
- `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` (default: `embed-main`)

- `AZURE_STORAGE_ACCOUNT_NAME`
- `AZURE_STORAGE_ACCOUNT_KEY`
- `AZURE_STORAGE_CONTAINER_ATTACHMENTS` (default: `attachments`)

- `AZURE_SEARCH_ENDPOINT`
- `AZURE_SEARCH_ADMIN_KEY`
- `AZURE_SEARCH_INDEX` (default: `medai-chunks`)

---

## 3. Ejecutar backend
Ejemplo:
```cmd
uvicorn main:app --reload --host 0.0.0.0 --port 8000
4. Pruebas de humo (Windows CMD)
Health
curl http://localhost:8000/api/health

Rutas registradas

(útil para validar que existen /api/chats, /messages, /attachments)

curl http://localhost:8000/api/routes

Crear chat
curl -X POST http://localhost:8000/api/chats ^
  -H "Content-Type: application/json" ^
  -H "x-user-id: local-user-1" ^
  -d "{\"type\":\"GENERAL\",\"title\":\"Chat 1\"}"

Listar chats
curl http://localhost:8000/api/chats ^
  -H "x-user-id: local-user-1"

Listar mensajes
curl http://localhost:8000/api/chats/<CHAT_ID>/messages ^
  -H "x-user-id: local-user-1"

Streaming (SSE)
curl -N -X POST http://localhost:8000/api/chats/<CHAT_ID>/messages/stream ^
  -H "Content-Type: application/json" ^
  -H "x-user-id: local-user-1" ^
  -d "{\"content\":\"hola\"}"

Upload SAS (requiere PRO)
curl -X POST http://localhost:8000/api/chats/<CHAT_ID>/attachments/sas ^
  -H "Content-Type: application/json" ^
  -H "x-user-id: local-user-1" ^
  -H "x-plan: PRO" ^
  -d "{\"file_name\":\"doc.pdf\",\"mime_type\":\"application/pdf\",\"size_bytes\":1000}"

5. Troubleshooting (casos comunes)
5.1 GET /api/chats retorna 404

Causa: endpoint no registrado o router no incluido.
Acción:

curl http://localhost:8000/api/routes

revisar main.py include_router(...)

5.2 Error UUID en inserts (NotNullViolation id)

Causa: Azure PostgreSQL puede bloquear extensiones UUID. Si el ID no se genera en DB, debe generarse en Python.
Acción:

models.py: default=uuid.uuid4 en PKs (Chat.id, Message.id)

5.3 Indexación falla pero commit OK

Comportamiento esperado (MVP):

commit no falla por errores de indexación.

Se loggea: [INDEXING_ERROR] attachment_id=...

Acción:

revisar logs backend

verificar índice medai-chunks

validar dims: 1536 para text-embedding-3-small

5.4 RAG no “aporta” contexto

Causas típicas:

commit se ejecutó, pero extracción de texto resultó vacía

query sin embeddings (falló OpenAI)

filtro de search muy restrictivo (user_id/chat_id)
Acción:

validar que se subieron documentos al índice (Azure portal)

probar vector search desde backend con un query conocido


---

# Recomendación de mejora (documentación técnica)
Con tu implementación actual, ya hay dos puntos que conviene documentar como “próxima iteración” (no bloquean el MVP, pero son importantes):

1) **Schema `medai.attachments`** no está en `models.py` (se usa SQL directo).  
   - Está bien para MVP, pero la doc debe decirlo explícitamente (ya lo hace).  
   - Más adelante conviene crear un `Attachment` ORM para uniformidad.

2) **Indexación síncrona** en `commit`.  
   - Para PDFs grandes, puede tardar y afectar UX.  
   - Próxima fase: queue/worker (Azure Queue/Service Bus + background worker).

---
