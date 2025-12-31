# Task: HOME GROUND Attendance Management System

## Analysis Results

### Requirements Summary
- **Application Type**: Web-based attendance management system for educational institutions
- **Authentication**: Email + password based authentication with separate flows for Teachers and Students
- **User Roles**: Teacher (admin role) and Student
- **Core Features**:
  - Teacher: Mark attendance, view analytics, manage students in assigned department
  - Student: View personal attendance records and analytics
- **Database**: Supabase for all persistent storage
- **Design**: Desktop-first with mobile adaptation, professional educational theme

### Color Scheme
- Primary: Deep blue (#2C3E50) - headers and navigation
- Secondary: Fresh green (#27AE60) - positive indicators (Present)
- Accent: Warm orange (#E67E22) - alerts and important actions
- Background: Light gray (#F8F9FA) - content areas

### API Analysis
- No external APIs available for this project

### Login Requirements
- Use Supabase Auth with email + password
- Separate registration flows for Teachers and Students
- Role-based access control (Teacher = admin, Student = user)
- First registered user becomes admin
- Auto-sync users to profiles table via trigger

## Plan

- [x] Step 1: Initialize Supabase and setup database schema
  - [x] Initialize Supabase project
  - [x] Create user_role enum type
  - [x] Create profiles table with role field
  - [x] Create departments table with default subjects
  - [x] Create students table with department and section info
  - [x] Create teachers table with assigned department and subjects
  - [x] Create attendance_records table
  - [x] Setup RLS policies for all tables
  - [x] Create trigger for auto-syncing auth users to profiles

- [x] Step 2: Setup design system and theme
  - [x] Update index.css with color scheme variables
  - [x] Update tailwind.config.js with semantic tokens
  - [x] Ensure proper contrast ratios for accessibility

- [x] Step 3: Create type definitions
  - [x] Define database types in @/types/types.ts
  - [x] Define form types and interfaces

- [x] Step 4: Create database API layer
  - [x] Create @/db/api.ts with all database queries
  - [x] Implement student queries (CRUD, attendance fetch)
  - [x] Implement teacher queries (student management, attendance marking)
  - [x] Implement analytics queries

- [x] Step 5: Setup authentication system
  - [x] Update @/contexts/AuthContext.tsx for role-based auth
  - [x] Update @/components/common/RouteGuard.tsx with public routes
  - [x] Create login page with role selection
  - [x] Create separate registration pages for Teacher and Student
  - [x] Disable email verification using supabase_verification

- [x] Step 6: Create layout components
  - [x] Create @/components/layouts/TeacherLayout.tsx with sidebar
  - [x] Create @/components/layouts/StudentLayout.tsx with sidebar
  - [x] Create responsive navigation with hamburger menu for mobile

- [x] Step 7: Implement Teacher features
  - [x] Create Teacher Dashboard page
  - [x] Create Student Management page (view all students)
  - [x] Create Attendance Marking page (subject selector, date picker, student list)
  - [x] Create Teacher Analytics page (class-wide and individual student analytics)

- [x] Step 8: Implement Student features
  - [x] Create Student Dashboard page
  - [x] Create Subject-wise Attendance page
  - [x] Create Student Analytics page (graphs and charts)

- [x] Step 9: Create shared components
  - [x] Create attendance percentage display component
  - [x] Create analytics chart components
  - [x] Create student profile card component

- [x] Step 10: Setup routing
  - [x] Configure routes in @/routes.tsx
  - [x] Setup role-based route protection
  - [x] Add redirect for undefined paths

- [x] Step 11: Update App.tsx
  - [x] Add AuthProvider
  - [x] Add RouteGuard
  - [x] Add header with login/logout functionality
  - [x] Setup BrowserRouter

- [x] Step 12: Testing and validation
  - [x] Run npm run lint and fix all issues
  - [ ] Test authentication flows
  - [ ] Test teacher features
  - [ ] Test student features
  - [ ] Verify responsive design

## Notes

- Teachers have admin role and can manage students in their assigned department
- Students have user role and can only view their own attendance
- Department selection automatically assigns default subjects to students
- Attendance is tracked per subject, student, and date
- First registered user becomes admin automatically
- Use email + password authentication (no phone or Google SSO)
- All data must be stored in Supabase (no localStorage)
- Desktop-first design with mobile adaptation using xl breakpoint
