import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Clock, Copy, CheckCircle, AlertCircle } from 'lucide-react';

interface OTPDisplayProps {
  otpCode: string;
  expiresAt: string;
  subject: string;
  onExpire: () => void;
}

export default function OTPDisplay({ otpCode, expiresAt, subject, onExpire }: OTPDisplayProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      return diff;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(otpCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpiringSoon = timeLeft <= 30 && timeLeft > 0;
  const isExpired = timeLeft === 0;

  return (
    <Card className={`shadow-sm ${isExpired ? 'opacity-50' : ''}`}>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">
          {subject}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OTP Code Display */}
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/20">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
            Attendance Code
          </p>
          <div className="text-5xl font-bold tracking-wider text-primary mb-3 font-mono">
            {otpCode.split('').map((digit, index) => (
              <span key={index} className="inline-block mx-1">
                {digit}
              </span>
            ))}
          </div>
          
          {/* Timer */}
          <div className={`flex items-center gap-2 text-sm font-medium ${
            isExpired ? 'text-destructive' : isExpiringSoon ? 'text-orange-500' : 'text-muted-foreground'
          }`}>
            <Clock className="h-4 w-4" />
            <span>
              {isExpired ? 'Expired' : `Expires in ${formatTime(timeLeft)}`}
            </span>
          </div>
        </div>

        {/* Copy Button */}
        <Button
          onClick={handleCopy}
          variant="outline"
          className="w-full"
          disabled={isExpired}
        >
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2 text-success" />
              Code Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Instructions:</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Share this code with your students</li>
            <li>Students enter the code to mark attendance</li>
            <li>Code is valid for 2 minutes only</li>
            <li>Generate new code after expiration</li>
          </ul>
        </div>

        {/* Status Alert */}
        {isExpiringSoon && !isExpired && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Code expiring soon! Generate a new code if needed.
            </AlertDescription>
          </Alert>
        )}

        {isExpired && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This code has expired. Please generate a new code.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
