// ============================================================================
// sitemap.xml — Dynamic sitemap for SEO
// ============================================================================

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://shiplog.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  // Static entries — dynamic changelog pages added once DB is live
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
