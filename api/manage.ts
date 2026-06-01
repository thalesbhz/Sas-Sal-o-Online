import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDoc 
} from 'firebase/firestore';

// Fallback to environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase App in Serverless Environment
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, process.env.VITE_FIREBASE_DATABASE_ID);

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`[API Rota] Nova requisição recebida: ${req.method} com queries:`, req.query);

  // 1. Enforce Serverless Security with a Secret Token
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.API_SECRET_TOKEN;

  if (expectedToken) {
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.warn("[API Rota] Tentativa de acesso não autorizada - Token incorreto ou ausente.");
      return res.status(401).json({ 
        success: false, 
        error: "Não autorizado. O token Bearer no header de Authorization é necessário." 
      });
    }
    console.log("[API Rota] Token de autorização validado com sucesso.");
  } else {
    console.warn("[API Rota] ALERTA: API_SECRET_TOKEN não configurada no ambiente. Rota operando de forma pública.");
  }

  // 2. Identify the target operation from Query Params (e.g. /api/manage?action=addSalon)
  const { action, id } = req.query;

  if (!action) {
    return res.status(400).json({ 
      success: false, 
      error: "Query parameter 'action' é obrigatório. Escolha entre: addSalon, removeSalon, addClient, removeClient" 
    });
  }

  try {
    switch (action) {
      // -----------------------------------------------------------------
      // SALON ACTIONS
      // -----------------------------------------------------------------
      case 'addSalon': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: "Método POST é necessário para 'addSalon'" });
        }

        const salonData = req.body;
        if (!salonData || !salonData.name || !salonData.adminEmail) {
          return res.status(400).json({ success: false, error: "Parâmetros inválidos para o salão (nome e e-mail admin são obrigatórios)." });
        }

        const salonId = salonData.id || 'sal_' + Math.random().toString(36).substring(2, 9);
        const createdAt = salonData.createdAt || new Date().toISOString();
        const finalSalon = {
          ...salonData,
          id: salonId,
          createdAt,
          appointmentCount: salonData.appointmentCount || 0,
          clientCount: salonData.clientCount || 0
        };

        console.log(`[API Rota] Criando/Atualizando Salão com ID: ${salonId}`, finalSalon);
        
        // Save Salon Document
        await setDoc(doc(db, 'salons', salonId), finalSalon);

        // Auto-create associated Admin Client profile
        const adminUid = 'client_admin_' + Math.random().toString(36).substring(2, 9);
        await setDoc(doc(db, 'clients', adminUid), {
          id: adminUid,
          name: salonData.name + " Admin",
          email: salonData.adminEmail.toLowerCase().trim(),
          role: 'ADMIN',
          phone: salonData.phone || '',
          avatar: salonData.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
          password: salonData.password || 'VogueBooking123!',
          salonId: salonId,
        }, { merge: true });

        // Synchronize to secure Admins collection
        await setDoc(doc(db, 'admins', adminUid), {
          email: salonData.adminEmail.toLowerCase().trim(),
          role: 'ADMIN',
          salonId: salonId,
        }, { merge: true });

        console.log(`[API Rota] Salão ${salonId} e administrador ${adminUid} criados com sucesso.`);
        return res.status(200).json({ success: true, salonId, adminClientId: adminUid });
      }

      case 'removeSalon': {
        if (req.method !== 'DELETE') {
          return res.status(405).json({ success: false, error: "Método DELETE é necessário para 'removeSalon'" });
        }

        const targetId = id as string;
        if (!targetId) {
          return res.status(400).json({ success: false, error: "Parâmetro ID do salão é obrigatório para remoção." });
        }

        console.log(`[API Rota] Iniciando exclusão do salão com ID: ${targetId}`);
        await deleteDoc(doc(db, 'salons', targetId));
        console.log(`[API Rota] Salão ${targetId} removido do Firestore.`);
        return res.status(200).json({ success: true, message: `Salão com ID ${targetId} removido com sucesso.` });
      }

      // -----------------------------------------------------------------
      // CLIENT ACTIONS
      // -----------------------------------------------------------------
      case 'addClient': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: "Método POST é necessário para 'addClient'" });
        }

        const clientData = req.body;
        if (!clientData || !clientData.name || !clientData.email) {
          return res.status(400).json({ success: false, error: "Parâmetros inválidos para o cliente (nome e e-mail são obrigatórios)." });
        }

        const clientDocRef = doc(collection(db, 'clients'));
        const clientId = clientData.id || clientDocRef.id;
        const finalClient = {
          ...clientData,
          id: clientId,
          salonId: clientData.salonId || 'sal_vogue_main'
        };

        console.log(`[API Rota] Criando/Atualizando Cliente com ID: ${clientId}`, finalClient);
        await setDoc(doc(db, 'clients', clientId), finalClient);

        // Sync admin privileges if the user is classified as ADMIN or SUPER_ADMIN
        if (finalClient.role === 'ADMIN' || finalClient.role === 'SUPER_ADMIN') {
          await setDoc(doc(db, 'admins', clientId), {
            email: finalClient.email.toLowerCase().trim(),
            role: finalClient.role,
            ...(finalClient.salonId ? { salonId: finalClient.salonId } : {})
          }, { merge: true });
          console.log(`[API Rota] Privilégios administrativos sincronizados para o ID: ${clientId}`);
        }

        return res.status(200).json({ success: true, clientId });
      }

      case 'removeClient': {
        if (req.method !== 'DELETE') {
          return res.status(405).json({ success: false, error: "Método DELETE é necessário para 'removeClient'" });
        }

        const targetId = id as string;
        if (!targetId) {
          return res.status(400).json({ success: false, error: "Parâmetro ID do cliente é obrigatório para remoção." });
        }

        console.log(`[API Rota] Iniciando exclusão do cliente com ID: ${targetId}`);
        await deleteDoc(doc(db, 'clients', targetId));
        
        // Attempt clean up of potential admin record
        try {
          await deleteDoc(doc(db, 'admins', targetId));
          console.log(`[API Rota] Registro de administrador sincronizado e limpo, se aplicável, para o ID: ${targetId}`);
        } catch (adminCleanErr) {
          // Document may not have existed
        }

        console.log(`[API Rota] Cliente ${targetId} removido do Firestore.`);
        return res.status(200).json({ success: true, message: `Cliente com ID ${targetId} removido com sucesso.` });
      }

      default: {
        return res.status(400).json({ success: false, error: `Action '${action}' inválida.` });
      }
    }
  } catch (error: any) {
    console.error(`[API Rota] Ocorreu uma exceção no servidor de API:`, error);
    return res.status(500).json({ 
      success: false, 
      error: "Erro do servidor de API do Vercel.", 
      message: error?.message || String(error) 
    });
  }
}
