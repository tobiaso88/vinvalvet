import BottleDialog from '@/components/bottle-dialog';
import { EmptyState, NativeRow } from '@/components/cellar';
import CellarLayout from '@/layouts/cellar-layout';
import type { Bottle, Rack } from '@/types/wine';
import { Wine } from 'lucide-react';
import { useState } from 'react';
export default function Unplaced({ racks, unplaced }: { racks: Rack[]; unplaced: Bottle[] }) {
    const [bottle, setBottle] = useState<Bottle | null>(null);
    return (
        <CellarLayout
            title="Oplacerade flaskor"
            description={unplaced.length + ' flaskor behöver en plats.'}
            back={{ href: '/racks', label: 'Hyllor' }}
        >
            {unplaced.length ? (
                <div className="native-group max-w-2xl">
                    {unplaced.map((b) => (
                        <NativeRow
                            key={b.id}
                            title={(b.wine?.name ?? 'Flaska') + ' · flaska #' + b.id}
                            subtitle={String(b.wine?.vintage ?? 'NV')}
                            icon={Wine}
                            onClick={() => setBottle(b)}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState title="Allt på sin plats" description="Alla dina flaskor har en hyllplats." href="/racks" label="Visa hyllorna" />
            )}
            <p className="native-note mt-5 max-w-2xl">Du kan också trycka på en ledig hyllplats och välja en oplacerad flaska.</p>
            {bottle && <BottleDialog bottle={bottle} racks={racks} onClose={() => setBottle(null)} />}
        </CellarLayout>
    );
}
