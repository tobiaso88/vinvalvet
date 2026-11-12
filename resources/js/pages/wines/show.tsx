import BottleDialog from '@/components/bottle-dialog';
import { BottleImage, Errors, Field, NativeRow, WineBadge } from '@/components/cellar';
import RackGrid from '@/components/rack-grid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import WineFinancials from '@/components/wine-financials';
import WineResearchCard from '@/components/wine-research';
import CellarLayout from '@/layouts/cellar-layout';
import { type Bottle, type Rack, type Wine, wineBodies } from '@/types/wine';
import { Link, useForm } from '@inertiajs/react';
import { BadgeEuro, History, Info, MapPin, NotebookPen, Pencil, Sparkles } from 'lucide-react';
import { useState } from 'react';
type Panel = 'info' | 'research' | 'valuation' | 'refill' | 'delete' | null;
export default function WineShow({ wine, racks }: { wine: Wine; racks: Rack[] }) {
    const [bottle, setBottle] = useState<Bottle | null>(null);
    const [panel, setPanel] = useState<Panel>(null);
    const [estimatedValue, setEstimatedValue] = useState(wine.estimated_value);
    const form = useForm({ wine_id: wine.id, quantity: 1, purchase_price: '' });
    const deletion = useForm({});
    const available = wine.bottles?.filter((b) => b.status === 'available') ?? [];
    const occupiedRacks = racks.filter((r) => available.some((b) => b.wine_rack_id === r.id));
    const details = (
        <div className="native-group">
            {[
                ['Producent', wine.producer],
                ['Land & region', [wine.country, wine.region].filter(Boolean).join(' · ')],
                ['Årgång', wine.vintage ?? 'NV'],
                ['Druvor', wine.grapes.map((g) => g.name).join(', ')],
                ['Alkoholhalt', wine.alcohol != null ? wine.alcohol + ' %' : null],
                ['Fyllighet', wine.body ? wineBodies[wine.body] : null],
                ['EAN', wine.ean],
                ['Systembolagets artikelnummer', wine.systembolaget_number],
            ].map(([label, value]) => (
                <NativeRow key={label} title={String(label)} subtitle={value == null || value === '' ? 'Ej angivet' : String(value)} />
            ))}
        </div>
    );
    const hero = (
        <div className="flex items-center gap-[23px] px-2 py-[23px]">
            <BottleImage wine={wine} />
            <div className="min-w-0">
                <WineBadge wine={wine} />
                <h1 className="mt-2 text-[27px] leading-tight font-bold tracking-[-1px] lg:hidden">{wine.name}</h1>
                <h2 className="mt-2 hidden text-[27px] leading-tight font-bold tracking-[-1px] lg:block">{wine.name}</h2>
                <p className="text-muted-foreground mt-2 text-[13px] leading-relaxed">
                    {[wine.vintage ?? 'NV', wine.country].filter(Boolean).join(' · ')}
                    <br />
                    {available.length} flaskor hemma
                </p>
            </div>
        </div>
    );
    const panelTitles = {
        info: 'Om ' + wine.name,
        research: 'Vinresearch',
        valuation: 'Marknadsvärde',
        refill: 'Fyll på ' + wine.name,
        delete: 'Radera vinpost?',
    };
    return (
        <CellarLayout title={wine.name} hideHeading back={{ href: '/wines', label: 'Viner' }}>
            <div className="mb-[22px] hidden items-center justify-between gap-4 lg:flex">
                <div>
                    <h1 className="text-[30px] font-bold tracking-[-1px]">{wine.name}</h1>
                    <p className="text-muted-foreground mt-2 text-[13px]">{[wine.vintage ?? 'NV', wine.country].filter(Boolean).join(' · ')}</p>
                </div>
                <Button asChild variant="secondary">
                    <Link href={'/wines/' + wine.id + '/edit'}>Redigera vin</Link>
                </Button>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.2fr]">
                <div>
                    <section className="lg:bg-card lg:overflow-hidden lg:rounded-[18px]">
                        {hero}
                        <div className="hidden px-[15px] pb-[15px] lg:block">
                            <div className="native-group">
                                <NativeRow title="Land & region" subtitle={[wine.country, wine.region].filter(Boolean).join(' · ') || 'Ej angivet'} />
                                <NativeRow title="Druvor" subtitle={wine.grapes.map((g) => g.name).join(', ') || 'Ej angivet'} />
                                <NativeRow
                                    title="Alkohol & fyllighet"
                                    subtitle={
                                        [wine.alcohol != null ? wine.alcohol + ' %' : null, wine.body ? wineBodies[wine.body] : null]
                                            .filter(Boolean)
                                            .join(' · ') || 'Ej angivet'
                                    }
                                />
                                <NativeRow title="Anteckningar" subtitle={wine.notes ?? 'Inga anteckningar ännu'} />
                                <NativeRow title="Alla vinuppgifter" subtitle="Producent, artikelnummer & etikett" onClick={() => setPanel('info')} />
                            </div>
                        </div>
                    </section>
                    <div className="native-group mt-3 hidden lg:block">
                        <NativeRow
                            title="Research & externa betyg"
                            subtitle="Granska förslag och källor"
                            icon={Sparkles}
                            onClick={() => setPanel('research')}
                        />
                    </div>
                </div>
                <div className="flex min-w-0 flex-col gap-[22px]">
                    <section aria-label="Vinets placering">
                        <h2 className="native-section-title">Här ligger dina flaskor</h2>
                        {occupiedRacks.map((rack) => (
                            <div key={rack.id} className="native-group mb-3">
                                <NativeRow
                                    title={rack.name}
                                    subtitle={available.filter((b) => b.wine_rack_id === rack.id).length + ' flaskor'}
                                    href={'/racks/' + rack.id}
                                    icon={MapPin}
                                />
                                <RackGrid
                                    rack={rack}
                                    compact
                                    highlightWineId={wine.id}
                                    onSelect={(_, b) => {
                                        if (b?.wine_id === wine.id) setBottle({ ...b, wine });
                                    }}
                                />
                                <p className="text-muted-foreground px-[15px] pb-[15px] text-[11px]">● Ditt vin · Sett framifrån</p>
                            </div>
                        ))}
                        {available.some((b) => b.wine_rack_id != null) && (
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => {
                                    const placed = available.find((b) => b.wine_rack_id != null);
                                    if (placed) setBottle({ ...placed, wine });
                                }}
                            >
                                Hantera flaska ·{' '}
                                {available
                                    .find((b) => b.wine_rack_id != null)
                                    ?.location.split(' · ')
                                    .at(-1)}
                            </Button>
                        )}
                        {available.some((b) => b.wine_rack_id == null) && (
                            <div className="native-group mt-3">
                                <NativeRow
                                    title={available.filter((b) => b.wine_rack_id == null).length + ' oplacerade flaskor'}
                                    subtitle="Välj en hyllplats"
                                    href="/racks/unplaced"
                                    icon={MapPin}
                                />
                            </div>
                        )}
                        {!available.length && <p className="text-muted-foreground text-[13px]">Inga flaskor kvar i lagret.</p>}
                    </section>
                    <div className="native-group">
                        <div className="lg:hidden">
                            <NativeRow title="Om vinet" subtitle="Druvor, alkohol & ursprung" icon={Info} onClick={() => setPanel('info')} />
                            <NativeRow
                                title="Vinresearch"
                                subtitle="Granska uppgifter & betyg"
                                icon={Sparkles}
                                onClick={() => setPanel('research')}
                            />
                        </div>
                        <NativeRow
                            title="Marknadsvärde"
                            subtitle={
                                estimatedValue != null
                                    ? new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(
                                          estimatedValue * available.length,
                                      ) +
                                      ' för ' +
                                      available.length +
                                      ' flaskor'
                                    : 'Gemensamt värde per flaska'
                            }
                            value={estimatedValue != null ? estimatedValue.toLocaleString('sv-SE') + ' kr/fl.' : 'Ej angivet'}
                            icon={BadgeEuro}
                            onClick={() => setPanel('valuation')}
                        />
                        <NativeRow
                            title="Anteckningar"
                            subtitle={wine.notes ?? 'Smak, tillfälle och minnen'}
                            href={'/wines/' + wine.id + '/edit'}
                            icon={NotebookPen}
                        />
                    </div>
                    <Button onClick={() => setPanel('refill')}>Fyll på med flaskor</Button>
                    <div className="native-group">
                        <div className="lg:hidden">
                            <NativeRow title="Redigera vin" href={'/wines/' + wine.id + '/edit'} icon={Pencil} />
                        </div>
                        <NativeRow
                            title="Aktivitetshistorik"
                            subtitle={`${wine.bottles?.filter((b) => b.status === 'consumed').length ?? 0} konsumerade · ${wine.bottles?.filter((b) => b.status === 'removed').length ?? 0} borttagna`}
                            href={'/activity?wine_id=' + wine.id}
                            icon={History}
                        />
                        {!wine.bottles?.length && <NativeRow title="Radera tom vinpost" destructive onClick={() => setPanel('delete')} />}
                    </div>
                </div>
            </div>
            {bottle && <BottleDialog bottle={bottle} racks={racks} onClose={() => setBottle(null)} />}
            <Dialog
                open={panel != null}
                onOpenChange={(open) => {
                    if (!open) setPanel(null);
                }}
            >
                <DialogContent className={panel === 'info' || panel === 'research' ? 'sm:max-w-xl' : ''}>
                    <DialogHeader>
                        <DialogTitle>{panel && panelTitles[panel]}</DialogTitle>
                        <DialogDescription>
                            {wine.vintage ?? 'NV'} · {wine.country ?? 'Ditt vin'}
                        </DialogDescription>
                    </DialogHeader>
                    {panel === 'info' && (
                        <>
                            {details}
                            <h2 className="native-section-title">Etikett</h2>
                            <div className="flex justify-center py-4">
                                <BottleImage wine={wine} />
                            </div>
                            {wine.notes && <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{wine.notes}</p>}
                            <Button asChild variant="secondary">
                                <Link href={'/wines/' + wine.id + '/edit'}>Redigera uppgifter</Link>
                            </Button>
                        </>
                    )}
                    {panel === 'research' && <WineResearchCard wine={wine} />}
                    {panel === 'valuation' && (
                        <WineFinancials wine={wine} availableBottleCount={available.length} onValueChange={setEstimatedValue} />
                    )}
                    {panel === 'refill' && (
                        <form
                            className="flex flex-col gap-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post('/bottles', { preserveScroll: true, onSuccess: () => setPanel(null) });
                            }}
                        >
                            <Errors errors={form.errors} />
                            <div className="native-fields bg-background">
                                <Field label="Antal nya flaskor">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="100"
                                        required
                                        value={form.data.quantity}
                                        onChange={(e) => form.setData('quantity', Number(e.target.value))}
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
                            </div>
                            <p className="native-note">De läggs till som oplacerade. Välj sedan en hyllplats.</p>
                            <Button disabled={form.processing}>{form.processing ? 'Lägger till…' : 'Lägg till flaskor'}</Button>
                            <Button asChild variant="secondary">
                                <Link href="/racks/unplaced">Visa oplacerade flaskor</Link>
                            </Button>
                        </form>
                    )}
                    {panel === 'delete' && (
                        <>
                            <Errors errors={deletion.errors} />
                            <p className="native-error">Vinposten raderas permanent. Endast viner som saknar flaskor kan tas bort.</p>
                            <Button variant="destructive" disabled={deletion.processing} onClick={() => deletion.delete('/wines/' + wine.id)}>
                                Bekräfta radering av vinpost
                            </Button>
                            <Button variant="secondary" onClick={() => setPanel(null)}>
                                Avbryt
                            </Button>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </CellarLayout>
    );
}
