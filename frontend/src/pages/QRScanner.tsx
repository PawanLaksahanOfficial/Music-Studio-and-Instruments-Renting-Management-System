import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

const SCANNER_ID = 'elvi-qr-region';

const QRScanner: React.FC<Props> = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const hasStarted = useRef(false);
    const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
    const [selectedCam, setSelectedCam] = useState('');
    const [started, setStarted]  = useState(false);
    const [error, setError]  = useState('');

    // 1. enumerate cameras on mount
    useEffect(() => {
        Html5Qrcode.getCameras()
            .then(devices => {
                if (!devices.length) { setError('No cameras found on this device.'); return; }
                setCameras(devices);
                const back = devices.find(d =>
                    d.label.toLowerCase().includes('back') ||
                    d.label.toLowerCase().includes('environment')
                );
                setSelectedCam((back || devices[0]).id);
            })
            .catch(() => setError('Camera permission denied. Please allow access and retry.'));
    }, []);

    // 2. start scanner when camera is chosen
    useEffect(() => {
        if (!selectedCam || hasStarted.current) return;
        const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
        scannerRef.current = scanner;
        hasStarted.current = true;

        scanner
            .start(
                selectedCam,
                { fps: 12, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
                (text) => { scanner.stop().catch(() => {}); onScanSuccess(text); },
                () => { /* no-match frame, ignore */ }
            )
            .then(() => setStarted(true))
            .catch(err => { hasStarted.current = false; setError(`Could not start camera: ${err}`); });

        return () => { if (scanner.isScanning) scanner.stop().catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCam]);

    const switchCam = async (id: string) => {
        const s = scannerRef.current;
        if (s?.isScanning) await s.stop().catch(() => {});
        hasStarted.current = false;
        setStarted(false);
        setSelectedCam(id);
    };

    const corners = [
        { top: 0,    left: 0,    borderTop: '3px solid #3b82f6', borderLeft: '3px solid #3b82f6' },
        { top: 0,    right: 0,   borderTop: '3px solid #3b82f6', borderRight: '3px solid #3b82f6' },
        { bottom: 0, left: 0,    borderBottom: '3px solid #3b82f6', borderLeft: '3px solid #3b82f6' },
        { bottom: 0, right: 0,   borderBottom: '3px solid #3b82f6', borderRight: '3px solid #3b82f6' },
    ];

    return (
        <div style={S.overlay}>
            <div style={S.modal}>
                {/* title */}
                <div style={S.titleRow}>
                    <div>
                        <div style={S.title}>📷 Scan Instrument QR Code</div>
                        <div style={S.sub}>Point your webcam at the QR code on screen or on the instrument</div>
                    </div>
                    <button onClick={onClose} style={S.closeBtn}>✕</button>
                </div>

                {/* camera picker */}
                {cameras.length > 1 && (
                    <select value={selectedCam} onChange={e => switchCam(e.target.value)} style={S.select}>
                        {cameras.map(c => <option key={c.id} value={c.id}>{c.label || c.id}</option>)}
                    </select>
                )}

                {/* viewport */}
                <div style={S.viewport}>
                    <div id={SCANNER_ID} style={{ width: '100%' }} />
                    {!started && !error && (
                        <div style={S.loading}>
                            <div style={S.spinner} />
                            <p style={{ color: '#fff', marginTop: 10, fontSize: 13 }}>Starting camera…</p>
                        </div>
                    )}
                    {started && (
                        <div style={S.frame}>
                            {corners.map((c, i) => <div key={i} style={{ ...S.corner, ...c }} />)}
                        </div>
                    )}
                </div>

                {error && <div style={S.errBox}>⚠️ {error}</div>}
                <p style={S.hint}>{started ? '🟢 Scanner active — align QR within the frame' : '⏳ Initialising camera…'}</p>
                <button onClick={onClose} style={S.cancelBtn}>Cancel</button>
            </div>
        </div>
    );
};

const S: Record<string, React.CSSProperties> = {
    overlay:  { position:'fixed', inset:0, background:'rgba(10,15,30,0.82)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:20, backdropFilter:'blur(4px)' },
    modal:    { background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:460, boxShadow:'0 24px 64px rgba(0,0,0,0.45)' },
    titleRow: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 },
    title:    { fontSize:17, fontWeight:700, color:'#0f172a' },
    sub:      { fontSize:12, color:'#64748b', marginTop:3 },
    closeBtn: { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#64748b', lineHeight:1 },
    select:   { width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:13, marginBottom:12, cursor:'pointer', outline:'none' },
    viewport: { position:'relative', borderRadius:10, overflow:'hidden', background:'#000', marginBottom:14, minHeight:280 },
    loading:  { position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.7)' },
    spinner:  { width:36, height:36, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.15)', borderTopColor:'#3b82f6', animation:'spin 0.8s linear infinite' },
    frame:    { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:220, height:220, pointerEvents:'none' },
    corner:   { position:'absolute', width:22, height:22 },
    errBox:   { background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#b91c1c', marginBottom:12 },
    hint:     { textAlign:'center', fontSize:12, color:'#64748b', marginBottom:14, margin:'0 0 14px' },
    cancelBtn:{ width:'100%', padding:10, borderRadius:8, border:'1.5px solid #e2e8f0', background:'transparent', color:'#64748b', fontSize:14, cursor:'pointer' },
};

export default QRScanner;