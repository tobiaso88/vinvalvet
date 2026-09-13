import BottleDialog from '@/components/bottle-dialog';
import { Errors, Field, WineBadge } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CellarLayout from '@/layouts/cellar-layout';
import { type Bottle, type Rack, typeColors, type Wine, wineBodies } from '@/types/wine';
import { Link, useForm } from '@inertiajs/react';
import { MapPin, Wine as WineIcon } from 'lucide-react';
import { useState } from 'react';
export default function WineShow({ wine, racks }: { wine: Wine; racks: Rack[] }) {
    const [bottle, setBottle] = useState<Bottle | null>(null),
        [remove, setRemove] = useState(false);
    const form = useForm({ wine_id: wine.id, quantity: 1 });
    const deletion = useForm({});
    const available = wine.bottles?.filter((b) => b.status === 'available') ?? [];
    return (
        <CellarLayout
            title={wine.name}
            description={[wine.producer, wine.vintage ?? 'NV', wine.country].filter(Boolean).join(' · ')}
            action={
                <Button asChild variant="outline">
                    <Link href={'/wines/' + wine.id + '/edit'}>Redigera vin</Link>
                </Button>
            }
        >
            <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
                <section className="border-border bg-card rounded-xl border p-6">
                    <div className="bg-muted/60 mb-6 flex h-56 items-center justify-center rounded-lg">
                        {wine.label_url ? (
                            <img src={wine.label_url} alt={'Flaskbild för ' + wine.name} className="h-full w-full object-contain p-4" />
                        ) : (
                            <WineIcon className="h-36 w-20 stroke-[.8]" style={{ color: typeColors[wine.type] }} />
                        )}
                    </div>
                    <WineBadge wine={wine} />
                    <dl className="mt-5 grid grid-cols-2 gap-5">
                        {[
                            ['Region', wine.region],
                            ['Årgång', wine.vintage ?? 'NV'],
                            ['Druvor', wine.grapes.map((g) => g.name).join(', ')],
                            ['EAN', wine.ean],
                            ['Systembolagets artikelnummer', wine.systembolaget_number],
                            ['Fyllighet', wine.body ? wineBodies[wine.body] : null],
                            ['Alkohol', wine.alcohol != null ? wine.alcohol + ' %' : null],
                            ['Flaskor hemma', available.length],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <dt className="text-muted-foreground text-xs">{label}</dt>
                                <dd className="mt-1 text-sm">{value ?? 'Ej angivet'}</dd>
                            </div>
                        ))}
                    </dl>
                    {wine.notes && (
                        <div className="border-border mt-6 border-t pt-5">
                            <h2 className="mb-2 text-sm font-medium">Dina anteckningar</h2>
                            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{wine.notes}</p>
                        </div>
                    )}
                </section>
                <section className="flex flex-col gap-5">
                    <div className="border-border bg-card rounded-xl border p-6">
                        <h2 className="mb-5 font-serif text-2xl">Här ligger dina flaskor</h2>
                        {available.length ? (
                            <div className="flex flex-col gap-3">
                                {available.map((b) => (
                                    <button
                                        key={b.id}
                                        onClick={() => setBottle({ ...b, wine })}
                                        className="border-border hover:border-primary flex items-center gap-3 rounded-lg border p-4 text-left"
                                    >
                                        <MapPin className="text-primary size-5" />
                                        <span className="flex-1 text-sm">{b.location}</span>
                                        <span className="text-muted-foreground text-xs">#{b.id} →</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">Inga flaskor kvar i lagret.</p>
                        )}
                    </div>
                    <form
                        className="border-border bg-card flex flex-col gap-4 rounded-xl border p-6"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post('/bottles', { preserveScroll: true });
                        }}
                    >
                        <h2 className="font-serif text-2xl">Fyll på med fler flaskor</h2>
                        <Errors errors={form.errors} />
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
                        <p className="text-muted-foreground text-xs">De läggs till som oplacerade. Välj sedan en hyllplats.</p>
                        <Button disabled={form.processing}>Lägg till flaskor</Button>
                    </form>
                    <Link className="text-primary text-sm" href={'/activity?wine_id=' + wine.id}>
                        Visa vinets aktivitetshistorik →
                    </Link>
                    <p className="text-muted-foreground text-xs">
                        {wine.bottles?.filter((b) => b.status === 'consumed').length ?? 0} konsumerade ·{' '}
                        {wine.bottles?.filter((b) => b.status === 'removed').length ?? 0} borttagna
                    </p>
                    {!wine.bottles?.length && (
                        <>
                            <Errors errors={deletion.errors} />
                            <Button variant="ghost" onClick={() => (remove ? deletion.delete('/wines/' + wine.id) : setRemove(true))}>
                                {remove ? 'Bekräfta radering av vinpost' : 'Radera tom vinpost'}
                            </Button>
                        </>
                    )}
                </section>
            </div>
            {bottle && <BottleDialog bottle={bottle} racks={racks} onClose={() => setBottle(null)} />}
        </CellarLayout>
    );
}
