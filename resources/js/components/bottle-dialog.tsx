import BottleFinancials from '@/components/bottle-financials';
import { Errors, Field, NativeRow, Select } from '@/components/cellar';
import RackGrid from '@/components/rack-grid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Bottle, Rack, RackSlot } from '@/types/wine';
import { Link, router, useForm } from '@inertiajs/react';
import { ArrowUpRight, BadgeEuro, ChevronLeft, MapPin, MoveRight, Wine } from 'lucide-react';
import { useState } from 'react';
type Step = 'overview' | 'move' | 'price' | 'consume' | 'remove' | 'unplace';
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
    const [savedPrice, setSavedPrice] = useState(bottle?.purchase_price ?? null);
    const [priceChanged, setPriceChanged] = useState(false);
    function close() {
        if (priceChanged) router.reload({ only: ['wine', 'rack', 'racks', 'unplaced'] });
        onClose();
    }
    const [step, setStep] = useState<Step>(bottle && bottle.wine_rack_id == null ? 'move' : 'overview');
    const form = useForm<{ wine_rack_id: number | null; row: number | null; column: number | null }>({ wine_rack_id: null, row: null, column: null });
    const currentRack = racks.find((r) => r.id === bottle?.wine_rack_id);
    const rack = racks.find((r) => r.id === rackId);
    const currentCoordinate = bottle?.row && bottle?.column ? String.fromCharCode(64 + bottle.row) + bottle.column : null;
    function place(position: RackSlot | null) {
        form.transform(() => ({ wine_rack_id: position?.wine_rack_id ?? null, row: position?.row ?? null, column: position?.column ?? null }));
        form.patch('/bottles/' + (bottle?.id ?? bottleId) + '/place', { onSuccess: onClose, preserveScroll: true });
    }
    const titles: Record<Step, string> = {
        overview: bottle?.wine?.name ?? 'Hantera flaska',
        move: bottle?.wine_rack_id == null ? 'Placera flaskan' : 'Flytta flaskan',
        price: 'Inköpspris',
        consume: 'Markera konsumerad?',
        remove: 'Ta ur lagret?',
        unplace: 'Markera oplacerad?',
    };
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) close();
            }}
        >
            <DialogContent>
                {step !== 'overview' && (
                    <button
                        type="button"
                        className="text-primary -mb-2 inline-flex min-h-9 w-fit items-center text-[13px]"
                        onClick={() => {
                            setStep('overview');
                            form.clearErrors();
                        }}
                    >
                        <ChevronLeft className="size-[18px]" />
                        Tillbaka
                    </button>
                )}
                <DialogHeader>
                    <DialogTitle>{bottle ? titles[step] : 'Placera en flaska'}</DialogTitle>
                    <DialogDescription>
                        {bottle
                            ? bottle.location
                            : 'Välj en oplacerad flaska till ' + String.fromCharCode(64 + (slot?.row ?? 1)) + (slot?.column ?? 1) + '.'}
                    </DialogDescription>
                </DialogHeader>
                <Errors errors={form.errors} />
                {bottle && step === 'overview' && (
                    <>
                        <Button asChild className="w-full">
                            <Link href={'/wines/' + bottle.wine_id}>
                                <Wine />
                                Visa vinet
                                <ArrowUpRight />
                            </Link>
                        </Button>
                        {currentRack && (
                            <section aria-label="Flaskans placering" className="min-w-0">
                                <RackGrid rack={currentRack} compact readOnly highlight={bottle.id} />
                                <p className="text-primary mt-3 text-[11px] font-medium">● Här står flaskan · {currentCoordinate}</p>
                                <p className="text-muted-foreground mt-1 text-[11px]">Sett framifrån · Rad A överst, kolumn 1 längst till vänster.</p>
                            </section>
                        )}
                        <div className="native-group bg-background">
                            <NativeRow
                                title="Inköpspris"
                                value={savedPrice == null ? 'Lägg till' : savedPrice.toLocaleString('sv-SE') + ' kr'}
                                icon={BadgeEuro}
                                onClick={() => setStep('price')}
                            />
                            <NativeRow title="Flytta flaskan" subtitle="Välj hylla & ledig plats" icon={MoveRight} onClick={() => setStep('move')} />
                            {bottle.wine_rack_id != null && (
                                <NativeRow
                                    title="Markera oplacerad"
                                    subtitle={'Frigör ' + currentCoordinate}
                                    icon={MapPin}
                                    onClick={() => setStep('unplace')}
                                />
                            )}
                        </div>
                        <Button variant="secondary" onClick={() => setStep('consume')}>
                            Markera konsumerad
                        </Button>
                        <Button variant="ghost" className="text-muted-foreground w-fit" onClick={() => setStep('remove')}>
                            Ta ur lagret
                        </Button>
                    </>
                )}
                {bottle && step === 'price' && (
                    <BottleFinancials
                        bottle={{ ...bottle, purchase_price: savedPrice }}
                        onSaved={(price) => {
                            setSavedPrice(price);
                            setPriceChanged(true);
                        }}
                    />
                )}
                {((bottle && step === 'move') || !bottle) && (
                    <>
                        {!bottle && (
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
                            <p className="native-note">
                                Alla dina flaskor har redan en plats.{' '}
                                <Link href="/wines/create" className="underline">
                                    Lägg till vin
                                </Link>{' '}
                                eller flytta en flaska från en annan plats.
                            </p>
                        ) : (
                            <>
                                {bottle && (
                                    <>
                                        <Field label={bottle.wine_rack_id == null ? 'Välj hylla' : 'Flytta till hylla'}>
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
                                        {!rack && (
                                            <p className="native-note">
                                                Skapa en hylla innan du placerar flaskan.{' '}
                                                <Link href="/racks" className="underline">
                                                    Skapa din första hylla
                                                </Link>
                                            </p>
                                        )}
                                        {rack && (
                                            <RackGrid
                                                rack={rack}
                                                compact
                                                highlight={bottle.id}
                                                selected={chosen ? [chosen] : []}
                                                onSelect={(s, b) => {
                                                    if (!b || b.id === bottle.id) setChosen(s);
                                                }}
                                            />
                                        )}
                                        <p className="text-muted-foreground text-xs" aria-live="polite">
                                            {chosen
                                                ? 'Vald plats: ' + String.fromCharCode(64 + chosen.row) + chosen.column
                                                : 'Välj en ledig plats i rutnätet.'}
                                        </p>
                                    </>
                                )}
                                <Button disabled={!chosen || (!bottle && !bottleId) || form.processing} onClick={() => place(chosen)}>
                                    {form.processing ? 'Sparar placering…' : 'Spara placering'}
                                </Button>
                            </>
                        )}
                    </>
                )}
                {bottle && (step === 'consume' || step === 'remove' || step === 'unplace') && (
                    <>
                        <p className={step === 'remove' ? 'native-error' : 'native-note'}>
                            {step === 'consume'
                                ? 'Flaskan markeras som konsumerad. Platsen frigörs och historiken sparas.'
                                : step === 'remove'
                                  ? 'Flaskan tas ur lagret. Platsen frigörs och historiken sparas.'
                                  : 'Flaskan finns kvar i samlingen. Platsen frigörs och du kan välja en ny plats senare.'}
                        </p>
                        <Button
                            variant={step === 'remove' ? 'destructive' : 'default'}
                            disabled={form.processing}
                            onClick={() => {
                                if (step === 'unplace') place(null);
                                else if (step === 'consume')
                                    form.post('/bottles/' + bottle.id + '/consume', { onSuccess: onClose, preserveScroll: true });
                                else form.delete('/bottles/' + bottle.id, { onSuccess: onClose, preserveScroll: true });
                            }}
                        >
                            {form.processing ? 'Sparar…' : 'Bekräfta'}
                        </Button>
                        <Button variant="secondary" disabled={form.processing} onClick={() => setStep('overview')}>
                            Avbryt
                        </Button>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
