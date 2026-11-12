import { Button } from '@/components/ui/button';
import { jsonRequest } from '@/lib/json-request';
import type { Wine, WineValuation } from '@/types/wine';
import { ExternalLink, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FinancialState {
    estimated_value: number | null;
    valuation: WineValuation | null;
}

const money = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' });

export default function WineFinancials({
    wine,
    availableBottleCount,
    onValueChange,
}: {
    wine: Wine;
    availableBottleCount: number;
    onValueChange?: (value: number) => void;
}) {
    const [financials, setFinancials] = useState<FinancialState>({
        estimated_value: wine.estimated_value,
        valuation: wine.valuation ?? null,
    });
    const [valuing, setValuing] = useState(false);
    const [applying, setApplying] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const active = financials.valuation?.status === 'pending' || financials.valuation?.status === 'processing';

    useEffect(() => {
        if (!active) return;
        const timer = window.setInterval(async () => {
            try {
                const result = await jsonRequest<FinancialState>(`/wines/${wine.id}/valuation`, {}, 'GET');
                setFinancials(result);
            } catch {
                setError('Kunde inte uppdatera värderingen. Försök igen.');
                setFinancials((current) => ({ ...current, valuation: current.valuation ? { ...current.valuation, status: 'failed' } : null }));
                window.clearInterval(timer);
            }
        }, 2500);

        return () => window.clearInterval(timer);
    }, [active, wine.id]);

    async function startValuation() {
        setValuing(true);
        setError(null);
        setMessage(null);
        try {
            const result = await jsonRequest<{ valuation: WineValuation }>(`/wines/${wine.id}/valuation`);
            setFinancials((current) => ({ ...current, valuation: result.valuation }));
            setMessage('Värderingen har lagts i kön.');
        } catch (exception) {
            setError(exception instanceof Error ? exception.message : 'Värderingen kunde inte startas.');
        } finally {
            setValuing(false);
        }
    }

    async function applyValuation() {
        if (!financials.valuation) return;
        setApplying(true);
        setError(null);
        setMessage(null);
        try {
            const result = await jsonRequest<{ estimated_value: number }>(`/wine-valuations/${financials.valuation.id}`, {}, 'PATCH');
            setFinancials((current) => ({
                ...current,
                estimated_value: result.estimated_value,
                valuation: current.valuation ? { ...current.valuation, reviewed_at: new Date().toISOString() } : null,
            }));
            onValueChange?.(result.estimated_value);
            setMessage('Det uppskattade värdet har sparats på vinet.');
        } catch (exception) {
            setError(exception instanceof Error ? exception.message : 'Värdet kunde inte godkännas.');
        } finally {
            setApplying(false);
        }
    }

    const valuation = financials.valuation;

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3">
                <div>
                    <p className="text-muted-foreground mt-1 text-xs">Gemensamt värde per standardflaska om 750 ml.</p>
                </div>
                <Button variant="secondary" className="w-full" disabled={active || valuing} onClick={startValuation}>
                    {(active || valuing) && <LoaderCircle className="animate-spin" />}
                    {valuation ? 'Uppdatera värdering' : 'Värdera vinet'}
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-[9px]">
                <p className="bg-background rounded-[18px] p-[15px]">
                    <span className="text-muted-foreground block text-xs">Värde per flaska</span>
                    <span className="text-[27px] font-semibold tracking-[-1px]">
                        {financials.estimated_value === null ? 'Ej angivet' : money.format(financials.estimated_value)}
                    </span>
                </p>
                <p className="bg-background rounded-[18px] p-[15px]">
                    <span className="text-muted-foreground block text-xs">Totalt för {availableBottleCount} flaskor</span>
                    <span className="text-[27px] font-semibold tracking-[-1px]">
                        {financials.estimated_value === null ? 'Ej angivet' : money.format(financials.estimated_value * availableBottleCount)}
                    </span>
                </p>
            </div>
            {active && (
                <p className="text-muted-foreground text-sm">
                    {valuation?.status === 'processing' ? 'Söker priser och verifierar källor…' : 'Väntar i kön…'}
                </p>
            )}
            {valuation?.status === 'failed' && <p className="text-destructive text-sm">{valuation.error_message ?? 'Värderingen misslyckades.'}</p>}
            {valuation?.status === 'completed' && (
                <div className="border-border space-y-3 border-t pt-4">
                    <div>
                        <p className="text-muted-foreground text-xs">Senaste värderingsförslag</p>
                        <p className="text-[27px] font-semibold tracking-[-1px]">
                            {valuation.estimated_value === null ? 'Inget verifierbart värde hittades' : money.format(valuation.estimated_value)}
                        </p>
                        {valuation.valued_at && (
                            <p className="text-muted-foreground text-xs">Kontrollerat {new Date(valuation.valued_at).toLocaleDateString('sv-SE')}</p>
                        )}
                    </div>
                    {valuation.basis && <p className="text-muted-foreground text-sm leading-relaxed">{valuation.basis}</p>}
                    {!!valuation.sources?.length && (
                        <div className="flex flex-wrap gap-2">
                            {valuation.sources.map((source) => (
                                <a
                                    key={source.url}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary inline-flex items-center gap-1 text-xs underline underline-offset-2"
                                >
                                    {source.title}
                                    <ExternalLink className="size-3" />
                                </a>
                            ))}
                        </div>
                    )}
                    {!!valuation.warnings?.length && (
                        <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-xs">
                            {valuation.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                            ))}
                        </ul>
                    )}
                    {valuation.estimated_value !== null && (
                        <Button size="sm" disabled={applying || valuation.reviewed_at !== null} onClick={applyValuation}>
                            {valuation.reviewed_at ? 'Värdet är godkänt' : applying ? 'Sparar…' : 'Godkänn uppskattat värde'}
                        </Button>
                    )}
                </div>
            )}
            {message && <p className="native-success">{message}</p>}
            {error && (
                <p role="alert" className="native-error">
                    {error}
                </p>
            )}
        </section>
    );
}
