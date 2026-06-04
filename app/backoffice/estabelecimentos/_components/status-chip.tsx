interface StatusChipProps {
  status: 'active' | 'inactive' | 'suspended';
}

const STATUS_CONFIG = {
  active: {
    label: 'Ativo',
    className: 'text-green-700 bg-green-50',
  },
  inactive: {
    label: 'Inativo',
    className: 'text-gray-500 bg-gray-100',
  },
  suspended: {
    label: 'Suspenso',
    className: 'text-red-700 bg-red-50',
  },
} as const;

export function StatusChip({ status }: StatusChipProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
