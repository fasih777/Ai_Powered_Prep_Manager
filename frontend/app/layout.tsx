import type { Metadata } from 'next';
import { Public_Sans, JetBrains_Mono } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI-Powered Prep Manager',
  description: 'Packaging compliance reviewer for FBA/3PL prep stations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const themeCookie = cookieStore.get('theme')?.value ?? 'system';

  // Determine initial server theme class
  let initialClass = '';
  if (themeCookie === 'dark') {
    initialClass = 'dark';
  }

  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${jetbrainsMono.variable} ${initialClass}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          NOTE: This inline blocking script resolves the system theme before first paint
          to prevent a Flash of Unstyled Theme (FOUC).
          TODO(security): Will need a CSP nonce/hash in the security-headers phase.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var cookieTheme = (document.cookie.match(/(?:^|; )theme=([^;]*)/) || [])[1];
                  var isSystem = !cookieTheme || cookieTheme === 'system';
                  var isDark = cookieTheme === 'dark' || (isSystem && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
