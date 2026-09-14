import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { jsonRequest } from '@/lib/json-request';
import type { Bottle, BottleValuation } from '@/types/wine';
import { ExternalLink, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FinancialState {
    purchase_price: number | null;
    estimated_value: number | null;
    valuation: BottleValuation | null;
}

const money = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' });

export default function BottleFinancials({ bottle }: { bottle: Bottle }) {
    const [financials, setFinancials] = useState<FinancialState>({
        purchase_price: bottle.purchase_price,
        estimated_value: bottle.estimated_value,
        valuation: bottle.valuation ?? null,
    });
    const [purchasePrice, setPurchasePrice] = useState(bottle.purchase_price?.toString() ?? '');
    const [saving, setSaving] = useState(false);
    const [valuing, setValuing] = useState(false);
    const [applying, setApplying] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const active = financials.valuation?.status === 'pending' || financials.valuation?.status === 'processing';

    useEffect(() => {
        if (!active) return;
        const timer = window.setInterval(async () => {
            try {
                const result = await jsonRequest<FinancialState>(`/bottles/${bottle.id}/valuation`, {}, 'GET');
                setFinancials(result);
            } catch {
                window.clearInterval(timer);
            }
        }, 2500);

        return () => window.clearInterval(timer);
    }, [active, bottle.id]);

    async function savePurchasePrice() {
        setSaving(true);
        setError(null);
        setMessage(null);
        const normalized = purchasePrice.trim().replace(',', '.');
        const value = normalized === '' ? null : Number(normalized);
        if (value !== null && (!Number.isFinite(value) || value < 0)) {
            setError('Ange ett giltigt inköpspris som är noll eller högre.');
            setSaving(false);
            return;
        }
        try {
            const result = await jsonRequest<{ purchase_price: number | null }>(
                `/bottles/${bottle.id}/financials`,
                { purchase_price: value },
                'PATCH',
            );
            setFinancials((current) => ({ ...current, purchase_price: result.purchase_price }));
            setPurchasePrice(result.purchase_price?.toString() ?? '');
            setMessage('Inköpspriset har sparats.');
        } catch (exception) {
            setError(exception instanceof Error ? exception.message : 'Inköpspriset kunde inte sparas.');
        } finally {
            setSaving(false);
        }
    }

    async function startValuation() {
        setValuing(true);
        setError(null);
        setMessage(null);
        try {
            const result = await jsonRequest<{ valuation: BottleValuation }>(`/bottles/${bottle.id}/valuation`);
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
            const result = await jsonRequest<{ estimated_value: number }>(`/bottle-valuations/${financials.valuation.id}`, {}, 'PATCH');
            setFinancials((current) => ({
                ...current,
                estimated_value: result.estimated_value,
                valuation: current.valuation ? { ...current.valuation, reviewed_at: new Date().toISOString() } : null,
            }));
            setMessage('Det uppskattade värdet har sparats på flaskan.');
        } catch (exception) {
            setError(exception instanceof Error ? exception.message : 'Värdet kunde inte godkännas.');
        } finally {
            setApplying(false);
        }
    }

    const valuation = financials.valuation;

    return (
        <section className="border-border bg-muted/30 space-y-4 rounded-lg border p-4">
            <div>
                <h3 className="font-medium">Pris och värde per flaska</h3>
                <p className="text-muted-foreground mt-1 text-xs">Belopp anges i SEK. Värderingen använder vinets metadata, inte etikettbilden.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="flex flex-col gap-2 text-sm font-medium">
                    Inköpspris
                    <Input
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={purchasePrice}
                        onChange={(event) => setPurchasePrice(event.target.value)}
                        placeholder="Exempel: 249"
                    />
                </label>
                <Button variant="outline" disabled={saving} onClick={savePurchasePrice}>
                    {saving ? 'Sparar…' : 'Spara inköpspris'}
                </Button>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                    <span className="text-muted-foreground block text-xs">Sparat inköpspris</span>
                    {financials.purchase_price === null ? 'Ej angivet' : money.format(financials.purchase_price)}
                </p>
                <p>
                    <span className="text-muted-foreground block text-xs">Sparat uppskattat värde</span>
                    {financials.estimated_value === null ? 'Ej angivet' : money.format(financials.estimated_value)}
                </p>
            </div>
            <div className="border-border space-y-3 border-t pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <p className="text-sm font-medium">Marknadsvärdering</p>
                        {valuation?.valued_at && (
                            <p className="text-muted-foreground text-xs">Kontrollerad {new Date(valuation.valued_at).toLocaleDateString('sv-SE')}</p>
                        )}
                    </div>
                    <Button variant="outline" size="sm" disabled={active || valuing} onClick={startValuation}>
                        {(active || valuing) && <LoaderCircle className="animate-spin" />}
                        {valuation ? 'Uppdatera värdering' : 'Värdera flaskan'}
                    </Button>
                </div>
                {active && (
                    <p className="text-muted-foreground text-sm">
                        {valuation?.status === 'processing' ? 'Söker priser och verifierar källor…' : 'Väntar i kön…'}
                    </p>
                )}
                {valuation?.status === 'failed' && (
                    <p className="text-destructive text-sm">{valuation.error_message ?? 'Värderingen misslyckades.'}</p>
                )}
                {valuation?.status === 'completed' && (
                    <div className="space-y-3">
                        <p className="text-lg font-medium">
                            {valuation.estimated_value === null ? 'Inget verifierbart värde hittades' : money.format(valuation.estimated_value)}
                        </p>
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
            </div>
            {message && <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>}
            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            )}
        </section>
    );
}
