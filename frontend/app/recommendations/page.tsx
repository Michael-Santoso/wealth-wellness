import Link from "next/link";

export default function RecommendationsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Recommendations Routes</h1>
        <p className="mt-2 text-slate-600">Returns top-priority actions for the given user.</p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
{`GET /api/recommendations
Headers: x-user-id: <user-id>`}
        </pre>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-blue-600">Back to hub</Link>
      </div>
    </main>
  );
}