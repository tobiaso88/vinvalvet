import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import CellarLayout from '@/layouts/cellar-layout';
export default function Appearance() {
    const { appearance, updateAppearance } = useAppearance();
    return (
        <CellarLayout title="Utseende" description="Välj hur din vinkällare ska visas.">
            <div className="flex flex-wrap gap-3">
                {(
                    [
                        ['light', 'Ljust'],
                        ['dark', 'Mörkt'],
                        ['system', 'Följ systemet'],
                    ] as const
                ).map(([value, label]) => (
                    <Button key={value} variant={appearance === value ? 'default' : 'outline'} onClick={() => updateAppearance(value)}>
                        {label}
                    </Button>
                ))}
            </div>
        </CellarLayout>
    );
}
