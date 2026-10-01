import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export type CameraErrorKind = 'permission-denied' | 'no-camera' | 'in-use' | 'insecure' | 'unknown';

interface QrScannerProps {
  /** Camera is started while true and stopped when false. */
  running: boolean;
  /** Freezes the feed (and decoding) while a scan result is on screen. */
  paused: boolean;
  onDecode: (text: string) => void;
  onCameraError: (kind: CameraErrorKind, message: string) => void;
  onStarted?: () => void;
}

const READER_ID = 'svcet-qr-reader';

export function describeCameraError(err: unknown): { kind: CameraErrorKind; message: string } {
  // html5-qrcode rejects with a plain string such as
  // "Error getting userMedia, error = NotAllowedError: Permission denied",
  // so match on the DOMException name wherever it appears (err.name or inside the text).
  const raw = `${(err as any)?.name || ''} ${(err as any)?.message || ''} ${typeof err === 'string' ? err : ''}`;

  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return {
      kind: 'insecure',
      message: 'Camera access needs a secure connection. Open this site over HTTPS (or on localhost) to use the scanner.',
    };
  }
  if (/NotAllowedError|SecurityError|permission|denied|not allowed/i.test(raw)) {
    return {
      kind: 'permission-denied',
      message: 'Camera permission was denied. Allow camera access in your browser settings, then start the camera again.',
    };
  }
  if (/NotReadableError|TrackStartError|could not start video|in use|not readable/i.test(raw)) {
    return { kind: 'in-use', message: 'The camera is being used by another app or browser tab. Close it and try again.' };
  }
  if (/NotFoundError|OverconstrainedError|DevicesNotFoundError|no camera|requested device|not found/i.test(raw)) {
    return { kind: 'no-camera', message: 'No camera was found on this device.' };
  }
  return { kind: 'unknown', message: 'Unable to start the camera. Please try again or use manual entry.' };
}

export const QrScanner: React.FC<QrScannerProps> = ({ running, paused, onDecode, onCameraError, onStarted }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Serialises start/stop calls; React StrictMode mounts effects twice in development
  const opRef = useRef<Promise<void>>(Promise.resolve());
  const pausedRef = useRef<boolean>(paused);
  const onDecodeRef = useRef(onDecode);
  const onErrorRef = useRef(onCameraError);
  const onStartedRef = useRef(onStarted);

  onDecodeRef.current = onDecode;
  onErrorRef.current = onCameraError;
  onStartedRef.current = onStarted;

  useEffect(() => {
    pausedRef.current = paused;
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const state = scanner.getState();
      if (paused && state === Html5QrcodeScannerState.SCANNING) scanner.pause(true);
      if (!paused && state === Html5QrcodeScannerState.PAUSED) scanner.resume();
    } catch {
      // Scanner not in a pausable state; the pausedRef guard still blocks duplicate decodes
    }
  }, [paused]);

  useEffect(() => {
    if (!running) return;
    let cancelled = false;

    const start = async () => {
      if (cancelled) return;
      try {
        const scanner = new Html5Qrcode(READER_ID, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        });
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (w: number, h: number) => {
              const size = Math.max(160, Math.floor(Math.min(w, h) * 0.72));
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            if (pausedRef.current) return;
            onDecodeRef.current(decodedText);
          },
          undefined
        );
        if (cancelled) {
          // Stopped while the camera was still starting
          await scanner.stop().catch(() => undefined);
          scanner.clear();
          return;
        }
        scannerRef.current = scanner;
        onStartedRef.current?.();
      } catch (err) {
        if (cancelled) return;
        const { kind, message } = describeCameraError(err);
        onErrorRef.current(kind, message);
      }
    };

    const stop = async () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (!scanner) return;
      try {
        const state = scanner.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scanner.stop();
        }
        scanner.clear();
      } catch {
        // Already stopped
      }
    };

    opRef.current = opRef.current.then(start);
    return () => {
      cancelled = true;
      opRef.current = opRef.current.then(stop);
    };
  }, [running]);

  return <div id={READER_ID} className="w-full [&_video]:w-full [&_video]:rounded-2xl [&_video]:object-cover" />;
};
