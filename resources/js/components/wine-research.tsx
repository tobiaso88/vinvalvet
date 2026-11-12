import { Errors, NativeRow } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { type Wine, wineBodies, type WineResearchField } from '@/types/wine';
import { useForm, usePoll } from '@inertiajs/react';
import { CheckCircle2, ExternalLink, FlaskConical, LoaderCircle, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
    const [showSources, setShowSources] = useState(false);
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

    if (showSources) {
        return (
            <section className="flex flex-col gap-4">
                <Button variant="ghost" className="w-fit" onClick={() => setShowSources(false)}>
                    ← Tillbaka till research
                </Button>
                <h2 className="native-section-title">Betyg & källor</h2>
                {(research?.ratings ?? []).map((rating) => (
                    <a
                        key={rating.provider + rating.url}
                        href={rating.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-background rounded-[18px] p-[15px]"
                    >
                        <span className="text-primary text-xs font-semibold">
                            {rating.provider} <ExternalLink className="inline size-3" />
                        </span>
                        <span className="mt-2 block text-[31px] font-semibold tracking-[-1px]">
                            {rating.score} <span className="text-muted-foreground text-sm font-normal">/ {rating.scale}</span>
                        </span>
                        <span className="text-muted-foreground mt-2 block text-xs">
                            {rating.review_count.toLocaleString('sv-SE')} omdömen{rating.vintage ? ' · Årgång ' + rating.vintage : ''}
                        </span>
                        <span className="text-muted-foreground mt-1 block text-xs">
                            Kontrollerat {new Date(rating.observed_at).toLocaleDateString('sv-SE')}
                        </span>
                    </a>
                ))}
                <div className="native-group bg-background">
                    {(research?.sources ?? []).map((source) => (
                        <a key={source.url} className="native-row text-primary" href={source.url} target="_blank" rel="noopener noreferrer">
                            <span className="min-w-0 flex-1 text-sm">{source.title}</span>
                            <ExternalLink className="size-4" />
                        </a>
                    ))}
                </div>
                {!research?.ratings?.length && <p className="native-note">Inga verifierbara externa betyg hittades för rätt vin och årgång.</p>}
            </section>
        );
    }
    return (
        <section className="flex flex-col gap-4">
            <p className="text-muted-foreground text-[13px] leading-relaxed">Webbresearch med källor. Du bestämmer vilka tomma fält som fylls i.</p>
            {!active && (
                <Button className="w-full" variant="secondary" disabled={startForm.processing} onClick={runResearch}>
                    {research ? <RefreshCw /> : <FlaskConical />}
                    {research ? 'Gör om research' : 'Sök uppgifter på webben'}
                </Button>
            )}
            <Errors errors={{ ...startForm.errors, ...applyForm.errors }} />
            {active && (
                <>
                    <div role="status" className="native-note flex items-center gap-3">
                        <LoaderCircle className="size-5 shrink-0 animate-spin" />
                        {research?.status === 'pending' ? 'Väntar på att researchen ska starta …' : 'Söker och kontrollerar källor …'}
                    </div>
                    <div aria-hidden="true" className="bg-background animate-pulse space-y-3 rounded-[18px] p-4">
                        <div className="bg-muted h-3 rounded-full" />
                        <div className="bg-muted h-3 w-2/3 rounded-full" />
                        <div className="bg-muted h-3 rounded-full" />
                    </div>
                </>
            )}
            {!research && <p className="native-note">Ingen research har gjorts för det här vinet ännu.</p>}
            {research?.status === 'failed' && (
                <p role="alert" className="native-error">
                    {research.error_message ?? 'Researchen kunde inte slutföras. Försök igen.'}
                </p>
            )}
            {research?.status === 'completed' && (
                <>
                    {research.researched_at && (
                        <p className="text-muted-foreground text-[11px]">
                            Senast kontrollerat{' '}
                            {new Date(research.researched_at).toLocaleString('sv-SE', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                    )}
                    {availableFields.length ? (
                        <form
                            className="flex flex-col gap-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyForm.patch('/wine-researches/' + research.id, { preserveScroll: true });
                            }}
                        >
                            <h2 className="native-section-title">Föreslagna uppgifter</h2>
                            <div className="native-group bg-background divide-border divide-y">
                                {availableFields.map((field) => (
                                    <label key={field} className="flex cursor-pointer items-start gap-2.5 p-[13px]">
                                        <input
                                            type="checkbox"
                                            className="accent-primary mt-0.5 size-[18px] shrink-0"
                                            checked={applyForm.data.fields.includes(field)}
                                            onChange={() => toggleField(field)}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[13px] font-medium">
                                                {fieldLabels[field]} ·{' '}
                                                {displayValue(field, research.suggestions!.fields[field] as string | number | string[])}
                                            </span>
                                            <span className="text-muted-foreground mt-1 block text-[11px]">
                                                Säkerhet: {confidenceLabels[research.suggestions!.confidence[field] ?? 'unknown']}
                                            </span>
                                            {(research.suggestions!.source_urls[field] ?? []).map((url) => (
                                                <a
                                                    key={url}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary mt-2 inline-flex min-h-8 items-center gap-1 text-xs"
                                                >
                                                    Källa <ExternalLink className="size-3" />
                                                </a>
                                            ))}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <p className="native-note">Fyller valda tomma fält. Granska uppgifter och källor innan du godkänner.</p>
                            <Button disabled={applyForm.processing || !applyForm.data.fields.length}>
                                <CheckCircle2 />
                                {applyForm.processing ? 'Sparar…' : 'Godkänn valda uppgifter'}
                            </Button>
                        </form>
                    ) : (
                        <p className="native-note">Inga nya tomma fält kunde fyllas från säkra källor.</p>
                    )}
                    <div className="native-group bg-background">
                        <NativeRow title="Externa betyg & källor" subtitle="Verifierad årgång och skala" onClick={() => setShowSources(true)} />
                    </div>
                    {!!research.warnings?.length && (
                        <div className="native-note">
                            {research.warnings.map((warning) => (
                                <p key={warning}>{warning}</p>
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
