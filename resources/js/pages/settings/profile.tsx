import { Errors, Field } from '@/components/cellar';
import DeleteUser from '@/components/delete-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CellarLayout from '@/layouts/cellar-layout';
import { useForm, usePage } from '@inertiajs/react';
export default function Profile() {
    const { auth } = usePage<{ auth: { user: { name: string; email: string } } }>().props;
    const form = useForm({ name: auth.user.name, email: auth.user.email });
    return (
        <CellarLayout title="Din profil" description="Håll dina kontouppgifter uppdaterade." back={{ href: '/settings', label: 'Mer' }}>
            <form
                className="flex max-w-xl flex-col gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.patch('/settings/profile');
                }}
            >
                <Errors errors={form.errors} />
                <div className="native-fields">
                    <Field label="Namn">
                        <Input required value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                    </Field>
                    <Field label="E-postadress">
                        <Input required type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                    </Field>
                </div>
                <Button disabled={form.processing}>Spara profil</Button>
                {form.recentlySuccessful && (
                    <p role="status" className="native-success">
                        Dina uppgifter har sparats.
                    </p>
                )}
            </form>
            <section className="mt-[22px] max-w-xl">
                <h2 className="native-section-title">Hantera konto</h2>
                <DeleteUser />
            </section>
        </CellarLayout>
    );
}
