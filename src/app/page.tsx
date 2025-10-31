export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Bienvenue sur OperaFlow
        </h1>
        <p className="text-lg text-secondary mb-8">
          Application de suivi, planification et pilotage d'activités de terrain
        </p>
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">Structure du projet</h2>
          <p className="text-gray-600 mb-4">
            Le projet est configuré avec Next.js 15, Supabase et TailwindCSS.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Front-end : Next.js 15 avec TypeScript</li>
            <li>Back-end : Supabase (PostgreSQL + Auth + Storage)</li>
            <li>Styling : TailwindCSS avec charte graphique OperaFlow</li>
            <li>Graphiques : Recharts</li>
            <li>Notifications : SendGrid</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

