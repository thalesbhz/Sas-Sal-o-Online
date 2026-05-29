import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDocFromServer 
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Appointment, Stylist, Service } from '../data/mock';
import { getSalonSlug } from '../utils/slug';

export interface BusinessDayHours {
  dayIndex: number;
  dayLabel: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface BannerConfig {
  discountLabel: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  bgColor: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  birthday?: string;
  gender?: string;
  instagram?: string;
  whatsappNotifications?: boolean;
  emailNotifications?: boolean;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT';
  password?: string;
  salonId?: string;
}

export interface Salon {
  id: string;
  name: string;
  adminEmail: string;
  phone: string;
  address: string;
  status: 'ATIVO' | 'INATIVO';
  createdAt: string;
  appointmentCount?: number;
  clientCount?: number;
  password?: string;
}

interface AppContextType {
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  allStylists: Stylist[];
  addStylist: (stylist: Omit<Stylist, 'id'>) => void;
  removeStylist: (id: string) => void;
  updateStylist: (id: string, stylist: Partial<Omit<Stylist, 'id'>>) => void;
  allServices: Service[];
  addService: (service: Omit<Service, 'id'>) => void;
  removeService: (id: string) => void;
  updateService: (id: string, service: Partial<Omit<Service, 'id'>>) => Promise<void>;
  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, client: Partial<Omit<Client, 'id'>>) => void;
  removeClient: (id: string) => void;
  salons: Salon[];
  addSalon: (salon: Omit<Salon, 'id' | 'createdAt'>) => Promise<string | undefined>;
  updateSalon: (id: string, fields: Partial<Omit<Salon, 'id' | 'createdAt'>>) => Promise<void>;
  removeSalon: (id: string) => Promise<void>;
  currentUser: { 
    id: string; 
    name: string; 
    role: 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT';
    phone?: string;
    email?: string;
    avatar?: string;
    birthday?: string;
    gender?: string;
    instagram?: string;
    whatsappNotifications?: boolean;
    emailNotifications?: boolean;
    password?: string;
  } | null;
  updateCurrentUser: (user: Partial<Omit<NonNullable<AppContextType['currentUser']>, 'id' | 'role'>>) => void;
  loginUser: (name: string, email: string, passwordInput?: string, forceAdminChecked?: boolean) => Promise<void>;
  registerUser: (clientData: Omit<Client, 'id'>) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInDemo: (email: string, role: 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT', name: string) => Promise<void>;
  logoutUser: () => void;
  businessHours: BusinessDayHours[];
  updateBusinessHours: (hours: BusinessDayHours[]) => void;
  updateSingleDayHours: (dayIndex: number, fields: Partial<Omit<BusinessDayHours, 'dayIndex' | 'dayLabel'>>) => void;
  bannerConfig: BannerConfig;
  updateBannerConfig: (config: Partial<BannerConfig>) => void;
  authLoading: boolean;
  selectedSalonId: string | null;
  setSelectedSalonId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SERVICES = [
  { id: 's1', name: 'Corte Feminino', price: 120, durationMinutes: 45, icon: 'Scissors' },
  { id: 's2', name: 'Escova Modelada', price: 90, durationMinutes: 30, icon: 'Wind' },
  { id: 's3', name: 'Mechas Vogue', price: 450, durationMinutes: 180, icon: 'Sparkles' },
  { id: 's4', name: 'Manicure Premium', price: 60, durationMinutes: 45, icon: 'Sparkles' },
];

const DEFAULT_STYLISTS = [
  { id: 'p1', name: 'Mariana Costa', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150', rating: 4.9, services: ['s1', 's2'] },
  { id: 'p2', name: 'Juliana Reis', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150', rating: 4.8, services: ['s3', 's4'] },
];

const DEFAULT_HOURS = [
  { dayIndex: 0, dayLabel: 'Domingo', isOpen: false, openTime: '09:00', closeTime: '13:00' },
  { dayIndex: 1, dayLabel: 'Segunda-feira', isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { dayIndex: 2, dayLabel: 'Terça-feira', isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { dayIndex: 3, dayLabel: 'Quarta-feira', isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { dayIndex: 4, dayLabel: 'Quinta-feira', isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { dayIndex: 5, dayLabel: 'Sexta-feira', isOpen: true, openTime: '08:00', closeTime: '20:00' },
  { dayIndex: 6, dayLabel: 'Sábado', isOpen: true, openTime: '08:00', closeTime: '18:00' },
];

const DEFAULT_BANNER = {
  discountLabel: 'ATÉ',
  title: '45%',
  subtitle: 'TODOS OS PACOTES',
  imageUrl: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=200&h=200',
  bgColor: 'bg-pink-500'
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allStylists, setAllStylists] = useState<Stylist[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentUser, setCurrentUser] = useState<AppContextType['currentUser']>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [businessHours, setBusinessHours] = useState<BusinessDayHours[]>(DEFAULT_HOURS);
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>(DEFAULT_BANNER);
  const [salons, setSalons] = useState<Salon[]>([]);

  const [selectedSalonId, setSelectedSalonIdState] = useState<string | null>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlSalonId = searchParams.get('salonId') || searchParams.get('salon');
    if (urlSalonId) {
      localStorage.setItem('vogue_client_selected_salon_id', urlSalonId);
      return urlSalonId;
    }
    return localStorage.getItem('vogue_client_selected_salon_id');
  });

  const setSelectedSalonId = (id: string | null) => {
    setSelectedSalonIdState(id);
    if (id) {
      localStorage.setItem('vogue_client_selected_salon_id', id);
    } else {
      localStorage.removeItem('vogue_client_selected_salon_id');
    }
  };

  // Connection testing + initial bootstrap trigger
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('offline')) {
          console.warn("Client database connection is offline. Utilizing offline cache.");
        }
      }
    };
    testConnection();

    const runBootstrap = async () => {
      try {
        const servicesSnap = await getDocs(collection(db, 'services'));
        if (servicesSnap.empty) {
          for (const s of DEFAULT_SERVICES) {
            await setDoc(doc(db, 'services', s.id), {
              name: s.name,
              price: s.price,
              durationMinutes: s.durationMinutes,
              icon: s.icon
            });
          }
        }
        
        const stylistsSnap = await getDocs(collection(db, 'stylists'));
        if (stylistsSnap.empty) {
          for (const p of DEFAULT_STYLISTS) {
            await setDoc(doc(db, 'stylists', p.id), {
              name: p.name,
              avatar: p.avatar,
              rating: p.rating,
              services: p.services
            });
          }
        }

        const hoursSnap = await getDocs(collection(db, 'businessHours'));
        if (hoursSnap.empty) {
          for (const h of DEFAULT_HOURS) {
            await setDoc(doc(db, 'businessHours', String(h.dayIndex)), h);
          }
        }

        const bannerSnap = await getDoc(doc(db, 'bannerConfig', 'banner'));
        if (!bannerSnap.exists()) {
          await setDoc(doc(db, 'bannerConfig', 'banner'), DEFAULT_BANNER);
        }

        const salonsSnap = await getDocs(collection(db, 'salons'));
        if (salonsSnap.empty) {
          const defaultSalonId = 'sal_vogue_main';
          await setDoc(doc(db, 'salons', defaultSalonId), {
            id: defaultSalonId,
            name: 'Vogue Salão Principal',
            adminEmail: 'vogue_admin@vogue.com',
            phone: '(31) 98765-4321',
            address: 'Av. Paulista, 1000 - São Paulo, SP',
            status: 'ATIVO',
            createdAt: new Date().toISOString(),
            appointmentCount: 5,
            clientCount: 10,
            password: '123'
          });

          const defaultAdminUid = 'client_admin_vogue_main';
          await setDoc(doc(db, 'clients', defaultAdminUid), {
            id: defaultAdminUid,
            name: 'Administrador Vogue',
            email: 'vogue_admin@vogue.com',
            role: 'ADMIN',
            phone: '(31) 98765-4321',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
            password: '123',
            salonId: defaultSalonId
          }, { merge: true });

          await setDoc(doc(db, 'admins', defaultAdminUid), {
            email: 'vogue_admin@vogue.com',
            role: 'ADMIN',
            salonId: defaultSalonId
          }, { merge: true });
        }
      } catch (e) {
        console.warn("Firestore bootstrap skipped or completed:", e);
      }
    };
    runBootstrap();
  }, []);

