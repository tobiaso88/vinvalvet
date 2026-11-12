import { Errors, Field } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CellarLayout from '@/layouts/cellar-layout';
import { useForm } from '@inertiajs/react';
export default function Password() {
    const form = useForm({ current_password: '', password: '', password_confirmation: '' });
    return (
        <CellarLayout title="Lösenord" description="Välj ett långt och unikt lösenord." back={{ href: '/settings', label: 'Mer' }}>
            <form
                className="flex max-w-xl flex-col gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.put('/settings/password', { onSuccess: () => form.reset() });
                }}
            >
                <Errors errors={form.errors} />
                <div className="native-fields">
                    {(
                        [
                            ['current_password', 'Nuvarande lösenord'],
                            ['password', 'Nytt lösenord'],
                            ['password_confirmation', 'Bekräfta nytt lösenord'],
                        ] as const
                    ).map(([key, label]) => (
                        <Field key={key} label={label}>
                            <Input
                                required
                                type="password"
                                autoComplete={key === 'current_password' ? 'current-password' : 'new-password'}
                                value={form.data[key]}
                                onChange={(e) => form.setData(key, e.target.value)}
                            />
                        </Field>
                    ))}
                </div>
                <Button disabled={form.processing}>Spara lösenord</Button>
                {form.recentlySuccessful && (
                    <p role="status" className="native-success">
                        Lösenordet har ändrats.
                    </p>
                )}
            </form>
        </CellarLayout>
    );
}
