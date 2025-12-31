import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { getStudentAttendanceStats } from '@/db/api';
import type { StudentAttendanceStats } from '@/types/types';

export default function StudentAnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentAttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      const statsData = await getStudentAttendanceStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
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
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Detailed insights into your attendance performance
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
              Classes conducted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_present || 0}</div>
            <p className="text-xs text-muted-foreground">
              Out of {stats?.total_classes || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Subject-wise Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {stats?.subject_wise.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No attendance data available yet
              </p>
            ) : (
              stats?.subject_wise.map((subject) => (
                <div key={subject.subject} className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{subject.subject}</h4>
                      <p className="text-sm text-muted-foreground">
                        {subject.present_count} present, {subject.absent_count} absent
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        subject.percentage >= 75
                          ? 'text-secondary'
                          : subject.percentage >= 50
                          ? 'text-accent'
                          : 'text-destructive'
                      }`}>
                        {subject.percentage}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {subject.total_classes} classes
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
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
          <CardTitle>Attendance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold">Present</p>
                  <p className="text-sm text-muted-foreground">Days attended</p>
                </div>
              </div>
              <div className="text-2xl font-bold">{stats?.total_present || 0}</div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">Absent</p>
                  <p className="text-sm text-muted-foreground">Days missed</p>
                </div>
              </div>
              <div className="text-2xl font-bold">{stats?.total_absent || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats && stats.overall_percentage < 75 && (
        <Card className="border-accent">
          <CardHeader>
            <CardTitle className="text-accent">⚠️ Attendance Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Your overall attendance is below 75%. Please ensure regular attendance to maintain good academic standing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
