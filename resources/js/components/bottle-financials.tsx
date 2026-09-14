import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { jsonRequest } from '@/lib/json-request';
import type { Bottle } from '@/types/wine';
import { useState } from 'react';

const money = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' });

export default function BottleFinancials({ bottle }: { bottle: Bottle }) {
    const [purchasePrice, setPurchasePrice] = useState(bottle.purchase_price?.toString() ?? '');
    const [savedPurchasePrice, setSavedPurchasePrice] = useState(bottle.purchase_price);
    const [applyToAll, setApplyToAll] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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
            const result = await jsonRequest<{ purchase_price: number | null; updated_count: number }>(
                `/bottles/${bottle.id}/financials`,
                { purchase_price: value, apply_to_available_wine_bottles: applyToAll },
                'PATCH',
            );
            setSavedPurchasePrice(result.purchase_price);
            setPurchasePrice(result.purchase_price?.toString() ?? '');
            setMessage(
                applyToAll ? `Inköpspriset har sparats på ${result.updated_count} tillgängliga flaskor.` : 'Inköpspriset har sparats på flaskan.',
            );
        } catch (exception) {
            setError(exception instanceof Error ? exception.message : 'Inköpspriset kunde inte sparas.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="border-border bg-muted/30 space-y-4 rounded-lg border p-4">
            <div>
                <h3 className="font-medium">Inköpspris per flaska</h3>
                <p className="text-muted-foreground mt-1 text-xs">Marknadsvärdet hanteras gemensamt på vinet.</p>
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
            <label className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox
                    aria-label="Använd samma pris på alla tillgängliga flaskor av detta vin"
                    checked={applyToAll}
                    onCheckedChange={(checked) => setApplyToAll(checked === true)}
                />
                <span>
                    Använd samma pris på alla tillgängliga flaskor av detta vin
                    <span className="text-muted-foreground block text-xs">Konsumerade och borttagna flaskor ändras inte.</span>
                </span>
            </label>
            <p className="text-sm">
                <span className="text-muted-foreground block text-xs">Sparat inköpspris</span>
                {savedPurchasePrice === null ? 'Ej angivet' : money.format(savedPurchasePrice)}
            </p>
            {bottle.wine?.estimated_value !== null && bottle.wine?.estimated_value !== undefined && (
                <p className="text-sm">
                    <span className="text-muted-foreground block text-xs">Aktuellt värde från vinet</span>
                    {money.format(bottle.wine.estimated_value)}
                </p>
            )}
            {message && <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>}
            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            )}
        </section>
    );
}
