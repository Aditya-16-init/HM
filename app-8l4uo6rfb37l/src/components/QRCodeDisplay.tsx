import QRCode from 'react-qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface QRCodeDisplayProps {
  qrToken: string;
  subject: string;
  date: string;
  onShare?: () => void;
}

export default function QRCodeDisplay({ qrToken, subject, date, onShare }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  
  // Generate the full URL that students will scan
  const qrUrl = `${window.location.origin}/student/scan-attendance?token=${qrToken}`;

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${subject}-${date}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Attendance QR - ${subject}`,
          text: `Scan this QR code to mark your attendance for ${subject}`,
          url: qrUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
    onShare?.();
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">
          {subject}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Date: {new Date(date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-border">
          <QRCode
            id="qr-code-svg"
            value={qrUrl}
            size={200}
            level="H"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={handleShare}
            variant="default"
            className="w-full"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share QR Code
          </Button>

          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full"
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2 text-success" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>

          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Instructions:</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Share this QR code with your students</li>
            <li>Students can scan it to mark attendance</li>
            <li>QR code is valid for 24 hours</li>
            <li>Each student can scan only once per day</li>
          </ul>
        </div>

        {/* Shareable Link */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs font-medium mb-1">Shareable Link:</p>
          <p className="text-xs text-muted-foreground break-all font-mono">
            {qrUrl}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
