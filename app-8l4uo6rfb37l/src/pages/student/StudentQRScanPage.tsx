import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, QrCode, History } from 'lucide-react';
import { supabase } from '@/db/supabase';
import QRScanner from '@/components/QRScanner';

interface AttendanceHistory {
  subject: string;
  date: string;
  status: string;
  created_at: string;
}

export default function StudentQRScanPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recentScans, setRecentScans] = useState<AttendanceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecentScans();
      
      // Check if there's a token in URL (from shared link)
      const token = searchParams.get('token');
      if (token) {
        handleQRScan(token);
      }
    }
  }, [user, searchParams]);

  const loadRecentScans = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('subject, date, status, created_at')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentScans(data || []);
    } catch (error) {
      console.error('Failed to load recent scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (scannedData: string) => {
    if (!user) return;

    setMessage(null);
    setScanning(true);

    try {
      // Extract token from URL if it's a full URL
      let token = scannedData;
      if (scannedData.includes('token=')) {
        const url = new URL(scannedData);
        token = url.searchParams.get('token') || scannedData;
      }

      console.log('Scanning QR with token:', token);

      // Call the RPC function to mark attendance
      const { data, error } = await supabase.rpc('mark_attendance_via_qr', {
        p_student_id: user.id,
        p_qr_token: token,
      });

      console.log('Scan Response:', { data, error });

      if (error) {
        console.error('Scan Error:', error);
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

        // Reload recent scans
        await loadRecentScans();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('QR Scan Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to mark attendance';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setScanning(false);
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Scan QR Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Scan your teacher's QR code to mark attendance
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* QR Scanner */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <QRScanner
          onScanSuccess={handleQRScan}
          onScanError={(error) => setMessage({ type: 'error', text: error })}
        />

        {/* Recent Scans */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentScans.length > 0 ? (
              <div className="space-y-3">
                {recentScans.map((scan, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{scan.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(scan.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        scan.status === 'present'
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {scan.status === 'present' ? 'Present' : 'Absent'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No attendance records yet</p>
                <p className="text-xs mt-1">Scan a QR code to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="shadow-sm bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            How to Mark Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </span>
              <span>
                <strong>Get QR Code:</strong> Your teacher will share a QR code for the class
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              <span>
                <strong>Start Camera:</strong> Click "Start Camera" button above
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </span>
              <span>
                <strong>Scan QR Code:</strong> Point your camera at the QR code
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                4
              </span>
              <span>
                <strong>Done!</strong> Your attendance will be marked automatically
              </span>
            </li>
          </ol>

          <div className="mt-4 p-3 bg-card rounded-lg border">
            <p className="text-xs font-semibold mb-1">Important Notes:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>You can only mark attendance once per subject per day</li>
              <li>Make sure you're in the correct class before scanning</li>
              <li>QR codes expire after 24 hours</li>
              <li>Camera permission is required for scanning</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
