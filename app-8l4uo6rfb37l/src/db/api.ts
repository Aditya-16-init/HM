import { supabase } from './supabase';
import type {
  Profile,
  Department,
  Student,
  Teacher,
  AttendanceRecord,
  StudentWithProfile,
  TeacherWithProfile,
  AttendanceWithStudent,
  StudentRegistrationForm,
  TeacherRegistrationForm,
  SubjectAttendance,
  StudentAttendanceStats,
} from '@/types/types';

// ============ Profile Operations ============

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============ Department Operations ============

export const getDepartments = async (): Promise<Department[]> => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getDepartmentById = async (
  departmentId: string
): Promise<Department | null> => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('id', departmentId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// ============ Student Operations ============

export const createStudent = async (
  studentData: Omit<Student, 'created_at'>
): Promise<Student> => {
  const { data, error } = await supabase
    .from('students')
    .insert(studentData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getStudent = async (userId: string): Promise<Student | null> => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getStudentWithProfile = async (
  userId: string
): Promise<StudentWithProfile | null> => {
  const { data, error } = await supabase
    .from('students')
    .select(
      `
      *,
      profile:profiles!students_id_fkey(*),
      department:departments!students_department_id_fkey(*)
    `
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as StudentWithProfile | null;
};

export const getStudentsByDepartment = async (
  departmentId: string
): Promise<StudentWithProfile[]> => {
  const { data, error } = await supabase
    .from('students')
    .select(
      `
      *,
      profile:profiles!students_id_fkey(*),
      department:departments!students_department_id_fkey(*)
    `
    )
    .eq('department_id', departmentId)
    .order('roll_number');

  if (error) throw error;
  return Array.isArray(data) ? (data as StudentWithProfile[]) : [];
};

// ============ Teacher Operations ============

export const createTeacher = async (
  teacherData: Omit<Teacher, 'created_at'>
): Promise<Teacher> => {
  const { data, error } = await supabase
    .from('teachers')
    .insert(teacherData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getTeacher = async (userId: string): Promise<Teacher | null> => {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getTeacherWithProfile = async (
  userId: string
): Promise<TeacherWithProfile | null> => {
  const { data, error } = await supabase
    .from('teachers')
    .select(
      `
      *,
      profile:profiles!teachers_id_fkey(*),
      department:departments!teachers_department_id_fkey(*)
    `
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as TeacherWithProfile | null;
};

// ============ Attendance Operations ============

export const markAttendance = async (
  attendanceData: Omit<AttendanceRecord, 'id' | 'created_at'>
): Promise<AttendanceRecord> => {
  const { data, error } = await supabase
    .from('attendance_records')
    .upsert(attendanceData, {
      onConflict: 'student_id,subject,date',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const markBulkAttendance = async (
  records: Omit<AttendanceRecord, 'id' | 'created_at'>[]
): Promise<AttendanceRecord[]> => {
  const { data, error } = await supabase
    .from('attendance_records')
    .upsert(records, {
      onConflict: 'student_id,subject,date',
    })
    .select();

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getStudentAttendance = async (
  studentId: string
): Promise<AttendanceRecord[]> => {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getAttendanceBySubject = async (
  studentId: string,
  subject: string
): Promise<AttendanceRecord[]> => {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('student_id', studentId)
    .eq('subject', subject)
    .order('date', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getAttendanceByDate = async (
  departmentId: string,
  subject: string,
  date: string
): Promise<AttendanceWithStudent[]> => {
  const { data, error } = await supabase
    .from('attendance_records')
    .select(
      `
      *,
      student:students!attendance_records_student_id_fkey(
        *,
        profile:profiles!students_id_fkey(*),
        department:departments!students_department_id_fkey(*)
      )
    `
    )
    .eq('subject', subject)
    .eq('date', date)
    .order('created_at');

  if (error) throw error;
  return Array.isArray(data) ? (data as AttendanceWithStudent[]) : [];
};

// ============ Analytics Operations ============

export const getStudentAttendanceStats = async (
  studentId: string
): Promise<StudentAttendanceStats | null> => {
  const student = await getStudentWithProfile(studentId);
  if (!student) return null;

  const attendance = await getStudentAttendance(studentId);

  const subjectWise: SubjectAttendance[] = student.subjects.map((subject) => {
    const subjectRecords = attendance.filter((r) => r.subject === subject);
    const presentCount = subjectRecords.filter(
      (r) => r.status === 'present'
    ).length;
    const absentCount = subjectRecords.filter(
      (r) => r.status === 'absent'
    ).length;
    const totalClasses = subjectRecords.length;
    const percentage =
      totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    return {
      subject,
      total_classes: totalClasses,
      present_count: presentCount,
      absent_count: absentCount,
      percentage,
    };
  });

  const totalClasses = attendance.length;
  const totalPresent = attendance.filter((r) => r.status === 'present').length;
  const totalAbsent = attendance.filter((r) => r.status === 'absent').length;
  const overallPercentage =
    totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

  return {
    student,
    overall_percentage: overallPercentage,
    subject_wise: subjectWise,
    total_classes: totalClasses,
    total_present: totalPresent,
    total_absent: totalAbsent,
  };
};

export const getClassAttendanceStats = async (departmentId: string) => {
  const students = await getStudentsByDepartment(departmentId);
  const department = await getDepartmentById(departmentId);

  if (!department || students.length === 0) {
    return {
      department,
      total_students: 0,
      overall_percentage: 0,
      subject_wise: [],
    };
  }

  // Get all attendance records for students in this department
  const studentIds = students.map((s) => s.id);
  const { data: allAttendance, error } = await supabase
    .from('attendance_records')
    .select('*')
    .in('student_id', studentIds);

  if (error) throw error;

  const attendance = Array.isArray(allAttendance) ? allAttendance : [];

  // Calculate subject-wise stats
  const subjectWise = department.subjects.map((subject) => {
    const subjectRecords = attendance.filter((r) => r.subject === subject);
    const presentCount = subjectRecords.filter(
      (r) => r.status === 'present'
    ).length;
    const totalClasses = subjectRecords.length;
    const percentage =
      totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    return {
      subject,
      percentage,
      total_classes: totalClasses,
    };
  });

  // Calculate overall percentage
  const totalPresent = attendance.filter((r) => r.status === 'present').length;
  const totalClasses = attendance.length;
  const overallPercentage =
    totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

  return {
    department,
    total_students: students.length,
    overall_percentage: overallPercentage,
    subject_wise: subjectWise,
  };
};

// ============ Registration Helper ============

export const registerStudent = async (
  formData: StudentRegistrationForm
): Promise<{ profile: Profile; student: Student }> => {
  // Get department to fetch subjects
  const department = await getDepartmentById(formData.department_id);
  if (!department) throw new Error('Department not found');

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Failed to create user');

  // Create profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: formData.email,
      full_name: formData.full_name,
      role: 'student',
    })
    .select()
    .single();

  if (profileError) throw profileError;

  // Create student record
  const student = await createStudent({
    id: authData.user.id,
    department_id: formData.department_id,
    section: formData.section || null,
    roll_number: formData.roll_number,
    subjects: department.subjects,
  });

  return { profile, student };
};

export const registerTeacher = async (
  formData: TeacherRegistrationForm
): Promise<{ profile: Profile; teacher: Teacher }> => {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Failed to create user');

  // Create profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: formData.email,
      full_name: formData.full_name,
      role: 'teacher',
    })
    .select()
    .single();

  if (profileError) throw profileError;

  // Create teacher record
  const teacher = await createTeacher({
    id: authData.user.id,
    department_id: formData.department_id,
    assigned_subjects: formData.assigned_subjects,
  });

  return { profile, teacher };
};
