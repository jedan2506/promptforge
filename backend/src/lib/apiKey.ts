import { createHash, randomBytes } from 'node:crypto';

export const API_KEY_PREFIX = 'pf_';

export function generateApiKey(): { plaintext: string; hash: string; preview: string } {
  const raw = randomBytes(24).toString('hex');
  const plaintext = `${API_KEY_PREFIX}${raw}`;
  const hash = hashApiKey(plaintext);
  const preview = `${plaintext.slice(0, 10)}…${plaintext.slice(-4)}`;
  return { plaintext, hash, preview };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}
