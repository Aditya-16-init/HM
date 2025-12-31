# HOME GROUND Attendance Management System Requirements Document

## 1. Application Overview

### 1.1 Application Name\nHOME GROUND

### 1.2 Application Type
Web application with role-based login system

### 1.3 Application Description
An attendance management system designed for educational institutions, enabling teachers to track and manage student attendance while providing students with real-time access to their attendance records and analytics.

## 2. Authentication & User Roles\n
### 2.1 Account Types
- Teacher (Admin role)
- Student

### 2.2 Authentication Method
- Email-based authentication
- Password-based authentication
- No third-party or Google sign-in
- Separate account creation and login flows for Teachers and Students

## 3. Student Account Management
\n### 3.1 Student Registration Fields
- Full Name\n- Department (dropdown selection)
- Section (optional field)
- Class Roll Number
- Email\n- Password

### 3.2 Department-Based Subject Assignment
- System automatically assigns default subjects based on selected department
- Example for AIML Department:\n  - Machine Learning (ML)\n  - Operating Systems (OS)\n  - Computer Organization (CO)\n  - Mathematics
  - English

### 3.3 Post-Registration Process\n- Student account creation
- Automatic generation of student dashboard with assigned subjects
- Initialization of attendance records for each subject

## 4. Teacher Account Management\n
### 4.1 Teacher Registration Fields
- Full Name
- Assigned Department (single department)
- Assigned Subjects (one or multiple subjects)
- Email
- Password

### 4.2 Post-Registration Process
- Teacher account creation
- Admin privileges granted for assigned department and subjects
\n## 5. Teacher Dashboard Features

### 5.1 Student Management
- View all students registered under assigned department
- Student list displays:
  - Name
  - Roll Number\n  - Section
  - Department

### 5.2 Attendance Management
- Attendance marking interface with:
  - Subject selection dropdown
  - Date picker
  - Student list for selected department
  - Present/Absent toggle for each student
- Attendance data updates:\n  - Individual student profiles
  - Overall class records
\n### 5.3 Analytics Dashboard
- Overall class attendance analytics
- Subject-wise attendance graphs
- Overall attendance percentage calculation\n- Clickable student profiles showing:
  - Subject-wise attendance breakdown
  - Individual attendance percentage
  - Attendance history\n
### 5.4 Smart QR Attendance Management\n- QR code generation for each assigned subject:
  - Unique QR code per subject
  - QR codes visible in teacher dashboard
  - Each QR code contains encoded information: Teacher ID, Subject ID, Department
- QR code sharing options:
  - Direct link generation for each QR code\n  - Share via social media platforms
  - Download QR code image
- QR code display interface:
  - Subject-wise QR code list
  - QR code preview with subject name\n  - Copy link button for easy sharing

### 5.5 OTP-Based Attendance System
- OTP code generation for each assigned subject:
  - Generate button for each subject in teacher dashboard
  - 6-digit numeric OTP code
  - Time-limited validity: 2 minutes from generation
  - Real-time countdown timer display showing remaining validity time
- OTP display interface:
  - Large, clear display of generated OTP code
  - Subject name associated with the OTP
  - Countdown timer (MM:SS format)
  - Regenerate button (available after expiry or manual refresh)
  - OTP automatically expires after 2 minutes
- OTP sharing options:
  - Display OTP on screen for students to view
  - Copy OTP to clipboard
  - OTP visible only to the teacher who generated it
\n## 6. Student Dashboard Features

### 6.1 Subject-Wise Attendance Display
- List of all assigned subjects
- Attendance percentage per subject
- Present/Absent count per subject

### 6.2 Overall Attendance Analytics
- Visual graphs (bar charts or pie charts) displaying:
  - Subject-wise attendance comparison\n  - Overall attendance percentage

### 6.3 Access Permissions
- Read-only access to attendance data
- No editing capabilities

### 6.4 Smart QR Attendance Scanner
- QR code scanner feature:
  - Camera access integration for scanning
  - Real-time QR code detection\n  - Scan button to activate camera
- Automatic attendance marking:
  - Scanned QR code validates subject and teacher information\n  - Attendance automatically marked as 'Present' for the specific subject
  - Timestamp recorded for scan time
  - Instant confirmation message after successful scan
