import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  //Calendar,
  BarChart2,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  Mail,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  School,
  BookOpen,
  PieChart,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
};

const MENU_UTAMA: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, match: (path: string) => path === '/' },
];

const MENU_ORGANISASI = [
  { to: '/school-profile', label: 'Profil Sekolah', icon: School, match: (path: string) => path.startsWith('/school-profile') },
  { to: '/teachers', label: 'Warga Sekolah', icon: Users, match: (path: string) => path.startsWith('/teachers') },
  { to: '/committees', label: 'Jawatankuasa', icon: CheckSquare, match: (path: string) => path.startsWith('/committee') },
  //{ to: '/roster', label: 'Jadual Tugas', icon: Calendar, match: (path: string) => path.startsWith('/roster') },
];

const MENU_ANALISIS = [
  { to: '/workload', label: 'Beban Tugas', icon: BarChart2, match: (path: string) => path.startsWith('/workload') },
  { to: '/analytics', label: 'Analisis & Laporan', icon: PieChart, match: (path: string) => path.startsWith('/analytics') },
];

const MENU_PENERBITAN = [
  {
    to: '/reports',
    label: 'Janaan Buku',
    icon: BookOpen,
    match: (path: string) => path.startsWith('/reports') || path.startsWith('/book-builder'),
  },
];

const SEARCH_SCOPES = [
  { key: 'warga', label: 'Warga Sekolah', to: '/teachers' },
  { key: 'jawatankuasa', label: 'Jawatankuasa', to: '/committees' },
  { key: 'jadual', label: 'Jadual', to: '/roster' },
];

