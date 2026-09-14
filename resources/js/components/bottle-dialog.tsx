import BottleFinancials from '@/components/bottle-financials';
import { Errors, Field, Select } from '@/components/cellar';
import RackGrid from '@/components/rack-grid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Bottle, Rack, RackSlot } from '@/types/wine';
import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
export default function BottleDialog({
    bottle,
    slot,
    racks,
    unplaced = [],
    onClose,
}: {
    bottle?: Bottle;
    slot?: RackSlot;
    racks: Rack[];
    unplaced?: Bottle[];
    onClose: () => void;
}) {
    const [rackId, setRackId] = useState(slot?.wine_rack_id ?? bottle?.wine_rack_id ?? racks[0]?.id ?? 0);
    const [chosen, setChosen] = useState<RackSlot | null>(slot ?? null);
    const [bottleId, setBottleId] = useState(unplaced[0]?.id ?? 0);
    const [confirm, setConfirm] = useState<'consume' | 'remove' | null>(null);
    const form = useForm<{ wine_rack_id: number | null; row: number | null; column: number | null }>({ wine_rack_id: null, row: null, column: null });
    const rack = racks.find((r) => r.id === rackId);
    function place(position: RackSlot | null) {
        form.transform(() => ({ wine_rack_id: position?.wine_rack_id ?? null, row: position?.row ?? null, column: position?.column ?? null }));
        form.patch('/bottles/' + (bottle?.id ?? bottleId) + '/place', { onSuccess: onClose, preserveScroll: true });
    }
    function finish() {
        if (confirm === 'consume') form.post('/bottles/' + bottle?.id + '/consume', { onSuccess: onClose });
        else form.delete('/bottles/' + bottle?.id, { onSuccess: onClose });
    }
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{bottle ? (bottle.wine?.name ?? 'Hantera flaska') : 'Placera en flaska'}</DialogTitle>
                    <DialogDescription>
                        {bottle
                            ? bottle.location
                            : 'Välj en oplacerad flaska till ' + String.fromCharCode(64 + (slot?.row ?? 1)) + (slot?.column ?? 1) + '.'}
                    </DialogDescription>
                </DialogHeader>
                <Errors errors={form.errors} />
                {bottle && <BottleFinancials bottle={bottle} />}
                {bottle ? (
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link href={'/wines/' + bottle.wine_id}>Visa vinet</Link>
                        </Button>
                        <Button variant="outline" onClick={() => setConfirm('consume')}>
                            Markera konsumerad
                        </Button>
                        <Button variant="ghost" onClick={() => setConfirm('remove')}>
                            Ta ur lagret
                        </Button>
                    </div>
                ) : (
                    <Field label="Flaska">
                        <Select value={bottleId} onChange={(e) => setBottleId(Number(e.target.value))}>
                            {unplaced.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.wine?.name} · {b.wine?.vintage ?? 'NV'} · Flaska #{b.id}
                                </option>
                            ))}
                        </Select>
                    </Field>
                )}
                {!bottle && !unplaced.length ? (
                    <p className="text-muted-foreground text-sm">
                        Alla dina flaskor har redan en plats.{' '}
                        <Link href="/wines/create" className="text-primary underline">
                            Lägg till vin
                        </Link>{' '}
                        eller flytta en flaska från en annan plats.
                    </p>
                ) : (
                    <>
                        {bottle && (
                            <>
                                <Field label="Flytta till hylla">
                                    <Select
                                        value={rackId}
                                        onChange={(e) => {
                                            setRackId(Number(e.target.value));
                                            setChosen(null);
                                        }}
                                    >
                                        {racks.map((r) => (
                                            <option value={r.id} key={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </Select>
                                </Field>
                                {rack && (
                                    <RackGrid
                                        rack={rack}
                                        selected={chosen ? [chosen] : []}
                                        onSelect={(s, b) => {
                                            if (!b || b.id === bottle.id) setChosen(s);
                                        }}
                                    />
                                )}
                                <p className="text-muted-foreground text-xs">Välj en ledig plats i rutnätet.</p>
                            </>
                        )}
                        <div className="flex flex-wrap gap-2">
                            <Button disabled={!chosen || form.processing} onClick={() => place(chosen)}>
                                Spara placering
                            </Button>
                            {bottle && (
                                <Button disabled={form.processing} variant="outline" onClick={() => place(null)}>
                                    Markera oplacerad
                                </Button>
                            )}
                        </div>
                    </>
                )}
                {confirm && (
                    <div className="border-border bg-muted rounded-lg border p-4">
                        <p className="mb-3 text-sm">
                            {confirm === 'consume' ? 'Markera flaskan som konsumerad?' : 'Ta bort flaskan ur lagret?'} Platsen frigörs och historiken
                            sparas.
                        </p>
                        <div className="flex gap-2">
                            <Button disabled={form.processing} onClick={finish}>
                                Bekräfta
                            </Button>
                            <Button variant="outline" onClick={() => setConfirm(null)}>
                                Avbryt
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
