import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CircleCheckBig, PackageCheck, Printer, ScanLine } from 'lucide-react';
import { fetchActiveRentalByQr } from '@/api/rentals';
import { getErrorCode, getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Rental } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader, PrintPortal } from '@/components/data/page';
import { Stepper } from '@/components/data/stepper';
import { ScanStep } from '@/components/qr/scan-step';
import { ReturnReceipt } from '@/features/shared/documents';
import { ReturnAssessment } from './return-assessment';

type Stage = 'scan' | 'assess' | 'done';
const STAGES: Stage[] = ['scan', 'assess', 'done'];

const ReturnsPage = () => {
    const [stage, setStage] = useState<Stage>('scan');
    const [rental, setRental] = useState<Rental | null>(null);
    const [returned, setReturned] = useState<Rental | null>(null);
    const [looking, setLooking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lookup = async (code: string) => {
        setLooking(true);
        setError(null);
        try {
            setRental(await fetchActiveRentalByQr(code));
            setStage('assess');
        } catch (err) {
            const code_ = getErrorCode(err);
            setError(
                code_ === 'NOT_RENTED' ? `This item isn't out on rental, so there is nothing to return. (${code})`
                    : code_ === 'QR_NOT_FOUND' ? `No inventory item matches "${code}". Check the label and try again.`
                        : getErrorMessage(err),
            );
        } finally {
            setLooking(false);
        }
    };

    const restart = () => {
        setStage('scan');
        setRental(null);
        setReturned(null);
        setError(null);
    };

    return (
        <>
            <PageHeader
                title="QR Return"
                description="Scan a returned instrument to check its condition, settle late fees and put it back in stock."
                actions={<Button variant="outline" asChild><Link to="/admin/products"><PackageCheck /> All rentals</Link></Button>}
            />
            <Stepper steps={['Scan item', 'Check condition', 'Receipt']} current={stage === 'done' ? STAGES.length : STAGES.indexOf(stage)} />

            {stage === 'scan' && (
                <ScanStep
                    icon={ScanLine}
                    title="Scan the returned instrument"
                    description="We'll find its active rental, calculate any late fee and update the stock automatically."
                    onCode={lookup}
                    busy={looking}
                    error={error}
                />
            )}

            {stage === 'assess' && rental && (
                <Card className="mx-auto max-w-3xl p-5 sm:p-6">
                    <ReturnAssessment
                        rental={rental}
                        cancelLabel="Scan a different item"
                        onCancel={restart}
                        onDone={done => { setReturned(done); setStage('done'); }}
                    />
                </Card>
            )}

            {stage === 'done' && returned && (
                <div className="mx-auto max-w-3xl space-y-5">
                    <Card className="flex flex-col gap-4 border-emerald-500/30 bg-emerald-500/5 p-5 sm:flex-row sm:items-center">
                        <CircleCheckBig className="size-10 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                        <div className="flex-1">
                            <p className="font-semibold">Return complete</p>
                            <p className="text-sm text-muted-foreground">
                                {returned.rentalId} · total {formatCurrency(returned.totalAmount)} · {returned.paymentStatus}
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button variant="outline" onClick={() => window.print()}><Printer /> Print receipt</Button>
                            <Button onClick={restart}><ArrowLeft /> Return another</Button>
                        </div>
                    </Card>
                    <ReturnReceipt rental={returned} />
                    <PrintPortal><ReturnReceipt rental={returned} /></PrintPortal>
                </div>
            )}
        </>
    );
};

export default ReturnsPage;
