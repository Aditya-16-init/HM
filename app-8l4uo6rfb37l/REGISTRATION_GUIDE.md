# HOME GROUND - Registration Guide

## Account Creation Fixed ✅

The registration system has been completely fixed and is now working properly.

## How to Register

### For Students:

1. Go to the Student Registration page
2. Fill in the following information:
   - Full Name
   - Email (must be a valid email address)
   - Password (minimum 6 characters)
   - Confirm Password
   - Department Name (type it in, e.g., "AIML", "CSE", "ECE")
   - Class Roll Number
   - Section (optional)

3. Click "Register as Student"
4. Wait for the success message
5. You will be redirected to the login page
6. Login with your email and password
7. You will be taken to your Student Dashboard

### For Teachers:

1. Go to the Teacher Registration page
2. Fill in the following information:
   - Full Name
   - Email (must be a valid email address)
   - Password (minimum 6 characters)
   - Confirm Password
   - Department Name (type it in, e.g., "AIML", "CSE", "ECE")
   - Assigned Subjects (add at least one subject using the input field and "Add" button)

3. Click "Register as Teacher"
4. Wait for the success message
5. You will be redirected to the login page
6. Login with your email and password
7. You will be taken to your Teacher Dashboard

## What Was Fixed

### Database Functions
- Created secure database functions that bypass RLS (Row Level Security) during registration
- `find_or_create_department()` - Automatically finds existing departments or creates new ones
- `register_student()` - Handles complete student registration with proper permissions
- `register_teacher()` - Handles complete teacher registration with proper permissions

### Registration Flow
- Removed dependency on authenticated session during registration
- Uses secure RPC (Remote Procedure Call) functions with SECURITY DEFINER
- Properly handles department creation/finding
- Automatically assigns subjects based on department

### Database Policies
- Added INSERT policies for departments table
- Added UPDATE policies for departments table
- Added INSERT policies for profiles table
- All policies work correctly with the new RPC functions

## Testing the System

### Test Student Registration:
- Email: student@test.com
- Password: test123
- Department: AIML
- Roll Number: 2024001
- Section: A

### Test Teacher Registration:
- Email: teacher@test.com
- Password: test123
- Department: AIML
- Subjects: Machine Learning, Operating Systems, Mathematics

## Dashboard Access

After successful login:
- **Students** will see their attendance records, subject-wise breakdown, and analytics
- **Teachers** will see student management, attendance marking interface, and class analytics

## Troubleshooting

If you encounter any issues:
1. Make sure you're using a valid email format
2. Password must be at least 6 characters
3. Department name should be entered as text (not selected from dropdown)
4. Teachers must add at least one subject
5. Clear your browser cache if you see old errors
6. Check that you're not already registered with the same email

## Technical Details

The system now uses PostgreSQL functions with `SECURITY DEFINER` to handle registration, which means:
- Registration works even before the user is authenticated
- All database operations are performed with elevated privileges
- RLS policies don't block the initial registration
- After registration, normal RLS policies apply for data access
