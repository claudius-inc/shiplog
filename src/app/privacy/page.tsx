// ============================================================================
// /privacy — Privacy Policy
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'ShipLog Privacy Policy — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  const lastUpdated = 'February 1, 2025';

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-gray-300">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="mb-2 text-4xl font-bold text-white">Privacy Policy</h1>
        <p className="mb-12 text-sm text-gray-500">
          Last updated: {lastUpdated}
        </p>

        <div className="space-y-10 leading-relaxed [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-gray-200 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-1">
          <section>
            <p>
              Claudius Inc. (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
              &ldquo;our&rdquo;) operates ShipLog (the
              &ldquo;Service&rdquo;), accessible at{' '}
              <Link
                href="https://shiplog.dev"
                className="text-indigo-400 hover:underline"
              >
                shiplog.dev
              </Link>
              . This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our Service.
            </p>
          </section>

          <section>
            <h2>1. Information We Collect</h2>

            <h3>Account Information</h3>
            <p>
              When you sign in via GitHub OAuth, we receive your GitHub username,
              email address, avatar URL, and a unique identifier. We do not
              receive or store your GitHub password.
            </p>

            <h3>Repository Data</h3>
            <p>
              When you connect a GitHub repository, we access pull request
              titles, descriptions, labels, authors, and merge dates to generate
              changelogs. We do not access your source code.
            </p>

            <h3>Payment Information</h3>
            <p>
              Payments are processed by Stripe. We do not store credit card
              numbers or full payment details. Stripe provides us with a
              customer identifier, subscription status, and billing email. See{' '}
              <Link
                href="https://stripe.com/privacy"
                className="text-indigo-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe&apos;s Privacy Policy
              </Link>
              .
            </p>

            <h3>Usage Data</h3>
            <p>
              We use Vercel Analytics and Vercel Speed Insights to collect
              anonymised, aggregate performance data (page views, web vitals).
              These tools do not use cookies or track individual users across
              sites.
            </p>

            <h3>Log Data</h3>
            <p>
              Our servers automatically record information such as your IP
              address, browser type, referring page, and timestamps. This data
              is retained for operational and security purposes.
            </p>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <ul>
              <li>To provide, maintain, and improve the Service</li>
              <li>To generate AI-powered changelogs from your repository data</li>
              <li>To process payments and manage subscriptions</li>
              <li>To send transactional emails (e.g., billing receipts)</li>
              <li>To detect and prevent fraud, abuse, or security incidents</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2>3. Data Sharing</h2>
            <p>We do not sell your personal information. We share data only with:</p>
            <ul>
              <li>
                <strong>GitHub</strong> — OAuth authentication and API access to
                repositories you explicitly connect
              </li>
              <li>
                <strong>Stripe</strong> — payment processing
              </li>
              <li>
                <strong>Vercel</strong> — hosting, analytics, and speed insights
              </li>
              <li>
                <strong>OpenAI</strong> — AI processing of pull request metadata
                to generate changelog summaries (no source code is sent)
              </li>
              <li>
                <strong>Turso (libSQL)</strong> — database hosting
              </li>
            </ul>
            <p className="mt-3">
              We may also disclose information if required by law or to protect
              our rights, safety, or property.
            </p>
          </section>

          <section>
            <h2>4. Cookies</h2>
            <p>
              We use essential cookies to maintain your authentication session.
              We do not use advertising or third-party tracking cookies. Vercel
              Analytics is cookie-free and privacy-friendly.
            </p>
          </section>

          <section>
            <h2>5. Data Retention</h2>
            <p>
              We retain your account and changelog data for as long as your
              account is active. If you delete your account, we will remove your
              personal data within 30 days, except where retention is required by
              law. Anonymised, aggregate analytics data may be retained
              indefinitely.
            </p>
          </section>

          <section>
            <h2>6. Data Security</h2>
            <p>
              We implement industry-standard security measures including
              encrypted connections (TLS), secure token storage, and access
              controls. However, no method of transmission over the Internet is
              100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2>7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <Link
                href="mailto:privacy@shiplog.dev"
                className="text-indigo-400 hover:underline"
              >
                privacy@shiplog.dev
              </Link>
              .
            </p>
          </section>

          <section>
            <h2>8. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries
              other than your own. We ensure appropriate safeguards are in place
              in accordance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2>9. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed to children under 16. We do not
              knowingly collect personal information from children. If you
              believe a child has provided us with personal data, please contact
              us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of material changes by posting the updated policy on
              this page with a revised &ldquo;Last updated&rdquo; date. Your
              continued use of the Service after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section>
            <h2>11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact
              us at{' '}
              <Link
                href="mailto:privacy@shiplog.dev"
                className="text-indigo-400 hover:underline"
              >
                privacy@shiplog.dev
              </Link>
              .
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Claudius Inc.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
