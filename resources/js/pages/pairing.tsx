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
                    className="mb-[22px] flex flex-col gap-3"
                >
                    <UtensilsCrossed className="text-primary mb-2 size-[18px]" />
                    <label htmlFor="dish" className="native-section-title">
                        Vad blir det till middag?
                    </label>
                    <textarea
                        id="dish"
                        required
                        minLength={3}
                        maxLength={2000}
                        value={dish}
                        onChange={(e) => setDish(e.target.value)}
                        className="bg-card placeholder:text-muted-foreground focus-visible:outline-primary min-h-32 w-full resize-y rounded-[18px] border-0 p-[15px] text-base leading-relaxed"
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
                                className="bg-secondary text-secondary-foreground min-h-11 rounded-[13px] px-3 py-2 text-xs"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                    <Button className="mt-0 w-full" disabled={busy}>
                        {busy && <LoaderCircle className="size-4 animate-spin" />}
                        {busy ? 'Letar efter en bra matchning …' : 'Hitta passande vin'}
                    </Button>
                </form>
                {busy && (
                    <div role="status" className="native-note mb-4">
                        <LoaderCircle className="mb-2 size-5 animate-spin" />
                        Letar bland flaskorna i din samling…
                        <div className="bg-muted mt-3 h-3 w-full animate-pulse rounded-full" />
                    </div>
                )}
                {error && (
                    <p role="alert" className="native-error">
                        {error}
                    </p>
                )}
                {result && (
                    <section aria-live="polite">
                        <h2 className="mb-3 text-2xl font-semibold tracking-tight">
                            {result.recommendations.length ? 'Från din egen samling' : 'Ingen matchning den här gången'}
                        </h2>
                        <p className="text-muted-foreground mb-4 text-[13px]">{result.message}</p>
                        <div className="flex flex-col gap-4">
                            {result.recommendations.map(({ wine, reason, rank }) => (
                                <article key={wine.id} className="native-group p-[15px]">
                                    <div className="flex items-start gap-4">
                                        <span className="bg-secondary text-primary inline-flex shrink-0 rounded-[7px] px-2 py-[5px] text-[11px] font-semibold">
                                            Förslag {rank}
                                        </span>
                                        <div>
                                            <WineBadge wine={wine} />
                                            <Link
                                                className="hover:text-primary mt-1 block text-2xl font-semibold tracking-tight"
                                                href={'/wines/' + wine.id}
                                            >
                                                {wine.name} · {wine.vintage ?? 'NV'}
                                            </Link>
                                            <p className="text-muted-foreground mt-3 text-[13px] leading-relaxed">{reason}</p>
                                            <div className="mt-4 flex flex-col gap-2">
                                                {wine.bottles?.map((b) =>
                                                    b.wine_rack_id ? (
                                                        <Link
                                                            key={b.id}
                                                            className="bg-secondary text-primary flex min-h-11 items-center gap-2 rounded-[13px] px-[13px] py-3 text-[13px] font-semibold"
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
