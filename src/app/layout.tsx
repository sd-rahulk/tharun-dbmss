import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Transit / 26 — Public Metro & Bus Transit Management System',
  description: 'A Supabase PostgreSQL academic transit operations and passenger booking platform.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
