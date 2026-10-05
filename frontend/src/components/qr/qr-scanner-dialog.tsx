import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CameraOff, Loader2, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScan: (code: string) => void;
}

/** Camera QR scanner in a dialog. Prefers the rear camera on phones. Mount it only while open. */
const QrScannerDialog = ({ open, onOpenChange, onScan }: Props) => {
    const regionId = `qr-region-${useId().replace(/:/g, '')}`;
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const handledRef = useRef(false);
    const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
    const [cameraIndex, setCameraIndex] = useState(0);
    const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
    const [error, setError] = useState('');

    // Latest callbacks without restarting the camera when the parent re-renders.
    const callbacks = useRef({ onScan, onOpenChange });
    useEffect(() => {
        callbacks.current = { onScan, onOpenChange };
    });

    // Enumerate cameras when opened (this triggers the browser permission prompt).
    useEffect(() => {
        if (!open) return;
        Html5Qrcode.getCameras()
            .then(devices => {
                if (!devices.length) throw new Error('No camera was found on this device.');
                setCameras(devices);
                const rear = devices.findIndex(d => /back|rear|environment/i.test(d.label));
                setCameraIndex(rear >= 0 ? rear : 0);
            })
            .catch((err: unknown) => {
                setStatus('error');
                setError(err instanceof Error && err.message.includes('camera') ? err.message : 'Camera access was blocked. Allow camera access in your browser settings, or type the code instead.');
            });
    }, [open]);

    // Start (or restart) scanning with the chosen camera.
    useEffect(() => {
        const camera = cameras[cameraIndex];
        if (!open || !camera) return;
        let cancelled = false;
        const scanner = new Html5Qrcode(regionId, { verbose: false });
        scannerRef.current = scanner;

        scanner
            .start(
                camera.id,
                { fps: 12, qrbox: (w, h) => { const size = Math.floor(Math.min(w, h) * 0.7); return { width: size, height: size }; } },
                decoded => {
                    if (handledRef.current) return;
                    handledRef.current = true;
                    navigator.vibrate?.(60);
                    void scanner.stop().catch(() => undefined).finally(() => {
                        callbacks.current.onOpenChange(false);
                        callbacks.current.onScan(decoded.trim());
                    });
                },
                () => undefined,
            )
            .then(() => !cancelled && setStatus('scanning'))
            .catch(() => {
                if (cancelled) return;
                setStatus('error');
                setError('The camera could not be started. It may be in use by another app.');
            });

        return () => {
            cancelled = true;
            if (scanner.isScanning) void scanner.stop().catch(() => undefined);
        };
    }, [open, cameras, cameraIndex, regionId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md">
                <DialogHeader>
                    <DialogTitle>Scan QR code</DialogTitle>
                    <DialogDescription>Hold the instrument&apos;s QR label inside the frame.</DialogDescription>
                </DialogHeader>
                <DialogBody className="pb-6">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-950 sm:aspect-[4/3]">
                        <div id={regionId} className="size-full [&_video]:size-full [&_video]:object-cover" />
                        {status === 'starting' && (
                            <div className="absolute inset-0 grid place-items-center text-white/80">
                                <div className="flex flex-col items-center gap-3 text-sm"><Loader2 className="size-6 animate-spin" /> Starting camera…</div>
                            </div>
                        )}
                        {status === 'scanning' && (
                            <div className="pointer-events-none absolute inset-[15%] rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                                <span className="absolute inset-x-4 h-0.5 animate-scan-line rounded-full bg-violet-400 shadow-[0_0_12px_2px] shadow-violet-400/70" />
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
                                <div className="flex flex-col items-center gap-3">
                                    <CameraOff className="size-8 text-white/70" />
                                    <p className="text-sm text-white/85">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    {cameras.length > 1 && status !== 'error' && (
                        <Button variant="outline" className="mt-3 w-full" onClick={() => setCameraIndex(i => (i + 1) % cameras.length)}>
                            <SwitchCamera /> Switch camera
                        </Button>
                    )}
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
};

export default QrScannerDialog;
