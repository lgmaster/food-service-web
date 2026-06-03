import { notFound } from 'next/navigation';
import Image from 'next/image';
import { LoginForm } from './_components/login-form';

interface EstablishmentPublicData {
  name: string;
  logoUrl: string | null;
  status: string;
}

async function getEstablishment(slug: string): Promise<EstablishmentPublicData | null | 'inactive'> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/establishments/${slug}/public`, {
      cache: 'no-store',
    });

    if (res.status === 404) return null;
    if (res.status === 403) return 'inactive';
    if (!res.ok) return null;

    return res.json() as Promise<EstablishmentPublicData>;
  } catch {
    return null;
  }
}

export default async function AdminLoginPage(props: PageProps<'/admin/[slug]'>) {
  const { slug } = await props.params;
  const establishment = await getEstablishment(slug);

  if (establishment === null) {
    notFound();
  }

  if (establishment === 'inactive') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Estabelecimento indisponível</h1>
          <p className="text-gray-600 text-sm">
            Este estabelecimento está temporariamente inativo. Entre em contato com o suporte FoodDash.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col items-center mb-8">
            {establishment.logoUrl ? (
              <Image
                src={establishment.logoUrl}
                alt={`Logo ${establishment.name}`}
                width={80}
                height={80}
                className="rounded-full object-cover mb-4"
              />
            ) : (
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-2xl font-bold">
                  {establishment.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h1 className="text-xl font-semibold text-gray-900 text-center">
              {establishment.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Painel do Estabelecimento</p>
          </div>

          <LoginForm slug={slug} />
        </div>


      </div>
    </main>
  );
}
