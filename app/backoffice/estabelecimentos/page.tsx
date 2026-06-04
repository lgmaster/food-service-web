import { EstablishmentsTable } from './_components/establishments-table';

export default function EstabelecimentosPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Estabelecimentos</h1>
        <a
          href="/backoffice/estabelecimentos/novo"
          className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 transition-colors"
        >
          Novo Estabelecimento
        </a>
      </div>
      <EstablishmentsTable />
    </div>
  );
}
