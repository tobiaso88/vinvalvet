import { EmptyState, Errors, Field, Pagination, Select, WineCard } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import CellarLayout from '@/layouts/cellar-layout';
import { wineBodies, wineTypes, type Paginated, type Wine } from '@/types/wine';
import { Link, useForm, usePoll } from '@inertiajs/react';
import { FlaskConical, LoaderCircle, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    const [filterOpen, setFilterOpen] = useState(false);
    const [researchOpen, setResearchOpen] = useState(false);
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
            action={
                <Button asChild variant="ghost" size="icon" className="bg-card text-primary size-9">
                    <Link href="/wines/create" aria-label="Lägg till vin">
                        <Plus />
                    </Link>
                </Button>
            }
        >
            {(researchActive || researchProgress.completed > 0 || researchProgress.failed > 0) && (
                <div role="status" className="native-note mb-5 flex flex-wrap items-center gap-x-5 gap-y-2">
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
                className="mb-3"
            >
                <div className="native-search">
                    <Search className="size-[18px]" />
                    <Input
                        aria-label="Sök vin"
                        placeholder="Namn, producent, druva…"
                        value={form.data.q}
                        onChange={(e) => form.setData('q', e.target.value)}
                    />
                    <button type="submit" className="text-primary shrink-0 text-xs font-medium" disabled={form.processing}>
                        Sök i samlingen
                    </button>
                </div>
            </form>
            <Button variant="secondary" className="mb-[22px] w-full" onClick={() => setFilterOpen(true)}>
                <SlidersHorizontal />
                Filter · {form.data.stock === 'available' ? 'Finns hemma' : form.data.stock === 'empty' ? 'Slut i lager' : 'Alla viner'}
            </Button>
            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Filtrera viner</DialogTitle>
                        <DialogDescription>Hitta en flaska för rätt tillfälle.</DialogDescription>
                    </DialogHeader>
                    <form
                        className="flex flex-col gap-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.get('/wines', { preserveState: true, onSuccess: () => setFilterOpen(false) });
                        }}
                    >
                        <div className="native-fields">
                            <Field label="Sökord">
                                <Input value={form.data.q} onChange={(e) => form.setData('q', e.target.value)} />
                            </Field>
                            <Field label="Vintyp">
                                <Select value={form.data.type} onChange={(e) => form.setData('type', e.target.value)}>
                                    <option value="">Alla vintyper</option>
                                    {Object.entries(wineTypes).map(([v, l]) => (
                                        <option key={v} value={v}>
                                            {l}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                            <Field label="Fyllighet">
                                <Select value={form.data.body} onChange={(e) => form.setData('body', e.target.value)}>
                                    <option value="">Alla fylligheter</option>
                                    {Object.entries(wineBodies).map(([v, l]) => (
                                        <option key={v} value={v}>
                                            {l}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                            <Field label="Årgång">
                                <Input
                                    value={form.data.vintage}
                                    placeholder="Årtal eller NV"
                                    onChange={(e) => form.setData('vintage', e.target.value)}
                                />
                            </Field>
                            <Field label="Lagerstatus">
                                <Select value={form.data.stock} onChange={(e) => form.setData('stock', e.target.value)}>
                                    <option value="available">Finns hemma</option>
                                    <option value="all">Alla viner</option>
                                    <option value="empty">Slut i lager</option>
                                </Select>
                            </Field>
                        </div>
                        <Button disabled={form.processing}>Visa viner</Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                form.setData({ q: '', type: '', body: '', vintage: '', stock: 'available' });
                            }}
                        >
                            Rensa filter
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
            {wines.data.length ? (
                <div className="native-group">
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
            <Button
                variant="secondary"
                className="mt-5 w-full"
                onClick={() => setResearchOpen(true)}
                disabled={researchActive || researchProgress.eligible === 0}
            >
                <FlaskConical />
                {researchActive ? 'Research pågår' : 'Researcha samlingen'}
            </Button>
            <Dialog open={researchOpen} onOpenChange={setResearchOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Researcha samlingen</DialogTitle>
                        <DialogDescription>{researchProgress.eligible} viner saknar kompletterande uppgifter.</DialogDescription>
                    </DialogHeader>
                    <p className="native-note">Varje vin använder ett separat AI-anrop som kan medföra kostnad. Inga förslag godkänns automatiskt.</p>
                    <Errors errors={researchForm.errors} />
                    <Button
                        disabled={researchForm.processing}
                        onClick={() => researchForm.post('/wine-research-batches', { preserveScroll: true, onSuccess: () => setResearchOpen(false) })}
                    >
                        Starta research för {researchProgress.eligible} viner
                    </Button>
                    <Button variant="secondary" onClick={() => setResearchOpen(false)}>
                        Avbryt
                    </Button>
                </DialogContent>
            </Dialog>
        </CellarLayout>
    );
}
