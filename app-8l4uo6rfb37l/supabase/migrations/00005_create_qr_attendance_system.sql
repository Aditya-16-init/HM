-- Create QR attendance sessions table
CREATE TABLE qr_attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  qr_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_teacher_subject_date UNIQUE (teacher_id, subject, date)
);

-- Create index for faster lookups
CREATE INDEX idx_qr_sessions_token ON qr_attendance_sessions(qr_token);
CREATE INDEX idx_qr_sessions_teacher ON qr_attendance_sessions(teacher_id);
CREATE INDEX idx_qr_sessions_active ON qr_attendance_sessions(is_active);

-- RLS Policies for qr_attendance_sessions
ALTER TABLE qr_attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Teachers can create and manage their own QR sessions
CREATE POLICY "Teachers can create their own QR sessions" ON qr_attendance_sessions
  FOR INSERT TO authenticated 
  WITH CHECK (is_teacher(auth.uid()) AND teacher_id = auth.uid());

CREATE POLICY "Teachers can view their own QR sessions" ON qr_attendance_sessions
  FOR SELECT TO authenticated 
  USING (is_teacher(auth.uid()) AND teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own QR sessions" ON qr_attendance_sessions
  FOR UPDATE TO authenticated 
  USING (is_teacher(auth.uid()) AND teacher_id = auth.uid())
  WITH CHECK (is_teacher(auth.uid()) AND teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own QR sessions" ON qr_attendance_sessions
  FOR DELETE TO authenticated 
  USING (is_teacher(auth.uid()) AND teacher_id = auth.uid());

-- Students can view active QR sessions (for validation)
CREATE POLICY "Students can view active QR sessions" ON qr_attendance_sessions
  FOR SELECT TO authenticated 
  USING (is_active = true);

-- Function to generate QR token
CREATE OR REPLACE FUNCTION generate_qr_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;

-- Function to create or get QR session
CREATE OR REPLACE FUNCTION create_qr_session(
  p_teacher_id UUID,
  p_subject TEXT,
  p_date DATE DEFAULT CURRENT_DATE,
  p_expires_hours INTEGER DEFAULT 24
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_qr_token TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if session already exists for today
  SELECT id, qr_token INTO v_session_id, v_qr_token
  FROM qr_attendance_sessions
  WHERE teacher_id = p_teacher_id
    AND subject = p_subject
    AND date = p_date
    AND is_active = true;

  IF v_session_id IS NOT NULL THEN
    -- Return existing session
    RETURN json_build_object(
      'success', true,
      'session_id', v_session_id,
      'qr_token', v_qr_token,
      'message', 'Existing session found'
    );
  END IF;

  -- Generate new token and expiry
  v_qr_token := generate_qr_token();
  v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;

  -- Create new session
  INSERT INTO qr_attendance_sessions (
    teacher_id,
    subject,
    date,
    qr_token,
    is_active,
    expires_at
  ) VALUES (
    p_teacher_id,
    p_subject,
    p_date,
    v_qr_token,
    true,
    v_expires_at
  )
  RETURNING id INTO v_session_id;

  RETURN json_build_object(
    'success', true,
    'session_id', v_session_id,
    'qr_token', v_qr_token,
    'message', 'New session created'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Function to mark attendance via QR scan
CREATE OR REPLACE FUNCTION mark_attendance_via_qr(
  p_student_id UUID,
  p_qr_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_student RECORD;
  v_attendance_id UUID;
BEGIN
  -- Get QR session details
  SELECT * INTO v_session
  FROM qr_attendance_sessions
  WHERE qr_token = p_qr_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_session IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired QR code'
    );
  END IF;

  -- Get student details
  SELECT s.*, t.department_id as teacher_dept
  FROM students s
  JOIN teachers t ON t.id = v_session.teacher_id
  WHERE s.id = p_student_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Student not found'
    );
  END IF;

  -- Get student and teacher department
  SELECT s.department_id, t.department_id as teacher_dept
  INTO v_student
  FROM students s
  CROSS JOIN teachers t
  WHERE s.id = p_student_id
    AND t.id = v_session.teacher_id;

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
    AND subject = v_session.subject
    AND date = v_session.date;

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
    v_session.subject,
    v_session.date,
    'present',
    v_session.teacher_id
  )
  RETURNING id INTO v_attendance_id;

  RETURN json_build_object(
    'success', true,
    'attendance_id', v_attendance_id,
    'subject', v_session.subject,
    'date', v_session.date,
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