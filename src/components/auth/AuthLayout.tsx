"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { LogoFull } from "@/components/LogoFull";
import { Home } from "lucide-react";
import NextLink from "next/link";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-background overflow-hidden">
            {/* Decorative Side Panel - Left */}
            <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-[rgb(var(--brand-primary))] relative items-center justify-center overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/10 blur-3xl animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-[100px]" />
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                            backgroundSize: '40px 40px'
                        }}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 p-12 text-white max-w-xl text-center md:text-left"
                >
                    <div className="mb-8 inline-block">
                        <div className="bg-white p-4 rounded-2xl shadow-2xl">
                            <LogoFull width={240} height={60} />
                        </div>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight">
                        Streamlining Estate Management with Precision
                    </h1>
                    <p className="text-xl text-white/80 font-light leading-relaxed mb-8">
                        Experience the next generation of visitor management systems. Secure, efficient, and built for modern communities.
                    </p>

                    <div className="grid grid-cols-2 gap-6 mt-12">
                        <div className="border border-white/20 rounded-xl p-4 bg-white/5 backdrop-blur-sm">
                            <div className="font-bold text-2xl mb-1">99.9%</div>
                            <div className="text-white/60 text-sm italic">System Uptime</div>
                        </div>
                        <div className="border border-white/20 rounded-xl p-4 bg-white/5 backdrop-blur-sm">
                            <div className="font-bold text-2xl mb-1">Secure</div>
                            <div className="text-white/60 text-sm italic">Bank-level Encryption</div>
                        </div>
                    </div>
                </motion.div>

                {/* Floating elements for visual interest */}
                <motion.div
                    animate={{
                        y: [0, -20, 0],
                        rotate: [0, 5, 0]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-[20%] right-[10%] w-24 h-24 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/10 z-0"
                />
                <motion.div
                    animate={{
                        y: [0, 30, 0],
                        rotate: [0, -10, 0]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute bottom-[20%] left-[15%] w-16 h-16 bg-white/10 rounded-full backdrop-blur-xl border border-white/10 z-0"
                />
            </div>

            {/* Main Panel - Right/Center */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-16 bg-background relative">
                <div className="absolute top-8 left-8 md:hidden">
                    <LogoFull width={120} height={40} />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-8 text-center md:text-left">
                        <h2 className="text-3xl font-extrabold tracking-tight mb-2">{title}</h2>
                        <p className="text-muted-foreground">{description}</p>
                    </div>

                    <div className="transition-all duration-300">
                        {children}
                    </div>

                    <div className="mt-12 text-center text-sm text-muted-foreground">
                        <p>&copy; {new Date().getFullYear()} VMS Core. All rights reserved.</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
