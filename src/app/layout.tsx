import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

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
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const cached = localStorage.getItem('active-branding-theme');
                  if (cached) {
                    const theme = JSON.parse(cached);
                    const root = document.documentElement;
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
