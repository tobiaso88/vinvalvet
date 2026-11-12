import { NativeRow } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import CellarLayout from '@/layouts/cellar-layout';
import { Link, usePage } from '@inertiajs/react';
import { CircleUserRound, History, LockKeyhole, SunMoon, User } from 'lucide-react';
export default function Settings() {
    const { auth } = usePage<{ auth: { user: { name: string; email: string } } }>().props;
    const { appearance } = useAppearance();
    return (
        <CellarLayout title="Mer">
            <div className="flex max-w-xl flex-col gap-5">
                <div className="native-group">
                    <NativeRow title={auth.user.name} subtitle={auth.user.email} href="/settings/profile" icon={CircleUserRound} />
                </div>
                <div className="native-group">
                    <NativeRow title="Aktivitet" subtitle="Händelser i samlingen" href="/activity" icon={History} />
                    <NativeRow title="Profil" href="/settings/profile" icon={User} />
                    <NativeRow title="Lösenord" href="/settings/password" icon={LockKeyhole} />
                    <NativeRow
                        title="Utseende"
                        value={appearance === 'system' ? 'Följ systemet' : appearance === 'dark' ? 'Mörkt' : 'Ljust'}
                        href="/settings/appearance"
                        icon={SunMoon}
                    />
                </div>
                <Button asChild variant="secondary">
                    <Link href="/logout" method="post" as="button">
                        Logga ut
                    </Link>
                </Button>
            </div>
        </CellarLayout>
    );
}
