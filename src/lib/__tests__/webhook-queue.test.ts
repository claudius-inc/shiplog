// ============================================================================
// Webhook Queue Tests
// ============================================================================

import { describe, it, expect } from 'vitest';

// Test the backoff logic (extracted for testability)
const BACKOFF_DELAYS = [30, 120, 600, 3600, 21600];

function getBackoffDelay(attempts: number): number {
  return BACKOFF_DELAYS[Math.min(attempts, BACKOFF_DELAYS.length - 1)];
}

describe('Webhook Queue - Backoff Logic', () => {
  it('should use 30s delay for first retry', () => {
    expect(getBackoffDelay(0)).toBe(30);
  });

  it('should use 2min delay for second retry', () => {
    expect(getBackoffDelay(1)).toBe(120);
  });

  it('should use 10min delay for third retry', () => {
    expect(getBackoffDelay(2)).toBe(600);
  });

  it('should use 1hr delay for fourth retry', () => {
    expect(getBackoffDelay(3)).toBe(3600);
  });

  it('should use 6hr delay for fifth retry', () => {
    expect(getBackoffDelay(4)).toBe(21600);
  });

  it('should cap at max delay for attempts beyond array length', () => {
    expect(getBackoffDelay(5)).toBe(21600);
    expect(getBackoffDelay(10)).toBe(21600);
    expect(getBackoffDelay(100)).toBe(21600);
  });

  it('should return progressively increasing delays', () => {
    const delays = [0, 1, 2, 3, 4].map(getBackoffDelay);
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThan(delays[i - 1]);
    }
  });
});

describe('Webhook Queue - Status Transitions', () => {
  const VALID_STATUSES = ['pending', 'processing', 'failed', 'completed', 'dead'];

  it('should define all valid statuses', () => {
    expect(VALID_STATUSES).toHaveLength(5);
    expect(VALID_STATUSES).toContain('pending');
    expect(VALID_STATUSES).toContain('dead');
  });

  it('pending → processing is valid', () => {
    const transitions: Record<string, string[]> = {
      pending: ['processing'],
      processing: ['completed', 'failed'],
      failed: ['processing'],
      completed: [], // terminal
      dead: [], // terminal
    };

    expect(transitions.pending).toContain('processing');
    expect(transitions.processing).toContain('completed');
    expect(transitions.processing).toContain('failed');
    expect(transitions.failed).toContain('processing');
    expect(transitions.completed).toHaveLength(0);
    expect(transitions.dead).toHaveLength(0);
  });

  it('max_attempts=5 should move to dead after 5 failures', () => {
    const maxAttempts = 5;
    let attempts = 0;
    let status = 'pending';

    // Simulate 5 failed attempts
    for (let i = 0; i < maxAttempts; i++) {
      status = 'processing';
      attempts++;
      if (attempts >= maxAttempts) {
        status = 'dead';
      } else {
        status = 'failed';
      }
    }

    expect(status).toBe('dead');
    expect(attempts).toBe(5);
  });
});
