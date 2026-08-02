-- Per-school persisted state (papers + results) so each school sees its own data
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
