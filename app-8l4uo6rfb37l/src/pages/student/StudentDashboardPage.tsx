import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { getStudentWithProfile, getStudentAttendanceStats } from '@/db/api';
import type { StudentWithProfile, StudentAttendanceStats } from '@/types/types';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentWithProfile | null>(null);
  const [stats, setStats] = useState<StudentAttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const studentData = await getStudentWithProfile(user.id);
      if (!studentData) return;

      setStudent(studentData);

      const statsData = await getStudentAttendanceStats(user.id);
      setStats(statsData);
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
        <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {student?.profile.full_name}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.overall_percentage || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Across all subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_classes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Classes attended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Days</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_present || 0}</div>
            <p className="text-xs text-muted-foreground">
              Out of {stats?.total_classes || 0} classes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Roll Number</p>
              <p className="text-lg font-semibold">{student?.roll_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Section</p>
              <p className="text-lg font-semibold">{student?.section || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Department</p>
              <p className="text-lg font-semibold">{student?.department.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg font-semibold">{student?.profile.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Attendance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.subject_wise.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No attendance records yet
              </p>
            ) : (
              stats?.subject_wise.map((subject) => (
                <div key={subject.subject} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{subject.subject}</span>
                    <span className="text-muted-foreground">
                      {subject.percentage}% ({subject.present_count}/{subject.total_classes})
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        subject.percentage >= 75
                          ? 'bg-secondary'
                          : subject.percentage >= 50
                          ? 'bg-accent'
                          : 'bg-destructive'
                      }`}
                      style={{ width: `${subject.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <a
              href="/student/attendance"
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">View Attendance</h3>
              <p className="text-sm text-muted-foreground">
                Check your detailed attendance records
              </p>
            </a>
            <a
              href="/student/analytics"
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">View Analytics</h3>
              <p className="text-sm text-muted-foreground">
                See detailed attendance statistics
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
