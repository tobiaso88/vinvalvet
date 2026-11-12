import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
export default function AuthSimpleLayout({ children, title, description }: { children: ReactNode; title?: string; description?: string }) {
    return (
        <div className="bg-background flex min-h-dvh items-center px-[17px] py-10">
            <main className="mx-auto w-full max-w-[390px]">
                <Link href="/" className="bg-secondary text-primary mb-9 inline-flex rounded-[7px] px-2 py-[5px] text-[11px] font-semibold">
                    <span role="img" aria-label="Vinvalvet">
                        Vinvalvet
                    </span>
                </Link>
                <h1 className="text-[29px] leading-[1.12] font-bold tracking-[-1px]">{title}</h1>
                <p className="text-muted-foreground mt-2 mb-[22px] text-[13px] leading-relaxed">{description}</p>
                {children}
            </main>
        </div>
    );
}
