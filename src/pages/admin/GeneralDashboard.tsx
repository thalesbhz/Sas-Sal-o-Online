import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, Salon, Client } from '../../store/AppContext';
import { 
  Building2, 
  Users, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  PlusCircle, 
  Check, 
  X, 
  LogOut, 
  ShieldAlert, 
  Home, 
  HelpCircle,
  FileSpreadsheet,
  Settings,
  Briefcase,
  Link
} from 'lucide-react';

export const GeneralDashboard = () => {
  const navigate = useNavigate();
  const { 
    salons, 
    addSalon, 
    updateSalon, 
    removeSalon, 
    clients, 
    appointments,
    currentUser, 
    logoutUser,
    authLoading 
  } = useAppContext();

  // Route security check: only SUPER_ADMIN is allowed
  React.useEffect(() => {
    if (!authLoading) {
      if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, authLoading, navigate]);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSalon, setEditingSalon] = useState<Salon | null>(null);
  const [newlyCreatedSalonLink, setNewlyCreatedSalonLink] = useState<{ id: string; name: string } | null>(null);

  const handleCopyLink = (salonId: string, salonName: string) => {
    const link = `${window.location.origin}/?salon=${salonId}`;
    navigator.clipboard.writeText(link)
      .then(() => {
        showNotification('success', `Link direto para "${salonName}" copiado!`);
      })
      .catch(() => {
        showNotification('error', 'Erro ao copiar o link para a área de transferência.');
      });
  };
  
  // Form fields
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [password, setPassword] = useState('');

  // Client auditing audit tab state
  const [activeTab, setActiveTab] = useState<'salons' | 'clients'>('salons');
  const [clientSearch, setClientSearch] = useState('');

  // Notifications or errors
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-8">
        <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mt-4">Carregando Painel Geral...</p>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return null;
  }

  const openAddModal = () => {
    setEditingSalon(null);
    setName('');
    setAdminEmail('');
    setPhone('');
    setAddress('');
    setStatus('ATIVO');
    setPassword('VogueAdmin123');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (salon: Salon) => {
    setEditingSalon(salon);
    setName(salon.name);
    setAdminEmail(salon.adminEmail);
    setPhone(salon.phone);
    setAddress(salon.address);
    setStatus(salon.status);
    setPassword(salon.password || 'VogueAdmin123');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      setSuccessMsg(text);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(text);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !adminEmail.trim() || !phone.trim() || !address.trim() || !password.trim()) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    try {
      if (editingSalon) {
        await updateSalon(editingSalon.id, {
          name,
          adminEmail,
          phone,
          address,
          status,
          password: password.trim()
        });
        showNotification('success', 'Salão atualizado com sucesso!');
      } else {
        // Prevent duplicate manager email in registered salon admins helper check
        const emailExists = salons.some(s => s.adminEmail.toLowerCase() === adminEmail.toLowerCase().trim());
        if (emailExists) {
          setErrorMsg('Já existe um salão cadastrado para este e-mail de administrador.');
          return;
        }

        const newId = await addSalon({
          name,
          adminEmail: adminEmail.toLowerCase().trim(),
          phone,
          address,
          status,
          password: password.trim()
        });
        showNotification('success', 'Novo salão e administrador cadastrados!');
        if (newId) {
          setNewlyCreatedSalonLink({ id: newId, name });
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar informações do salão.');
    }
  };

  const handleDeleteSalon = async (id: string, salonName: string) => {
    if (window.confirm(`Tem certeza de que deseja remover o salão "${salonName}"? Isso removerá o cadastro e acesso às configurações desse salão.`)) {
      try {
        await removeSalon(id);
        showNotification('success', 'Salão removido com sucesso!');
      } catch (err: any) {
        showNotification('error', err.message || 'Falha ao remover o salão.');
      }
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  // Filter lists
  const filteredSalons = salons.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone && c.phone.includes(clientSearch))
  );

  // Stats calculation
  const totalSalons = salons.length;
  const activeSalons = salons.filter(s => s.status === 'ATIVO').length;
  const totalSysClients = clients.length;
  const totalSysAppointments = appointments.length;

  return (
    <div id="general_admin_panel" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top navbar */}
      <header id="super_nav" className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-pink-500/10 px-4 py-3 lg:px-8 flex justify-between items-center shadow-lg shadow-black/30">
        <div className="flex items-center space-x-2">
          <div className="bg-pink-600 rounded-lg p-2 text-white shadow-md shadow-pink-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-pink-400 uppercase">VOGUE CLOUD</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Painel Administrativo Geral</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>
            <span className="text-[9px] text-pink-400 font-bold uppercase tracking-widest">Super Admin</span>
          </div>
          <button 
            id="btn_home"
            onClick={() => navigate('/')} 
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 text-xs transition-all pointer-events-auto"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Início</span>
          </button>
          <button 
            id="btn_logout"
            onClick={handleLogout} 
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desconectar</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Toast alerts */}
        {successMsg && (
          <div id="toast_success" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center space-x-2 text-xs font-medium animate-fade-in">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && !isModalOpen && (
          <div id="toast_error" className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center space-x-2 text-xs font-medium animate-fade-in">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dashboard Introduction Frame */}
        <div className="bg-gradient-to-r from-pink-900/20 to-slate-900/10 border border-pink-500/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -tr-y-12 translate-x-12 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <p className="text-[10px] text-pink-500 font-extrabold tracking-widest uppercase">MULTITENANT MANAGEMENT</p>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1">Gerencie os Salões Vogue</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Como Super-Administrador geral da rede Vogue Booking, cadastre novos salões de beleza parceiros, defina seus respectivos administradores de conta, e visualize o acompanhamento de clientes e agendamentos gerais de cada unidade.
          </p>
        </div>

        {/* Grid Stats Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div id="stat_total_salons" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex items-center space-x-4">
            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Unidades</span>
              <span className="block text-2xl font-black text-white mt-1">{totalSalons}</span>
            </div>
          </div>

          <div id="stat_active_salons" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">Salões Ativos</span>
              <span className="block text-2xl font-black text-emerald-400 mt-1">{activeSalons}</span>
            </div>
          </div>

          <div id="stat_total_clients" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">Clientes Totais</span>
              <span className="block text-2xl font-black text-white mt-1">{totalSysClients}</span>
            </div>
          </div>

          <div id="stat_total_appointments" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">Agendamentos</span>
              <span className="block text-2xl font-black text-white mt-1">{totalSysAppointments}</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('salons')}
            className={`px-5 py-3 text-xs font-bold tracking-wider uppercase transition-all flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'salons' 
                ? 'border-pink-500 text-pink-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Salões e Contas</span>
          </button>
          
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-5 py-3 text-xs font-bold tracking-wider uppercase transition-all flex items-center space-x-2 border-b-2 -mb-px ${
              activeTab === 'clients' 
                ? 'border-pink-500 text-pink-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Acompanhamento de Clientes</span>
          </button>
        </div>

        {/* TAB 1: Salons and Admins */}
        {activeTab === 'salons' && (
          <div className="space-y-6">
            
            {/* Filters Bar & Add Actions */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-between items-stretch sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Pesquisar salão por nome, email ou endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 font-medium"
                />
              </div>

              <button
                id="btn_add_salon"
                onClick={openAddModal}
                className="bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-pink-500/10 cursor-pointer transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>CADASTRAR SALÃO</span>
              </button>
            </div>

            {/* List and Grid */}
            {filteredSalons.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">Nenhum salão registrado ou encontrado</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Utilize o botão &quot;Cadastrar Salão&quot; no topo direito para criar e registrar uma nova unidade.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSalons.map((salon) => (
                  <div key={salon.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700/80 transition-all flex flex-col justify-between group">
                    <div className="p-5 space-y-4">
                      {/* Badge / Header info of salon */}
                      <div className="flex justify-between items-start">
                        <div className="bg-slate-800 rounded-xl p-2.5 text-pink-400 group-hover:text-pink-300 transition-colors">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          salon.status === 'ATIVO' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {salon.status}
                        </span>
                      </div>

                      {/* Salon Names */}
                      <div>
                        <h3 className="text-base font-black text-white group-hover:text-pink-400 transition-colors">{salon.name}</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 leading-none">ID: {salon.id}</p>
                      </div>

                      {/* Contacts Fields */}
                      <div className="space-y-2 text-xs text-slate-400 font-medium">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate">{salon.adminEmail}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{salon.phone}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                          <span className="line-clamp-2 leading-tight">{salon.address}</span>
                        </div>
                      </div>

                      {/* Acompanhamento / Usage Indicators */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Clientes: <strong>{salon.clientCount || 0}</strong></span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Agendamentos: <strong>{salon.appointmentCount || 0}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Salon Footer Actions */}
                    <div className="bg-slate-900/60 border-t border-slate-800/80 px-5 py-3 flex space-x-2 justify-end">
                      <button
                        onClick={() => handleCopyLink(salon.id, salon.name)}
                        className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/10 text-xs transition-colors flex items-center space-x-1 cursor-pointer mr-auto"
                        title="Copiar Link para Clientes"
                      >
                        <Link className="w-3.5 h-3.5" />
                        <span>Copiar Link</span>
                      </button>
                      <button
                        onClick={() => openEditModal(salon)}
                        className="p-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/10 text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSalon(salon.id, salon.name)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Clients list audit and tracking */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-pink-500" />
                <span>Listagem Auditada de Clientes</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Abaixo estão listadas todas as contas de clientes registradas unificamente na plataforma Vogue Booking. Você pode acompanhar o perfil e dados cadastrais unificados para as campanhas de marketing geral e notificações.
              </p>
              
              <div className="relative max-w-md pt-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-px" />
                <input 
                  type="text"
                  placeholder="Pesquisar cliente pelo nome ou e-mail..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500 font-medium"
                />
              </div>
            </div>

            {/* Client table/grid */}
            {filteredClients.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                Nenhum cliente cadastrado ou correspondendo à pesquisa.
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-4">Nome / Avatar</th>
                        <th className="p-4">E-mail</th>
                        <th className="p-4">Telefone</th>
                        <th className="p-4">Aniversário</th>
                        <th className="p-4">Permissão</th>
                        <th className="p-4">Envio Whatsapp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-800/20 transition-all">
                          <td className="p-4 flex items-center space-x-3">
                            <img 
                              src={client.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150"} 
                              alt={client.name} 
                              className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <span className="block font-bold text-white leading-relaxed">{client.name}</span>
                              <span className="block text-[10px] text-slate-500 font-mono">ID: {client.id}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-300 font-mono">{client.email}</td>
                          <td className="p-4 text-slate-400">{client.phone || '-'}</td>
                          <td className="p-4 text-slate-400">{client.birthday || '-'}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              client.role === 'SUPER_ADMIN' 
                                ? 'bg-red-500/15 text-red-400 border border-red-500/15'
                                : client.role === 'ADMIN'
                                ? 'bg-pink-500/15 text-pink-400 border border-pink-500/15'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {client.role || 'CLIENT'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              client.whatsappNotifications !== false 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {client.whatsappNotifications !== false ? 'Permitido' : 'Bloqueado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-auto space-y-1">
        <p>&copy; 2026 VOGUE BEAUTY NETWORK SYSTEM</p>
        <p className="text-[9px] text-slate-600 font-extrabold tracking-wider">Zero-Trust Multitenant Core Framework</p>
      </footer>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div id="salon_crud_modal" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          
          {/* Overlay background panel */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal Content Frame */}
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative z-10 overflow-hidden">
            
            {/* Background absolute decorations */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500"></div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingSalon ? 'EDITAR SALÃO' : 'CADASTRAR NOVO SALÃO'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {editingSalon ? 'Atualizar campos e gerenciar' : 'Registrar unidade e login administrativo'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors pointer-events-auto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-xs font-semibold mb-4 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Nome Geral do Salão</label>
                <input 
                  type="text"
                  placeholder="Ex: Vogue Vila Mariana, Vogue Jardins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">E-mail do Administrador (Para Login)</label>
                <input 
                  type="email"
                  placeholder="Ex: manager.vogue@gmail.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 font-medium disabled:opacity-50"
                  required
                  disabled={editingSalon !== null}
                />
                {!editingSalon && (
                  <p className="text-[9px] text-pink-400/80 leading-normal">
                    * Um perfil do tipo <strong>Administrador do Salão</strong> será gerado automaticamente para que o parceiro acesse este painel de agendamento usando esta conta.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Senha de Acesso do Administrador</label>
                <input 
                  type="text"
                  placeholder="Ex: SenhaForte123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 font-medium"
                  required
                />
                <p className="text-[9px] text-slate-500 leading-normal">
                  Senha usada pelo administrador do salão para fazer login no sistema.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-mono">Telefone / Whatsapp Comercial</label>
                <input 
                  type="text"
                  placeholder="Ex: (11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-mono">Endereço Completo</label>
                <input 
                  type="text"
                  placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-mono">Status da Conta</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ATIVO' | 'INATIVO')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500 font-medium"
                >
                  <option value="ATIVO" className="bg-slate-950 text-slate-100">ATIVO (Acesso Autorizado)</option>
                  <option value="INATIVO" className="bg-slate-950 text-slate-100">INATIVO (Acesso Bloqueado)</option>
                </select>
              </div>

              <div className="pt-4 flex space-x-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingSalon ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR CADASTRO'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* SUCCESS LINK MODAL */}
      {newlyCreatedSalonLink && (
        <div id="salon_link_modal" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
            onClick={() => setNewlyCreatedSalonLink(null)}
          ></div>

          <div className="relative bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative z-10 overflow-hidden text-center space-y-5">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mt-2">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">SALÃO CADASTRADO!</h3>
              <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest mt-1">
                Link de Agendamento do Cliente Gerado
              </p>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-1">
              <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Nome da Unidade:</span>
              <span className="block text-sm font-bold text-slate-200">{newlyCreatedSalonLink.name}</span>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold pl-1">Link Direto para Clientes</label>
              <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 items-center">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/?salon=${newlyCreatedSalonLink.id}`}
                  className="bg-transparent border-none text-xs text-pink-400 font-mono px-3 py-1 flex-1 outline-none select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(newlyCreatedSalonLink.id, newlyCreatedSalonLink.name)}
                  className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold shrink-0 transition-colors pointer-events-auto cursor-pointer"
                >
                  Copiar
                </button>
              </div>
              <p className="text-[9px] text-slate-500 pl-1 leading-normal">
                Envie este link para os clientes deste salão para que eles agendem diretamente com os profissionais e serviços exclusivos da unidade.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setNewlyCreatedSalonLink(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer font-mono"
              >
                FECHAR E CONTINUAR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
