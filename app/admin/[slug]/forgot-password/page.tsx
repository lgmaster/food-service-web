import { ForgotPasswordForm } from './_components/forgot-password-form';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ForgotPasswordPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Esqueci minha senha</h1>
            <p className="text-sm text-gray-500 mt-1">
              Informe seu e-mail e enviaremos as instruções para redefinir sua senha.
            </p>
          </div>
          <ForgotPasswordForm slug={slug} />
        </div>
        <div className="text-center mt-4">
          <a href={`/admin/${slug}`} className="text-sm text-red-600 font-medium hover:underline">
            Voltar para o login
          </a>
        </div>
      </div>
    </main>
  );
}
