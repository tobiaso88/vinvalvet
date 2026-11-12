import { Errors, Field } from '@/components/cellar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
export default function DeleteUser() {
    const [open, setOpen] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);
    const form = useForm({ password: '' });
    return (
        <>
            <Button variant="ghost" className="text-destructive w-full justify-start" onClick={() => setOpen(true)}>
                Radera konto
            </Button>
            <Dialog
                open={open}
                onOpenChange={(value) => {
                    setOpen(value);
                    if (!value) {
                        form.reset();
                        form.clearErrors();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Radera ditt konto?</DialogTitle>
                        <DialogDescription>Den här åtgärden kan inte ångras.</DialogDescription>
                    </DialogHeader>
                    <p className="native-error">Kontot och dess data raderas permanent. Bekräfta med ditt lösenord.</p>
                    <form
                        className="flex flex-col gap-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.delete('/settings/profile', {
                                preserveScroll: true,
                                onError: () => passwordInput.current?.focus(),
                                onSuccess: () => setOpen(false),
                                onFinish: () => form.reset(),
                            });
                        }}
                    >
                        <Errors errors={form.errors} />
                        <div className="native-fields">
                            <Field label="Lösenord">
                                <Input
                                    ref={passwordInput}
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    value={form.data.password}
                                    onChange={(e) => form.setData('password', e.target.value)}
                                />
                            </Field>
                        </div>
                        <Button variant="destructive" disabled={form.processing}>
                            {form.processing ? 'Raderar…' : 'Radera konto'}
                        </Button>
                        <Button type="button" variant="secondary" disabled={form.processing} onClick={() => setOpen(false)}>
                            Avbryt
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
