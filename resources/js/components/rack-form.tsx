import { Errors, Field } from '@/components/cellar';
import RackGrid from '@/components/rack-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Rack } from '@/types/wine';
import { useForm } from '@inertiajs/react';
export default function RackForm({ rack, onSaved }: { rack?: Rack; onSaved?: () => void }) {
    const form = useForm({ name: rack?.name ?? '', description: rack?.description ?? '', rows: rack?.rows ?? 4, columns: rack?.columns ?? 6 });
    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
                e.preventDefault();
                if (rack) form.put('/racks/' + rack.id, { onSuccess: onSaved });
                else form.post('/racks', { onSuccess: onSaved });
            }}
        >
            <Errors errors={form.errors} />
            <div className="native-fields">
                <Field label="Hyllans namn">
                    <Input
                        required
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="Till exempel källaren"
                    />
                </Field>
                <Field label="Beskrivning">
                    <Input
                        value={form.data.description}
                        onChange={(e) => form.setData('description', e.target.value)}
                        placeholder="Var står hyllan?"
                    />
                </Field>
                <div className="grid grid-cols-2">
                    <Field label="Antal rader (A–Z)">
                        <Input
                            type="number"
                            min="1"
                            max="26"
                            required
                            value={form.data.rows}
                            onChange={(e) => form.setData('rows', Number(e.target.value))}
                        />
                    </Field>
                    <Field label="Antal kolumner">
                        <Input
                            type="number"
                            min="1"
                            max="50"
                            required
                            value={form.data.columns}
                            onChange={(e) => form.setData('columns', Number(e.target.value))}
                        />
                    </Field>
                </div>
            </div>
            <RackGrid
                rack={{
                    id: rack?.id ?? 0,
                    name: form.data.name || 'Ny hylla',
                    description: null,
                    rows: Math.max(1, Math.min(26, form.data.rows)),
                    columns: Math.max(1, Math.min(50, form.data.columns)),
                }}
                compact
                readOnly
            />
            <p className="text-muted-foreground text-xs">{form.data.rows * form.data.columns} platser, en flaska per plats.</p>
            <Button disabled={form.processing}>{rack ? 'Spara hylla' : 'Skapa hylla'}</Button>
        </form>
    );
}
