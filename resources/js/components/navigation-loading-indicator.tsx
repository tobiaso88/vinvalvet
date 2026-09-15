import { router } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function NavigationLoadingIndicator() {
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

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

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
