import { Button } from '@/components/ui/button';
import { type BottleEvent, eventTypes, type Paginated, typeColors, type Wine, wineTypes } from '@/types/wine';
import { Link } from '@inertiajs/react';
import { ChevronRight, History, Wine as WineIcon } from 'lucide-react';
import type { ComponentType, ReactNode, SelectHTMLAttributes } from 'react';

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <label className="native-field">
            <span>{label}</span>
            {children}
            {error && (
                <span role="alert" className="text-destructive text-xs">
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
                'border-input bg-card focus:ring-ring min-h-11 w-full rounded-[13px] border px-3 text-base outline-none focus:ring-2 ' +
                (props.className ?? '')
            }
        />
    );
}
export function Errors({ errors }: { errors: Record<string, string | undefined> }) {
    return Object.keys(errors).length > 0 ? (
        <div role="alert" className="native-error">
            {Object.entries(errors).map(([key, value]) => (
                <p key={key}>{value}</p>
            ))}
        </div>
    ) : null;
}
export function EmptyState({ title, description, href, label }: { title: string; description: string; href?: string; label?: string }) {
    return (
        <div className="px-2 py-8 text-center">
            <WineIcon className="text-primary/50 mx-auto mb-4 size-8" />
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
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
export function NativeRow({
    title,
    subtitle,
    value,
    href,
    onClick,
    icon: Icon,
    destructive = false,
}: {
    title: string;
    subtitle?: string;
    value?: ReactNode;
    href?: string;
    onClick?: () => void;
    icon?: ComponentType<{ className?: string }>;
    destructive?: boolean;
}) {
    const content = (
        <>
            {Icon && <Icon className="text-primary size-[18px] shrink-0" />}
            <span className="min-w-0 flex-1">
                <span className={'block text-sm leading-snug font-medium ' + (destructive ? 'text-destructive' : '')}>{title}</span>
                {subtitle && <span className="text-muted-foreground mt-1 block text-xs leading-snug">{subtitle}</span>}
            </span>
            {value != null && <span className="text-muted-foreground shrink-0 text-[13px]">{value}</span>}
            {(href || onClick) && <ChevronRight className="text-muted-foreground size-[13px] shrink-0" />}
        </>
    );
    if (href)
        return (
            <Link href={href} className="native-row hover:bg-muted/30">
                {content}
            </Link>
        );
    if (onClick)
        return (
            <button type="button" onClick={onClick} className="native-row hover:bg-muted/30">
                {content}
            </button>
        );
    return <div className="native-row">{content}</div>;
}
export function BottleImage({ wine }: { wine: Wine }) {
    return wine.label_url ? (
        <img src={wine.label_url} alt={'Flaskbild för ' + wine.name} className="h-40 w-20 shrink-0 object-contain" />
    ) : (
        <div className="native-bottle" role="img" aria-label={'Flaskbild för ' + wine.name}>
            <span className="native-bottle-label">{wine.name}</span>
        </div>
    );
}
export function WineCard({ wine }: { wine: Wine }) {
    const count = wine.bottles?.length ?? wine.bottles_count ?? 0;
    return (
        <Link href={'/wines/' + wine.id} className="native-row hover:bg-muted/30">
            {wine.label_url ? (
                <img src={wine.label_url} alt="" className="h-[54px] w-[26px] shrink-0 object-contain" loading="lazy" />
            ) : (
                <WineIcon className="text-primary h-[54px] w-[26px] shrink-0 stroke-[1.4]" />
            )}
            <span className="min-w-0 flex-1">
                <h3 className="text-sm leading-snug font-semibold">{wine.name}</h3>
                <span className="text-muted-foreground mt-1 block text-xs">
                    {wine.vintage ?? 'NV'} · {wine.country ?? wine.producer ?? wineTypes[wine.type]}
                </span>
                {wine.research && wine.research.status !== 'completed' && (
                    <span className="text-muted-foreground mt-1 block text-[11px]">
                        Research {wine.research.status === 'failed' ? 'misslyckades' : wine.research.status === 'processing' ? 'pågår' : 'väntar'}
                    </span>
                )}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs">{count} fl.</span>
            <ChevronRight className="text-muted-foreground size-[13px] shrink-0" />
        </Link>
    );
}
export function EventList({ events }: { events: BottleEvent[] }) {
    return (
        <div className="divide-border divide-y">
            {events.map((event) => (
                <div key={event.id} className="flex items-start gap-2.5 px-[13px] py-3.5">
                    <History className="text-primary mt-0.5 size-[18px] shrink-0" />
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
        <div className="text-muted-foreground mt-6 flex flex-wrap items-center justify-between gap-3 text-xs">
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
