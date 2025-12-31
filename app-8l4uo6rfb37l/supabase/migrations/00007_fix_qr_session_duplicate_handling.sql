-- Drop and recreate the create_qr_session function with better duplicate handling
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
  v_is_active BOOLEAN;
BEGIN
  -- Check if ANY session already exists for this teacher/subject/date (active or inactive)
  SELECT id, qr_token, is_active INTO v_session_id, v_qr_token, v_is_active
  FROM qr_attendance_sessions
  WHERE teacher_id = p_teacher_id
    AND subject = p_subject
    AND date = p_date
  LIMIT 1;

  IF v_session_id IS NOT NULL THEN
    -- If session exists but is inactive, reactivate it
    IF NOT v_is_active THEN
      v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;
      
      UPDATE qr_attendance_sessions
      SET is_active = true,
          expires_at = v_expires_at
      WHERE id = v_session_id;
      
      RETURN json_build_object(
        'success', true,
        'session_id', v_session_id,
        'qr_token', v_qr_token,
        'message', 'Session reactivated'
      );
    END IF;
    
    -- Return existing active session
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