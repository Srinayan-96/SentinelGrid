# SentinelGrid - AI-Driven Disaster Response System

SentinelGrid is a cutting-edge, real-time disaster management and emergency response orchestration platform. It leverages AI (Google Gemini) for automated triage, Google Maps & Places API for spatial intelligence and dynamic asset tracking, and WebSockets for real-time tactical synchronization.

## 🌟 Portals & Ecosystem

SentinelGrid connects three distinct user domains in real time:

1. **Citizen SOS Portal** (`/citizen/sos`)
   - Citizens can instantly report emergencies, auto-detect their geospatial location, and specify the disaster type (Flood, Fire, Medical, Collapse, etc.).
   - Provides live updates, the computed ETA of arriving rescue squads, and direct communication with assigned responders.

2. **Command Centre Dashboard** (`/command/dashboard`)
   - The central nervous system for dispatchers. Provides a **Live Tactical Map** plotting all active incidents.
   - **Dynamic Facilities**: Automatically queries Google Places API to find nearby Police Stations, Fire Brigades, and Hospitals.
   - Dispatchers can manually assign tactical units to incidents and monitor active operations.

3. **Responder Mission Terminal** (`/responder/mission`)
   - Deployed units receive live mission assignments here.
   - Includes tactical route drawing to the incident, real-time position tracking, and an encrypted live chat feed to coordinate with the citizen and the command centre.

---

## 🏗️ Technical Architecture

The platform operates on a modernized microservices architecture, entirely containerized via Docker:

* **Frontend (`client`)**: React 18, TypeScript, Zustand (persistent storage), Vite, TailwindCSS, `react-google-maps/api`. Served via Nginx in production.
* **Backend Core (`server`)**: Node.js, Express, Socket.io (for live chat and state sync), Sequelize ORM.
* **AI Engine (`ai-service`)**: Python FastAPI. Uses Google's Gemini LLM to triage incidents (determine urgency, categorize resources needed, identify potential spam).
* **Database (`db`)**: PostgreSQL with the **PostGIS** extension for handling advanced geospatial queries and geographic boundaries.

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
* [Docker](https://www.docker.com/) and Docker Compose
* Google Maps API Key (with Maps JS API, Places API, and Geocoding enabled)
* Google Gemini API Key

---

## 🚀 Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone <repo-url>
   cd disaster-relief
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory (you can copy `.env.example` if it exists). Provide your live API keys:
   ```env
   # .env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=disaster_secret_2024
   POSTGRES_DB=disasterdb
   
   JWT_SECRET=dev_secret_key_123
   
   # External APIs
   GEMINI_API_KEY=your_gemini_api_key_here
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

3. **Deploy with Docker Compose**
   Build and spin up the entire ecosystem with a single command:
   ```bash
   docker-compose up -d --build
   ```
   *Note: This will build the frontend, the Node backend, the Python AI service, and initialize the PostGIS database. The backend will automatically run migrations and seed default mock users.*

4. **Verify Services**
   - **Frontend (Nginx)**: `http://localhost:3000`
   - **Node.js Backend**: `http://localhost:5000`
   - **FastAPI AI Service**: `http://localhost:8000`
   - **PostGIS DB**: `localhost:5432`

---

## 🔐 Default Test Credentials

The backend automatically seeds a few test accounts during startup for development purposes. Use these to log into the respective portals:

* **Command Operator**: 
  * Email: `command@rescue.in`
  * Password: `RESCUE2024`
* **Responder (NDRF Base)**: 
  * Email: `ndrf1@rescue.in`
  * Password: `RESCUE2024`
* **Citizen (Sample)**: 
  * Email: `citizen@rescue.in`
  * Password: `RESCUE2024`

*(Note: When Command assigns a dynamically fetched Google Places facility to a mission, the system automatically provisions a new responder account linked to that facility.)*

---

## 🛠️ Key Technical Workflows

* **AI Triage**: When a citizen submits a report, the `server` securely forwards the payload to the Python `ai-service`. The AI classifies the severity, constructs a tactical summary, and determines if it's spam. If the AI service is unreachable, a robust failsafe applies deterministic defaults.
* **Geospatial Dynamic Seeding**: When an incident goes live, the backend hooks into the Google Places API to scan a 30km radius for `hospital`, `police`, and `fire_station` entities. It seeds these into PostGIS and relays them to the Command Centre over WebSocket (`facilities.updated`).
* **State Synchronization**: WebSockets (`socket.io`) manage real-time events. `incident.created`, `incident.assigned`, `chat:send`, and `responder.location_updated` ensure all three portals share the exact same tactical reality without requiring page reloads.
