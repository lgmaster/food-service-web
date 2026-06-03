import { cookies } from 'next/headers';
import { LogoutButton } from './_components/logout-button';

interface JwtPayload {
  sub: string;
  name: string;
  role: string;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
}

export default async function BackofficePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('bo_token')?.value ?? '';
  const payload = decodeJwtPayload(token);
  const adminName = payload?.name ?? 'Administrador';

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Olá, {adminName}</h1>
            <p className="text-sm text-gray-500 mt-1">Bem-vindo ao painel administrativo.</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
