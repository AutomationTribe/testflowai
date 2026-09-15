import type { ReactNode } from 'react';
import { Hanken_Grotesk } from 'next/font/google';
import { SessionProvider } from '@/lib/SessionProvider';
import '../styles/tokens.css';

// design-system.md §2: Hanken Grotesk is the approved primary UI typeface.
const hankenGrotesk = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-ui-family' });

export const metadata = {
  title: 'TestFlow',
  description: 'TestFlow AI — account access and subscription.',
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en" className={hankenGrotesk.variable}>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
