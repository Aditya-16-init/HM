import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function StudentRegistrationPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department_name: '',
    section: '',
    roll_number: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

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

    setLoading(true);

    try {
      // Find or create department using RPC
      const departmentName = formData.department_name.trim();
      const { data: departmentId, error: deptError } = await supabase.rpc(
        'find_or_create_department',
        {
          p_department_name: departmentName,
          p_subjects: ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4', 'Subject 5'],
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

      // Get department subjects
      const { data: dept } = await supabase
        .from('departments')
        .select('subjects')
        .eq('id', departmentId)
        .single();

      const subjects = dept?.subjects || ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4', 'Subject 5'];

      // Register student using RPC function
      const { data: result, error: registerError } = await supabase.rpc(
        'register_student',
        {
          p_user_id: authData.user.id,
          p_email: formData.email,
          p_full_name: formData.full_name,
          p_department_id: departmentId,
          p_section: formData.section || null,
          p_roll_number: formData.roll_number,
          p_subjects: subjects,
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
              Your student account has been created. Redirecting to login...
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
          <CardTitle className="text-2xl font-bold">Student Registration</CardTitle>
          <CardDescription>
            Create your student account to access attendance records
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
                  placeholder="John Doe"
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
                  placeholder="john.doe@example.com"
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
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
                <Label htmlFor="roll_number">Class Roll Number *</Label>
                <Input
                  id="roll_number"
                  type="text"
                  placeholder="e.g., 2024001"
                  value={formData.roll_number}
                  onChange={(e) =>
                    setFormData({ ...formData, roll_number: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section (Optional)</Label>
              <Input
                id="section"
                type="text"
                placeholder="e.g., A, B, C"
                value={formData.section}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value })
                }
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register as Student'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Sign In
              </Link>
              {' or '}
              <Link to="/register/teacher" className="text-primary hover:underline">
                Register as Teacher
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
