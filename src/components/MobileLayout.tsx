import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, MessageSquare, User, Building2, LogOut, Scissors, Sparkles, MapPin } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { LoginScreen } from './LoginScreen';
import { getSalonSlug } from '../utils/slug';

export const MobileLayout = () => {
  const { currentUser, authLoading, salons, selectedSalonId, setSelectedSalonId, logoutUser } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!salons || salons.length === 0) return;
    
    const pathParts = location.pathname.split('/').filter(Boolean);
    const SYSTEM_PATHS = ['vogue-admin', 'admin-geral', 'appointments', 'profile', 'agenda', 'book'];
    
    if (pathParts.length === 1 && !SYSTEM_PATHS.includes(pathParts[0].toLowerCase())) {
      const slugCandidate = pathParts[0].toLowerCase().trim();
      const matchedSalon = salons.find(s => getSalonSlug(s.name) === slugCandidate);
      if (matchedSalon) {
        if (selectedSalonId !== matchedSalon.id) {
          console.log(`[MobileLayout] Router path matched brand slug: "${slugCandidate}" -> selecting Salon ID: "${matchedSalon.id}"`);
          setSelectedSalonId(matchedSalon.id);
        }
      } else {
        if (selectedSalonId !== null) {
          console.log(`[MobileLayout] Invalid slug "${slugCandidate}" -> clearing selected salon fallback`);
          setSelectedSalonId(null);
        }
      }
    } else if (pathParts.length === 0) {
      if (selectedSalonId !== null) {
        console.log("[MobileLayout] Back to root '/' -> clearing selectedSalonId to show directory hub");
        setSelectedSalonId(null);
      }
    }
  }, [location.pathname, salons, selectedSalonId, setSelectedSalonId]);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const isSalonSlug = pathParts.length === 1 && !['vogue-admin', 'admin-geral', 'appointments', 'profile', 'agenda', 'book'].includes(pathParts[0]);

  const isPublicRoute = 
    location.pathname === '/' || 
    isSalonSlug ||
    location.pathname === '/vogue-admin' || 
    location.pathname.startsWith('/agenda');
  const shouldShowLogin = !currentUser && !isPublicRoute;

  const activeSalon = salons?.find(s => s.id === selectedSalonId);

  const navItems = [
    { icon: Home, path: '/', label: 'Início', desc: 'Página inicial e serviços' },
    { icon: Calendar, path: '/appointments', label: 'Avaliações', desc: 'Meus agendamentos' },
    ...((currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') ? [{ icon: MessageSquare, path: '/vogue-admin', label: 'Admin', desc: 'Gerenciar Unidade' }] : []),
    ...(currentUser?.role === 'SUPER_ADMIN' ? [{ icon: Building2, path: '/admin-geral', label: 'Super Admin', desc: 'Rede de Salões' }] : []),
    { icon: User, path: '/profile', label: 'Minha Conta', desc: 'Perfil do usuário' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 md:bg-slate-50 flex flex-col md:flex-row relative font-sans text-slate-800">
      {/* Background blobs for premium decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-100/70 rounded-full mix-blend-multiply filter blur-3xl opacity-40 md:opacity-60 -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/70 rounded-full mix-blend-multiply filter blur-3xl opacity-40 md:opacity-60 -z-10 pointer-events-none"></div>

      {/* DESKTOP SIDEBAR - Hidden on mobile, shown on md+ */}
      <aside className="hidden md:flex md:w-80 bg-white border-r border-slate-150 flex-col shrink-0 sticky top-0 h-screen shadow-xs z-30">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 bg-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Scissors size={20} className="animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent">VOGUE</span>
              <span className="block text-[8px] font-extrabold tracking-widest text-slate-400 uppercase leading-none">CRAFT DESIGN</span>
            </div>
          </div>
          <div className="inline-flex items-center space-x-1 bg-pink-50 text-pink-600 px-2.5 py-1 rounded-full text-[8px] font-extrabold uppercase tracking-widest leading-none">
            <Sparkles size={8} />
            <span>Premium</span>
          </div>
        </div>

        {/* Selected Salon Unit Widget */}
        {activeSalon ? (
          <div className="mx-4 my-5 p-4 bg-gradient-to-br from-pink-50/60 to-indigo-50/60 border border-pink-100/40 rounded-3xl flex flex-col justify-between shadow-xs">
            <div className="min-w-0">
              <div className="flex items-center gap-1.55">
                <MapPin size={12} className="text-pink-500 shrink-0" />
                <span className="text-[9px] uppercase font-black text-pink-600 tracking-wider">Unidade Ativa</span>
              </div>
              <strong className="block text-slate-800 truncate text-[14px] font-black leading-snug mt-1.5">{activeSalon.name}</strong>
              <span className="block text-[10px] text-slate-505 truncate font-semibold mt-1" title={activeSalon.address}>{activeSalon.address}</span>
            </div>
            <button 
              type="button"
              onClick={() => {
                setSelectedSalonId(null);
                navigate('/');
              }}
              className="mt-4 text-[9px] font-black text-pink-600 bg-white hover:bg-pink-100/50 py-2.5 px-4 rounded-2xl border border-pink-100 transition-all cursor-pointer text-center uppercase tracking-wider shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            >
              Trocar de Unidade
            </button>
          </div>
        ) : (
          <div className="mx-4 my-5 p-4 bg-slate-50/80 border border-dashed border-slate-200/80 rounded-3xl text-center">
            <Building2 size={24} className="mx-auto text-slate-300 mb-1" />
            <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Multi-Unidades</span>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed px-2 font-medium">Nenhuma filial selecionada. Navegue pela nossa rede.</p>
          </div>
        )}

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          <span className="block px-3.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Navegação Principal</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-2xl transition-all font-semibold text-xs border ${
                  isActive 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm shadow-slate-950/15 animate-fadeIn'
                    : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:text-pink-500 hover:border-slate-100/60'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-pink-400' : 'text-slate-400'} />
                <div className="text-left">
                  <span className="block font-bold">{item.label}</span>
                  <span className={`block text-[9px] font-normal leading-normal ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>{item.desc}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Card in Sidebar Footer */}
        {currentUser && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/30">
            <div className="flex items-center space-x-3 min-w-0">
              <img
                src={currentUser.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150"}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-100 shrink-0"
              />
              <div className="min-w-0">
                <span className="block text-[12px] font-black text-slate-800 truncate" title={currentUser.name}>{currentUser.name}</span>
                <span className="block text-[8px] font-extrabold text-pink-500 uppercase tracking-wider leading-none mt-0.5">{currentUser.role || 'CLIENTE'}</span>
              </div>
            </div>
            <button
              onClick={() => logoutUser()}
              className="p-2.5 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 border border-slate-100 hover:border-red-100 rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
              title="Sair da Conta"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </aside>

      {/* MOBILE HEADER - Only shown on screen < md */}
      <header className="md:hidden bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs w-full">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-pink-500 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Scissors size={14} />
          </div>
          <div>
            <span className="text-base font-black tracking-tight bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent">VOGUE</span>
            {activeSalon && <span className="block text-[8px] font-extrabold text-slate-400 truncate max-w-[140px] leading-none mt-0.5">{activeSalon.name}</span>}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {currentUser ? (
            <img
              src={currentUser.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150"}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover border border-slate-200 cursor-pointer"
              onClick={() => navigate('/profile')}
            />
          ) : (
            <button
              onClick={() => navigate('/profile')}
              className="text-[9px] font-extrabold uppercase bg-pink-50 hover:bg-pink-100 text-pink-600 px-3 py-1.5 rounded-full transition-all"
            >
              Entrar
            </button>
          )}
        </div>
      </header>

      {/* RESPONSIVE BODY WRAPPER */}
      <div className="flex-1 flex flex-col min-h-screen relative md:pb-0 pb-24">
        <div className="flex-1 w-full max-w-7xl mx-auto md:px-8 md:py-8 flex flex-col">
          {authLoading ? (
            <div className="flex-1 flex flex-col justify-center items-center p-8 min-h-[50vh]">
              <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mt-4">Carregando Vogue...</p>
            </div>
          ) : shouldShowLogin ? (
            <div className="w-full max-w-md mx-auto p-4 md:py-12">
              <LoginScreen />
            </div>
          ) : (
            <div className="flex-1 bg-white md:rounded-[32px] md:shadow-md md:shadow-slate-100/80 md:border md:border-slate-100/60 p-1 py-4 md:p-8 relative min-h-[80vh] flex flex-col">
              <Outlet />
            </div>
          )}
        </div>

        {/* BOTTOM NAV - Only shown on screen < md */}
        <BottomNav />
      </div>
    </div>
  );
};

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAppContext();

  const navItems = [
    { icon: Home, path: '/', label: 'Início' },
    { icon: Calendar, path: '/appointments', label: 'Avaliações' },
    ...((currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') ? [{ icon: MessageSquare, path: '/vogue-admin', label: 'Admin' }] : []),
    ...(currentUser?.role === 'SUPER_ADMIN' ? [{ icon: Building2, path: '/admin-geral', label: 'Geral' }] : []),
    { icon: User, path: '/profile', label: 'Perfil' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] px-6 py-4 flex justify-between items-center z-40 md:hidden border-t border-slate-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${
              isActive ? 'bg-slate-800 text-white' : 'text-gray-400 hover:text-pink-500'
            }`}
          >
            <Icon size={isActive ? 20 : 24} strokeWidth={isActive ? 2.5 : 2} />
            {isActive && <span className="text-[10px] mt-1 font-medium">{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
};
