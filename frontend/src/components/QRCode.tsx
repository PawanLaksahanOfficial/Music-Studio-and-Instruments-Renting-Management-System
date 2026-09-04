import { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
    value: string;
    size?: number;
    label?: string;
}

/**
 * Renders the QR locally on a canvas.
 *
 * The previous implementation used an `api.qrserver.com` image URL, which sent
 * item names, serial numbers and prices to a third party on every render and
 * left the feature broken without internet access.
 */
export const QRCode = ({ value, size = 220, label }: QRCodeProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        QRCodeLib.toCanvas(canvas, value, {
            width: size,
            margin: 1,
            // Fixed black-on-white: a themed QR risks failing contrast for scanners.
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'M',
        }).catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not render QR code'));
    }, [value, size]);

    if (error) {
        return (
            <div className="alert alert--danger" role="alert">
                {error}
            </div>
        );
    }

    return (
        <div className="qr-frame">
            <canvas ref={canvasRef} role="img" aria-label={label ?? `QR code for ${value}`} />
        </div>
    );
};

export default QRCode;
