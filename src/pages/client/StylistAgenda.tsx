import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, 
  Sparkles, 
  Check, 
  Calendar, 
  Clock, 
  User, 
  Smile, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Mail, 
  Instagram, 
  Star,
  Compass,
  ArrowRight
} from 'lucide-react';
import { 
  format, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  isToday, 
  isSameDay 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAppContext } from '../../store/AppContext';
import { Appointment, Stylist, Service } from '../../data/mock';

export const StylistAgenda = () => {
  const navigate = useNavigate();
  const { stylistId } = useParams();
  const { allStylists, allServices, currentUser, addAppointment, registerUser, businessHours } = useAppContext();

  // Selected state
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Real-time local appointments list for the chosen stylist
  const [localAppointments, setLocalAppointments] = useState<Appointment[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Inline dynamic booking form for guests and clients
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [newlyCreatedAppointment, setNewlyCreatedAppointment] = useState<any>(null);

  // Horizon elements reference
  const daysScrollRef = useRef<HTMLDivElement>(null);

  // Active stylist resolution
  useEffect(() => {
    if (allStylists.length > 0) {
      if (stylistId) {
        const found = allStylists.find(s => s.id === stylistId);
        if (found) {
          setSelectedStylist(found);
        } else {
          setSelectedStylist(allStylists[0]);
        }
      } else {
        setSelectedStylist(allStylists[0]);
      }
    }
  }, [stylistId, allStylists]);

  // Set default service
  useEffect(() => {
    if (selectedStylist && allServices.length > 0) {
      // Prefer a service offered by the stylist
      const offeredServices = allServices.filter(s => selectedStylist.services.includes(s.id));
      if (offeredServices.length > 0) {
        setSelectedServiceId(offeredServices[0].id);
      } else {
        setSelectedServiceId(allServices[0].id);
      }
    }
  }, [selectedStylist, allServices]);

  // Real-time listener for appointments of the selected stylist (independent of login status!)
  useEffect(() => {
    if (!selectedStylist) return;

    const q = query(
      collection(db, 'appointments'),
      where('stylistId', '==', selectedStylist.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({ ...data, id: doc.id } as Appointment);
      });
      setLocalAppointments(list);
    }, (error) => {
      console.error("Erro ao escutar agendamentos em tempo real:", error);
    });

    return () => unsubscribe();
  }, [selectedStylist]);

  // Handle URL change
  useEffect(() => {
    if (stylistId && allStylists.length > 0) {
      const found = allStylists.find(s => s.id === stylistId);
      if (found) {
        setSelectedStylist(found);
      }
    }
  }, [stylistId]);

  // Align active date selected into view automatically
  useEffect(() => {
    if (daysScrollRef.current) {
      const selectedEl = daysScrollRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate]);

  // Generate days for active month view
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Time slot helper matches Salon business configurations
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

  const getBusinessDayConfig = (date: Date) => {
    return businessHours?.find(d => d.dayIndex === date.getDay()) || {
      isOpen: true,
      openTime: '08:00',
      closeTime: '20:00'
    };
  };

  const currentDayConfig = getBusinessDayConfig(selectedDate);
  const isDayClosed = !currentDayConfig.isOpen;

  const generatedSlots = isDayClosed 
    ? [] 
    : generateTimeSlots(currentDayConfig.openTime, currentDayConfig.closeTime);

  const isPast = (day: Date) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const compareDay = new Date(day);
    compareDay.setHours(0, 0, 0, 0);
    return compareDay < startOfToday;
  };

  // Occupied slots resolver, considering duration overlap
  const activeAppointmentsOnDate = localAppointments.filter(appt => 
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

  // Automatically reset selected time if it becomes booked/invalid
  useEffect(() => {
    if (selectedTime && bookedSlots.includes(selectedTime)) {
      setSelectedTime(null);
    }
  }, [selectedDate, selectedStylist, localAppointments, selectedServiceId, bookedSlots]);

  // Copy direct stylist link to clipboard
  const handleCopyLink = () => {
    if (!selectedStylist) return;
    const shareUrl = `${window.location.origin}/agenda/${selectedStylist.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime || !selectedStylist || !selectedServiceId) return;

    setIsBookingSubmitting(true);
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, minutes, 0, 0);

      let targetClientId = '';
      let targetClientName = '';

      if (currentUser) {
        targetClientId = currentUser.id;
        targetClientName = currentUser.name;
      } else {
        // Real anonymous profile creation so client registers seamlessly
        const emailLower = guestEmail.trim().toLowerCase();
        if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
          throw new Error("Por favor, preencha todos os campos do formulário.");
        }

        try {
          // Attempt registering using context helper
          await registerUser({
            name: guestName.trim(),
            email: emailLower,
            phone: guestPhone.trim(),
            gender: 'Feminino',
            whatsappNotifications: true,
            emailNotifications: true,
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(guestName)}`
          });
          
          // Re-fetch current user immediately from storage or local context simulation
          const savedLocally = localStorage.getItem('vogue_local_user');
          if (savedLocally) {
            const parsed = JSON.parse(savedLocally);
            targetClientId = parsed.id;
            targetClientName = parsed.name;
          } else {
            // Static fallback if Firebase state was synchronous
            targetClientId = auth.currentUser?.uid || 'guest_' + Math.random().toString(36).substring(2, 9);
            targetClientName = guestName.trim();
          }
        } catch (regErr: any) {
          console.warn("User already exists or simulation returned. Utilizing custom booking tags.", regErr);
          // If already exists, generate random unique ID
          targetClientId = 'guest_' + Math.random().toString(36).substring(2, 9);
          targetClientName = guestName.trim();
        }
      }

      // Add Appointment to DB/local state
      const apptData = {
        clientId: targetClientId,
        clientName: targetClientName,
        serviceId: selectedServiceId,
        stylistId: selectedStylist.id,
        date: appointmentDate.toISOString()
      };

      await addAppointment(apptData);
      
      const chosenService = allServices.find(s => s.id === selectedServiceId);
      setNewlyCreatedAppointment({
        stylist: selectedStylist.name,
        service: chosenService?.name || 'Procedimento',
        price: chosenService?.price || 0,
        date: appointmentDate,
      });
      setBookingSuccess(true);
      setSelectedTime(null);
    } catch (err: any) {
      alert("Falha no agendamento: " + (err.message || err));
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Filtering stylists matching the search term
  const filteredStylists = allStylists.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col p-6 animate-fadeIn pb-24">
      {/* Top action header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[10px] bg-pink-500/10 text-pink-600 px-2.5 py-1 rounded-full font-black uppercase tracking-wider mb-1.5 inline-block">
            Link Compartilhável
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Agenda On-line</h2>
        </div>
        <button
          onClick={handleCopyLink}
          className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold font-mono transition-all border ${
            copiedLink 
              ? 'bg-green-500 text-white border-green-500' 
              : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border-slate-200'
          }`}
        >
          {copiedLink ? (
            <>
              <Check size={14} />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Share2 size={14} />
              <span>Copiar Link</span>
            </>
          )}
        </button>
      </div>

      {/* Real-time sync feedback tracker banner */}
      <div className="bg-gradient-to-r from-pink-500/5 to-purple-500/5 border border-pink-100 p-3.5 rounded-2xl mb-6 flex items-center space-x-2.5">
        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></div>
        <div className="w-2.5 h-2.5 bg-green-500 rounded-full absolute"></div>
        <div className="pl-1">
          <p className="text-[10px] font-extrabold text-pink-700 uppercase tracking-widest leading-none">Agendamento em Tempo Real Ativo</p>
          <p className="text-[9px] text-slate-450 mt-0.5 font-bold">Os horários são atualizados instantaneamente em sintonia com o salão.</p>
        </div>
      </div>

      {/* Professionals Directory / Carousel Selector if no explicit parameters */}
      <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100 mb-6">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5 px-1">
          Selecione a Profissional
        </label>
        
        {/* Simple search box for many professionals */}
        {allStylists.length > 5 && (
          <input
            type="text"
            placeholder="Pesquisar profissional..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs px-3 py-2.5 mb-3 border border-slate-200 rounded-xl outline-none focus:border-pink-300"
          />
        )}

        <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
          {(searchTerm ? filteredStylists : allStylists).map(s => {
            const isSelected = selectedStylist?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedStylist(s);
                  navigate(`/agenda/${s.id}`, { replace: true });
                  setSelectedTime(null);
                  setBookingSuccess(false);
                }}
                className={`flex items-center space-x-2.5 p-2 rounded-2xl text-left border shrink-0 transition-all ${
                  isSelected 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-950/10' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-150'
                }`}
              >
                <img src={s.avatar} alt={s.name} className="w-9 h-9 rounded-full object-cover border-2 border-white" />
                <div className="pr-1">
                  <span className="block text-xs font-extrabold leading-none">{s.name}</span>
                  <span className={`text-[9px] mt-0.5 block font-bold ${isSelected ? 'text-pink-300' : 'text-slate-400'}`}>
                    ★ {s.rating}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedStylist && (
        <div className="space-y-6">
          {/* Active Stylist Profile Details */}
          <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
            <img 
              src={selectedStylist.avatar} 
              alt={selectedStylist.name} 
              className="w-20 h-20 rounded-[24px] object-cover border border-slate-100 shadow-xs shrink-0" 
            />
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{selectedStylist.name}</h3>
                <div className="flex items-center px-2 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-[10px] font-black self-center sm:self-start w-fit border border-yellow-100">
                  <Star size={11} className="mr-1 fill-yellow-500 stroke-yellow-500" />
                  <span>{selectedStylist.rating} (ESPECIALISTA)</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-450 mt-1.5 font-bold uppercase tracking-wider">Serviços Oferecidos:</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {allServices
                  .filter(service => selectedStylist.services.includes(service.id))
                  .map(service => (
                    <span key={service.id} className="text-[9px] font-black bg-pink-50 text-pink-650 px-2 py-0.5 rounded-md border border-pink-100/50">
                      {service.name}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Calendar Day Carousel */}
          <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
            {/* Header: Month Navigator */}
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-mono">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h3>
              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Scrolling List of days */}
            <div 
              ref={daysScrollRef}
              className="flex space-x-2.5 overflow-x-auto pb-4 scroll-smooth snap-x scrollbar-none"
            >
              {monthDays.map((day) => {
                const isDaySelected = isSameDay(day, selectedDate);
                const isPastDate = isPast(day);
                const dayConfig = getBusinessDayConfig(day);
                
                return (
                  <button
                    key={day.toISOString()}
                    data-selected={isDaySelected}
                    disabled={isPastDate}
                    onClick={() => {
                      setSelectedDate(day);
                      setSelectedTime(null);
                      setBookingSuccess(false);
                    }}
                    className={`flex flex-col items-center justify-center w-14 h-20 rounded-2xl snap-center shrink-0 border transition-all ${
                      isDaySelected 
                        ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200' 
                        : isPastDate 
                          ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed opacity-50' 
                          : !dayConfig.isOpen
                            ? 'bg-red-50 text-red-500 border-red-100'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-150'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-bold tracking-widest mb-1">
                      {format(day, 'eee', { locale: ptBR }).substring(0, 3)}
                    </span>
                    <span className="text-base font-black leading-none">
                      {format(day, 'd')}
                    </span>
                    {!dayConfig.isOpen && !isPastDate && (
                      <span className="text-[8px] font-black uppercase mt-1 text-red-700 font-mono tracking-tighter">Folga</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots View & Booking flow */}
          {bookingSuccess ? (
            /* SUCCESS FEEDBACK SPLASH CARD */
            <div className="bg-green-50 border border-green-150 rounded-[32px] p-6 text-center space-y-4 animate-scaleUp">
              <div className="w-14 h-14 bg-green-500 rounded-full mx-auto flex items-center justify-center text-white shadow-md shadow-green-100">
                <Check size={28} strokeWidth={3} />
              </div>
              <div>
                <h4 className="text-md font-black text-green-900 leading-tight">Agendamento Confirmado!</h4>
                <p className="text-xs text-green-700 font-medium mt-1">Seu horário foi inserido com sucesso em nosso sistema.</p>
              </div>

              {newlyCreatedAppointment && (
                <div className="bg-white/80 border border-green-100/50 p-4 rounded-2xl text-left space-y-2 mt-2">
                  <div className="flex justify-between border-b pb-1.5 mb-1.5 text-xs text-slate-500 font-bold border-green-100/30">
                    <span>Profissional:</span>
                    <span className="text-slate-850">{newlyCreatedAppointment.stylist}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 mb-1.5 text-xs text-slate-500 font-bold border-green-100/30">
                    <span>Procedimento:</span>
                    <span className="text-slate-850 font-black">{newlyCreatedAppointment.service}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 mb-1.5 text-xs text-slate-500 font-bold border-green-100/30">
                    <span>Horário:</span>
                    <span className="text-rose-600 font-black font-mono">
                      {format(newlyCreatedAppointment.date, "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-extrabold font-mono pt-1">
                    <span>Valor:</span>
                    <span className="text-emerald-600">R$ {newlyCreatedAppointment.price.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setBookingSuccess(false);
                  setNewlyCreatedAppointment(null);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold tracking-wide uppercase py-3 rounded-2xl text-xs shadow-sm transition-colors"
              >
                Agendar Novo Horário
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily slots rendering panel */}
              <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
                    <Clock size={14} className="mr-1.5 text-rose-500" />
                    Horários para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </h4>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                    {currentDayConfig.isOpen ? `${currentDayConfig.openTime}h - ${currentDayConfig.closeTime}h` : 'Fechado'}
                  </span>
                </div>

                {isDayClosed ? (
                  <div className="p-8 text-center bg-red-50/50 rounded-2xl border border-red-50">
                    <Smile className="mx-auto mb-2 text-red-405 opacity-80" size={24} />
                    <p className="text-xs font-extrabold text-red-700">Profissional de Folga</p>
                    <p className="text-[10px] text-red-400 mt-1 font-bold">Favor escolher outro dia útil do salão.</p>
                  </div>
                ) : generatedSlots.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">Carregando horários...</div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {generatedSlots.map((timeStr) => {
                      const isOccupied = bookedSlots.includes(timeStr);
                      const isTimeSelected = selectedTime === timeStr;

                      return (
                        <button
                          key={timeStr}
                          disabled={isOccupied}
                          onClick={() => setSelectedTime(timeStr)}
                          className={`py-2 px-1 rounded-xl text-xs font-mono font-black border transition-all text-center flex flex-col items-center justify-center ${
                            isTimeSelected
                              ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                              : isOccupied
                                ? 'bg-slate-100 text-slate-350 border-slate-100 cursor-not-allowed opacity-60 line-through'
                                : 'bg-slate-50 hover:bg-slate-100 text-rose-650 border-slate-150'
                          }`}
                        >
                          <span>{timeStr}</span>
                          <span className={`text-[8px] font-bold ${isTimeSelected ? 'text-white' : isOccupied ? 'text-slate-350' : 'text-slate-400'}`}>
                            {isOccupied ? 'Ocupado' : 'Livre'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Booking trigger submission details or inputs */}
              <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center">
                    <Sparkles size={14} className="mr-1.5 text-rose-500" />
                    Confirmar Reserva
                  </h4>

                  {!selectedTime ? (
                    <div className="h-44 flex flex-col justify-center items-center text-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100 select-none">
                      <Clock size={28} className="text-slate-300 mb-2 animate-bounce" />
                      <p className="text-xs font-extrabold text-slate-500">Selecione um Horário</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold">Por favor, clique em um horário disponível ao lado para prosseguir.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleBookAppointment} className="space-y-4">
                      {/* Service selector */}
                      <div>
                        <label className="block text-[9px] font-black text-slate-450 uppercase tracking-wider mb-1 px-1">Procedimento Desejado</label>
                        <select
                          value={selectedServiceId}
                          onChange={e => setSelectedServiceId(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400 focus:bg-white text-slate-800 font-extrabold"
                        >
                          {allServices
                            .filter(service => selectedStylist.services.includes(service.id))
                            .map(service => (
                              <option key={service.id} value={service.id} className="font-extrabold text-slate-800">
                                {service.name} — R$ {service.price.toFixed(2)}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Info header */}
                      <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center justify-between text-xs font-mono font-bold text-rose-800 mb-2">
                        <span className="flex items-center"><Calendar size={12} className="mr-1.5" /> {format(selectedDate, 'dd/MM/yyyy')}</span>
                        <span className="flex items-center"><Clock size={12} className="mr-1.5" /> às {selectedTime}</span>
                      </div>

                      {/* Display guest fields if unauthenticated, keeping enrollment easy */}
                      {!currentUser ? (
                        <div className="space-y-3 pt-2.5 border-t border-slate-100">
                          <p className="text-[9px] text-pink-600 font-black uppercase tracking-wider">Identifique-se para Agendar:</p>
                          
                          <div>
                            <div className="relative">
                              <User className="absolute left-3 top-3 text-slate-300" size={13} />
                              <input
                                type="text"
                                required
                                placeholder="Seu nome completo"
                                value={guestName}
                                onChange={e => setGuestName(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400 focus:bg-white text-slate-850 font-bold placeholder:text-slate-300"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="relative">
                              <Mail className="absolute left-3 top-3.5 text-slate-300" size={13} />
                              <input
                                type="email"
                                required
                                placeholder="E-mail"
                                value={guestEmail}
                                onChange={e => setGuestEmail(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400 focus:bg-white text-slate-850 font-bold placeholder:text-slate-300"
                              />
                            </div>

                            <div className="relative">
                              <Phone className="absolute left-3 top-3.5 text-slate-300" size={13} />
                              <input
                                type="text"
                                required
                                placeholder="WhatsApp (Celular)"
                                value={guestPhone}
                                onChange={e => setGuestPhone(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-400 focus:bg-white text-slate-850 font-bold placeholder:text-slate-300"
                              />
                            </div>
                          </div>
                          
                          <span className="block text-[8px] text-slate-400 font-bold leading-tight">
                            * Ao confirmar, uma conta local segura será gerada automaticamente sob seu nome de e-mail.
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center space-x-2.5">
                          <img src={currentUser.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2"} className="w-7 h-7 rounded-full object-cover border" />
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold leading-none">Agendando como:</span>
                            <span className="block text-xs font-extrabold text-slate-800 mt-1">{currentUser.name}</span>
                          </div>
                        </div>
                      )}

                      {/* Core reserve action CTA */}
                      <button
                        type="submit"
                        disabled={isBookingSubmitting}
                        className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold uppercase tracking-widest text-[10px] py-4 rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:bg-slate-300 mt-2"
                      >
                        {isBookingSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span>Processando...</span>
                          </>
                        ) : (
                          <>
                            <span>CONFIRMAR AGENDAMENTO</span>
                            <ArrowRight size={13} strokeWidth={3} />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
