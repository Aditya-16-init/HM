-- Create user_role enum
CREATE TYPE public.user_role AS ENUM ('student', 'teacher');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create departments table with default subjects
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subjects TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default departments with subjects
INSERT INTO public.departments (name, subjects) VALUES
  ('AIML', ARRAY['Machine Learning', 'Operating Systems', 'Computer Organization', 'Mathematics', 'English']),
  ('CSE', ARRAY['Data Structures', 'Algorithms', 'Database Systems', 'Mathematics', 'English']),
  ('ECE', ARRAY['Digital Electronics', 'Signals and Systems', 'Communication Systems', 'Mathematics', 'English']),
  ('MECH', ARRAY['Thermodynamics', 'Fluid Mechanics', 'Manufacturing Processes', 'Mathematics', 'English']),
  ('CIVIL', ARRAY['Structural Analysis', 'Surveying', 'Concrete Technology', 'Mathematics', 'English']);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id),
  section TEXT,
  roll_number TEXT NOT NULL UNIQUE,
  subjects TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id),
  assigned_subjects TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  marked_by UUID NOT NULL REFERENCES public.teachers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject, date)
);

-- Create helper function to check if user is teacher
CREATE OR REPLACE FUNCTION is_teacher(uid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'teacher'::user_role
  );
$$;

-- Create helper function to get teacher's department
CREATE OR REPLACE FUNCTION get_teacher_department(uid UUID)
RETURNS UUID LANGUAGE sql SECURITY DEFINER AS $$
  SELECT department_id FROM teachers WHERE id = uid;
$$;

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Teachers can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (is_teacher(auth.uid()));

-- RLS Policies for departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view departments" ON departments
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own record" ON students
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Teachers can view students in their department" ON students
  FOR SELECT TO authenticated USING (
    is_teacher(auth.uid()) AND department_id = get_teacher_department(auth.uid())
  );

CREATE POLICY "Students can insert their own record" ON students
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own record" ON teachers
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Teachers can insert their own record" ON teachers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for attendance_records
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own attendance" ON attendance_records
  FOR SELECT TO authenticated USING (student_id IN (SELECT id FROM students WHERE id = auth.uid()));

CREATE POLICY "Teachers can view attendance for their department students" ON attendance_records
  FOR SELECT TO authenticated USING (
    is_teacher(auth.uid()) AND 
    student_id IN (
      SELECT s.id FROM students s 
      WHERE s.department_id = get_teacher_department(auth.uid())
    )
  );

CREATE POLICY "Teachers can insert attendance records" ON attendance_records
  FOR INSERT TO authenticated WITH CHECK (
    is_teacher(auth.uid()) AND marked_by = auth.uid()
  );

CREATE POLICY "Teachers can update attendance records they marked" ON attendance_records
  FOR UPDATE TO authenticated USING (marked_by = auth.uid())
  WITH CHECK (marked_by = auth.uid());

-- Create trigger function to sync auth users to profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Profile will be created by the application after registration
  -- This trigger is just a placeholder for future enhancements
  RETURN NEW;
END;
$$;

-- Create trigger (placeholder for now, actual profile creation happens in app)
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_students_department ON students(department_id);
CREATE INDEX idx_students_roll_number ON students(roll_number);
CREATE INDEX idx_teachers_department ON teachers(department_id);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_subject ON attendance_records(subject);