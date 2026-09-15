import AppLogo from '@/components/app-logo';
import { Head, Link, usePage } from '@inertiajs/react';
import { Grid2X2, History, LayoutDashboard, LogOut, Plus, Settings, UtensilsCrossed, Wine } from 'lucide-react';
import type { ReactNode } from 'react';

const navigation = [
    { url: '/dashboard', label: 'Översikt', icon: LayoutDashboard },
    { url: '/wines', label: 'Mina viner', icon: Wine },
    { url: '/racks', label: 'Vinhyllor', icon: Grid2X2 },
    { url: '/pairing', label: 'Vin till maten', icon: UtensilsCrossed },
    { url: '/activity', label: 'Aktivitet', icon: History },
];
export default function CellarLayout({
    children,
    title,
    description,
    action,
}: {
    children: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    const { url, props } = usePage<{ auth: { user: { name: string } }; flash?: { success?: string } }>();
    return (
        <div className="bg-background min-h-screen">
            <Head title={title} />
            <aside className="border-border bg-card fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r px-5 py-8 lg:flex">
                <Link href="/dashboard" viewTransition className="mb-8 flex flex-col items-center gap-2">
                    <AppLogo variant="stacked" className="w-44" />
                    <span className="text-muted-foreground text-[9px] tracking-[.18em] uppercase">Din personliga vinkällare</span>
                </Link>
                <p className="text-muted-foreground mb-3 px-3 text-[10px] font-semibold tracking-[.18em] uppercase">Samlingen</p>
                <nav aria-label="Huvudnavigation" className="flex flex-col gap-1">
                    {navigation.map(({ url: href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            prefetch="mount"
                            cacheFor={['30s', '5m']}
                            viewTransition
                            className={
                                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-[transform,opacity] active:scale-[0.98] data-loading:opacity-60 ' +
                                (url.startsWith(href)
                                    ? 'bg-primary/8 text-primary font-semibold'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                            }
                        >
                            <Icon className="size-[18px]" />
                            {label}
                        </Link>
                    ))}
                </nav>
                <div className="mt-auto flex flex-col gap-5">
                    <div className="border-border rounded-lg border p-4">
                        <p className="font-serif text-lg">Varje flaska har sin plats.</p>
                        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">En liten överblick, ett riktigt bra vin.</p>
                    </div>
                    <Link
                        href="/settings/profile"
                        prefetch="mount"
                        cacheFor={['30s', '5m']}
                        viewTransition
                        className="text-muted-foreground flex items-center gap-3 px-3 text-sm transition-[transform,opacity] active:scale-[0.98] data-loading:opacity-60"
                    >
                        <Settings className="size-4" />
                        Inställningar
                    </Link>
                    <div className="border-border flex items-center gap-3 border-t px-2 pt-5">
                        <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-full text-sm font-medium">
                            {props.auth.user.name.slice(0, 1)}
                        </span>
                        <span className="flex-1 truncate text-sm">{props.auth.user.name}</span>
                        <Link href="/logout" method="post" as="button" aria-label="Logga ut">
                            <LogOut className="text-muted-foreground size-4" />
                        </Link>
                    </div>
                </div>
            </aside>
            <div className="lg:ml-60">
                <header className="border-border bg-card flex h-16 items-center justify-between border-b px-5 sm:px-9">
                    <Link href="/dashboard" viewTransition className="flex items-center lg:hidden">
                        <AppLogo className="w-36 sm:w-44" />
                    </Link>
                    <span className="text-muted-foreground hidden text-xs lg:block">
                        MIN VINKÄLLARE <span className="text-border mx-3">/</span> {title}
                    </span>
                    <Link href="/wines/create" className="text-primary inline-flex items-center gap-2 text-sm font-medium">
                        <Plus className="size-4" />
                        Lägg till vin
                    </Link>
                </header>
                <main className="mx-auto max-w-7xl px-5 py-8 pb-28 sm:px-9 sm:py-10 lg:pb-12">
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-primary mb-2 text-[10px] font-semibold tracking-[.22em] uppercase">Vinvalvet</p>
                            <h1 className="font-serif text-4xl tracking-tight sm:text-[42px]">{title}</h1>
                            {description && <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed">{description}</p>}
                        </div>
                        {action}
                    </div>
                    {props.flash?.success && (
                        <div role="status" className="mb-6 rounded-lg border border-green-700/20 bg-green-700/5 p-4 text-sm">
                            {props.flash.success}
                        </div>
                    )}
                    {children}
                </main>
            </div>
            <nav
                aria-label="Mobilnavigation"
                className="border-border bg-card fixed inset-x-0 bottom-0 z-40 flex justify-around border-t px-1 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden"
            >
                {navigation.map(({ url: href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        prefetch="mount"
                        cacheFor={['30s', '5m']}
                        viewTransition
                        className={
                            'flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[10px] transition-[transform,opacity] active:scale-95 data-loading:opacity-60 ' +
                            (url.startsWith(href) ? 'text-primary' : 'text-muted-foreground')
                        }
                    >
                        <Icon className="size-5" />
                        {label}
                    </Link>
                ))}
                <Link
                    href="/settings/profile"
                    prefetch="mount"
                    cacheFor={['30s', '5m']}
                    viewTransition
                    className="text-muted-foreground flex flex-1 flex-col items-center gap-1 py-2 text-[10px] transition-[transform,opacity] active:scale-95 data-loading:opacity-60"
                >
                    <Settings className="size-5" />
                    Konto
                </Link>
            </nav>
        </div>
    );
}
