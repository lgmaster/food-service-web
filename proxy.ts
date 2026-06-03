import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export const config = {
  matcher: ['/backoffice/:path*'],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute =
    pathname === '/backoffice/login' || pathname === '/backoffice/cadastro';

  const token = request.cookies.get('bo_token')?.value;

  let isValid = false;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');
      await jwtVerify(token, secret);
      isValid = true;
    } catch {
      isValid = false;
    }
  }

  if (pathname === '/backoffice/login' && isValid) {
    return NextResponse.redirect(new URL('/backoffice', request.url));
  }

  if (!isPublicRoute && !isValid) {
    const loginUrl = new URL('/backoffice/login', request.url);
    loginUrl.searchParams.set('session', 'expired');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
