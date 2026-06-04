'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const PASSWORD_RULES = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: '1 letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: '1 número', test: (p: string) => /[0-9]/.test(p) },
];

function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

interface AcceptInviteFormProps {
  token: string;
  email: string;
  establishmentName: string;
  slug: string;
}

export function AcceptInviteForm({ token, email, establishmentName, slug }: AcceptInviteFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordValid = isPasswordValid(password);
  const formValid = name.trim().length > 0 && passwordValid;

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (!passwordTouched && value.length > 0) {
      setPasswordTouched(true);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!formValid) return;

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/establishment-invites/accept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, name: name.trim(), password }),
        },
      );

      if (res.status === 201) {
        window.location.href = `/admin/${slug}?registered=1`;
        return;
      }

      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      setError(typeof data.message === 'string' ? data.message : 'Ocorreu um erro. Tente novamente.');
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-primary" style={{ fontFamily: 'Poppins, sans-serif' }}>
              FoodDash
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Criar conta para <span className="font-medium text-gray-700">{establishmentName}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* E-mail (read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                className="w-full h-10.5 px-4 rounded-xl border border-gray-200 text-sm text-gray-500 bg-gray-50 cursor-not-allowed focus:outline-none"
              />
            </div>

            {/* Nome completo */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Seu nome completo"
                className="w-full h-10.5 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/25 focus:border-red-600 transition-colors"
              />
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full h-10.5 px-4 pr-12 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/25 focus:border-red-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Requisitos de senha */}
              {(passwordTouched || password.length > 0) && (
                <ul className="mt-2 space-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password);
                    return (
                      <li key={rule.label} className="flex items-center gap-1.5 text-xs">
                        <span className={ok ? 'text-green-600' : 'text-red-500'}>
                          {ok ? '✓' : '✗'}
                        </span>
                        <span className={ok ? 'text-green-700' : 'text-gray-500'}>
                          {rule.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Erro geral */}
            {error && (
              <div
                role="alert"
                className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
              >
                {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading || !formValid}
              className="w-full h-10.5 bg-primary text-white rounded-full font-medium text-sm hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
            >
              {loading ? 'Criando conta…' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
