import { LoginForm } from './_components/login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const registered = params.registered === '1';
  const sessionExpired = params.session === 'expired';

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-gray-900">Painel administrativo</h1>
            <p className="text-sm text-gray-500 mt-1">Acesse sua conta para continuar.</p>
          </div>
          <LoginForm registered={registered} sessionExpired={sessionExpired} />
        </div>
      </div>
    </main>
  );
}
