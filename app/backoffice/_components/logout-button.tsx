'use client';

import { useRouter } from 'next/navigation';

function getCookieValue(name: string): string {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? match.split('=').slice(1).join('=') : '';
}

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const boToken = getCookieValue('bo_token');

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/backoffice/auth/logout`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${boToken}`,
        },
      },
    ).catch(() => {});

    router.push('/backoffice/login');
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full h-10.5 bg-red-600 text-white rounded-full font-medium text-sm hover:bg-red-700 active:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
    >
      Sair
    </button>
  );
}
