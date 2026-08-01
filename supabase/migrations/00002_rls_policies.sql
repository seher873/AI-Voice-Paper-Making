-- RLS Policies with DROP IF EXISTS for idempotent re-runs

-- Schools
DROP POLICY IF EXISTS "users can update own school" ON schools;
CREATE POLICY "users can update own school" ON schools
  FOR UPDATE USING (id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users can delete own school" ON schools;
CREATE POLICY "users can delete own school" ON schools
  FOR DELETE USING (id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

-- Profiles
DROP POLICY IF EXISTS "users can update own profile" ON profiles;
CREATE POLICY "users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Results
DROP POLICY IF EXISTS "users can update own school results" ON results;
CREATE POLICY "users can update own school results" ON results
  FOR UPDATE USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

-- Grade Scales
DROP POLICY IF EXISTS "users can insert own school grade_scales" ON grade_scales;
CREATE POLICY "users can insert own school grade_scales" ON grade_scales
  FOR INSERT WITH CHECK (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users can update own school grade_scales" ON grade_scales;
CREATE POLICY "users can update own school grade_scales" ON grade_scales
  FOR UPDATE USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users can delete own school grade_scales" ON grade_scales;
CREATE POLICY "users can delete own school grade_scales" ON grade_scales
  FOR DELETE USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

-- Papers
DROP POLICY IF EXISTS "users can update own school papers" ON papers;
CREATE POLICY "users can update own school papers" ON papers
  FOR UPDATE USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users can delete own school papers" ON papers;
CREATE POLICY "users can delete own school papers" ON papers
  FOR DELETE USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));
