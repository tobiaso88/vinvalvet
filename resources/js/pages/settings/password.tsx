import { Errors, Field } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CellarLayout from '@/layouts/cellar-layout';
import { useForm } from '@inertiajs/react';
export default function Password() {
    const form = useForm({ current_password: '', password: '', password_confirmation: '' });
    return (
        <CellarLayout title="Ändra lösenord">
            <form
                className="border-border bg-card flex max-w-xl flex-col gap-5 rounded-xl border p-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.put('/settings/password', { onSuccess: () => form.reset() });
                }}
            >
                <Errors errors={form.errors} />
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
                <Button disabled={form.processing}>Spara lösenord</Button>
                {form.recentlySuccessful && (
                    <p role="status" className="text-sm">
                        Lösenordet har ändrats.
                    </p>
                )}
            </form>
        </CellarLayout>
    );
}
