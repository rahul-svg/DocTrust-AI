import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/documents', label: 'Documents' },
  { to: '/verifications', label: 'History' },
  { to: '/upload', label: 'Upload' },
];

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white border-b">
      <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-lg font-bold text-gray-800">DocTrust AI</span>
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
