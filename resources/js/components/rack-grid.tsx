import { type Bottle, type Rack, type RackSlot, typeColors, wineTypes } from '@/types/wine';
import { Check, Plus, Wine as WineIcon } from 'lucide-react';
export default function RackGrid({
    rack,
    onSelect,
    selected = [],
    highlight,
    highlightWineId,
    compact = true,
    readOnly = false,
}: {
    rack: Rack;
    onSelect?: (slot: RackSlot, bottle?: Bottle) => void;
    selected?: RackSlot[];
    highlight?: number;
    highlightWineId?: number;
    compact?: boolean;
    readOnly?: boolean;
}) {
    const bottles = new Map((rack.bottles ?? []).map((b) => [b.row + ':' + b.column, b]));
    return (
        <div className="bg-card max-w-full min-w-0 overflow-x-auto rounded-[18px] p-[15px]" aria-label={'Hyllplatser i ' + rack.name}>
            <div
                className={compact ? 'grid gap-1' : 'grid gap-2'}
                style={{
                    gridTemplateColumns: 'repeat(' + rack.columns + ', minmax(' + (compact ? '24px' : '90px') + ', 1fr))',
                    minWidth: compact ? undefined : rack.columns * 98 - 8,
                }}
            >
                {Array.from({ length: rack.rows * rack.columns }, (_, i) => {
                    const row = Math.floor(i / rack.columns) + 1,
                        column = (i % rack.columns) + 1,
                        bottle = bottles.get(row + ':' + column),
                        coordinate = String.fromCharCode(64 + row) + column;
                    const active = selected.some((s) => s.wine_rack_id === rack.id && s.row === row && s.column === column);
                    const highlighted = bottle != null && (bottle.id === highlight || bottle.wine_id === highlightWineId);
                    const label = coordinate + ' ' + (bottle ? (bottle.wine?.name ?? 'Upptagen') : 'Ledig') + '';
                    const Cell = readOnly ? 'div' : 'button';
                    return (
                        <Cell
                            type={readOnly ? undefined : 'button'}
                            key={coordinate}
                            onClick={readOnly ? undefined : () => onSelect?.({ wine_rack_id: rack.id, row, column }, bottle)}
                            aria-pressed={readOnly ? undefined : active}
                            aria-label={label}
                            title={label}
                            className={[
                                'focus-visible:ring-primary relative flex min-w-0 flex-col items-center justify-center border text-center transition focus-visible:ring-2 focus-visible:outline-none',
                                compact ? 'min-h-[27px] gap-1 rounded-[5px] py-1 text-[11px] sm:min-h-[34px]' : 'min-h-32 gap-2 rounded-lg p-2',
                                highlighted
                                    ? 'bg-primary text-primary-foreground border-transparent'
                                    : active
                                      ? 'border-primary bg-primary/10 ring-primary/30 ring-2'
                                      : bottle && compact
                                        ? 'bg-secondary text-muted-foreground border-transparent'
                                        : 'bg-background border-transparent',
                                readOnly ? '' : 'hover:border-primary',
                            ].join(' ')}
                        >
                            {compact ? (
                                <span className="font-medium">{coordinate}</span>
                            ) : (
                                <>
                                    <span className="text-muted-foreground absolute top-2 left-2 text-[10px]">{coordinate}</span>
                                    {bottle ? (
                                        <>
                                            <WineIcon
                                                className="mt-3 size-7 stroke-[1.4]"
                                                style={{ color: typeColors[bottle.wine?.type ?? 'other'] }}
                                            />
                                            <span className="line-clamp-2 text-[11px] font-medium">{bottle.wine?.name ?? 'Flaska'}</span>
                                            <span className="text-muted-foreground text-[10px]">
                                                {bottle.wine?.vintage ?? 'NV'}
                                                {bottle.wine ? ' · ' + wineTypes[bottle.wine.type] : ''}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            {active ? (
                                                <Check className="text-primary size-5" />
                                            ) : (
                                                <Plus className="text-muted-foreground/50 size-4" />
                                            )}
                                            <span className="text-muted-foreground text-[10px]">{active ? 'Vald' : 'Ledig'}</span>
                                        </>
                                    )}
                                </>
                            )}
                        </Cell>
                    );
                })}
            </div>
        </div>
    );
}
