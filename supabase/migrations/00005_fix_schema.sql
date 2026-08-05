-- 00005: Fix missing schema for new signups (apply in Supabase SQL Editor)

-- 1) Add missing 'plan' column to schools
ALTER TABLE schools ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'full';
ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_plan_check;
ALTER TABLE schools ADD CONSTRAINT schools_plan_check CHECK (plan IN ('paper', 'results', 'full'));

-- 2) Ensure profiles has super_admin column (for admin dashboard)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS super_admin BOOLEAN DEFAULT false;
UPDATE profiles SET super_admin = true WHERE email = 'sehrkhan873@gmail.com';

-- 3) Install signup trigger so every new auth user gets school + profile auto-created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_school_id UUID;
  user_plan TEXT;
BEGIN
  user_plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'full');

  INSERT INTO public.schools (name, plan) VALUES ('My School', user_plan)
  RETURNING id INTO new_school_id;

  INSERT INTO public.profiles (id, school_id, email, name, role)
  VALUES (NEW.id, new_school_id, NEW.email, NEW.raw_user_meta_data->>'name', 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) Reload PostgREST schema cache so new columns are visible immediately
NOTIFY pgrst, 'reload schema';
