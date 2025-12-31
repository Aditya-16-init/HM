import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, RefreshCw, Users } from 'lucide-react';
import { getTeacher } from '@/db/api';
import { supabase } from '@/db/supabase';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import type { Teacher } from '@/types/types';

interface QRSession {
  id: string;
  subject: string;
  date: string;
  qr_token: string;
  is_active: boolean;
  created_at: string;
}

export default function TeacherQRAttendancePage() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [qrSessions, setQrSessions] = useState<QRSession[]>([]);
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
        await loadQRSessions();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const loadQRSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('qr_attendance_sessions')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQrSessions(data || []);
    } catch (error) {
      console.error('Failed to load QR sessions:', error);
    }
  };

  const generateQRCode = async (subject: string) => {
    if (!user) return;

    setGenerating(subject);
    setMessage(null);

    try {
      console.log('Calling create_qr_session with:', {
        p_teacher_id: user.id,
        p_subject: subject,
        p_date: new Date().toISOString().split('T')[0],
        p_expires_hours: 24,
      });

      const { data, error } = await supabase.rpc('create_qr_session', {
        p_teacher_id: user.id,
        p_subject: subject,
        p_date: new Date().toISOString().split('T')[0],
        p_expires_hours: 24,
      });

      console.log('RPC Response:', { data, error });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      // The RPC function returns a JSON object
      if (data && typeof data === 'object') {
        if (!data.success) {
          throw new Error(data.error || 'Failed to create QR session');
        }

        setMessage({ 
          type: 'success', 
          text: `QR code generated successfully for ${subject}` 
        });

        await loadQRSessions();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Generate QR Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate QR code';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setGenerating(null);
    }
  };

  const deactivateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('qr_attendance_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'QR session deactivated' });
      await loadQRSessions();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to deactivate session';
      setMessage({ type: 'error', text: errorMsg });
    }
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Smart QR Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Generate QR codes for your subjects and share with students
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Generate QR Codes Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generate QR Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {teacher?.assigned_subjects.map((subject) => {
              const existingSession = qrSessions.find(
                (s) => s.subject === subject && s.date === new Date().toISOString().split('T')[0]
              );

              return (
                <Card key={subject} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{subject}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {existingSession ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-success">
                          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                          Active QR Code
                        </div>
                        <Button
                          onClick={() => deactivateSession(existingSession.id)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Deactivate
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => generateQRCode(subject)}
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
                            <QrCode className="h-4 w-4 mr-2" />
                            Generate QR
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

      {/* Active QR Codes Display */}
      {qrSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Active QR Codes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {qrSessions.map((session) => (
              <QRCodeDisplay
                key={session.id}
                qrToken={session.qr_token}
                subject={session.subject}
                date={session.date}
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
                <strong>Generate QR Code:</strong> Click "Generate QR" for the subject you want to take attendance for
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              <span>
                <strong>Share with Students:</strong> Share the QR code via WhatsApp, email, or display it on screen
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </span>
              <span>
                <strong>Students Scan:</strong> Students use their app to scan the QR code
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                4
              </span>
              <span>
                <strong>Automatic Marking:</strong> Attendance is automatically marked as present when scanned
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
