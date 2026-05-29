import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon, 
  Coffee,
  Scissors,
  Wind,
  Sparkles,
  Check
} from 'lucide-react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  isToday, 
  isSameDay 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppContext } from '../../store/AppContext';

export const ClientBooking = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const { allStylists: globalStylists, allServices: globalServices, addAppointment, currentUser, appointments, businessHours, selectedSalonId } = useAppContext();

  const matchesSalon = (itemSalonId?: string) => {
    if (!selectedSalonId) return true;
    const actualId = itemSalonId || 'sal_vogue_main';
    return actualId === selectedSalonId;
  };

  const allServices = globalServices.filter(s => matchesSalon((s as any).salonId));
  const allStylists = globalStylists.filter(st => matchesSalon((st as any).salonId));

  // Active month for pagination
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<string>(allStylists[0]?.id || '');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(serviceId || '');

  // Set initial stylist offering this service if any
  useEffect(() => {
    if (serviceId && allStylists.length > 0) {
      const offeringStylist = allStylists.find(s => s.services.includes(serviceId));
      if (offeringStylist) {
        setSelectedStylist(offeringStylist.id);
      } else if (allStylists.length > 0) {
        setSelectedStylist(allStylists[0].id);
      }
    } else if (allStylists.length > 0) {
      setSelectedStylist(allStylists[0].id);
    }
  }, [serviceId, allStylists]);

  // Auto-select a valid service when stylist changes
  useEffect(() => {
    if (selectedStylist && allStylists.length > 0) {
      const stylistObj = allStylists.find(s => s.id === selectedStylist);
      if (stylistObj) {
        // If current selected service is not offered by this stylist, select their first offered service
        if (!stylistObj.services.includes(selectedServiceId)) {
          const firstAvailableService = stylistObj.services[0] || '';
          setSelectedServiceId(firstAvailableService);
        }
      }
    }
  }, [selectedStylist, allStylists, selectedServiceId]);

  // References for horizontal scrolling alignment
  const daysScrollRef = useRef<HTMLDivElement>(null);

  // Generate all days of the currently page-selected month
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Dynamic time slots generation based on opening/closing setup
  const generateTimeSlots = (openTime: string, closeTime: string): string[] => {
    const slots: string[] = [];
    let currentHour = parseInt(openTime.split(':')[0], 10);
    let currentMin = parseInt(openTime.split(':')[1], 10);
    
    const endHour = parseInt(closeTime.split(':')[0], 10);
    const endMin = parseInt(closeTime.split(':')[1], 10);
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      slots.push(timeStr);
      
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }
    return slots;
  };

  const currentDayConfig = businessHours?.find(d => d.dayIndex === selectedDate.getDay()) || {
    isOpen: true,
    openTime: '08:00',
    closeTime: '20:00'
  };

  const isDayClosed = !currentDayConfig.isOpen;

  const generatedSlots = isDayClosed 
    ? [] 
    : generateTimeSlots(currentDayConfig.openTime, currentDayConfig.closeTime);

  const morningSlots = generatedSlots.filter(s => {
    const hour = parseInt(s.split(':')[0], 10);
    return hour < 12;
  });

  const afternoonSlots = generatedSlots.filter(s => {
    const hour = parseInt(s.split(':')[0], 10);
    return hour >= 12;
  });

  // Helper to prevent selecting past dates
  const isPast = (day: Date) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const compareDay = new Date(day);
    compareDay.setHours(0, 0, 0, 0);
    
    return compareDay < startOfToday;
  };

  // Verifica horários já agendados para este profissional na data selecionada
  const activeAppointmentsOnDate = appointments.filter(appt => 
    appt.stylistId === selectedStylist && 
    format(new Date(appt.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
    appt.status !== 'CANCELADO'
  );

  const bookedSlots = generatedSlots.filter(timeStr => {
    const [h, m] = timeStr.split(':').map(Number);
    const slotStart = h * 60 + m;

    for (const appt of activeAppointmentsOnDate) {
      const apptDate = new Date(appt.date);
      const apptStart = apptDate.getHours() * 60 + apptDate.getMinutes();
      
      const apptService = allServices.find(s => s.id === appt.serviceId);
      const apptDuration = apptService ? apptService.durationMinutes : 30; // default to 30 mins
      const apptEnd = apptStart + apptDuration;

      // O slot inicia durante um agendamento existente (entre o início e o término)
      if (slotStart >= apptStart && slotStart < apptEnd) {
        return true;
      }
    }
    return false;
  });

  // Automatically reset time slot if it's already booked on the new chosen date
  useEffect(() => {
    if (selectedTime && bookedSlots.includes(selectedTime)) {
      setSelectedTime(null);
    }
  }, [selectedDate, selectedStylist, appointments, selectedServiceId]);

  // Align active date selected into view automatically
  useEffect(() => {
    if (daysScrollRef.current) {
      const selectedEl = daysScrollRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate]);

  // Handle month switches
  const handlePrevMonth = () => {
    setCurrentMonth(prev => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Keep selectedDate current with pagination switches logically
  useEffect(() => {
    const today = new Date();
    if (format(currentMonth, 'yyyy-MM') === format(today, 'yyyy-MM')) {
      setSelectedDate(today);
    } else {
      setSelectedDate(startOfMonth(currentMonth));
    }
  }, [currentMonth]);

  const handleBook = () => {
    if (!selectedTime || !selectedStylist) return;
    
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes, 0, 0);
    
    addAppointment({
      clientId: currentUser?.id || 'guest',
      serviceId: selectedServiceId || 's1',
      stylistId: selectedStylist,
      date: appointmentDate.toISOString(),
      salonId: selectedSalonId || undefined
    } as any);
    
    navigate('/appointments');
  };

  return (
    <div className="bg-transparent flex flex-col relative pb-32 max-w-2xl mx-auto w-full">
      {/* Pink Header Top Section */}
      <div className="bg-pink-500 rounded-b-[40px] pt-12 pb-8 px-6 text-white text-center shadow-lg relative shrink-0">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-pink-600 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-base font-extrabold tracking-tight uppercase">Selecione Data e Hora</h1>
          <div className="w-10"></div> {/* spacer */}
        </div>

        {/* Month Selector Carousel Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <button 
            type="button" 
            onClick={handlePrevMonth} 
            className="text-white/80 hover:text-white p-1 hover:bg-pink-600 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-black text-xs uppercase tracking-widest text-pink-50">
            {format(currentMonth, 'MMMM, yyyy', { locale: ptBR })}
          </span>
          <button 
            type="button" 
            onClick={handleNextMonth} 
            className="text-white/80 hover:text-white p-1 hover:bg-pink-600 rounded-full transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Horizontal Sliding Calendar (All Days of the Month) */}
        <div 
          ref={daysScrollRef}
          className="flex space-x-2.5 mt-6 overflow-x-auto pb-3 px-1 snap-x scroll-smooth hide-scrollbar"
        >
          {monthDays.map((day, i) => {
            const isDaySelected = isSameDay(day, selectedDate);
            const isPastDay = isPast(day);
            return (
              <div
                key={i}
                data-selected={isDaySelected}
                onClick={() => !isPastDay && setSelectedDate(day)}
                className={`flex flex-col items-center justify-center w-12 h-20 rounded-2xl cursor-pointer transition-all shrink-0 snap-start relative ${
                  isDaySelected 
                    ? 'bg-white text-pink-500 shadow-md scale-105' 
                    : isPastDay
                      ? 'text-white/30 cursor-not-allowed opacity-40'
                      : 'text-white/85 hover:bg-pink-400'
                }`}
              >
                <span className="text-[8px] mb-1.5 uppercase font-bold tracking-wider">
                  {format(day, 'EEEEEE', { locale: ptBR }).slice(0, 3)}
                </span>
                <span className={`text-base leading-none ${isDaySelected ? 'font-black' : 'font-bold'}`}>
                  {format(day, 'dd')}
                </span>
                {isToday(day) && (
                  <span className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isDaySelected ? 'bg-pink-500' : 'bg-white'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Fields Container */}
      <div className="px-6 flex-1 overflow-y-auto pt-8">
        
        {/* Slider / Carousel Indicator for Times */}
        <div className="mb-4">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Horários Disponíveis</h3>
          <p className="text-[10px] text-slate-400 font-bold">Deslize horizontalmente para escolher a melhor hora</p>
        </div>
        
        {/* Morning & Afternoon lists OR Closed day warning placeholder */}
        {isDayClosed || generatedSlots.length === 0 ? (
          <div className="bg-slate-100/60 rounded-3xl p-8 text-center border border-dashed border-slate-200 mb-8 select-none">
            <Coffee size={36} className="mx-auto mb-2.5 text-slate-400 stroke-slate-350" />
            <h4 className="font-extrabold text-slate-800 text-sm">Sem expediente neste dia</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-bold leading-relaxed max-w-xs mx-auto">
              O salão de beleza está fechado ou não possui horários ativos para {format(selectedDate, 'eeee', { locale: ptBR })}.
            </p>
          </div>
        ) : (
          <>
            {/* Morning times slide list */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center">
                  <Sun size={14} className="text-amber-500 mr-1.5" />
                  <span className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Período da Manhã</span>
                </div>
                <span className="text-[9px] text-slate-400 font-extrabold bg-slate-100 px-2 py-0.5 rounded-full">
                  {morningSlots.length} Opções
                </span>
              </div>

              <div className="flex space-x-2.5 overflow-x-auto pb-3 snap-x scroll-smooth hide-scrollbar px-1">
                {morningSlots.map(time => {
                  const isBooked = bookedSlots.includes(time);
                  const isTimeSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => !isBooked && setSelectedTime(time)}
                      disabled={isBooked}
                      className={`snap-start shrink-0 px-5 py-3 rounded-2xl text-xs font-black transition-all border ${
                        isBooked
                          ? 'border-dashed border-slate-150 bg-slate-50 text-slate-300 cursor-not-allowed line-through opacity-65'
                          : isTimeSelected 
                            ? 'border-pink-500 bg-pink-500 text-white shadow-md shadow-pink-100 scale-105' 
                            : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Afternoon & Evening times slide list */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center">
                  <Moon size={14} className="text-indigo-500 mr-1.5" />
                  <span className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Período da Tarde & Noite</span>
                </div>
                <span className="text-[9px] text-slate-400 font-extrabold bg-slate-100 px-2 py-0.5 rounded-full">
                  {afternoonSlots.length} Opções
                </span>
              </div>

              <div className="flex space-x-2.5 overflow-x-auto pb-3 snap-x scroll-smooth hide-scrollbar px-1">
                {afternoonSlots.map(time => {
                  const isBooked = bookedSlots.includes(time);
                  const isTimeSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => !isBooked && setSelectedTime(time)}
                      disabled={isBooked}
                      className={`snap-start shrink-0 px-5 py-3 rounded-2xl text-xs font-black transition-all border ${
                        isBooked
                          ? 'border-dashed border-slate-150 bg-slate-50 text-slate-300 cursor-not-allowed line-through opacity-65'
                          : isTimeSelected 
                            ? 'border-pink-500 bg-pink-500 text-white shadow-md shadow-pink-100 scale-105' 
                            : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Choose Hair Stylist */}
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4">Escolha o(a) Profissional</h3>
        {allStylists.length === 0 ? (
          <div className="bg-slate-100/80 rounded-3xl p-5 border border-slate-200 text-center font-bold text-xs text-slate-500 mb-8 select-none">
            Nenhum profissional cadastrado ainda. Por favor, adicione profissionais no Painel Administrativo.
          </div>
        ) : (
          <div className="flex space-x-3.5 overflow-x-auto pb-4 pt-1 snap-x hide-scrollbar mb-8">
            {allStylists.map((stylist) => (
              <div
                key={stylist.id}
                onClick={() => setSelectedStylist(stylist.id)}
                className={`snap-start shrink-0 flex flex-col items-center p-3 rounded-[24px] w-24 border cursor-pointer transition-all ${
                  selectedStylist === stylist.id
                    ? 'border-pink-500 bg-white shadow-md ring-4 ring-pink-50 scale-105'
                    : 'border-slate-100 bg-white shadow-sm hover:border-slate-200'
                }`}
              >
                <img
                  src={stylist.avatar}
                  alt={stylist.name}
                  className="w-14 h-14 rounded-full object-cover mb-2 ring-2 ring-slate-50"
                />
                <span className="text-[10px] font-black text-slate-700 text-center truncate w-full">
                  {stylist.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Serviços Disponíveis com a Profissional */}
        {selectedStylist && (
          <div className="mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Serviços Disponíveis</h3>
            <p className="text-[10px] text-slate-450 font-bold mb-3">Selecione o procedimento oferecido pela profissional escolhida</p>
            <div className="grid grid-cols-1 gap-2.5">
              {allServices
                .filter(service => {
                  const stylistObj = allStylists.find(s => s.id === selectedStylist);
                  return stylistObj?.services.includes(service.id);
                })
                .map(service => {
                  const isServiceSelected = selectedServiceId === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedServiceId(service.id)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border ${
                        isServiceSelected
                          ? 'border-pink-500 bg-pink-50/50 shadow-sm ring-2 ring-pink-50'
                          : 'border-slate-100 bg-white hover:border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isServiceSelected ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-550'
                        }`}>
                          {service.icon === 'Scissors' ? (
                            <Scissors size={18} />
                          ) : service.icon === 'Wind' ? (
                            <Wind size={18} />
                          ) : (
                            <Sparkles size={18} />
                          )}
                        </div>
                        <div>
                          <span className="block text-xs font-black text-slate-850">{service.name}</span>
                          <span className="block text-[10px] font-bold text-slate-400 font-mono mt-0.5">{service.durationMinutes} min de duração</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold font-mono ${
                          isServiceSelected ? 'text-pink-600 font-black' : 'text-slate-705'
                        }`}>
                          R$ {service.price.toFixed(2)}
                        </span>
                        {isServiceSelected && (
                          <div className="w-4 h-4 bg-pink-500 text-white rounded-full flex items-center justify-center">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="absolute bottom-6 left-0 w-full px-6 z-20 font-sans">
        <button
          type="button"
          onClick={handleBook}
          disabled={!selectedTime || !selectedStylist || !selectedServiceId}
          className={`w-full py-4 rounded-3xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all ${
            selectedTime && selectedStylist && selectedServiceId
              ? 'bg-pink-500 shadow-pink-500/30 hover:bg-pink-600 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          Confirmar Agendamento
        </button>
      </div>
    </div>
  );
};
