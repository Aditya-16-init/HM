# QR Attendance System - Testing & Verification Guide

## System Overview
This document outlines the complete QR attendance flow and how to test it.

## Complete Flow

### Teacher Side (QR Generation)
1. **Login as Teacher**
   - Navigate to `/login`
   - Enter teacher credentials
   - Redirected to `/teacher/dashboard`

2. **Generate QR Code**
   - Click "QR Attendance" in sidebar
   - Navigate to `/teacher/qr-attendance`
   - Click "Generate QR" for any subject
   - System calls `create_qr_session()` RPC function
   - QR code is generated with unique token
   - QR code displayed with share options

3. **Share QR Code**
   - Click "Share QR Code" button
   - Or click "Copy Link" to copy URL
   - Or click "Download" to save as image
   - Share with students via WhatsApp, email, etc.

### Student Side (QR Scanning)
1. **Login as Student**
   - Navigate to `/login`
   - Enter student credentials
   - Redirected to `/student/dashboard`

2. **Scan QR Code**
   - Click "Scan QR Code" in sidebar
   - Navigate to `/student/scan-attendance`
   - Click "Start Camera" button
   - Browser requests camera permission
   - Allow camera access
   - Camera window opens showing live feed
   - Point camera at teacher's QR code
   - QR code is automatically detected

3. **Attendance Marked**
   - System extracts token from QR code
   - Calls `mark_attendance_via_qr()` RPC function
   - Function validates:
     - QR token is valid and active
     - QR token has not expired
     - Student is in same department as teacher
     - Student hasn't already marked attendance today
   - Attendance record created with status "present"
   - Success message displayed to student
   - Recent attendance list updated

### Attendance Verification
1. **Student Verification**
   - Go to "My Attendance" page
   - See newly marked attendance
   - Check subject-wise attendance percentage
   - View attendance history

2. **Teacher Verification**
   - Go to "Analytics" page
   - See updated class attendance
   - View individual student attendance
   - Check subject-wise statistics

## Technical Implementation

### Database Functions

#### create_qr_session()
```sql
Parameters:
- p_teacher_id: UUID of teacher
- p_subject: Subject name
- p_date: Date (default: today)
- p_expires_hours: Expiration time (default: 24 hours)

Returns: JSON
{
  "success": true/false,
  "session_id": "uuid",
  "qr_token": "base64_string",
  "message": "status message",
  "error": "error message if failed"
}
```

#### mark_attendance_via_qr()
```sql
Parameters:
- p_student_id: UUID of student
- p_qr_token: Token from QR code

Returns: JSON
{
  "success": true/false,
  "attendance_id": "uuid",
  "subject": "subject name",
  "date": "date",
  "message": "status message",
  "error": "error message if failed"
}

Validations:
1. QR token exists and is active
2. QR token has not expired
3. Student is in same department as teacher
4. No duplicate attendance for same subject/date
```

### Camera Integration

#### Html5Qrcode Library
- Uses device camera for QR scanning
- Supports both front and back cameras
- Automatic QR code detection
- No manual capture needed

#### Camera States
1. **Prompt**: Initial state, waiting for user action
2. **Initializing**: Requesting permission and starting camera
3. **Scanning**: Camera active, scanning for QR codes
4. **Stopped**: Camera stopped, ready to restart

#### Error Handling
- Camera permission denied
- No camera found on device
- QR reader element not found
- Scanner initialization failed
- Invalid QR code format

## Testing Checklist

### Pre-requisites
- [ ] At least one teacher account exists
- [ ] At least one student account exists
- [ ] Student and teacher are in same department
- [ ] Teacher has assigned subjects
- [ ] Student has assigned subjects (based on department)

### Teacher QR Generation Tests
- [ ] Teacher can login successfully
- [ ] Teacher can navigate to QR Attendance page
- [ ] Teacher can see all assigned subjects
- [ ] Teacher can generate QR code for each subject
- [ ] QR code displays correctly
- [ ] Share button works (native share or copy link)
- [ ] Copy link button copies URL to clipboard
- [ ] Download button saves QR code as PNG
- [ ] Only one QR code per subject per day
- [ ] Existing QR code shows "Active" status
- [ ] Teacher can deactivate QR session

