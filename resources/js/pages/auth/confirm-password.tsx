import { Errors, Field } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm } from '@inertiajs/react';
export default function ConfirmPassword() {
    const form = useForm({ password: '' });
    return (
        <AuthLayout title="Bekräfta att det är du" description="Ange ditt lösenord för att fortsätta.">
            <Head title="Bekräfta lösenord" />
            <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(route('password.confirm'), { onFinish: () => form.reset('password') });
                }}
            >
                <Errors errors={form.errors} />
                <div className="native-fields">
                    <Field label="Lösenord">
                        <Input
                            type="password"
                            required
                            autoComplete="current-password"
                            autoFocus
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                        />
                    </Field>
                </div>
                <Button disabled={form.processing}>{form.processing ? 'Bekräftar…' : 'Bekräfta lösenord'}</Button>
                <Button asChild variant="secondary">
                    <Link href="/settings">Tillbaka</Link>
                </Button>
            </form>
        </AuthLayout>
    );
}
