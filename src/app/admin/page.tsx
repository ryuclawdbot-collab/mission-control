import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('../../components/AdminPanel'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-mc-bg text-mc-text-secondary">
      Loading admin panel...
    </div>
  ),
});

export default function AdminPage() {
  return <AdminPanel />;
}
