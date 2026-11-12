import { EmptyState, EventList, Field, Pagination, Select } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import CellarLayout from '@/layouts/cellar-layout';
import { type BottleEvent, type Paginated, type Wine, eventTypes } from '@/types/wine';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
export default function Activity({ events, wines, filters }: { events: Paginated<BottleEvent>; wines: Wine[]; filters: Record<string, string> }) {
    const [filterOpen, setFilterOpen] = useState(false);
    const form = useForm({ type: filters.type ?? '', wine_id: filters.wine_id ?? '', from: filters.from ?? '', to: filters.to ?? '' });
    const today = new Date().toLocaleDateString('sv-SE');
    const previousDay = new Date();
    previousDay.setDate(previousDay.getDate() - 1);
    const yesterday = previousDay.toLocaleDateString('sv-SE');
    const days = events.data.reduce<Record<string, BottleEvent[]>>((groups, event) => {
        const day = new Date(event.created_at).toLocaleDateString('sv-SE');
        (groups[day] ??= []).push(event);
        return groups;
    }, {});
    return (
        <CellarLayout title="Aktivitet" description="Historiken i din vinkällare." back={{ href: '/settings', label: 'Mer' }}>
            <Button variant="secondary" className="mb-[22px] w-full" onClick={() => setFilterOpen(true)}>
                Filtrera händelser
            </Button>
            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Filtrera aktivitet</DialogTitle>
                        <DialogDescription>Välj vin, händelse och datum.</DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.get('/activity', { preserveState: true, onSuccess: () => setFilterOpen(false) });
                        }}
                        className="flex flex-col gap-3"
                    >
                        <div className="native-fields">
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
                        </div>
                        <Button disabled={form.processing}>Visa händelser</Button>
                        <Button type="button" variant="secondary" onClick={() => form.setData({ type: '', wine_id: '', from: '', to: '' })}>
                            Rensa filter
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
            {events.data.length ? (
                <div className="flex flex-col gap-[22px]">
                    {Object.entries(days).map(([day, dayEvents]) => (
                        <section key={day}>
                            <h2 className="native-section-title">{day === today ? 'Idag' : day === yesterday ? 'Igår' : day}</h2>
                            <div className="native-group">
                                <EventList events={dayEvents} />
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <EmptyState title="Ingen aktivitet hittades" description="Ändra dina filter eller lägg till flaskor i samlingen." />
            )}
            <Pagination page={events} />
        </CellarLayout>
    );
}
