import React, { useState } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  isToday, 
  addDays, 
  subDays, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Scissors, 
  Sparkles, 
  Wind, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Filter,
  Check,
  Undo
} from 'lucide-react';
import { Appointment, Stylist, Service } from '../data/mock';

interface AdminCalendarViewProps {
  appointments: Appointment[];
  allStylists: Stylist[];
  allServices: Service[];
  updateAppointmentStatus: (id: string, status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO') => void;
  confirmingApptId: string | null;
  setConfirmingApptId: (id: string | null) => void;
}

export const AdminCalendarView: React.FC<AdminCalendarViewProps> = ({
  appointments,
  allStylists,
  allServices,
  updateAppointmentStatus,
  confirmingApptId,
  setConfirmingApptId
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedStylistId, setSelectedStylistId] = useState<string>('ALL');
  const [selectedDateDay, setSelectedDateDay] = useState<Date>(new Date());

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else {
      setCurrentDate(prev => subWeeks(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else {
      setCurrentDate(prev => addWeeks(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDateDay(new Date());
  };

  // Filter appointments by stylist and active status (cancels included but shown visually)
  const filteredAppointments = appointments.filter(appt => {
    if (selectedStylistId !== 'ALL' && appt.stylistId !== selectedStylistId) {
      return false;
    }
    return true;
  });

  // Render Month View helper calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start week on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Render Week View helper calculations
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Get service icons helper
  const renderServiceIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Scissors': return <Scissors size={12} className="text-pink-500" />;
      case 'Wind': return <Wind size={12} className="text-blue-500" />;
      default: return <Sparkles size={12} className="text-violet-500" />;
    }
  };

  // Appointments for a specific day
  const getAppointmentsForDay = (day: Date) => {
    return filteredAppointments.filter(appt => {
      const apptDate = new Date(appt.date);
      return isSameDay(apptDate, day);
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Selected Day appointments (for details list below month calendar)
  const selectedDayAppointments = getAppointmentsForDay(selectedDateDay);

  return (
    <div className="bg-white rounded-[24px] p-3 sm:p-5 shadow-sm border border-slate-150 space-y-4 sm:space-y-5">
      {/* Header with Search/Filters & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-3 sm:pb-4">
        <div>
          <h3 className="font-extrabold text-slate-950 text-sm sm:text-base flex items-center gap-2">
            Visão da Agenda
            <span className="bg-pink-100 text-pink-700 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
              Dinâmico
            </span>
          </h3>
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold mt-0.5">Navegue pelos agendamentos com visão semanal ou mensal completa</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="bg-slate-100 p-0.5 rounded-2xl flex items-center">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${
                viewMode === 'month' 
                  ? 'bg-white text-slate-950 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${
                viewMode === 'week' 
                  ? 'bg-white text-slate-950 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semanal
            </button>
          </div>

          {/* Professional Selector */}
          <div className="relative flex items-center bg-slate-50 border border-slate-150 rounded-2xl px-2 py-1">
            <Filter size={10} className="text-slate-400 mr-1 ml-0.5" />
            <select
              value={selectedStylistId}
              onChange={(e) => setSelectedStylistId(e.target.value)}
              className="bg-transparent text-[10px] sm:text-xs font-black text-slate-800 pr-4 py-0.5 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="ALL">Todas Profissionais</option>
              {allStylists.map(stylist => (
                <option key={stylist.id} value={stylist.id}>{stylist.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-slate-500">
              <ChevronRight size={10} className="rotate-90" />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Navigation and Title */}
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] sm:text-sm font-black text-slate-850 tracking-tight uppercase">
          {viewMode === 'month' 
            ? format(currentDate, 'MMMM yyyy', { locale: ptBR }) 
            : `Semana de ${format(weekStart, 'dd/MM', { locale: ptBR })} a ${format(weekEnd, 'dd/MM/yyyy', { locale: ptBR })}`
          }
        </h4>

        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrev}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
            title="Anterior"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={handleToday}
            className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 hover:bg-slate-100 rounded-lg text-pink-600 font-extrabold transition-all"
          >
            Hoje
          </button>
          <button
            onClick={handleNext}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
            title="Próximo"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* --- MONTH VIEW GRID --- */}
      {viewMode === 'month' && (
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
              <span key={d} className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 py-1">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {monthDays.map((day, i) => {
              const dayAppts = getAppointmentsForDay(day);
              const isSelected = isSameDay(day, selectedDateDay);
              const isTodayDay = isToday(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const activeCount = dayAppts.filter(a => a.status !== 'CANCELADO').length;

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDateDay(day)}
                  className={`min-h-[54px] sm:min-h-[76px] p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                    !isCurrentMonth ? 'bg-slate-50/40 border-slate-100 text-slate-300' : 'bg-white border-slate-100 hover:border-slate-300'
                  } ${
                    isSelected ? 'ring-2 ring-pink-500 border-transparent shadow-sm' : ''
                  } ${
                    isTodayDay ? 'bg-pink-50/40 border-pink-200' : ''
                  }`}
                >
                  {/* Number row */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 sm:px-1.5 sm:py-0.5 rounded-md ${
                      isTodayDay 
                        ? 'bg-pink-500 text-white font-black shadow-xs' 
                        : isSelected
                          ? 'text-pink-600 font-black'
                          : 'text-slate-800'
                    }`}>
                      {format(day, 'd')}
                    </span>

                    {activeCount > 0 && isCurrentMonth && (
                      <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900 border border-slate-700 text-white text-[7px] sm:text-[8px] font-black flex items-center justify-center shrink-0">
                        {activeCount}
                      </span>
                    )}
                  </div>

                  {/* Tiny bullets or styling for appointments in month day grid cell */}
                  <div className="mt-0.5 flex flex-col justify-end flex-1">
                    {/* Desktop View: Text labels */}
                    <div className="hidden sm:block space-y-0.5 overflow-hidden w-full">
                      {dayAppts.slice(0, 2).map(appt => {
                        const service = allServices.find(s => s.id === appt.serviceId);
                        const isCancelled = appt.status === 'CANCELADO';
                        const isPending = appt.status === 'PENDENTE';

                        return (
                          <div 
                            key={appt.id} 
                            className={`text-[8px] font-semibold truncate rounded px-1 py-0.2 ${
                              isCancelled 
                                ? 'bg-red-50 text-red-500/80 line-through' 
                                : isPending
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-pink-50 text-pink-700 font-bold'
                            }`}
                          >
                            {format(new Date(appt.date), 'HH:mm')} {service?.name || 'S'}
                          </div>
                        );
                      })}
                      {dayAppts.length > 2 && (
                        <div className="text-[7px] text-slate-400 font-bold text-center">
                          +{dayAppts.length - 2} mais
                        </div>
                      )}
                    </div>

                    {/* Mobile View: High-density visual status dots */}
                    <div className="flex sm:hidden items-center justify-center gap-0.5 mt-0.5 flex-wrap">
                      {dayAppts.slice(0, 3).map(appt => {
                        const isCancelled = appt.status === 'CANCELADO';
                        const isPending = appt.status === 'PENDENTE';
                        return (
                          <span 
                            key={appt.id}
                            className={`w-1 h-1 rounded-full shrink-0 ${
                              isCancelled 
                                ? 'bg-red-400' 
                                : isPending
                                  ? 'bg-amber-400'
                                  : 'bg-pink-500'
                            }`}
                          />
                        );
                      })}
                      {dayAppts.length > 3 && (
                        <span className="text-[6px] text-slate-500 font-black font-sans leading-none">
                          +
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Day Agenda Detail Section */}
          <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 border border-slate-150 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h5 className="text-[10px] sm:text-[11px] font-black uppercase text-slate-500 tracking-wider">
                Compromissos para: {format(selectedDateDay, "dd 'de' MMMM", { locale: ptBR })}
              </h5>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-800 font-mono">
                {selectedDayAppointments.filter(a => a.status !== 'CANCELADO').length} Ativos
              </span>
            </div>

            {selectedDayAppointments.length === 0 ? (
              <p className="text-xs text-slate-450 text-center py-4 font-semibold">Nenhum compromisso marcado para este dia</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedDayAppointments.map(appt => {
                  const stylist = allStylists.find(s => s.id === appt.stylistId);
                  const service = allServices.find(s => s.id === appt.serviceId);
                  
                  return (
                    <div 
                      key={appt.id} 
                      className={`p-3 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all bg-white ${
                        appt.status === 'CANCELADO' 
                          ? 'border-slate-150 opacity-60 bg-slate-50/50' 
                          : appt.status === 'PENDENTE'
                            ? 'border-amber-150 bg-amber-50/10'
                            : 'border-slate-100 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 font-extrabold font-mono flex items-center gap-1">
                            <Clock size={10} />
                            {format(new Date(appt.date), 'HH:mm')} ({service?.durationMinutes} min)
                          </p>
                          <h6 className="font-black text-slate-800 text-xs mt-0.5 truncate max-w-[150px]">
                            {appt.clientName || `Cliente ${appt.clientId}`}
                          </h6>
                          <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-semibold mt-1">
                            {renderServiceIcon(service?.icon)}
                            <span className="truncate max-w-[120px]">{service?.name}</span>
                          </div>
                        </div>

                        {/* Professional avatar & small tag */}
                        <div className="flex flex-col items-end">
                          <img
                            src={stylist?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150'}
                            alt={stylist?.name}
                            className="w-6 h-6 rounded-full border border-slate-100 object-cover mb-1"
                          />
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {stylist?.name}
                          </span>
                        </div>
                      </div>

                      {/* Controls inside month-selected view item */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                          appt.status === 'CONFIRMADO' 
                            ? 'bg-green-100 text-green-700' 
                            : appt.status === 'CANCELADO'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-orange-100 text-orange-700'
                        }`}>
                          {appt.status}
                        </span>

                        <div className="flex items-center space-x-2">
                          {appt.status !== 'CANCELADO' ? (
                            confirmingApptId === appt.id ? (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    updateAppointmentStatus(appt.id, 'CANCELADO');
                                    setConfirmingApptId(null);
                                  }}
                                  className="text-[8px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded transition-all"
                                >
                                  Cancelar?
                                </button>
                                <button
                                  onClick={() => setConfirmingApptId(null)}
                                  className="text-[8px] font-black text-slate-400"
                                >
                                  Voltar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmingApptId(appt.id)}
                                className="text-[9px] text-red-500 hover:text-red-700 font-bold hover:underline"
                              >
                                Cancelar
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => updateAppointmentStatus(appt.id, 'CONFIRMADO')}
                              className="text-[9px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                            >
                              <Undo size={10} /> Reativar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- WEEK VIEW COLUMNS --- */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-150 flex items-center justify-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse shrink-0" />
            <span className="text-[10px] text-slate-500 font-bold leading-tight">
              Deslize para o lado para ver todos os dias da semana.
            </span>
          </div>

          <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
            {weekDays.map((day, dIdx) => {
              const dayAppts = getAppointmentsForDay(day);
              const isTodayDay = isToday(day);
              const formattedWeekday = format(day, 'EEEE', { locale: ptBR });
              const formattedDateString = format(day, 'dd/MM');

              return (
                <div
                  key={dIdx}
                  className={`min-w-[200px] xs:min-w-[230px] sm:min-w-[260px] md:min-w-[280px] flex-1 bg-slate-50/50 rounded-2xl p-3 border transition-all ${
                    isTodayDay ? 'border-pink-300 bg-pink-50/10 shadow-xs' : 'border-slate-150'
                  }`}
                >
                  {/* Column Header */}
                  <div className={`text-center pb-2.5 mb-3 border-b border-dashed flex items-center justify-between ${
                    isTodayDay ? 'border-pink-200' : 'border-slate-200'
                  }`}>
                    <span className={`text-[11px] font-black uppercase ${isTodayDay ? 'text-pink-600 font-extrabold' : 'text-slate-500'}`}>
                      {formattedWeekday.slice(0, 3)}
                    </span>
                    <span className={`text-[12px] font-black font-mono px-2 py-0.5 rounded-lg ${
                      isTodayDay ? 'bg-pink-500 text-white shadow-xs' : 'text-slate-800'
                    }`}>
                      {formattedDateString}
                    </span>
                  </div>

                  {/* Appointments lists */}
                  <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                    {dayAppts.length === 0 ? (
                      <div className="text-center py-8 text-[11px] text-slate-400 font-medium italic">
                        Sem compromissos
                      </div>
                    ) : (
                      dayAppts.map(appt => {
                        const stylist = allStylists.find(s => s.id === appt.stylistId);
                        const service = allServices.find(s => s.id === appt.serviceId);
                        const isCancelled = appt.status === 'CANCELADO';
                        const isPending = appt.status === 'PENDENTE';

                        return (
                          <div
                            key={appt.id}
                            className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-2 bg-white transition-all ${
                              isCancelled 
                                ? 'border-slate-150 opacity-60 bg-slate-50/50' 
                                : isPending
                                  ? 'border-amber-150 bg-amber-50/10'
                                  : 'border-slate-100 shadow-xs hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <span className={`text-[9px] font-extrabold font-mono flex items-center gap-0.5 ${
                                  isCancelled ? 'text-slate-400 line-through' : 'text-pink-600'
                                }`}>
                                  <Clock size={9} />
                                  {format(new Date(appt.date), 'HH:mm')}
                                </span>
                                <h6 className={`font-black tracking-tight text-xs mt-0.5 truncate max-w-[120px] ${
                                  isCancelled ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}>
                                  {appt.clientName || `Cliente ${appt.clientId}`}
                                </h6>
                              </div>

                              <img
                                src={stylist?.avatar}
                                alt={stylist?.name}
                                className="w-5 h-5 rounded-full border border-slate-100 object-cover shrink-0"
                                title={stylist?.name}
                              />
                            </div>

                            <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-semibold truncate">
                              {renderServiceIcon(service?.icon)}
                              <span className="truncate max-w-[150px]">{service?.name}</span>
                            </div>

                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-1">
                              {/* Small status pill */}
                              <span className={`text-[8px] font-black px-1.5 rounded-md ${
                                appt.status === 'CONFIRMADO' 
                                  ? 'bg-green-100 text-green-700' 
                                  : appt.status === 'CANCELADO'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-orange-100 text-orange-700'
                              }`}>
                                {appt.status === 'PENDENTE' ? 'PENDENTE' : appt.status}
                              </span>

                              {/* Small cancel/reactivate trigger */}
                              {appt.status !== 'CANCELADO' ? (
                                confirmingApptId === appt.id ? (
                                  <button
                                    onClick={() => {
                                      updateAppointmentStatus(appt.id, 'CANCELADO');
                                      setConfirmingApptId(null);
                                    }}
                                    className="text-[8px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-1.5 rounded"
                                  >
                                    Confirmar?
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setConfirmingApptId(appt.id)}
                                    className="text-[8px] font-bold text-red-400 hover:text-red-500 hover:underline"
                                  >
                                    Cancelar
                                  </button>
                                )
                              ) : (
                                <button
                                  onClick={() => updateAppointmentStatus(appt.id, 'CONFIRMADO')}
                                  className="text-[8px] hover:underline text-emerald-600 font-bold"
                                >
                                  Reativar
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
