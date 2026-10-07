CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL DEFAULT 'CITIZEN',
  phone VARCHAR(255),
  force_id VARCHAR(255),
  unit_name VARCHAR(255),
  skills TEXT[],
  is_available BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  last_location GEOMETRY(Point, 4326),
  total_missions INTEGER DEFAULT 0,
  total_saves INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0.0,
  state VARCHAR(255),
  vehicle_type VARCHAR(255),
  handled_cases INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255),
  type VARCHAR(30) NOT NULL,
  severity VARCHAR(10) NOT NULL,
  description TEXT,
  people_affected INTEGER DEFAULT 1,
  location GEOMETRY(Point, 4326) NOT NULL,
  address TEXT,
  state VARCHAR(50),
  status VARCHAR(20) DEFAULT 'OPEN',
  reporter_id UUID REFERENCES users(id),
  assigned_to UUID[] DEFAULT '{}',
  assigned_unit VARCHAR(100),
  ai_urgency VARCHAR(10),
  ai_summary TEXT,
  ai_resources TEXT[],
  eta_minutes INTEGER,
  people_saved INTEGER DEFAULT 0,
  help_received_early BOOLEAN DEFAULT false,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(last_location);

CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  location GEOMETRY(Point, 4326),
  address TEXT,
  state VARCHAR(50),
  lat NUMERIC,
  lng NUMERIC,
  is_available BOOLEAN DEFAULT true,
  contact VARCHAR(255),
  personnel INTEGER DEFAULT 8,
  vehicle_type VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id),
  sender_id UUID,
  sender_name VARCHAR(255),
  sender_role VARCHAR(255),
  text TEXT,
  channel VARCHAR(255) DEFAULT 'GENERAL',
  is_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id),
  responder_id UUID NOT NULL REFERENCES users(id),
  force_id VARCHAR(50),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  people_saved INTEGER DEFAULT 0,
  resources_used TEXT[] DEFAULT '{}',
  notes TEXT,
  status VARCHAR(15) DEFAULT 'ASSIGNED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_incident_id ON assignments(incident_id);
CREATE INDEX IF NOT EXISTS idx_assignments_responder_id ON assignments(responder_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
