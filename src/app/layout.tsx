import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShipLog — Changelogs that write themselves',
  description:
    'Connect your GitHub repo. AI categorizes your merged PRs into beautiful, hosted changelogs. Built by Claudius Inc.',
  openGraph: {
    title: 'ShipLog — Changelogs that write themselves',
    description:
      'Connect your GitHub repo. AI categorizes your merged PRs into beautiful, hosted changelogs.',
    siteName: 'ShipLog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShipLog — Changelogs that write themselves',
    description:
      'Connect your GitHub repo. AI categorizes your merged PRs into beautiful, hosted changelogs.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
