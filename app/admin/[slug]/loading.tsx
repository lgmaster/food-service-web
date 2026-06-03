export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gray-200 rounded-full mb-4" />
            <div className="h-6 bg-gray-200 rounded w-40 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-28" />
          </div>
          <div className="space-y-4">
            <div className="h-[42px] bg-gray-200 rounded-xl" />
            <div className="h-[42px] bg-gray-200 rounded-xl" />
            <div className="h-[42px] bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