### Student QR Scanning Tests
- [ ] Student can login successfully
- [ ] Student can navigate to Scan QR Code page
- [ ] "Start Camera" button is visible
- [ ] Clicking button requests camera permission
- [ ] Camera permission prompt appears
- [ ] After allowing, camera window opens
- [ ] Live camera feed is visible
- [ ] QR code is detected automatically
- [ ] Attendance is marked successfully
- [ ] Success message displays with subject name
- [ ] Recent attendance list updates
- [ ] Camera stops after successful scan

### Attendance Verification Tests
- [ ] Student can view attendance in "My Attendance"
- [ ] Newly marked attendance appears immediately
- [ ] Attendance percentage updates correctly
- [ ] Teacher can see updated attendance in Analytics
- [ ] Class attendance statistics update
- [ ] Individual student records show new attendance

### Error Handling Tests
- [ ] Camera permission denied shows error message
- [ ] No camera device shows appropriate error
- [ ] Invalid QR code shows error message
- [ ] Expired QR code shows error message
- [ ] Duplicate scan attempt shows error message
- [ ] Wrong department student shows error message
- [ ] Network error shows appropriate message

### Edge Cases
- [ ] Multiple students scanning same QR code
- [ ] Student scanning QR code twice
- [ ] Student from different department scanning
- [ ] Scanning expired QR code
- [ ] Scanning deactivated QR code
- [ ] Camera already in use by another app
- [ ] Browser doesn't support camera API
- [ ] Mobile vs desktop camera behavior

## Common Issues & Solutions

### Camera Not Opening
**Symptoms**: Click "Start Camera" but nothing happens

**Solutions**:
1. Check browser console for errors
2. Verify HTTPS connection (required for camera)
3. Check camera permissions in browser settings
4. Try different browser (Chrome, Firefox, Safari)
5. Refresh the page and try again
6. Check if camera is being used by another app

### QR Code Not Detected
**Symptoms**: Camera opens but QR code not recognized

**Solutions**:
1. Ensure good lighting
2. Hold camera steady
3. Position QR code within the frame
4. Try moving closer or farther
5. Ensure QR code is not blurry
6. Check if QR code is still active

### Attendance Not Marked
**Symptoms**: QR code scanned but attendance not recorded

**Solutions**:
1. Check console logs for error messages
2. Verify student is in correct department
3. Check if attendance already marked today
4. Verify QR code is still active
5. Check network connection
6. Verify database functions are working

### Permission Denied
**Symptoms**: Browser blocks camera access

**Solutions**:
1. Click lock icon in address bar
2. Change camera permission to "Allow"
3. Refresh the page
4. Try in incognito/private mode
5. Clear browser cache and cookies
6. Check system camera permissions

## Browser Compatibility

### Fully Supported
- ✅ Chrome 90+ (Desktop & Mobile)
- ✅ Firefox 88+ (Desktop & Mobile)
- ✅ Safari 14+ (iOS & macOS)
- ✅ Edge 90+ (Desktop & Mobile)

### Partially Supported
- ⚠️ Opera 76+ (Desktop & Mobile)
- ⚠️ Samsung Internet 14+

### Not Supported
- ❌ Internet Explorer (any version)
- ❌ Browsers without camera API support

## Security Features

### QR Token Security
- Tokens are randomly generated using UUID
- Tokens are URL-safe (no special characters)
- Tokens are unique per session
- Tokens expire after 24 hours
- Tokens can be manually deactivated

### Access Control
- Students can only mark their own attendance
- Students must be in same department as teacher
- One attendance record per subject per day
- RLS policies protect data access
- SECURITY DEFINER functions for safe operations

### Data Validation
- QR token validation before attendance marking
- Department matching verification
- Duplicate attendance prevention
- Expiration time checking
- Active session verification

## Performance Considerations

### Camera Performance
- FPS set to 10 for balance between speed and CPU usage
- QR box size optimized for mobile screens
- Aspect ratio set to 1.0 for square display
- Verbose mode disabled to reduce console spam

### Database Performance
- Indexes on qr_token for fast lookups
- Indexes on teacher_id for session queries
- Indexes on is_active for filtering
- Unique constraint prevents duplicate sessions
- Efficient RPC functions with minimal queries

## Monitoring & Debugging

### Console Logs
- Camera permission requests
- Scanner initialization steps
- QR code detection events
- RPC function calls and responses
- Error messages with stack traces

### Network Logs
- Supabase RPC calls
- Database query responses
- Authentication status
- API errors and timeouts

### User Feedback
- Success messages for completed actions
- Error alerts for failures
- Loading states during operations
- Confirmation messages for important actions
