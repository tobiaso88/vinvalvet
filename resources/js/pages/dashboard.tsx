import { EmptyState, EventList, NativeRow, WineCard } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import CellarLayout from '@/layouts/cellar-layout';
import type { BottleEvent, Rack, Wine } from '@/types/wine';
import { Link } from '@inertiajs/react';
import { History, LayoutGrid, MapPin } from 'lucide-react';
const money = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' });
export default function Dashboard({
    stats,
    racks,
    wines,
    events,
}: {
    stats: { bottles: number; wines: number; capacity: number; occupied: number; free: number; unplaced: number; total_value: number };
    racks: Rack[];
    wines: Wine[];
    events: BottleEvent[];
}) {
    return (
        <CellarLayout title="Din vinkällare" description="En plats för dina viner. Och nästa goda middag.">
            <div className="mb-5 grid grid-cols-2 gap-[9px] lg:grid-cols-4">
                {[
                    ['Flaskor hemma', stats.bottles],
                    ['Olika viner', stats.wines],
                    ['Samlingens värde', money.format(stats.total_value).replace(',00', '')],
                    ['Lediga platser', stats.free],
                ].map(([label, value]) => (
                    <div key={label} className="bg-card rounded-[18px] p-[15px]">
                        <p className="text-muted-foreground text-[11px]">{label}</p>
                        <p className="mt-1.5 text-[27px] font-semibold tracking-[-1px]">{value}</p>
                    </div>
                ))}
            </div>
            {stats.unplaced > 0 && (
                <div className="native-group mb-[22px]">
                    <NativeRow
                        title={stats.unplaced + ' oplacerade flaskor'}
                        subtitle="Ge varje flaska en plats"
                        href="/racks/unplaced"
                        icon={MapPin}
                    />
                </div>
            )}
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.2fr]">
                <section>
                    <h2 className="native-section-title">Dina vinhyllor</h2>
                    {racks.length ? (
                        <div className="native-group">
                            {racks.slice(0, 3).map((rack) => (
                                <NativeRow
                                    key={rack.id}
                                    title={rack.name}
                                    subtitle={`${rack.bottles_count ?? 0} av ${rack.rows * rack.columns} platser upptagna`}
                                    href={'/racks/' + rack.id}
                                    icon={LayoutGrid}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Börja med en hylla"
                            description="Ange rader och kolumner så skapar vi en plats för varje flaska."
                            href="/racks"
                            label="Skapa din första hylla"
                        />
                    )}
                    <Button asChild className="mt-3 w-full">
                        <Link href="/wines/create">Lägg till vin</Link>
                    </Button>
                    <Button asChild variant="secondary" className="mt-3 w-full lg:hidden">
                        <Link href="/pairing">Hitta vin till maten</Link>
                    </Button>
                    <section className="mt-[22px] hidden lg:block">
                        <h2 className="native-section-title">Senast tillagda</h2>
                        {wines.length ? (
                            <div className="native-group">
                                {wines.map((wine) => (
                                    <WineCard wine={wine} key={wine.id} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="Din första flaska?"
                                description="Lägg till ett vin med etikettfoto eller fyll i uppgifterna själv."
                                href="/wines/create"
                                label="Lägg till vin"
                            />
                        )}
                    </section>
                </section>
                <div className="flex flex-col gap-[22px]">
                    <section className="hidden lg:block">
                        <h2 className="native-section-title">Från hyllan till bordet</h2>
                        <div className="native-group p-[15px]">
                            <h3 className="text-[29px] leading-tight font-bold tracking-[-1px]">Vad blir det till middag?</h3>
                            <p className="text-muted-foreground mt-2 text-[13px] leading-relaxed">
                                Hitta ett passande vin bland flaskorna du redan har.
                            </p>
                            <Button asChild className="mt-3 w-full">
                                <Link href="/pairing">Hitta vin till maten</Link>
                            </Button>
                        </div>
                    </section>
                    <section>
                        <h2 className="native-section-title">Senaste aktivitet</h2>
                        {events.length ? (
                            <div className="native-group">
                                <EventList events={events.slice(0, 3)} />
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-[13px]">Din historik börjar när du lägger till en flaska.</p>
                        )}
                        <Link href="/activity" className="text-primary mt-3 inline-flex min-h-10 items-center gap-2 text-[13px]">
                            <History className="size-4" />
                            Visa all aktivitet
                        </Link>
                    </section>
                </div>
            </div>
        </CellarLayout>
    );
}
