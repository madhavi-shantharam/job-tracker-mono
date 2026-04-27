import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { path: '/',        label: 'Dashboard' },
  { path: '/add',     label: 'Add Application' },
  { path: '/resumes', label: 'Resumes' },
  { path: '/analyze', label: '✨ AI Analyze' },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-indigo-600">JobTracker</span>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            AI Powered
          </span>
        </div>
        <div className="flex gap-6">
          {navLinks.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`text-sm font-medium transition-colors ${
                pathname === path
                  ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}