import { Errors, Field } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
export default function ResetPassword({ token, email }: { token: string; email: string }) {
    const form = useForm({ token, email, password: '', password_confirmation: '' });
    return (
        <AuthLayout title="Nytt lösenord" description="Välj ett nytt lösenord till ditt konto.">
            <Head title="Återställ lösenord" />
            <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(route('password.store'), { onFinish: () => form.reset('password', 'password_confirmation') });
                }}
            >
                <Errors errors={form.errors} />
                <div className="native-fields">
                    <Field label="E-postadress">
                        <Input required readOnly type="email" autoComplete="email" value={form.data.email} />
                    </Field>
                    {(
                        [
                            ['password', 'Nytt lösenord'],
                            ['password_confirmation', 'Bekräfta lösenord'],
                        ] as const
                    ).map(([key, label]) => (
                        <Field key={key} label={label}>
                            <Input
                                required
                                type="password"
                                autoComplete="new-password"
                                value={form.data[key]}
                                onChange={(e) => form.setData(key, e.target.value)}
                            />
                        </Field>
                    ))}
                </div>
                <Button disabled={form.processing}>{form.processing ? 'Sparar…' : 'Återställ lösenord'}</Button>
            </form>
        </AuthLayout>
    );
}
