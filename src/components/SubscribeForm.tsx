'use client';

// ============================================================================
// SubscribeForm — Inline email subscription for changelog pages
// ============================================================================

import { useState } from 'react';

export default function SubscribeForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/digest/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, slug }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('Subscribed! Check your email for confirmation.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
        <span>✓</span>
        <span>{message}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@company.com"
        required
        className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
      >
        {status === 'loading' ? '...' : '📬 Subscribe'}
      </button>
      {status === 'error' && (
        <span className="text-red-400 text-sm self-center">{message}</span>
      )}
    </form>
  );
}
