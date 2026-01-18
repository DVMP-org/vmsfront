import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
                    integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              (function() {
                try {
                  const root = document.documentElement;
                  const darkMode = localStorage.getItem('darkMode');
                  
                  if (darkMode === 'true' || (!darkMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    root.classList.add('dark');
                  } else {
                    root.classList.remove('dark');
                  }

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
            </Head>
            <body className="antialiased">
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
