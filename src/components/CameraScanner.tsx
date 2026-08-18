import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, ScanLine, X, AlertCircle, Loader2 } from 'lucide-react';
import { classNames } from '@/lib/utils';

interface CameraScannerProps {
  onScan: (value: string) => void;
}

export function CameraScanner({ onScan }: CameraScannerProps) {
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastDetected, setLastDetected] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectIntervalRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && !('BarcodeDetector' in window)) {
      setSupported(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
    setLoading(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      // The video element is always in the DOM (hidden when off), so the ref is valid.
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach(t => t.stop());
        setError('Video element not available.');
        setLoading(false);
        return;
      }

      video.srcObject = stream;

      // Wait for metadata to load before playing to avoid blank frames
      if (video.readyState < 1) {
        await new Promise<void>(resolve => {
          video.addEventListener('loadedmetadata', () => resolve(), { once: true });
        });
      }

      await video.play();

      setCameraOn(true);
      setLoading(false);

      // Start barcode detection if supported
      if ('BarcodeDetector' in window) {
        let detector: any;
        try {
          const formats = await (window as any).BarcodeDetector.getSupportedFormats();
          detector = new (window as any).BarcodeDetector({ formats });
        } catch {
          detector = new (window as any).BarcodeDetector();
        }
        detectIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const value = barcodes[0].rawValue;
              if (value && Date.now() - lastScanTimeRef.current > 1500) {
                lastScanTimeRef.current = Date.now();
                setLastDetected(value);
                onScan(value);
              }
            }
          } catch {
            // detection frame may fail occasionally — ignore
          }
        }, 300);
      }
    } catch (err: any) {
      setLoading(false);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        setError('No camera found on this device.');
      } else {
        setError(err.message || 'Failed to start camera.');
      }
    }
  }, [onScan]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const toggleCamera = () => {
    if (cameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={toggleCamera}
          disabled={loading}
          className={classNames(
            'btn !text-xs !py-1.5',
            cameraOn
              ? 'bg-error-600 text-white hover:bg-error-700'
              : 'bg-ink-800 dark:bg-ink-700 text-white hover:bg-ink-900 dark:hover:bg-ink-600'
          )}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : cameraOn ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
          {loading ? 'Starting...' : cameraOn ? 'Stop Camera' : 'Start Camera Scan'}
        </button>
        {cameraOn && !supported && (
          <span className="text-[10px] text-ink-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Auto-detect not supported — point camera at barcode and type what you see
          </span>
        )}
        {cameraOn && supported && (
          <span className="text-[10px] text-success-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse-soft" />
            Scanning for barcodes...
          </span>
        )}
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800 flex items-center gap-2 text-xs text-error-700 dark:text-error-400 animate-fade-in mb-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Video is always in the DOM so the ref is valid when we attach the stream.
          Hidden when camera is off to avoid a blank black box. */}
      <div className={classNames(
        'relative rounded-xl overflow-hidden border-2 bg-ink-950 transition-all',
        cameraOn ? 'border-primary-300 dark:border-primary-700 animate-scale-in' : 'border-transparent h-0 overflow-hidden'
      )}>
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-auto max-h-64 object-cover"
        />

        {cameraOn && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-ink-950/20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-primary-400 rounded-lg shadow-lg">
              <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-primary-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-primary-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-primary-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-primary-400 rounded-br-lg" />
              <div className="absolute left-2 right-2 h-0.5 bg-primary-400 shadow-[0_0_8px_rgba(43,125,166,0.8)] animate-[scanline_2s_ease-in-out_infinite]" />
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-ink-950/70 backdrop-blur-sm">
              <span className="text-[10px] text-white font-medium flex items-center gap-1.5">
                <ScanLine className="w-3 h-3" />
                {supported ? 'Align barcode within frame' : 'Camera active — type SKU below'}
              </span>
            </div>
          </div>
        )}

        {lastDetected && cameraOn && (
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-success-600 text-white text-[10px] font-mono font-semibold animate-fade-in">
            Detected: {lastDetected}
          </div>
        )}
      </div>
    </div>
  );
}
