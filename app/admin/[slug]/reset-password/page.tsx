import { ResetPasswordForm } from './_components/reset-password-form';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Nova senha</h1>
            <p className="text-sm text-gray-500 mt-1">
              Escolha uma nova senha para a sua conta.
            </p>
          </div>
          <ResetPasswordForm slug={slug} token={token ?? null} />
        </div>
      </div>
    </main>
  );
}
