'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: '/backoffice/estabelecimentos',
    label: 'Estabelecimentos',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 bg-white border-r border-gray-200 h-full flex-col pt-4 shrink-0">
      <nav>
        <ul className="list-none m-0 p-0">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#FEF2F2] border-l-[3px] border-[#DC2626] text-[#DC2626] pl-[13px]'
                      : 'text-gray-600 hover:bg-gray-50 border-l-[3px] border-transparent',
                  ].join(' ')}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
