import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link, router } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function NavigationLoadingIndicator() {
    const [failure, setFailure] = useState<'network' | 'session' | 'server' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const activeRequests = useRef(0);

    useEffect(() => {
        const removeStartListener = router.on('start', (event) => {
            if (event.detail.visit.prefetch || !event.detail.visit.showProgress) {
                return;
            }

            activeRequests.current += 1;
            setIsLoading(true);
        });

        const removeFinishListener = router.on('finish', (event) => {
            if (event.detail.visit.prefetch || !event.detail.visit.showProgress) {
                return;
            }

            activeRequests.current = Math.max(0, activeRequests.current - 1);
            setIsLoading(activeRequests.current > 0);
        });

        const removeNetworkListener = router.on('networkError', (event) => {
            event.preventDefault();
            setIsLoading(false);
            setFailure('network');
        });
        const removeHttpListener = router.on('httpException', (event) => {
            const status = event.detail.response.status;
            if (status === 401 || status === 419 || status >= 500) {
                event.preventDefault();
                setIsLoading(false);
                setFailure(status === 401 || status === 419 ? 'session' : 'server');
            }
        });
        return () => {
            removeNetworkListener();
            removeHttpListener();
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    if (failure) {
        return (
            <Dialog
                open
                onOpenChange={(open) => {
                    if (!open) setFailure(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{failure === 'session' ? 'Logga in igen' : 'Kunde inte ansluta'}</DialogTitle>
                        <DialogDescription>
                            {failure === 'session'
                                ? 'Sessionen har gått ut. Logga in igen för att fortsätta.'
                                : 'Dina uppgifter finns kvar. Stäng meddelandet och försök igen.'}
                        </DialogDescription>
                    </DialogHeader>
                    <p role="alert" className="native-error">
                        {failure === 'network'
                            ? 'Kontrollera din anslutning och försök igen.'
                            : failure === 'server'
                              ? 'Servern kunde inte behandla begäran just nu.'
                              : 'Du behöver logga in igen.'}
                    </p>
                    {failure === 'session' && (
                        <Button asChild>
                            <Link href="/login">Logga in</Link>
                        </Button>
                    )}
                    <Button variant="secondary" onClick={() => setFailure(null)}>
                        Fortsätt redigera
                    </Button>
                </DialogContent>
            </Dialog>
        );
    }
    if (!isLoading) {
        return null;
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 flex justify-center px-4"
        >
            <div className="border-border bg-card/95 text-foreground animate-in fade-in-0 zoom-in-95 flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium shadow-lg backdrop-blur duration-150">
                <LoaderCircle aria-hidden="true" className="text-primary size-4 animate-spin" />
                Laddar…
            </div>
        </div>
    );
}
