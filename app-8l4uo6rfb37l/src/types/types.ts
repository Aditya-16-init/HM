// Database types matching Supabase schema

export type UserRole = 'student' | 'teacher';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  subjects: string[];
  created_at: string;
}

export interface Student {
  id: string;
  department_id: string;
  section: string | null;
  roll_number: string;
  subjects: string[];
  created_at: string;
}

export interface Teacher {
  id: string;
  department_id: string;
  assigned_subjects: string[];
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  subject: string;
  date: string;
  status: 'present' | 'absent';
  marked_by: string;
  created_at: string;
}

// Extended types with joined data
export interface StudentWithProfile extends Student {
  profile: Profile;
  department: Department;
}

export interface TeacherWithProfile extends Teacher {
  profile: Profile;
  department: Department;
}

export interface AttendanceWithStudent extends AttendanceRecord {
  student: StudentWithProfile;
}

// Form types
export interface StudentRegistrationForm {
  full_name: string;
  email: string;
  password: string;
  department_id: string;
  section?: string;
  roll_number: string;
}

export interface TeacherRegistrationForm {
  full_name: string;
  email: string;
  password: string;
  department_id: string;
  assigned_subjects: string[];
}

export interface LoginForm {
  email: string;
  password: string;
  role: UserRole;
}

export interface AttendanceMarkingForm {
  subject: string;
  date: string;
  attendance: {
    student_id: string;
    status: 'present' | 'absent';
  }[];
}

// Analytics types
export interface SubjectAttendance {
  subject: string;
  total_classes: number;
  present_count: number;
  absent_count: number;
  percentage: number;
}

export interface StudentAttendanceStats {
  student: StudentWithProfile;
  overall_percentage: number;
  subject_wise: SubjectAttendance[];
  total_classes: number;
  total_present: number;
  total_absent: number;
}

export interface ClassAttendanceStats {
  department: Department;
  total_students: number;
  overall_percentage: number;
  subject_wise: {
    subject: string;
    percentage: number;
    total_classes: number;
  }[];
}
