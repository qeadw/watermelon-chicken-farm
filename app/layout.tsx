import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Watermelon Chicken Farm',
  description: 'An AFK farming game - collect seeds, grow watermelons, raise chickens!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
