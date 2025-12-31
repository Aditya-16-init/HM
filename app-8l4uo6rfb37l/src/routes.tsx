import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import StudentRegistrationPage from './pages/StudentRegistrationPage';
import TeacherRegistrationPage from './pages/TeacherRegistrationPage';
import TeacherLayout from './components/layouts/TeacherLayout';
import StudentLayout from './components/layouts/StudentLayout';
import TeacherDashboardNew from './pages/teacher/TeacherDashboardNew';
import TeacherStudentsPage from './pages/teacher/TeacherStudentsPage';
import TeacherAttendancePage from './pages/teacher/TeacherAttendancePage';
import TeacherQRAttendancePage from './pages/teacher/TeacherQRAttendancePage';
import TeacherOTPAttendancePage from './pages/teacher/TeacherOTPAttendancePage';
import TeacherAnalyticsPage from './pages/teacher/TeacherAnalyticsPage';
import StudentDashboardNew from './pages/student/StudentDashboardNew';
import StudentAttendancePage from './pages/student/StudentAttendancePage';
import StudentQRScanPage from './pages/student/StudentQRScanPage';
import StudentOTPAttendancePage from './pages/student/StudentOTPAttendancePage';
import StudentAnalyticsPage from './pages/student/StudentAnalyticsPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  children?: RouteConfig[];
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <HomePage />,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
  },
  {
    name: 'Student Registration',
    path: '/register/student',
    element: <StudentRegistrationPage />,
  },
  {
    name: 'Teacher Registration',
    path: '/register/teacher',
    element: <TeacherRegistrationPage />,
  },
  {
    name: 'Teacher Portal',
    path: '/teacher',
    element: <TeacherLayout />,
    children: [
      {
        name: 'Teacher Dashboard',
        path: '/teacher/dashboard',
        element: <TeacherDashboardNew />,
      },
      {
        name: 'Students',
        path: '/teacher/students',
        element: <TeacherStudentsPage />,
      },
      {
        name: 'Mark Attendance',
        path: '/teacher/attendance',
        element: <TeacherAttendancePage />,
      },
      {
        name: 'QR Attendance',
        path: '/teacher/qr-attendance',
        element: <TeacherQRAttendancePage />,
      },
      {
        name: 'OTP Attendance',
        path: '/teacher/otp-attendance',
        element: <TeacherOTPAttendancePage />,
      },
      {
        name: 'Analytics',
        path: '/teacher/analytics',
        element: <TeacherAnalyticsPage />,
      },
    ],
  },
  {
    name: 'Student Portal',
    path: '/student',
    element: <StudentLayout />,
    children: [
      {
        name: 'Student Dashboard',
        path: '/student/dashboard',
        element: <StudentDashboardNew />,
      },
      {
        name: 'My Attendance',
        path: '/student/attendance',
        element: <StudentAttendancePage />,
      },
      {
        name: 'Scan QR Code',
        path: '/student/scan-attendance',
        element: <StudentQRScanPage />,
      },
      {
        name: 'OTP Attendance',
        path: '/student/otp-attendance',
        element: <StudentOTPAttendancePage />,
      },
      {
        name: 'Analytics',
        path: '/student/analytics',
        element: <StudentAnalyticsPage />,
      },
    ],
  },
];

export default routes;
