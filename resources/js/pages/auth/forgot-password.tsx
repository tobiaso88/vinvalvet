import { Errors, Field } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm } from '@inertiajs/react';
export default function ForgotPassword({ status }: { status?: string }) {
    const form = useForm({ email: '' });
    return (
        <AuthLayout title="Glömt lösenordet?" description="Vi skickar en länk till din e-postadress.">
            <Head title="Glömt lösenord" />
            {status && (
                <p role="status" className="native-success mb-3">
                    Om adressen finns hos oss får du ett mejl med nästa steg.
                </p>
            )}
            <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(route('password.email'));
                }}
            >
                <Errors errors={form.errors} />
                <div className="native-fields">
                    <Field label="E-postadress">
                        <Input
                            required
                            type="email"
                            autoComplete="email"
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                        />
                    </Field>
                </div>
                <Button disabled={form.processing}>{form.processing ? 'Skickar…' : 'Skicka återställningslänk'}</Button>
                <Button asChild variant="secondary">
                    <Link href="/login">Tillbaka till inloggning</Link>
                </Button>
            </form>
        </AuthLayout>
    );
}
