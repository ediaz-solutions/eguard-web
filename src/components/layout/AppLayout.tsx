import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Monitor, Users, Clock, ScrollText, Key, LogOut } from 'lucide-react';
import { api } from '../../services/api';

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard',       end: true },
  { to: '/devices',  icon: Monitor,         label: 'Dispositivos',    end: false },
  { to: '/users',    icon: Users,           label: 'Usuários Windows', end: false },
  { to: '/policies', icon: Clock,           label: 'Perfis de Horário', end: false },
  { to: '/logs',     icon: ScrollText,      label: 'Logs',            end: false },
  { to: '/tokens',   icon: Key,             label: 'Tokens de Acesso', end: false },
];

export default function AppLayout() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await api.signOut();
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-surface-900 border-r border-surface-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-surface-800">
          <img src="/logo.png" alt="eDIAZ Solutions" className="h-9 object-contain" />
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold tracking-wider text-surface-400 uppercase">eGuard</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 mt-1">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600/10 text-brand-400 border border-brand-600/15'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/70'
                }`
              }
            >
              <n.icon className="w-[18px] h-[18px]" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-surface-800">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                       text-surface-500 hover:text-red-400 hover:bg-red-500/5 w-full transition-all"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-surface-950">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
