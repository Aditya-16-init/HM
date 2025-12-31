import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { getStudentAttendance, getStudent } from '@/db/api';
import type { AttendanceRecord, Student } from '@/types/types';

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAttendance();
    }
  }, [user]);

  const loadAttendance = async () => {
    if (!user) return;

    try {
      const studentData = await getStudent(user.id);
      if (!studentData) return;

      setStudent(studentData);

      const attendanceData = await getStudentAttendance(user.id);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Failed to load attendance:', error);
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

  // Group attendance by subject
  const attendanceBySubject = student?.subjects.reduce((acc, subject) => {
    acc[subject] = attendance.filter((record) => record.subject === subject);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>) || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Attendance</h1>
        <p className="text-muted-foreground mt-2">
          View your attendance records for all subjects
        </p>
      </div>

      {student?.subjects.map((subject) => {
        const records = attendanceBySubject[subject] || [];
        const presentCount = records.filter((r) => r.status === 'present').length;
        const absentCount = records.filter((r) => r.status === 'absent').length;
        const totalClasses = records.length;
        const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

        return (
          <Card key={subject}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {subject}
                </span>
                <span className={`text-lg ${
                  percentage >= 75 ? 'text-secondary' : percentage >= 50 ? 'text-accent' : 'text-destructive'
                }`}>
                  {percentage}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <span className="font-medium">Present: {presentCount}</span>
                </span>
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium">Absent: {absentCount}</span>
                </span>
                <span className="text-muted-foreground">
                  Total: {totalClasses} classes
                </span>
              </div>

              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    percentage >= 75 ? 'bg-secondary' : percentage >= 50 ? 'bg-accent' : 'bg-destructive'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {records.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-3">Recent Records</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {records.slice(0, 10).map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <span className="text-sm">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            record.status === 'present'
                              ? 'bg-secondary text-secondary-foreground'
                              : 'bg-destructive text-destructive-foreground'
                          }`}
                        >
                          {record.status === 'present' ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {records.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No attendance records for this subject yet
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {(!student?.subjects || student.subjects.length === 0) && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No subjects assigned yet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
