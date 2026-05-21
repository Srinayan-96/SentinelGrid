CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('CITIZEN','RESPONDER','ADMIN')),
  phone VARCHAR(20),
  force_id VARCHAR(50),
  unit_name VARCHAR(100),
  skills TEXT[],
  is_available BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  location GEOMETRY(Point,4326),
  total_missions INTEGER DEFAULT 0,
  total_saves INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN (
    'FLOOD','FIRE','EARTHQUAKE','MEDICAL',
    'RESCUE','SHELTER','FOOD','OTHER'
  )),
  urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('CRITICAL','HIGH','MODERATE')),
  status VARCHAR(15) DEFAULT 'OPEN' CHECK (status IN (
    'OPEN','ASSIGNED','IN_PROGRESS','RESOLVED','FALSE_ALARM'
  )),
  location GEOMETRY(Point,4326) NOT NULL,
  address TEXT,
  landmark TEXT,
  photo_url TEXT,
  reporter_id UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  force_id VARCHAR(50),
  ai_urgency VARCHAR(10),
  ai_category VARCHAR(30),
  ai_spam_score NUMERIC(4,3),
  ai_resources_needed TEXT[],
  ai_summary TEXT,
  people_reported INTEGER DEFAULT 0,
  people_saved INTEGER DEFAULT 0,
  resources_deployed TEXT[],
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_location
  ON incidents USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_incidents_status
  ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_urgency
  ON incidents(urgency);
CREATE INDEX IF NOT EXISTS idx_users_location
  ON users USING GIST(location);

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id),
  responder_id UUID REFERENCES users(id),
  force_id VARCHAR(50),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  people_saved INTEGER DEFAULT 0,
  resources_used TEXT[],
  notes TEXT,
  status VARCHAR(15) DEFAULT 'ASSIGNED'
);

CREATE TABLE IF NOT EXISTS incident_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  old_status VARCHAR(15),
  new_status VARCHAR(15),
  note TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS situation_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone VARCHAR(100),
  report_text TEXT NOT NULL,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id),
  rater_id UUID REFERENCES users(id),
  responder_id UUID REFERENCES users(id),
  score INTEGER CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
