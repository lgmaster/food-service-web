'use client';

import { useState, type FormEvent } from 'react';

interface InviteSectionProps {
  establishment: {
    id: string;
    invite: {
      email: string | null;
      status: 'none' | 'pending' | 'accepted' | 'expired';
    };
  };
}

const INVITE_STATUS_CONFIG = {
  pending: {
    label: 'Pendente',
    className: 'text-yellow-700 bg-yellow-50',
  },
  accepted: {
    label: 'Aceito',
    className: 'text-green-700 bg-green-50',
  },
  expired: {
    label: 'Expirado',
    className: 'text-gray-500 bg-gray-100',
  },
} as const;

function InviteChip({ status }: { status: 'pending' | 'accepted' | 'expired' }) {
  const config = INVITE_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function InviteSection({ establishment }: InviteSectionProps) {
  const { id, invite } = establishment;

  const [email, setEmail] = useState(invite.email ?? '');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showChangeAdmin, setShowChangeAdmin] = useState(false);
  const showEmailInput = invite.status === 'none' || !invite.email;
  const showResend = invite.status === 'expired';

  async function sendInvite() {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/backoffice/establishments/${id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok || res.status === 204) {
        window.location.reload();
        return;
      }

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      setError(
        typeof data.message === 'string' ? data.message : 'Erro ao enviar convite.',
      );
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function resendInvite() {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/backoffice/establishments/${id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok || res.status === 204) {
        setSuccessMessage('Convite reenviado com sucesso.');
        return;
      }

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      setError(
        typeof data.message === 'string' ? data.message : 'Erro ao reenviar convite.',
      );
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleSendSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setShowModal(true);
  }

  function handleModalConfirm() {
    setShowModal(false);
    void sendInvite();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Admin do Estabelecimento</h2>

      {/* Status: none or no email — show input + send button */}
      {showEmailInput && (
        <form onSubmit={handleSendSubmit} className="space-y-3">
          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              E-mail do administrador
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@estabelecimento.com"
              className="w-full h-[42px] px-4 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/25 focus:border-red-600 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="h-[42px] px-6 bg-red-600 text-white rounded-full font-medium text-sm hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
          >
            {loading ? 'Enviando…' : 'Enviar Convite'}
          </button>
        </form>
      )}

      {/* Status: pending */}
      {invite.status === 'pending' && invite.email && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">{invite.email}</span>
          <InviteChip status="pending" />
        </div>
      )}

      {/* Status: accepted */}
      {invite.status === 'accepted' && invite.email && !showChangeAdmin && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-700">{invite.email}</span>
          <InviteChip status="accepted" />
          <button
            type="button"
            onClick={() => { setShowChangeAdmin(true); setEmail(''); }}
            className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700 transition-colors"
          >
            Trocar admin
          </button>
        </div>
      )}

      {/* Status: accepted + change admin form */}
      {invite.status === 'accepted' && showChangeAdmin && (
        <form onSubmit={handleSendSubmit} className="space-y-3">
          <p className="text-sm text-gray-500">Novo e-mail de administrador:</p>
          <div>
            <input
              id="invite-email-change"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="novo@estabelecimento.com"
              className="w-full h-10.5 px-4 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/25 focus:border-red-600 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="h-10.5 px-6 bg-red-600 text-white rounded-full font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando…' : 'Enviar Convite'}
            </button>
            <button
              type="button"
              onClick={() => { setShowChangeAdmin(false); setEmail(invite.email ?? ''); }}
              className="h-10.5 px-5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Status: expired */}
      {showResend && invite.email && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">{invite.email}</span>
            <InviteChip status="expired" />
          </div>
          <button
            type="button"
            onClick={() => void resendInvite()}
            disabled={loading}
            className="h-[42px] px-6 bg-red-600 text-white rounded-full font-medium text-sm hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
          >
            {loading ? 'Reenviando…' : 'Reenviar Convite'}
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
        >
          {error}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div
          role="status"
          className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3"
        >
          {successMessage}
        </div>
      )}

      {/* Confirmation modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 id="modal-title" className="text-base font-semibold text-gray-900">
              Confirmar envio de convite
            </h3>
            <p className="text-sm text-gray-600">
              Enviar convite de administrador para{' '}
              <span className="font-medium text-gray-900">{email}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-[42px] px-5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleModalConfirm}
                className="h-[42px] px-5 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
