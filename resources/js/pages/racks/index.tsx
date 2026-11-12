import { EmptyState, NativeRow } from '@/components/cellar';
import RackForm from '@/components/rack-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CellarLayout from '@/layouts/cellar-layout';
import type { Rack } from '@/types/wine';
import { LayoutGrid, MapPin } from 'lucide-react';
import { useState } from 'react';
export default function RacksIndex({ racks, unplacedCount = 0 }: { racks: Rack[]; unplacedCount?: number }) {
    const [create, setCreate] = useState(false);
    return (
        <CellarLayout title="Vinhyllor" description="Varje flaska har sin plats.">
            <div className="max-w-3xl">
                {racks.length ? (
                    <div className="native-group">
                        {racks.map((r) => (
                            <NativeRow
                                key={r.id}
                                title={r.name}
                                subtitle={`${r.rows} rader × ${r.columns} kolumner`}
                                value={`${r.bottles_count ?? 0} / ${r.rows * r.columns}`}
                                href={'/racks/' + r.id}
                                icon={LayoutGrid}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Skapa din första vinhylla"
                        description="Ange antal rader och kolumner. Du får ett visuellt rutnät där varje flaska har sin egen plats."
                    />
                )}
                <Button className="mt-3 w-full" onClick={() => setCreate(true)} aria-label="Ny vinhylla">
                    Skapa ny hylla
                </Button>
                <section className="mt-[22px]">
                    <h2 className="native-section-title">Att placera</h2>
                    <div className="native-group">
                        <NativeRow
                            title={unplacedCount + ' oplacerade flaskor'}
                            subtitle="Hitta en plats i en av dina hyllor"
                            href="/racks/unplaced"
                            icon={MapPin}
                        />
                    </div>
                </section>
            </div>
            <Dialog open={create} onOpenChange={setCreate}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ny vinhylla</DialogTitle>
                        <DialogDescription>Ange hur hyllan ser ut framifrån.</DialogDescription>
                    </DialogHeader>
                    <RackForm onSaved={() => setCreate(false)} />
                </DialogContent>
            </Dialog>
        </CellarLayout>
    );
}
