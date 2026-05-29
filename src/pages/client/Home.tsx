import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { useAppContext } from '../../store/AppContext';

export const ClientHome = () => {
  const navigate = useNavigate();
  const { 
    allServices: globalServices, 
    allStylists: globalStylists, 
    currentUser, 
    bannerConfig, 
    salons, 
    selectedSalonId, 
    setSelectedSalonId 
  } = useAppContext();

  const activeSalon = salons?.find(s => s.id === selectedSalonId);

  const matchesSalon = (itemSalonId?: string) => {
    if (!selectedSalonId) return true;
    const actualId = itemSalonId || 'sal_vogue_main';
    return actualId === selectedSalonId;
  };

  const allServices = globalServices.filter(s => matchesSalon((s as any).salonId));
  const allStylists = globalStylists.filter(st => matchesSalon((st as any).salonId));

  // Carousel slider reference and state trackers
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-detect which active stylist card is primarily aligned inside viewport
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    
    // Width of standard card is 160px (w-40 is 10rem = 160px) + gap is 16px (space-x-4 = 1rem = 16px) => 176px per item
    const itemWidth = 176;
    const index = Math.min(
      allStylists.length - 1,
      Math.max(0, Math.round(scrollLeft / itemWidth))
    );
    setActiveIndex(index);
  };

  // Sync scroll listener
  useEffect(() => {
    const el = carouselRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (el) {
        el.removeEventListener('scroll', handleScroll);
      }
    };
  }, [allStylists.length]);

  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return;
    const itemWidth = 176;
    carouselRef.current.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth'
    });
    setActiveIndex(index);
  };

  const scrollPrev = () => {
    const prevIdx = Math.max(0, activeIndex - 1);
    scrollToIndex(prevIdx);
  };

  const scrollNext = () => {
    const nextIdx = Math.min(allStylists.length - 1, activeIndex + 1);
    scrollToIndex(nextIdx);
  };

  return (
    <div className="w-full px-4 sm:px-6 pt-8 pb-4 overflow-x-hidden flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center gap-3 mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate" title={currentUser?.name || "Visitante"}>
            Olá, {currentUser?.name || "Visitante"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 truncate">
            {currentUser 
              ? `Bem-vindo(a) ao ${activeSalon ? activeSalon.name : 'Vogue Salão'}` 
              : 'Faça login para agendar serviços'}
          </p>
        </div>
        {currentUser ? (
          <img
            src={currentUser.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150"}
            alt="User"
            className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-100 cursor-pointer shrink-0"
            onClick={() => navigate('/profile')}
          />
        ) : (
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-pink-100 hover:bg-pink-200 text-pink-600 rounded-full font-bold text-xs shadow-sm shadow-pink-50 transition-all shrink-0"
          >
            Entrar
          </button>
        )}
      </div>

      {/* Selected Salon Unit banner context widget */}
      {activeSalon && (
        <div className="mb-6 bg-gradient-to-r from-pink-50 to-indigo-50 border border-pink-100/80 rounded-2xl p-3 sm:p-4 flex justify-between items-center text-xs animate-fadeIn shadow-xs select-none">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-pink-500 text-white flex items-center justify-center shrink-0">
              <Icons.Building2 size={18} />
            </div>
            <div className="min-w-0">
              <span className="block text-[8px] sm:text-[9px] uppercase font-bold text-pink-600 tracking-wider">Unidade Selecionada</span>
              <strong className="block text-slate-800 truncate text-xs font-black leading-tight mt-0.5">{activeSalon.name}</strong>
              <span className="block text-[10px] text-slate-500 truncate mt-0.5 font-medium">{activeSalon.address}</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setSelectedSalonId(null)}
            className="text-[9px] font-extrabold text-pink-600 bg-white hover:bg-pink-50 p-2 px-3 rounded-xl border border-pink-100 transition-all cursor-pointer pointer-events-auto shrink-0 select-none uppercase tracking-wider ml-2 shadow-xs"
          >
            Limpar
          </button>
        </div>
      )}

      {/* Banner */}
      <div 
        className={`relative rounded-3xl p-6 mb-8 overflow-hidden text-white shadow-lg shadow-pink-200 transition-all ${
          bannerConfig.bgColor && bannerConfig.bgColor.startsWith('bg-') ? bannerConfig.bgColor : 'bg-pink-500'
        }`}
        style={bannerConfig.bgColor && !bannerConfig.bgColor.startsWith('bg-') ? { backgroundColor: bannerConfig.bgColor } : {}}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-20 w-16 h-16 bg-white/10 rounded-full translate-y-1/2"></div>
        
        <div className="relative z-10 w-1/2">
          {bannerConfig.discountLabel && (
            <p className="text-xs font-semibold mb-1 opacity-90 uppercase tracking-wider">{bannerConfig.discountLabel}</p>
          )}
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-1 leading-none tracking-tight break-words">
            {bannerConfig.title || "Beleza"}
          </h2>
          {bannerConfig.subtitle && (
            <p className="text-[10px] font-bold tracking-widest uppercase opacity-95">{bannerConfig.subtitle}</p>
          )}
        </div>
        {bannerConfig.imageUrl && (
          <img
            src={bannerConfig.imageUrl}
            alt="Model/Banner"
            className="absolute right-0 bottom-0 w-1/2 h-[120%] object-cover object-left"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Services Grid */}
      {allServices.length === 0 ? (
        <div className="col-span-4 bg-pink-50/40 rounded-[24px] p-5 text-center border border-pink-100/50 mb-8 select-none">
          <Icons.Scissors size={20} className="mx-auto mb-1.5 text-pink-400" />
          <p className="text-xs font-extrabold text-pink-700">Nenhum serviço disponível ainda</p>
          <p className="text-[10px] text-pink-400 mt-1 font-bold">Acesse a aba de Serviços no Painel Administrativo para cadastrar novos procedimentos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-y-6 gap-x-4 mb-8">
          {allServices.map((service) => {
            const Icon = (Icons as any)[service.icon] || Icons.HelpCircle;
            return (
              <div
                key={service.id}
                className="flex flex-col items-center cursor-pointer min-w-0"
                onClick={() => navigate(`/book/${service.id}`)}
              >
                <div className="w-14 h-14 bg-pink-100 text-pink-500 rounded-2xl flex items-center justify-center mb-2 hover:bg-pink-500 hover:text-white transition-colors shadow-sm">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">
                  {service.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Hair Stylists */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Profissionais</h3>
          <p className="text-[10px] text-gray-400 font-medium">Deslize para ver nossa equipe de especialistas</p>
        </div>
        
        {/* Sliding directional buttons as arrow anchors on larger/desktop scopes */}
        {allStylists.length > 0 && (
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-full">
            <button 
              onClick={scrollPrev}
              disabled={activeIndex === 0}
              className={`p-1.5 rounded-full transition-all ${
                activeIndex === 0 
                  ? 'text-gray-300 cursor-not-allowed bg-transparent' 
                  : 'text-pink-600 bg-white shadow-sm hover:scale-105 active:scale-95'
              }`}
              title="Anterior"
            >
              <Icons.ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button 
              onClick={scrollNext}
              disabled={activeIndex === allStylists.length - 1}
              className={`p-1.5 rounded-full transition-all ${
                activeIndex === allStylists.length - 1 
                  ? 'text-gray-300 cursor-not-allowed bg-transparent' 
                  : 'text-pink-600 bg-white shadow-sm hover:scale-105 active:scale-95'
              }`}
              title="Próximo"
            >
              <Icons.ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* Sliding Carousel Area */}
      {allStylists.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-6 text-center select-none text-slate-400 mb-10">
          <Icons.Users size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-extrabold text-slate-700">Nenhum profissional disponível ainda</p>
          <p className="text-[10px] text-slate-400 mt-1 font-bold">Acesse o Painel Administrativo para cadastrar novos colaboradores na equipe.</p>
        </div>
      ) : (
        <>
          <div className="relative group">
            <div 
              ref={carouselRef}
              className="flex space-x-4 pb-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth"
            >
              {allStylists.map((stylist, index) => {
                // Find unique services this stylist does from catalog
                const stylistSpecialties = stylist.services
                  .map(sid => allServices.find(s => s.id === sid)?.name)
                  .filter(Boolean)
                  .slice(0, 2);

                const isFocus = activeIndex === index;

                return (
                  <motion.div 
                    key={stylist.id} 
                    className={`snap-start shrink-0 w-40 bg-white rounded-[24px] shadow-sm p-3 pb-4 transition-all border ${
                      isFocus ? 'border-pink-300 ring-4 ring-pink-50' : 'border-slate-50'
                    }`}
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="relative overflow-hidden rounded-xl mb-3 h-32 bg-slate-100">
                      <img
                        src={stylist.avatar}
                        alt={stylist.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center space-x-0.5 shadow-sm">
                        <Icons.Star
                          size={10}
                          className="text-amber-400 fill-amber-400"
                        />
                        <span className="text-[9px] font-black text-slate-800">{stylist.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-gray-900 text-sm mb-0.5 tracking-tight truncate">
                      {stylist.name}
                    </h4>

                    {/* Highly elegant specialties info tag */}
                    <p className="text-[9px] font-bold text-pink-500/90 mb-2 truncate">
                      {stylistSpecialties.length > 0 ? stylistSpecialties.join(' • ') : 'Designer'}
                    </p>

                    {/* Clean rating stars */}
                    <div className="flex space-x-0.5 mb-2.5">
                      {[...Array(5)].map((_, i) => (
                        <Icons.Star
                          key={i}
                          size={9}
                          className={i < Math.round(stylist.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"}
                        />
                      ))}
                    </div>

                    {/* Quick CTA to book with this stylist */}
                    <button
                      onClick={() => {
                        // Navigate directly to booking with a pre-selected service/stylist if matching
                        const firstServiceId = stylist.services[0] || 's1';
                        navigate(`/book/${firstServiceId}`);
                      }}
                      className={`w-full py-1.5 rounded-lg text-[9px] font-black transition-all ${
                        isFocus 
                          ? 'bg-pink-500 text-white shadow-sm shadow-pink-200' 
                          : 'bg-slate-50 hover:bg-pink-50 text-slate-600 hover:text-pink-600'
                      }`}
                    >
                      Agendar horário
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Pagination bullets indicators */}
          <div className="flex justify-center space-x-1.5 mt-2.5 mb-10">
            {allStylists.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex === index 
                    ? 'w-5 bg-pink-500' 
                    : 'w-1.5 bg-gray-200 hover:bg-slate-300'
                }`}
                title={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
