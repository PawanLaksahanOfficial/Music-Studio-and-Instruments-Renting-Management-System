import QRCodeLib from 'qrcode';

/** Triggers a PNG download of a QR code generated on the fly. */
export const downloadQRCode = async (value: string, filename: string, size = 512) => {
    const dataUrl = await QRCodeLib.toDataURL(value, {
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
    });
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
};
