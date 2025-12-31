# OTP-Based Attendance System - Complete Documentation

## Overview

The OTP (One-Time Password) attendance system provides a quick and secure way for teachers to mark attendance using time-limited 6-digit codes. This feature complements the existing QR code and manual attendance methods without modifying any existing functionality.

## Features

### For Teachers
- **Generate OTP Codes**: Create 6-digit codes for each subject
- **2-Minute Validity**: Codes automatically expire after 2 minutes
- **Real-Time Countdown**: Visual timer shows remaining time
- **Copy to Clipboard**: Quick copy functionality for sharing
- **Auto-Deactivation**: Previous codes are deactivated when new ones are generated
- **Subject-Based**: Separate codes for each assigned subject

### For Students
- **Easy Input**: 6-box input interface for entering codes
- **Paste Support**: Can paste full 6-digit code
- **Instant Feedback**: Immediate confirmation on success/failure
- **Today's Attendance**: View all attendance marked today
- **Auto-Focus**: Automatic navigation between input boxes

## Database Schema

### Table: otp_attendance_codes

```sql
CREATE TABLE otp_attendance_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_teacher_subject_active UNIQUE (teacher_id, subject, is_active)
);
```

### Indexes
- `idx_otp_codes_teacher` - Fast teacher lookups
- `idx_otp_codes_otp` - Fast OTP validation
- `idx_otp_codes_active` - Filter active codes
- `idx_otp_codes_expires` - Check expiration

### RLS Policies
- Teachers can create, view, update, and delete their own OTP codes
- Students can view active, non-expired OTP codes for validation

## Database Functions

### generate_otp_code()

Generates a random 6-digit OTP code.

```sql
CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;
```

**Returns**: String with 6 digits (e.g., "123456", "007890")

### create_otp_attendance_code()

Creates a new OTP code for a teacher and subject.

```sql
CREATE OR REPLACE FUNCTION create_otp_attendance_code(
  p_teacher_id UUID,
  p_subject TEXT,
  p_validity_minutes INTEGER DEFAULT 2
)
RETURNS JSON
```

**Parameters**:
- `p_teacher_id`: UUID of the teacher
- `p_subject`: Subject name
- `p_validity_minutes`: Validity period (default: 2 minutes)

**Returns**:
```json
{
  "success": true,
  "code_id": "uuid",
  "otp_code": "123456",
  "expires_at": "2025-12-30T10:32:00Z",
  "message": "OTP code generated successfully"
}
```

**Behavior**:
1. Deactivates any existing active OTP for the same teacher/subject
2. Generates new 6-digit code
3. Sets expiration time (current time + validity minutes)
4. Creates new record in database
5. Returns code details

### mark_attendance_via_otp()

Marks student attendance using an OTP code.

```sql
CREATE OR REPLACE FUNCTION mark_attendance_via_otp(
  p_student_id UUID,
  p_otp_code TEXT
)
RETURNS JSON
```

**Parameters**:
- `p_student_id`: UUID of the student
- `p_otp_code`: 6-digit OTP code

**Returns** (Success):
```json
{
  "success": true,
  "attendance_id": "uuid",
  "subject": "Mathematics",
  "date": "2025-12-30",
  "message": "Attendance marked successfully"
}
```

**Returns** (Error):
```json
{
  "success": false,
  "error": "Invalid or expired OTP code"
}
```

**Validations**:
1. OTP code exists and is active
2. OTP code has not expired
3. Student exists in database
4. Student is in same department as teacher
5. Attendance not already marked for this subject today

**Error Messages**:
- "Invalid or expired OTP code"
- "Student not found"
- "You are not enrolled in this department"
- "Attendance already marked for this subject today"

## Components

### OTPDisplay Component

Displays active OTP code with countdown timer.

**Location**: `src/components/OTPDisplay.tsx`

**Props**:
```typescript
interface OTPDisplayProps {
  otpCode: string;        // 6-digit OTP code
  expiresAt: string;      // ISO timestamp
  subject: string;        // Subject name
  onExpire: () => void;   // Callback when expired
}
```

