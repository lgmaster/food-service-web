import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('bo_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const search = request.nextUrl.searchParams.toString();
  const url = `${apiUrl}/backoffice/establishments${search ? `?${search}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('bo_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const res = await fetch(`${apiUrl}/backoffice/establishments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
