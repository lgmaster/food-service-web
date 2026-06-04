'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusChip } from './status-chip';

interface EstablishmentAdminDto {
  id: string;
  slug: string;
  name: string;
  type: 'bakery' | 'restaurant' | 'market';
  status: 'active' | 'inactive' | 'suspended';
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  logoUrl: string | null;
  invite: {
    email: string | null;
    status: 'none' | 'pending' | 'accepted' | 'expired';
  };
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  items: EstablishmentAdminDto[];
  total: number;
  page: number;
  limit: number;
}

const TYPE_LABELS: Record<EstablishmentAdminDto['type'], string> = {
  bakery: 'Padaria',
  restaurant: 'Restaurante',
  market: 'Mercado',
};

const LIMIT = 20;

export function EstablishmentsTable() {
  const router = useRouter();
  const [establishments, setEstablishments] = useState<EstablishmentAdminDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / LIMIT);

  async function fetchEstablishments(currentPage: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/establishments?page=${currentPage}&limit=${LIMIT}`,
      );
      if (!res.ok) {
        throw new Error(`Erro ao carregar estabelecimentos (${res.status})`);
      }
      const json = (await res.json()) as ApiResponse;
      setEstablishments(json.items ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchEstablishments(page);
  }, [page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"
            aria-label="Carregando"
          />
          <span className="text-sm text-gray-500">Carregando estabelecimentos…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => void fetchEstablishments(page)}
          className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (establishments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-gray-500">Nenhum estabelecimento cadastrado ainda.</p>
        <a
          href="/backoffice/estabelecimentos/novo"
          className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 transition-colors"
        >
          Novo Estabelecimento
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cidade</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Data de cadastro</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {establishments.map((est) => (
              <tr
                key={est.id}
                className="h-16 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/backoffice/estabelecimentos/${est.id}`)}
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{est.name}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {TYPE_LABELS[est.type]}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {est.address.city}, {est.address.state}
                </td>
                <td className="px-4 py-3">
                  <StatusChip status={est.status} />
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(est.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/backoffice/estabelecimentos/${est.id}`);
                    }}
                    className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                  >
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > LIMIT && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
