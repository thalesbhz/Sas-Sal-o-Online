import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, MessageSquare, User, Building2 } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { LoginScreen } from './LoginScreen';

export const MobileLayout = () => {
  const { currentUser, authLoading } = useAppContext();
  const location = useLocation();

  const isPublicRoute = 
    location.pathname === '/' || 
    location.pathname === '/vogue-admin' || 
    location.pathname.startsWith('/agenda');
  const shouldShowLogin = !currentUser && !isPublicRoute;

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen">
      <div className="w-full max-w-md bg-slate-50 min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
        {/* Background blobs for that playful look */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -z-10 -translate-x-1/2 translate-y-1/2"></div>

        <div className="flex-1 overflow-y-auto pb-20 flex flex-col">
          {authLoading ? (
            <div className="flex-1 flex flex-col justify-center items-center p-8">
              <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mt-4">Carregando Vogue...</p>
            </div>
          ) : shouldShowLogin ? (
            <LoginScreen />
          ) : (
            <Outlet />
          )}
        </div>

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
    <div className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] px-6 py-4 flex justify-between items-center z-10">
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
