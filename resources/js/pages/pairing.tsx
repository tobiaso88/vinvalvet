import { WineBadge } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import CellarLayout from '@/layouts/cellar-layout';
import { jsonRequest } from '@/lib/json-request';
import type { PairingResult } from '@/types/wine';
import { Link } from '@inertiajs/react';
import { LoaderCircle, MapPin, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
export default function Pairing() {
    const [dish, setDish] = useState(''),
        [busy, setBusy] = useState(false),
        [error, setError] = useState(''),
        [result, setResult] = useState<PairingResult | null>(null);
    async function search() {
        setBusy(true);
        setError('');
        setResult(null);
        try {
            setResult(await jsonRequest<PairingResult>('/pairing-recommendations', { dish }));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Kunde inte hämta vinförslag.');
        } finally {
            setBusy(false);
        }
    }
    return (
        <CellarLayout title="Vin till maten" description="Det bästa vinet kanske redan ligger på din hylla. Berätta vad du ska laga.">
            <div className="max-w-3xl">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void search();
                    }}
                    className="border-border bg-card mb-8 rounded-xl border p-6 sm:p-8"
                >
                    <UtensilsCrossed className="text-primary mb-5 size-8" />
                    <label htmlFor="dish" className="mb-3 block font-serif text-2xl">
                        Vad blir det till middag?
                    </label>
                    <textarea
                        id="dish"
                        required
                        minLength={3}
                        maxLength={2000}
                        value={dish}
                        onChange={(e) => setDish(e.target.value)}
                        className="border-input bg-background min-h-32 w-full rounded-lg border p-4 text-sm"
                        placeholder="Till exempel ugnsbakad lax med citron, dill och en krämig sås …"
                    />
                    <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                        Ta gärna med sås, tillbehör och tillagning. Maträtten och vinuppgifter ur din samling skickas till OpenAI för analys.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {['Svamprisotto', 'Grillad entrecôte', 'Ugnsbakad lax'].map((example) => (
                            <button
                                type="button"
                                key={example}
                                onClick={() => setDish(example)}
                                className="border-border text-muted-foreground rounded-full border px-3 py-1.5 text-xs"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                    <Button className="mt-6" disabled={busy}>
                        {busy && <LoaderCircle className="size-4 animate-spin" />}
                        {busy ? 'Letar efter en bra matchning …' : 'Hitta passande vin'}
                    </Button>
                </form>
                {error && (
                    <p role="alert" className="bg-destructive/5 text-destructive rounded-lg p-4 text-sm">
                        {error}
                    </p>
                )}
                {result && (
                    <section aria-live="polite">
                        <h2 className="mb-3 font-serif text-2xl">
                            {result.recommendations.length ? 'Från din egen samling' : 'Ingen matchning den här gången'}
                        </h2>
                        <p className="text-muted-foreground mb-5 text-sm">{result.message}</p>
                        <div className="flex flex-col gap-4">
                            {result.recommendations.map(({ wine, reason, rank }) => (
                                <article key={wine.id} className="border-border bg-card rounded-xl border p-6">
                                    <div className="flex items-start gap-4">
                                        <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-full font-serif text-xl">
                                            {rank}
                                        </span>
                                        <div>
                                            <WineBadge wine={wine} />
                                            <Link className="hover:text-primary mt-1 block font-serif text-2xl" href={'/wines/' + wine.id}>
                                                {wine.name} · {wine.vintage ?? 'NV'}
                                            </Link>
                                            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{reason}</p>
                                            <div className="mt-4 flex flex-col gap-2">
                                                {wine.bottles?.map((b) =>
                                                    b.wine_rack_id ? (
                                                        <Link
                                                            key={b.id}
                                                            className="text-primary flex items-center gap-2 text-xs"
                                                            href={'/racks/' + b.wine_rack_id + '?bottle=' + b.id}
                                                        >
                                                            <MapPin className="size-3" />
                                                            {b.location} →
                                                        </Link>
                                                    ) : (
                                                        <span key={b.id} className="text-muted-foreground text-xs">
                                                            Flaska #{b.id} · Oplacerad
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                        {result.recommendations.length > 0 && (
                            <p className="text-muted-foreground mt-4 text-xs">Förslagen är rådgivande. Din egen smak har alltid sista ordet.</p>
                        )}
                    </section>
                )}
            </div>
        </CellarLayout>
    );
}
