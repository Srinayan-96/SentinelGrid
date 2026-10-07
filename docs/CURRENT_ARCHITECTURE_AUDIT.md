# Current Architecture Audit

## Classification of Discovered Functionality

### ACTIVE
- Client: `client/src/App.tsx`, `client/src/main.tsx`, `client/src/store/*`, `client/src/api/*`, `client/src/pages/*`, `client/src/portals/*`
- NGINX: `client/nginx.conf`
- Server: `server/src/app.js`, `server/src/config/database.js`, `server/src/routes/incidents.js`, `server/src/routes/auth.js`, `server/src/routes/facilities.js`, `server/src/routes/messages.js`, `server/src/routes/users.js`
- Server Models: `Incident.js`, `User.js`, `Facility.js`, `Message.js`
- Socket.IO: `server/src/socket/gateway.js`, `server/src/socket/index.js`, `server/src/socket/incidentHandlers.js`, `server/src/socket/responderHandlers.js`
- AI Integration: `server/src/services/triage.js` (contains OpenAI logic directly in node)
- DB/Migrations: `server/src/migrations/001_init.sql`, `server/src/scripts/runMigrations.js`
- AI Service: Python FastAPI service exists but `triage.js` in Node actually implements the GPT-4o call.

### LEGACY / DEAD CODE
- Client JS entrypoints: `client/src/App.jsx`, `client/src/main.jsx`
- Client JS store/socket: `client/src/store.js`, `client/src/socket.js`
- Client JS pages: `client/src/pages/AdminPortal.jsx`, `client/src/pages/CitizenView.jsx`, `client/src/pages/ResponderPortal.jsx`
- Server legacy routes: `server/src/routes/incidentRoutes.js`, `server/src/routes/authRoutes.js`, `server/src/routes/messageRoutes.js`
- Server legacy AI: `server/src/services/aiTriage.js`

### PARTIAL / BROKEN
- Testing: No tests exist in the repository currently.
- Python AI Service: Exists but is bypassed if `OPENAI_API_KEY` is present in Node environment. Node calls OpenAI directly.
- Docker: NGINX configuration is inside `client/` but standard docker-compose has it under `client: build: ./client`.

### UNUSED
- `server/src/routes/analytics.js`
- `server/src/routes/sitreps.js`
- `server/src/models/Assignment.js` (unused or partially used instead of JSON arrays in Incident)
- `server/src/models/IncidentLog.js`

### CONFLICTS / INCONSISTENCIES
- Assignment array inside `Incident.js` vs `Assignment.js` model.
- Two triage files (`triage.js`, `aiTriage.js`) and a python `ai-service`.
- `sequelize.sync({ force: process.env.NODE_ENV === 'development' })` causes destructive database changes on start.

## Conclusion
The repository has duplicate React implementations (JSX vs TSX).
The backend has duplicate route files.
The AI layer uses OpenAI in Node directly instead of the AI Service via Gemini.
No tests are present.
Concurrency issues exist in assignment logic.
