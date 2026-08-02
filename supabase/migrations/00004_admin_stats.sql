-- Super admin access for school overview (owner usage dashboard)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS super_admin BOOLEAN DEFAULT false;

UPDATE profiles SET super_admin = true WHERE email = 'sehrkhan873@gmail.com';

-- Ensure school_state exists (idempotent, in case 00003 wasn't run)
CREATE TABLE IF NOT EXISTS school_state (
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE PRIMARY KEY,
  paper_state JSONB DEFAULT 'null',
  result_state JSONB DEFAULT 'null',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE school_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can view own school state" ON school_state;
CREATE POLICY "users can view own school state" ON school_state
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "users can insert own school state" ON school_state;
CREATE POLICY "users can insert own school state" ON school_state
  FOR INSERT WITH CHECK (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "users can update own school state" ON school_state;
CREATE POLICY "users can update own school state" ON school_state
  FOR UPDATE USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

-- Admin stats function: only super admins can call it
CREATE OR REPLACE FUNCTION public.get_admin_school_stats()
RETURNS TABLE (
  school_id UUID,
  name TEXT,
  plan TEXT,
  created_at TIMESTAMPTZ,
  exam_count BIGINT,
  student_count BIGINT,
  paper_count BIGINT,
  last_active TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND COALESCE(super_admin, false) = true
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  RETURN QUERY
  SELECT
    s.id AS school_id,
    s.name,
    s.plan,
    s.created_at,
    (SELECT COUNT(*)::BIGINT FROM exams e WHERE e.school_id = s.id) AS exam_count,
    (SELECT COUNT(*)::BIGINT FROM students st JOIN exams e ON e.id = st.exam_id WHERE e.school_id = s.id) AS student_count,
    (SELECT COUNT(*)::BIGINT FROM papers p WHERE p.school_id = s.id) AS paper_count,
    (SELECT MAX(updated_at) FROM school_state ss WHERE ss.school_id = s.id) AS last_active
  FROM schools s
  ORDER BY s.created_at DESC;
END;
$$;
