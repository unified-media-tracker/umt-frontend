import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number): SVGProps<SVGSVGElement> => ({
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
});

export function SearchIcon({ size = 16, ...props }: IconProps) {
    return (
        <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M20 20l-4.8-4.8" strokeLinecap="round" />
        </svg>
    );
}

export function CloseIcon({ size = 15, ...props }: IconProps) {
    return (
        <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
            <path d="M5 5l14 14M19 5L5 19" />
        </svg>
    );
}

export function BookmarkIcon({ size = 18, filled = false, ...props }: IconProps & { filled?: boolean }) {
    return (
        <svg
            {...base(size)}
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinejoin="round"
            {...props}
        >
            <path d="M6 4h12v17l-6-4-6 4z" />
        </svg>
    );
}

export function PlayIcon({ size = 16, ...props }: IconProps) {
    return (
        <svg {...base(size)} fill="currentColor" {...props}>
            <path d="M7 4.5v15l13-7.5z" />
        </svg>
    );
}
