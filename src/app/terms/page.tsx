// ============================================================================
// /terms — Terms of Service
// ============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'ShipLog Terms of Service — the agreement between you and Claudius Inc.',
};

export default function TermsPage() {
  const lastUpdated = 'February 1, 2025';

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-gray-300">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="mb-2 text-4xl font-bold text-white">
          Terms of Service
        </h1>
        <p className="mb-12 text-sm text-gray-500">
          Last updated: {lastUpdated}
        </p>

        <div className="space-y-10 leading-relaxed [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-gray-200 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-1">
          <section>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access
              to and use of ShipLog (the &ldquo;Service&rdquo;), operated by
              Claudius Inc. (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
              &ldquo;our&rdquo;). By accessing or using the Service, you agree
              to be bound by these Terms. If you do not agree, do not use the
              Service.
            </p>
          </section>

          <section>
            <h2>1. Eligibility</h2>
            <p>
              You must be at least 16 years old and capable of forming a binding
              contract to use the Service. By using ShipLog, you represent that
              you meet these requirements.
            </p>
          </section>

          <section>
            <h2>2. Account Registration</h2>
            <p>
              You sign in to ShipLog using your GitHub account via OAuth. You
              are responsible for maintaining the security of your GitHub account
              and for all activities that occur under your ShipLog account. You
              must notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2>3. Description of Service</h2>
            <p>
              ShipLog is a SaaS platform that generates changelogs from GitHub
              pull request data using AI. The Service includes:
            </p>
            <ul>
              <li>Connecting GitHub repositories</li>
              <li>AI-powered categorisation and summarisation of merged PRs</li>
              <li>Hosted, public changelog pages for your projects</li>
              <li>An embeddable changelog widget</li>
              <li>RSS feeds and API access</li>
            </ul>
          </section>

          <section>
            <h2>4. Subscriptions and Billing</h2>

            <h3>Free Tier</h3>
            <p>
              The free plan includes up to 2 public repositories with limited
              features. No payment is required.
            </p>

            <h3>Paid Plans</h3>
            <p>
              Paid subscriptions (Pro, Team) are billed monthly or annually
              through Stripe. Prices are listed on our{' '}
              <Link
                href="/pricing"
                className="text-indigo-400 hover:underline"
              >
                pricing page
              </Link>{' '}
              and may change with 30 days&apos; notice.
            </p>

            <h3>Cancellation</h3>
            <p>
              You may cancel your subscription at any time from your dashboard.
              Cancellation takes effect at the end of your current billing
              period. No prorated refunds are provided for partial billing
              periods.
            </p>

            <h3>Refunds</h3>
            <p>
              We offer refunds on a case-by-case basis within 14 days of
              initial purchase. Contact{' '}
              <Link
                href="mailto:support@shiplog.dev"
                className="text-indigo-400 hover:underline"
              >
                support@shiplog.dev
              </Link>{' '}
              for refund requests.
            </p>
          </section>

          <section>
            <h2>5. Your Content</h2>
            <p>
              You retain ownership of all content you provide to the Service,
              including repository data and generated changelogs. By using the
              Service, you grant us a limited licence to access, process, and
              display your content solely to provide the Service.
            </p>
            <p className="mt-3">
              Generated changelogs are derived from your repository data and
              belong to you. You may export, copy, or republish them freely.
            </p>
          </section>

          <section>
            <h2>6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable laws
              </li>
              <li>
                Attempt to gain unauthorized access to the Service, other
                accounts, or related systems
              </li>
              <li>
                Interfere with or disrupt the Service or its infrastructure
              </li>
              <li>
                Reverse-engineer, decompile, or disassemble any part of the
                Service
              </li>
              <li>
                Use the Service to generate misleading, fraudulent, or
                deceptive content
              </li>
              <li>
                Exceed reasonable API rate limits or abuse automated access
              </li>
              <li>
                Resell, sublicense, or redistribute the Service without our
                written consent
              </li>
            </ul>
          </section>

          <section>
            <h2>7. AI-Generated Content</h2>
            <p>
              ShipLog uses artificial intelligence (including OpenAI) to
              generate changelog summaries. AI-generated content may not always
              be perfectly accurate. You are responsible for reviewing generated
              changelogs before publishing. We do not guarantee the accuracy,
              completeness, or suitability of AI-generated content.
            </p>
          </section>

          <section>
            <h2>8. GitHub Integration</h2>
            <p>
              The Service integrates with GitHub via OAuth and the GitHub API.
              Your use of GitHub is subject to GitHub&apos;s own{' '}
              <Link
                href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service"
                className="text-indigo-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </Link>
              . We are not responsible for GitHub&apos;s availability, API
              changes, or data practices.
            </p>
          </section>

          <section>
            <h2>9. Availability and Support</h2>
            <p>
              We strive to keep the Service available 24/7 but do not guarantee
              uninterrupted access. We may perform maintenance, updates, or
              changes that temporarily affect availability. We provide support
              on a reasonable-efforts basis via email.
            </p>
          </section>

          <section>
            <h2>10. Intellectual Property</h2>
            <p>
              The Service, including its design, code, branding, and
              documentation, is owned by Claudius Inc. and protected by
              applicable intellectual property laws. These Terms do not grant
              you any rights to our trademarks, logos, or brand assets.
            </p>
          </section>

          <section>
            <h2>11. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
              AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
          </section>

          <section>
            <h2>12. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLAUDIUS INC. SHALL NOT
              BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
              OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL,
              ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL
              NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS
              PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2>13. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Claudius Inc. and its
              officers, directors, employees, and agents from any claims,
              damages, losses, or expenses (including legal fees) arising from
              your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2>14. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any
              time, with or without cause, with or without notice. Upon
              termination, your right to use the Service ceases immediately. You
              may request export of your data within 30 days of termination.
            </p>
          </section>

          <section>
            <h2>15. Changes to These Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify you of
              material changes by posting the updated Terms with a revised date.
              Your continued use of the Service after changes constitutes
              acceptance. If you disagree with changes, you must stop using the
              Service.
            </p>
          </section>

          <section>
            <h2>16. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the State of Delaware, United States, without regard
              to conflict of law principles. Any disputes shall be resolved in
              the courts of Delaware.
            </p>
          </section>

          <section>
            <h2>17. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable, the
              remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section>
            <h2>18. Entire Agreement</h2>
            <p>
              These Terms, together with our{' '}
              <Link
                href="/privacy"
                className="text-indigo-400 hover:underline"
              >
                Privacy Policy
              </Link>
              , constitute the entire agreement between you and Claudius Inc.
              regarding the Service.
            </p>
          </section>

          <section>
            <h2>19. Contact Us</h2>
            <p>
              If you have questions about these Terms, contact us at{' '}
              <Link
                href="mailto:support@shiplog.dev"
                className="text-indigo-400 hover:underline"
              >
                support@shiplog.dev
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
