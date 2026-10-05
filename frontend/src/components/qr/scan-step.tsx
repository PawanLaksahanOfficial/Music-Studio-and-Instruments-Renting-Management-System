import { lazy, Suspense, useState, type FormEvent, type ReactNode } from 'react';
import { Camera, Keyboard, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/field';

const QrScannerDialog = lazy(() => import('./qr-scanner-dialog'));

interface ScanStepProps {
    icon: LucideIcon;
    title: string;
    description: ReactNode;
    onCode: (code: string) => void;
    busy?: boolean;
    error?: string | null;
}

/** First step of the QR flows: scan with the camera, or type the code printed under the QR. */
export const ScanStep = ({ icon: Icon, title, description, onCode, busy, error }: ScanStepProps) => {
    const [scannerOpen, setScannerOpen] = useState(false);
    const [manual, setManual] = useState('');

    const submitManual = (e: FormEvent) => {
        e.preventDefault();
        // QR ids are upper-case (ELVI-XXXXXXXX); the field only displays upper-case.
        if (manual.trim()) onCode(manual.trim().toUpperCase());
    };

    return (
        <Card className="mx-auto max-w-xl overflow-hidden">
            <div className="relative flex flex-col items-center bg-gradient-to-b from-primary/8 to-transparent px-6 pb-6 pt-10 text-center">
                <span className="relative mb-5 grid size-20 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                    <Icon className="size-9" aria-hidden />
                    <span className="absolute inset-0 animate-ping rounded-3xl bg-primary/20 [animation-duration:2.4s]" aria-hidden />
                </span>
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
                <Button size="lg" className="mt-6 w-full sm:w-auto" onClick={() => setScannerOpen(true)} loading={busy}>
                    <Camera /> Scan with camera
                </Button>
            </div>
            <div className="border-t px-6 py-5">
                <form onSubmit={submitManual} className="flex flex-col gap-3">
                    <label htmlFor="manual-code" className="flex items-center gap-2 text-sm font-medium">
                        <Keyboard className="size-4 text-muted-foreground" aria-hidden /> No camera? Enter the code
                    </label>
                    <div className="flex gap-2">
                        <Input
                            id="manual-code"
                            value={manual}
                            onChange={e => setManual(e.target.value)}
                            placeholder="ELVI-3F9A1C2B"
                            autoCapitalize="characters"
                            autoComplete="off"
                            className="font-mono uppercase placeholder:normal-case"
                        />
                        <Button type="submit" variant="secondary" disabled={!manual.trim() || busy}>Look up</Button>
                    </div>
                    <FormError message={error} />
                </form>
            </div>
            {scannerOpen && (
                <Suspense fallback={null}>
                    <QrScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScan={onCode} />
                </Suspense>
            )}
        </Card>
    );
};
