import Link from "next/link";

type ModuleCardProps = {
  title: string;
  description: string;
  href: string;
};

export function ModuleCard({ title, description, href }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <span className="mt-4 inline-block text-sm font-medium text-blue-600">Open module</span>
    </Link>
  );
}