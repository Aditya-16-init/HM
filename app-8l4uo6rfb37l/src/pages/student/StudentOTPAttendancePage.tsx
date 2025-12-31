import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Hash, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/db/supabase';
import OTPInput from '@/components/OTPInput';
import { getStudentAttendance } from '@/db/api';
import type { AttendanceRecord } from '@/types/types';

export default function StudentOTPAttendancePage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (user) {
      loadRecentAttendance();
    }
  }, [user]);

  const loadRecentAttendance = async () => {
    if (!user) return;

    try {
      const records = await getStudentAttendance(user.id);
      // Get today's attendance only
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = records.filter(r => r.date === today);
      setRecentAttendance(todayRecords);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  };

  const handleOTPSubmit = async (otpCode: string) => {
    if (!user) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      console.log('Submitting OTP:', otpCode);

      const { data, error } = await supabase.rpc('mark_attendance_via_otp', {
        p_student_id: user.id,
        p_otp_code: otpCode,
      });

      console.log('RPC Response:', { data, error });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      if (data && typeof data === 'object') {
        if (!data.success) {
          throw new Error(data.error || 'Failed to mark attendance');
        }

        setMessage({
          type: 'success',
          text: `Attendance marked successfully for ${data.subject}!`,
        });

        // Reload recent attendance
        await loadRecentAttendance();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Submit OTP Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to mark attendance';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">OTP Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Enter the code provided by your teacher to mark attendance
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* OTP Input Section */}
      <OTPInput onSubmit={handleOTPSubmit} isSubmitting={isSubmitting} />

      {/* Today's Attendance */}
      {recentAttendance.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/20">
                      <CheckCircle className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{record.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        Marked at {new Date(record.created_at || '').toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-success text-success-foreground text-xs font-medium rounded-full">
                    Present
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="shadow-sm bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
            <Hash className="h-5 w-5" />
            About OTP Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">How it works:</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Your teacher will generate and display a 6-digit code</li>
              <li>Enter the code in the boxes above</li>
              <li>Click "Submit Code" to mark your attendance</li>
              <li>You'll see confirmation when successful</li>
            </ol>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Important Notes:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Each code is valid for 2 minutes only</li>
              <li>You can only mark attendance once per subject per day</li>
              <li>Make sure you're in the correct class</li>
              <li>Contact your teacher if you face any issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