**Features**:
- Large, readable code display
- Real-time countdown timer
- Color-coded status (normal, expiring soon, expired)
- Copy to clipboard functionality
- Visual feedback on copy
- Instructions for teachers
- Expiration alerts

**States**:
- **Normal**: Green/primary colors, > 30 seconds remaining
- **Expiring Soon**: Orange colors, ≤ 30 seconds remaining
- **Expired**: Red/destructive colors, 0 seconds remaining

### OTPInput Component

Input interface for students to enter OTP codes.

**Location**: `src/components/OTPInput.tsx`

**Props**:
```typescript
interface OTPInputProps {
  onSubmit: (otp: string) => void;  // Callback with complete OTP
  isSubmitting: boolean;             // Loading state
}
```

**Features**:
- 6 separate input boxes
- Auto-focus next box on input
- Backspace navigation
- Paste full code support
- Clear all functionality
- Submit button (enabled when complete)
- Loading state during submission
- Instructions and tips

**Keyboard Navigation**:
- **Number keys**: Enter digit and move to next box
- **Backspace**: Clear current box and move to previous
- **Paste**: Fill all boxes with 6-digit code

## Pages

### TeacherOTPAttendancePage

Teacher interface for generating and managing OTP codes.

**Location**: `src/pages/teacher/TeacherOTPAttendancePage.tsx`

**Route**: `/teacher/otp-attendance`

**Features**:
- Grid of all assigned subjects
- Generate OTP button for each subject
- Active code indicators
- Display active OTP codes with countdown
- Refresh/regenerate functionality
- Instructions and how-it-works guide

**Sections**:
1. **Generate OTP Codes**: Cards for each subject with generate buttons
2. **Active OTP Codes**: Display area for currently active codes
3. **How It Works**: Step-by-step instructions

### StudentOTPAttendancePage

Student interface for entering OTP codes.

**Location**: `src/pages/student/StudentOTPAttendancePage.tsx`

**Route**: `/student/otp-attendance`

**Features**:
- OTP input interface
- Submit functionality
- Success/error messages
- Today's attendance display
- Instructions and tips

**Sections**:
1. **Enter Attendance Code**: OTP input component
2. **Today's Attendance**: List of attendance marked today
3. **About OTP Attendance**: Information and notes

## User Flow

### Teacher Flow

1. **Navigate to OTP Attendance**
   - Click "OTP Attendance" in sidebar
   - See list of all assigned subjects

2. **Generate OTP Code**
   - Click "Generate OTP" for desired subject
   - System creates 6-digit code
   - Code displays with countdown timer

3. **Share Code**
   - Display code on screen/projector
   - Or click "Copy Code" and share via chat
   - Or announce code verbally to class

4. **Monitor Expiration**
   - Watch countdown timer
   - Generate new code if expired
   - Previous code automatically deactivated

### Student Flow

1. **Navigate to OTP Attendance**
   - Click "OTP Attendance" in sidebar
   - See OTP input interface

2. **Enter Code**
   - Type 6-digit code from teacher
   - Or paste code if received digitally
   - Auto-focus moves between boxes

3. **Submit Code**
   - Click "Submit Code" button
   - System validates code
   - Attendance marked if valid

4. **View Confirmation**
   - Success message displays
   - Today's attendance list updates
   - Subject and time shown

## Navigation Integration

### Teacher Sidebar

