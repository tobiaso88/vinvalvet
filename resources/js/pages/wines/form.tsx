import { Errors, Field, Select } from '@/components/cellar';
import RackGrid from '@/components/rack-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CellarLayout from '@/layouts/cellar-layout';
import { jsonRequest } from '@/lib/json-request';
import { type Rack, type RackSlot, type Wine, wineBodies, type WineBody, type WineScanResult, type WineType, wineTypes } from '@/types/wine';
import { Link, useForm } from '@inertiajs/react';
import { Camera, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
export default function WineForm({ wine, racks }: { wine: Wine | null; racks: Rack[] }) {
    const form = useForm({
        name: wine?.name ?? '',
        producer: wine?.producer ?? '',
        vintage: wine?.vintage?.toString() ?? '',
        type: wine?.type ?? ('' as WineType | ''),
        country: wine?.country ?? '',
        region: wine?.region ?? '',
        alcohol: wine?.alcohol?.toString() ?? '',
        body: wine?.body ?? ('' as WineBody | ''),
        notes: wine?.notes ?? '',
        grapes: wine?.grapes.map((g) => g.name) ?? ([] as string[]),
        label: null as File | null,
        quantity: 1,
        positions: [] as RackSlot[],
    });
    const [grapes, setGrapes] = useState(wine?.grapes.map((g) => g.name).join(', ') ?? '');
    const [rackId, setRackId] = useState(racks[0]?.id ?? 0);
    const [scanning, setScanning] = useState(false),
        [scanError, setScanError] = useState(''),
        [scan, setScan] = useState<WineScanResult | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    useEffect(() => {
        if (!form.data.label) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(form.data.label);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [form.data.label]);
    async function scanLabel() {
        if (!form.data.label) return;
        setScanning(true);
        setScanError('');
        setScan(null);
        const data = new FormData();
        data.append('label', form.data.label);
        try {
            const result = await jsonRequest<WineScanResult>('/wine-scans', data);
            setScan(result);
            const f = result.fields;
            form.setData((previous) => ({
                ...previous,
                name: f.name ?? '',
                producer: f.producer ?? '',
                vintage: f.vintage?.toString() ?? '',
                type: f.type ?? '',
                country: f.country ?? '',
                region: f.region ?? '',
                alcohol: f.alcohol?.toString() ?? '',
                body: f.body ?? '',
                grapes: f.grapes,
            }));
            setGrapes(f.grapes.join(', '));
        } catch (error) {
            setScanError(error instanceof Error ? error.message : 'Kunde inte läsa etiketten.');
        } finally {
            setScanning(false);
        }
    }
    const rack = racks.find((r) => r.id === rackId);
    return (
        <CellarLayout
            title={wine ? 'Redigera vin' : 'Lägg till ett vin'}
            description="Skriv in uppgifterna själv eller låt ett foto av etiketten hjälpa dig på vägen."
        >
            <form
                className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.transform((data) => ({
                        ...data,
                        grapes: grapes
                            .split(',')
                            .map((g) => g.trim())
                            .filter(Boolean),
                        ...(wine ? { _method: 'put' } : {}),
                    }));
                    form.post(wine ? '/wines/' + wine.id : '/wines', { forceFormData: true });
                }}
            >
                <div className="grid min-w-0 grid-cols-1 gap-6">
                    <section className="border-border bg-card flex flex-col gap-5 rounded-xl border p-5 sm:p-7">
                        <h2 className="font-serif text-2xl">Om vinet</h2>
                        <Errors errors={form.errors} />
                        <Field label="Vinets namn *" error={form.errors.name}>
                            <Input
                                required
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="Till exempel Barolo"
                            />
                        </Field>
                        <Field label="Producent">
                            <Input value={form.data.producer} onChange={(e) => form.setData('producer', e.target.value)} />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Årgång">
                                <Input
                                    type="number"
                                    min="1800"
                                    max={new Date().getFullYear()}
                                    placeholder="NV / ingen årgång"
                                    value={form.data.vintage}
                                    onChange={(e) => form.setData('vintage', e.target.value)}
                                />
                            </Field>
                            <Field label="Vintyp *">
                                <Select required value={form.data.type} onChange={(e) => form.setData('type', e.target.value as WineType)}>
                                    <option value="">Välj vintyp</option>
                                    {Object.entries(wineTypes).map(([v, l]) => (
                                        <option value={v} key={v}>
                                            {l}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Land">
                                <Input value={form.data.country} onChange={(e) => form.setData('country', e.target.value)} />
                            </Field>
                            <Field label="Region">
                                <Input value={form.data.region} onChange={(e) => form.setData('region', e.target.value)} />
                            </Field>
                        </div>
                        <Field label="Druvor, separerade med kommatecken">
                            <Input value={grapes} onChange={(e) => setGrapes(e.target.value)} placeholder="Pinot noir, Chardonnay" />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Alkoholhalt (%)">
                                <Input
                                    type="number"
                                    min="0"
                                    max="30"
                                    step="0.1"
                                    value={form.data.alcohol}
                                    onChange={(e) => form.setData('alcohol', e.target.value)}
                                />
                            </Field>
                            <Field label="Fyllighet">
                                <Select value={form.data.body} onChange={(e) => form.setData('body', e.target.value as WineBody)}>
                                    <option value="">Ej angiven</option>
                                    {Object.entries(wineBodies).map(([v, l]) => (
                                        <option key={v} value={v}>
                                            {l}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                        </div>
                        <Field label="Egna anteckningar">
                            <textarea
                                className="border-input bg-card min-h-28 rounded-md border p-3"
                                value={form.data.notes}
                                maxLength={5000}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder="Smak, tillfälle eller något du vill komma ihåg …"
                            />
                        </Field>
                    </section>
                    {!wine && (
                        <section className="border-border bg-card flex flex-col gap-5 rounded-xl border p-5 sm:p-7">
                            <h2 className="font-serif text-2xl">Flaskor & placering</h2>
                            <Field label="Antal flaskor">
                                <Input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    value={form.data.quantity}
                                    onChange={(e) => {
                                        const quantity = Number(e.target.value);
                                        form.setData((previous) => ({ ...previous, quantity, positions: previous.positions.slice(0, quantity) }));
                                    }}
                                />
                            </Field>
                            {racks.length > 0 && (
                                <>
                                    <Field label="Välj hylla">
                                        <Select value={rackId} onChange={(e) => setRackId(Number(e.target.value))}>
                                            {racks.map((r) => (
                                                <option key={r.id} value={r.id}>
                                                    {r.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </Field>
                                    {rack && (
                                        <RackGrid
                                            rack={rack}
                                            selected={form.data.positions}
                                            onSelect={(slot, bottle) => {
                                                if (bottle) return;
                                                const exists = form.data.positions.some(
                                                    (s) => s.wine_rack_id === slot.wine_rack_id && s.row === slot.row && s.column === slot.column,
                                                );
                                                if (exists)
                                                    form.setData(
                                                        'positions',
                                                        form.data.positions.filter(
                                                            (s) =>
                                                                !(
                                                                    s.wine_rack_id === slot.wine_rack_id &&
                                                                    s.row === slot.row &&
                                                                    s.column === slot.column
                                                                ),
                                                        ),
                                                    );
                                                else if (form.data.positions.length < form.data.quantity)
                                                    form.setData('positions', [...form.data.positions, slot]);
                                            }}
                                        />
                                    )}
                                </>
                            )}
                            <p className="text-muted-foreground text-xs">
                                {form.data.positions.length} platser valda · {form.data.quantity - form.data.positions.length} flaskor blir
                                oplacerade.
                            </p>
                        </section>
                    )}
                    <div className="flex items-center gap-3">
                        <Button disabled={form.processing || scanning}>
                            {form.processing ? 'Sparar …' : wine ? 'Spara ändringar' : 'Spara vin och flaskor'}
                        </Button>
                        <Button asChild variant="ghost">
                            <Link href={wine ? '/wines/' + wine.id : '/wines'}>Avbryt</Link>
                        </Button>
                    </div>
                </div>
                <aside className="order-first xl:order-last">
                    <section className="border-border bg-card flex flex-col gap-4 rounded-xl border p-6">
                        <Camera className="text-primary size-7" />
                        <h2 className="font-serif text-2xl">Fånga etiketten</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Ta ett foto eller välj en bild. Läsningen fyller i uppgifterna som du sedan granskar.
                        </p>
                        <Input
                            aria-label="Etikettbild"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            capture="environment"
                            disabled={scanning}
                            onChange={(e) => {
                                form.setData('label', e.target.files?.[0] ?? null);
                                setScan(null);
                            }}
                        />
                        {(preview ?? wine?.label_url) && (
                            <img
                                src={preview ?? wine?.label_url ?? ''}
                                alt="Förhandsvisning av etiketten"
                                className="bg-muted max-h-64 w-full rounded-lg object-contain"
                            />
                        )}
                        <Button type="button" variant="outline" disabled={!form.data.label || scanning} onClick={scanLabel}>
                            {scanning ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
                            {scanning ? 'Läser etiketten …' : 'Läs etiketten'}
                        </Button>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                            JPEG, PNG eller WebP, högst 10 MB. Fotot skickas till OpenAI när du väljer Läs etiketten och sparas privat på vinet när du
                            sparar formuläret.
                        </p>
                        {scanError && (
                            <p role="alert" className="text-destructive text-sm">
                                {scanError}
                            </p>
                        )}
                        {scan && (
                            <div role="status" className="bg-muted rounded-lg p-4 text-sm">
                                <p className="font-medium">Granska uppgifterna före sparning</p>
                                <p className="text-muted-foreground mt-2 text-xs">Okända uppgifter lämnas tomma. Bildanalysen kan göra fel.</p>
                                {scan.warnings.map((warning, i) => (
                                    <p className="mt-2 text-xs" key={i}>
                                        {warning}
                                    </p>
                                ))}
                                {Object.entries(scan.confidence).filter(([, level]) => level === 'low').length > 0 && (
                                    <p className="mt-2 text-xs">Några uppgifter har låg säkerhet – kontrollera dem mot etiketten.</p>
                                )}
                            </div>
                        )}
                    </section>
                </aside>
            </form>
        </CellarLayout>
    );
}
