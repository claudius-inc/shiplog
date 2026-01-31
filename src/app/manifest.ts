// ============================================================================
// Web App Manifest — PWA metadata
// ============================================================================

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ShipLog — Changelogs that write themselves',
    short_name: 'ShipLog',
    description:
      'Connect your GitHub repo. AI categorizes your merged PRs into beautiful, hosted changelogs.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
