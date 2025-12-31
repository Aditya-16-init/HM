import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Search } from 'lucide-react';
import { getTeacher, getStudentsByDepartment } from '@/db/api';
import type { StudentWithProfile } from '@/types/types';

export default function TeacherStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStudents();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter(
        (student) =>
          student.profile.full_name.toLowerCase().includes(query) ||
          student.roll_number.toLowerCase().includes(query) ||
          student.section?.toLowerCase().includes(query)
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const loadStudents = async () => {
    if (!user) return;

    try {
      const teacherData = await getTeacher(user.id);
      if (!teacherData) return;

      const studentsData = await getStudentsByDepartment(teacherData.department_id);
      setStudents(studentsData);
      setFilteredStudents(studentsData);
    } catch (error) {
      console.error('Failed to load students:', error);
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
        <h1 className="text-3xl font-bold text-foreground">Students</h1>
        <p className="text-muted-foreground mt-2">
          Manage students in your department
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Students ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, roll number, or section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Roll Number</th>
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">Section</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Subjects</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{student.roll_number}</td>
                      <td className="p-4">{student.profile.full_name}</td>
                      <td className="p-4">{student.section || '-'}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {student.profile.email}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {student.subjects.slice(0, 3).map((subject) => (
                            <span
                              key={subject}
                              className="px-2 py-1 bg-muted text-xs rounded"
                            >
                              {subject}
                            </span>
                          ))}
                          {student.subjects.length > 3 && (
                            <span className="px-2 py-1 bg-muted text-xs rounded">
                              +{student.subjects.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
