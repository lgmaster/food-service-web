'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  registered?: boolean;
  sessionExpired?: boolean;
}

export function LoginForm({ registered, sessionExpired }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/backoffice/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        },
      );

      if (res.ok) {
        router.push('/backoffice');
        return;
      }

      const data = await res.json().catch(() => ({})) as Record<string, unknown>;

      if (res.status === 423) {
        const lockedUntil = data.lockedUntil ? new Date(data.lockedUntil as string) : null;
        const minutes = lockedUntil
          ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000)
          : 15;
        setError(`Conta temporariamente bloqueada. Tente novamente em ${minutes} min.`);
      } else {
        setError('E-mail ou senha incorretos');
      }
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {registered && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          Conta criada com sucesso. Faça login para continuar.
        </div>
      )}

      {sessionExpired && !registered && (
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
          Sessão expirada. Faça login novamente.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="seu@email.com"
            className="w-full h-10.5 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/25 focus:border-red-600 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full h-10.5 px-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/25 focus:border-red-600 transition-colors"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full h-10.5 bg-red-600 text-white rounded-full font-medium text-sm hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
