import React, { useState } from 'react';
import { User, Mail, Sparkles, LogIn, Smartphone, Calendar, Instagram, Check, Camera, Image as ImageIcon, Lock } from 'lucide-react';
import { useAppContext } from '../store/AppContext';

export const LoginScreen = () => {
  const { loginUser, registerUser, signInWithGoogle } = useAppContext();
  const [isLoginTab, setIsLoginTab] = useState(true);
  
  // Login Form fields
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form fields (Cadastrar Novo Cliente)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState('Feminino');
  const [regBirthday, setRegBirthday] = useState('');
  const [regInstagram, setRegInstagram] = useState('');
  const [regAvatar, setRegAvatar] = useState('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150');
  const [regWhatsappNotifications, setRegWhatsappNotifications] = useState(true);
  const [regEmailNotifications, setRegEmailNotifications] = useState(false);
  const [customAvatarFile, setCustomAvatarFile] = useState<string | null>(null);
  
  // Validation and loading state
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
  ];

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomAvatarFile(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrimmed = loginEmail.trim();

    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    if (isAdminLogin) {
      if (!loginPassword.trim()) {
        setError('Por favor, informe sua senha de administrador.');
        return;
      }
    } else {
      if (!loginName.trim()) {
        setError('Por favor, digite seu nome.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await loginUser(loginName.trim(), emailTrimmed, loginPassword.trim());
    } catch (err: any) {
      setError(err?.message || 'Falha ao autenticar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Por favor, informe um e-mail de cadastro válido.');
      return;
    }
    if (!regPhone.trim()) {
      setError('Por favor, informe o celular ou whatsapp.');
      return;
    }

    setIsSubmitting(true);
    try {
      const avatarToSave = customAvatarFile || regAvatar;
      await registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        gender: regGender,
        birthday: regBirthday,
        instagram: regInstagram.trim(),
        avatar: avatarToSave,
        whatsappNotifications: regWhatsappNotifications,
        emailNotifications: regEmailNotifications,
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Falha ao realizar o cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError('Falha ao autenticar com o Google. Se estiver no iFrame do editor, permita pop-ups ou faça login via nome/e-mail (modo demonstrativo local).');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-start px-6 py-8 select-none max-w-lg mx-auto w-full">
      {/* Brand logo & tagline */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-pink-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-pink-200/50 mb-3 animate-pulse">
          <Sparkles className="text-white" size={28} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Vogue Salão</h2>
        <p className="text-xs text-slate-400 font-medium">Sua beleza, nossa obra de arte ✨</p>
      </div>

      {/* Login Card Container */}
      <div className="bg-white rounded-[32px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-50 p-1 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isLoginTab 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(false);
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              !isLoginTab 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {isLoginTab ? (
          /* SIMPLE LOGIN TAB */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Admin Toggle */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100/80">
              <div>
                <span className="block text-xs font-bold text-slate-700 leading-tight">Acesso de Administrador</span>
                <span className="block text-[9px] text-slate-400 font-bold mt-0.5">Ativar para gerentes e admin do salão</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={isAdminLogin}
                  onChange={(e) => {
                    setIsAdminLogin(e.target.checked);
                    setError(null);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>

            {!isAdminLogin ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Seu Nome</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-slate-300" size={16} />
                  <input
                    type="text"
                    required
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-pink-400 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-300"
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-slate-300" size={16} />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ana.silva@exemplo.com"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-pink-400 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-300"
                />
              </div>
            </div>

            {isAdminLogin && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-slate-300" size={16} />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Sua senha de administrador"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-pink-400 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-300"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 px-3 py-2.5 rounded-xl text-xs font-semibold border border-red-100">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all flex items-center justify-center space-x-2.5 active:scale-[0.99] transition-transform disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Autenticando...' : 'Entrar'}</span>
              <LogIn size={15} />
            </button>
          </form>
        ) : (
          /* RICH RECREATION OF CADASTRE - AS REQUESTED IN IMAGE */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Nome Completo */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 px-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-slate-300" size={16} />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ex: Ana Maria Silva"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-pink-400 focus:bg-white transition-all text-slate-800 font-semibold placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 px-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 text-slate-300" size={16} />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Ex: ana@exemplo.com"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-pink-400 focus:bg-white transition-all text-slate-800 font-semibold placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 px-1">Celular / WhatsApp</label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-3.5 text-slate-300" size={16} />
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-pink-400 focus:bg-white transition-all text-slate-800 font-semibold placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Gender identity and birthday */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 px-1">Gênero de Identidade</label>
                <select
                  value={regGender}
                  onChange={(e) => setRegGender(e.target.value)}
                  className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-pink-400 focus:bg-white transition-all text-slate-800 font-semibold"
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                  <option value="NaoInformar">Não Informar</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 px-1">Data de Nascimento</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 text-slate-300" size={16} />
                  <input
                    type="date"
                    value={regBirthday}
                    onChange={(e) => setRegBirthday(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-pink-400 focus:bg-white transition-all text-slate-800 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 px-1">Instagram (@usuario)</label>
              <div className="relative">
                <Instagram className="absolute left-3.5 top-3.5 text-slate-300" size={16} />
                <input
                  type="text"
                  value={regInstagram}
                  onChange={(e) => setRegInstagram(e.target.value)}
                  placeholder="Ex: @anasilva_beauty"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-pink-400 focus:bg-white transition-all text-slate-800 font-semibold placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Avatar picker (Upload + Presets) */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 px-1">Avatar / Foto de Perfil</label>
              <div className="flex items-center space-x-4 mb-3">
                <div className="relative w-14 h-14 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                  <img 
                    src={customAvatarFile || regAvatar} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <label className="px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-xl text-xs font-extrabold cursor-pointer transition-all select-none border border-pink-100 shadow-sm active:scale-95 duration-150">
                  Subir Imagem
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarFileChange} />
                </label>
              </div>

              {/* Presets Modelos list */}
              <div className="flex items-center space-x-2 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase pr-1.5">Modelos:</span>
                <div className="flex space-x-1.5">
                  {AVATAR_PRESETS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button" 
                      onClick={() => {
                        setRegAvatar(url);
                        setCustomAvatarFile(null);
                      }}
                      className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all relative ${
                        regAvatar === url && !customAvatarFile 
                          ? 'border-pink-500 scale-110 shadow-sm' 
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="preset" className="w-full h-full object-cover" />
                      {regAvatar === url && !customAvatarFile && (
                        <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                          <Check className="text-white drop-shadow-md" size={10} strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notification triggers */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100/80">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Notificações</span>
              
              <label className="flex items-start space-x-3 cursor-pointer select-none py-1 hover:bg-slate-50 px-2 rounded-xl transition-all">
                <input 
                  type="checkbox"
                  checked={regWhatsappNotifications}
                  onChange={e => setRegWhatsappNotifications(e.target.checked)}
                  className="w-4 h-4 rounded text-pink-500 border-slate-300 focus:ring-pink-400 cursor-pointer mt-0.5"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-800 leading-tight">Alertas por WhatsApp</span>
                  <span className="block text-[9px] text-slate-400 font-bold mt-0.5">Lembretes automáticos 24h antes</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer select-none py-1 hover:bg-slate-50 px-2 rounded-xl transition-all">
                <input 
                  type="checkbox"
                  checked={regEmailNotifications}
                  onChange={e => setRegEmailNotifications(e.target.checked)}
                  className="w-4 h-4 rounded text-pink-500 border-slate-300 focus:ring-pink-400 cursor-pointer mt-0.5"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-800 leading-tight">Avisos por E-mail</span>
                  <span className="block text-[9px] text-slate-400 font-bold mt-0.5">Confirmações de agendamento e promos</span>
                </div>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-3 py-2.5 rounded-xl text-xs font-semibold border border-red-100">
                ⚠️ {error}
              </div>
            )}

            {/* Register Action CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 mt-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg bg-pink-500 hover:bg-pink-600 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:bg-slate-300 shadow-pink-500/20"
            >
              <span>{isSubmitting ? 'Gerando Conta...' : 'CADASTRAR CLIENTE'}</span>
              <Check size={14} strokeWidth={3} />
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center my-3">
          <div className="flex-1 border-t border-slate-100"></div>
          <span className="px-3 text-[9px] font-bold text-slate-300 uppercase tracking-widest">ou</span>
          <div className="flex-1 border-t border-slate-100"></div>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl text-xs font-bold border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-center space-x-2.5 active:scale-[0.98] duration-150"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 15.02 1 12 1 7.24 1 3.2 3.74 1.29 7.72l3.82 2.96C6.01 7.21 8.78 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.46c-.28 1.47-1.11 2.72-2.37 3.56l3.69 2.86c2.16-1.99 3.71-4.92 3.71-8.52z"
            />
            <path
              fill="#FBBC05"
              d="M5.11 14.78c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2L1.29 7.42C.47 9.07 0 10.93 0 12.91s.47 3.84 1.29 5.49l3.82-2.96c-.23-.69-.36-1.43-.36-2.22z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.86c-1.02.68-2.33 1.09-4.27 1.09-3.22 0-5.99-2.17-6.96-5.09L1.22 16.1C3.13 20.15 7.19 23 12 23z"
            />
          </svg>
          <span>{googleLoading ? 'Conectando...' : 'Acessar com o Google'}</span>
        </button>
      </div>

      {/* Simulated/Demo Login Hint Footer */}
      <div className="mt-6 text-center space-y-2">
        <p className="text-[10px] text-slate-400 font-medium">
          O login via E-mail usará um <strong>modo de simulação local</strong> se o provedor de e-mail não estiver ativo no seu painel Firebase.
        </p>
        <p className="text-[10px] text-pink-500 font-bold uppercase tracking-wider">
          💡 Para uma experiência nativa sincronizada com o banco, utilize o login com o Google!
        </p>
      </div>
    </div>
  );
};
