import { Errors } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { type Wine, wineBodies, type WineResearchField } from '@/types/wine';
import { useForm, usePoll } from '@inertiajs/react';
import { CheckCircle2, ExternalLink, FlaskConical, LoaderCircle, RefreshCw } from 'lucide-react';
import { useEffect, useMemo } from 'react';

const fieldLabels: Record<WineResearchField, string> = {
    producer: 'Producent',
    vintage: 'Årgång',
    country: 'Land',
    region: 'Region',
    ean: 'EAN',
    systembolaget_number: 'Systembolagets artikelnummer',
    alcohol: 'Alkohol',
    body: 'Fyllighet',
    grapes: 'Druvor',
};
const confidenceLabels = { high: 'hög', medium: 'medel', low: 'låg', unknown: 'okänd' } as const;

function displayValue(field: WineResearchField, value: string | number | string[]): string {
    if (field === 'grapes' && Array.isArray(value)) return value.join(', ');
    if (field === 'body' && typeof value === 'string' && value in wineBodies) return wineBodies[value as keyof typeof wineBodies];
    if (field === 'alcohol') return `${value} %`;
    return String(value);
}

function isWineFieldEmpty(wine: Wine, field: WineResearchField): boolean {
    if (field === 'grapes') return wine.grapes.length === 0;
    const value = wine[field];
    return value === null || value === '';
}

export default function WineResearchCard({ wine }: { wine: Wine }) {
    const research = wine.research;
    const active = research?.status === 'pending' || research?.status === 'processing';
    const startForm = useForm({});
    const applyForm = useForm({ fields: [] as WineResearchField[] });
    const availableFields = useMemo(() => {
        if (research?.status !== 'completed' || !research.suggestions) return [];
        return (Object.keys(fieldLabels) as WineResearchField[]).filter((field) => {
            const value = research.suggestions?.fields[field];
            return (
                isWineFieldEmpty(wine, field) && value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0)
            );
        });
    }, [research, wine]);
    const availableFieldKey = availableFields.join(',');
    const { start, stop } = usePoll(3000, { only: ['wine'] }, { autoStart: false, mode: 'rest' });

    useEffect(() => {
        if (active) start();
        else stop();
        return stop;
    }, [active, start, stop]);

    useEffect(() => {
        applyForm.setData('fields', availableFields);
        // The timestamp changes whenever a completed result is replaced.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [research?.researched_at, availableFieldKey]);

    function runResearch() {
        startForm.post(`/wines/${wine.id}/research`, { preserveScroll: true });
    }

    function toggleField(field: WineResearchField) {
        applyForm.setData(
            'fields',
            applyForm.data.fields.includes(field) ? applyForm.data.fields.filter((item) => item !== field) : [...applyForm.data.fields, field],
        );
    }

    return (
        <section className="border-border bg-card flex flex-col gap-5 rounded-xl border p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <FlaskConical className="text-primary size-5" />
                        <h2 className="font-serif text-2xl">Vinresearch</h2>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">Webbresearch med källor. Du bestämmer vilka tomma fält som fylls i.</p>
                </div>
                {!active && (
                    <Button type="button" variant="outline" disabled={startForm.processing} onClick={runResearch}>
                        {research ? <RefreshCw className="size-4" /> : <FlaskConical className="size-4" />}
                        {research ? 'Gör om research' : 'Starta research'}
                    </Button>
                )}
            </div>
            <Errors errors={{ ...startForm.errors, ...applyForm.errors }} />
            {active && (
                <div role="status" className="bg-muted/60 flex items-center gap-3 rounded-lg p-4 text-sm">
                    <LoaderCircle className="text-primary size-5 animate-spin" />
                    {research?.status === 'pending' ? 'Väntar på att researchen ska starta …' : 'Söker och kontrollerar källor …'}
                </div>
            )}
            {!research && <p className="text-muted-foreground text-sm">Ingen research har gjorts för det här vinet ännu.</p>}
            {research?.status === 'failed' && (
                <p role="alert" className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
                    {research.error_message}
                </p>
            )}
            {research?.status === 'completed' && (
                <>
                    {research.researched_at && (
                        <p className="text-muted-foreground text-xs">
                            Senast kontrollerat{' '}
                            {new Date(research.researched_at).toLocaleString('sv-SE', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                    )}
                    {availableFields.length > 0 ? (
                        <form
                            className="flex flex-col gap-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (!research) return;
                                applyForm.patch(`/wine-researches/${research.id}`, { preserveScroll: true });
                            }}
                        >
                            <div className="divide-border divide-y rounded-lg border">
                                {availableFields.map((field) => {
                                    const value = research.suggestions!.fields[field] as string | number | string[];
                                    const urls = research.suggestions!.source_urls[field] ?? [];
                                    return (
                                        <label key={field} className="flex cursor-pointer items-start gap-3 p-4">
                                            <input
                                                type="checkbox"
                                                className="accent-primary mt-1 size-4"
                                                checked={applyForm.data.fields.includes(field)}
                                                onChange={() => toggleField(field)}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="text-muted-foreground block text-xs">{fieldLabels[field]}</span>
                                                <span className="mt-1 block text-sm font-medium">{displayValue(field, value)}</span>
                                                <span className="text-muted-foreground mt-1 block text-xs">
                                                    Säkerhet: {confidenceLabels[research.suggestions!.confidence[field] ?? 'unknown']}
                                                </span>
                                                {urls.length > 0 && (
                                                    <span className="mt-2 flex flex-wrap gap-3">
                                                        {urls.map((url) => (
                                                            <a
                                                                key={url}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                                                            >
                                                                Källa <ExternalLink className="size-3" />
                                                            </a>
                                                        ))}
                                                    </span>
                                                )}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            <Button disabled={applyForm.processing || applyForm.data.fields.length === 0}>
                                <CheckCircle2 className="size-4" /> Godkänn valda uppgifter
                            </Button>
                        </form>
                    ) : (
                        <p className="text-muted-foreground text-sm">Inga nya tomma fält kunde fyllas från säkra källor.</p>
                    )}
                    {(research.ratings?.length ?? 0) > 0 && (
                        <div>
                            <h3 className="text-sm font-medium">Verifierbara externa betyg</h3>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {research.ratings!.map((rating) => (
                                    <a
                                        key={`${rating.provider}-${rating.url}`}
                                        href={rating.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border-border hover:border-primary/40 rounded-lg border p-4"
                                    >
                                        <span className="text-sm font-medium">{rating.provider}</span>
                                        <span className="mt-1 block font-serif text-2xl">
                                            {rating.score} / {rating.scale}
                                        </span>
                                        <span className="text-muted-foreground mt-1 block text-xs">
                                            {rating.review_count.toLocaleString('sv-SE')} omdömen{rating.vintage ? ` · ${rating.vintage}` : ''}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    {(research.sources?.length ?? 0) > 0 && (
                        <div>
                            <h3 className="text-sm font-medium">Källor och recensioner</h3>
                            <ul className="mt-3 flex flex-col gap-2">
                                {research.sources!.map((source) => (
                                    <li key={source.url}>
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                                        >
                                            {source.title} <ExternalLink className="size-3" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {(research.warnings?.length ?? 0) > 0 && (
                        <div className="border-border bg-muted/40 rounded-lg border p-4 text-sm">
                            {research.warnings!.map((warning) => (
                                <p key={warning}>{warning}</p>
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
