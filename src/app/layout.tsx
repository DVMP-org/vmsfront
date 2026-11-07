import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/inter";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import { Providers } from "./providers";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "VMSCORE - Visitor Management System",
  description: "White-label visitor and resident access management",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VMSCORE",
    startupImage: "/assets/vmscore_logo.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f7fb",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const root = document.documentElement;
                  root.classList.remove('dark');
                  root.classList.add('light');
                  localStorage.removeItem('darkMode');

                  const cached = localStorage.getItem('active-branding-theme');
                  if (cached) {
                    const theme = JSON.parse(cached);
                    if (theme.primary_color) {
                      root.style.setProperty('--brand-primary', theme.primary_color);
                    }
                    if (theme.secondary_color) {
                      root.style.setProperty('--brand-secondary', theme.secondary_color);
                    }
                    if (theme.favicon_url) {
                      let favicon = document.querySelector("link[rel='icon']");
                      if (!favicon) {
                        favicon = document.createElement("link");
                        favicon.rel = "icon";
                        document.head.appendChild(favicon);
                      }
                      favicon.href = theme.favicon_url;
                    }
                  }
                } catch (e) {
                  // Ignore errors
                }
              })();
            `,
          }}
        />
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
