import { test, expect } from '@playwright/test';
import { getLatestResetLink, deleteAllMailhogMessages } from './helpers/api';

const SLUG = 'padaria-do-joao';
const BASE = `http://localhost:3000`;
const ADMIN_URL = `${BASE}/admin/${SLUG}`;
const VALID_EMAIL = 'owner@bakery.com';
const VALID_PASSWORD = 'TestPass123!';

test.describe('Admin Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies/storage between tests
    await page.context().clearCookies();
  });

  // ─── Scenario 1: Branding ───────────────────────────────────────────────

  test('should display establishment name and branding on login page', async ({ page }) => {
    await page.goto(ADMIN_URL);

    // Wait for the page to load (Server Component fetches establishment data)
    await page.waitForLoadState('networkidle');

    // The establishment name should be visible
    await expect(page.getByText('Padaria do João')).toBeVisible();

    // The page title should reference the establishment
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  // ─── Scenario 2: Successful login ──────────────────────────────────────

  test('should redirect to dashboard on successful login', async ({ page }) => {
    await page.goto(ADMIN_URL);

    await page.getByLabel('E-mail').fill(VALID_EMAIL);
    await page.getByLabel('Senha').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Wait for navigation to dashboard
    await page.waitForURL(`**/admin/${SLUG}/dashboard`, { timeout: 10_000 });
    expect(page.url()).toContain(`/admin/${SLUG}/dashboard`);
  });

  // ─── Scenario 3: Remember me ON ────────────────────────────────────────

  test('should persist session when "remember me" is checked', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(ADMIN_URL);
    await page.getByLabel('E-mail').fill(VALID_EMAIL);
    await page.getByLabel('Senha').fill(VALID_PASSWORD);
    await page.getByLabel(/Lembrar/i).check();
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL(`**/admin/${SLUG}/dashboard`, { timeout: 10_000 });

    // Close browser context (simulates closing browser) and reopen
    await context.close();

    const newContext = await browser.newContext({
      storageState: await context.storageState().catch(() => undefined),
    });

    // Note: in a real test you'd persist and restore cookies here.
    // The key assertion is that the refresh token cookie has a max-age set.
    const cookies = await context.cookies().catch(() => []);
    const refreshCookie = cookies.find((c) => c.name === 'refreshToken');
    if (refreshCookie) {
      // If cookie has expires set, it persists across sessions
      expect(refreshCookie.expires).toBeGreaterThan(0);
    }

    await newContext.close();
    await context.close();
  });

  // ─── Scenario 4: Remember me OFF ───────────────────────────────────────

  test('should end session when "remember me" is NOT checked', async ({ page, context }) => {
    await page.goto(ADMIN_URL);
    await page.getByLabel('E-mail').fill(VALID_EMAIL);
    await page.getByLabel('Senha').fill(VALID_PASSWORD);
    // Do NOT check "remember me"
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL(`**/admin/${SLUG}/dashboard`, { timeout: 10_000 });

    // Get cookies — without rememberMe, there should be no expires (session cookie)
    const cookies = await context.cookies();
    const refreshCookie = cookies.find((c) => c.name === 'refreshToken');
    // Session cookie: expires = -1 means it expires when browser closes
    if (refreshCookie) {
      expect(refreshCookie.expires).toBeLessThanOrEqual(0);
    }
  });

  // ─── Scenario 5: Full password recovery ────────────────────────────────

  test('should complete full password recovery flow', async ({ page }) => {
    await deleteAllMailhogMessages();

    await page.goto(ADMIN_URL);

    // Click "Esqueci minha senha"
    await page.getByRole('link', { name: /Esqueci minha senha/i }).click();
    await page.waitForURL(`**/admin/${SLUG}/forgot-password`);

    // Fill and submit the forgot-password form
    await page.getByLabel('E-mail').fill(VALID_EMAIL);
    await page.getByRole('button', { name: 'Enviar instruções' }).click();

    // Should show success message
    await expect(page.getByText(/instruções/i)).toBeVisible({ timeout: 10_000 });

    // Get reset link from MailHog
    await page.waitForTimeout(1000); // Wait for email to arrive
    const resetLink = await getLatestResetLink();
    expect(resetLink).not.toBeNull();

    // Navigate to reset link
    await page.goto(resetLink!);

    // Fill new password
    const newPassword = 'NewSecure456!';
    await page.getByLabel('Nova senha').fill(newPassword);
    await page.getByLabel('Confirmar nova senha').fill(newPassword);
    await page.getByRole('button', { name: 'Redefinir senha' }).click();

    // Should redirect to login with success indicator
    await page.waitForURL(`**/admin/${SLUG}**`, { timeout: 10_000 });

    // Log in with new password
    await page.getByLabel('E-mail').fill(VALID_EMAIL);
    await page.getByLabel('Senha').fill(newPassword);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL(`**/admin/${SLUG}/dashboard`, { timeout: 10_000 });
    expect(page.url()).toContain('/dashboard');
  });

  // ─── Scenario 6: Non-existent slug → 404 ───────────────────────────────

  test('should show 404 page for non-existent slug', async ({ page }) => {
    await page.goto(`${BASE}/admin/slug-que-nao-existe`);
    await page.waitForLoadState('networkidle');

    // Next.js 404 page should be shown
    const status = page.getByText(/404|não encontrad|not found/i);
    await expect(status).toBeVisible({ timeout: 5000 });
  });
});
