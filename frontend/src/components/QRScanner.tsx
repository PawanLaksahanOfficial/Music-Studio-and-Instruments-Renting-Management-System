import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';

interface QRScannerProps {
    onScan: (decoded: string) => void;
    onError?: (message: string) => void;
}

/**
 * Camera QR reader with a manual-entry fallback.
 *
 * The fallback matters: cameras get denied, unavailable, or simply refuse to
 * focus on a scuffed sticker, and a clerk still has to complete the job.
 */
const QRScanner = ({ onScan, onError }: QRScannerProps) => {
    const regionId = useId().replace(/:/g, '');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [scanning, setScanning] = useState(false);
    const [cameras, setCameras] = useState<CameraDevice[]>([]);
    const [cameraId, setCameraId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [manual, setManual] = useState('');

    useEffect(() => {
        Html5Qrcode.getCameras()
            .then(devices => {
                setCameras(devices);
                // Prefer a rear camera — on a phone that is the one pointed at the label.
                const rear = devices.find(d => /back|rear|environment/i.test(d.label));
                setCameraId(rear?.id ?? devices[0]?.id ?? '');
            })
            .catch(() => setError('No camera available. Enter the code manually below.'));

        return () => {
            // Release the camera when the component goes away, or the light
            // stays on and the device stays locked to this page.
            const scanner = scannerRef.current;
            if (scanner?.isScanning) {
                scanner.stop().then(() => scanner.clear()).catch(() => undefined);
            }
        };
    }, []);

    const start = async () => {
        if (!cameraId) {
            setError('No camera selected.');
            return;
        }
        setError(null);
        try {
            const scanner = new Html5Qrcode(regionId);
            scannerRef.current = scanner;
            await scanner.start(
                cameraId,
                { fps: 10, qrbox: { width: 250, height: 250 } },
                decoded => {
                    void stop();
                    onScan(decoded);
                },
                () => {
                    // Per-frame decode misses are normal; only surface real failures.
                }
            );
            setScanning(true);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Could not start the camera. Check browser permissions.';
            setError(message);
            onError?.(message);
        }
    };

    const stop = async () => {
        const scanner = scannerRef.current;
        if (!scanner?.isScanning) return;
        try {
            await scanner.stop();
            await scanner.clear();
        } catch {
            // Already stopped — nothing to clean up.
        }
        setScanning(false);
    };

    const submitManual = (e: React.FormEvent) => {
        e.preventDefault();
        const code = manual.trim();
        if (!code) return;
        onScan(code);
        setManual('');
    };

    return (
        <div className="stack">
            {error && (
                <div className="alert alert--warning" role="alert">
                    {error}
                </div>
            )}

            <div id={regionId} className="qr-reader" style={{ minHeight: scanning ? 260 : 0 }} />

            <div className="row row--wrap">
                {cameras.length > 1 && (
                    <select
                        className="select"
                        value={cameraId}
                        onChange={e => setCameraId(e.target.value)}
                        disabled={scanning}
                        aria-label="Camera"
                        style={{ width: 'auto' }}
                    >
                        {cameras.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.label || 'Camera'}
                            </option>
                        ))}
                    </select>
                )}
                {scanning ? (
                    <button type="button" className="btn" onClick={() => void stop()}>
                        Stop camera
                    </button>
                ) : (
                    <button type="button" className="btn btn--primary" onClick={() => void start()} disabled={!cameraId}>
                        📷 Start camera
                    </button>
                )}
            </div>

            <form onSubmit={submitManual} className="row row--wrap">
                <label className="sr-only" htmlFor={`${regionId}-manual`}>
                    Enter QR code manually
                </label>
                <input
                    id={`${regionId}-manual`}
                    className="input grow"
                    placeholder="Or type the code, e.g. ELVI-A1B2C3"
                    value={manual}
                    onChange={e => setManual(e.target.value)}
                />
                <button type="submit" className="btn" disabled={!manual.trim()}>
                    Look up
                </button>
            </form>
        </div>
    );
};

export default QRScanner;
