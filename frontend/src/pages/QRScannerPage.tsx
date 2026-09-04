import { useState } from 'react';
import { Link } from 'react-router-dom';
import { inventoryAPI } from '../services/api';
import { ApiError, errorMessage } from '../services/httpClient';
import QRScanner from '../components/QRScanner';
import { QRCode } from '../components/QRCode';
import { EmptyState, PageHeader, StatusBadge } from '../components/ui';
import { currency, formatDate } from '../utils/format';
import type { InventoryItem } from '../types/api';

/** Look up an instrument by scanning or typing its QR code. */
const QRScannerPage = () => {
    const [item, setItem] = useState<InventoryItem | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [looking, setLooking] = useState(false);

    const handleScan = async (decoded: string) => {
        setLooking(true);
        setError(null);
        setItem(null);
        try {
            setItem(await inventoryAPI.getByQR(decoded));
        } catch (err) {
            setError(
                err instanceof ApiError && err.status === 404
                    ? `No inventory item matches "${decoded}".`
                    : errorMessage(err)
            );
        } finally {
            setLooking(false);
        }
    };

    return (
        <>
            <PageHeader
                title="QR lookup"
                subtitle="Scan an instrument label to see its details and current status."
            />

            <div className="chart-grid">
                <div className="card">
                    <h2 className="card__title">Scan</h2>
                    <QRScanner onScan={handleScan} />
                </div>

                <div className="card">
                    <h2 className="card__title">Result</h2>

                    {looking && (
                        <div className="stack" aria-busy="true">
                            <div className="skeleton skeleton--text" style={{ width: '60%' }} />
                            <div className="skeleton" style={{ height: 120 }} />
                        </div>
                    )}

                    {!looking && error && (
                        <div className="alert alert--warning" role="alert">
                            {error}
                        </div>
                    )}

                    {!looking && !error && !item && (
                        <EmptyState icon="📷" title="Nothing scanned yet" hint="Scan a label or type a code to begin." />
                    )}

                    {!looking && item && (
                        <div className="stack">
                            <div className="row row--between">
                                <h3>{item.itemName}</h3>
                                <StatusBadge status={item.status} />
                            </div>

                            <div className="info-list">
                                {[
                                    ['Category', item.category],
                                    ['Brand / model', [item.brand, item.itemModel].filter(Boolean).join(' — ') || '—'],
                                    ['Serial', item.serialNumber],
                                    ['QR code ID', item.qrCodeId],
                                    ['Daily rate', currency(item.baseRentalPrice)],
                                    ['Purchased', formatDate(item.purchaseDate)],
                                    ['Last maintenance', formatDate(item.lastMaintenance)],
                                ].map(([label, value]) => (
                                    <div key={label} className="info-list__row">
                                        <span className="info-list__label">{label}</span>
                                        <span className="info-list__value">{value}</span>
                                    </div>
                                ))}
                            </div>

                            {item.notes && <p className="muted">{item.notes}</p>}

                            <QRCode value={item.qrCodeId} size={160} label={`QR code for ${item.itemName}`} />

                            {item.status === 'Rented' && (
                                <Link className="btn btn--primary" to="/admin/returns">
                                    Process its return →
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default QRScannerPage;
