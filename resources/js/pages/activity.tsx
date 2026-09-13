import { EmptyState, EventList, Field, Pagination, Select } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CellarLayout from '@/layouts/cellar-layout';
import { type BottleEvent, type Paginated, type Wine, eventTypes } from '@/types/wine';
import { useForm } from '@inertiajs/react';
export default function Activity({ events, wines, filters }: { events: Paginated<BottleEvent>; wines: Wine[]; filters: Record<string, string> }) {
    const form = useForm({ type: filters.type ?? '', wine_id: filters.wine_id ?? '', from: filters.from ?? '', to: filters.to ?? '' });
    return (
        <CellarLayout title="Aktivitet" description="Små och stora händelser i din vinkällare.">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.get('/activity', { preserveState: true });
                }}
                className="border-border bg-card mb-6 grid items-end gap-4 rounded-xl border p-5 sm:grid-cols-2 xl:grid-cols-5"
            >
                <Field label="Händelse">
                    <Select value={form.data.type} onChange={(e) => form.setData('type', e.target.value)}>
                        <option value="">Alla händelser</option>
                        {Object.entries(eventTypes).map(([v, l]) => (
                            <option value={v} key={v}>
                                {l}
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field label="Vin">
                    <Select value={form.data.wine_id} onChange={(e) => form.setData('wine_id', e.target.value)}>
                        <option value="">Alla viner</option>
                        {wines.map((w) => (
                            <option key={w.id} value={w.id}>
                                {w.name} · {w.vintage ?? 'NV'}
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field label="Från datum">
                    <Input type="date" value={form.data.from} onChange={(e) => form.setData('from', e.target.value)} />
                </Field>
                <Field label="Till datum">
                    <Input type="date" value={form.data.to} onChange={(e) => form.setData('to', e.target.value)} />
                </Field>
                <Button disabled={form.processing}>Filtrera</Button>
            </form>
            {events.data.length ? (
                <div className="border-border bg-card rounded-xl border px-6">
                    <EventList events={events.data} />
                </div>
            ) : (
                <EmptyState title="Ingen aktivitet hittades" description="Ändra dina filter eller lägg till flaskor i samlingen." />
            )}
            <Pagination page={events} />
        </CellarLayout>
    );
}
