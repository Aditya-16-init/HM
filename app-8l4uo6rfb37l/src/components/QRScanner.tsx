import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
}

export default function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isInitializing, setIsInitializing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      // Cleanup on unmount
      const cleanup = async () => {
        if (scannerRef.current) {
          try {
            const state = await scannerRef.current.getState();
            if (state === 2) { // SCANNING state
              await scannerRef.current.stop();
            }
            await scannerRef.current.clear();
          } catch (e) {
            console.log('Cleanup completed');
          }
          scannerRef.current = null;
        }
      };
      cleanup();
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      console.log('Requesting camera permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      console.log('Camera permission granted');
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      return true;
    } catch (err) {
      console.error('Camera permission denied:', err);
      setCameraPermission('denied');
      setError('Camera permission denied. Please enable camera access in your browser settings.');
      return false;
    }
  };

  const startScanning = async () => {
    console.log('Starting QR scanner...');
    setError('');
    setIsInitializing(true);
    
    try {
      // Request camera permission first
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setIsInitializing(false);
        return;
      }

      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 200));

      if (!mountedRef.current) {
        console.log('Component unmounted, aborting');
        return;
      }

      // Check if element exists
      const element = document.getElementById('qr-reader');
      if (!element) {
        throw new Error('QR reader element not found. Please refresh the page.');
      }

      console.log('Initializing Html5Qrcode...');
      
      // Clear any existing scanner
      if (scannerRef.current) {
        try {
          const state = await scannerRef.current.getState();
          if (state === 2) { // SCANNING state
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch (e) {
          console.log('Cleared previous scanner');
        }
        scannerRef.current = null;
      }

      // Create new scanner instance
      const scanner = new Html5Qrcode('qr-reader', { verbose: false });
      scannerRef.current = scanner;

      console.log('Starting camera...');
      
      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      console.log('Available cameras:', devices.length);

      if (devices.length === 0) {
        throw new Error('No camera found on this device');
      }

      // Start scanning with camera
      await scanner.start(
        { facingMode: 'environment' }, // Use back camera on mobile
        {
          fps: 10, // Frames per second
          qrbox: { width: 250, height: 250 }, // QR box size
          aspectRatio: 1.0,
        },
        (decodedText) => {
          console.log('QR Code detected:', decodedText);
          onScanSuccess(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Ignore scanning errors (they happen continuously while scanning)
          // Only log occasionally to avoid console spam
          if (Math.random() < 0.01) {
            console.debug('Scanning...', errorMessage);
          }
        }
      );

      if (!mountedRef.current) {
        console.log('Component unmounted after start, stopping');
        await scanner.stop();
        return;
      }

      console.log('Camera started successfully');
      setIsScanning(true);
      setIsInitializing(false);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to start camera';
      setError(errorMsg);
      setIsInitializing(false);
      if (onScanError) onScanError(errorMsg);
      
      // Clean up on error
      if (scannerRef.current) {
        try {
          await scannerRef.current.clear();
        } catch (e) {
          console.error('Error clearing scanner:', e);
        }
        scannerRef.current = null;
      }
    }
  };

  const stopScanning = async () => {
    console.log('Stopping scanner...');
    if (scannerRef.current) {
      try {
        const state = await scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
          console.log('Scanner stopped');
        }
        await scannerRef.current.clear();
        console.log('Scanner cleared');
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
          <Camera className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {cameraPermission === 'denied' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Camera access is required to scan QR codes. Please enable camera permissions in your browser settings and refresh the page.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {!isScanning && !isInitializing ? (
            <Button
              onClick={startScanning}
              className="w-full"
              size="lg"
              disabled={cameraPermission === 'denied'}
            >
              <Camera className="h-5 w-5 mr-2" />
              Start Camera
            </Button>
          ) : isInitializing ? (
            <Button
              disabled
              className="w-full"
              size="lg"
            >
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Initializing Camera...
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <X className="h-5 w-5 mr-2" />
              Stop Camera
            </Button>
          )}

          {/* QR Reader Container - Always rendered */}
          <div
            id="qr-reader"
            className={`w-full ${isScanning ? 'block' : 'hidden'}`}
            style={{ 
              minHeight: isScanning ? '300px' : '0',
              width: '100%',
              maxWidth: '100%',
            }}
          />

          {isScanning && (
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium text-primary">
                📷 Camera Active - Point at QR Code
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Position the QR code within the scanning area
              </p>
            </div>
          )}

          {!isScanning && !isInitializing && (
            <div className="text-center p-8 border-2 border-dashed border-border rounded-lg bg-muted/30">
              <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click "Start Camera" to scan QR code
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Position the QR code within the camera frame
              </p>
            </div>
          )}
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            How to use:
          </h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Click "Start Camera" button</li>
            <li>Allow camera access when prompted</li>
            <li>Point your camera at the teacher's QR code</li>
            <li>Wait for automatic detection</li>
            <li>Your attendance will be marked instantly</li>
          </ol>
        </div>

        {/* Troubleshooting Tips */}
        <div className="bg-card p-3 rounded-lg border text-xs">
          <p className="font-semibold mb-1">Camera not working?</p>
          <ul className="text-muted-foreground space-y-1 list-disc list-inside">
            <li>Make sure you're using HTTPS (required for camera)</li>
            <li>Check browser permissions for camera access</li>
            <li>Try refreshing the page</li>
            <li>Use a different browser if issues persist</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
