import { AcceptInviteForm } from './_components/accept-invite-form';

interface InviteData {
  email: string;
  establishmentName: string;
  slug: string;
}

async function validateInviteToken(token: string): Promise<InviteData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(
      `${apiUrl}/establishment-invites/validate?token=${encodeURIComponent(token)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    return (await res.json()) as InviteData;
  } catch {
    return null;
  }
}

function InvalidInvitePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Link inválido
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Este link de convite expirou ou é inválido. Solicite um novo convite ao administrador da plataforma.
          </p>
        </div>
      </div>
    </main>
  );
}

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidInvitePage />;
  }

  const data = await validateInviteToken(token);

  if (!data) {
    return <InvalidInvitePage />;
  }

  return (
    <main>
      <AcceptInviteForm
        token={token}
        email={data.email}
        establishmentName={data.establishmentName}
        slug={data.slug}
      />
    </main>
  );
}
