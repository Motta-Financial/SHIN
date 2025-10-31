-- Create comprehensive SEED program database schema

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  university_id TEXT UNIQUE,
  clinic TEXT NOT NULL,
  is_team_leader BOOLEAN DEFAULT false,
  client_team TEXT,
  education TEXT,
  academic_level TEXT,
  business_experience TEXT,
  linkedin_profile TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Directors table
CREATE TABLE IF NOT EXISTS directors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  clinic TEXT NOT NULL,
  job_title TEXT,
  role TEXT DEFAULT 'Clinic Director',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  contact_name TEXT,
  email TEXT,
  website TEXT,
  primary_director_id UUID REFERENCES directors(id),
  alumni_mentor TEXT,
  project_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client assignments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  clinic TEXT NOT NULL,
  role TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, student_id)
);

-- Client director mapping table
CREATE TABLE IF NOT EXISTS client_directors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  director_id UUID REFERENCES directors(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, director_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_clinic ON students(clinic);
CREATE INDEX IF NOT EXISTS idx_students_client_team ON students(client_team);
CREATE INDEX IF NOT EXISTS idx_directors_email ON directors(email);
CREATE INDEX IF NOT EXISTS idx_directors_clinic ON directors(clinic);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_client_assignments_client ON client_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_student ON client_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_client_directors_client ON client_directors(client_id);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_directors ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
CREATE POLICY "Allow public read access to students" ON students FOR SELECT USING (true);
CREATE POLICY "Allow public read access to directors" ON directors FOR SELECT USING (true);
CREATE POLICY "Allow public read access to clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow public read access to client_assignments" ON client_assignments FOR SELECT USING (true);
CREATE POLICY "Allow public read access to client_directors" ON client_directors FOR SELECT USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_directors_updated_at BEFORE UPDATE ON directors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
