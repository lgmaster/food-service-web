import { cookies } from 'next/headers';
import { EstablishmentForm } from '../_components/establishment-form';
import { InviteSection } from '../_components/invite-section';

interface Establishment {
  id: string;
  name: string;
  type: string;
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
}

export default async function EstabelecimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('bo_token')?.value ?? '';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const res = await fetch(`${apiUrl}/backoffice/establishments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (res.status === 404) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Estabelecimento não encontrado.</p>
      </div>
    );
  }

  const establishment = (await res.json().catch(() => null)) as Establishment | null;

  if (!establishment) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Estabelecimento não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">{establishment.name}</h1>
        <EstablishmentForm mode="edit" initialData={establishment} />
      </div>
      <InviteSection establishment={establishment} />
    </div>
  );
}
