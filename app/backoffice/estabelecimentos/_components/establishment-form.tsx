'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  mode: 'create' | 'edit';
  initialData?: {
    id?: string;
    name?: string;
    type?: string;
    address?: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
    phone?: string;
    logoUrl?: string | null;
  };
}

interface FieldErrors {
  name?: string;
  type?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  phone?: string;
  general?: string;
}

function formatZipCode(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
}

const INPUT_CLASS =
  'w-full h-[42px] px-4 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/25 focus:border-red-600 transition-colors';

const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1.5';
const ERROR_CLASS = 'text-xs text-red-600 mt-1';

export function EstablishmentForm({ mode, initialData }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState(initialData?.type ?? '');
  const [zipCode, setZipCode] = useState(
    initialData?.address?.zipCode
      ? formatZipCode(initialData.address.zipCode)
      : '',
  );
  const [street, setStreet] = useState(initialData?.address?.street ?? '');
  const [number, setNumber] = useState(initialData?.address?.number ?? '');
  const [neighborhood, setNeighborhood] = useState(initialData?.address?.neighborhood ?? '');
  const [city, setCity] = useState(initialData?.address?.city ?? '');
  const [state, setState] = useState(initialData?.address?.state ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl ?? '');

  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const rawZip = zipCode.replace(/\D/g, '');

  useEffect(() => {
    if (rawZip.length !== 8) return;

    // Cancel any previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), 3000);

    setCepLoading(true);
    setCepError(null);

    fetch(`https://viacep.com.br/ws/${rawZip}/json/`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: Record<string, unknown>) => {
        clearTimeout(timeoutId);
        if (data.erro) {
          setCepError('CEP não encontrado. Preencha o endereço manualmente.');
          return;
        }
        setStreet((data.logradouro as string) ?? '');
        setNeighborhood((data.bairro as string) ?? '');
        setCity((data.localidade as string) ?? '');
        setState((data.uf as string) ?? '');
      })
      .catch((err: unknown) => {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') return;
        setCepError('Não foi possível buscar o CEP. Preencha o endereço manualmente.');
      })
      .finally(() => {
        setCepLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [rawZip]);

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!name.trim() || name.trim().length < 2) errs.name = 'Nome deve ter pelo menos 2 caracteres.';
    if (!type) errs.type = 'Selecione um tipo.';
    if (rawZip.length !== 8) errs.zipCode = 'CEP deve ter 8 dígitos.';
    if (!street.trim()) errs.street = 'Logradouro é obrigatório.';
    if (!number.trim()) errs.number = 'Número é obrigatório.';
    if (!neighborhood.trim()) errs.neighborhood = 'Bairro é obrigatório.';
    if (!city.trim()) errs.city = 'Cidade é obrigatória.';
    if (!state.trim()) errs.state = 'UF é obrigatória.';
    if (!phone.trim()) errs.phone = 'Telefone é obrigatório.';
    return errs;
  }

  const isFormValid =
    name.trim().length >= 2 &&
    !!type &&
    rawZip.length === 8 &&
    !!street.trim() &&
    !!number.trim() &&
    !!neighborhood.trim() &&
    !!city.trim() &&
    !!state.trim() &&
    !!phone.trim();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccessMessage(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const payload = {
      name: name.trim(),
      type,
      address: {
        street: street.trim(),
        number: number.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: rawZip,
      },
      phone: phone.trim(),
      logoUrl: logoUrl.trim() || null,
    };

    try {
      if (mode === 'create') {
        const res = await fetch('/api/backoffice/establishments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const result = (await res.json()) as { id: string };
          router.push(`/backoffice/estabelecimentos/${result.id}`);
          return;
        }

        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        setErrors({
          general:
            typeof data.message === 'string' ? data.message : 'Erro ao criar estabelecimento.',
        });
      } else {
        const res = await fetch(`/api/backoffice/establishments/${initialData?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setSuccessMessage('Atualizado com sucesso.');
          return;
        }

        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        setErrors({
          general:
            typeof data.message === 'string' ? data.message : 'Erro ao atualizar estabelecimento.',
        });
      }
    } catch {
      setErrors({ general: 'Erro de conexão. Verifique sua internet e tente novamente.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Nome */}
      <div>
        <label htmlFor="name" className={LABEL_CLASS}>
          Nome <span className="text-red-600">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do estabelecimento"
          className={INPUT_CLASS}
        />
        {errors.name && <p className={ERROR_CLASS}>{errors.name}</p>}
      </div>

      {/* Tipo */}
      <div>
        <label htmlFor="type" className={LABEL_CLASS}>
          Tipo <span className="text-red-600">*</span>
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={`${INPUT_CLASS} bg-white`}
        >
          <option value="">Selecione um tipo</option>
          <option value="restaurant">Restaurante</option>
          <option value="bakery">Padaria</option>
          <option value="market">Mercado</option>
        </select>
        {errors.type && <p className={ERROR_CLASS}>{errors.type}</p>}
      </div>

      {/* CEP */}
      <div>
        <label htmlFor="zipCode" className={LABEL_CLASS}>
          CEP <span className="text-red-600">*</span>
        </label>
        <div className="relative">
          <input
            id="zipCode"
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(formatZipCode(e.target.value))}
            placeholder="00000-000"
            maxLength={9}
            className={INPUT_CLASS}
          />
          {cepLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              Buscando…
            </span>
          )}
        </div>
        {errors.zipCode && <p className={ERROR_CLASS}>{errors.zipCode}</p>}
        {cepError && <p className={ERROR_CLASS}>{cepError}</p>}
      </div>

      {/* Logradouro + Número */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label htmlFor="street" className={LABEL_CLASS}>
            Logradouro <span className="text-red-600">*</span>
          </label>
          <input
            id="street"
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Rua / Avenida"
            className={INPUT_CLASS}
          />
          {errors.street && <p className={ERROR_CLASS}>{errors.street}</p>}
        </div>
        <div>
          <label htmlFor="number" className={LABEL_CLASS}>
            Número <span className="text-red-600">*</span>
          </label>
          <input
            id="number"
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="123"
            className={INPUT_CLASS}
          />
          {errors.number && <p className={ERROR_CLASS}>{errors.number}</p>}
        </div>
      </div>

      {/* Bairro */}
      <div>
        <label htmlFor="neighborhood" className={LABEL_CLASS}>
          Bairro <span className="text-red-600">*</span>
        </label>
        <input
          id="neighborhood"
          type="text"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          placeholder="Bairro"
          className={INPUT_CLASS}
        />
        {errors.neighborhood && <p className={ERROR_CLASS}>{errors.neighborhood}</p>}
      </div>

      {/* Cidade + UF */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label htmlFor="city" className={LABEL_CLASS}>
            Cidade <span className="text-red-600">*</span>
          </label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cidade"
            className={INPUT_CLASS}
          />
          {errors.city && <p className={ERROR_CLASS}>{errors.city}</p>}
        </div>
        <div>
          <label htmlFor="state" className={LABEL_CLASS}>
            UF <span className="text-red-600">*</span>
          </label>
          <input
            id="state"
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
            placeholder="SP"
            maxLength={2}
            className={INPUT_CLASS}
          />
          {errors.state && <p className={ERROR_CLASS}>{errors.state}</p>}
        </div>
      </div>

      {/* Telefone */}
      <div>
        <label htmlFor="phone" className={LABEL_CLASS}>
          Telefone <span className="text-red-600">*</span>
        </label>
        <input
          id="phone"
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 99999-9999"
          className={INPUT_CLASS}
        />
        {errors.phone && <p className={ERROR_CLASS}>{errors.phone}</p>}
      </div>

      {/* Logo URL */}
      <div>
        <label htmlFor="logoUrl" className={LABEL_CLASS}>
          URL do Logo
        </label>
        <input
          id="logoUrl"
          type="text"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
          className={INPUT_CLASS}
        />
      </div>

      {/* Mensagens globais */}
      {errors.general && (
        <div
          role="alert"
          className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
        >
          {errors.general}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3"
        >
          {successMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !isFormValid}
        className="w-full h-[42px] bg-red-600 text-white rounded-full font-medium text-sm hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
      >
        {loading ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  );
}
