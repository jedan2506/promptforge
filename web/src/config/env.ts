export const config = {
  apiBase: process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4400/api',
  adminApiKey: process.env.ADMIN_API_KEY ?? '',
  siteName: 'PromptForge',
  siteTagline: 'Version prompts, run diffs, ship with confidence.',
} as const;
