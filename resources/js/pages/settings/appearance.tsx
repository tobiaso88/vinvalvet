import { NativeRow } from '@/components/cellar';
import { useAppearance } from '@/hooks/use-appearance';
import CellarLayout from '@/layouts/cellar-layout';
import { Contrast, Type } from 'lucide-react';
export default function Appearance() {
    const { appearance, updateAppearance } = useAppearance();
    return (
        <CellarLayout title="Utseende" description="Välj hur din vinkällare ska visas." back={{ href: '/settings', label: 'Mer' }}>
            <div className="max-w-xl">
                <div className="bg-muted/60 mb-5 flex gap-[3px] rounded-[10px] p-[3px]" role="group" aria-label="Färgtema">
                    {(
                        [
                            ['light', 'Ljust'],
                            ['dark', 'Mörkt'],
                            ['system', 'System'],
                        ] as const
                    ).map(([value, label]) => (
                        <button
                            type="button"
                            key={value}
                            aria-pressed={appearance === value}
                            onClick={() => updateAppearance(value)}
                            className={
                                'min-h-11 flex-1 rounded-lg px-3 text-[13px] ' +
                                (appearance === value ? 'bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground')
                            }
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="native-group">
                    <NativeRow title="Systemtypografi" subtitle="Samma lugna hierarki i båda lägena." icon={Type} />
                    <NativeRow title="Tydlig kontrast" subtitle="Vinröd accent anpassad efter temat." icon={Contrast} />
                </div>
                <p className="native-note mt-4">Följ systemet anpassar appen efter din enhets inställning för ljust och mörkt läge.</p>
            </div>
        </CellarLayout>
    );
}
