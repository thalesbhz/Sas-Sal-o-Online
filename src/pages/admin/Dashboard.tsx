import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { AdminCalendarView } from '../../components/AdminCalendarView';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  subWeeks 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Scissors, 
  ChevronLeft, 
  Settings, 
  MessageCircle, 
  Repeat, 
  Plus, 
  Trash2, 
  X, 
  Camera, 
  Edit,
  Wind,
  Droplet,
  Sparkles,
  Bath,
  Flower,
  Heart,
  Crown,
  Smile,
  Hand,
  Clock,
  Lock,
  Unlock,
  Coffee,
  TrendingUp,
  DollarSign,
  Activity,
  Award,
  ChevronDown,
  ChevronUp,
  Image,
  Upload,
  Search,
  Phone,
  Mail,
  UserPlus,
  Share2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const SALON_ICONS = [
  { name: 'Scissors', component: Scissors, label: 'Corte' },
  { name: 'Wind', component: Wind, label: 'Escova' },
  { name: 'Droplet', component: Droplet, label: 'Tinta' },
  { name: 'Sparkles', component: Sparkles, label: 'Make' },
  { name: 'Bath', component: Bath, label: 'Lavagem' },
  { name: 'Flower', component: Flower, label: 'Hidrata' },
  { name: 'Heart', component: Heart, label: 'Cuidado' },
  { name: 'Crown', component: Crown, label: 'Noivas' },
  { name: 'Smile', component: Smile, label: 'Rosto' },
  { name: 'Hand', component: Hand, label: 'Unhas' }
];

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-850 text-xs font-bold leading-relaxed space-y-1">
        <p className="text-slate-400 text-[10px] font-black">{label}</p>
        <p className="text-pink-400 font-extrabold text-sm">Faturamento: R$ {parseFloat(payload[0].value).toFixed(2)}</p>
        {payload[1] && (
          <p className="text-indigo-400 font-extrabold text-sm">Agendamentos: {payload[1].value}</p>
        )}
      </div>
    );
  }
  return null;
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { 
    appointments: globalAppointments, 
    allStylists: globalStylists, 
    allServices: globalServices, 
    addStylist, 
    removeStylist, 
    addService, 
    updateStylist, 
    removeService, 
    currentUser, 
    authLoading,
    updateAppointmentStatus,
    businessHours,
    updateSingleDayHours,
    updateBusinessHours,
    bannerConfig,
    updateBannerConfig,
    clients: globalClients,
    addClient,
    updateClient,
    removeClient,
    salons
  } = useAppContext();

  // Active / Associated Salon detection
  const mySalon = salons?.find(s => s.adminEmail.toLowerCase() === currentUser?.email?.toLowerCase());

  // Selector state for SUPER_ADMIN
  const [selectedSalonId, setSelectedSalonId] = useState<string>('sal_vogue_main');

  const matchesSalon = (itemSalonId?: string) => {
    // Treat legacy or undefined salonId as belonging to our default general salon 'sal_vogue_main'
    const actualId = itemSalonId || 'sal_vogue_main';
    if (currentUser?.role === 'ADMIN') {
      return actualId === (mySalon?.id || 'sal_vogue_main');
    }
    if (currentUser?.role === 'SUPER_ADMIN') {
      if (selectedSalonId === 'ALL') return true;
      return actualId === selectedSalonId;
    }
    return true;
  };

  // Shadow variables so we don't have to rewrite 2000 lines of references
  const appointments = (globalAppointments || []).filter(appt => matchesSalon(appt.salonId));
  const allStylists = (globalStylists || []).filter(s => matchesSalon(s.salonId));
  const allServices = (globalServices || []).filter(s => matchesSalon(s.salonId));
  const clients = (globalClients || []).filter(c => matchesSalon(c.salonId));

  // Guard: Protect administration panel against non-admin roles
  React.useEffect(() => {
    if (!authLoading) {
      if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, authLoading, navigate]);

  const [activeTab, setActiveTab] = useState<'appointments' | 'staff' | 'services' | 'billing' | 'clients' | 'settings'>('appointments');
  const [copiedStylistId, setCopiedStylistId] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-8">
        <div className="w-10 h-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
        <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase mt-4">Validando Permissões...</p>
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
    return null;
  }

  const handleShareStylistAgenda = (stylistId: string) => {
    const agendaUrl = `${window.location.origin}/agenda/${stylistId}`;
    navigator.clipboard.writeText(agendaUrl).then(() => {
      setCopiedStylistId(stylistId);
      setTimeout(() => setCopiedStylistId(null), 2500);
    });
  };
  
  const [clientSearch, setClientSearch] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
    birthday: '',
    gender: 'Feminino',
    instagram: '',
    whatsappNotifications: true,
    emailNotifications: false,
  });
  const [clientAvatarFile, setClientAvatarFile] = useState<string | null>(null);

  const handleClientAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setClientAvatarFile(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClient = () => {
    const avatarToSave = clientAvatarFile || clientForm.avatar;
    const clientData = {
      ...clientForm,
      avatar: avatarToSave
    };

    if (editingClientId) {
      updateClient(editingClientId, clientData);
    } else {
      addClient(clientData);
    }

    setShowClientForm(false);
    setEditingClientId(null);
    setClientAvatarFile(null);
    setClientForm({
      name: '',
      email: '',
      phone: '',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
      birthday: '',
      gender: 'Feminino',
      instagram: '',
      whatsappNotifications: true,
      emailNotifications: false,
    });
  };

  const handleEditClientClick = (client: any) => {
    setEditingClientId(client.id);
    setClientForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      avatar: client.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
      birthday: client.birthday || '',
      gender: client.gender || 'Feminino',
      instagram: client.instagram || '',
      whatsappNotifications: client.whatsappNotifications !== undefined ? client.whatsappNotifications : true,
      emailNotifications: client.emailNotifications !== undefined ? client.emailNotifications : false,
    });
    setClientAvatarFile(null);
    setShowClientForm(true);
  };

  const handleNewClientClick = () => {
    setEditingClientId(null);
    setClientForm({
      name: '',
      email: '',
      phone: '',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
      birthday: '',
      gender: 'Feminino',
      instagram: '',
      whatsappNotifications: true,
      emailNotifications: false,
    });
    setClientAvatarFile(null);
    setShowClientForm(true);
  };

  const [confirmingApptId, setConfirmingApptId] = useState<string | null>(null);
  const [isHoursOpen, setIsHoursOpen] = useState(false);
  const [isBannerOpen, setIsBannerOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isAppointmentsOpen, setIsAppointmentsOpen] = useState(true);
  const [isStaffOpen, setIsStaffOpen] = useState(true);
  const [isServicesOpen, setIsServicesOpen] = useState(true);
  const [isBillingKPIsOpen, setIsBillingKPIsOpen] = useState(true);
  const [isBillingChartsOpen, setIsBillingChartsOpen] = useState(true);
  const [bannerUploadMsg, setBannerUploadMsg] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'days' | 'weeks'>('days');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'CONFIRMADO'>('CONFIRMADO');
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStylistId, setEditingStylistId] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState({ name: '', avatar: '' });
  const [avatarFile, setAvatarFile] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [showDashboardServiceForm, setShowDashboardServiceForm] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: '', durationMinutes: '', icon: 'Scissors' });

  const getServiceIcon = (iconName: string) => {
    const iconObj = SALON_ICONS.find(i => i.name === iconName);
    return iconObj ? iconObj.component : Scissors;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarFile(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStaff = () => {
    if (!newStaff.name) return;
    
    const stylistInfo = {
      name: newStaff.name,
      avatar: avatarFile || newStaff.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newStaff.name)}&background=fdf2f8&color=ec4899`,
      rating: 5.0,
      services: selectedServices.length > 0 ? selectedServices : [allServices[0].id]
    };

    if (editingStylistId) {
      updateStylist(editingStylistId, stylistInfo);
    } else {
      addStylist(stylistInfo);
    }

    setShowStaffForm(false);
    setEditingStylistId(null);
    setNewStaff({ name: '', avatar: '' });
    setAvatarFile(null);
    setSelectedServices([]);
  };

  const handleEditStaffClick = (stylist: any) => {
    setEditingStylistId(stylist.id);
    setNewStaff({ name: stylist.name, avatar: stylist.avatar });
    setAvatarFile(stylist.avatar);
    setSelectedServices(stylist.services);
    setShowStaffForm(true);
  };

  const handleAddService = () => {
    if (!newService.name) return;
    const price = parseFloat(newService.price) || 0;
    const durationMinutes = parseInt(newService.durationMinutes) || 30;
    
    addService({
      name: newService.name,
      price,
      durationMinutes,
      icon: newService.icon || 'Scissors'
    });
    
    setNewService({ name: '', price: '', durationMinutes: '', icon: 'Scissors' });
    setShowNewServiceForm(false);
    setShowDashboardServiceForm(false);
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Calcular faturamento e estatísticas do salão
  const todayRef = new Date();
  const startOfCurrentWeek = startOfWeek(todayRef, { weekStartsOn: 0 });
  const endOfCurrentWeek = endOfWeek(todayRef, { weekStartsOn: 0 });

  const currentWeekDays = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek });

  // 1. Data do faturamento diário desta semana (Domingo a Sábado)
  const dailyBillingData = currentWeekDays.map(day => {
    const dayAppointments = appointments.filter(appt => {
      if (selectedStatusFilter === 'CONFIRMADO' && appt.status !== 'CONFIRMADO') return false;
      if (appt.status === 'CANCELADO') return false;
      const apptDate = new Date(appt.date);
      return isSameDay(apptDate, day);
    });

    const revenue = dayAppointments.reduce((sum, appt) => {
      const service = allServices.find(s => s.id === appt.serviceId);
      return sum + (service?.price || 0);
    }, 0);

    const count = dayAppointments.length;
    const rawLabel = format(day, 'eee', { locale: ptBR });
    const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
    const fullDateStr = format(day, 'dd/MM');

    return {
      name: `${label} (${fullDateStr})`,
      'Faturamento (R$)': revenue,
      'Agendamentos': count
    };
  });

  // 2. Data de evolução por semana (últimas 4 semanas)
  const weeklyBillingData = [3, 2, 1, 0].map(weeksAgo => {
    const start = startOfWeek(subWeeks(todayRef, weeksAgo), { weekStartsOn: 0 });
    const end = endOfWeek(subWeeks(todayRef, weeksAgo), { weekStartsOn: 0 });

    const weekAppointments = appointments.filter(appt => {
      if (selectedStatusFilter === 'CONFIRMADO' && appt.status !== 'CONFIRMADO') return false;
      if (appt.status === 'CANCELADO') return false;
      const apptDate = new Date(appt.date);
      return apptDate >= start && apptDate <= end;
    });

    const revenue = weekAppointments.reduce((sum, appt) => {
      const service = allServices.find(s => s.id === appt.serviceId);
      return sum + (service?.price || 0);
    }, 0);

    const count = weekAppointments.length;
    const label = `Semana-${4 - weeksAgo}`;
    const range = `${format(start, 'dd/MM')} - ${format(end, 'dd/MM')}`;

    return {
      name: `${label} (${range})`,
      'Faturamento (R$)': revenue,
      'Agendamentos': count
    };
  });

  // 3. KPIs Gerais
  const currentWeekRevenue = dailyBillingData.reduce((sum, item) => sum + item['Faturamento (R$)'], 0);
  const currentWeekAppointmentsCount = dailyBillingData.reduce((sum, item) => sum + item['Agendamentos'], 0);
  const averageTicket = currentWeekAppointmentsCount > 0 ? (currentWeekRevenue / currentWeekAppointmentsCount) : 0;

  // Serviço mais lucrativo da semana
  const serviceRevenueMap: Record<string, number> = {};
  appointments.forEach(appt => {
    if (selectedStatusFilter === 'CONFIRMADO' && appt.status !== 'CONFIRMADO') return;
    if (appt.status === 'CANCELADO') return;
    const apptDate = new Date(appt.date);
    if (apptDate >= startOfCurrentWeek && apptDate <= endOfCurrentWeek) {
      const service = allServices.find(s => s.id === appt.serviceId);
      if (service) {
        serviceRevenueMap[service.name] = (serviceRevenueMap[service.name] || 0) + service.price;
      }
    }
  });

  let mostLucrativeService = 'Nenhum';
  let highestServiceRevenue = 0;
  Object.entries(serviceRevenueMap).forEach(([serviceName, rev]) => {
    if (rev > highestServiceRevenue) {
      highestServiceRevenue = rev;
      mostLucrativeService = serviceName;
    }
  });

  // Faturamento Geral Acumulado (todos os agendamentos ativos)
  const totalAccumulatedRevenue = appointments
    .filter(appt => {
      if (selectedStatusFilter === 'CONFIRMADO' && appt.status !== 'CONFIRMADO') return false;
      if (appt.status === 'CANCELADO') return false;
      return true;
    })
    .reduce((sum, appt) => {
      const service = allServices.find(s => s.id === appt.serviceId);
      return sum + (service?.price || 0);
    }, 0);

  // Calcula periodo ativo de faturamento para profissionais
  const activePeriodStart = billingPeriod === 'days' 
    ? startOfCurrentWeek 
    : startOfWeek(subWeeks(todayRef, 3), { weekStartsOn: 0 });
  const activePeriodEnd = endOfCurrentWeek;

  // Faturamento por profissional no periodo selecionado
  const stylistRevenueData = allStylists.map(stylist => {
    const stylistAppointments = appointments.filter(appt => {
      if (selectedStatusFilter === 'CONFIRMADO' && appt.status !== 'CONFIRMADO') return false;
      if (appt.status === 'CANCELADO') return false;
      
      const apptDate = new Date(appt.date);
      return apptDate >= activePeriodStart && apptDate <= activePeriodEnd && appt.stylistId === stylist.id;
    });

    const revenue = stylistAppointments.reduce((sum, appt) => {
      const service = allServices.find(s => s.id === appt.serviceId);
      return sum + (service?.price || 0);
    }, 0);

    const count = stylistAppointments.length;
    const ticket = count > 0 ? (revenue / count) : 0;

    return {
      id: stylist.id,
      name: stylist.name,
      avatar: stylist.avatar,
      'Faturamento (R$)': revenue,
      'Agendamentos': count,
      ticket
    };
  }).sort((a, b) => b['Faturamento (R$)'] - a['Faturamento (R$)']);

  const activeChartData = billingPeriod === 'days' ? dailyBillingData : weeklyBillingData;
  const xAxisKey = 'name';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 text-white pt-10 pb-6 px-4 sm:px-6 rounded-b-[30px] shadow-lg sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center space-x-2">
              <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors">
                <ChevronLeft size={22} />
              </button>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">Painel do Admin</h1>
            </div>
            {/* Show a mini signout button for admin screens in mobile layouts */}
            {currentUser?.role === 'ADMIN' && (
              <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-350 font-bold tracking-wide px-2.5 py-1 rounded-full sm:hidden">
                Admin do Salão
              </span>
            )}
          </div>

          {/* Multitenancy Selection Controls */}
          {currentUser?.role === 'SUPER_ADMIN' ? (
            <div className="flex items-center space-x-2 shrink-0 bg-slate-800/80 p-1.5 rounded-full border border-slate-750/80 max-w-full">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 pl-2.5 shrink-0 hidden xs:inline">Filtrar Salão:</span>
              <select
                value={selectedSalonId}
                onChange={(e) => setSelectedSalonId(e.target.value)}
                className="bg-slate-900 border border-transparent hover:border-slate-700 text-pink-300 font-extrabold text-xs px-3 py-1.5 rounded-full outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer min-w-[170px]"
              >
                <option value="ALL">🌌 Todos os Salões (Consolidado)</option>
                {salons?.map(s => (
                  <option key={s.id} value={s.id}>
                    💇‍♀️ {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
              <div className="bg-gradient-to-r from-pink-500 to-indigo-600 px-3 py-1.5 rounded-full text-[11px] font-black tracking-wide shadow-md flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shrink-0"></span>
                🏫 {mySalon?.name || 'Vogue Salão Principal'}
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="bg-slate-800/50 rounded-2xl p-2.5 sm:p-3 border border-slate-700">
            <div className="text-slate-400 mb-0.5"><CalendarIcon size={14} /></div>
            <div className="text-base sm:text-lg font-black">{appointments.length}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-450 font-bold truncate">Agenda</div>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-2.5 sm:p-3 border border-slate-700">
            <div className="text-slate-400 mb-0.5"><Users size={14} /></div>
            <div className="text-base sm:text-lg font-black">{allStylists.length}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-450 font-bold truncate">Equipe</div>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-2.5 sm:p-3 border border-slate-700">
            <div className="text-pink-400 mb-0.5"><Users size={14} /></div>
            <div className="text-base sm:text-lg font-black text-pink-400">{(clients || []).length}</div>
            <div className="text-[9px] sm:text-[10px] text-slate-450 font-bold truncate">Clientes</div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
        {/* Menu do Painel Admin */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 shadow-inner overflow-x-auto whitespace-nowrap scrollbar-none flex-nowrap">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 shrink-0 min-w-[76px] sm:min-w-0 flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
              activeTab === 'appointments'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarIcon size={12} className="mb-0.5 sm:mb-0" />
            <span>Agenda</span>
          </button>
          
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex-1 shrink-0 min-w-[76px] sm:min-w-0 flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
              activeTab === 'staff'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={12} className="mb-0.5 sm:mb-0" />
            <span>Equipe</span>
          </button>
          
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 shrink-0 min-w-[76px] sm:min-w-0 flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
              activeTab === 'services'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scissors size={12} className="mb-0.5 sm:mb-0" />
            <span>Serviços</span>
          </button>
          
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex-1 shrink-0 min-w-[84px] sm:min-w-0 flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
              activeTab === 'billing'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign size={12} className="mb-0.5 sm:mb-0" />
            <span>Finanças</span>
          </button>
 
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex-1 shrink-0 min-w-[76px] sm:min-w-0 flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
              activeTab === 'clients'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smile size={12} className="mb-0.5 sm:mb-0" />
            <span>Clientes</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 shrink-0 min-w-[76px] sm:min-w-0 flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings size={12} className="mb-0.5 sm:mb-0" />
            <span>Ajustes</span>
          </button>
        </div>

        {/* Conteúdo Aba: Agenda */}
        {activeTab === 'appointments' && (
          <div className="space-y-6 pb-12">
            {/* Visão de Agenda com Calendário Dinâmico */}
            <AdminCalendarView 
              appointments={appointments}
              allStylists={allStylists}
              allServices={allServices}
              updateAppointmentStatus={updateAppointmentStatus}
              confirmingApptId={confirmingApptId}
              setConfirmingApptId={setConfirmingApptId}
            />

            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-150">
              <button
                type="button"
                onClick={() => setIsAppointmentsOpen(!isAppointmentsOpen)}
                className="w-full flex items-center justify-between text-left focus:outline-none"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                      Agendamentos Recentes
                      <span className="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                        Agenda
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">Gerencie os agendamentos de clientes em tempo real</p>
                  </div>
                </div>
                <div className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors ml-2 shrink-0">
                  {isAppointmentsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {isAppointmentsOpen && (
                <div className="mt-5 pt-5 border-t border-slate-100 space-y-4 animate-fadeIn">
                  <div className="space-y-4">
                    {appointments.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-8 text-center text-slate-400">
                        <CalendarIcon size={32} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-semibold">Nenhum agendamento realizado</p>
                      </div>
                    ) : (
                      appointments.map(appt => {
                        const stylist = allStylists.find(s => s.id === appt.stylistId);
                        const service = allServices.find(s => s.id === appt.serviceId);
                        const date = new Date(appt.date);
                        
                        // Pull client name & generate initials
                        const clientName = appt.clientName || (appt.clientId === currentUser?.id ? currentUser?.name : `Cliente ${appt.clientId}`);
                        const initials = clientName
                          .split(' ')
                          .filter(Boolean)
                          .map(namePart => namePart[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'CL';

                        return (
                          <div key={appt.id} className="bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between transition-colors mt-2">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                {initials}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{clientName}</h4>
                                <p className="text-xs text-slate-500">{service?.name} com {stylist?.name}</p>
                                <p className="text-[11px] text-slate-400 font-medium mt-1">
                                  {format(date, "dd MMM', ' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1.5">
                              <div className={`px-2 py-1 rounded text-[10px] font-bold ${
                                appt.status === 'CONFIRMADO' 
                                  ? 'bg-green-100 text-green-700' 
                                  : appt.status === 'CANCELADO'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-orange-100 text-orange-700'
                              }`}>
                                {appt.status}
                              </div>
                              {appt.status !== 'CANCELADO' && (
                                confirmingApptId === appt.id ? (
                                  <div className="flex items-center space-x-1.5 mt-0.5">
                                    <button
                                      onClick={() => {
                                        updateAppointmentStatus(appt.id, 'CANCELADO');
                                        setConfirmingApptId(null);
                                      }}
                                      className="text-[9px] font-extrabold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition-all"
                                    >
                                      Sim, cancelar
                                    </button>
                                    <button
                                      onClick={() => setConfirmingApptId(null)}
                                      className="text-[9px] font-bold text-slate-400 hover:text-slate-600"
                                    >
                                      Voltar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmingApptId(appt.id)}
                                    className="text-[9px] font-bold text-red-500 hover:text-red-700 hover:underline transition-all"
                                  >
                                    Desmarcar
                                  </button>
                                )
                              )}
                              {appt.status === 'CANCELADO' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appt.id, 'CONFIRMADO')}
                                  className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
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
              )}
            </div>
          </div>
        )}

        {/* Conteúdo Aba: Equipe */}
        {activeTab === 'staff' && (
          <div className="space-y-4 pb-12">
            <div className="bg-white rounded-[24px] p-4 sm:p-5 shadow-sm border border-slate-150">
              <div className="w-full flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffOpen(!isStaffOpen)}
                  className="flex-1 flex items-center text-left focus:outline-none min-w-0"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Users size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-slate-950 text-xs sm:text-xs md:text-sm flex items-center gap-1.5 flex-wrap">
                        Diretório da Equipe
                        <span className="bg-indigo-100 text-indigo-700 text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase whitespace-nowrap">
                          Equipe
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold truncate">Visualize e gerencie as fotos e especialidades dos profissionais</p>
                    </div>
                  </div>
                  <div className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors ml-1 sm:ml-2 shrink-0">
                    {isStaffOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>
                
                {/* Trigger button always visible next to title for usability */}
                <button 
                  onClick={() => {
                    setEditingStylistId(null);
                    setNewStaff({ name: '', avatar: '' });
                    setAvatarFile(null);
                    setSelectedServices([]);
                    setShowStaffForm(true);
                  }}
                  className="flex items-center text-[10px] sm:text-[11px] font-extrabold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all border border-indigo-100 select-none ml-1.5 sm:ml-2 shrink-0 animate-fadeIn"
                >
                  <Plus size={12} className="mr-0.5 sm:mr-1" /> Adicionar
                </button>
              </div>

              {isStaffOpen && (
                <div className="mt-5 pt-5 border-t border-slate-100 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {allStylists.map(stylist => (
                      <div key={stylist.id} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center relative group transition-colors">
                        <div className="absolute top-2 right-2 flex items-center space-x-1">
                          <button 
                            onClick={() => handleEditStaffClick(stylist)}
                            className="p-1 px-1.5 bg-white text-indigo-600 rounded-full shadow-sm hover:bg-indigo-50 transition-colors border border-slate-100"
                            title="Editar Funcionário"
                          >
                            <Edit size={11} className="inline mr-0.5" /> <span className="text-[9px] font-bold">Editar</span>
                          </button>
                          <button 
                            onClick={() => removeStylist(stylist.id)}
                            className="p-1 bg-white text-red-550 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors border border-slate-100"
                            title="Remover Funcionário"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                        <img src={stylist.avatar} alt={stylist.name} className="w-16 h-16 rounded-full mt-4 mb-3 object-cover shadow-sm bg-slate-100" />
                        <h4 className="font-bold text-slate-900 text-sm">{stylist.name}</h4>
                        <p className="text-xs text-slate-500 mb-2">{stylist.services.length} serviços habilitados</p>
                        <div className="flex items-center text-yellow-500 text-xs font-bold bg-white px-2 py-0.5 rounded-full shadow-xs border border-slate-100 mb-1">
                          ★ {stylist.rating}
                        </div>

                        <button 
                          type="button"
                          onClick={() => handleShareStylistAgenda(stylist.id)}
                          className={`w-full mt-2.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all flex items-center justify-center space-x-1 border ${
                            copiedStylistId === stylist.id 
                              ? 'bg-green-500 hover:bg-green-600 border-green-500 text-white font-black' 
                              : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-100 text-indigo-700 hover:text-indigo-850'
                          }`}
                        >
                          <Share2 size={11} />
                          <span>{copiedStylistId === stylist.id ? 'COPIADO!' : 'AGENDA ON-LINE'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo Aba: Serviços */}
        {activeTab === 'services' && (
          <div className="space-y-4 pb-12">
            <div className="bg-white rounded-[24px] p-4 sm:p-5 shadow-sm border border-slate-150">
              <div className="w-full flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                  className="flex-1 flex items-center text-left focus:outline-none min-w-0"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Scissors size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-slate-950 text-xs sm:text-xs md:text-sm flex items-center gap-1.5 flex-wrap">
                        Gerenciamento de Serviços
                        <span className="bg-indigo-100 text-indigo-700 text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase whitespace-nowrap">
                          Serviços
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold truncate">Configure preços, tempos estimados e ícones dos procedimentos</p>
                    </div>
                  </div>
                  <div className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors ml-1 sm:ml-2 shrink-0">
                    {isServicesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>
                
                <button 
                  onClick={() => {
                    setShowDashboardServiceForm(prev => !prev);
                    setNewService({ name: '', price: '', durationMinutes: '', icon: 'Scissors' });
                  }}
                  className="flex items-center text-[10px] sm:text-[11px] font-extrabold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all border border-indigo-100 select-none ml-1.5 sm:ml-2 shrink-0 shadow-xs animate-fadeIn"
                >
                  {showDashboardServiceForm ? 'Fechar Form' : <><Plus size={12} className="mr-0.5 sm:mr-1" /> Adicionar</>}
                </button>
              </div>

              {isServicesOpen && (
                <div className="mt-5 pt-5 border-t border-slate-100 animate-fadeIn space-y-4">
                  {showDashboardServiceForm && (
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-indigo-150 shadow-xs mb-4 space-y-3">
                      <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider text-[9px]">Criar Novo Serviço</h3>
                      <div className="grid grid-cols-1 gap-2">
                        <input 
                          type="text"
                          placeholder="Nome (ex: Sobrancelha, Manicure)" 
                          value={newService.name} 
                          onChange={e => setNewService({...newService, name: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                        />
                        <div className="flex gap-2">
                          <input 
                            type="number"
                            placeholder="Preço (R$)" 
                            value={newService.price} 
                            onChange={e => setNewService({...newService, price: e.target.value})}
                            className="w-1/2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                          />
                          <input 
                            type="number"
                            placeholder="Duração (minutos)" 
                            value={newService.durationMinutes} 
                            onChange={e => setNewService({...newService, durationMinutes: e.target.value})}
                            className="w-1/2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>
                      
                      {/* Escolha do Ícone */}
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Ícone para o Serviço</span>
                        <div className="grid grid-cols-5 gap-1.5 bg-slate-100/55 border border-slate-200 p-2 rounded-xl">
                          {SALON_ICONS.map(iconObj => {
                            const IconComp = iconObj.component;
                            const isSelected = newService.icon === iconObj.name;
                            return (
                              <button
                                key={iconObj.name}
                                type="button"
                                title={iconObj.label}
                                onClick={() => setNewService({ ...newService, icon: iconObj.name })}
                                className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all border ${
                                  isSelected
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600 font-bold'
                                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 shadow-xs'
                                }`}
                              >
                                <IconComp size={16} />
                                <span className="text-[9px] mt-0.5 select-none truncate max-w-full font-medium">{iconObj.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1 font-semibold">
                        <button 
                          onClick={() => setShowDashboardServiceForm(false)} 
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleAddService} 
                          disabled={!newService.name} 
                          className="px-3 py-1.5 text-xs font-black bg-indigo-600 text-white rounded-xl disabled:bg-slate-350 shadow-xs hover:bg-indigo-700 transition-colors"
                        >
                          Salvar Serviço
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allServices.map(service => {
                      const IconComp = getServiceIcon(service.icon);
                      return (
                        <div key={service.id} className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white border border-slate-100 shadow-xs text-indigo-600 rounded-xl flex items-center justify-center">
                              <IconComp size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{service.name}</h4>
                              <p className="text-xs text-slate-500">R$ {service.price.toFixed(2)} • {service.durationMinutes} min</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeService(service.id)}
                            className="p-1.5 bg-white border border-slate-100 text-red-500 rounded-full hover:bg-red-50 hover:text-red-700 shadow-xs transition-all"
                            title="Excluir Serviço"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo Aba: Faturamento e Estatísticas */}
        {activeTab === 'billing' && (
          <div className="space-y-6 pb-12">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Faturamento e Métricas</h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Acompanhe a receita gerada com base nos serviços agendados registrados em seu salão</p>
            </div>

            {/* Painel A: KPIs e Métricas de Receita */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-150">
              <button
                type="button"
                onClick={() => setIsBillingKPIsOpen(!isBillingKPIsOpen)}
                className="w-full flex items-center justify-between text-left focus:outline-none"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                      Métricas Gerais e KPIs Financeiros
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                        KPIs
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">Resumo sobre faturamento total, tíquete médio e produtividade semanal</p>
                  </div>
                </div>
                <div className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors ml-2 shrink-0">
                  {isBillingKPIsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {isBillingKPIsOpen && (
                <div className="mt-5 pt-5 border-t border-slate-100 space-y-5 animate-fadeIn">
                  {/* Overall cumulative statistic tag inside expanded view */}
                  <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-black uppercase text-emerald-700 tracking-wider">Faturamento Geral Total Acumulado</span>
                      <span className="block text-xl font-black text-emerald-950">R$ {totalAccumulatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <DollarSign size={18} />
                    </div>
                  </div>

                  {/* KPIs Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Weekly revenue */}
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-650 rounded-3xl p-5 text-white shadow-md border border-indigo-600/50 relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-15 rotate-12">
                        <DollarSign size={90} className="stroke-white" />
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase text-indigo-100 tracking-wider">Faturamento Semanal</span>
                        <span className="p-1 px-2 text-[8px] font-black bg-white/20 rounded-full uppercase tracking-widest text-indigo-50">Desta Semana</span>
                      </div>
                      <div className="text-2.5xl font-black">
                        R$ {currentWeekRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <p className="text-[9px] text-indigo-100/85 mt-2 font-bold uppercase tracking-wide">Domingo a Sábado</p>
                    </div>

                    {/* Weekly appointments count */}
                    <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-150 relative overflow-hidden">
                      <div className="absolute right-3 top-3 text-slate-200">
                        <Activity size={24} />
                      </div>
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Atendimentos Semanais</div>
                      <div className="text-2.5xl font-black text-slate-900">
                        {currentWeekAppointmentsCount} {currentWeekAppointmentsCount === 1 ? 'Sessão' : 'Sessões'}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wide">Agendamentos no período</p>
                    </div>

                    {/* Weekly average ticket */}
                    <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-150 relative overflow-hidden">
                      <div className="absolute right-3 top-3 text-slate-200">
                        <TrendingUp size={24} />
                      </div>
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Ticket Médio (Semanal)</div>
                      <div className="text-2.5xl font-black text-slate-900">
                        R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wide">Média por atendimento</p>
                    </div>

                    {/* Most lucrative service */}
                    <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-150 relative overflow-hidden">
                      <div className="absolute right-3 top-3 text-slate-200">
                        <Award size={24} />
                      </div>
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Serviço Mais Rentável</div>
                      <div className="text-base sm:text-base font-black text-pink-600 truncate mr-6">
                        {mostLucrativeService}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-3.5 font-bold uppercase tracking-wide">Líder em receita na semana</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Painel B: Gráficos, Gráfico de Barras e Ranking por Profissional */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-150">
              <button
                type="button"
                onClick={() => setIsBillingChartsOpen(!isBillingChartsOpen)}
                className="w-full flex items-center justify-between text-left focus:outline-none"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                      Análise de Desempenho e Gráficos
                      <span className="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                        Gráficos
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">Visualização gráfica do faturamento e ranking com participação da equipe</p>
                  </div>
                </div>
                <div className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors ml-2 shrink-0">
                  {isBillingChartsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {isBillingChartsOpen && (
                <div className="mt-5 pt-5 border-t border-slate-100 space-y-6 animate-fadeIn">
                  {/* Chart Control Bar */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Grouping Toggle */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Agrupamento do Gráfico</span>
                      <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setBillingPeriod('days')}
                          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${
                            billingPeriod === 'days'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Faturamento Diário
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingPeriod('weeks')}
                          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${
                            billingPeriod === 'weeks'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Por Semana (Último Mês)
                        </button>
                      </div>
                    </div>

                    {/* Status Filter Toggle */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Filtro de Agendamento</span>
                      <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedStatusFilter('CONFIRMADO')}
                          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${
                            selectedStatusFilter === 'CONFIRMADO'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Apenas Confirmados
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStatusFilter('ALL')}
                          className={`flex-1 sm:flex-none px-4 py-3 rounded-lg text-xs font-black transition-all ${
                            selectedStatusFilter === 'ALL'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Todos os Ativos
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Premium Chart Card */}
                  <div className="bg-slate-50/50 rounded-[24px] p-6 border border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">Evolução de Faturamento (R$)</h3>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {billingPeriod === 'days' 
                            ? 'Faturamento diário acumulado e tickets' 
                            : 'Faturamento por semanas'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500">
                          <span className="w-3 h-3 rounded bg-indigo-500 block"></span>
                          <span>Faturamento (R$)</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500">
                          <span className="w-3 h-3 rounded bg-pink-400 block"></span>
                          <span>Agendamentos</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-[320px] pr-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={activeChartData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                            </linearGradient>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#ec4899" stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey={xAxisKey} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 750 }}
                            tickFormatter={(val) => `R$${val}`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey="Faturamento (R$)" 
                            stroke="#4f46e5" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="Agendamentos" 
                            stroke="#ec4899" 
                            strokeWidth={2.5} 
                            fillOpacity={1} 
                            fill="url(#colorCount)" 
                            strokeDasharray="4 4" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Faturamento por Profissional - Gráfico e Detalhes */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Gráfico de Barras Horizontal */}
                    <div className="lg:col-span-5 bg-slate-50/50 rounded-2xl p-5 border border-slate-105 flex flex-col">
                      <div className="mb-4">
                        <h3 className="font-extrabold text-slate-900 text-sm">Faturamento por Profissional</h3>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Receita direta gerada por colaborador
                        </span>
                      </div>

                      <div className="flex-1 w-full min-h-[240px]">
                        {stylistRevenueData.some(s => s['Faturamento (R$)'] > 0) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              data={stylistRevenueData} 
                              layout="vertical" 
                              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                              <XAxis 
                                type="number" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
                                tickFormatter={(val) => `R$${val}`}
                              />
                              <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#475569', fontSize: 11, fontWeight: 800 }} 
                                width={110}
                              />
                              <Tooltip 
                                formatter={(value) => [`R$ ${parseFloat(value as string).toFixed(2)}`, 'Faturamento']}
                                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                              />
                              <Bar dataKey="Faturamento (R$)" fill="#4f46e5" radius={[0, 6, 6, 0]} barSize={16} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-450 p-6 text-center select-none min-h-[200px]">
                            <Users size={32} className="text-slate-300 mb-1.5" />
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Sem Faturamento</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">Nenhum ganho registrado para profissionais no período ativo.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ranking & Detalhes com Barras de Participação */}
                    <div className="lg:col-span-7 bg-slate-50/50 rounded-2xl p-5 border border-slate-105 flex flex-col">
                      <div className="mb-4">
                        <h3 className="font-extrabold text-slate-900 text-sm">Desempenho e Participação</h3>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Ranking de vendas e tíquete médio por colaborador
                        </span>
                      </div>

                      <div className="space-y-3.5 overflow-y-auto max-h-[280px] pr-1">
                        {stylistRevenueData.map((stylist, index) => {
                          const periodTotal = stylistRevenueData.reduce((sum, s) => sum + s['Faturamento (R$)'], 0);
                          const pct = periodTotal > 0 ? (stylist['Faturamento (R$)'] / periodTotal) * 100 : 0;
                          
                          return (
                            <div key={stylist.id} className="p-3.5 bg-white rounded-2xl border border-slate-100 transition-colors">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center space-x-3 min-w-0">
                                  <div className="relative">
                                    <img 
                                      src={stylist.avatar} 
                                      alt={stylist.name} 
                                      className="w-10 h-10 rounded-full object-cover border-2 border-white ring-1 ring-slate-200"
                                      referrerPolicy="no-referrer"
                                    />
                                    {index === 0 && stylist['Faturamento (R$)'] > 0 && (
                                      <span className="absolute -top-1.5 -right-1 bg-amber-400 text-white p-0.5 rounded-full shadow-xs" title="Destaque de Receita">
                                        <Crown size={10} className="fill-white" />
                                      </span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="block text-xs font-black text-slate-800 truncate leading-snug">{stylist.name}</span>
                                    <span className="text-[9px] font-black uppercase text-indigo-600/80 tracking-wide">
                                      {stylist.Agendamentos} {stylist.Agendamentos === 1 ? 'atendimento' : 'atendimentos'}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="block text-xs font-black text-slate-900">
                                    R$ {stylist['Faturamento (R$)'].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">
                                    Tíquete Médio: R$ {stylist.ticket.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {/* Percentage bar with customizable labels */}
                              <div className="mt-2.5">
                                <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                  <span>Participação no Salão</span>
                                  <span className="font-extrabold text-indigo-600">{pct.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      index === 0 ? 'bg-indigo-600' : index === 1 ? 'bg-pink-500' : 'bg-slate-400'
                                    }`} 
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Business insight breakdown list */}
                  <div className="bg-slate-100/50 rounded-2xl p-4 border border-slate-150">
                    <h4 className="font-extrabold text-slate-800 text-sm mb-3 tracking-tight">Análise e Insights de Receita</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-150 flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                          <Activity size={15} />
                        </div>
                        <div>
                          <span className="block text-[11px] font-black text-slate-800">Detalhamento Semanal</span>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-bold">
                            O faturamento desta semana está em <span className="text-indigo-600 font-extrabold">R$ {currentWeekRevenue.toFixed(2)}</span> proveniente de {currentWeekAppointmentsCount} atendimentos ativos. Incentive promoções em dias de menor movimento configurando o expediente em Ajustes.
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-150 flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-700 flex items-center justify-center shrink-0">
                          <TrendingUp size={15} />
                        </div>
                        <div>
                          <span className="block text-[11px] font-black text-slate-800">Oportunidade e Alavancagem</span>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-bold">
                            {mostLucrativeService !== 'Nenhum' ? (
                              <>O serviço <span className="text-pink-600 font-extrabold">{mostLucrativeService}</span> lidera a receita do salão nesta semana. Que tal criar combos ou pacotes recorrentes incluindo este serviço para alavancar seu faturamento?</>
                            ) : (
                              <>Nenhum serviço gerou faturamento ativo nesta semana. Agende e confirme atendimentos com os clientes ou utilize os ajustes rápidos para configurar expedientes.</>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo Aba: Personalizar/Ajustes */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Configurações do Sistema</h2>
            
            <div className="space-y-4 pb-12">
              {/* Preferências e Notificações Gerais do Sistema (Agrupado) */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-150">
                <button
                  type="button"
                  onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
                  className="w-full flex items-center justify-between text-left focus:outline-none"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Settings size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                        Preferências e Notificações
                        <span className="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                          Sistema
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold">Lembretes por WhatsApp, Agendamentos Recorrentes e Link do Salão</p>
                    </div>
                  </div>
                  <div className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors ml-2 shrink-0">
                    {isPreferencesOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isPreferencesOpen && (
                  <div className="mt-5 pt-5 border-t border-slate-100 space-y-4 animate-fadeIn">
                    {/* WhatsApp reminders switch (demo) */}
                    <div className="bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                          <MessageCircle size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Lembretes no WhatsApp</h4>
                          <p className="text-[11px] text-slate-500">Envio automático inteligente para clientes 24h antes do horário marcado</p>
                        </div>
                      </div>
                      <div className="w-10 h-5 bg-green-500 rounded-full relative cursor-pointer shrink-0">
                        <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>

                    {/* Recurring bookings switch (demo) */}
                    <div className="bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Repeat size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Agendamentos Recorrentes</h4>
                          <p className="text-[11px] text-slate-500">Permitir planos recorrentes (diário, semanal, quinzenal) para fidelizar</p>
                        </div>
                      </div>
                      <div className="w-10 h-5 bg-blue-500 rounded-full relative cursor-pointer shrink-0">
                        <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>

                    {/* Custom Salon Link (demo) */}
                    <div className="bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Settings size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Link Personalizado do Salão</h4>
                          <p className="text-[11px] text-slate-500">Link público: <span className="font-bold text-indigo-600 animate-pulse">agende.com/salao-do-joao</span></p>
                        </div>
                      </div>
                      <button className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                        Editar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Gerenciamento do Banner Principal */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-150 mt-6 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => setIsBannerOpen(!isBannerOpen)}
                  className="w-full flex items-center justify-between text-left focus:outline-none"
                >
                  <div className="flex items-start space-x-2.5">
                    <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                      <Image size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                        Banner da Página Principal
                        <span className="bg-pink-100 text-pink-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                          Aplicativo
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold">Personalize em tempo real a oferta principal, cores, textos e imagem em destaque no topo da tela do cliente</p>
                    </div>
                  </div>
                  <div className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors ml-2 shrink-0">
                    {isBannerOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isBannerOpen && (
                  <div className="mt-5 pt-5 border-t border-slate-100 space-y-5 animate-fadeIn">
                    {/* Banner Real-time Live Preview */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">Pré-visualização do Banner:</span>
                      
                      <div 
                        className={`relative rounded-2xl p-5 overflow-hidden text-white shadow-md transition-all ${
                          bannerConfig.bgColor && bannerConfig.bgColor.startsWith('bg-') ? bannerConfig.bgColor : 'bg-pink-500'
                        }`}
                        style={bannerConfig.bgColor && !bannerConfig.bgColor.startsWith('bg-') ? { backgroundColor: bannerConfig.bgColor } : {}}
                      >
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3"></div>
                        <div className="absolute bottom-0 right-14 w-12 h-12 bg-white/10 rounded-full translate-y-1/3"></div>
                        
                        <div className="relative z-10 w-1/2">
                          {bannerConfig.discountLabel && (
                            <p className="text-[10px] font-semibold mb-0.5 opacity-90 uppercase tracking-wider">{bannerConfig.discountLabel}</p>
                          )}
                          <h2 className="text-2xl font-extrabold mb-0.5 leading-none tracking-tight break-words">
                            {bannerConfig.title || "Beleza"}
                          </h2>
                          {bannerConfig.subtitle && (
                            <p className="text-[8px] font-bold tracking-widest uppercase opacity-95">{bannerConfig.subtitle}</p>
                          )}
                        </div>
                        {bannerConfig.imageUrl && (
                          <img
                            src={bannerConfig.imageUrl}
                            alt="Preview"
                            className="absolute right-0 bottom-0 w-1/2 h-[120%] object-cover object-left"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                    </div>

                    {/* Editor Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Column: Text Inputs */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Rótulo de Oferta (ex: ATÉ, NOVIDADE)</label>
                          <input 
                            type="text"
                            value={bannerConfig.discountLabel}
                            onChange={(e) => updateBannerConfig({ discountLabel: e.target.value })}
                            placeholder="Ex: ATÉ ou ESPECIAL"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-pink-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Título em Destaque (ex: 45%, Corte VIP)</label>
                          <input 
                            type="text"
                            value={bannerConfig.title}
                            onChange={(e) => updateBannerConfig({ title: e.target.value })}
                            placeholder="Ex: 45% ou Desconto Especial"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-pink-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Subtítulo do Banner</label>
                          <input 
                            type="text"
                            value={bannerConfig.subtitle}
                            onChange={(e) => updateBannerConfig({ subtitle: e.target.value })}
                            placeholder="Ex: EM TODOS OS PACOTES"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-pink-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Right Column: Style & Images */}
                      <div className="space-y-3">
                        {/* Background Presets */}
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Cor de Fundo do Banner</label>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {[
                              { name: 'Rosa Vibrante', class: 'bg-pink-500' },
                              { name: 'Índigo Elegante', class: 'bg-indigo-600' },
                              { name: 'Esmeralda', class: 'bg-emerald-600' },
                              { name: 'Púrpura VIP', class: 'bg-purple-600' },
                              { name: 'Escuro Premium', class: 'bg-slate-900' },
                            ].map((color) => (
                              <button
                                key={color.class}
                                type="button"
                                onClick={() => updateBannerConfig({ bgColor: color.class })}
                                className={`px-2 py-0.5 rounded text-[9px] font-bold text-white transition-all ${color.class} ${
                                  bannerConfig.bgColor === color.class ? 'ring-2 ring-offset-2 ring-pink-500 scale-105' : 'opacity-85 hover:opacity-100'
                                }`}
                              >
                                {color.name}
                              </button>
                            ))}
                          </div>
                          <input 
                            type="text"
                            value={bannerConfig.bgColor}
                            onChange={(e) => updateBannerConfig({ bgColor: e.target.value })}
                            placeholder="Ou digite outra classe tailwind (ex: bg-red-500) ou cor hex"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-medium outline-none focus:border-pink-500"
                          />
                        </div>

                        {/* Image Presets & Input */}
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Modelos Recomendados (Imagem)</label>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {[
                              { name: 'Modelo Sorrindo', url: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=200&h=200' },
                              { name: 'Corte Loiro', url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=200&h=200' },
                              { name: 'Barba Clássica', url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=200&h=200' },
                              { name: 'Esmaltação Nails', url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=200&h=200' }
                            ].map((img, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => updateBannerConfig({ imageUrl: img.url })}
                                className={`px-2 py-0.5 rounded text-[9px] font-bold bg-white border transition-all ${
                                  bannerConfig.imageUrl === img.url ? 'border-pink-500 bg-pink-50/50 text-pink-600 font-extrabold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {img.name}
                              </button>
                            ))}
                          </div>
                          <input 
                            type="text"
                            value={bannerConfig.imageUrl}
                            onChange={(e) => updateBannerConfig({ imageUrl: e.target.value })}
                            placeholder="Ou insira outra URL de imagem (ex: Unsplash)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-medium outline-none focus:border-pink-500"
                          />

                          {/* File Uploader zone with ideal pixel details */}
                          <div className="mt-3">
                            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Ou suba uma imagem do seu dispositivo</label>
                            
                            <div className="relative border-2 border-dashed border-slate-200 hover:border-pink-500 rounded-2xl p-4 transition-colors bg-slate-50/50 flex flex-col items-center justify-center text-center cursor-pointer group">
                              <input 
                                id="banner-file-upload"
                                type="file"
                                accept="image/png, image/jpeg, image/gif, image/webp"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 3 * 1024 * 1024) {
                                      setBannerUploadMsg("Erro: Imagem muito pesada! Escolha uma de até 3MB.");
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      const base64Data = event.target?.result as string;
                                      updateBannerConfig({ imageUrl: base64Data });
                                      setBannerUploadMsg("Sucesso! Imagem personalizada aplicada ao Banner.");
                                      setTimeout(() => setBannerUploadMsg(null), 5000);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <Upload size={20} className="text-slate-400 group-hover:text-pink-500 mb-2 transition-colors" />
                              <p className="text-[11px] font-black text-slate-800 group-hover:text-pink-600 transition-colors">
                                Clique para selecionar ou arraste o arquivo aqui
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                Formatos aceitos: PNG, JPG ou WEBP (Max 3MB)
                              </p>
                            </div>

                            {/* Informative size guidance box */}
                            <div className="mt-2.5 bg-pink-50/40 border border-pink-100 rounded-xl p-3 flex items-start space-x-2">
                              <span className="text-xs text-pink-500 shrink-0">💡</span>
                              <div className="text-[10px] leading-relaxed text-slate-700 font-bold">
                                <span className="font-extrabold text-pink-600 block uppercase tracking-wider text-[9px] mb-0.5">Resolução Ideal do Banner:</span>
                                Recomendamos imagens de <span className="font-black text-slate-900">500 x 500 pixels (Proporção 1:1, Quadrada)</span> ou <span className="font-black text-slate-900">400 x 500 pixels (Proporção Retrato)</span>.
                                <span className="block mt-1 text-slate-500 font-normal">
                                  Para um efeito VIP ultra profissional, prefira imagens em <span className="font-bold text-slate-700">PNG com fundo transparente</span>. Isso fará com que o modelo se funda perfeitamente à cor de fundo selecionada para o seu banner!
                                </span>
                              </div>
                            </div>

                            {/* Status notification */}
                            {bannerUploadMsg && (
                              <div className={`mt-2 p-2 rounded-xl text-[10px] font-extrabold text-center animate-fadeIn shadow-xs border ${
                                bannerUploadMsg.startsWith('Erro') 
                                  ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                                {bannerUploadMsg}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Business Hours Organization Panel */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-150 mt-6 md:mt-8">
                {/* Accordion trigger header */}
                <button
                  type="button"
                  onClick={() => setIsHoursOpen(!isHoursOpen)}
                  className="w-full flex items-center justify-between text-left focus:outline-none"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                        Horário de Funcionamento
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                          {businessHours.filter(d => d.isOpen).length} Dias Ativos
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold">Defina as horas exatas de abertura e fechamento para cada dia de expediente</p>
                    </div>
                  </div>
                  <div className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors ml-2 shrink-0">
                    {isHoursOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isHoursOpen && (
                  <div className="mt-5 pt-5 border-t border-slate-100 transition-all">
                    {/* Batch setup helper */}
                    <div className="mb-5 p-3.5 bg-indigo-50/30 border border-indigo-50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                      <div>
                        <span className="block text-[11px] font-black text-indigo-950 uppercase tracking-wider">Ajustes Rápidos de Lote</span>
                        <p className="text-[10px] text-slate-450 font-bold">Configure todos os dias desejados instantaneamente</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Definir horário das 08h às 20h para todos os dias úteis (Segunda a Sexta)? Elas estarão ativas.')) {
                              const updated = businessHours.map(d => {
                                if (d.dayIndex >= 1 && d.dayIndex <= 5) {
                                  return { ...d, isOpen: true, openTime: '08:00', closeTime: '20:00' };
                                }
                                return d;
                              });
                              updateBusinessHours(updated);
                            }
                          }}
                          className="flex-1 sm:flex-none text-[10px] font-black text-indigo-600 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl border border-indigo-100 transition-colors shadow-xs"
                        >
                          Seg-Sex: 08h-20h
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Ativar todos os dias (Domingo a Sábado) no expediente das 09h às 18h?')) {
                              const updated = businessHours.map(d => ({
                                ...d,
                                isOpen: true,
                                openTime: '09:00',
                                closeTime: '18:00'
                              }));
                              updateBusinessHours(updated);
                            }
                          }}
                          className="flex-1 sm:flex-none text-[10px] font-black text-indigo-700 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl border border-indigo-150 transition-colors shadow-xs"
                        >
                          Todos: 09h-18h
                        </button>
                      </div>
                    </div>

                    {/* Weekday lists */}
                    <div className="space-y-3">
                      {businessHours.map((day) => (
                        <div 
                          key={day.dayIndex} 
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            day.isOpen 
                              ? 'border-indigo-100 bg-indigo-50/10' 
                              : 'border-slate-100 bg-slate-50 opacity-75'
                          }`}
                        >
                          {/* Day Label with Toggle Switch */}
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => updateSingleDayHours(day.dayIndex, { isOpen: !day.isOpen })}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                day.isOpen 
                                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100' 
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                              title={day.isOpen ? 'Ativo (Clique para fechar)' : 'Fechado/Folga (Clique para abrir)'}
                            >
                              {day.isOpen ? <Unlock size={14} /> : <Lock size={14} />}
                            </button>
                            <div>
                              <span className="block text-xs font-black text-slate-800 tracking-tight">{day.dayLabel}</span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                day.isOpen ? 'text-indigo-600' : 'text-slate-400'
                              }`}>
                                {day.isOpen ? 'Com Expediente' : 'Fechado / Sem Expediente'}
                              </span>
                            </div>
                          </div>

                          {/* Opening and Closing Hours */}
                          {day.isOpen ? (
                            <div className="flex items-center justify-between sm:justify-start space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
                              <label className="text-[10px] font-bold text-slate-400 uppercase select-none mr-1">Abra às</label>
                              <select
                                value={day.openTime}
                                onChange={(e) => updateSingleDayHours(day.dayIndex, { openTime: e.target.value })}
                                className="text-xs font-extrabold text-slate-700 bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-center"
                              >
                                {TIME_OPTIONS.map(timeOption => (
                                  <option key={timeOption} value={timeOption}>{timeOption}</option>
                                ))}
                              </select>
                              
                              <span className="text-[10px] font-bold text-slate-350">|</span>
                              
                              <label className="text-[10px] font-bold text-slate-450 uppercase select-none mx-1">Feche às</label>
                              <select
                                value={day.closeTime}
                                onChange={(e) => updateSingleDayHours(day.dayIndex, { closeTime: e.target.value })}
                                className="text-xs font-extrabold text-slate-700 bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-center"
                              >
                                {TIME_OPTIONS.map(timeOption => (
                                  <option key={timeOption} value={timeOption}>{timeOption}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center p-2 px-3 bg-slate-100 rounded-xl select-none">
                              <Coffee size={12} className="text-slate-400 mr-1.5" />
                              <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
                                Folga do Salão
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo Aba: Clientes */}
        {activeTab === 'clients' && (
          <div className="space-y-4 pb-12 animate-fadeIn">
            {/* Header / Search / Add Button */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Gestão de Clientes
                  <span className="bg-pink-100 text-pink-700 text-xs px-2.5 py-0.5 rounded-full font-black">
                    {(clients || []).length} cadastrados
                  </span>
                </h2>
                <p className="text-xs text-slate-450 font-bold">Gerencie os perfis, visualizações completas e dados de contato</p>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:border-pink-500 transition-colors"
                  />
                  {clientSearch && (
                    <button
                      onClick={() => setClientSearch('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={handleNewClientClick}
                  className="bg-pink-500 hover:bg-pink-600 font-sans text-xs font-black text-white px-4 py-2.5 rounded-2xl shadow-md shadow-pink-500/20 flex items-center gap-2 shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <UserPlus size={16} />
                  <span className="hidden sm:inline">Adicionar Cliente</span>
                </button>
              </div>
            </div>

            {/* List/Grid of Clients */}
            {(() => {
              const filtered = (clients || []).filter(c => 
                c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                (c.email && c.email.toLowerCase().includes(clientSearch.toLowerCase())) ||
                (c.phone && c.phone.includes(clientSearch)) ||
                (c.instagram && c.instagram.toLowerCase().includes(clientSearch.toLowerCase()))
              );
              
              if (filtered.length === 0) {
                return (
                  <div className="bg-slate-50 border border-slate-150 rounded-3xl p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4 border border-slate-200">
                      <Users size={32} />
                    </div>
                    <h3 className="text-sm font-black text-slate-800">
                      {clientSearch ? 'Nenhum resultado encontrado' : 'Nenhum cliente cadastrado'}
                    </h3>
                    <p className="text-xs text-slate-450 font-bold mt-1 max-w-sm mx-auto">
                      {clientSearch 
                        ? 'Verifique a digitação ou tente buscar por outro nome, e-mail, celular ou instagram.' 
                        : 'Comece adicionando perfis de clientes para preencher sua base e associar a agendamentos.'}
                    </p>
                    {!clientSearch && (
                      <button
                        onClick={handleNewClientClick}
                        className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-xs text-white px-4 py-2.5 rounded-2xl font-bold font-sans transition-colors"
                      >
                        Criar Primeiro Cliente
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(client => {
                    const clientAppts = appointments.filter(a => a.clientId === client.id || (a.clientName && a.clientName.toLowerCase() === client.name.toLowerCase()));
                    return (
                      <div 
                        key={client.id}
                        className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-150 relative hover:shadow-md transition-all flex flex-col justify-between group text-slate-700"
                      >
                        <div>
                          {/* Main profile row */}
                          <div className="flex items-center space-x-3.5 mb-4">
                            <img
                              src={client.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150'}
                              alt={client.name}
                              className="w-12 h-12 rounded-full object-cover shadow-sm bg-slate-100 ring-2 ring-slate-100 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1 text-left">
                              <h4 className="text-sm font-black text-slate-900 leading-tight truncate">{client.name}</h4>
                              <p className="text-[10px] text-slate-400 font-bold flex items-center mt-0.5 select-none shrink-0 border border-slate-100 bg-slate-50/50 w-fit px-1.5 py-0.5 rounded-md">
                                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${client.gender === 'Masculino' ? 'bg-blue-400' : 'bg-pink-400'}`} />
                                {client.gender || 'Não especificado'}
                              </p>
                            </div>
                          </div>

                          {/* Contact information details */}
                          <div className="space-y-2 py-3 border-t border-b border-slate-100/75 my-3">
                            {client.phone && (
                              <div className="flex items-center text-slate-600 space-x-2">
                                <Phone size={13} className="text-slate-400 shrink-0" />
                                <span className="text-xs font-bold leading-normal truncate">{client.phone}</span>
                              </div>
                            )}
                            
                            {client.email && (
                              <div className="flex items-center text-slate-600 space-x-2">
                                <Mail size={13} className="text-slate-400 shrink-0" />
                                <span className="text-xs font-bold leading-normal truncate">{client.email}</span>
                              </div>
                            )}

                            {client.instagram && (
                              <div className="flex items-center text-slate-600 space-x-2">
                                <span className="text-[11px] font-black text-slate-400 shrink-0 select-none">IG</span>
                                <span className="text-xs font-bold leading-normal text-pink-600 transition-colors select-all truncate">
                                  {client.instagram.startsWith('@') ? client.instagram : `@${client.instagram}`}
                                </span>
                              </div>
                            )}

                            {client.birthday && (
                              <div className="flex items-center text-slate-600 space-x-2">
                                <span className="text-[11px] font-black text-slate-400 shrink-0 select-none">Niver</span>
                                <span className="text-xs font-bold leading-normal text-slate-500 truncate">
                                  {format(new Date(client.birthday + 'T00:00:00'), 'dd/MM/yyyy')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Appointments status information */}
                          <div className="flex items-center justify-between text-xs font-bold text-slate-500 py-1">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-sans">Agendamentos</span>
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-black text-[10px]">
                              {clientAppts.length} {clientAppts.length === 1 ? 'visita' : 'visitas'}
                            </span>
                          </div>

                          {/* Notification channels status */}
                          <div className="flex space-x-2 mt-3 mb-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${client.whatsappNotifications ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'}`}>
                              WP Remoto
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${client.emailNotifications ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'}`}>
                              E-mail Ativo
                            </span>
                          </div>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-slate-100/50">
                          <button
                            type="button"
                            onClick={() => handleEditClientClick(client)}
                            className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Editar Perfil"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Tem certeza que deseja excluir o cliente ${client.name}? Todos os registros de perfil serão apagados permanentemente.`)) {
                                removeClient(client.id);
                              }
                            }}
                            className="p-2 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-all"
                            title="Excluir Perfil"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showStaffForm && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl w-full sm:max-w-md overflow-y-auto max-h-[85%]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editingStylistId ? 'Editar Perfil do Funcionário' : 'Novo Funcionário'}
              </h3>
              <button onClick={() => setShowStaffForm(false)} className="p-2 bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={newStaff.name} 
                  onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Ex: Maria Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Foto do Funcionário</label>
                <div className="flex items-center space-x-4">
                  {avatarFile || newStaff.avatar ? (
                    <img src={avatarFile || newStaff.avatar} alt="Preview" className="w-16 h-16 rounded-full object-cover shadow-sm bg-slate-100" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Camera size={24} />
                    </div>
                  )}
                  <label className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
                    Escolher Imagem
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Serviços Habilitados</label>
                <div className="grid grid-cols-2 gap-2">
                  {allServices.map(service => (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        selectedServices.includes(service.id) 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {service.name}
                    </button>
                  ))}
                  <button 
                    onClick={() => setShowNewServiceForm(!showNewServiceForm)}
                    className="text-center px-3 py-2 rounded-xl text-xs font-bold border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 flex items-center justify-center transition-colors"
                  >
                    <Plus size={14} className="mr-1" /> Novo Serviço
                  </button>
                </div>

                {showNewServiceForm && (
                  <div className="mt-3 p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">Criar Novo Serviço</h4>
                    <input 
                      type="text"
                      placeholder="Nome (ex: Manicure)" 
                      value={newService.name} 
                      onChange={e => setNewService({...newService, name: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                    />
                    <div className="flex gap-2">
                       <input 
                         type="number"
                         placeholder="Preço (R$)" 
                         value={newService.price} 
                         onChange={e => setNewService({...newService, price: e.target.value})}
                         className="w-1/2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                       />
                       <input 
                         type="number"
                         placeholder="Duração (min)" 
                         value={newService.durationMinutes} 
                         onChange={e => setNewService({...newService, durationMinutes: e.target.value})}
                         className="w-1/2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                       />
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 mb-1.5">Ícone para o Serviço</span>
                      <div className="grid grid-cols-5 gap-1 bg-slate-100 border border-slate-200 p-1.5 rounded-lg">
                        {SALON_ICONS.map(iconObj => {
                          const IconComp = iconObj.component;
                          const isSelected = newService.icon === iconObj.name;
                          return (
                            <button
                              key={iconObj.name}
                              type="button"
                              title={iconObj.label}
                              onClick={() => setNewService({ ...newService, icon: iconObj.name })}
                              className={`p-1.5 rounded-lg flex flex-col items-center justify-center transition-all border ${
                                isSelected
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 font-bold'
                                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 shadow-xs'
                              }`}
                            >
                              <IconComp size={16} />
                              <span className="text-[9px] mt-0.5 select-none truncate max-w-full font-medium">{iconObj.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => setShowNewServiceForm(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
                      <button onClick={handleAddService} disabled={!newService.name} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg disabled:bg-slate-300">Salvar</button>
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleAddStaff}
                disabled={!newStaff.name}
                className="w-full py-4 mt-4 rounded-2xl font-bold text-white shadow-lg bg-indigo-600 disabled:bg-slate-300 hover:bg-indigo-700 transition-colors"
              >
                {editingStylistId ? 'Salvar Alterações' : 'Cadastrar Funcionário'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Client Modal */}
      {showClientForm && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex flex-col justify-end sm:items-center sm:justify-center animate-fadeIn text-slate-700">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl w-full sm:max-w-md overflow-y-auto max-h-[85%] text-left">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {editingClientId ? 'Editar Perfil do Cliente' : 'Cadastrar Novo Cliente'}
              </h3>
              <button 
                onClick={() => setShowClientForm(false)} 
                className="p-2 bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Profile Name */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={clientForm.name} 
                  onChange={e => setClientForm({...clientForm, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-pink-500 transition-colors"
                  placeholder="Ex: Ana Maria Silva"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">E-mail</label>
                  <input 
                    type="email" 
                    value={clientForm.email} 
                    onChange={e => setClientForm({...clientForm, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-pink-500 transition-colors"
                    placeholder="Ex: ana@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Celular / WhatsApp</label>
                  <input 
                    type="text" 
                    value={clientForm.phone} 
                    onChange={e => setClientForm({...clientForm, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-pink-500 transition-colors"
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>
              </div>

              {/* Gender & Birthday */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Gênero de Identidade</label>
                  <select
                    value={clientForm.gender}
                    onChange={e => setClientForm({...clientForm, gender: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-pink-500 transition-colors"
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefiro não informar">Prefiro não informar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Data de Nascimento</label>
                  <input 
                    type="date" 
                    value={clientForm.birthday} 
                    onChange={e => setClientForm({...clientForm, birthday: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              {/* Instagram tag */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Instagram (@usuario)</label>
                <input 
                  type="text" 
                  value={clientForm.instagram} 
                  onChange={e => setClientForm({...clientForm, instagram: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-pink-500 transition-colors"
                  placeholder="Ex: @anasilva_beauty"
                />
              </div>

              {/* Avatar upload / presets selector */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Avatar / Foto de Perfil</label>
                <div className="flex items-center space-x-4 mb-3">
                  {clientAvatarFile || clientForm.avatar ? (
                    <img 
                      src={clientAvatarFile || clientForm.avatar} 
                      alt="Preview" 
                      className="w-14 h-14 rounded-full object-cover shadow-sm bg-slate-100 ring-2 ring-indigo-50" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                      <Camera size={20} />
                    </div>
                  )}
                  <label className="px-3.5 py-2 bg-pink-50 text-pink-700 rounded-xl text-xs font-black cursor-pointer hover:bg-pink-100 transition-all select-none">
                    Subir Imagem
                    <input type="file" className="hidden" accept="image/*" onChange={handleClientAvatarChange} />
                  </label>
                </div>

                {/* Quick avatar presets picker */}
                <div className="flex gap-1.5 items-center bg-slate-50 p-2 rounded-xl border border-slate-100 mb-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 mr-1.5 shrink-0">Modelos:</span>
                  {[
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
                  ].map((url, idx) => (
                    <button 
                      key={idx}
                      type="button" 
                      onClick={() => {
                        setClientForm({...clientForm, avatar: url});
                        setClientAvatarFile(null);
                      }}
                      className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${clientForm.avatar === url && !clientAvatarFile ? 'border-pink-500 scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                      <img src={url} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Communication switches */}
              <div className="pt-2.5 border-t border-slate-100 space-y-2">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Notificações</span>
                
                <label className="flex items-start space-x-3 cursor-pointer select-none py-1.5 hover:bg-slate-50 px-2 rounded-lg transition-colors">
                  <input 
                    type="checkbox"
                    checked={clientForm.whatsappNotifications}
                    onChange={e => setClientForm({...clientForm, whatsappNotifications: e.target.checked})}
                    className="w-4 h-4 rounded text-pink-600 border-slate-300 focus:ring-pink-500 cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="block text-xs font-black text-slate-800 leading-tight">Alertas por WhatsApp</span>
                    <span className="block text-[9px] text-slate-400 font-bold mt-0.5">Lembretes automáticos 24h antes</span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer select-none py-1.5 hover:bg-slate-50 px-2 rounded-lg transition-colors">
                  <input 
                    type="checkbox"
                    checked={clientForm.emailNotifications}
                    onChange={e => setClientForm({...clientForm, emailNotifications: e.target.checked})}
                    className="w-4 h-4 rounded text-pink-600 border-slate-300 focus:ring-pink-500 cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="block text-xs font-black text-slate-800 leading-tight">Avisos por E-mail</span>
                    <span className="block text-[9px] text-slate-400 font-bold mt-0.5">Confirmações de agendamento e promos</span>
                  </div>
                </label>
              </div>

              {/* Form Action buttons */}
              <button 
                type="button"
                onClick={handleSaveClient}
                disabled={!clientForm.name || (!clientForm.email && !clientForm.phone)}
                className="w-full py-3 mt-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg bg-pink-500 hover:bg-pink-600 disabled:bg-slate-300 transition-colors shadow-pink-500/20"
              >
                {editingClientId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