Added "OTP Attendance" menu item:
- Icon: Hash (#)
- Route: `/teacher/otp-attendance`
- Position: After "QR Attendance", before "Analytics"

### Student Sidebar

Added "OTP Attendance" menu item:
- Icon: Hash (#)
- Route: `/student/otp-attendance`
- Position: After "Scan QR Code", before "Analytics"

## Security Features

### Code Generation
- Cryptographically random 6-digit codes
- Unique per teacher/subject/time
- No predictable patterns

### Expiration
- Hard 2-minute limit
- Server-side validation
- Cannot be extended once generated

### Validation
- Department matching enforced
- Duplicate attendance prevented
- Active status checked
- Expiration time verified

### Database Security
- RLS policies protect data
- SECURITY DEFINER functions
- Proper access controls
- Audit trail via created_at

## Error Handling

### Teacher Side

**Generation Errors**:
- Database connection failure
- Invalid teacher ID
- Missing subject assignment

**Display**:
- Error alerts with clear messages
- Retry functionality
- Graceful degradation

### Student Side

**Submission Errors**:
- Invalid OTP code
- Expired OTP code
- Wrong department
- Duplicate attendance
- Network errors

**Display**:
- Destructive alerts for errors
- Success alerts for confirmation
- Clear error messages
- Retry capability

## Performance Considerations

### Database
- Indexed lookups for fast validation
- Automatic cleanup of expired codes
- Efficient RPC functions
- Minimal query complexity

### Frontend
- Real-time countdown without server calls
- Debounced input handling
- Optimistic UI updates
- Lazy loading of components

### Network
- Single RPC call for generation
- Single RPC call for validation
- No polling required
- Minimal data transfer

## Testing Checklist

### Teacher Tests
- [ ] Can generate OTP for each subject
- [ ] OTP displays correctly
- [ ] Countdown timer works
- [ ] Copy to clipboard works
- [ ] Code expires after 2 minutes
- [ ] Can generate new code after expiration
- [ ] Previous code deactivated on new generation
- [ ] Multiple subjects work independently

### Student Tests
- [ ] Can enter OTP code
- [ ] Auto-focus works between boxes
- [ ] Paste functionality works
- [ ] Submit button enables when complete
- [ ] Valid code marks attendance
- [ ] Invalid code shows error
- [ ] Expired code shows error
- [ ] Duplicate attempt shows error
- [ ] Wrong department shows error
- [ ] Today's attendance updates

### Integration Tests
- [ ] Teacher generates code
- [ ] Student enters code
- [ ] Attendance marked in database
- [ ] Appears in student's attendance list
- [ ] Appears in teacher's analytics
- [ ] Subject-wise stats update
- [ ] Overall percentage updates

## Comparison with Other Methods

### vs Manual Attendance
- **Faster**: No need to call names individually
- **Accurate**: No proxy attendance possible
- **Efficient**: Entire class can mark simultaneously

### vs QR Code Attendance
- **Simpler**: No camera required
- **Faster**: Just type 6 digits
- **Universal**: Works on any device
- **Accessible**: No camera permission issues

### vs Traditional Methods
- **Digital**: Automatic record keeping
- **Instant**: Real-time updates
- **Secure**: Time-limited codes
- **Trackable**: Complete audit trail

## Best Practices

### For Teachers
1. Generate code at start of class
2. Display prominently on screen
3. Give students 1-2 minutes to enter
4. Verify attendance count matches class size
5. Generate new code if needed

### For Students
1. Have app ready before class
2. Enter code as soon as displayed
3. Verify success message
4. Check today's attendance list
5. Contact teacher if issues

## Troubleshooting

### Code Not Generating
- Check internet connection
- Verify teacher account is active
- Ensure subject is assigned
- Try refreshing page

### Code Not Working
- Verify code is correct (6 digits)
- Check if code has expired
- Ensure in correct department
- Verify not already marked today

### Attendance Not Showing
- Refresh attendance page
- Check date filter
- Verify subject name
- Wait a few seconds for sync

## Future Enhancements

### Potential Features
- Configurable validity period
- Attendance statistics per OTP
- Bulk code generation
- SMS/Email code delivery
- Geolocation validation
- Attendance reports

### Scalability
- Code pooling for high traffic
- Caching for faster validation
- Batch processing for large classes
- Analytics dashboard

## Maintenance

### Regular Tasks
- Monitor code generation rate
- Check expiration cleanup
- Review error logs
- Analyze usage patterns

### Database Maintenance
- Archive old codes (> 30 days)
- Optimize indexes
- Update statistics
- Vacuum tables

## Conclusion

The OTP-based attendance system provides a fast, secure, and user-friendly method for marking attendance. It complements existing methods while maintaining all current functionality. The 2-minute validity ensures security while the simple 6-digit format ensures ease of use.
