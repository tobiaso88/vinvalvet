import { EmptyState, Pagination, Select, WineCard } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CellarLayout from '@/layouts/cellar-layout';
import { wineBodies, wineTypes, type Paginated, type Wine } from '@/types/wine';
import { Link, useForm, usePoll } from '@inertiajs/react';
import { FlaskConical, LoaderCircle } from 'lucide-react';
import { useEffect } from 'react';

interface ResearchProgress {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    eligible: number;
}

export default function WinesIndex({
    wines,
    filters,
    researchProgress,
}: {
    wines: Paginated<Wine>;
    filters: Record<string, string>;
    researchProgress: ResearchProgress;
}) {
    const form = useForm({
        q: filters.q ?? '',
        type: filters.type ?? '',
        body: filters.body ?? '',
        vintage: filters.vintage ?? '',
        stock: filters.stock ?? 'available',
    });
    const researchForm = useForm({});
    const researchActive = researchProgress.pending + researchProgress.processing > 0;
    const { start, stop } = usePoll(3000, { only: ['wines', 'researchProgress'] }, { autoStart: false, mode: 'rest' });

    useEffect(() => {
        if (researchActive) start();
        else stop();
        return stop;
    }, [researchActive, start, stop]);

    return (
        <CellarLayout
            title="Mina viner"
            description="Sök, upptäck och hitta rätt flaska i din samling."
            action={
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={researchForm.processing || researchActive || researchProgress.eligible === 0}
                        onClick={() => {
                            if (
                                window.confirm(
                                    `Starta webbresearch för ${researchProgress.eligible} vin? Varje vin använder ett separat AI-anrop som kan medföra kostnad.`,
                                )
                            ) {
                                researchForm.post('/wine-research-batches', { preserveScroll: true });
                            }
                        }}
                    >
                        {researchActive ? <LoaderCircle className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
                        {researchActive ? 'Research pågår' : `Researcha ${researchProgress.eligible} vin`}
                    </Button>
                    <Button asChild>
                        <Link href="/wines/create">Lägg till vin</Link>
                    </Button>
                </div>
            }
        >
            {(researchActive || researchProgress.completed > 0 || researchProgress.failed > 0) && (
                <div role="status" className="border-border bg-card mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border p-4 text-sm">
                    {researchActive && <LoaderCircle className="text-primary size-4 animate-spin" />}
                    <span>{researchProgress.pending} väntar</span>
                    <span>{researchProgress.processing} körs</span>
                    <span>{researchProgress.completed} klara</span>
                    {researchProgress.failed > 0 && <span className="text-destructive">{researchProgress.failed} misslyckade</span>}
                </div>
            )}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.get('/wines', { preserveState: true });
                }}
                className="border-border bg-card mb-7 grid gap-3 rounded-xl border p-4 sm:grid-cols-3 xl:grid-cols-6"
            >
                <Input
                    aria-label="Sök vin"
                    placeholder="Namn, producent, druva …"
                    value={form.data.q}
                    onChange={(e) => form.setData('q', e.target.value)}
                />
                <Select aria-label="Vintyp" value={form.data.type} onChange={(e) => form.setData('type', e.target.value)}>
                    <option value="">Alla vintyper</option>
                    {Object.entries(wineTypes).map(([v, l]) => (
                        <option key={v} value={v}>
                            {l}
                        </option>
                    ))}
                </Select>
                <Select aria-label="Fyllighet" value={form.data.body} onChange={(e) => form.setData('body', e.target.value)}>
                    <option value="">Alla fylligheter</option>
                    {Object.entries(wineBodies).map(([v, l]) => (
                        <option key={v} value={v}>
                            {l}
                        </option>
                    ))}
                </Select>
                <Input
                    aria-label="Årgång"
                    placeholder="Årgång eller nv"
                    value={form.data.vintage}
                    onChange={(e) => form.setData('vintage', e.target.value)}
                />
                <Select aria-label="Lagerstatus" value={form.data.stock} onChange={(e) => form.setData('stock', e.target.value)}>
                    <option value="available">Finns hemma</option>
                    <option value="all">Alla viner</option>
                    <option value="empty">Slut i lager</option>
                </Select>
                <Button disabled={form.processing}>Sök i samlingen</Button>
            </form>
            {wines.data.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {wines.data.map((wine) => (
                        <WineCard wine={wine} key={wine.id} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="Inga viner hittades"
                    description="Prova andra sökord eller lägg till ett vin i samlingen."
                    href="/wines/create"
                    label="Lägg till vin"
                />
            )}
            <Pagination page={wines} />
        </CellarLayout>
    );
}
