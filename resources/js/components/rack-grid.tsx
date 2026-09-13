import { type Bottle, type Rack, type RackSlot, typeColors, wineTypes } from '@/types/wine';
import { Check, Plus, Wine as WineIcon } from 'lucide-react';
export default function RackGrid({
    rack,
    onSelect,
    selected = [],
    highlight,
}: {
    rack: Rack;
    onSelect: (slot: RackSlot, bottle?: Bottle) => void;
    selected?: RackSlot[];
    highlight?: number;
}) {
    const bottles = new Map((rack.bottles ?? []).map((b) => [b.row + ':' + b.column, b]));
    return (
        <div
            className="border-border bg-muted/40 max-w-full min-w-0 shrink-0 overflow-x-auto rounded-xl border p-3 sm:p-5"
            aria-label={'Hyllplatser i ' + rack.name}
        >
            <div
                className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(' + rack.columns + ', minmax(90px, 1fr))', minWidth: rack.columns * 98 - 8 }}
            >
                {Array.from({ length: rack.rows * rack.columns }, (_, i) => {
                    const row = Math.floor(i / rack.columns) + 1,
                        column = (i % rack.columns) + 1,
                        bottle = bottles.get(row + ':' + column),
                        coordinate = String.fromCharCode(64 + row) + column;
                    const active = selected.some((s) => s.wine_rack_id === rack.id && s.row === row && s.column === column);
                    return (
                        <button
                            type="button"
                            key={coordinate}
                            onClick={() => onSelect({ wine_rack_id: rack.id, row, column }, bottle)}
                            aria-pressed={active}
                            aria-label={coordinate + ' ' + (bottle ? (bottle.wine?.name ?? 'Upptagen') : 'Ledig')}
                            className={
                                'bg-card hover:border-primary focus-visible:ring-primary relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border p-2 text-center transition focus-visible:ring-2 focus-visible:outline-none ' +
                                (active || bottle?.id === highlight ? 'border-primary ring-primary/30 ring-2' : 'border-border')
                            }
                        >
                            <span className="text-muted-foreground absolute top-2 left-2 text-[10px]">{coordinate}</span>
                            {bottle ? (
                                <>
                                    <WineIcon className="mt-3 size-7 stroke-[1.4]" style={{ color: typeColors[bottle.wine?.type ?? 'other'] }} />
                                    <span className="line-clamp-2 text-[11px] font-medium">{bottle.wine?.name ?? 'Flaska'}</span>
                                    <span className="text-muted-foreground text-[10px]">
                                        {bottle.wine?.vintage ?? 'NV'}
                                        {bottle.wine ? ' · ' + wineTypes[bottle.wine.type] : ''}
                                    </span>
                                </>
                            ) : (
                                <>
                                    {active ? <Check className="text-primary size-5" /> : <Plus className="text-muted-foreground/50 size-4" />}
                                    <span className="text-muted-foreground text-[10px]">{active ? 'Vald' : 'Ledig'}</span>
                                </>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
