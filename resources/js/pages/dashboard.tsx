import { EmptyState, EventList, WineCard } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import CellarLayout from '@/layouts/cellar-layout';
import type { BottleEvent, Rack, Wine } from '@/types/wine';
import { Link } from '@inertiajs/react';
import { ArrowRight, Grid2X2, Plus, UtensilsCrossed } from 'lucide-react';

export default function Dashboard({
    stats,
    racks,
    wines,
    events,
}: {
    stats: { bottles: number; wines: number; capacity: number; occupied: number; free: number; unplaced: number };
    racks: Rack[];
    wines: Wine[];
    events: BottleEvent[];
}) {
    return (
        <CellarLayout
            title="Din vinkällare"
            description="En plats för dina viner. Och för nästa goda middag."
            action={
                <Button asChild>
                    <Link href="/wines/create">
                        <Plus className="size-4" />
                        Lägg till vin
                    </Link>
                </Button>
            }
        >
            <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
                {[
                    ['Flaskor hemma', stats.bottles, 'Redo för nästa tillfälle'],
                    ['Olika viner', stats.wines, 'I din personliga samling'],
                    ['Lediga platser', stats.free, 'Av ' + stats.capacity + ' hyllplatser'],
                    ['Oplacerade', stats.unplaced, 'Flaskor att hitta en plats åt'],
                ].map(([label, value, note]) => (
                    <div key={label} className="border-border bg-card rounded-xl border p-5">
                        <p className="text-muted-foreground text-xs">{label}</p>
                        <p className="my-3 font-serif text-4xl">{value}</p>
                        <p className="text-muted-foreground text-[11px]">{note}</p>
                    </div>
                ))}
            </div>
            <div className="mb-9 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                <section className="border-border bg-card rounded-xl border p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="font-serif text-2xl">Dina vinhyllor</h2>
                        <Link href="/racks" className="text-primary text-xs">
                            Visa alla →
                        </Link>
                    </div>
                    {!racks.length ? (
                        <EmptyState
                            title="Börja med en hylla"
                            description="Ange rader och kolumner så skapar vi en plats för varje flaska."
                            href="/racks"
                            label="Skapa din första hylla"
                        />
                    ) : (
                        <div className="flex flex-col gap-4">
                            {racks.slice(0, 3).map((rack) => (
                                <Link key={rack.id} href={'/racks/' + rack.id} className="bg-muted/40 flex items-center gap-4 rounded-lg p-4">
                                    <Grid2X2 className="text-primary/70 size-7" />
                                    <div className="flex-1">
                                        <div className="flex justify-between gap-3 text-sm">
                                            <span className="font-medium">{rack.name}</span>
                                            <span className="text-muted-foreground text-xs">
                                                {rack.bottles_count} / {rack.rows * rack.columns}
                                            </span>
                                        </div>
                                        <div className="bg-border mt-3 h-1.5 overflow-hidden rounded-full">
                                            <div
                                                className="bg-primary/70 h-full rounded-full"
                                                style={{ width: ((rack.bottles_count ?? 0) / (rack.rows * rack.columns)) * 100 + '%' }}
                                            />
                                        </div>
                                    </div>
                                    <ArrowRight className="text-muted-foreground size-4" />
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
                <section className="relative flex flex-col justify-center overflow-hidden rounded-xl bg-[#713548] p-7 text-[#fff7ed]">
                    <UtensilsCrossed className="mb-6 size-8 stroke-[1.3] text-[#d4ad9e]" />
                    <p className="text-[10px] tracking-[.2em] text-[#dec2b9] uppercase">Från hyllan till bordet</p>
                    <h2 className="mt-3 font-serif text-3xl leading-tight">
                        Vad blir det
                        <br />
                        till middag?
                    </h2>
                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#ecd8d2]">
                        Berätta vad du ska laga. Hitta ett passande vin bland flaskorna du redan har.
                    </p>
                    <Link href="/pairing" className="mt-7 inline-flex items-center gap-3 text-sm font-medium">
                        Hitta vin till maten <ArrowRight className="size-4" />
                    </Link>
                </section>
            </div>
            <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
                <section>
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="font-serif text-2xl">Senast tillagda</h2>
                        <Link href="/wines" className="text-primary text-xs">
                            Hela samlingen →
                        </Link>
                    </div>
                    {wines.length ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                            {wines.map((wine) => (
                                <WineCard key={wine.id} wine={wine} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Samlingen börjar här"
                            description="Lägg till ditt första vin manuellt eller ta ett foto av etiketten."
                            href="/wines/create"
                            label="Lägg till vin"
                        />
                    )}
                </section>
                <section>
                    <h2 className="mb-5 font-serif text-2xl">Senaste aktivitet</h2>
                    <div className="border-border bg-card rounded-xl border px-5">
                        {events.length ? (
                            <EventList events={events} />
                        ) : (
                            <p className="text-muted-foreground py-8 text-sm">Här visas vad som händer i din vinkällare.</p>
                        )}
                    </div>
                </section>
            </div>
        </CellarLayout>
    );
}
