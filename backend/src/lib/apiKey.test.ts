import { describe, it, expect } from 'vitest';
import { generateApiKey, hashApiKey, API_KEY_PREFIX } from './apiKey.js';

describe('apiKey', () => {
  it('generates a key with pf_ prefix and stable hash', () => {
    const { plaintext, hash, preview } = generateApiKey();
    expect(plaintext.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(plaintext.length).toBeGreaterThan(50);
    expect(hash).toHaveLength(64);
    expect(hashApiKey(plaintext)).toBe(hash);
    expect(preview).toMatch(/^pf_.{7}….{4}$/);
  });

  it('two generated keys never collide', () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.plaintext).not.toBe(b.plaintext);
    expect(a.hash).not.toBe(b.hash);
  });

  it('hash is deterministic', () => {
    const key = 'pf_deadbeef1234567890';
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });
});
