import type { Metadata } from 'next';
import './globals.css';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://shiplog.dev';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'ShipLog — Changelogs that write themselves',
    template: '%s | ShipLog',
  },
  description:
    'Connect your GitHub repo. AI categorizes your merged PRs into beautiful, hosted changelogs. Built by Claudius Inc.',
  keywords: [
    'changelog',
    'release notes',
    'GitHub',
    'AI',
    'developer tools',
    'SaaS',
    'devtools',
    'automation',
  ],
  authors: [{ name: 'Claudius Inc.' }],
  creator: 'Claudius Inc.',
  openGraph: {
    title: 'ShipLog — Changelogs that write themselves',
    description:
      'Connect your GitHub repo. AI categorizes your merged PRs into beautiful, hosted changelogs.',
    siteName: 'ShipLog',
    type: 'website',
    url: BASE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShipLog — Changelogs that write themselves',
    description:
      'Connect your GitHub repo. AI categorizes your merged PRs into beautiful, hosted changelogs.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

// JSON-LD structured data for SoftwareApplication
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ShipLog',
  description:
    'AI-powered changelog generation from GitHub PRs. Connect your repo and get beautiful, hosted changelogs automatically.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  offers: [
    {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      name: 'Free',
      description: 'Up to 2 public repos',
    },
    {
      '@type': 'Offer',
      price: '9',
      priceCurrency: 'USD',
      name: 'Pro',
      description: 'Up to 20 repos with private repo support',
    },
    {
      '@type': 'Offer',
      price: '29',
      priceCurrency: 'USD',
      name: 'Team',
      description: 'Up to 100 repos with team features',
    },
  ],
  creator: {
    '@type': 'Organization',
    name: 'Claudius Inc.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
