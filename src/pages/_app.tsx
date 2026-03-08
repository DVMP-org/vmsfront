import "@//pages/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        :root {
          --font-sans: ${inter.style.fontFamily};
          --font-display: ${jakarta.style.fontFamily};
        }
      `}</style>
      <Head>
        <title>VMS Core — Community Access &amp; Visitor Management</title>
        <meta
          name="description"
          content="VMS Core is the all-in-one platform for HOAs, gated communities, and apartment buildings to manage visitor access, gate events, resident coordination, and community operations."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={`${inter.variable} ${jakarta.variable} font-sans`}>
        <Component {...pageProps} />
      </div>
    </>
  );
}
