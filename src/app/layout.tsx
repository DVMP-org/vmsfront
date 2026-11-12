import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/inter";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "@vms/ui/tokens.css";
import "react-datepicker/dist/react-datepicker.css";
import "./globals.css";
import { Providers } from "./providers";
import { Suspense } from "react";
import { BootSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "VMS Core — Property Operations",
  description: "Property operations, access and administration in context",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: ["/icon.svg", "/favicon.ico"],
    shortcut: "/icon.svg",
    apple: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VMS Core",
    startupImage: "/assets/vmscore_logo.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f7f8",
  width: "device-width",
  initialScale: 1,
};

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
                    const toRgb = function(hex) {
                      if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return null;
                      return [1, 3, 5].map(function(offset) {
                        return parseInt(hex.slice(offset, offset + 2), 16);
                      }).join(' ');
                    };
                    const primary = toRgb(theme.primary_color);
                    const secondary = toRgb(theme.secondary_color);
                    if (primary) {
                      root.style.setProperty('--brand-primary', primary);
                    }
                    if (secondary) {
                      root.style.setProperty('--brand-secondary', secondary);
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
        <Suspense fallback={<BootSkeleton label="Loading VMS Core" />}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
