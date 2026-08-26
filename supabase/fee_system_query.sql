-- Fee System — Clean Query (Supabase SQL Editor)

-- 1. Fee Structures
CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  class_name TEXT NOT NULL DEFAULT '',
  fee_type TEXT DEFAULT 'monthly' CHECK (fee_type IN ('monthly', 'quarterly', 'annual', 'other')),
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Student Fees
CREATE TABLE IF NOT EXISTS student_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL DEFAULT '',
  father_name TEXT DEFAULT '',
  class_name TEXT NOT NULL DEFAULT '',
  section TEXT DEFAULT '',
  roll_no TEXT DEFAULT '',
  parent_phone TEXT DEFAULT '',
  fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE SET NULL,
  monthly_fee NUMERIC DEFAULT 0,
  session TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Fee Payments
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  student_fee_id UUID REFERENCES student_fees(id) ON DELETE CASCADE NOT NULL,
  month_label TEXT NOT NULL DEFAULT '',
  month_year TEXT NOT NULL DEFAULT '',
  amount_due NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'due' CHECK (status IN ('paid', 'partial', 'due')),
  payment_date TEXT DEFAULT '',
  received_by TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Super Admin Column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS super_admin BOOLEAN DEFAULT false;

-- 5. Enable RLS
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: fee_structures
DROP POLICY IF EXISTS "users can view own school fee_structures" ON fee_structures;
CREATE POLICY "users can view own school fee_structures" ON fee_structures FOR SELECT USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users can insert own school fee_structures" ON fee_structures;
CREATE POLICY "users can insert own school fee_structures" ON fee_structures FOR INSERT WITH CHECK (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users can update own school fee_structures" ON fee_structures;
CREATE POLICY "users can update own school fee_structures" ON fee_structures FOR UPDATE USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users can delete own school fee_structures" ON fee_structures;
CREATE POLICY "users can delete own school fee_structures" ON fee_structures FOR DELETE USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

-- 7. RLS Policies: student_fees
DROP POLICY IF EXISTS "users can view own school student_fees" ON student_fees;
CREATE POLICY "users can view own school student_fees" ON student_fees FOR SELECT USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users can insert own school student_fees" ON student_fees;
CREATE POLICY "users can insert own school student_fees" ON student_fees FOR INSERT WITH CHECK (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users can update own school student_fees" ON student_fees;
CREATE POLICY "users can update own school student_fees" ON student_fees FOR UPDATE USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users can delete own school student_fees" ON student_fees;
CREATE POLICY "users can delete own school student_fees" ON student_fees FOR DELETE USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

-- 8. RLS Policies: fee_payments
DROP POLICY IF EXISTS "users can view own school fee_payments" ON fee_payments;
CREATE POLICY "users can view own school fee_payments" ON fee_payments FOR SELECT USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users can insert own school fee_payments" ON fee_payments;
CREATE POLICY "users can insert own school fee_payments" ON fee_payments FOR INSERT WITH CHECK (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users can update own school fee_payments" ON fee_payments;
CREATE POLICY "users can update own school fee_payments" ON fee_payments FOR UPDATE USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "users can delete own school fee_payments" ON fee_payments;
CREATE POLICY "users can delete own school fee_payments" ON fee_payments FOR DELETE USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));
