import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001';

const BACKOFFICE = `${BASE}/backoffice`;
const BACKOFFICE_LOGIN = `${BASE}/backoffice/login`;
const BACKOFFICE_CADASTRO = `${BASE}/backoffice/cadastro`;

const ADMIN_NAME = 'Luiz Gustavo';
const ADMIN_EMAIL = 'admin@fooddash.com';
const ADMIN_PASSWORD = 'Senha123!';

async function clearAdmins() {
  // Called before tests that need an empty platform_admins collection
  // Requires a test-only endpoint or direct DB access in CI
  // In local dev: restart with a clean MongoDB instance
}

test.describe('Backoffice Auth Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ─── Scenario 1: Redirect unauthenticated ────────────────────────────────

  test('should redirect unauthenticated access to /backoffice to /backoffice/login', async ({ page }) => {
    await page.goto(BACKOFFICE);
    await page.waitForURL(`${BACKOFFICE_LOGIN}**`);
    await expect(page).toHaveURL(/\/backoffice\/login/);
  });

  // ─── Scenario 2: Cadastro redirect when admin exists ─────────────────────

  test('should redirect /backoffice/cadastro to /backoffice/login when admin already exists', async ({ page }) => {
    // This test assumes an admin already exists in the DB
    // Pre-condition: run after a successful registration test, or seed via API
    const res = await page.request.get(`${API}/api/backoffice/auth/register-available`);
    const body = await res.json() as { available: boolean };

    if (!body.available) {
      await page.goto(BACKOFFICE_CADASTRO);
      await page.waitForURL(`${BACKOFFICE_LOGIN}**`);
      await expect(page).toHaveURL(/\/backoffice\/login/);
    } else {
      test.skip(true, 'No admin exists yet — skipping redirect test');
    }
  });

  // ─── Scenario 3: Full registration → login → home flow ───────────────────

  test('should complete full flow: cadastro → login with confirmation → /backoffice with name', async ({ page }) => {
    // Pre-condition: no admin exists (run with clean DB or clear via API)
    const registerCheck = await page.request.get(`${API}/api/backoffice/auth/register-available`);
    const { available } = await registerCheck.json() as { available: boolean };
    test.skip(!available, 'Admin already exists — clean DB to run this test');

    // Step 1: Go to cadastro
    await page.goto(BACKOFFICE_CADASTRO);
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Nome').fill(ADMIN_NAME);
    await page.getByLabel('E-mail').fill(ADMIN_EMAIL);
    await page.getByLabel('Senha').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Criar conta' }).click();

    // Should redirect to login with registered=1
    await page.waitForURL(`${BACKOFFICE_LOGIN}?registered=1`);
    await expect(page.getByText('Conta criada com sucesso')).toBeVisible();

    // Step 2: Login
    await page.getByLabel('E-mail').fill(ADMIN_EMAIL);
    await page.getByLabel('Senha').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Should redirect to /backoffice
    await page.waitForURL(BACKOFFICE);

    // Step 3: See admin name
    await expect(page.getByText(ADMIN_NAME)).toBeVisible();
  });

  // ─── Scenario 4: Login with invalid credentials ───────────────────────────

  test('should show generic error for invalid credentials', async ({ page }) => {
    await page.goto(BACKOFFICE_LOGIN);
    await page.waitForLoadState('networkidle');

    await page.getByLabel('E-mail').fill(ADMIN_EMAIL);
    await page.getByLabel('Senha').fill('wrongpassword123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos');
  });

  // ─── Scenario 5: 5 failed attempts → lockout message ─────────────────────

  test('should show lockout message after 5 consecutive failed attempts', async ({ page }) => {
    await page.goto(BACKOFFICE_LOGIN);
    await page.waitForLoadState('networkidle');

    for (let i = 0; i < 5; i++) {
      await page.getByLabel('E-mail').fill(ADMIN_EMAIL);
      await page.getByLabel('Senha').fill('wrong');
      await page.getByRole('button', { name: 'Entrar' }).click();
      // Small wait between attempts to allow state updates
      await page.waitForTimeout(200);
    }

    // 6th attempt triggers the locked message
    await page.getByLabel('E-mail').fill(ADMIN_EMAIL);
    await page.getByLabel('Senha').fill('wrong');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('alert')).toContainText('bloqueada');
    await expect(page.getByRole('alert')).toContainText('min');
  });

  // ─── Scenario 6: Logout → redirect to login ───────────────────────────────

  test('should redirect to /backoffice/login after logout and deny re-access', async ({ page }) => {
    // Pre-condition: admin must exist — skips if not
    const loginRes = await page.request.post(`${API}/api/backoffice/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    test.skip(loginRes.status() !== 200, 'No admin seeded — skipping logout test');

    await page.goto(BACKOFFICE);
    await page.waitForURL(BACKOFFICE);

    await page.getByRole('button', { name: 'Sair' }).click();

    await page.waitForURL(`${BACKOFFICE_LOGIN}**`);
    await expect(page).toHaveURL(/\/backoffice\/login/);

    // Access to /backoffice should require login again
    await page.goto(BACKOFFICE);
    await page.waitForURL(`${BACKOFFICE_LOGIN}**`);
    await expect(page).toHaveURL(/\/backoffice\/login/);
  });

  // ─── Scenario 7: Session persistence ─────────────────────────────────────

  test('should keep session after page reload when bo_refresh cookie is present', async ({ page }) => {
    const loginRes = await page.request.post(`${API}/api/backoffice/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    test.skip(loginRes.status() !== 200, 'No admin seeded — skipping session persistence test');

    const cookies = loginRes.headers()['set-cookie'];
    if (cookies) {
      for (const cookie of Array.isArray(cookies) ? cookies : [cookies]) {
        const [nameValue, ...attributes] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        if (name?.trim() && value?.trim()) {
          await page.context().addCookies([{
            name: name.trim(),
            value: value.trim(),
            domain: 'localhost',
            path: '/',
          }]);
        }
      }
    }

    await page.goto(BACKOFFICE);
    await expect(page).toHaveURL(BACKOFFICE);
    await expect(page).not.toHaveURL(/\/backoffice\/login/);
  });
});
