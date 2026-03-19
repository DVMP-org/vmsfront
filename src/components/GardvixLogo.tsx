"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme_context";

interface GardvixLogoProps {
    width?: number;
    height?: number;
    className?: string;
}

export default function GardvixLogo({
    width = 150,
    height = 48,
    className = "",
}: GardvixLogoProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Default to light logo during SSR to avoid hydration mismatch
    const logoSrc = mounted && theme === "dark"
        ? "/gardvix-logo-dark.svg"
        : "/gardvix-logo-light.svg";

    return (
        <Image
            src={logoSrc}
            alt="Gardvix"
            width={width}
            height={height}
            className={className}
            priority
        />
    );
}