- Scanner interface:
  - Camera viewfinder with scanning frame
  - Clear instructions for positioning QR code
  - Success/error feedback messages

### 6.5 OTP-Based Attendance Entry
- OTP input interface:
  - Dedicated section for OTP attendance marking
  - Subject selection dropdown (shows only enrolled subjects)
  - 6-digit OTP input field
  - Submit button to verify and mark attendance
- Automatic attendance marking:
  - System validates OTP against active codes
  - Checks OTP validity (not expired)
  - Verifies student is enrolled in the selected subject
  - Marks attendance as 'Present' upon successful validation
  - Records timestamp of OTP submission
  - Instant confirmation message after successful attendance marking
- Validation feedback:
  - Success message: Attendance marked successfully
  - Error messages for:\n    - Invalid OTP code
    - Expired OTP (beyond 2-minute window)
    - Subject mismatch
    - Duplicate attendance (already marked for the day)
  - Clear error descriptions to guide students

## 7. Data Logic & Permissions
\n### 7.1 Data Storage Structure
- Attendance records stored per:
  - Subject\n  - Student
  - Date
- QR attendance records include:
  - Scan timestamp
  - QR code ID
  - Validation status\n- OTP attendance records include:
  - OTP code (encrypted)
  - Generation timestamp
  - Expiry timestamp
  - Subject ID
  - Teacher ID
  - Submission timestamp
  - Validation status

### 7.2 Teacher Permissions
- Access limited to students in assigned department\n- Attendance marking restricted to assigned subjects only
- Generate and manage QR codes for assigned subjects only\n- Generate and manage OTP codes for assigned subjects only
- View OTP usage analytics (number of students marked via OTP)

### 7.3 Student Permissions\n- View access limited to personal attendance data only
- QR scanner access for marking own attendance
- Cannot scan QR codes for subjects not assigned to them
- OTP entry access for marking own attendance
- Cannot enter OTP for subjects not assigned to them
- Cannot view or access OTP codes generated by teachers

### 7.4 QR Attendance Validation Rules
- Each QR code scan validates:
  - Student is enrolled in the scanned subject
  - QR code belongs to student's department
  - Prevents duplicate scans on the same day for the same subject
  - Records attendance with scan timestamp
\n### 7.5 OTP Attendance Validation Rules
- Each OTP submission validates:
  - OTP code matches an active generated code
  - OTP is within 2-minute validity window
  - Student is enrolled in the selected subject
  - OTP belongs to the correct subject
  - Prevents duplicate attendance marking on the same day for the same subject
  - Records attendance with submission timestamp
- OTP expiry handling:
  - Expired OTP codes cannot be used
  - System automatically invalidates OTP after 2 minutes
  - Teachers can generate new OTP after expiry

## 8. Design Requirements

### 8.1 Overall Design Style
- Clean and simple dashboard interface
- Professional educational theme\n- Clear visual hierarchy for data presentation

### 8.2 Color Scheme
- Primary color: Deep blue (#2C3E50) for headers and navigation
- Secondary color: Fresh green (#27AE60) for positive indicators (Present)
- Accent color: Warm orange (#E67E22) for alerts and important actions
- Background: Light gray (#F8F9FA) for content areas

### 8.3 Layout Structure
- Separate dashboard layouts for Teacher and Student roles
- Sidebar navigation with clear sections:
  - Attendance
  - Analytics
  - Profile
  - QR Attendance (existing section)
  - OTP Attendance (new section)
- Card-based layout for data presentation
- Responsive grid system for mobile compatibility

### 8.4 Visual Elements
- Rounded corners (8px border-radius) for cards and buttons
- Subtle shadows for depth (box-shadow: 0 2px 8px rgba(0,0,0,0.1))
- Clear iconography for navigation items
- Interactive hover states for clickable elements
- QR code display with clear borders and subject labels
- Camera scanner interface with centered viewfinder frame
- OTP display with large, bold typography for easy reading
- Countdown timer with color-coded urgency (green > yellow > red as time runs out)
- OTP input field with clear numeric keypad support

### 8.5 Responsive Design
- Mobile-responsive layout adapting to different screen sizes
- Touch-friendly interface elements for mobile devices
- Optimized camera scanner for mobile devices
- Full-screen camera view for better QR code scanning experience\n- OTP input optimized for mobile numeric keyboards
- Clear OTP display visible on all screen sizes