export default function LarasLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState(SEARCH_SCOPES[0].key);

  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function loadUserData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email || '');
        const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (userProfile) setProfile(userProfile);
      }
    }
    loadUserData();
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const target = SEARCH_SCOPES.find((s) => s.key === scope) || SEARCH_SCOPES[0];
    const q = query.trim();
    navigate(q ? `${target.to}?q=${encodeURIComponent(q)}` : target.to);
  };

  const displayName = profile?.full_name || 'Admin';
  const avatarName = encodeURIComponent(displayName);
  const compact = isCollapsed;
  const isBookBuilder = location.pathname.startsWith('/book-builder');

  const navItem = (active: boolean) =>
    `group relative flex items-center gap-3 rounded-lg text-[13px] font-semibold transition-all ${
      compact ? 'px-4 py-3 lg:justify-center lg:px-0' : 'px-4 py-3'
    } ${active ? 'bg-slate-100 text-ink' : 'text-slate-500 hover:text-ink hover:bg-slate-50'}`;

  const labelCls = compact ? 'lg:hidden' : '';

  const renderNavSection = (title: string | null, items: typeof MENU_UTAMA) => (
    <div className="mb-5">
      {title && (
        <p className={`px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 ${labelCls}`}>
          {title}
        </p>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(location.pathname);
          return (
            <Link key={item.to} to={item.to} className={navItem(active)} title={item.label}>
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-md bg-ink" />}
              <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-ink' : ''} />
              <span className={labelCls}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-canvas text-ink font-sans overflow-hidden">
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 h-full bg-white border-r border-slate-200 text-ink flex flex-col transform transition-all duration-300 lg:static lg:translate-x-0 lg:shrink-0 ${compact ? 'w-20' : 'w-56'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          type="button"
          onClick={() => setCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3.5 top-7 z-10 w-7 h-7 rounded-lg bg-ink text-white items-center justify-center shadow-sm hover:opacity-90 transition-all border-4 border-white"
          aria-label={compact ? 'Kembangkan menu' : 'Kecilkan menu'}
        >
          {compact ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>

        <div className={`flex items-center h-20 shrink-0 px-6 ${compact ? 'lg:justify-center lg:px-0' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-ink rounded-lg text-white shadow-sm shrink-0">
              <Sparkles size={16} />
            </div>
            <span className={`font-extrabold text-ink text-[1.25rem] tracking-tight ${labelCls}`}>Laras</span>
          </div>
          <button className="ml-auto p-1.5 text-slate-400 hover:text-ink hover:bg-slate-100 rounded-lg transition-colors lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-3 flex flex-col no-scrollbar">
          {renderNavSection(null, MENU_UTAMA)}
          {renderNavSection('Organisasi', MENU_ORGANISASI)}
          {renderNavSection('Pemberatan & Laporan', MENU_ANALISIS)}
          {renderNavSection('Penerbitan', MENU_PENERBITAN)}

          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="space-y-1">
              <Link to="/settings" className={navItem(location.pathname.startsWith('/settings'))} title="Tetapan">
                <Settings size={18} /> <span className={labelCls}>Tetapan</span>
              </Link>
              <Link to="/help" className={navItem(false)} title="Bantuan">
                <HelpCircle size={18} /> <span className={labelCls}>Bantuan</span>
              </Link>
              <button onClick={handleLogout} className={`${navItem(false)} w-full text-left hover:text-rose hover:bg-rose/5`} title="Log Keluar">
                <LogOut size={18} /> <span className={labelCls}>Log Keluar</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {isBookBuilder ? (
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-canvas">
          <Outlet />
        </main>
      ) : (
        <div className="flex flex-col flex-1 min-w-0 h-full relative p-4 lg:p-6 lg:pl-8">
          <header className="flex items-center gap-4 h-16 shrink-0 mb-4">
            <button
              className="lg:hidden w-11 h-11 shrink-0 flex items-center justify-center rounded-lg bg-white text-ink shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <Menu size={20} />
            </button>

            <form
              onSubmit={handleSearch}
              className="flex items-center flex-1 max-w-3xl min-w-0 h-12 pl-1.5 pr-4 gap-3 bg-white rounded-xl border border-slate-200 shadow-sm focus-within:border-ink/30 focus-within:ring-4 focus-within:ring-ink/5 transition-all"
            >
              <button type="submit" className="w-9 h-9 shrink-0 rounded-lg bg-ink text-white flex items-center justify-center hover:opacity-90 transition-all shadow-[0_4px_12px_rgba(16,24,40,0.2)]" aria-label="Cari">
                <Search size={16} />
              </button>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama staf atau jawatankuasa..."
                className="flex-1 min-w-0 bg-transparent outline-none text-[14px] font-medium text-ink placeholder:text-slate-400"
              />
              <div className="hidden md:flex items-center gap-1 shrink-0 border-l border-slate-100 pl-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-2">Dalam</span>
                {SEARCH_SCOPES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setScope(s.key)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${
                      scope === s.key ? 'bg-ink text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </form>

            <div className="flex items-center gap-3 ml-auto shrink-0">
              <button type="button" className="hidden sm:flex w-11 h-11 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-ink hover:border-ink/50 transition-colors shadow-sm" aria-label="Mesej">
                <Mail size={18} />
              </button>
              <button type="button" className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-ink hover:border-ink/50 transition-colors shadow-sm" aria-label="Notifikasi">
                <Bell size={18} />
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-coral ring-2 ring-white" />
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 pl-1.5 pr-2 sm:pr-5 h-12 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-ink/50 transition-colors"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${avatarName}&background=101828&color=fff`}
                    alt={displayName}
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                  <span className="hidden sm:flex flex-col text-left">
                    <span className="text-[13px] font-extrabold text-ink leading-none">{displayName}</span>
                    <span className="text-[11px] font-medium text-slate-500 mt-1 leading-none">{userEmail}</span>
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-14 w-52 bg-white border border-black/4 shadow-[0_8px_30px_rgba(16,24,40,0.08)] p-2 rounded-xl z-30">
                    <Link to="/settings" className="block px-4 py-2.5 text-[13px] font-bold text-slate-700 rounded-lg hover:bg-slate-50 transition-colors" onClick={() => setIsDropdownOpen(false)}>
                      Tetapan akaun
                    </Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-coral rounded-lg hover:bg-coral/10 transition-colors">
                      Log keluar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-8">
            <Outlet />
          </main>
        </div>
      )}
    </div>
  );
}