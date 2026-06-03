const MAILHOG_URL = process.env.MAILHOG_URL ?? 'http://localhost:8025';

export async function seedEstablishment(slug: string) {
  // This function is a placeholder — in a real E2E setup you would call
  // a test-only API endpoint or use a database seed script.
  // For local dev, seed via docker exec or the admin CLI.
}

export async function getLatestResetLink(): Promise<string | null> {
  try {
    const res = await fetch(`${MAILHOG_URL}/api/v2/messages?limit=1`);
    const data = await res.json() as { items?: Array<{ Content?: { Body?: string } }> };
    const latestEmail = data.items?.[0];
    if (!latestEmail) return null;

    const body = latestEmail.Content?.Body ?? '';
    const linkMatch = body.match(/https?:\/\/[^\s"]+reset-password[^\s"]+/);
    return linkMatch?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function deleteAllMailhogMessages() {
  await fetch(`${MAILHOG_URL}/api/v1/messages`, { method: 'DELETE' }).catch(() => {});
}
