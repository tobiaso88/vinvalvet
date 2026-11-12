import BottleDialog from '@/components/bottle-dialog';
import { Errors } from '@/components/cellar';
import RackForm from '@/components/rack-form';
import RackGrid from '@/components/rack-grid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CellarLayout from '@/layouts/cellar-layout';
import { type Bottle, type Rack, type RackSlot } from '@/types/wine';
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
            back={{ href: '/racks', label: 'Hyllor' }}
            description={[rack.description, `${rack.bottles?.length ?? 0} av ${rack.rows * rack.columns} platser upptagna`]
                .filter(Boolean)
                .join(' · ')}
        >
            <RackGrid rack={rack} highlight={highlight} onSelect={(slot, bottle) => setSelection({ slot, bottle })} />
            <p className="text-muted-foreground mt-3 text-[11px]">Färgfylld = upptagen · Sett framifrån</p>
            <Button variant="secondary" className="mt-5 w-full" onClick={() => setEdit(true)}>
                Redigera hylla
            </Button>
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
                        <div className="flex flex-col gap-3">
                            <p className="native-error">Endast tomma hyllor kan tas bort. Kontrollera att du har valt rätt hylla.</p>
                            <Button variant="destructive" disabled={form.processing} onClick={() => form.delete('/racks/' + rack.id)}>
                                Bekräfta radering
                            </Button>
                            <Button variant="outline" onClick={() => setRemove(false)}>
                                Avbryt
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" className="text-destructive" onClick={() => setRemove(true)}>
                            Radera tom hylla
                        </Button>
                    )}
                </DialogContent>
            </Dialog>
        </CellarLayout>
    );
}
