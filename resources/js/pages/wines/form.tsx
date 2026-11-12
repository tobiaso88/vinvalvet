import { Errors, Field, Select } from '@/components/cellar';
import RackGrid from '@/components/rack-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CellarLayout from '@/layouts/cellar-layout';
import { jsonRequest } from '@/lib/json-request';
import { type Rack, type RackSlot, type Wine, wineBodies, type WineBody, type WineScanResult, type WineType, wineTypes } from '@/types/wine';
import { Link, useForm } from '@inertiajs/react';
import { Camera, ChevronLeft, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
export default function WineForm({ wine, racks }: { wine: Wine | null; racks: Rack[] }) {
    const form = useForm({
        name: wine?.name ?? '',
        producer: wine?.producer ?? '',
        vintage: wine?.vintage?.toString() ?? '',
        type: wine?.type ?? ('' as WineType | ''),
        country: wine?.country ?? '',
        region: wine?.region ?? '',
        ean: wine?.ean ?? '',
        systembolaget_number: wine?.systembolaget_number ?? '',
        alcohol: wine?.alcohol?.toString() ?? '',
        body: wine?.body ?? ('' as WineBody | ''),
        notes: wine?.notes ?? '',
        grapes: wine?.grapes.map((g) => g.name) ?? ([] as string[]),
        label: null as File | null,
        quantity: 1,
        purchase_price: '',
        positions: [] as RackSlot[],
    });
    const [step, setStep] = useState<'start' | 'details' | 'stock'>(wine ? 'details' : 'start');
    const [showPhoto, setShowPhoto] = useState(false);
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
            setStep('details');
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
    const save = () => {
        if (scanning || form.processing) return;
        form.transform((data) => ({
            ...data,
            grapes: grapes
                .split(',')
                .map((g) => g.trim())
                .filter(Boolean),
            ...(wine ? { _method: 'put' } : {}),
        }));
        form.post(wine ? '/wines/' + wine.id : '/wines', {
            forceFormData: true,
            onError: (errors) => {
                if (Object.keys(errors).some((key) => !['quantity', 'purchase_price', 'positions'].some((prefix) => key.startsWith(prefix))))
                    setStep('details');
            },
        });
    };
    const fields = [
        ['name', 'Vinets namn *', 'Till exempel Barolo'],
        ['producer', 'Producent', 'Producent'],
        ['vintage', 'Årgång', 'NV / ingen årgång'],
        ['country', 'Land', 'Land'],
        ['region', 'Region', 'Region'],
        ['ean', 'EAN', '8 eller 13 siffror'],
        ['systembolaget_number', 'Systembolagets artikelnummer', 'Artikelnummer'],
    ] as const;
    return (
        <CellarLayout
            title={step === 'start' ? 'Lägg till vin' : step === 'stock' ? 'Flaskor & placering' : 'Vinuppgifter'}
            description={
                step === 'start'
                    ? 'Börja med etiketten eller fyll i själv.'
                    : step === 'stock'
                      ? 'Välj platser nu eller placera senare.'
                      : 'Kontrollera uppgifterna innan du sparar.'
            }
            back={{ href: wine ? '/wines/' + wine.id : '/wines', label: 'Viner' }}
        >
            <form
                className="mx-auto flex max-w-3xl min-w-0 flex-col gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (step === 'details' && !wine) {
                        setStep('stock');
                    } else if (step === 'stock' || wine) save();
                }}
            >
                <Errors errors={form.errors} />
                {(step === 'start' || showPhoto) && (
                    <section className="flex flex-col gap-3">
                        <div className="bg-card flex min-h-[155px] flex-col items-center justify-center gap-3 rounded-[18px] p-5">
                            {(preview ?? wine?.label_url) ? (
                                <img
                                    src={preview ?? wine?.label_url ?? ''}
                                    alt="Förhandsvisning av flaskbilden"
                                    className="max-h-52 w-full object-contain"
                                />
                            ) : (
                                <>
                                    <Camera className="text-primary size-7" />
                                    <span className="text-muted-foreground text-xs">Etikettfoto</span>
                                </>
                            )}
                        </div>
                        <label className="bg-primary text-primary-foreground relative flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-[13px] px-3 py-3 text-sm font-semibold">
                            <Camera className="size-4" />
                            Ta bild eller välj foto
                            <input
                                aria-label="Flaskbild"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                capture="environment"
                                disabled={scanning}
                                className="absolute inset-0 cursor-pointer opacity-0"
                                onChange={(e) => {
                                    form.setData('label', e.target.files?.[0] ?? null);
                                    setScan(null);
                                    setScanError('');
                                }}
                            />
                        </label>
                        <Button type="button" variant="secondary" disabled={!form.data.label || scanning} onClick={scanLabel}>
                            {scanning ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
                            {scanning ? 'Läser etiketten …' : 'Läs etiketten'}
                        </Button>
                        {step === 'start' && (
                            <Button type="button" variant="secondary" disabled={scanning} onClick={() => setStep('details')}>
                                Fyll i manuellt
                            </Button>
                        )}
                        <p className="native-note">
                            JPEG, PNG eller WebP, högst 10 MB. När du väljer Läs etiketten skickas bilden till OpenAI för analys. Bilden sparas privat
                            och förbättras i bakgrunden när du sparar vinet.
                        </p>
                        {scanError && (
                            <p role="alert" className="native-error">
                                {scanError} Du kan försöka igen eller fylla i uppgifterna själv.
                            </p>
                        )}
                        {scanning && (
                            <div aria-label="Läser etiketten" className="bg-card animate-pulse space-y-3 rounded-[18px] p-4">
                                <div className="bg-muted h-3 rounded-full" />
                                <div className="bg-muted h-3 w-2/3 rounded-full" />
                            </div>
                        )}
                    </section>
                )}
                {scan && step === 'details' && (
                    <div role="status" className="native-note">
                        <p className="font-semibold">Granska uppgifterna före sparning</p>
                        <p className="mt-2">Okända uppgifter lämnas tomma. Bildanalysen kan göra fel.</p>
                        {scan.warnings.map((w, i) => (
                            <p className="mt-2" key={i}>
                                {w}
                            </p>
                        ))}
                        {Object.values(scan.confidence).includes('low') && (
                            <p className="mt-2">Några uppgifter har låg säkerhet – kontrollera dem mot etiketten.</p>
                        )}
                    </div>
                )}
                {step === 'details' && (
                    <>
                        <div className="native-fields">
                            {fields.slice(0, 3).map(([key, label, placeholder]) => (
                                <Field key={key} label={label} error={form.errors[key]}>
                                    <Input
                                        required={key === 'name'}
                                        type={key === 'vintage' ? 'number' : 'text'}
                                        min={key === 'vintage' ? 1800 : undefined}
                                        max={key === 'vintage' ? new Date().getFullYear() : undefined}
                                        value={form.data[key]}
                                        placeholder={placeholder}
                                        onChange={(e) => form.setData(key, e.target.value)}
                                    />
                                </Field>
                            ))}
                            <Field label="Vintyp *" error={form.errors.type}>
                                <Select required value={form.data.type} onChange={(e) => form.setData('type', e.target.value as WineType)}>
                                    <option value="">Välj vintyp</option>
                                    {Object.entries(wineTypes).map(([v, l]) => (
                                        <option key={v} value={v}>
                                            {l}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                            {fields.slice(3).map(([key, label, placeholder]) => (
                                <Field key={key} label={label} error={form.errors[key]}>
                                    <Input value={form.data[key]} placeholder={placeholder} onChange={(e) => form.setData(key, e.target.value)} />
                                </Field>
                            ))}
                            <Field label="Druvor, separerade med kommatecken" error={form.errors.grapes}>
                                <Input value={grapes} onChange={(e) => setGrapes(e.target.value)} placeholder="Pinot noir, Chardonnay" />
                            </Field>
                            <Field label="Alkoholhalt (%)" error={form.errors.alcohol}>
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
                            <Field label="Egna anteckningar" error={form.errors.notes}>
                                <textarea
                                    value={form.data.notes}
                                    maxLength={5000}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    placeholder="Smak, tillfälle eller något du vill komma ihåg…"
                                />
                            </Field>
                        </div>
                        <Button type="button" variant="secondary" onClick={() => setShowPhoto(!showPhoto)}>
                            {showPhoto ? 'Dölj etikettfoto' : 'Byt etikettfoto'}
                        </Button>
                        <Button disabled={form.processing || scanning}>
                            {form.processing ? 'Sparar…' : wine ? 'Spara ändringar' : 'Fortsätt till antal & placering'}
                        </Button>
                    </>
                )}
                {step === 'stock' && (
                    <>
                        <button type="button" className="text-primary flex min-h-10 items-center text-[13px]" onClick={() => setStep('details')}>
                            <ChevronLeft className="size-4" />
                            Tillbaka till vinuppgifter
                        </button>
                        <div className="native-fields">
                            <Field label="Antal flaskor" error={form.errors.quantity}>
                                <Input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    value={form.data.quantity}
                                    onChange={(e) => {
                                        const quantity = Math.max(0, Number(e.target.value));
                                        form.setData((previous) => ({ ...previous, quantity, positions: previous.positions.slice(0, quantity) }));
                                    }}
                                />
                            </Field>
                            <Field label="Inköpspris per flaska" error={form.errors.purchase_price}>
                                <Input
                                    inputMode="decimal"
                                    value={form.data.purchase_price}
                                    onChange={(e) => form.setData('purchase_price', e.target.value.replace(',', '.'))}
                                    placeholder="Exempel: 249"
                                />
                            </Field>
                            <Field label="Välj hylla">
                                <Select value={rackId} onChange={(e) => setRackId(Number(e.target.value))}>
                                    <option value="0">Placera senare</option>
                                    {racks.map((r) => (
                                        <option value={r.id} key={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                        </div>
                        {rack && (
                            <RackGrid
                                rack={rack}
                                compact
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
                                                (s) => !(s.wine_rack_id === slot.wine_rack_id && s.row === slot.row && s.column === slot.column),
                                            ),
                                        );
                                    else if (form.data.positions.length < form.data.quantity)
                                        form.setData('positions', [...form.data.positions, slot]);
                                }}
                            />
                        )}
                        <p className="text-muted-foreground text-xs" aria-live="polite">
                            {form.data.positions.length} platser valda · {form.data.quantity - form.data.positions.length} flaskor blir oplacerade.
                        </p>
                        <Button disabled={form.processing || scanning}>{form.processing ? 'Sparar…' : 'Spara vin och flaskor'}</Button>
                    </>
                )}
                {step !== 'start' && (
                    <Button asChild variant="ghost">
                        <Link href={wine ? '/wines/' + wine.id : '/wines'}>Avbryt</Link>
                    </Button>
                )}
            </form>
        </CellarLayout>
    );
}
