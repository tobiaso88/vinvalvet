import { Errors } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm } from '@inertiajs/react';
export default function VerifyEmail({ status }: { status?: string }) {
    const form = useForm({});
    return (
        <AuthLayout title="Kolla din inkorg." description="Vi har skickat en verifieringslänk till din e-postadress.">
            <Head title="Verifiera e-post" />
            {status === 'verification-link-sent' && (
                <p role="status" className="native-success mb-3">
                    En ny verifieringslänk har skickats.
                </p>
            )}
            <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(route('verification.send'));
                }}
            >
                <Errors errors={form.errors} />
                <Button disabled={form.processing}>{form.processing ? 'Skickar…' : 'Skicka verifieringsmejl igen'}</Button>
                <Button asChild variant="secondary">
                    <Link href="/logout" method="post" as="button">
                        Logga ut
                    </Link>
                </Button>
            </form>
        </AuthLayout>
    );
}
