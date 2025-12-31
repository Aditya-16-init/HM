import { useState, useRef, KeyboardEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Hash, CheckCircle, AlertCircle } from 'lucide-react';

interface OTPInputProps {
  onSubmit: (otp: string) => void;
  isSubmitting: boolean;
}

export default function OTPInput({ onSubmit, isSubmitting }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only process if it's 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = () => {
    const otpString = otp.join('');
    if (otpString.length === 6) {
      onSubmit(otpString);
    }
  };

  const handleClear = () => {
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const isComplete = otp.every(digit => digit !== '');

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Enter Attendance Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OTP Input Fields */}
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-14 text-center text-2xl font-bold"
              disabled={isSubmitting}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleClear}
            variant="outline"
            disabled={isSubmitting || !otp.some(d => d !== '')}
          >
            Clear
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isComplete || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Code
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            How to use:
          </h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Get the 6-digit code from your teacher</li>
            <li>Enter the code in the boxes above</li>
            <li>Click "Submit Code" to mark attendance</li>
            <li>You'll see confirmation when successful</li>
          </ol>
        </div>

        {/* Tips */}
        <div className="bg-card p-3 rounded-lg border text-xs">
          <p className="font-semibold mb-1">Tips:</p>
          <ul className="text-muted-foreground space-y-1 list-disc list-inside">
            <li>Code is valid for 2 minutes only</li>
            <li>You can paste the full 6-digit code</li>
            <li>Make sure you're in the correct class</li>
            <li>Each code can only be used once per day</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
