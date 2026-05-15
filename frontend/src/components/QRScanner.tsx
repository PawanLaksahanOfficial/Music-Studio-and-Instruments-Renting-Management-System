import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

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
            // All formats: QR codes AND barcodes (Code128, EAN, etc.)
            // html5-qrcode detects both automatically
            (decodedText) => {
                // Stop immediately on first successful scan
                scanner.stop().catch(() => {});
                onScanSuccess(decodedText);
            },
            () => {
                // scan attempt with no result — ignore
            }
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
        <div style={overlay}>
            <div style={modal}>
                {/* Header */}
                <div style={titleRow}>
                    <div>
                        <div style={title}>📷 QR / Barcode Scanner</div>
                        <div style={subtitle}>Point camera at a QR code or barcode</div>
                    </div>
                    <button onClick={onClose} style={closeBtn}>✕</button>
                </div>

                {/* Camera selector */}
                {cameras.length > 1 && (
                    <div style={{ marginBottom: '12px' }}>
                        <select
                            value={selectedCam}
                            onChange={e => handleSwitchCamera(e.target.value)}
                            style={selectStyle}
                        >
                            {cameras.map(c => (
                                <option key={c.id} value={c.id}>{c.label || `Camera ${c.id}`}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Scanner viewport */}
                <div style={viewportWrap}>
                    <div id={SCANNER_ID} style={{ width: '100%' }} />
                    {!started && !error && (
                        <div style={loadingOverlay}>
                            <div style={spinner} />
                            <div style={{ color: '#fff', marginTop: '12px', fontSize: '14px' }}>
                                Starting camera...
                            </div>
                        </div>
                    )}
                    {/* Scan frame overlay */}
                    {started && (
                        <div style={scanFrame}>
                            <div style={{ ...corner, top: 0, left: 0, borderTop: '3px solid #3b82f6', borderLeft: '3px solid #3b82f6' }} />
                            <div style={{ ...corner, top: 0, right: 0, borderTop: '3px solid #3b82f6', borderRight: '3px solid #3b82f6' }} />
                            <div style={{ ...corner, bottom: 0, left: 0, borderBottom: '3px solid #3b82f6', borderLeft: '3px solid #3b82f6' }} />
                            <div style={{ ...corner, bottom: 0, right: 0, borderBottom: '3px solid #3b82f6', borderRight: '3px solid #3b82f6' }} />
                        </div>
                    )}
                </div>

                {error && (
                    <div style={errorBox}>
                        ⚠️ {error}
                    </div>
                )}

                <div style={hint}>
                    {started
                        ? '🟢 Scanner active — align QR code or barcode within the frame'
                        : '⏳ Initialising camera...'}
                </div>

                <button onClick={onClose} style={cancelBtn}>Cancel</button>
            </div>
        </div>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────
const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(10,15,30,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, padding: '20px', backdropFilter: 'blur(3px)',
};
const modal: React.CSSProperties = {
    backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
    width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
};
const titleRow: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '16px',
};
const title: React.CSSProperties = {
    fontSize: '17px', fontWeight: 700, color: '#0f172a',
};
const subtitle: React.CSSProperties = {
    fontSize: '12px', color: '#64748b', marginTop: '2px',
};
const closeBtn: React.CSSProperties = {
    background: 'none', border: 'none', fontSize: '20px',
    cursor: 'pointer', color: '#64748b', lineHeight: 1, padding: '2px',
};
const selectStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1.5px solid #e2e8f0', fontSize: '13px', color: '#1e293b',
    backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer',
};
const viewportWrap: React.CSSProperties = {
    position: 'relative', borderRadius: '10px', overflow: 'hidden',
    background: '#000', marginBottom: '14px', minHeight: '280px',
};
const loadingOverlay: React.CSSProperties = {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.7)',
};
const spinner: React.CSSProperties = {
    width: '36px', height: '36px', borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.2)',
    borderTopColor: '#3b82f6',
    animation: 'spin 0.8s linear infinite',
};
const scanFrame: React.CSSProperties = {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '220px', height: '220px',
    pointerEvents: 'none',
};
const corner: React.CSSProperties = {
    position: 'absolute', width: '22px', height: '22px',
};
const errorBox: React.CSSProperties = {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
    padding: '10px 14px', fontSize: '13px', color: '#b91c1c', marginBottom: '12px',
};
const hint: React.CSSProperties = {
    textAlign: 'center', fontSize: '12px', color: '#64748b', marginBottom: '16px',
};
const cancelBtn: React.CSSProperties = {
    width: '100%', padding: '10px', borderRadius: '8px',
    border: '1.5px solid #e2e8f0', background: 'transparent',
    color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
};

export default QRScanner;