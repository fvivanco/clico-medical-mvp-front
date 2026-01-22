# Frontend (Next.js) — Arquitectura y componentes

## 1. Objetivo
Frontend tipo ChatGPT para el MVP médico ejecutándose localmente, consumiendo el backend FastAPI local. Implementa:

- Chat general (BASIC)
- Toggle visual BASIC/PRO (sin auth real)
- Upload de archivos (solo PRO): SAS → PUT Blob → commit → indexación (backend)
- Streaming SSE de respuestas (tipo ChatGPT)
- Persistencia de plan entre refrescos (Zustand persist)

---

## 2. Estructura del proyecto

# Frontend (Next.js) — Arquitectura y componentes

## 1. Objetivo
Frontend tipo ChatGPT para el MVP médico ejecutándose localmente, consumiendo el backend FastAPI local. Implementa:

- Chat general (BASIC)
- Toggle visual BASIC/PRO (sin auth real)
- Upload de archivos (solo PRO): SAS → PUT Blob → commit → indexación (backend)
- Streaming SSE de respuestas (tipo ChatGPT)
- Persistencia de plan entre refrescos (Zustand persist)

---

## 2. Estructura del proyecto

src/
app/
layout.js
page.js
globals.css
components/
ChatSidebar.js
ChatPanel.js
ChatInput.js
UploadButton.js
PlanToggle.js
DicomButton.js
services/
api.js
store/
chatStore.js
planStore.js


---

## 3. API Client (src/services/api.js)
El frontend centraliza llamadas HTTP al backend en `api.js`.

Características:
- Base URL: `http://localhost:8000/api`
- `USER_ID` hardcodeado (MVP): `local-user-1`
- Headers estándar en cada request:
  - `x-user-id`
  - `x-plan` (desde UI)
  - `Content-Type: application/json` (en JSON requests)
- Upload:
  - `createUploadSas()` y `commitAttachment()`
- Streaming SSE:
  - `sendMessageStream()` usando `ReadableStream` y parsing de eventos `data: {...}`

---

## 4. State management (Zustand)

## 4.1 Plan Store — `src/store/planStore.js`
Store persistente usando `zustand/middleware/persist`.

Estado:
- `plan: "BASIC" | "PRO"`

Acción:
- `togglePlan()`: alterna BASIC ↔ PRO

Persistencia:
- Se guarda en `localStorage` bajo la clave: `plan-storage`
- Resultado: al refrescar la página, el plan se conserva.

Implicación:
- El header `x-plan` cambia según el plan persistido.

## 4.2 Chat Store — `src/store/chatStore.js`
Estado:
- `chats: []`
- `activeChatId: string | null`
- `messages: []` (del chat activo)

Acciones:
- `setChats(payload)`
  - Acepta `Array` o `{chats:[...]}` (fallback defensivo):
    - si `payload` es array → lo usa
    - si no → usa `payload?.chats || []`
- `setActiveChat(id)`
  - cambia chat activo y resetea mensajes (`messages: []`)
- `setMessages(messages)`
  - reemplaza mensajes completos (usado al cargar historial)
- `addMessage(msg)`
  - append (optimistic UI)
- `appendToLastAssistant(delta)`
  - concatena texto al último mensaje si `role === "assistant"`
  - usado por streaming SSE para construir la respuesta incremental

---

## 5. Componentes y responsabilidades

## 5.1 `ChatSidebar.js`
Responsabilidad:
- Navegación de chats (lista)
- Crear chat GENERAL / DICOM (si está conectado)
- Selección de chat activo (`setActiveChat(chat.id)`)

Integración:
- `fetchChats(plan)`
- `createChat(type, plan)`

---

## 5.2 `ChatPanel.js`
Responsabilidad:
- Panel principal del chat:
  - Header: `UploadButton` + `PlanToggle`
  - Body: lista de mensajes
  - Footer: `ChatInput`

Integración:
- `fetchMessages(activeChatId, plan)` al cambiar chat
- Renderiza mensajes y mantiene la experiencia de chat principal

---

## 5.3 `ChatInput.js`
Responsabilidad:
- Captura de texto del usuario
- Envío con streaming:
  1) `addMessage({role:"user", ...})`
  2) `addMessage({role:"assistant", content:""})` como placeholder
  3) `sendMessageStream(..., onDelta)`
  4) `appendToLastAssistant(delta)` para completar respuesta

Integración:
- `sendMessageStream(chatId, content, plan, onDelta, onDone, onError)`

---

## 5.4 `UploadButton.js`
Responsabilidad:
- Upload habilitado solo si:
  - `plan === "PRO"` AND `activeChatId != null`
- Flujo implementado:
  1) `createUploadSas(chatId, fileMeta, plan)`
  2) `PUT` directo a Blob usando `sasRes.upload_url`
     - headers:
       - `x-ms-blob-type: BlockBlob`
       - `Content-Type: <mime>`
  3) `commitAttachment(chatId, payload, plan)` para:
     - persistir metadata en Postgres
     - disparar indexación en Azure AI Search (backend)
  4) `listAttachments(chatId, plan)` (opcional; actualmente solo refresca sin usar resultado)

UX / Status:
- `status` en UI:
  - “Solicitando permiso de carga...”
  - “Subiendo a Blob...”
  - “Confirmando metadata...”
  - “Listo. Archivo cargado.”
  - errores: “Error: ...”
- Limpia input file al final para permitir re-selección del mismo archivo.

---

## 5.5 `PlanToggle.js`
Responsabilidad:
- Control visual del plan (BASIC/PRO)
- Dispara `togglePlan()` en `planStore`
- El plan impacta:
  - header `x-plan` en requests
  - habilitación del botón de upload

---

## 5.6 `DicomButton.js`
Responsabilidad:
- UI para crear chat DICOM
- Pipeline DICOM real aún no implementado en esta etapa

---

## 6. Integraciones externas
El frontend no integra Azure directamente, excepto el `PUT` directo a Blob usando SAS.

- Azure OpenAI: vía backend
- Azure AI Search: vía backend
- Azure Postgres: vía backend
- Azure Blob Storage: directo únicamente en el `PUT` (SAS)

---

## 7. Consideraciones MVP
- Identidad hardcodeada: `USER_ID = "local-user-1"`
- Plan persistente en localStorage: `plan-storage`
- Streaming SSE con parsing por `\n\n` y líneas `data: ...`
- Upload solo PRO; BASIC renderiza disabled con tooltip