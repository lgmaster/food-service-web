import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('bo_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const res = await fetch(`${apiUrl}/backoffice/establishments/${id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
