import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import { getTeacher, getClassAttendanceStats, getStudentsByDepartment, getStudentAttendanceStats } from '@/db/api';
import type { StudentWithProfile } from '@/types/types';

export default function TeacherAnalyticsPage() {
  const { user } = useAuth();
  const [classStats, setClassStats] = useState<{
    overall_percentage: number;
    total_students: number;
    subject_wise: { subject: string; percentage: number; total_classes: number }[];
  } | null>(null);
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentStats, setStudentStats] = useState<{
    overall_percentage: number;
    subject_wise: { subject: string; percentage: number; total_classes: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentStats(selectedStudent);
    }
  }, [selectedStudent]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      const teacherData = await getTeacher(user.id);
      if (!teacherData) return;

      const stats = await getClassAttendanceStats(teacherData.department_id);
      setClassStats(stats);

      const studentsData = await getStudentsByDepartment(teacherData.department_id);
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentStats = async (studentId: string) => {
    try {
      const stats = await getStudentAttendanceStats(studentId);
      if (stats) {
        setStudentStats({
          overall_percentage: stats.overall_percentage,
          subject_wise: stats.subject_wise,
        });
      }
    } catch (error) {
      console.error('Failed to load student stats:', error);
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
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          View attendance statistics and insights
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Class Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{classStats?.overall_percentage || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Average across all subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{classStats?.total_students || 0}</div>
            <p className="text-xs text-muted-foreground">
              In your department
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Subject-wise Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classStats?.subject_wise.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No attendance data available yet
              </p>
            ) : (
              classStats?.subject_wise.map((subject) => (
                <div key={subject.subject} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{subject.subject}</span>
                    <span className="text-muted-foreground">
                      {subject.percentage}% ({subject.total_classes} classes)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-secondary h-2 rounded-full transition-all"
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
          <CardTitle>Individual Student Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Student</label>
            <select
              value={selectedStudent || ''}
              onChange={(e) => setSelectedStudent(e.target.value || null)}
              className="w-full mt-2 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">-- Select a student --</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.profile.full_name} ({student.roll_number})
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && studentStats && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-medium">Overall Attendance</span>
                <span className="text-2xl font-bold">{studentStats.overall_percentage}%</span>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Subject-wise Breakdown</h4>
                {studentStats.subject_wise.map((subject) => (
                  <div key={subject.subject} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{subject.subject}</span>
                      <span className="text-muted-foreground">
                        {subject.percentage}% ({subject.total_classes} classes)
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
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
