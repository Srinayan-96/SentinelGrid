# SentinelGrid Master Architecture Refactor

## Refactoring Philosophy
Our goal was to stabilize the existing architecture into a clean, maintainable, cloud-native ready (Kubernetes-ready) application without fully rewriting from scratch. The legacy codebase featured massive god classes, direct hardware-bound dependencies (OpenAI hardcoded), scattered route validation, inconsistent data models, and race conditions.

## Key Changes
1. **Clean Layered Architecture & Request Validation**
   - Implemented `zod` for centralized request validation schemas (`validators/`).
   - Integrated `express-async-handler` across all controllers to standardize unhandled promise rejections.
   - Restructured Express routes (e.g., `routes/incidents.js`, `routes/auth.js`) so that all business logic lives strictly in `controllers/` and `services/`.
   - Created a unified `errorHandler.js` middleware with a standard `AppError` hierarchy (`NotFoundError`, `ConflictError`, `AuthenticationError`, `AuthorizationError`, etc.) using standard JSON schemas (RFC 7807 problem details pattern).

2. **AI Component Separation (OpenAI to Gemini)**
   - Removed all direct `openai` library calls from the Node.js backend.
   - Refactored `server/src/services/triage.js` to act purely as an HTTP client pointing to `ai-service` via `AI_SERVICE_URL`.
   - Modified `ai-service` (FastAPI) to replace `openai` with `google-genai` and Gemini 1.5 Flash, aligning with the mandate.
   - Ensured the AI continues to serve as *decision support* (flagging, summarizing, resource estimation), maintaining fallback deterministic rules if the AI fails.

3. **Concurrency Safety & Authoritative Data Models**
   - Replaced fragile, optimistic incident assignment logic with a strict, atomic database-backed `Assignment` model.
   - Leveraged `sequelize.transaction` and `lock: t.LOCK.UPDATE` (row-level locking) when claiming an incident, proving two concurrent responders cannot double-claim.
   - Disabled raw `sequelize.sync({ force: true })` in production setups.
   - Solidified `migrations/001_init.sql` to be the single source of truth for the PostGIS schema, tightly matched to the Sequelize models (camelCase vs snake_case mismatches resolved).

4. **Socket.IO Standardization**
   - Centralized all Socket.IO connections in `server/src/socket/index.js`.
   - Stripped away legacy chat DB-persistence from the Socket listener—the HTTP POST `/messages` route now authoritatively stores the message and emits it via socket.
   - Implemented JWT authentication on Socket connection handshake.
   - Unified event namespaces (`incident.created`, `incident.assigned`, `incident.updated`, `message.created`, `responder.location_updated`, `system.alert`).

5. **Docker & Operations Preparedness**
   - Corrected the `docker-compose.yml` to properly include `ai-service`, wire health checks, wait mechanisms (`depends_on: condition: service_healthy`), and unified `.env` injection.
   - Removed dependencies on host-bound local storage for critical workflows (preparing for Kubernetes stateless architecture).

## Testing
- Setup Jest and `sequelize-mock`.
- Wrote concurrency tests (`incidentConcurrency.test.js`) successfully verifying the incident claim race condition prevention using mock transactions.
