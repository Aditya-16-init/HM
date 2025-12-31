-- Create OTP attendance codes table
CREATE TABLE otp_attendance_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_teacher_subject_active UNIQUE (teacher_id, subject, is_active)
);

-- Create index for faster lookups
CREATE INDEX idx_otp_codes_teacher ON otp_attendance_codes(teacher_id);
CREATE INDEX idx_otp_codes_otp ON otp_attendance_codes(otp_code);
CREATE INDEX idx_otp_codes_active ON otp_attendance_codes(is_active);
CREATE INDEX idx_otp_codes_expires ON otp_attendance_codes(expires_at);

-- RLS Policies for otp_attendance_codes
ALTER TABLE otp_attendance_codes ENABLE ROW LEVEL SECURITY;

-- Teachers can create and manage their own OTP codes
CREATE POLICY "Teachers can create their own OTP codes" ON otp_attendance_codes
  FOR INSERT TO authenticated 
  WITH CHECK (is_teacher(auth.uid()) AND teacher_id = auth.uid());

CREATE POLICY "Teachers can view their own OTP codes" ON otp_attendance_codes
  FOR SELECT TO authenticated 
  USING (is_teacher(auth.uid()) AND teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own OTP codes" ON otp_attendance_codes
  FOR UPDATE TO authenticated 
  USING (is_teacher(auth.uid()) AND teacher_id = auth.uid())
  WITH CHECK (is_teacher(auth.uid()) AND teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own OTP codes" ON otp_attendance_codes
  FOR DELETE TO authenticated 
  USING (is_teacher(auth.uid()) AND teacher_id = auth.uid());

-- Students can view active OTP codes (for validation)
CREATE POLICY "Students can view active OTP codes" ON otp_attendance_codes
  FOR SELECT TO authenticated 
  USING (is_active = true AND expires_at > NOW());

-- Function to generate 6-digit OTP
CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;

-- Function to create OTP attendance code
CREATE OR REPLACE FUNCTION create_otp_attendance_code(
  p_teacher_id UUID,
  p_subject TEXT,
  p_validity_minutes INTEGER DEFAULT 2
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_id UUID;
  v_otp_code TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Deactivate any existing active OTP for this teacher/subject
  UPDATE otp_attendance_codes
  SET is_active = false
  WHERE teacher_id = p_teacher_id
    AND subject = p_subject
    AND is_active = true;

  -- Generate new OTP code
  v_otp_code := generate_otp_code();
  v_expires_at := NOW() + (p_validity_minutes || ' minutes')::INTERVAL;

  -- Create new OTP code
  INSERT INTO otp_attendance_codes (
    teacher_id,
    subject,
    otp_code,
    expires_at,
    is_active
  ) VALUES (
    p_teacher_id,
    p_subject,
    v_otp_code,
    v_expires_at,
    true
  )
  RETURNING id INTO v_code_id;

  RETURN json_build_object(
    'success', true,
    'code_id', v_code_id,
    'otp_code', v_otp_code,
    'expires_at', v_expires_at,
    'message', 'OTP code generated successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Function to mark attendance via OTP
CREATE OR REPLACE FUNCTION mark_attendance_via_otp(
  p_student_id UUID,
  p_otp_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_otp_record RECORD;
  v_student RECORD;
  v_attendance_id UUID;
BEGIN
  -- Get OTP code details
  SELECT * INTO v_otp_record
  FROM otp_attendance_codes
  WHERE otp_code = p_otp_code
    AND is_active = true
    AND expires_at > NOW();

  IF v_otp_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired OTP code'
    );
  END IF;

  -- Get student and teacher department
  SELECT s.department_id, t.department_id as teacher_dept
  INTO v_student
  FROM students s
  CROSS JOIN teachers t
  WHERE s.id = p_student_id
    AND t.id = v_otp_record.teacher_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Student not found'
    );
  END IF;

  -- Verify student is in the same department
  IF v_student.department_id != v_student.teacher_dept THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You are not enrolled in this department'
    );
  END IF;

  -- Check if attendance already marked
  SELECT id INTO v_attendance_id
  FROM attendance_records
  WHERE student_id = p_student_id
    AND subject = v_otp_record.subject
    AND date = CURRENT_DATE;

  IF v_attendance_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Attendance already marked for this subject today'
    );
  END IF;

  -- Mark attendance as present
  INSERT INTO attendance_records (
    student_id,
    subject,
    date,
    status,
    marked_by
  ) VALUES (
    p_student_id,
    v_otp_record.subject,
    CURRENT_DATE,
    'present',
    v_otp_record.teacher_id
  )
  RETURNING id INTO v_attendance_id;

  RETURN json_build_object(
    'success', true,
    'attendance_id', v_attendance_id,
    'subject', v_otp_record.subject,
    'date', CURRENT_DATE,
    'message', 'Attendance marked successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;