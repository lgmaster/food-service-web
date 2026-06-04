import { EstablishmentForm } from '../_components/establishment-form';

export default function NovoEstabelecimentoPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Novo Estabelecimento</h1>
      <EstablishmentForm mode="create" />
    </div>
  );
}
