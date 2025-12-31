import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap } from 'lucide-react';

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect based on role
      if (profile.role === 'teacher') {
        navigate('/teacher/dashboard', { replace: true });
      } else if (profile.role === 'student') {
        navigate('/student/dashboard', { replace: true });
      }
    } else if (!loading && !user) {
      // Show landing page for non-authenticated users
      // They can navigate to login from here
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
            <GraduationCap className="w-16 h-16 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-4xl xl:text-5xl font-bold text-foreground">
          HOME GROUND
        </h1>
        <p className="text-lg xl:text-xl text-muted-foreground">
          Attendance Management System for Educational Institutions
        </p>
        <div className="flex flex-col xl:flex-row gap-4 justify-center pt-8">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register/student')}
            className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Register as Student
          </button>
          <button
            onClick={() => navigate('/register/teacher')}
            className="px-8 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Register as Teacher
          </button>
        </div>
      </div>
    </div>
  );
}
