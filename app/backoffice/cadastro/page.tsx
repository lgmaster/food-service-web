import { redirect } from 'next/navigation';
import { RegisterForm } from './_components/register-form';

async function checkRegisterAvailable(): Promise<boolean> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/backoffice/auth/register-available`, {
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { available: boolean };
    return data.available;
  } catch {
    return false;
  }
}

export default async function CadastroPage() {
  const available = await checkRegisterAvailable();

  if (!available) {
    redirect('/backoffice/login');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-gray-900">Criar conta</h1>
            <p className="text-sm text-gray-500 mt-1">Configure o acesso ao painel administrativo.</p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
