import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRScannerComponentStyles as styles } from '../styles/QRScannerComponentStyles';

interface Props {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

const SCANNER_ID = 'elvi-qr-scanner-region';

const QRScanner: React.FC<Props> = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError]       = useState('');
    const [started, setStarted]   = useState(false);
    const [cameras, setCameras]   = useState<{ id: string; label: string }[]>([]);
    const [selectedCam, setSelectedCam] = useState('');
    const hasStarted = useRef(false);

    // Load available cameras on mount
    useEffect(() => {
        Html5Qrcode.getCameras()
            .then(devices => {
                if (devices.length === 0) {
                    setError('No cameras found on this device.');
                    return;
                }
                setCameras(devices);
                // Prefer back/environment camera if available
                const backCam = devices.find(d =>
                    d.label.toLowerCase().includes('back') ||
                    d.label.toLowerCase().includes('environment')
                );
                setSelectedCam((backCam || devices[0]).id);
            })
            .catch(() => setError('Camera permission denied. Please allow camera access.'));
    }, []);

    // Start scanner when a camera is selected
    useEffect(() => {
        if (!selectedCam || hasStarted.current) return;

        const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
        scannerRef.current = scanner;
        hasStarted.current = true;

        scanner.start(
            selectedCam,
            {
                fps: 12,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            },
            (decodedText) => {
                scanner.stop().catch(() => {});
                onScanSuccess(decodedText);
            },
            () => {}
        )
        .then(() => setStarted(true))
        .catch(err => {
            hasStarted.current = false;
            setError(`Could not start camera: ${err}`);
        });

        return () => {
            if (scanner.isScanning) {
                scanner.stop().catch(() => {});
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCam]);

    const handleSwitchCamera = async (newId: string) => {
        const scanner = scannerRef.current;
        if (scanner?.isScanning) {
            await scanner.stop().catch(() => {});
        }
        hasStarted.current = false;
        setStarted(false);
        setSelectedCam(newId);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                {/* Header */}
                <div style={styles.titleRow}>
                    <div>
                        <div style={styles.title}>📷 QR / Barcode Scanner</div>
                        <div style={styles.subtitle}>Point camera at a QR code or barcode</div>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>✕</button>
                </div>

                {/* Camera selector */}
                {cameras.length > 1 && (
                    <div style={styles.controls}>
                        <select
                            value={selectedCam}
                            onChange={e => handleSwitchCamera(e.target.value)}
                            style={styles.select}
                        >
                            {cameras.map(c => (
                                <option key={c.id} value={c.id}>{c.label || `Camera ${c.id}`}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Scanner viewport */}
                <div style={styles.viewportWrap}>
                    <div id={SCANNER_ID} style={styles.scannerDiv} />
                    {!started && !error && (
                        <div style={styles.loadingOverlay}>
                            <div style={styles.spinner} />
                            <div style={styles.loadingText}>
                                Starting camera...
                            </div>
                        </div>
                    )}
                    {/* Scan frame overlay */}
                    {started && (
                        <div style={styles.scanFrame}>
                            <div style={styles.topLeft} />
                            <div style={styles.topRight} />
                            <div style={styles.bottomLeft} />
                            <div style={styles.bottomRight} />
                        </div>
                    )}
                </div>

                {error && (
                    <div style={styles.errorBox}>
                        ⚠️ {error}
                    </div>
                )}

                <div style={styles.hint}>
                    {started
                        ? '🟢 Scanner active — align QR code or barcode within the frame'
                        : '⏳ Initialising camera...'}
                </div>

                <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
            </div>
        </div>
    );
};

export default QRScanner;
