import { Errors, Field } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Head, useForm } from '@inertiajs/react';
import { Wine } from 'lucide-react';
export default function Login() {
    const form = useForm({ email: '', password: '', remember: false });
    return (
        <div className="bg-background grid min-h-screen place-items-center p-5">
            <Head title="Logga in" />
            <div className="w-full max-w-md">
                <div className="mb-9 flex items-center justify-center gap-3">
                    <Wine className="text-primary size-8" />
                    <span className="font-serif text-3xl">Vinvalvet</span>
                </div>
                <form
                    className="border-border bg-card flex flex-col gap-5 rounded-xl border p-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post('/login', { onFinish: () => form.reset('password') });
                    }}
                >
                    <div>
                        <h1 className="font-serif text-3xl">Välkommen till din vinkällare</h1>
                        <p className="text-muted-foreground mt-3 text-sm">Logga in för att hitta rätt flaska.</p>
                    </div>
                    <Errors errors={form.errors} />
                    <Field label="E-postadress">
                        <Input
                            type="email"
                            required
                            autoComplete="username"
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                        />
                    </Field>
                    <Field label="Lösenord">
                        <Input
                            type="password"
                            required
                            autoComplete="current-password"
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                        />
                    </Field>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.data.remember} onChange={(e) => form.setData('remember', e.target.checked)} />
                        Kom ihåg mig
                    </label>
                    <Button disabled={form.processing}>{form.processing ? 'Loggar in …' : 'Logga in'}</Button>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        Det här är en privat vinkällare. Kontakta driftansvarig om du behöver ett konto eller ett nytt lösenord.
                    </p>
                </form>
            </div>
        </div>
    );
}
