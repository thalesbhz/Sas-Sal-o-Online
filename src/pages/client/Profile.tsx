import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Instagram, 
  CheckCircle, 
  Camera, 
  Bell, 
  Save, 
  Sparkles, 
  Heart,
  ChevronRight,
  Smile,
  ShieldCheck,
  Edit2,
  Upload,
  LogOut
} from 'lucide-react';

const AVATAR_OPTIONS = [
  { name: 'Blonde', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150' },
  { name: 'Brunette', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150' },
  { name: 'Curls', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150' },
  { name: 'Short Bob', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150' },
  { name: 'Barber Style', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150' }
];

export const ClientProfile = () => {
  const navigate = useNavigate();
  const { currentUser, updateCurrentUser, logoutUser } = useAppContext();
  
  if (!currentUser) return null;
  
  // Input references for file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directFileInputRef = useRef<HTMLInputElement>(null);

  // Local active state
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: currentUser.name || '',
    phone: currentUser.phone || '',
    email: currentUser.email || '',
    avatar: currentUser.avatar || AVATAR_OPTIONS[0].url,
    birthday: currentUser.birthday || '',
    gender: currentUser.gender || 'Feminino',
    instagram: currentUser.instagram || '',
    whatsappNotifications: currentUser.whatsappNotifications !== false,
    emailNotifications: currentUser.emailNotifications === true
  });

  const [avatarInputMode, setAvatarInputMode] = useState<'picker' | 'upload' | 'url'>('picker');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, avatar: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDirectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Immediately update current user
          updateCurrentUser({ avatar: reader.result });
          // Sync with active form data
          setFormData(prev => ({ ...prev, avatar: reader.result }));
          setSuccessMessage('Foto de perfil atualizada!');
          setTimeout(() => setSuccessMessage(null), 2500);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // Use selected avatar
    let selectedAvatar = formData.avatar;
    if (avatarInputMode === 'url' && customAvatarUrl.trim()) {
      selectedAvatar = customAvatarUrl.trim();
    }

    updateCurrentUser({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      avatar: selectedAvatar,
      birthday: formData.birthday,
      gender: formData.gender,
      instagram: formData.instagram,
      whatsappNotifications: formData.whatsappNotifications,
      emailNotifications: formData.emailNotifications
    });

    setSuccessMessage('Cadastro atualizado com sucesso!');
    setTimeout(() => {
      setSuccessMessage(null);
      setShowEditPanel(false);
    }, 2000);
  };

  const handleSelectPredefinedAvatar = (url: string) => {
    setFormData(prev => ({ ...prev, avatar: url }));
    setAvatarInputMode('picker');
  };

  return (
    <div className="px-6 pt-6 pb-24 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seu Perfil</h1>
          <p className="text-sm text-gray-500">Membro Premium do Salão</p>
        </div>
        <div className="bg-pink-100/60 text-pink-600 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
          <ShieldCheck size={14} />
          <span>Ativo</span>
        </div>
      </div>

      {/* Profile summary Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center space-x-4 mb-6 relative">
        <div className="relative">
          <img
            src={currentUser.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150"}
            alt="Foto do Perfil"
            className="w-16 h-16 rounded-full object-cover ring-4 ring-pink-50"
          />
          <input 
            type="file" 
            ref={directFileInputRef} 
            onChange={handleDirectFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => {
              directFileInputRef.current?.click();
            }}
            className="absolute -bottom-1 -right-1 bg-pink-500 text-white p-1.5 rounded-full shadow-md hover:bg-pink-600 transition-colors"
            title="Enviar Nova Foto"
          >
            <Camera size={13} />
          </button>
        </div>
        <div className="flex-1">
          <h2 className="font-extrabold text-slate-900 text-lg leading-tight">{currentUser.name}</h2>
          <p className="text-xs text-slate-500 font-medium leading-normal mt-0.5">{currentUser.phone || '(Sem Telefone)'}</p>
          <div className="flex items-center space-x-2 mt-1.5">
            {currentUser.instagram && (
              <span className="text-[10px] bg-slate-50 border border-slate-100 text-indigo-500 font-bold px-1.5 py-0.5 rounded flex items-center">
                <Instagram size={10} className="mr-0.5 text-indigo-400" />
                {currentUser.instagram}
              </span>
            )}
            <span className="text-[10px] bg-pink-50 text-pink-600 font-bold px-1.5 py-0.5 rounded flex items-center">
              <Sparkles size={10} className="mr-0.5" /> Client VIP
            </span>
          </div>
        </div>
        <button 
          onClick={() => {
            setFormData({
              name: currentUser.name || '',
              phone: currentUser.phone || '',
              email: currentUser.email || '',
              avatar: currentUser.avatar || AVATAR_OPTIONS[0].url,
              birthday: currentUser.birthday || '',
              gender: currentUser.gender || 'Feminino',
              instagram: currentUser.instagram || '',
              whatsappNotifications: currentUser.whatsappNotifications !== false,
              emailNotifications: currentUser.emailNotifications === true
            });
            setShowEditPanel(true);
          }}
          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-2.5 rounded-2xl transition-colors shrink-0"
          title="Editar Cadastro"
        >
          <Edit2 size={16} />
        </button>
      </div>

      {/* Info Grid (View Only mode) */}
      {!showEditPanel && (
        <div className="space-y-3.5 mb-6">
          <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase pl-1">Informações Adicionais</h3>
          
          <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center">
                <Mail size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide leading-none">E-mail</span>
                <span className="text-xs font-bold text-slate-800">{currentUser.email || 'Não informado'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <Calendar size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide leading-none">Nascimento</span>
                <span className="text-xs font-bold text-slate-800">
                  {currentUser.birthday 
                    ? new Date(currentUser.birthday + 'T00:00:00').toLocaleDateString('pt-BR') 
                    : 'Não informado'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
                <Smile size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide leading-none">Gênero</span>
                <span className="text-xs font-bold text-slate-800">{currentUser.gender || 'Feminino'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                <Bell size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide leading-none">Notificações WhatsApp</span>
                <span className="text-xs font-bold text-slate-800">
                  {currentUser.whatsappNotifications !== false ? 'Habilitado' : 'Desabilitado'}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowEditPanel(true)}
            className="w-full bg-slate-900 text-white font-bold text-xs py-3 rounded-2xl shadow-sm hover:bg-slate-800 transition-colors mt-2"
          >
            Editar Todos os Dados
          </button>

          {showLogoutConfirm ? (
            <div className="bg-red-50/70 border border-red-100 rounded-2xl p-4 mt-2.5 text-center space-y-3">
              <span className="block text-xs font-black text-red-700">Deseja realmente sair de sua conta?</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    logoutUser();
                    navigate('/');
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] py-2 rounded-xl transition-colors shadow-sm"
                >
                  Sim, Sair
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-slate-250 hover:bg-slate-300 text-slate-700 font-extrabold text-[11px] py-2 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-3 rounded-2xl transition-colors mt-2 flex items-center justify-center space-x-2"
            >
              <LogOut size={14} />
              <span>Sair da Conta</span>
            </button>
          )}
        </div>
      )}

      {/* Interactive Registration Panel (Edit Mode) */}
      {showEditPanel && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-5 border border-slate-150 shadow-md space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Ficha de Cadastro</h3>
            <button 
              type="button" 
              onClick={() => setShowEditPanel(false)} 
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </button>
          </div>

          {/* Form Group: Nome */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                required
                value={formData.name} 
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-pink-400 outline-none transition-all placeholder:text-slate-350"
                placeholder="Ex: Ana Souza"
              />
            </div>
          </div>

          {/* Form Group: Email & Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-pink-400 outline-none transition-all placeholder:text-slate-350"
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">WhastApp / Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-pink-400 outline-none transition-all placeholder:text-slate-350"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Form Group: Nascimento & Genero */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Aniversário</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="date" 
                  value={formData.birthday} 
                  onChange={e => setFormData(p => ({ ...p, birthday: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-pink-400 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gênero</label>
              <select 
                value={formData.gender}
                onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))}
                className="w-full px-3 py-1.5 h-[34px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-pink-400 outline-none transition-all"
              >
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Não-Binário">Não-Binário</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Form Group: Instagram */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Instagram (@usuario)</label>
            <div className="relative">
              <Instagram className="absolute left-3 top-2.5 text-indigo-400" size={16} />
              <input 
                type="text" 
                value={formData.instagram} 
                onChange={e => setFormData(p => ({ ...p, instagram: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-pink-400 outline-none transition-all placeholder:text-slate-350"
                placeholder="@username"
              />
            </div>
          </div>

          {/* Real-time Choose Avatar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Escolha sua Foto</label>
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  onClick={() => setAvatarInputMode('picker')}
                  className={`text-[9px] font-extrabold ${avatarInputMode === 'picker' ? 'text-pink-600' : 'text-slate-400'}`}
                >
                  Sugestões
                </button>
                <button 
                  type="button" 
                  onClick={() => setAvatarInputMode('upload')}
                  className={`text-[9px] font-extrabold ${avatarInputMode === 'upload' ? 'text-pink-600' : 'text-slate-400'}`}
                >
                  Enviar Foto
                </button>
                <button 
                  type="button" 
                  onClick={() => setAvatarInputMode('url')}
                  className={`text-[9px] font-extrabold ${avatarInputMode === 'url' ? 'text-pink-600' : 'text-slate-400'}`}
                >
                  Link Externo
                </button>
              </div>
            </div>

            {avatarInputMode === 'picker' ? (
              <div className="flex space-x-2.5 overflow-x-auto pb-1 font-sans">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => handleSelectPredefinedAvatar(opt.url)}
                    className={`shrink-0 w-11 h-11 rounded-full relative transition-all overflow-hidden ${
                      formData.avatar === opt.url ? 'ring-2 ring-pink-500 ring-offset-1 p-0.5' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={opt.url} alt={opt.name} className="w-full h-full object-cover rounded-full" />
                  </button>
                ))}
              </div>
            ) : avatarInputMode === 'upload' ? (
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 hover:border-pink-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setFormData(prev => ({ ...prev, avatar: reader.result }));
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                >
                  <Upload size={20} className="text-slate-400 mb-1" />
                  <span className="text-xs text-slate-800 font-bold">Clique ou arraste para subir uma foto</span>
                  <span className="text-[9px] text-slate-400">Formatos suportados: JPG, PNG, WEBP</span>
                  {formData.avatar.startsWith('data:image') && (
                    <div className="mt-2 flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-2 py-1 rounded text-[10px] font-bold">
                      <CheckCircle size={10} className="text-emerald-500" />
                      <span>Foto carregada com sucesso!</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <input 
                type="url" 
                placeholder="Insira a URL da imagem..."
                value={customAvatarUrl}
                onChange={e => setCustomAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-pink-400 outline-none transition-all placeholder:text-slate-350"
              />
            )}
          </div>

          {/* Form Group: Notificações */}
          <div className="bg-slate-50 p-3 rounded-2xl space-y-2">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-tight">Canais de Notificação</span>
            
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[11px] font-semibold text-slate-700">Lembretes por WhatsApp</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.whatsappNotifications} 
                  onChange={e => setFormData(p => ({ ...p, whatsappNotifications: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-slate-200 rounded-full peer peer-focus:ring-1 peer-focus:ring-pink-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-[11px] font-semibold text-slate-700">Informativos por E-mail</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.emailNotifications} 
                  onChange={e => setFormData(p => ({ ...p, emailNotifications: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-slate-200 rounded-full peer peer-focus:ring-1 peer-focus:ring-pink-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>
          </div>

          {/* Success Notification Alert */}
          {successMessage && (
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-1">
              <CheckCircle size={14} className="text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button 
              type="button"
              onClick={() => setShowEditPanel(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all text-center"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-md transition-all text-center flex items-center justify-center space-x-1"
            >
              <Save size={13} />
              <span>Salvar Cadastro</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
