import { Errors, Field } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
export default function Login() {
    const form = useForm({ email: '', password: '', remember: false });
    return (
        <AuthLayout title="Välkommen tillbaka." description="Din vinkällare väntar på dig.">
            <Head title="Logga in" />
            <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post('/login', { onFinish: () => form.reset('password') });
                }}
            >
                <Errors errors={form.errors} />
                <div className="native-fields">
                    <Field label="E-postadress">
                        <Input
                            type="email"
                            required
                            autoComplete="username"
                            placeholder="namn@example.com"
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                        />
                    </Field>
                    <Field label="Lösenord">
                        <Input
                            type="password"
                            required
                            autoComplete="current-password"
                            placeholder="Ditt lösenord"
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                        />
                    </Field>
                </div>
                <label className="native-group flex items-center gap-2.5 p-[13px] text-[13px]">
                    <input
                        type="checkbox"
                        className="size-[18px]"
                        checked={form.data.remember}
                        onChange={(e) => form.setData('remember', e.target.checked)}
                    />
                    Kom ihåg mig
                </label>
                <Button disabled={form.processing}>{form.processing ? 'Loggar in…' : 'Logga in'}</Button>
                <p className="native-note">
                    Det här är en privat vinkällare. Kontakta driftansvarig om du behöver ett konto eller ett nytt lösenord.
                </p>
            </form>
        </AuthLayout>
    );
}
