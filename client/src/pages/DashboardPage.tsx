import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">DocTrust AI</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <button
              onClick={logout}
              className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
          <p className="text-lg">Dashboard coming in Phase 7.</p>
          <p className="text-sm mt-1">Document upload and verification will appear here.</p>
        </div>
      </div>
    </div>
  );
}
