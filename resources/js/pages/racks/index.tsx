import { EmptyState } from '@/components/cellar';
import RackForm from '@/components/rack-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CellarLayout from '@/layouts/cellar-layout';
import type { Rack } from '@/types/wine';
import { Link } from '@inertiajs/react';
import { Grid2X2, Plus } from 'lucide-react';
import { useState } from 'react';
export default function RacksIndex({ racks }: { racks: Rack[] }) {
    const [create, setCreate] = useState(false);
    return (
        <CellarLayout
            title="Dina vinhyllor"
            description="Allt på sin plats. Välj en hylla för att hitta eller flytta en flaska."
            action={
                <Button onClick={() => setCreate(true)}>
                    <Plus className="size-4" />
                    Ny vinhylla
                </Button>
            }
        >
            {racks.length ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {racks.map((r) => (
                        <Link key={r.id} href={'/racks/' + r.id} className="border-border bg-card hover:border-primary/50 rounded-xl border p-6">
                            <div className="mb-6 flex items-center justify-between">
                                <Grid2X2 className="text-primary/60 size-8" />
                                <span className="text-muted-foreground text-xs">
                                    {r.rows} rader × {r.columns} kolumner
                                </span>
                            </div>
                            <h2 className="font-serif text-2xl">{r.name}</h2>
                            <p className="text-muted-foreground mt-2 min-h-5 text-xs">{r.description}</p>
                            <div className="bg-muted mt-6 h-1.5 overflow-hidden rounded-full">
                                <div
                                    className="bg-primary/70 h-full"
                                    style={{ width: ((r.bottles_count ?? 0) / (r.rows * r.columns)) * 100 + '%' }}
                                />
                            </div>
                            <p className="text-muted-foreground mt-3 text-xs">
                                {r.bottles_count} flaskor · {r.rows * r.columns - (r.bottles_count ?? 0)} lediga platser
                            </p>
                        </Link>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="Skapa din första vinhylla"
                    description="Ange antal rader och kolumner. Du får ett visuellt rutnät där varje flaska har sin egen plats."
                />
            )}
            <Dialog open={create} onOpenChange={setCreate}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ny vinhylla</DialogTitle>
                        <DialogDescription>Beskriv hyllan som den ser ut hemma.</DialogDescription>
                    </DialogHeader>
                    <RackForm onSaved={() => setCreate(false)} />
                </DialogContent>
            </Dialog>
        </CellarLayout>
    );
}
