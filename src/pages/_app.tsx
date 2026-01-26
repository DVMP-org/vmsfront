import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import type { ReactElement, ReactNode } from 'react';
import { Inter } from "next/font/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "sonner";
import { useEffect, Suspense } from "react";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Head from 'next/head';
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
    const token = useAuthStore((state) => state.token);
    const getLayout = Component.getLayout ?? ((page) => page);

    useEffect(() => {
        if (token) {
            apiClient.setToken(token);
        }
    }, [token]);

    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            process.env.NODE_ENV === "production"
        ) {
            const register = async () => {
                try {
                    await navigator.serviceWorker.register("/service-worker.js");
                } catch (error) {
                    console.error("Service worker registration failed", error);
                }
            };
            register();
        }
    }, []);

    return (
        <div className={inter.className}>
            <Head>
                <title>VMSCORE - Visitor Management System</title>
                <meta name="description" content="White-label visitor and resident access management" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                <meta name="theme-color" content="#0f172a" />
                <link rel="manifest" href="/manifest.webmanifest" />
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/favicon.ico" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="VMSCORE" />
            </Head>
            <QueryClientProvider client={queryClient}>
                <ErrorBoundary>
                    <ThemeProvider>
                        {getLayout(<Component {...pageProps} />)}
                        <Toaster position="top-right" richColors />
                    </ThemeProvider>
                </ErrorBoundary>
            </QueryClientProvider>
        </div>
    );
}
