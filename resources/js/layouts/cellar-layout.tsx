import { NativeRow } from '@/components/cellar';
import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronLeft, CircleUserRound, History, House, LayoutGrid, Settings, Utensils, Wine } from 'lucide-react';
import type { ReactNode } from 'react';

const navigation = [
    { url: '/dashboard', label: 'Översikt', icon: House },
    { url: '/wines', label: 'Viner', icon: Wine },
    { url: '/racks', label: 'Hyllor', icon: LayoutGrid },
    { url: '/pairing', label: 'Mat & vin', icon: Utensils },
    { url: '/settings', label: 'Mer', icon: CircleUserRound },
];
export default function CellarLayout({
    children,
    title,
    description,
    action,
    back,
    hideHeading = false,
}: {
    children: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    back?: { href: string; label: string };
    hideHeading?: boolean;
}) {
    const { url, props } = usePage<{ auth: { user: { name: string } }; flash?: { success?: string } }>();
    return (
        <div className="bg-background min-h-dvh">
            <Head title={title} />
            <aside className="border-border bg-card fixed inset-y-0 left-0 z-30 hidden w-[190px] flex-col border-r px-3.5 py-6 lg:flex">
                <Link href="/dashboard" className="mb-7 px-2.5 text-[21px] font-bold tracking-[-1px]">
                    Vinvalvet
                </Link>
                <nav aria-label="Huvudnavigation" className="flex flex-col gap-1">
                    {navigation.slice(0, 4).map(({ url: href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            prefetch
                            className={
                                'flex min-h-11 items-center gap-2.5 rounded-[10px] px-[13px] py-3 text-sm ' +
                                (url.startsWith(href) ? 'bg-secondary text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/30')
                            }
                        >
                            <Icon className="size-[18px]" />
                            {label === 'Viner' ? 'Mina viner' : label === 'Hyllor' ? 'Vinhyllor' : label === 'Mat & vin' ? 'Vin till maten' : label}
                        </Link>
                    ))}
                    <NativeRow title="Aktivitet" href="/activity" icon={History} />
                </nav>
                <div className="mt-auto">
                    <NativeRow title="Inställningar" href="/settings" icon={Settings} />
                    <NativeRow title={props.auth.user.name} href="/settings/profile" icon={CircleUserRound} />
                </div>
            </aside>
            <div className="lg:ml-[190px]">
                <main className="mx-auto max-w-[1240px] px-[17px] pt-[max(24px,env(safe-area-inset-top))] pb-[calc(100px+env(safe-area-inset-bottom))] lg:p-7">
                    {back && (
                        <Link href={back.href} className="text-primary mb-[18px] inline-flex min-h-9 items-center gap-0.5 text-[13px]">
                            <ChevronLeft className="size-[18px]" />
                            {back.label}
                        </Link>
                    )}
                    {!hideHeading && (
                        <div className="mb-[22px] flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h1 className="text-[29px] leading-[1.12] font-bold tracking-[-1px] lg:text-[30px]">{title}</h1>
                                {description && <p className="text-muted-foreground mt-2 max-w-xl text-[13px] leading-[1.55]">{description}</p>}
                            </div>
                            {action}
                        </div>
                    )}
                    {props.flash?.success && (
                        <div role="status" className="native-success mb-5">
                            {props.flash.success}
                        </div>
                    )}
                    {children}
                </main>
            </div>
            <nav
                aria-label="Mobilnavigation"
                className="border-border bg-card fixed inset-x-0 bottom-0 z-40 flex items-center justify-around gap-1 border-t px-1 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] lg:hidden"
            >
                {navigation.map(({ url: href, label, icon: Icon }) => {
                    const active = url.startsWith(href) || (href === '/settings' && url.startsWith('/activity'));
                    return (
                        <Link
                            key={href}
                            href={href}
                            prefetch
                            aria-current={active ? 'page' : undefined}
                            className={
                                'flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-[5px] text-[10px] transition-opacity active:opacity-60 ' +
                                (active ? 'text-primary font-semibold' : 'text-muted-foreground')
                            }
                        >
                            <Icon className="size-[18px]" />
                            {label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
