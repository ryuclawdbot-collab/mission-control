import dynamic from 'next/dynamic';

const WorkspaceDashboard = dynamic(
  () => import('../components/WorkspaceDashboard').then((mod) => mod.WorkspaceDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-mc-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🦞</div>
          <p className="text-mc-text-secondary">Loading workspaces...</p>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  return <WorkspaceDashboard />;
}
