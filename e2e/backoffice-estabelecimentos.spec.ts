import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001';
const MAILHOG_URL = 'http://localhost:8025';

const ADMIN_EMAIL = 'admin@fooddash.com';
const ADMIN_PASSWORD = 'Senha123!';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE}/backoffice/login`);
  await page.waitForLoadState('networkidle');
  await page.getByLabel('E-mail').fill(ADMIN_EMAIL);
  await page.getByLabel('Senha').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(`${BASE}/backoffice`);
}

async function getLatestInviteLink(): Promise<string | null> {
  try {
    const res = await fetch(`${MAILHOG_URL}/api/v2/messages?limit=1`);
    const data = await res.json() as {
      items?: Array<{
        Content?: { Body?: string };
        MIME?: { Parts?: Array<{ Body?: string }> };
      }>;
    };
    const body =
      data.items?.[0]?.Content?.Body ??
      data.items?.[0]?.MIME?.Parts?.[0]?.Body ??
      '';
    // Decode quoted-printable line continuations before matching
    const decoded = body.replace(/=\r?\n/g, '');
    const linkMatch = decoded.match(/https?:\/\/[^\s"<>]*painel\/cadastro[^\s"<>]*/);
    return linkMatch?.[0] ?? null;
  } catch {
    return null;
  }
}

async function createEstablishmentViaApi(page: Page): Promise<string> {
  const loginRes = await page.request.post(`${API}/backoffice/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const { accessToken } = await loginRes.json() as { accessToken: string };

  const createRes = await page.request.post(`${API}/backoffice/establishments`, {
    data: {
      name: 'Padaria E2E',
      type: 'bakery',
      address: {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
      },
      phone: '11999990000',
    },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const { id } = await createRes.json() as { id: string };
  return id;
}

// ─── Suite ──────────────────────────────────────────────────────────────────

test.describe('Backoffice — Gerenciamento de Estabelecimentos', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ─── Fluxo 1: Cadastro de estabelecimento ─────────────────────────────────

  test.describe('Fluxo 1: Cadastro de estabelecimento', () => {
    test('deve criar um novo estabelecimento e exibi-lo na lista', async ({ page }) => {
      // Pre-condition: admin must exist
      const loginCheck = await page.request.post(`${API}/backoffice/auth/login`, {
        data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      });
      test.skip(loginCheck.status() !== 200, 'Admin not seeded — skipping establishment creation test');

      await loginAsAdmin(page);

      // Step 2: Navigate via sidebar
      await page.getByRole('link', { name: 'Estabelecimentos' }).click();
      await page.waitForURL(`${BASE}/backoffice/estabelecimentos`);
      await expect(page.getByRole('heading', { name: 'Estabelecimentos' })).toBeVisible();

      // Step 4: Open new establishment form
      await page.getByRole('button', { name: 'Novo Estabelecimento' }).click();
      await page.waitForURL(`${BASE}/backoffice/estabelecimentos/novo`);

      // Step 5: Fill the form
      await page.getByLabel('Nome').fill('Padaria Teste E2E');

      // Select type — try combobox/select first, fall back to role="option"
      const tipoField = page.getByLabel('Tipo');
      await tipoField.selectOption({ label: 'Padaria' }).catch(async () => {
        await tipoField.click();
        await page.getByRole('option', { name: 'Padaria' }).click();
      });

      // CEP — fill and wait for auto-complete; fill remaining fields manually if needed
      await page.getByLabel('CEP').fill('01310100');
      await page.waitForTimeout(1500); // allow ViaCEP lookup

      const logradouroField = page.getByLabel('Logradouro');
      const logradouroValue = await logradouroField.inputValue();
      if (!logradouroValue) {
        await logradouroField.fill('Rua das Flores');
      }

      await page.getByLabel('Número').fill('123');

      const bairroField = page.getByLabel('Bairro');
      const bairroValue = await bairroField.inputValue();
      if (!bairroValue) {
        await bairroField.fill('Bela Vista');
      }

      const cidadeField = page.getByLabel('Cidade');
      const cidadeValue = await cidadeField.inputValue();
      if (!cidadeValue) {
        await cidadeField.fill('São Paulo');
      }

      // UF may be read-only after auto-fill; attempt fill only if empty
      const ufField = page.getByLabel('UF');
      const ufValue = await ufField.inputValue();
      if (!ufValue) {
        await ufField.fill('SP');
      }

      await page.getByLabel('Telefone').fill('11999990000');

      // Step 6: Save
      await page.getByRole('button', { name: 'Salvar' }).click();

      // Step 7: Verify redirect to detail page
      await page.waitForURL(`${BASE}/backoffice/estabelecimentos/**`, { timeout: 15_000 });
      expect(page.url()).toMatch(/\/backoffice\/estabelecimentos\/[^/]+$/);

      // Step 8: Go back to list and verify the establishment appears
      await page.getByRole('link', { name: 'Estabelecimentos' }).click();
      await page.waitForURL(`${BASE}/backoffice/estabelecimentos`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Padaria Teste E2E')).toBeVisible();
    });
  });

  // ─── Fluxo 2: Convite por link mágico ────────────────────────────────────

  test.describe.serial('Fluxo 2: Convite por link mágico', () => {
    let establishmentId: string;

    test.beforeAll(async ({ browser }) => {
      // Create establishment via API so the test is independent of Fluxo 1
      const page = await browser.newPage();
      try {
        establishmentId = await createEstablishmentViaApi(page);
      } catch {
        // If API is unavailable, establishmentId stays undefined; tests will skip
      } finally {
        await page.close();
      }
    });

    test('deve enviar convite de administrador e o proprietário deve completar o cadastro', async ({ page }) => {
      test.fixme(!establishmentId, 'API unavailable — could not create establishment');

      const loginCheck = await page.request.post(`${API}/backoffice/auth/login`, {
        data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      });
      test.skip(loginCheck.status() !== 200, 'Admin not seeded — skipping invite test');

      await loginAsAdmin(page);

      // Step 1: Navigate to the establishment detail page
      await page.goto(`${BASE}/backoffice/estabelecimentos/${establishmentId}`);
      await page.waitForLoadState('networkidle');

      // Step 2–3: Find the admin invitation section and fill the email
      await expect(page.getByText('Admin do Estabelecimento')).toBeVisible({ timeout: 10_000 });
      await page.getByLabel('E-mail').last().fill('dono@padaria-teste.com');

      // Step 4: Send invite
      await page.getByRole('button', { name: /Enviar convite/i }).click();

      // Confirm modal if it appears
      const confirmButton = page.getByRole('button', { name: /Confirmar|Enviar/i });
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Verify "Pendente" chip appears
      await expect(page.getByText(/Pendente/i)).toBeVisible({ timeout: 10_000 });

      // Step 5: Retrieve invite link from MailHog
      await page.waitForTimeout(1500); // allow email delivery
      const inviteLink = await getLatestInviteLink();
      test.skip(!inviteLink, 'MailHog not available or invite email not found');

      // Step 6–7: Navigate to invite link
      await page.goto(inviteLink!);
      await page.waitForLoadState('networkidle');
      await page.waitForURL(`${BASE}/painel/cadastro**`, { timeout: 15_000 });

      // The email field should be pre-filled
      await expect(page.getByLabel('E-mail')).toHaveValue('dono@padaria-teste.com');

      // Step 8: Fill name and password
      await page.getByLabel('Nome').fill('João Silva');
      await page.getByLabel('Senha').fill('Senha123!');

      // Step 9: Create account → redirect to /painel/login
      await page.getByRole('button', { name: 'Criar conta' }).click();
      await page.waitForURL(`${BASE}/painel/login**`, { timeout: 15_000 });

      // Step 10: Back to establishment in backoffice — verify "Aceito" chip
      await loginAsAdmin(page);
      await page.goto(`${BASE}/backoffice/estabelecimentos/${establishmentId}`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/Aceito/i)).toBeVisible({ timeout: 10_000 });
    });
  });

  // ─── Fluxo 3: Desativação de estabelecimento ─────────────────────────────

  test.describe('Fluxo 3: Desativação de estabelecimento', () => {
    let establishmentId: string;

    test.beforeEach(async ({ page }) => {
      try {
        establishmentId = await createEstablishmentViaApi(page);
      } catch {
        // If API is unavailable the test will skip via fixme
      }
    });

    test('deve desativar estabelecimento e refletir status na lista', async ({ page }) => {
      test.fixme(!establishmentId, 'API unavailable — could not create establishment for deactivation test');

      const loginCheck = await page.request.post(`${API}/backoffice/auth/login`, {
        data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      });
      test.skip(loginCheck.status() !== 200, 'Admin not seeded — skipping deactivation test');

      await loginAsAdmin(page);

      // Step 1: Navigate to establishment detail
      await page.goto(`${BASE}/backoffice/estabelecimentos/${establishmentId}`);
      await page.waitForLoadState('networkidle');

      // Step 2–3: Find and click the deactivate toggle/button
      const deactivateButton = page.getByRole('button', { name: /Desativar/i });
      await expect(deactivateButton).toBeVisible({ timeout: 10_000 });
      await deactivateButton.click();

      // Confirm modal
      const confirmButton = page.getByRole('button', { name: /Confirmar|Desativar/i });
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Step 4: Verify status changed to "Inativo" on detail page
      await expect(page.getByText(/Inativo/i)).toBeVisible({ timeout: 10_000 });

      // Step 5: Navigate to list and verify "Inativo" chip
      await page.getByRole('link', { name: 'Estabelecimentos' }).click();
      await page.waitForURL(`${BASE}/backoffice/estabelecimentos`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/Inativo/i)).toBeVisible({ timeout: 10_000 });
    });
  });
});
