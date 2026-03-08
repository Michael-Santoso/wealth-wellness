import { API_BASE_URL } from "../lib/api";
import { ModuleCard } from "../components/module-card";

const modules = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Preview the wealth wellness dashboard with mock KPI and insights cards.",
  },
  {
    title: "Auth",
    href: "/auth",
    description: "Register or log in to get an MVP session token and user id.",
  },
  {
    title: "Portfolio",
    href: "/portfolio",
    description: "Create/update a user's portfolio profile and retrieve latest holdings summary.",
  },
  {
    title: "Analytics",
    href: "/analytics",
    description: "Generate a quick wellness score and a snapshot from current portfolio data.",
  },
  {
    title: "Recommendations",
    href: "/recommendations",
    description: "Fetch actionable wealth tips generated from the user profile.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold tracking-tight">Wealth Wellness Hub</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Hackathon MVP shell using Next.js + Tailwind for the UI and Express + Prisma + PostgreSQL for the API.
        </p>
        <p className="mt-1 text-sm text-slate-500">API base URL: {API_BASE_URL}</p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {modules.map((module) => (
            <ModuleCard key={module.href} {...module} />
          ))}
        </section>
      </div>
    </main>
  );
}
