import { Button } from '@/components/ui/button';
import { type BottleEvent, eventTypes, type Paginated, typeColors, type Wine, wineTypes } from '@/types/wine';
import { Link } from '@inertiajs/react';
import { ArrowRight, MapPin, Wine as WineIcon } from 'lucide-react';
import type { ReactNode, SelectHTMLAttributes } from 'react';

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <label className="flex flex-col gap-2 text-sm font-medium">
            {label}
            {children}
            {error && (
                <span role="alert" className="text-destructive text-xs font-normal">
                    {error}
                </span>
            )}
        </label>
    );
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className={
                'border-input bg-card focus:ring-ring h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 ' + (props.className ?? '')
            }
        />
    );
}
export function Errors({ errors }: { errors: Record<string, string | undefined> }) {
    return Object.keys(errors).length > 0 ? (
        <div role="alert" className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
            {Object.entries(errors).map(([key, value]) => (
                <p key={key}>{value}</p>
            ))}
        </div>
    ) : null;
}
export function EmptyState({ title, description, href, label }: { title: string; description: string; href?: string; label?: string }) {
    return (
        <div className="border-border bg-card rounded-xl border border-dashed px-5 py-12 text-center">
            <WineIcon className="text-primary/50 mx-auto mb-4 size-8" />
            <h2 className="font-serif text-2xl">{title}</h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-relaxed">{description}</p>
            {href && (
                <Button asChild className="mt-5">
                    <Link href={href}>{label}</Link>
                </Button>
            )}
        </div>
    );
}
export function WineBadge({ wine }: { wine: Wine }) {
    return (
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <span className="size-2 rounded-full" style={{ background: typeColors[wine.type] }} />
            {wineTypes[wine.type]}
        </span>
    );
}
export function WineCard({ wine }: { wine: Wine }) {
    const count = wine.bottles?.length ?? wine.bottles_count ?? 0;
    return (
        <Link
            href={'/wines/' + wine.id}
            className="group border-border bg-card hover:border-primary/40 flex overflow-hidden rounded-xl border transition"
        >
            <div className="bg-muted/60 flex w-24 shrink-0 items-center justify-center p-3 sm:w-28">
                {wine.label_url ? (
                    <img src={wine.label_url} alt={'Flaskbild för ' + wine.name} className="h-32 w-full rounded object-contain" loading="lazy" />
                ) : (
                    <WineIcon className="h-24 w-12 stroke-[1]" style={{ color: typeColors[wine.type] }} />
                )}
            </div>
            <div className="min-w-0 flex-1 p-5">
                <WineBadge wine={wine} />
                <h3 className="group-hover:text-primary mt-2 truncate font-serif text-xl">{wine.name}</h3>
                <p className="text-muted-foreground mt-1 truncate text-xs">
                    {wine.producer ?? wine.country ?? 'Producent ej angiven'} · {wine.vintage ?? 'NV'}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2 text-xs">
                    <span>
                        {count} {count === 1 ? 'flaska' : 'flaskor'}
                    </span>
                    <ArrowRight className="text-primary size-4" />
                </div>
                {wine.research && (
                    <p className="text-muted-foreground mt-2 text-xs">
                        Research:{' '}
                        {wine.research.status === 'completed'
                            ? 'klar'
                            : wine.research.status === 'failed'
                              ? 'misslyckades'
                              : wine.research.status === 'processing'
                                ? 'pågår'
                                : 'väntar'}
                    </p>
                )}
                {wine.bottles && (
                    <p className="text-muted-foreground mt-2 flex items-center gap-1 truncate text-xs">
                        <MapPin className="size-3 shrink-0" />
                        {wine.bottles[0]?.location ?? 'Inga flaskor'}
                        {count > 1 ? ' +' + (count - 1) : ''}
                    </p>
                )}
            </div>
        </Link>
    );
}
export function EventList({ events }: { events: BottleEvent[] }) {
    return (
        <div className="divide-border divide-y">
            {events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 py-4">
                    <span className="bg-primary/50 mt-1 size-2 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm">
                            <span className="font-medium">{eventTypes[event.type]}</span> ·{' '}
                            <Link href={'/wines/' + event.bottle.wine_id} className="hover:underline">
                                {event.bottle.wine?.name}
                            </Link>
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {event.from_location}
                            {event.from_location && event.to_location ? ' → ' : ''}
                            {event.to_location}
                        </p>
                    </div>
                    <time dateTime={event.created_at} className="text-muted-foreground max-w-28 shrink-0 text-right text-[11px]">
                        {new Date(event.created_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}
                    </time>
                </div>
            ))}
        </div>
    );
}
export function Pagination({ page }: { page: Paginated<unknown> }) {
    return (
        <div className="text-muted-foreground mt-6 flex items-center justify-between text-xs">
            <span>
                {page.total} resultat · Sida {page.current_page} av {page.last_page}
            </span>
            <div className="flex gap-2">
                {page.prev_page_url && (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={page.prev_page_url}>Föregående</Link>
                    </Button>
                )}
                {page.next_page_url && (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={page.next_page_url}>Nästa</Link>
                    </Button>
                )}
            </div>
        </div>
    );
}
