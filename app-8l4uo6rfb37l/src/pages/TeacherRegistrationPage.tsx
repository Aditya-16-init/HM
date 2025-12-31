import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, AlertCircle, CheckCircle } from 'lucide-react';
import { getDepartments } from '@/db/api';
import { supabase } from '@/db/supabase';

export default function TeacherRegistrationPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department_name: '',
    assigned_subjects: [] as string[],
  });
  const [subjectInput, setSubjectInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleAddSubject = () => {
    const subject = subjectInput.trim();
    if (subject && !formData.assigned_subjects.includes(subject)) {
      setFormData((prev) => ({
        ...prev,
        assigned_subjects: [...prev.assigned_subjects, subject],
      }));
      setSubjectInput('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      assigned_subjects: prev.assigned_subjects.filter((s) => s !== subject),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.department_name.trim()) {
      setError('Please enter a department name');
      return;
    }

    if (formData.assigned_subjects.length === 0) {
      setError('Please add at least one subject');
      return;
    }

    setLoading(true);

    try {
      // Find or create department using RPC
      const departmentName = formData.department_name.trim();
      const { data: departmentId, error: deptError } = await supabase.rpc(
        'find_or_create_department',
        {
          p_department_name: departmentName,
          p_subjects: formData.assigned_subjects,
        }
      );

      if (deptError) throw deptError;
      if (!departmentId) throw new Error('Failed to create or find department');

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Register teacher using RPC function
      const { data: result, error: registerError } = await supabase.rpc(
        'register_teacher',
        {
          p_user_id: authData.user.id,
          p_email: formData.email,
          p_full_name: formData.full_name,
          p_department_id: departmentId,
          p_assigned_subjects: formData.assigned_subjects,
        }
      );

      if (registerError) throw registerError;
      if (result && !result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-secondary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Registration Successful!</CardTitle>
            <CardDescription>
              Your teacher account has been created. Redirecting to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Teacher Registration</CardTitle>
          <CardDescription>
            Create your teacher account to manage student attendance
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Dr. Jane Smith"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane.smith@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Assigned Department *</Label>
              <Input
                id="department"
                type="text"
                placeholder="e.g., AIML, CSE, ECE"
                value={formData.department_name}
                onChange={(e) =>
                  setFormData({ ...formData, department_name: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Subjects * (Add at least one)</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter subject name"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubject();
                    }
                  }}
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={handleAddSubject}
                  disabled={loading || !subjectInput.trim()}
                  variant="secondary"
                >
                  Add
                </Button>
              </div>
              {formData.assigned_subjects.length > 0 && (
                <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                  {formData.assigned_subjects.map((subject) => (
                    <div
                      key={subject}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm font-medium">{subject}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSubject(subject)}
                        disabled={loading}
                        className="h-6 px-2"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register as Teacher'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Sign In
              </Link>
              {' or '}
              <Link to="/register/student" className="text-primary hover:underline">
                Register as Student
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
