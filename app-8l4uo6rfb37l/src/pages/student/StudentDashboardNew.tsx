import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BookOpen, TrendingUp, Calendar, Award } from 'lucide-react';
import { getStudent, getStudentAttendance } from '@/db/api';
import type { Student, AttendanceRecord } from '@/types/types';

interface SubjectAttendance {
  subject: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

export default function StudentDashboardNew() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [studentData, attendanceData] = await Promise.all([
        getStudent(user.id),
        getStudentAttendance(user.id),
      ]);

      setStudent(studentData);
      setAttendance(attendanceData);

      // Calculate subject-wise statistics
      if (studentData) {
        const stats: Record<string, { present: number; absent: number }> = {};

        studentData.subjects.forEach((subject) => {
          stats[subject] = { present: 0, absent: 0 };
        });

        attendanceData.forEach((record) => {
          if (stats[record.subject]) {
            if (record.status === 'present') {
              stats[record.subject].present++;
            } else {
              stats[record.subject].absent++;
            }
          }
        });

        const subjectData: SubjectAttendance[] = Object.entries(stats).map(
          ([subject, data]) => {
            const total = data.present + data.absent;
            const percentage = total > 0 ? (data.present / total) * 100 : 0;
            return {
              subject,
              present: data.present,
              absent: data.absent,
              total,
              percentage: Math.round(percentage * 10) / 10,
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

  const totalPresent = subjectStats.reduce((sum, s) => sum + s.present, 0);
  const totalAbsent = subjectStats.reduce((sum, s) => sum + s.absent, 0);
  const totalClasses = totalPresent + totalAbsent;
  const overallPercentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

  // Prepare data for charts
  const pieData = [
    { name: 'Present', value: totalPresent, color: 'hsl(var(--chart-5))' },
    { name: 'Absent', value: totalAbsent, color: 'hsl(var(--chart-2))' },
  ];

  const barData = subjectStats.map((s) => ({
    subject: s.subject.length > 15 ? s.subject.substring(0, 15) + '...' : s.subject,
    Present: s.present,
    Absent: s.absent,
    percentage: s.percentage,
  }));

  // Recent attendance trend (last 10 records)
  const recentAttendance = attendance.slice(0, 10).reverse();
  const trendData = recentAttendance.map((record, index) => ({
    date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    attendance: record.status === 'present' ? 100 : 0,
  }));

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user?.user_metadata?.full_name || 'Student'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">{student?.subjects.length || 0}</div>
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
            <div className="text-2xl font-bold tracking-tight text-foreground">{overallPercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPresent} of {totalClasses} classes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-1 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Classes Attended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">{totalPresent}</div>
            <p className="text-xs text-success mt-1">Present days</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-2 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Classes Missed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">{totalAbsent}</div>
            <p className="text-xs text-destructive mt-1">Absent days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight">Subject-wise Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 11, fontFamily: 'Inter, sans-serif' }} 
                  stroke="hsl(var(--muted-foreground))" 
                />
                <YAxis 
                  tick={{ fontSize: 11, fontFamily: 'Inter, sans-serif' }} 
                  stroke="hsl(var(--muted-foreground))" 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px'
                  }} 
                />
                <Legend wrapperStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }} />
                <Bar dataKey="Present" fill="hsl(var(--chart-5))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Absent" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Trend */}
      {trendData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight">Recent Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fontFamily: 'Inter, sans-serif' }} 
                  stroke="hsl(var(--muted-foreground))" 
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 11, fontFamily: 'Inter, sans-serif' }} 
                  stroke="hsl(var(--muted-foreground))" 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px'
                  }}
                  formatter={(value: number) => [value === 100 ? 'Present' : 'Absent', 'Status']}
                />
                <Line 
                  type="monotone" 
                  dataKey="attendance" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--chart-1))', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Subject Details Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">Detailed Subject Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Present</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Absent</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {subjectStats.map((stat, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium">{stat.subject}</td>
                    <td className="text-center py-3 px-4 text-sm text-success font-medium">{stat.present}</td>
                    <td className="text-center py-3 px-4 text-sm text-destructive font-medium">{stat.absent}</td>
                    <td className="text-center py-3 px-4 text-sm font-medium">{stat.total}</td>
                    <td className="text-right py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          stat.percentage >= 75
                            ? 'bg-success/10 text-success'
                            : stat.percentage >= 60
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {stat.percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
