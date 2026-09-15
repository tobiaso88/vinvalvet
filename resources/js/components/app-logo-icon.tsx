import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 1280 1280" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <image href="/vinvalvet-icon.png" width="1280" height="1280" className="dark:brightness-0 dark:invert" />
        </svg>
    );
}
