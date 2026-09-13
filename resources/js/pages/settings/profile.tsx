import { Errors, Field } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CellarLayout from '@/layouts/cellar-layout';
import { Link, useForm, usePage } from '@inertiajs/react';
export default function Profile() {
    const { auth } = usePage<{ auth: { user: { name: string; email: string } } }>().props;
    const form = useForm({ name: auth.user.name, email: auth.user.email });
    return (
        <CellarLayout title="Ditt konto" description="Hantera dina uppgifter och din privata samling.">
            <div className="text-primary mb-6 flex flex-wrap gap-4 text-sm">
                <Link href="/settings/password">Ändra lösenord</Link>
                <Link href="/settings/appearance">Utseende</Link>
                <Link href="/logout" method="post" as="button">
                    Logga ut
                </Link>
            </div>
            <form
                className="border-border bg-card flex max-w-xl flex-col gap-5 rounded-xl border p-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.patch('/settings/profile');
                }}
            >
                <Errors errors={form.errors} />
                <Field label="Namn">
                    <Input required value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                </Field>
                <Field label="E-postadress">
                    <Input required type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                </Field>
                <Button disabled={form.processing}>Spara uppgifter</Button>
                {form.recentlySuccessful && (
                    <p role="status" className="text-muted-foreground text-sm">
                        Dina uppgifter har sparats.
                    </p>
                )}
            </form>
        </CellarLayout>
    );
}
