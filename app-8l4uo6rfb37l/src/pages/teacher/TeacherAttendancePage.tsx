import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClipboardCheck, CheckCircle, XCircle, Save } from 'lucide-react';
import { getTeacher, getStudentsByDepartment, markBulkAttendance } from '@/db/api';
import type { StudentWithProfile } from '@/types/types';

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    // Initialize attendance state when students load
    const initialAttendance: Record<string, 'present' | 'absent'> = {};
    students.forEach((student) => {
      initialAttendance[student.id] = 'present';
    });
    setAttendance(initialAttendance);
  }, [students]);

  const loadData = async () => {
    if (!user) return;

    try {
      const teacherData = await getTeacher(user.id);
      if (!teacherData) return;

      setAssignedSubjects(teacherData.assigned_subjects);
      const studentsData = await getStudentsByDepartment(teacherData.department_id);
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, 'present' | 'absent'> = {};
    students.forEach((student) => {
      allPresent[student.id] = 'present';
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent: Record<string, 'present' | 'absent'> = {};
    students.forEach((student) => {
      allAbsent[student.id] = 'absent';
    });
    setAttendance(allAbsent);
  };

  const handleSubmit = async () => {
    if (!selectedSubject) {
      setMessage({ type: 'error', text: 'Please select a subject' });
      return;
    }

    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const records = students.map((student) => ({
        student_id: student.id,
        subject: selectedSubject,
        date: selectedDate,
        status: attendance[student.id] || 'present',
        marked_by: user.id,
      }));

      await markBulkAttendance(records);
      setMessage({ type: 'success', text: 'Attendance marked successfully!' });
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      setMessage({ type: 'error', text: 'Failed to mark attendance. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount = students.length - presentCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mark Attendance</h1>
        <p className="text-muted-foreground mt-2">
          Record student attendance for your classes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Attendance Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {assignedSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={markAllPresent} variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All Present
            </Button>
            <Button onClick={markAllAbsent} variant="outline" size="sm">
              <XCircle className="h-4 w-4 mr-2" />
              Mark All Absent
            </Button>
          </div>

          <div className="flex gap-4 text-sm">
            <span className="text-secondary font-medium">
              Present: {presentCount}
            </span>
            <span className="text-destructive font-medium">
              Absent: {absentCount}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {students.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No students found in your department
              </p>
            ) : (
              students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{student.profile.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Roll: {student.roll_number}
                      {student.section && ` • Section: ${student.section}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleAttendance(student.id)}
                      variant={
                        attendance[student.id] === 'present' ? 'default' : 'outline'
                      }
                      size="sm"
                      className={
                        attendance[student.id] === 'present'
                          ? 'bg-secondary hover:bg-secondary/90'
                          : ''
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Present
                    </Button>
                    <Button
                      onClick={() => toggleAttendance(student.id)}
                      variant={
                        attendance[student.id] === 'absent' ? 'default' : 'outline'
                      }
                      size="sm"
                      className={
                        attendance[student.id] === 'absent'
                          ? 'bg-destructive hover:bg-destructive/90'
                          : ''
                      }
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Absent
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {students.length > 0 && (
            <div className="mt-6">
              <Button
                onClick={handleSubmit}
                disabled={saving || !selectedSubject}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
