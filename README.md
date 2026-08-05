# Paper Maker — School Paper & Results Builder

A Next.js web app for schools to build exam papers, manage students, calculate results and generate report cards. Data is stored in Supabase.

---

## Getting Started

### 1. Environment variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

> Get these from Supabase Dashboard → Settings → API.
> Do **not** commit `.env.local` to git.

### 2. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Other scripts

```bash
npm run build       # production build
npm run lint        # eslint
npm run test        # run unit tests
npm run check       # lint + test + build
```

---

## Database Schema

Tables: `schools`, `profiles`, `exams`, `students`, `results`, `grade_scales`, `papers`, `school_state`

| Table | Purpose |
|-------|---------|
| `schools` | Each registered school (name, plan, logo, theme) |
| `profiles` | User accounts linked to a school (`school_id` NOT NULL) |
| `exams` | Exams created by a school |
| `students` | Students + marks per exam |
| `results` | Calculated results per student |
| `grade_scales` | Grade boundaries per school |
| `papers` | Saved question papers |
| `school_state` | Per-school saved app state (papers/results) |

**Important:** `profiles.school_id` is `NOT NULL` and `ON DELETE CASCADE`. Deleting a school deletes its linked profiles and all related data.

Migrations live in `supabase/migrations/`. Apply them in the Supabase SQL Editor if they were not run automatically.

---

## Supabase SQL Editor — How To

Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project → **SQL Editor** → **New query** → paste the query → **Run**.

All queries below are safe to copy-paste.

---

## VIEW Data (dekhne ke liye)

### All schools with their owner
```sql
SELECT s.name, s.plan, s.created_at,
       (SELECT u.email FROM auth.users u
        JOIN profiles p ON p.id = u.id
        WHERE p.school_id = s.id) AS owner
FROM schools s
ORDER BY s.created_at DESC;
```

### All profiles (accounts)
```sql
SELECT p.id, p.email, p.name, p.role, p.super_admin,
       s.name AS school, p.created_at
FROM profiles p
LEFT JOIN schools s ON s.id = p.school_id
ORDER BY p.created_at DESC;
```

### Everything — all tables at once
```sql
SELECT 'schools' AS table_name, COUNT(*) AS rows FROM schools
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL SELECT 'exams', COUNT(*) FROM exams
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'results', COUNT(*) FROM results
UNION ALL SELECT 'grade_scales', COUNT(*) FROM grade_scales
UNION ALL SELECT 'papers', COUNT(*) FROM papers
UNION ALL SELECT 'school_state', COUNT(*) FROM school_state;
```

### Which school is linked to a specific email
```sql
SELECT u.email, s.id AS school_id, s.name AS school_name, s.created_at
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN schools s ON s.id = p.school_id
WHERE u.email = 'sehrkhan873@gmail.com';   -- email change karo
```

### Schools that have NO profile linked (safe to delete)
```sql
SELECT s.id, s.name, s.created_at
FROM schools s
LEFT JOIN profiles p ON p.school_id = s.id
WHERE p.id IS NULL;
```

### Exams / Students / Results of one school
```sql
SELECT e.name AS exam, e.class_name, e.date, e.created_at
FROM exams e
WHERE e.school_id = '<school_id>';
```
```sql
SELECT e.name AS exam, st.roll_no, st.student_name, st.subject_marks
FROM students st
JOIN exams e ON e.id = st.exam_id
WHERE e.school_id = '<school_id>';
```

---

## DELETE Data (remove karne ke liye)

> ⚠️ These are **permanent**. No undo. Back up first if unsure.

### Delete ONE school by name (only if not linked to your profile)
```sql
DELETE FROM schools WHERE name = 'Test School Name';
```

### Delete one school by ID
```sql
DELETE FROM schools WHERE id = '<school_id>';
```

### Delete ALL schools except the one linked to a specific email
```sql
DELETE FROM schools
WHERE id NOT IN (
  SELECT p.school_id
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'sehrkhan873@gmail.com'
);
```

### Delete only schools with NO linked profile (safe)
```sql
DELETE FROM schools
WHERE id IN (
  SELECT s.id
  FROM schools s
  LEFT JOIN profiles p ON p.school_id = s.id
  WHERE p.id IS NULL
);
```

### Clear all exams of a school
```sql
DELETE FROM exams WHERE school_id = '<school_id>';
```

### Clear all students of a school
```sql
DELETE FROM students WHERE school_id = '<school_id>';
```

### Clear all results of a school
```sql
DELETE FROM results WHERE school_id = '<school_id>';
```

### Clear saved papers of a school
```sql
DELETE FROM papers WHERE school_id = '<school_id>';
```

### Reset a school's saved state
```sql
DELETE FROM school_state WHERE school_id = '<school_id>';
```

### Delete a user's account (auth user + profile + school)
```sql
DELETE FROM auth.users WHERE email = 'someuser@example.com';
```
> This cascades to their profile and school.

### Delete ALL data (empty every table — schools stay)
```sql
DELETE FROM school_state;
DELETE FROM papers;
DELETE FROM grade_scales;
DELETE FROM results;
DELETE FROM students;
DELETE FROM exams;
```

---

## Admin & Fixes

### Make a user super admin (see School Overview)
```sql
UPDATE profiles SET super_admin = true WHERE email = 'sehrkhan873@gmail.com';
```

### Add missing `plan` column (if 400 PGRST204 error)
```sql
ALTER TABLE schools ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'full';
ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_plan_check;
ALTER TABLE schools ADD CONSTRAINT schools_plan_check CHECK (plan IN ('paper', 'results', 'full'));
```

### Reload schema cache (new columns visible immediately)
```sql
NOTIFY pgrst, 'reload schema';
```

### Reinstall auto signup trigger (new users get school+profile automatically)
```sql
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
```

### Backfill profiles for users who signed up before the trigger existed
```sql
INSERT INTO schools (name, plan)
SELECT COALESCE(raw_user_meta_data->>'name', 'My School'),
       COALESCE(raw_user_meta_data->>'plan', 'full')
FROM auth.users;

INSERT INTO profiles (id, school_id, email, name, role)
SELECT u.id,
       (SELECT id FROM schools
        WHERE name = COALESCE(u.raw_user_meta_data->>'name', 'My School')
        ORDER BY created_at DESC LIMIT 1),
       u.email,
       COALESCE(u.raw_user_meta_data->>'name', ''),
       'admin'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `406 Not Acceptable` (profiles query) | User has no profile row | Run backfill query, or sign up again |
| `400 PGRST204: Could not find the 'plan' column` | Old schema | Run `ALTER TABLE schools ADD COLUMN plan...` + reload schema |
| `403` on school insert | RLS blocks | Must be logged in (authenticated role) |
| Wrong Supabase errors | Bad `.env.local` | Check URL + anon key in Settings → API |

---

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- React 19 + Tailwind CSS
- Supabase (Auth, Postgres, PostgREST)
- docx / docxtemplater / jsPDF / xlsx (paper & result generation)
