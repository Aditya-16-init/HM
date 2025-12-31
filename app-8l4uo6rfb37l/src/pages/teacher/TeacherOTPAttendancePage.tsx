import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Hash, RefreshCw, Users } from 'lucide-react';
import { getTeacher } from '@/db/api';
import { supabase } from '@/db/supabase';
import OTPDisplay from '@/components/OTPDisplay';
import type { Teacher } from '@/types/types';

interface OTPCode {
  id: string;
  subject: string;
  otp_code: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export default function TeacherOTPAttendancePage() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [otpCodes, setOtpCodes] = useState<OTPCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const teacherData = await getTeacher(user.id);
      setTeacher(teacherData);

      if (teacherData) {
        await loadOTPCodes();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const loadOTPCodes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('otp_attendance_codes')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOtpCodes(data || []);
    } catch (error) {
      console.error('Failed to load OTP codes:', error);
    }
  };

  const generateOTPCode = async (subject: string) => {
    if (!user) return;

    setGenerating(subject);
    setMessage(null);

    try {
      console.log('Calling create_otp_attendance_code with:', {
        p_teacher_id: user.id,
        p_subject: subject,
        p_validity_minutes: 2,
      });

      const { data, error } = await supabase.rpc('create_otp_attendance_code', {
        p_teacher_id: user.id,
        p_subject: subject,
        p_validity_minutes: 2,
      });

      console.log('RPC Response:', { data, error });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      if (data && typeof data === 'object') {
        if (!data.success) {
          throw new Error(data.error || 'Failed to generate OTP code');
        }

        setMessage({ 
          type: 'success', 
          text: `OTP code generated successfully for ${subject}` 
        });

        await loadOTPCodes();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Generate OTP Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate OTP code';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setGenerating(null);
    }
  };

  const handleOTPExpire = async () => {
    await loadOTPCodes();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">OTP Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Generate time-limited codes for your subjects
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Generate OTP Codes Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Generate OTP Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {teacher?.assigned_subjects.map((subject) => {
              const existingCode = otpCodes.find((c) => c.subject === subject);

              return (
                <Card key={subject} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{subject}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {existingCode ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-success">
                          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                          Active Code
                        </div>
                        <Button
                          onClick={() => generateOTPCode(subject)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                          disabled={generating === subject}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Generate New
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => generateOTPCode(subject)}
                        disabled={generating === subject}
                        className="w-full"
                        size="sm"
                      >
                        {generating === subject ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Hash className="h-4 w-4 mr-2" />
                            Generate OTP
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active OTP Codes Display */}
      {otpCodes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Active OTP Codes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {otpCodes.map((code) => (
              <OTPDisplay
                key={code.id}
                otpCode={code.otp_code}
                expiresAt={code.expires_at}
                subject={code.subject}
                onExpire={handleOTPExpire}
              />
            ))}
          </div>
        </div>
      )}

      {/* Instructions Card */}
      <Card className="shadow-sm bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </span>
              <span>
                <strong>Generate OTP:</strong> Click "Generate OTP" for the subject you want to take attendance for
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              <span>
                <strong>Share Code:</strong> Display or announce the 6-digit code to your students
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </span>
              <span>
                <strong>Students Enter:</strong> Students enter the code in their app to mark attendance
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                4
              </span>
              <span>
                <strong>Auto Expiry:</strong> Code expires after 2 minutes for security
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
