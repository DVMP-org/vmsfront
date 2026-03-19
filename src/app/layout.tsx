
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./dashboard.css";
import { Providers } from "./providers";
import { Suspense } from "react";
import { getBrandingBootstrapScript } from "../lib/branding-utils";

const inter = Inter({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL;
if (!APP_URL) {
  throw new Error("NEXT_PUBLIC_BASE_URL environment variable is not set");
}
const appName = process.env.NEXT_PUBLIC_APP_NAME;
const APP_TITLE = `${appName} - Visitor Management System`;
const APP_DESCRIPTION =
  "White-label visitor and resident access management — gate passes, visitor logs, dues, emergencies and more.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default: APP_TITLE,
    template: `%s | ${appName}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",

  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: appName,
    startupImage: "/gardvix-logo-dark.svg",
  },

  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: appName,
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${appName} — Visitor Management System`,
      },
    ],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: getBrandingBootstrapScript(),
          }}
        />
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
