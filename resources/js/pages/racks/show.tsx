import BottleDialog from '@/components/bottle-dialog';
import { Errors } from '@/components/cellar';
import RackForm from '@/components/rack-form';
import RackGrid from '@/components/rack-grid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CellarLayout from '@/layouts/cellar-layout';
import { type Bottle, type Rack, type RackSlot, typeColors, type WineType, wineTypes } from '@/types/wine';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
export default function RackShow({ rack, racks, unplaced }: { rack: Rack; racks: Rack[]; unplaced: Bottle[] }) {
    const [selection, setSelection] = useState<{ slot: RackSlot; bottle?: Bottle } | null>(null);
    const [edit, setEdit] = useState(false),
        [remove, setRemove] = useState(false);
    const form = useForm({});
    const highlight = Number(new URLSearchParams(window.location.search).get('bottle'));
    return (
        <CellarLayout
            title={rack.name}
            description={rack.description ?? 'Välj en plats för att hantera flaskan som ligger där.'}
            action={
                <Button variant="outline" onClick={() => setEdit(true)}>
                    Redigera hylla
                </Button>
            }
        >
            <div className="text-muted-foreground mb-5 flex flex-wrap justify-between gap-3 text-sm">
                <span>
                    {rack.bottles?.length ?? 0} av {rack.rows * rack.columns} platser upptagna
                </span>
                <span>Rad A är överst · Kolumn 1 är längst till vänster</span>
            </div>
            <RackGrid rack={rack} highlight={highlight} onSelect={(slot, bottle) => setSelection({ slot, bottle })} />
            <div className="mt-5 flex flex-wrap gap-4">
                {Object.entries(wineTypes).map(([type, label]) => (
                    <span key={type} className="text-muted-foreground flex items-center gap-2 text-xs">
                        <span className="size-2 rounded-full" style={{ background: typeColors[type as WineType] }} />
                        {label}
                    </span>
                ))}
            </div>
            {selection && <BottleDialog {...selection} racks={racks} unplaced={unplaced} onClose={() => setSelection(null)} />}
            <Dialog open={edit} onOpenChange={setEdit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Redigera hylla</DialogTitle>
                        <DialogDescription>Flytta flaskor innan du minskar hyllans storlek.</DialogDescription>
                    </DialogHeader>
                    <RackForm rack={rack} onSaved={() => setEdit(false)} />
                    <Errors errors={form.errors} />
                    {remove ? (
                        <div className="flex gap-2">
                            <Button variant="destructive" disabled={form.processing} onClick={() => form.delete('/racks/' + rack.id)}>
                                Bekräfta radering
                            </Button>
                            <Button variant="outline" onClick={() => setRemove(false)}>
                                Avbryt
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" onClick={() => setRemove(true)}>
                            Radera tom hylla
                        </Button>
                    )}
                </DialogContent>
            </Dialog>
        </CellarLayout>
    );
}
