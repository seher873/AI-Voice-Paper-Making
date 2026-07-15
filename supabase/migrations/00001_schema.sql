-- Schools
CREATE TABLE IF NOT EXISTS schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  logo TEXT DEFAULT '',
  theme_colors JSONB DEFAULT '{"primary":"#4f46e5","accent":"#10b981","text":"#1e293b","highlight":"#f59e0b"}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles linked to auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exams
CREATE TABLE IF NOT EXISTS exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  session TEXT DEFAULT '',
  class_name TEXT DEFAULT '',
  section TEXT DEFAULT '',
  date TEXT DEFAULT '',
  exam_type TEXT DEFAULT '',
  subjects JSONB DEFAULT '[]',
  assessment_config JSONB DEFAULT 'null',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Students (marks entry)
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  roll_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  subject_marks JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Results (calculated)
CREATE TABLE IF NOT EXISTS results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  roll_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  total_obtained NUMERIC DEFAULT 0,
  total_marks NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  grade TEXT DEFAULT '',
  remark TEXT DEFAULT '',
  passed BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Grade scales
CREATE TABLE IF NOT EXISTS grade_scales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  grade TEXT NOT NULL,
  min_percent NUMERIC NOT NULL,
  max_percent NUMERIC NOT NULL,
  points NUMERIC DEFAULT 0
);

-- Paper maker saved papers
CREATE TABLE IF NOT EXISTS papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Schools: authenticated users can create, view their own
CREATE POLICY "users can insert schools" ON schools
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "users can view own school" ON schools
  FOR SELECT USING (
    id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

-- Profiles: users can create their own, view their own
CREATE POLICY "users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid() OR id::text = auth.email());

CREATE POLICY "users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid() OR id::text = auth.email());

CREATE POLICY "users can view own school exams" ON exams
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users can insert own school exams" ON exams
  FOR INSERT WITH CHECK (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users can update own school exams" ON exams
  FOR UPDATE USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users can delete own school exams" ON exams
  FOR DELETE USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users can view own school students" ON students
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users can insert own school students" ON students
  FOR INSERT WITH CHECK (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users can update own school students" ON students
  FOR UPDATE USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users can delete own school students" ON students
  FOR DELETE USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users can view own school results" ON results
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users can insert own school results" ON results
  FOR INSERT WITH CHECK (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users can delete own school results" ON results
  FOR DELETE USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users can view own school grade_scales" ON grade_scales
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users can view own school papers" ON papers
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "users can insert own school papers" ON papers
  FOR INSERT WITH CHECK (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_school_id UUID;
BEGIN
  -- Create a school for the new user
  INSERT INTO public.schools (name) VALUES ('My School')
  RETURNING id INTO new_school_id;

  -- Create profile linked to auth user
  INSERT INTO public.profiles (id, school_id, email, name, role)
  VALUES (NEW.id, new_school_id, NEW.email, NEW.raw_user_meta_data->>'name', 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
