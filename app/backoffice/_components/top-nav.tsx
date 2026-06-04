'use client';

import Link from 'next/link';
import { LogoutButton } from './logout-button';

interface TopNavProps {
  adminName: string;
}

export function TopNav({ adminName }: TopNavProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 shadow-sm px-6 flex items-center justify-between shrink-0">
      <Link
        href="/backoffice"
        className="text-xl font-bold font-heading text-[#DC2626] hover:opacity-90 transition-opacity"
      >
        FoodDash
      </Link>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700 font-sans">{adminName}</span>
        <div className="w-28">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
