-- Create a function to handle student registration that bypasses RLS
CREATE OR REPLACE FUNCTION register_student(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_department_id UUID,
  p_section TEXT,
  p_roll_number TEXT,
  p_subjects TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (p_user_id, p_email, p_full_name, 'student');

  -- Insert student record
  INSERT INTO students (id, department_id, section, roll_number, subjects)
  VALUES (p_user_id, p_department_id, p_section, p_roll_number, p_subjects);

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create a function to handle teacher registration that bypasses RLS
CREATE OR REPLACE FUNCTION register_teacher(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_department_id UUID,
  p_assigned_subjects TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (p_user_id, p_email, p_full_name, 'teacher');

  -- Insert teacher record
  INSERT INTO teachers (id, department_id, assigned_subjects)
  VALUES (p_user_id, p_department_id, p_assigned_subjects);

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create a function to find or create department
CREATE OR REPLACE FUNCTION find_or_create_department(
  p_department_name TEXT,
  p_subjects TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_department_id UUID;
  v_existing_subjects TEXT[];
  v_all_subjects TEXT[];
BEGIN
  -- Try to find existing department (case-insensitive)
  SELECT id, subjects INTO v_department_id, v_existing_subjects
  FROM departments
  WHERE LOWER(name) = LOWER(p_department_name)
  LIMIT 1;

  IF v_department_id IS NOT NULL THEN
    -- Department exists, merge subjects if needed
    v_all_subjects := ARRAY(
      SELECT DISTINCT unnest(v_existing_subjects || p_subjects)
    );
    
    UPDATE departments
    SET subjects = v_all_subjects
    WHERE id = v_department_id;
    
    RETURN v_department_id;
  ELSE
    -- Create new department
    INSERT INTO departments (name, subjects)
    VALUES (p_department_name, p_subjects)
    RETURNING id INTO v_department_id;
    
    RETURN v_department_id;
  END IF;
END;
$$;