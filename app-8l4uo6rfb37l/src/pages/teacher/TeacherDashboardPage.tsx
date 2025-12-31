import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, TrendingUp, Calendar } from 'lucide-react';
import { getTeacherWithProfile, getStudentsByDepartment, getClassAttendanceStats } from '@/db/api';
import type { TeacherWithProfile } from '@/types/types';

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<TeacherWithProfile | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    overallAttendance: 0,
    assignedSubjects: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const teacherData = await getTeacherWithProfile(user.id);
      if (!teacherData) return;

      setTeacher(teacherData);

      const students = await getStudentsByDepartment(teacherData.department_id);
      const classStats = await getClassAttendanceStats(teacherData.department_id);

      setStats({
        totalStudents: students.length,
        overallAttendance: classStats.overall_percentage,
        assignedSubjects: teacherData.assigned_subjects.length,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {teacher?.profile.full_name}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              In {teacher?.department.name} department
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overallAttendance}%</div>
            <p className="text-xs text-muted-foreground">
              Class average attendance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedSubjects}</div>
            <p className="text-xs text-muted-foreground">
              Subjects you teach
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Department Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Department</p>
            <p className="text-lg font-semibold">{teacher?.department.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Your Subjects</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {teacher?.assigned_subjects.map((subject) => (
                <span
                  key={subject}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <a
              href="/teacher/students"
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Users className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">View Students</h3>
              <p className="text-sm text-muted-foreground">
                See all students in your department
              </p>
            </a>
            <a
              href="/teacher/attendance"
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Mark Attendance</h3>
              <p className="text-sm text-muted-foreground">
                Record student attendance
              </p>
            </a>
            <a
              href="/teacher/analytics"
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">View Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Check attendance statistics
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