  // Capture Google redirect sign-in result on mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Completou login via redirecionamento Google:", result.user.email);
        }
      } catch (err) {
        console.warn("Erro ao processar redirecionamento Google (esperado fora de fluxo ativo):", err);
      }
    };
    checkRedirectResult();
  }, []);

  // Monitor Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Clear local simulation auth since we successfully signed into Firebase
        localStorage.removeItem('vogue_local_auth');
        localStorage.removeItem('vogue_local_user');

        const email = firebaseUser.email || '';
        const isUserAdmin = email === 'pisantebhz@gmail.com';
        
        // Check if there is an existing salon admin email matching this email
        let isSalonAdminResult = false;
        let matchedSalonId: string | undefined = undefined;
        try {
          const salonsRef = collection(db, 'salons');
          const qSal = query(salonsRef, where('adminEmail', '==', email.toLowerCase().trim()));
          const qSalSnap = await getDocs(qSal);
          if (!qSalSnap.empty) {
            isSalonAdminResult = true;
            matchedSalonId = qSalSnap.docs[0].id;
          }
        } catch (salErr) {
          console.warn("Could not check salons for admin email on auth change:", salErr);
        }

        // Synchronize admin status to admins collection
        if (isUserAdmin || isSalonAdminResult) {
          try {
            await setDoc(doc(db, 'admins', firebaseUser.uid), {
              email: email,
              role: isUserAdmin ? 'SUPER_ADMIN' : 'ADMIN',
              ...(matchedSalonId ? { salonId: matchedSalonId } : {})
            }, { merge: true });
            console.log("Synchronized privileges to admins collection successfully.");
          } catch (adminsErr) {
            console.warn("Failed to write to admins collection:", adminsErr);
          }
        }

        const profileRef = doc(db, 'clients', firebaseUser.uid);
        
        const clientUnsub = onSnapshot(profileRef, async (profileDoc) => {
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            const role = isUserAdmin ? 'SUPER_ADMIN' : (data.role || 'CLIENT');

            // Synchronize role and salon match changes if dynamic field is updated
            if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
              try {
                await setDoc(doc(db, 'admins', firebaseUser.uid), {
                  email: data.email || email,
                  role: role,
                  ...(data.salonId ? { salonId: data.salonId } : (matchedSalonId ? { salonId: matchedSalonId } : {}))
                }, { merge: true });
              } catch (adminErr) {
                console.warn("Could not sync role to admins collection inside snapshot:", adminErr);
              }
            } else {
              try {
                await deleteDoc(doc(db, 'admins', firebaseUser.uid));
              } catch (adminErr) {
                // Ignore
              }
            }

            setCurrentUser({
              id: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || 'Cliente',
              role: role,
              email: data.email || email,
              phone: data.phone || '',
              avatar: data.avatar || firebaseUser.photoURL || '',
              birthday: data.birthday || '',
              gender: data.gender || 'Feminino',
              instagram: data.instagram || '',
              whatsappNotifications: data.whatsappNotifications !== false,
              emailNotifications: data.emailNotifications === true,
            });

            if (isUserAdmin) {
              try {
                const savedStr = localStorage.getItem('vogue_local_salons');
                if (savedStr) {
                  const savedList: Salon[] = JSON.parse(savedStr);
                  for (const s of savedList) {
                    await setDoc(doc(db, 'salons', s.id), s, { merge: true });
                  }
                  console.log("Auto-synchronized local salons to Firestore.");
                }
              } catch (syncErr) {
                console.warn("Could not sync local salons to Firestore:", syncErr);
              }
            }
          } else {
            // Auto-create client profile document in Firestore so that updates and other operations succeed
            try {
              let roleToSet: 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT' = isUserAdmin ? 'SUPER_ADMIN' : 'CLIENT';
              let nameToSet = firebaseUser.displayName || 'Cliente';
              let passwordToSet = '';

              if (!isUserAdmin && email) {
                const emailLower = email.toLowerCase().trim();
                const salonsRef = collection(db, 'salons');
                const qSal = query(salonsRef, where('adminEmail', '==', emailLower));
                const qSalSnap = await getDocs(qSal);
                if (!qSalSnap.empty) {
                  roleToSet = 'ADMIN';
                  const sData = qSalSnap.docs[0].data();
                  nameToSet = sData.name ? (sData.name + " Admin") : nameToSet;
                  passwordToSet = sData.password || '';
                } else {
                  const clientsRef = collection(db, 'clients');
                  const qClient = query(clientsRef, where('email', '==', emailLower), where('role', 'in', ['ADMIN', 'SUPER_ADMIN']));
                  const qClientSnap = await getDocs(qClient);
                  if (!qClientSnap.empty) {
                    const cData = qClientSnap.docs[0].data();
                    roleToSet = cData.role || 'CLIENT';
                    nameToSet = cData.name || nameToSet;
                    passwordToSet = cData.password || '';
                  }
                }
              }

              await setDoc(profileRef, {
                id: firebaseUser.uid,
                name: nameToSet,
                email: email,
                phone: '',
                avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
                birthday: '',
                gender: 'Feminino',
                instagram: '',
                whatsappNotifications: true,
                emailNotifications: false,
                role: roleToSet,
                ...(passwordToSet ? { password: passwordToSet } : {}),
                ...(isUserAdmin ? { password: 'vogue_super_admin' } : {})
              }, { merge: true });
            } catch (err) {
              console.warn("Could not auto-create client profile on initial sign-in:", err);
            }
          }
          setAuthLoading(false);
        }, (err) => {
          console.error("Client profile listen error:", err);
          setAuthLoading(false);
        });

        return () => clientUnsub();
      } else {
        // Try fallback to local authentication if active
        if (localStorage.getItem('vogue_local_auth') === 'true') {
          const savedUser = localStorage.getItem('vogue_local_user');
          if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
            setAuthLoading(false);
            return;
          }
        }
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 1. Services real-time listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'services'), (snap) => {
      const fbList: Service[] = [];
      snap.forEach((doc) => {
        fbList.push({ ...doc.data(), id: doc.id } as Service);
      });
      if (fbList.length > 0) {
        setAllServices(fbList);
      } else {
        const saved = localStorage.getItem('vogue_local_services');
        if (saved) {
          setAllServices(JSON.parse(saved));
        } else {
          setAllServices(DEFAULT_SERVICES);
        }
      }
    }, (error) => {
      console.warn("Services snap error, falling back to local storage:", error);
      const saved = localStorage.getItem('vogue_local_services');
      if (saved) {
        setAllServices(JSON.parse(saved));
      } else {
        setAllServices(DEFAULT_SERVICES);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // 2. Stylists real-time listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'stylists'), (snap) => {
      const fbList: Stylist[] = [];
      snap.forEach((doc) => {
        fbList.push({ ...doc.data(), id: doc.id } as Stylist);
      });
      if (fbList.length > 0) {
        setAllStylists(fbList);
      } else {
        const saved = localStorage.getItem('vogue_local_stylists');
        if (saved) {
          setAllStylists(JSON.parse(saved));
        } else {
          setAllStylists(DEFAULT_STYLISTS);
        }
      }
    }, (error) => {
      console.warn("Stylists snap error, falling back to local storage:", error);
      const saved = localStorage.getItem('vogue_local_stylists');
      if (saved) {
        setAllStylists(JSON.parse(saved));
      } else {
        setAllStylists(DEFAULT_STYLISTS);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // 3. BusinessHours real-time listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'businessHours'), (snap) => {
      const fbList: BusinessDayHours[] = [];
      snap.forEach((doc) => {
        fbList.push({ ...doc.data(), dayIndex: Number(doc.id) } as BusinessDayHours);
      });
      fbList.sort((a, b) => a.dayIndex - b.dayIndex);
      if (fbList.length > 0) {
        setBusinessHours(fbList);
      } else {
        const saved = localStorage.getItem('vogue_local_hours');
        if (saved) {
          setBusinessHours(JSON.parse(saved));
        } else {
          setBusinessHours(DEFAULT_HOURS);
        }
      }
    }, (error) => {
      console.warn("BusinessHours snap error, falling back to local storage:", error);
      const saved = localStorage.getItem('vogue_local_hours');
      if (saved) {
        setBusinessHours(JSON.parse(saved));
      } else {
        setBusinessHours(DEFAULT_HOURS);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // 4. BannerConfig real-time listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'bannerConfig', 'banner'), (profileDoc) => {
      if (profileDoc.exists()) {
        setBannerConfig(profileDoc.data() as BannerConfig);
      } else {
        const saved = localStorage.getItem('vogue_local_banner');
        if (saved) {
          setBannerConfig(JSON.parse(saved));
        } else {
          setBannerConfig(DEFAULT_BANNER);
        }
      }
    }, (error) => {
      console.warn("BannerConfig snap error, falling back to local storage:", error);
      const saved = localStorage.getItem('vogue_local_banner');
      if (saved) {
        setBannerConfig(JSON.parse(saved));
      } else {
        setBannerConfig(DEFAULT_BANNER);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // 5. Appointments scoped subscription
  useEffect(() => {
    if (!currentUser) {
      setAppointments([]);
      return;
    }

    if (currentUser.id.startsWith('local_')) {
      const saved = localStorage.getItem('vogue_local_appointments');
      setAppointments(saved ? JSON.parse(saved) : []);
      return;
    }

    let q;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') {
      q = collection(db, 'appointments');
    } else {
      q = query(collection(db, 'appointments'), where('clientId', '==', currentUser.id));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as Appointment);
      });
      setAppointments(list);
    }, (error) => {
      console.error("Appointments list load skipped/refused:", error.message);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 6. Clients directory subscription
  useEffect(() => {
    if (!currentUser) {
      setClients([]);
      return;
    }

    if (currentUser.id.startsWith('local_')) {
      const localClientsStr = localStorage.getItem('vogue_local_clients');
      let localClients: Client[] = localClientsStr ? JSON.parse(localClientsStr) : [];
      if (!localClients.some(c => c.id === currentUser.id)) {
        localClients.push({
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
          birthday: currentUser.birthday || '',
          gender: currentUser.gender || 'Feminino',
          instagram: currentUser.instagram || '',
        });
        localStorage.setItem('vogue_local_clients', JSON.stringify(localClients));
      }
      setClients(localClients);
      return;
    }

    let q;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') {
      q = collection(db, 'clients');
    } else {
      q = query(collection(db, 'clients'), where('id', '==', currentUser.id));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Client[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as Client);
      });
      setClients(list);
    }, (error) => {
      console.error("Clients list load skipped/refused:", error.message);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 6. Salons real-time listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'salons'), (snap) => {
      const fbList: Salon[] = [];
      snap.forEach((doc) => {
        fbList.push({ ...doc.data(), id: doc.id } as Salon);
      });
      
      if (fbList.length > 0) {
        setSalons(fbList);
      } else {
        const saved = localStorage.getItem('vogue_local_salons');
        if (saved) {
          setSalons(JSON.parse(saved));
        } else {
          const defaultLocalSalon: Salon[] = [{
            id: 'sal_vogue_main',
            name: 'Vogue Salão Principal',
            adminEmail: 'vogue_admin@vogue.com',
            phone: '(31) 98765-4321',
            address: 'Av. Paulista, 1000 - São Paulo, SP',
            status: 'ATIVO',
            createdAt: new Date().toISOString(),
            appointmentCount: 5,
            clientCount: 10,
            password: '123'
          }];
          localStorage.setItem('vogue_local_salons', JSON.stringify(defaultLocalSalon));
          setSalons(defaultLocalSalon);

          const savedClients = localStorage.getItem('vogue_local_clients');
          const localClients = savedClients ? JSON.parse(savedClients) : [];
          if (!localClients.some((c: any) => c.email.toLowerCase() === 'vogue_admin@vogue.com')) {
            localClients.push({
              id: 'client_admin_vogue_main',
              name: 'Administrador Vogue',
              email: 'vogue_admin@vogue.com',
              role: 'ADMIN',
              phone: '(31) 98765-4321',
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
              password: '123',
              salonId: 'sal_vogue_main'
            });
            localStorage.setItem('vogue_local_clients', JSON.stringify(localClients));
          }
        }
      }
    }, (error) => {
      console.warn("Salons snap error, falling back to local storage:", error);
      const saved = localStorage.getItem('vogue_local_salons');
      if (saved) {
        setSalons(JSON.parse(saved));
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Sync selected salon from URL slug dynamically when salons list becomes available or when location shifts
  useEffect(() => {
    if (!salons || salons.length === 0) return;
    
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const searchParams = new URLSearchParams(window.location.search);
    const hasSalonQuery = searchParams.get('salonId') || searchParams.get('salon');
    
    if (pathParts.length > 0) {
      const slugCandidate = pathParts[0].toLowerCase().trim();
      const SYSTEM_PATHS = ['vogue-admin', 'admin-geral', 'appointments', 'profile', 'agenda', 'book'];
      
      if (!SYSTEM_PATHS.includes(slugCandidate)) {
        const matchedSalon = salons.find(s => getSalonSlug(s.name) === slugCandidate);
        if (matchedSalon) {
          if (selectedSalonId !== matchedSalon.id) {
            console.log(`Detected customized brand slug: "${slugCandidate}" -> selecting Salon: "${matchedSalon.name}"`);
            setSelectedSalonId(matchedSalon.id);
          }
        } else {
          if (selectedSalonId !== null && !hasSalonQuery) {
            setSelectedSalonId(null);
          }
        }
      }
    } else {
      // Exactly at root path "/"
      if (!hasSalonQuery) {
        if (selectedSalonId !== null) {
          console.log("At root route '/' without salon queries -> clearing selectedSalonId to show Main Hub Directory");
          setSelectedSalonId(null);
        }
      }
    }
  }, [salons, window.location.pathname, window.location.search]);

  // User Authentication Action Creators
  const loginUser = async (name: string, email: string, passwordInput?: string, forceAdminChecked?: boolean) => {
    setAuthLoading(true);
    const fallbackFirebasePassword = "VogueBooking123!";
    const emailLower = email.trim().toLowerCase();
    
    // Check if there is an Admin profile or Salon Admin with this email to enforce the password check
    let isAdminAccount = forceAdminChecked || false;
    let expectedPassword = '';
    let foundName = '';
    
    // 1. Check local storage first (for local simulation fallback)
    try {
      const localClientsStr = localStorage.getItem('vogue_local_clients');
      const localClients = localClientsStr ? JSON.parse(localClientsStr) : [];
      const localUser = localClients.find((c: any) => c.email.toLowerCase() === emailLower);
      if (localUser && (localUser.role === 'ADMIN' || localUser.role === 'SUPER_ADMIN')) {
        isAdminAccount = true;
        if (localUser.password) {
          expectedPassword = localUser.password;
        }
      }
      
      const savedSalons = localStorage.getItem('vogue_local_salons');
      if (savedSalons) {
        const salonsList = JSON.parse(savedSalons);
        const matchSal = salonsList.find((s: any) => s.adminEmail.toLowerCase() === emailLower);
        if (matchSal) {
          isAdminAccount = true;
          if (matchSal.password) {
            expectedPassword = matchSal.password;
          }
        }
      }
    } catch (err) {
      console.warn("Could not check admin in local storage", err);
    }

    // 2. Check in Firestore - Clients (might fail if not signed in yet due to firestore permissions, which is normal)
    try {
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('email', '==', emailLower));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const clientData = qSnap.docs[0].data();
        if (clientData.role === 'ADMIN' || clientData.role === 'SUPER_ADMIN') {
          isAdminAccount = true;
          foundName = clientData.name || '';
          if (clientData.password) {
            expectedPassword = clientData.password;
          }
        }
      }
    } catch (err) {
      console.warn("Could not query FireStore clients to check admin role (expected if not signed in):", err);
    }

    // 3. Check in Firestore - Salons (Public listable, always works!)
    try {
      const salonsRef = collection(db, 'salons');
      const qSal = query(salonsRef, where('adminEmail', '==', emailLower));
      const qSalSnap = await getDocs(qSal);
      if (!qSalSnap.empty) {
        const salonData = qSalSnap.docs[0].data();
        isAdminAccount = true;
        foundName = salonData.name ? (salonData.name + " Admin") : foundName;
        if (salonData.password) {
          expectedPassword = salonData.password;
        }
      }
    } catch (err) {
      console.warn("Could not query FireStore salons to check admin role:", err);
    }

    if (emailLower === 'pisantebhz@gmail.com') {
      isAdminAccount = true;
      if (!expectedPassword) {
        expectedPassword = 'vogue_super_admin';
      }
    }

    // Immediately verify the password if it can be resolved before logging in
    if (isAdminAccount && expectedPassword) {
      if (!passwordInput || !passwordInput.trim()) {
        setAuthLoading(false);
        throw new Error('Esta conta é administrativa. Por favor, marque "Acesso como Administrador" e digite sua senha.');
      }
      
      const isSuperAdminPasswordMatch = emailLower === 'pisantebhz@gmail.com' && (
        passwordInput.trim() === 'vogue_super_admin' || 
        passwordInput.trim() === 'vogue2026' || 
        passwordInput.trim() === 'voguebela2026' || 
        passwordInput.trim() === 'admin123' ||
        passwordInput.trim() === expectedPassword.trim()
      );

      if (emailLower === 'pisantebhz@gmail.com') {
        if (!isSuperAdminPasswordMatch) {
          setAuthLoading(false);
          throw new Error('Senha incorreta para a conta de Super Administrador.');
        }
      } else {
        if (passwordInput.trim() !== expectedPassword.trim()) {
          setAuthLoading(false);
          throw new Error('Senha incorreta para esta conta de administrador de salão.');
        }
      }
    }
    
    try {
      const signedInUserCredential = await signInWithEmailAndPassword(auth, emailLower, fallbackFirebasePassword);
      
      // Since they successfully signed into Firebase Auth, we now have permission to fetch their /clients/{uid} profile
      const uid = signedInUserCredential.user.uid;
      const profileDoc = await getDoc(doc(db, 'clients', uid));
      
      if (profileDoc.exists()) {
        const clientData = profileDoc.data();
        const isClientProfileAdmin = clientData.role === 'ADMIN' || clientData.role === 'SUPER_ADMIN';
        
        // Let's enforce password check if their client profile is administrative and hasn't been checked yet
        if (isClientProfileAdmin || forceAdminChecked) {
          const savedPw = clientData.password || '';
          
          if (!passwordInput || !passwordInput.trim()) {
            await signOut(auth);
            setCurrentUser(null);
            setAuthLoading(false);
            throw new Error('Esta conta é administrativa. Por favor, digite sua senha de administrador.');
          }
          
          const isSuperAdminPasswordMatch = emailLower === 'pisantebhz@gmail.com' && (
            passwordInput.trim() === 'vogue_super_admin' || 
            passwordInput.trim() === 'vogue2026' || 
            passwordInput.trim() === 'voguebela2026' || 
            passwordInput.trim() === 'admin123' ||
            (savedPw && passwordInput.trim() === savedPw.trim())
          );

          if (emailLower === 'pisantebhz@gmail.com') {
            if (!isSuperAdminPasswordMatch) {
              await signOut(auth);
              setCurrentUser(null);
              setAuthLoading(false);
              throw new Error('Senha incorreta para a conta de Super Administrador.');
            }
          } else {
            // Verify client profile password matches passwordInput
            if (savedPw && passwordInput.trim() !== savedPw.trim()) {
              await signOut(auth);
              setCurrentUser(null);
              setAuthLoading(false);
              throw new Error('Senha incorreta para esta conta de administrador.');
            }
          }
        }
      }
    } catch (error: any) {
      if (emailLower === 'pisantebhz@gmail.com') {
        console.warn("Super Admin Firebase email sign-in failed. Attempting to auto-create Super Admin account...", error);
        try {
          // Attempt to register the Super Admin on Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, emailLower, fallbackFirebasePassword);
          const uid = userCredential.user.uid;
          
          const firestoreClient: Client = {
            id: uid,
            name: 'Super Administrador',
            email: emailLower,
            role: 'SUPER_ADMIN',
            phone: '(31) 98765-4321',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
            birthday: '1995-05-15',
            gender: 'Masculino',
            instagram: '@vogue_admin',
            whatsappNotifications: true,
            emailNotifications: true,
            password: passwordInput ? passwordInput.trim() : 'vogue_super_admin'
          };
          
          await setDoc(doc(db, 'clients', uid), firestoreClient);
          
          setCurrentUser(firestoreClient);
          
          // Also load the online clients list to match
          const clientsRef = collection(db, 'clients');
          const qSnap = await getDocs(clientsRef);
          const list: Client[] = [];
          qSnap.forEach((doc) => {
            list.push({ ...doc.data(), id: doc.id } as Client);
          });
          setClients(list);
          
          setAuthLoading(false);
          return;
        } catch (regErr: any) {
          console.warn("Super Admin auto-creation failed, falling back to local storage:", regErr);
          
          // Fallback to local session since password is correct and verified!
          const localUid = 'local_super_admin_fallback';
          const fallbackUser = {
            id: localUid,
            name: 'Super Administrador',
            role: 'SUPER_ADMIN' as const,
            phone: '(31) 98765-4321',
            email: emailLower,
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
            birthday: '1995-05-15',
            gender: 'Masculino',
            instagram: '@vogue_admin',
            whatsappNotifications: true,
            emailNotifications: true,
            password: 'vogue_super_admin'
          };
          
          localStorage.setItem('vogue_local_auth', 'true');
          localStorage.setItem('vogue_local_user', JSON.stringify(fallbackUser));
          setCurrentUser(fallbackUser);
          
          // Populate local clients list
          const localClientsStr = localStorage.getItem('vogue_local_clients');
          const localClients: Client[] = localClientsStr ? JSON.parse(localClientsStr) : [];
          if (!localClients.some(c => c.email.toLowerCase() === emailLower)) {
            localClients.push(fallbackUser);
            localStorage.setItem('vogue_local_clients', JSON.stringify(localClients));
          }
          setClients(localClients);
          setAuthLoading(false);
          return;
        }
      }

      if (error.code === 'auth/operation-not-allowed') {
        // Fallback gracefully to local simulation mode if Email/Password isn't activated in Firebase Console
        console.warn("Email/Password provider not enabled on Firebase. Falling back to local/cached session.");
        const localUid = 'local_' + Math.random().toString(36).substring(2, 9);
        const isUserSuperAdmin = emailLower === 'pisantebhz@gmail.com';
        const localClientsStr = localStorage.getItem('vogue_local_clients');
        const localClients: Client[] = localClientsStr ? JSON.parse(localClientsStr) : [];
        const existingLocalUser = localClients.find(c => c.email.toLowerCase() === emailLower);
        const savedRole = existingLocalUser?.role || (isUserSuperAdmin ? 'SUPER_ADMIN' : 'CLIENT');
        
        const fallbackUser = {
          id: localUid,
          name: name || existingLocalUser?.name || 'Cliente Demonstrativo',
          role: savedRole as 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT',
          phone: '',
          email: emailLower,
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
          birthday: '',
          gender: 'Feminino',
          instagram: '',
          whatsappNotifications: true,
          emailNotifications: false,
          password: expectedPassword || existingLocalUser?.password || '',
        };
        
        localStorage.setItem('vogue_local_auth', 'true');
        localStorage.setItem('vogue_local_user', JSON.stringify(fallbackUser));
        setCurrentUser(fallbackUser);
        
        // Populate local clients list
        if (!localClients.some(c => c.email.toLowerCase() === emailLower)) {
          localClients.push(fallbackUser);
          localStorage.setItem('vogue_local_clients', JSON.stringify(localClients));
        }
        setClients(localClients);
        setAuthLoading(false);
        return;
      }

      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        try {
          // Double check password before creating account if we found an expected admin password!
          if (isAdminAccount && expectedPassword) {
            const isSuperAdminMatch = emailLower === 'pisantebhz@gmail.com' && (
              passwordInput.trim() === 'vogue_super_admin' || 
              passwordInput.trim() === 'vogue2026' || 
              passwordInput.trim() === 'voguebela2026' || 
              passwordInput.trim() === 'admin123' ||
              passwordInput.trim() === expectedPassword.trim()
            );

            if (emailLower === 'pisantebhz@gmail.com') {
              if (!isSuperAdminMatch) {
                setAuthLoading(false);
                throw new Error('Senha incorreta para esta conta de super administrador.');
              }
            } else if (!passwordInput || passwordInput.trim() !== expectedPassword.trim()) {
              setAuthLoading(false);
              throw new Error('Senha incorreta para esta conta de administrador.');
            }
          }

          const userCredential = await createUserWithEmailAndPassword(auth, emailLower, fallbackFirebasePassword);
          const uid = userCredential.user.uid;
          
          await setDoc(doc(db, 'clients', uid), {
            id: uid,
            name: emailLower === 'pisantebhz@gmail.com' ? 'Super Administrador' : (foundName || name || 'Administrador'),
            email: emailLower,
            phone: '',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
            birthday: '',
            gender: 'Feminino',
            instagram: '',
            whatsappNotifications: true,
            emailNotifications: false,
            password: expectedPassword || '',
            role: emailLower === 'pisantebhz@gmail.com' ? 'SUPER_ADMIN' : (isAdminAccount ? 'ADMIN' : 'CLIENT')
          });

          // Clean up any orphaned client_admin_xxx documents to prevent duplication
          const clientsRef = collection(db, 'clients');
          const qClean = query(clientsRef, where('email', '==', emailLower));
          const cleanSnap = await getDocs(qClean);
          cleanSnap.forEach(async (docToClean) => {
            if (docToClean.id !== uid && docToClean.id.startsWith('client_admin_')) {
              try {
                await deleteDoc(doc(db, 'clients', docToClean.id));
                console.log(`Successfully cleaned up orphaned admin client doc: ${docToClean.id}`);
              } catch (cleanErr) {
                console.warn(`Could not delete old temporary client profile:`, cleanErr);
              }
            }
          });
        } catch (authErr: any) {
          if (authErr.code === 'auth/operation-not-allowed') {
            console.warn("Email/Password provider not enabled on creation. Falling back to local offline mode.");
            const localUid = 'local_' + Math.random().toString(36).substring(2, 9);
            const isUserSuperAdmin = emailLower === 'pisantebhz@gmail.com';
            const localClientsStr = localStorage.getItem('vogue_local_clients');
            const localClients: Client[] = localClientsStr ? JSON.parse(localClientsStr) : [];
            const existingLocalUser = localClients.find(c => c.email.toLowerCase() === emailLower);
            const savedRole = existingLocalUser?.role || (isUserSuperAdmin ? 'SUPER_ADMIN' : 'CLIENT');
            
            const fallbackUser = {
              id: localUid,
              name: name || existingLocalUser?.name || 'Cliente Demonstrativo',
              role: savedRole as 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT',
              phone: '',
              email: emailLower,
              avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
              birthday: '',
              gender: 'Feminino',
              instagram: '',
              whatsappNotifications: true,
              emailNotifications: false,
              password: expectedPassword || existingLocalUser?.password || '',
            };
            
            localStorage.setItem('vogue_local_auth', 'true');
            localStorage.setItem('vogue_local_user', JSON.stringify(fallbackUser));
            setCurrentUser(fallbackUser);
            
            if (!localClients.some(c => c.email.toLowerCase() === emailLower)) {
              localClients.push(fallbackUser);
              localStorage.setItem('vogue_local_clients', JSON.stringify(localClients));
            }
            setClients(localClients);
            setAuthLoading(false);
            return;
          }
          setAuthLoading(false);
          handleFirestoreError(authErr, OperationType.CREATE, `clients/${emailLower}`);
        }
      } else {
        setAuthLoading(false);
        handleFirestoreError(error, OperationType.GET, `auth/${emailLower}`);
      }
    }
  };

  const registerUser = async (clientData: Omit<Client, 'id'>) => {
    setAuthLoading(true);
    const password = clientData.password || "VogueBooking123!";
    const emailLower = clientData.email.trim().toLowerCase();
    const isUserSuperAdmin = emailLower === 'pisantebhz@gmail.com';
    const finalRole = clientData.role || (isUserSuperAdmin ? 'SUPER_ADMIN' : 'CLIENT');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
      const uid = userCredential.user.uid;
      
      const firestoreClient = {
        id: uid,
        ...clientData,
        role: finalRole,
        email: emailLower
      };

      await setDoc(doc(db, 'clients', uid), firestoreClient);
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        console.warn("Email/Password provider not enabled on Firebase. Utilizing local fallback storage.");
        const localUid = 'local_' + Math.random().toString(36).substring(2, 9);
        
        const fallbackUser = {
          id: localUid,
          role: finalRole as 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT',
          ...clientData,
          email: emailLower
        };
        
        localStorage.setItem('vogue_local_auth', 'true');
        localStorage.setItem('vogue_local_user', JSON.stringify(fallbackUser));
        setCurrentUser(fallbackUser);
        
        const localClientsStr = localStorage.getItem('vogue_local_clients');
        const localClients: Client[] = localClientsStr ? JSON.parse(localClientsStr) : [];
        if (!localClients.some(c => c.email.toLowerCase() === emailLower)) {
          localClients.push(fallbackUser);
          localStorage.setItem('vogue_local_clients', JSON.stringify(localClients));
        }
        setClients(localClients);
        setAuthLoading(false);
        return;
      }
      setAuthLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        console.warn("Google Sign-In popup falhou ou foi bloqueada. Desviando para redirect:", popupError);
        const isIframeOrBlocked = 
          popupError.code === 'auth/popup-blocked' ||
          popupError.code === 'auth/iframe-start-fail' ||
          popupError.code === 'auth/web-storage-unsupported' ||
          popupError.code === 'auth/cancelled-popup-request' ||
          popupError.message?.includes('popup') ||
          popupError.message?.includes('iframe');
          
        if (isIframeOrBlocked) {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
    } catch (error) {
      setAuthLoading(false);
      console.error("Google Sign-In Error. Bypassing or reporting:", error);
      throw error;
    }
  };

  const signInDemo = async (email: string, role: 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT', name: string) => {
    setAuthLoading(true);
    const localUid = 'local_demo_' + Math.random().toString(36).substring(2, 9);
    const fallbackUser = {
      id: localUid,
      name: name,
      role: role,
      phone: '(31) 98765-4321',
      email: email.toLowerCase().trim(),
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
      birthday: '1995-05-15',
      gender: 'Feminino',
      instagram: '@vogue_demo',
      whatsappNotifications: true,
      emailNotifications: true,
    };
    
    localStorage.setItem('vogue_local_auth', 'true');
    localStorage.setItem('vogue_local_user', JSON.stringify(fallbackUser));
    setCurrentUser(fallbackUser);
    
    // Sync local clients list
    const localClientsStr = localStorage.getItem('vogue_local_clients');
    const localClients: Client[] = localClientsStr ? JSON.parse(localClientsStr) : [];
    if (!localClients.some(c => c.email.toLowerCase() === email.toLowerCase())) {
      localClients.push(fallbackUser);
      localStorage.setItem('vogue_local_clients', JSON.stringify(localClients));
    }
    setClients(localClients);
    setAuthLoading(false);
  };

  const logoutUser = async () => {
    setAuthLoading(true);
    try {
      localStorage.removeItem('vogue_local_auth');
      localStorage.removeItem('vogue_local_user');
      setCurrentUser(null);
      await signOut(auth);
    } catch (err) {
      console.error("SignOut Err:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const updateCurrentUser = async (fields: Partial<Omit<NonNullable<AppContextType['currentUser']>, 'id' | 'role'>>) => {
    if (!currentUser) return;
    try {
      if (currentUser.id.startsWith('local_')) {
        const updated = { ...currentUser, ...fields };
        setCurrentUser(updated);
        localStorage.setItem('vogue_local_user', JSON.stringify(updated));
        
        // Sync local client list
        const localClientsStr = localStorage.getItem('vogue_local_clients');
        if (localClientsStr) {
          const localClientsObj: Client[] = JSON.parse(localClientsStr);
          const idx = localClientsObj.findIndex(c => c.id === currentUser.id);
          if (idx !== -1) {
            localClientsObj[idx] = { ...localClientsObj[idx], ...fields };
            localStorage.setItem('vogue_local_clients', JSON.stringify(localClientsObj));
            setClients(localClientsObj);
          }
        }
        return;
      }
      await setDoc(doc(db, 'clients', currentUser.id), fields, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${currentUser.id}`);
    }
  };

  // Appointments CRUD
  const addAppointment = async (appt: Omit<Appointment, 'id' | 'status'>) => {
    try {
      const mySalon = salons?.find(s => s.adminEmail.toLowerCase() === currentUser?.email?.toLowerCase());
      const selectedStylistObj = allStylists.find(s => s.id === appt.stylistId);
      const stylistSalonId = selectedStylistObj?.salonId;
      const finalSalonId = (appt as any).salonId || stylistSalonId || mySalon?.id || 'sal_vogue_main';

      if (currentUser?.id.startsWith('local_')) {
        const id = 'apt_' + Math.random().toString(36).substring(2, 9);
        const newAppt: Appointment = {
          ...appt,
          clientName: appt.clientName || currentUser?.name || 'Cliente',
          id,
          status: 'CONFIRMADO',
          salonId: finalSalonId,
        };
        const currentSaved = localStorage.getItem('vogue_local_appointments');
        const appointmentsList: Appointment[] = currentSaved ? JSON.parse(currentSaved) : [];
        appointmentsList.push(newAppt);
        localStorage.setItem('vogue_local_appointments', JSON.stringify(appointmentsList));
        setAppointments(appointmentsList);
        return;
      }

      const apptRef = doc(collection(db, 'appointments'));
      const newAppt: Appointment = {
        ...appt,
        clientName: appt.clientName || currentUser?.name || 'Cliente',
        id: apptRef.id,
        status: 'CONFIRMADO',
        salonId: finalSalonId,
      };
      await setDoc(apptRef, newAppt);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'appointments');
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    try {
      if (currentUser?.id.startsWith('local_')) {
        const currentSaved = localStorage.getItem('vogue_local_appointments');
        let appointmentsList: Appointment[] = currentSaved ? JSON.parse(currentSaved) : [];
        appointmentsList = appointmentsList.map(a => a.id === id ? { ...a, status } : a);
        localStorage.setItem('vogue_local_appointments', JSON.stringify(appointmentsList));
        setAppointments(appointmentsList);
        return;
      }
      await updateDoc(doc(db, 'appointments', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  // Staff (Stylists) CRUD
  const addStylist = async (stylist: Omit<Stylist, 'id'>) => {
    try {
      const mySalon = salons?.find(s => s.adminEmail.toLowerCase() === currentUser?.email?.toLowerCase());
      const finalSalonId = (stylist as any).salonId || mySalon?.id || 'sal_vogue_main';

      if (currentUser?.id.startsWith('local_')) {
        const id = 'p_local_' + Math.random().toString(36).substring(2, 9);
        const newStylist = { ...stylist, id, rating: 5.0, salonId: finalSalonId };
        setAllStylists(prev => {
          const updated = [...prev, newStylist];
          localStorage.setItem('vogue_local_stylists', JSON.stringify(updated));
          return updated;
        });
        return;
      }
      const ref = doc(collection(db, 'stylists'));
      const newStylist: Stylist = {
        ...stylist,
        id: ref.id,
        rating: 5.0,
        salonId: finalSalonId,
      };
      await setDoc(ref, newStylist);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stylists');
    }
  };

  const removeStylist = async (id: string) => {
    try {
      if (currentUser?.id.startsWith('local_')) {
        setAllStylists(prev => {
          const updated = prev.filter(s => s.id !== id);
          localStorage.setItem('vogue_local_stylists', JSON.stringify(updated));
          return updated;
        });
        return;
      }
      await deleteDoc(doc(db, 'stylists', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `stylists/${id}`);
    }
  };

  const updateStylist = async (id: string, updatedFields: Partial<Omit<Stylist, 'id'>>) => {
    try {
      if (currentUser?.id.startsWith('local_')) {
        setAllStylists(prev => {
          const updated = prev.map(s => s.id === id ? { ...s, ...updatedFields } : s);
          localStorage.setItem('vogue_local_stylists', JSON.stringify(updated));
          return updated;
        });
        return;
      }
      await updateDoc(doc(db, 'stylists', id), updatedFields);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stylists/${id}`);
    }
  };

  // Services CRUD
  const addService = async (service: Omit<Service, 'id'>) => {
    try {
      const mySalon = salons?.find(s => s.adminEmail.toLowerCase() === currentUser?.email?.toLowerCase());
      const finalSalonId = (service as any).salonId || mySalon?.id || 'sal_vogue_main';

      if (currentUser?.id.startsWith('local_')) {
        const id = 's_local_' + Math.random().toString(36).substring(2, 9);
        const newService = { ...service, id, salonId: finalSalonId };
        setAllServices(prev => {
          const updated = [...prev, newService];
          localStorage.setItem('vogue_local_services', JSON.stringify(updated));
          return updated;
        });
        return;
      }
      const ref = doc(collection(db, 'services'));
      const newService: Service = {
        ...service,
        id: ref.id,
        salonId: finalSalonId,
      };
      await setDoc(ref, newService);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'services');
    }
  };

  const removeService = async (id: string) => {
    try {
      if (currentUser?.id.startsWith('local_')) {
        setAllServices(prev => {
          const updated = prev.filter(s => s.id !== id);
          localStorage.setItem('vogue_local_services', JSON.stringify(updated));
          return updated;
        });
        return;
      }
      await deleteDoc(doc(db, 'services', id));
      
      const affectedStylists = allStylists.filter(s => s.services.includes(id));
      for (const stylus of affectedStylists) {
        const updatedServices = stylus.services.filter(srvId => srvId !== id);
        await updateDoc(doc(db, 'stylists', stylus.id), { services: updatedServices });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `services/${id}`);
    }
  };

  const updateService = async (id: string, fields: Partial<Omit<Service, 'id'>>) => {
    try {
      if (currentUser?.id.startsWith('local_')) {
        setAllServices(prev => {
          const updated = prev.map(s => s.id === id ? { ...s, ...fields } : s);
          localStorage.setItem('vogue_local_services', JSON.stringify(updated));
          return updated;
        });
        return;
      }
      await setDoc(doc(db, 'services', id), fields, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `services/${id}`);
    }
  };

  // Clients Directory CRUD
  const addClient = async (client: Omit<Client, 'id'>) => {
    try {
      const mySalon = salons?.find(s => s.adminEmail.toLowerCase() === currentUser?.email?.toLowerCase());
      const finalSalonId = (client as any).salonId || mySalon?.id || 'sal_vogue_main';

      if (currentUser?.id.startsWith('local_')) {
        const id = 'c_local_' + Math.random().toString(36).substring(2, 9);
        const newClient = { ...client, id, salonId: finalSalonId };
        setClients(prev => [...prev, newClient]);
        
        const localClientsStr = localStorage.getItem('vogue_local_clients');
        const localClientsObj: Client[] = localClientsStr ? JSON.parse(localClientsStr) : [];
        localClientsObj.push(newClient);
        localStorage.setItem('vogue_local_clients', JSON.stringify(localClientsObj));
        return;
      }
      const clientRef = doc(collection(db, 'clients'));
      const newClient: Client = {
        ...client,
        id: clientRef.id,
        salonId: finalSalonId,
      };
      await setDoc(clientRef, newClient);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clients');
    }
  };

  const updateClient = async (id: string, updatedFields: Partial<Omit<Client, 'id'>>) => {
    try {
      if (currentUser?.id.startsWith('local_')) {
        setClients(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
        
        const localClientsStr = localStorage.getItem('vogue_local_clients');
        if (localClientsStr) {
          let localClientsObj: Client[] = JSON.parse(localClientsStr);
          localClientsObj = localClientsObj.map(c => c.id === id ? { ...c, ...updatedFields } : c);
          localStorage.setItem('vogue_local_clients', JSON.stringify(localClientsObj));
        }
        return;
      }
      await setDoc(doc(db, 'clients', id), updatedFields, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${id}`);
    }
  };

  const removeClient = async (id: string) => {
    try {
      if (currentUser?.id.startsWith('local_')) {
        setClients(prev => prev.filter(c => c.id !== id));
        
        const localClientsStr = localStorage.getItem('vogue_local_clients');
        if (localClientsStr) {
          let localClientsObj: Client[] = JSON.parse(localClientsStr);
          localClientsObj = localClientsObj.filter(c => c.id !== id);
          localStorage.setItem('vogue_local_clients', JSON.stringify(localClientsObj));
        }
        return;
      }
      await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
    }
  };

  // Business Configuration CRUD
  const updateBannerConfig = async (config: Partial<BannerConfig>) => {
    try {
      if (currentUser?.id.startsWith('local_')) {
        setBannerConfig(prev => {
          const updated = { ...prev, ...config };
          localStorage.setItem('vogue_local_banner', JSON.stringify(updated));
          return updated;
        });
        return;
      }
      await setDoc(doc(db, 'bannerConfig', 'banner'), config, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'bannerConfig/banner');
    }
  };

  const updateBusinessHours = async (hours: BusinessDayHours[]) => {
    try {
      if (currentUser?.id.startsWith('local_')) {
        setBusinessHours(hours);
        localStorage.setItem('vogue_local_hours', JSON.stringify(hours));
        return;
      }
      for (const h of hours) {
        await setDoc(doc(db, 'businessHours', String(h.dayIndex)), h);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'businessHours');
    }
  };

  const updateSingleDayHours = async (dayIndex: number, fields: Partial<Omit<BusinessDayHours, 'dayIndex' | 'dayLabel'>>) => {
    try {
      if (currentUser?.id.startsWith('local_')) {
        setBusinessHours(prev => {
          const updated = prev.map(h => h.dayIndex === dayIndex ? { ...h, ...fields } : h);
          localStorage.setItem('vogue_local_hours', JSON.stringify(updated));
          return updated;
        });
        return;
      }
      await setDoc(doc(db, 'businessHours', String(dayIndex)), fields, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `businessHours/${dayIndex}`);
    }
  };

  // Salons CRUD Operations
  const addSalon = async (salonData: Omit<Salon, 'id' | 'createdAt'>): Promise<string | undefined> => {
    try {
      const id = 'sal_' + Math.random().toString(36).substring(2, 9);
      const createdAt = new Date().toISOString();
      const newSalon: Salon = {
        ...salonData,
        id,
        createdAt,
        appointmentCount: Math.floor(Math.random() * 20) + 1,
        clientCount: Math.floor(Math.random() * 15) + 1,
      };

      if (currentUser?.id.startsWith('local_')) {
        setSalons(prev => {
          const updated = [...prev, newSalon];
          localStorage.setItem('vogue_local_salons', JSON.stringify(updated));
          return updated;
        });

        // Register a local client user with role: 'ADMIN' so they can login locally as admin
        const localClientsStr = localStorage.getItem('vogue_local_clients');
        const localClients: Client[] = localClientsStr ? JSON.parse(localClientsStr) : [];
        if (!localClients.some(c => c.email.toLowerCase() === salonData.adminEmail.toLowerCase())) {
          localClients.push({
            id: 'client_admin_' + Math.random().toString(36).substring(2, 9),
            name: salonData.name + " Admin",
            email: salonData.adminEmail.toLowerCase().trim(),
            role: 'ADMIN',
            phone: salonData.phone,
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
            password: salonData.password,
          });
          localStorage.setItem('vogue_local_clients', JSON.stringify(localClients));
        }
        return id;
      }

      await setDoc(doc(db, 'salons', id), newSalon);

      // Create a client with role = 'ADMIN' of the newly registered salon
      const adminUid = 'client_admin_' + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, 'clients', adminUid), {
        id: adminUid,
        name: salonData.name + " Admin",
        email: salonData.adminEmail.toLowerCase().trim(),
        role: 'ADMIN',
        phone: salonData.phone,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
        password: salonData.password,
      }, { merge: true });

      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'salons');
    }
  };

  const updateSalon = async (id: string, fields: Partial<Omit<Salon, 'id' | 'createdAt'>>) => {
    try {
      if (currentUser?.id.startsWith('local_')) {
        setSalons(prev => {
          const updated = prev.map(s => s.id === id ? { ...s, ...fields } : s);
          localStorage.setItem('vogue_local_salons', JSON.stringify(updated));
          return updated;
        });

        // Also update the local clients password and name if modified
        const salonToUpdate = salons.find(s => s.id === id);
        const adminEmailObj = fields.adminEmail || salonToUpdate?.adminEmail;
        if (adminEmailObj) {
          const emailLower = adminEmailObj.toLowerCase().trim();
          const localClientsStr = localStorage.getItem('vogue_local_clients');
          if (localClientsStr) {
            const localClients = JSON.parse(localClientsStr);
            const updatedClients = localClients.map((client: any) => {
              if (client.email.toLowerCase() === emailLower) {
                return {
                  ...client,
                  name: fields.name ? (fields.name + " Admin") : client.name,
                  phone: fields.phone || client.phone,
                  password: fields.password || client.password,
                };
              }
              return client;
            });
            localStorage.setItem('vogue_local_clients', JSON.stringify(updatedClients));
          }
        }
        return;
      }

      await setDoc(doc(db, 'salons', id), fields, { merge: true });

      // Search for the associated admin client document in Firestore to update as well
      const salonToUpdate = salons.find(s => s.id === id);
      const adminEmailObj = fields.adminEmail || salonToUpdate?.adminEmail;
      if (adminEmailObj) {
        const emailLower = adminEmailObj.toLowerCase().trim();
        const clientsQuery = query(collection(db, 'clients'), where('email', '==', emailLower));
        const clientsSnap = await getDocs(clientsQuery);
        clientsSnap.forEach(async (clientDoc) => {
          const clientRef = doc(db, 'clients', clientDoc.id);
          await setDoc(clientRef, {
            name: fields.name ? (fields.name + " Admin") : clientDoc.data().name,
            phone: fields.phone || clientDoc.data().phone,
            password: fields.password || clientDoc.data().password,
          }, { merge: true });
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `salons/${id}`);
    }
  };

  const removeSalon = async (id: string) => {
    try {
      if (currentUser?.id.startsWith('local_')) {
        setSalons(prev => {
          const updated = prev.filter(s => s.id !== id);
          localStorage.setItem('vogue_local_salons', JSON.stringify(updated));
          return updated;
        });
        return;
      }
      await deleteDoc(doc(db, 'salons', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `salons/${id}`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        appointments,
        addAppointment,
        updateAppointmentStatus,
        allStylists,
        addStylist,
        removeStylist,
        updateStylist,
        allServices,
        addService,
        removeService,
        updateService,
        clients,
        addClient,
        updateClient,
        removeClient,
        salons,
        addSalon,
        updateSalon,
        removeSalon,
        currentUser,
        updateCurrentUser,
        loginUser,
        registerUser,
        logoutUser,
        businessHours,
        updateBusinessHours,
        updateSingleDayHours,
        bannerConfig,
        updateBannerConfig,
        authLoading,
        signInWithGoogle,
        signInDemo,
        selectedSalonId,
        setSelectedSalonId
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
