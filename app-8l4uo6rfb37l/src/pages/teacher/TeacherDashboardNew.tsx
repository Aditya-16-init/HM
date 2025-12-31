import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, TrendingUp, Calendar } from 'lucide-react';
import { getTeacher, getStudentsByDepartment } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { Teacher, StudentWithProfile, AttendanceRecord } from '@/types/types';

interface SubjectStats {
  subject: string;
  totalClasses: number;
  averageAttendance: number;
  presentCount: number;
  absentCount: number;
}

export default function TeacherDashboardNew() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [teacherData, studentsData] = await Promise.all([
        getTeacher(user.id),
        getTeacher(user.id).then((t) => 
          t ? getStudentsByDepartment(t.department_id) : []
        ),
      ]);

      setTeacher(teacherData);
      setStudents(studentsData);

      // Fetch attendance records for all students in the department
      if (teacherData) {
        const { data: attendanceData } = await supabase
          .from('attendance_records')
          .select('*')
          .in('student_id', studentsData.map(s => s.id));

        const records: AttendanceRecord[] = attendanceData || [];

        // Calculate subject-wise statistics
        const stats: Record<string, { present: number; absent: number; total: number }> = {};

        teacherData.assigned_subjects.forEach((subject) => {
          stats[subject] = { present: 0, absent: 0, total: 0 };
        });

        records.forEach((record) => {
          if (stats[record.subject]) {
            stats[record.subject].total++;
            if (record.status === 'present') {
              stats[record.subject].present++;
            } else {
              stats[record.subject].absent++;
            }
          }
        });

        const subjectData: SubjectStats[] = Object.entries(stats).map(
          ([subject, data]) => {
            const averageAttendance = data.total > 0 ? (data.present / data.total) * 100 : 0;
            return {
              subject,
              totalClasses: data.total,
              averageAttendance: Math.round(averageAttendance * 10) / 10,
              presentCount: data.present,
              absentCount: data.absent,
            };
          }
        );

        setSubjectStats(subjectData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
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

  const totalClasses = subjectStats.reduce((sum, s) => sum + s.totalClasses, 0);
  const totalPresent = subjectStats.reduce((sum, s) => sum + s.presentCount, 0);
  const totalAbsent = subjectStats.reduce((sum, s) => sum + s.absentCount, 0);
  const overallAttendance = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

  // Prepare data for charts
  const pieData = [
    { name: 'Present', value: totalPresent, color: 'hsl(var(--chart-5))' },
    { name: 'Absent', value: totalAbsent, color: 'hsl(var(--chart-2))' },
  ];

  const barData = subjectStats.map((s) => ({
    subject: s.subject.length > 15 ? s.subject.substring(0, 15) + '...' : s.subject,
    'Avg Attendance': s.averageAttendance,
    Classes: s.totalClasses,
  }));

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user?.user_metadata?.full_name || 'Teacher'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">{students.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In your department</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-1 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Assigned Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">{teacher?.assigned_subjects.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active subjects</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-5 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overall Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">{overallAttendance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPresent} of {totalClasses} records
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Classes Conducted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">{totalClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">Total attendance records</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Class Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {totalClasses > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No attendance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="Avg Attendance" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Classes" fill="hsl(var(--chart-3))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No subject data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Subject</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Total Classes</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Present</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Absent</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg Attendance</th>
                </tr>
              </thead>
              <tbody>
                {subjectStats.length > 0 ? (
                  subjectStats.map((stat, index) => (
                    <tr key={index} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{stat.subject}</td>
                      <td className="text-center py-3 px-4">{stat.totalClasses}</td>
                      <td className="text-center py-3 px-4 text-success">{stat.presentCount}</td>
                      <td className="text-center py-3 px-4 text-destructive">{stat.absentCount}</td>
                      <td className="text-right py-3 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            stat.averageAttendance >= 75
                              ? 'bg-success/10 text-success'
                              : stat.averageAttendance >= 60
                              ? 'bg-warning/10 text-warning'
                              : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {stat.averageAttendance.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No attendance records found. Start marking attendance to see statistics.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Students */}
      <Card>
        <CardHeader>
          <CardTitle>Students in Your Department</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {students.length > 0 ? (
              students.slice(0, 10).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{student.profile.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Roll: {student.roll_number}
                      {student.section && ` • Section: ${student.section}`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No students found in your department
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
