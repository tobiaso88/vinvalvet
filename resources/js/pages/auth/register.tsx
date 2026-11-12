import { Errors, Field } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm } from '@inertiajs/react';
export default function Register() {
    const form = useForm({ name: '', email: '', password: '', password_confirmation: '' });
    return (
        <AuthLayout title="Skapa konto" description="En egen plats för din vinsamling.">
            <Head title="Skapa konto" />
            <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(route('register'), { onFinish: () => form.reset('password', 'password_confirmation') });
                }}
            >
                <Errors errors={form.errors} />
                <div className="native-fields">
                    {(
                        [
                            ['name', 'Namn', 'text', 'name'],
                            ['email', 'E-postadress', 'email', 'email'],
                            ['password', 'Lösenord', 'password', 'new-password'],
                            ['password_confirmation', 'Bekräfta lösenord', 'password', 'new-password'],
                        ] as const
                    ).map(([key, label, type, autoComplete]) => (
                        <Field key={key} label={label}>
                            <Input
                                required
                                type={type}
                                autoComplete={autoComplete}
                                value={form.data[key]}
                                onChange={(e) => form.setData(key, e.target.value)}
                            />
                        </Field>
                    ))}
                </div>
                <Button disabled={form.processing}>{form.processing ? 'Skapar konto…' : 'Skapa konto'}</Button>
                <Button asChild variant="secondary">
                    <Link href="/login">Har du redan konto? Logga in</Link>
                </Button>
            </form>
        </AuthLayout>
    );
}
