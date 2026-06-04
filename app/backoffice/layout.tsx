import { cookies } from 'next/headers';
import { TopNav } from './_components/top-nav';
import { Sidebar } from './_components/sidebar';

function decodeJwtPayload(token: string): { name?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload) as { name?: string };
  } catch {
    return null;
  }
}

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('bo_token')?.value ?? '';
  const payload = decodeJwtPayload(token);
  const adminName = payload?.name ?? 'Administrador';

  if (!payload) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav adminName={adminName} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
