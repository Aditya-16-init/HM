# Smart QR Attendance System - User Guide

## Overview
The Smart QR Attendance system allows teachers to generate unique QR codes for each subject, which students can scan using their device camera to automatically mark their attendance.

## ✅ System Status
- **QR Generation**: ✅ Working (Fixed token generation issue)
- **QR Scanning**: ✅ Working (Fixed camera initialization)
- **Camera Integration**: ✅ Working (Enhanced error handling and DOM readiness)
- **Attendance Marking**: ✅ Working
- **Database Functions**: ✅ All operational

## Recent Fixes
1. **Token Generation**: Fixed `gen_random_bytes()` function by enabling pgcrypto extension
2. **Camera Window**: Fixed camera not opening by:
   - Adding proper DOM element readiness checks
   - Implementing initialization state with loading indicator
   - Adding comprehensive error logging
   - Ensuring scanner cleanup between sessions
   - Adding 100ms delay for DOM stability
   - Setting minimum height for camera container

## For Teachers

### Generating QR Codes

1. **Navigate to QR Attendance**
   - Go to Teacher Portal → QR Attendance
   - You'll see all your assigned subjects

2. **Generate QR Code**
   - Click "Generate QR" button for any subject
   - A unique QR code will be created for that subject for today
   - The QR code is valid for 24 hours

3. **Share QR Code**
   - **Share Button**: Use native device sharing (WhatsApp, Email, etc.)
   - **Copy Link**: Copy the shareable link to clipboard
   - **Download**: Save QR code as PNG image
   - Display QR code on screen for students to scan

4. **Manage Active Sessions**
   - View all active QR codes in the "Active QR Codes" section
   - Each QR code shows the subject and date
   - Click "Deactivate" to stop accepting scans for a session

### Features
- ✅ One QR code per subject per day
- ✅ Automatic attendance marking when scanned
- ✅ 24-hour validity period
- ✅ Multiple sharing options
- ✅ Real-time attendance updates

## For Students

### Scanning QR Codes

1. **Navigate to Scan QR Code**
   - Go to Student Portal → Scan QR Code
   - You'll see the QR scanner interface

2. **Start Camera**
   - Click "Start Camera" button
   - Allow camera access when prompted by browser
   - Point camera at teacher's QR code

3. **Automatic Detection**
   - The system will automatically detect the QR code
   - Your attendance will be marked instantly
   - You'll see a success message with subject name

4. **Alternative: Use Shared Link**
   - If teacher shares a link, click it directly
   - Your attendance will be marked automatically
   - No need to scan with camera

### Recent Attendance
- View your last 5 attendance records
- See subject, date, and status
- Track your scanning history

### Important Notes
- ⚠️ You can only mark attendance once per subject per day
- ⚠️ Camera permission is required for scanning
- ⚠️ Make sure you're in the correct class before scanning
- ⚠️ QR codes expire after 24 hours

## Technical Details

### Database Schema
- **qr_attendance_sessions**: Stores QR session information
  - teacher_id, subject, date, qr_token
  - is_active, expires_at
  - Unique constraint on (teacher_id, subject, date)

### Security Features
- ✅ Department validation (students must be in same department as teacher)
- ✅ Duplicate scan prevention (one scan per subject per day)
- ✅ Token expiration (24-hour validity)
- ✅ Active session management
- ✅ Row Level Security (RLS) policies

### Camera Integration
- Uses HTML5 QRCode library
- Supports both front and rear cameras
- Works on mobile and desktop browsers
- Automatic QR code detection
- No manual capture needed

## Troubleshooting

### Camera Not Working
1. Check browser permissions
2. Ensure HTTPS connection (required for camera access)
3. Try refreshing the page
4. Use a different browser if issues persist

### QR Code Not Scanning
1. Ensure good lighting
2. Hold camera steady
3. Position QR code within the frame
4. Try moving closer or farther from QR code

### Attendance Not Marked
1. Check if you're in the correct department
2. Verify QR code is still active (not expired)
3. Ensure you haven't already marked attendance for this subject today
4. Contact your teacher if issues persist

## Browser Compatibility
- ✅ Chrome (Desktop & Mobile)
- ✅ Safari (iOS & macOS)
- ✅ Firefox (Desktop & Mobile)
- ✅ Edge (Desktop & Mobile)

## Privacy & Security
- Camera access is only used for QR scanning
- No images or videos are stored
- QR tokens are securely generated
- All data is encrypted in transit
- RLS policies protect user data
