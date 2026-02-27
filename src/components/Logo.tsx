import type { ImgHTMLAttributes } from 'react';

interface LogoProps extends ImgHTMLAttributes<HTMLImageElement> {
    className?: string;
}

export default function Logo({ className = "w-20 h-20", ...props }: LogoProps) {
    return (
        <div className={`${className} bg-transparent flex items-center justify-center`}>
            <img
                src="/logo_original.png"
                alt="Logo Entre Lanas"
                className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
                {...props}
            />
        </div>
    );
}
