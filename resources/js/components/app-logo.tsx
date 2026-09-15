import { cn } from '@/lib/utils';

export default function AppLogo({ variant = 'horizontal', className }: { variant?: 'horizontal' | 'stacked'; className?: string }) {
    const stacked = variant === 'stacked';

    return (
        <img
            src={stacked ? '/vinvalvet-logo-stacked.png' : '/vinvalvet-logo-proposal.png'}
            alt="Vinvalvet"
            width={stacked ? 1536 : 2172}
            height={stacked ? 1024 : 724}
            className={cn(
                'h-auto shrink-0 object-contain dark:invert',
                stacked ? 'w-48 mix-blend-multiply dark:mix-blend-screen dark:grayscale' : 'w-44 dark:brightness-0',
                className,
            )}
        />
    );
}
