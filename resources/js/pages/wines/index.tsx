import { EmptyState, Pagination, Select, WineCard } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CellarLayout from '@/layouts/cellar-layout';
import { wineBodies, wineTypes, type Paginated, type Wine } from '@/types/wine';
import { Link, useForm } from '@inertiajs/react';
export default function WinesIndex({ wines, filters }: { wines: Paginated<Wine>; filters: Record<string, string> }) {
    const form = useForm({
        q: filters.q ?? '',
        type: filters.type ?? '',
        body: filters.body ?? '',
        vintage: filters.vintage ?? '',
        stock: filters.stock ?? 'available',
    });
    return (
        <CellarLayout
            title="Mina viner"
            description="Sök, upptäck och hitta rätt flaska i din samling."
            action={
                <Button asChild>
                    <Link href="/wines/create">Lägg till vin</Link>
                </Button>
            }
        >
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
