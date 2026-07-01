import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, ShieldAlert, Lock, Check, CheckCircle2, Upload,
  X, Image as ImageIcon, Building, Tag, Calendar, MapPin, 
  Bed, Maximize, AlertCircle, FileText, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Sparkles,
  Search, Copy, Globe, Share2, Users, UserCheck, User, Briefcase, CalendarDays, TrendingUp, HelpCircle, BarChart3, PieChart as PieIcon, Layers, MessageSquare, Clock, Send, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Property, BannerAd, BrandSettings, Broker, Client, Lead, Visit, Message, FloorPlan } from '../types';
import { auth, googleProvider, storage } from '../firebase';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as fbSignOut 
} from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
  seedInitialDatabase,
  saveBrokerToFirestore,
  deleteBrokerFromFirestore,
  saveClientToFirestore,
  deleteClientFromFirestore,
  saveLeadToFirestore,
  deleteLeadFromFirestore,
  saveVisitToFirestore,
  deleteVisitFromFirestore,
  saveMessageToFirestore,
  deleteMessageFromFirestore
} from '../services/firestoreService';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

export const EXECUTIVE_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200";

const formatAdminBedrooms = (val: string | number) => {
  const s = String(val).trim();
  if (s.toLowerCase().includes('qt') || s.toLowerCase().includes('quart') || s.toLowerCase().includes('dorm')) {
    return s;
  }
  return `${s} Qts`;
};

const formatAdminArea = (val: string | number) => {
  const s = String(val).trim();
  if (s.toLowerCase().includes('m²') || s.toLowerCase().includes('m2') || s.toLowerCase().includes('metr')) {
    return s;
  }
  return `${s} m²`;
};

const formatAdminParking = (val: string | number) => {
  const s = String(val).trim();
  if (s.toLowerCase().includes('vag') || s.toLowerCase().includes('vg')) {
    return s;
  }
  return `${s} vg`;
};

interface AdminPanelProps {
  properties: Property[];
  banners: BannerAd[];
  settings: BrandSettings;
  onSaveSettings: (settings: BrandSettings) => Promise<void>;
  onAddProperty: (p: Property) => void;
  onEditProperty: (p: Property) => void;
  onDeleteProperty: (id: string) => void;
  onAddBanner: (b: BannerAd) => void;
  onEditBanner: (b: BannerAd) => void;
  onDeleteBanner: (id: string) => void;
  brokers: Broker[];
  clients: Client[];
  leads: Lead[];
  visits: Visit[];
  messages: Message[];
}

export default function AdminPanel({
  properties,
  banners,
  settings,
  onSaveSettings,
  onAddProperty,
  onEditProperty,
  onDeleteProperty,
  onAddBanner,
  onEditBanner,
  onDeleteBanner,
  brokers = [],
  clients = [],
  leads = [],
  visits = [],
  messages = [],
}: AdminPanelProps) {
  // Authorization and Firebase state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  
  // Custom user role and active logged broker states
  const [userRole, setUserRole] = useState<'admin' | 'broker' | null>(null);
  const [loggedBroker, setLoggedBroker] = useState<Broker | null>(null);

  // Email/Password login fallback states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isEmailLoginOpen, setIsEmailLoginOpen] = useState(false);
  const [isEmailLoggingIn, setIsEmailLoggingIn] = useState(false);
  const [loginTab, setLoginTab] = useState<'google' | 'email'>('google');
  
  // Seeding status tracker
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // Settings Management States
  const [settingsPhone, setSettingsPhone] = useState(settings?.phone || '');
  const [settingsEmail, setSettingsEmail] = useState(settings?.email || '');
  const [settingsLogoUrl, setSettingsLogoUrl] = useState(settings?.logoUrl || '');
  const [settingsBrandName, setSettingsBrandName] = useState(settings?.brandName || '');
  const [settingsTagline, setSettingsTagline] = useState(settings?.tagline || '');
  const [settingsFaviconUrl, setSettingsFaviconUrl] = useState(settings?.faviconUrl || '');
  const [settingsShareLogoUrl, setSettingsShareLogoUrl] = useState(settings?.shareLogoUrl || '');
  const [settingsCompanyName, setSettingsCompanyName] = useState(settings?.companyName || '');
  const [settingsCreci, setSettingsCreci] = useState(settings?.creci || '');
  const [settingsCnpj, setSettingsCnpj] = useState(settings?.cnpj || '');
  const [settingsFooterLogoUrl, setSettingsFooterLogoUrl] = useState(settings?.footerLogoUrl || '');
  const [settingsFooterLogoHeight, setSettingsFooterLogoHeight] = useState(settings?.footerLogoHeight || '');
  const [settingsTermsOfUse, setSettingsTermsOfUse] = useState(settings?.termsOfUse || '');
  const [settingsPrivacyPolicy, setSettingsPrivacyPolicy] = useState(settings?.privacyPolicy || '');
  const [settingsCookieText, setSettingsCookieText] = useState(settings?.cookieText || '');
  const [settingsEnableCookieConsent, setSettingsEnableCookieConsent] = useState(settings?.enableCookieConsent !== false);
  const [settingsAboutHeading, setSettingsAboutHeading] = useState(settings?.aboutHeading || '');
  const [settingsAboutSubtitle, setSettingsAboutSubtitle] = useState(settings?.aboutSubtitle || '');
  const [settingsAboutHistory, setSettingsAboutHistory] = useState(settings?.aboutHistory || '');
  const [settingsMcmvLogoUrl, setSettingsMcmvLogoUrl] = useState(settings?.mcmvLogoUrl || '');
  const [settingsCadastroHeading, setSettingsCadastroHeading] = useState(settings?.cadastroHeading || '');
  const [settingsCadastroSubtitle, setSettingsCadastroSubtitle] = useState(settings?.cadastroSubtitle || '');
  const [settingsCadastroContent, setSettingsCadastroContent] = useState(settings?.cadastroContent || '');
  const [isSettingsUpdating, setIsSettingsUpdating] = useState(false);
  const [settingsUpdateStatus, setSettingsUpdateStatus] = useState<string | null>(null);

  // SEO Tab States
  const [selectedSeoPropertyId, setSelectedSeoPropertyId] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedSchemaId, setCopiedSchemaId] = useState<string | null>(null);
  const [activeSeoAccordion, setActiveSeoAccordion] = useState<number | null>(null);

  // Set default selected property for SEO once properties list is loaded
  useEffect(() => {
    if (properties.length > 0 && !selectedSeoPropertyId) {
      setSelectedSeoPropertyId(properties[0].id);
    }
  }, [properties, selectedSeoPropertyId]);

  useEffect(() => {
    if (settings) {
      setSettingsPhone(settings.phone);
      setSettingsEmail(settings.email);
      setSettingsLogoUrl(settings.logoUrl);
      setSettingsBrandName(settings.brandName);
      setSettingsTagline(settings.tagline);
      setSettingsFaviconUrl(settings.faviconUrl || '');
      setSettingsShareLogoUrl(settings.shareLogoUrl || '');
      setSettingsCompanyName(settings.companyName || '');
      setSettingsCreci(settings.creci || '');
      setSettingsCnpj(settings.cnpj || '');
      setSettingsFooterLogoUrl(settings.footerLogoUrl || '');
      setSettingsFooterLogoHeight(settings.footerLogoHeight || '');
      setSettingsTermsOfUse(settings.termsOfUse || '');
      setSettingsPrivacyPolicy(settings.privacyPolicy || '');
      setSettingsCookieText(settings.cookieText || '');
      setSettingsEnableCookieConsent(settings.enableCookieConsent !== false);
      setSettingsAboutHeading(settings.aboutHeading || '');
      setSettingsAboutSubtitle(settings.aboutSubtitle || '');
      setSettingsAboutHistory(settings.aboutHistory || '');
      setSettingsMcmvLogoUrl(settings.mcmvLogoUrl || '');
      setSettingsCadastroHeading(settings.cadastroHeading || '');
      setSettingsCadastroSubtitle(settings.cadastroSubtitle || '');
      setSettingsCadastroContent(settings.cadastroContent || '');
    }
  }, [settings]);

  // Listen for redirect login result on mount
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          const allowedAdmins = ['comercial.vivasc@gmail.com', 'meuprimeiroimovel.adm@gmail.com'];
          if (result.user.email && allowedAdmins.includes(result.user.email)) {
            setIsAuthenticated(true);
            setAuthError('');
          } else {
            setAuthError(`Usuário logado (${result.user.email}) não possui as permissões de um administrador oficial.`);
            fbSignOut(auth);
          }
        }
      })
      .catch((error: any) => {
        const errStr = String(error?.code || error?.message || error || '');
        if (errStr.includes('unauthorized-domain') || error?.code === 'auth/unauthorized-domain') {
          setAuthError('auth/unauthorized-domain');
          console.warn("Domínio atual não está autorizado na autenticação do Firebase. Isso é normal no ambiente de desenvolvimento/preview.");
        } else if (
          errStr.includes('cancelled-popup-request') || 
          errStr.includes('popup-closed-by-user') || 
          error?.code === 'auth/cancelled-popup-request' || 
          error?.code === 'auth/popup-closed-by-user'
        ) {
          console.log("Fluxo de login de redirecionamento cancelado ou interrompido pelo usuário/navegador.");
        } else {
          console.error("Erro no retorno de redirecionamento do Google:", error);
          setAuthError(`Erro no redirecionamento do Google: ${error.message || error}`);
        }
      });
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        const allowedAdmins = ['comercial.vivasc@gmail.com', 'meuprimeiroimovel.adm@gmail.com'];
        if (user.email && allowedAdmins.includes(user.email)) {
          setIsAuthenticated(true);
          setUserRole('admin');
          setLoggedBroker(null);
          setAuthError('');
        } else {
          // Check if it's an active Broker!
          const activeBrokerObj = brokers?.find(b => b.email.toLowerCase() === user.email?.toLowerCase() && b.status === 'Ativo');
          if (activeBrokerObj) {
            setIsAuthenticated(true);
            setUserRole('broker');
            setLoggedBroker(activeBrokerObj);
            setAuthError('');
            setActiveTab('chat-panel');
          } else {
            setIsAuthenticated(false);
            setUserRole(null);
            setLoggedBroker(null);
            setAuthError(`Usuário logado (${user.email}) não possui as permissões de um administrador ou corretor credenciado ativo.`);
            fbSignOut(auth);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [brokers]);

  // Local session loader for brokers (for email/password logic fallback)
  useEffect(() => {
    const storedBrokerId = localStorage.getItem('vivas_broker_session');
    if (storedBrokerId && brokers.length > 0 && !isAuthenticated) {
      const found = brokers.find(b => b.id === storedBrokerId && b.status === 'Ativo');
      if (found) {
        setLoggedBroker(found);
        setUserRole('broker');
        setIsAuthenticated(true);
        setActiveTab('chat-panel');
      }
    }
  }, [brokers, isAuthenticated]);

  // Sonar tone sound notifier when any new chat message arrives
  const lastMessagesLengthRef = React.useRef(messages.length);
  useEffect(() => {
    if (messages.length > lastMessagesLengthRef.current && (isAuthenticated || loggedBroker)) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc1.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1174.66, audioCtx.currentTime); // D6
        osc2.frequency.setValueAtTime(1760, audioCtx.currentTime + 0.12); // A6

        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.5);
        osc2.stop(audioCtx.currentTime + 0.5);
      } catch (err) {
        console.warn("Could not play audio due to user interaction browser restrictions", err);
      }
    }
    lastMessagesLengthRef.current = messages.length;
  }, [messages, isAuthenticated, loggedBroker]);

  const handleGoogleLogin = async () => {
    try {
      setAuthError('');
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;
      const allowedAdmins = ['comercial.vivasc@gmail.com', 'meuprimeiroimovel.adm@gmail.com'];
      if (email && allowedAdmins.includes(email)) {
        setIsAuthenticated(true);
        setUserRole('admin');
        setLoggedBroker(null);
        setAuthError('');
      } else {
        const activeBrokerObj = brokers?.find(b => b.email.toLowerCase() === email?.toLowerCase() && b.status === 'Ativo');
        if (activeBrokerObj) {
          setIsAuthenticated(true);
          setUserRole('broker');
          setLoggedBroker(activeBrokerObj);
          setAuthError('');
          setActiveTab('chat-panel');
        } else {
          setAuthError(`O e-mail (${email}) não é o de um administrador ou corretor credenciado ativo.`);
          await fbSignOut(auth);
        }
      }
    } catch (e: any) {
      const errStr = String(e?.code || e?.message || e || '');
      if (errStr.includes('unauthorized-domain') || e?.code === 'auth/unauthorized-domain') {
        setAuthError('auth/unauthorized-domain');
        console.warn("Domínio atual não está autorizado na autenticação do Firebase. Isso é normal no ambiente de desenvolvimento/preview.");
      } else if (
        errStr.includes('cancelled-popup-request') || 
        errStr.includes('popup-closed-by-user') || 
        e?.code === 'auth/cancelled-popup-request' || 
        e?.code === 'auth/popup-closed-by-user'
      ) {
        console.log("Fluxo de login de pop-up cancelado ou interrompido.");
      } else {
        console.error("Erro ao autenticar com o Google:", e);
        setAuthError(`Erro ao autenticar com o Google: ${e.message || e}`);
      }
    }
  };

  const handleGoogleRedirect = async () => {
    try {
      setAuthError('');
      await signInWithRedirect(auth, googleProvider);
    } catch (e: any) {
      const errStr = String(e?.code || e?.message || e || '');
      if (errStr.includes('unauthorized-domain') || e?.code === 'auth/unauthorized-domain') {
        setAuthError('auth/unauthorized-domain');
        console.warn("Domínio atual não está autorizado na autenticação do Firebase. Isso é normal no ambiente de desenvolvimento/preview.");
      } else if (
        errStr.includes('cancelled-popup-request') || 
        errStr.includes('popup-closed-by-user') || 
        e?.code === 'auth/cancelled-popup-request' || 
        e?.code === 'auth/popup-closed-by-user'
      ) {
        console.log("Fluxo de login por redirecionamento cancelado ou interrompido.");
      } else {
        console.error("Erro ao redirecionar para o Google:", e);
        setAuthError(`Erro ao redirecionar para o Google: ${e.message || e}`);
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setAuthError('Por favor, digite seu e-mail e senha.');
      return;
    }
    setAuthError('');
    setIsEmailLoggingIn(true);
    try {
      const email = loginEmail.toLowerCase().trim();
      const allowedAdmins = ['comercial.vivasc@gmail.com', 'meuprimeiroimovel.adm@gmail.com'];
      
      let userCredential = null;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, loginPassword);
        console.log("[Firebase Auth] Login bem-sucedido com Firebase Auth:", userCredential.user.email);
      } catch (authErr: any) {
        console.warn("[Firebase Auth] Autenticação direta falhou. Verificando se é elegível para registro automático...", authErr);
        
        // Check local eligibility for dynamic signup to guarantee a real Firebase Auth session
        const matchedLocalBroker = brokers?.find(
          b => b.email.toLowerCase() === email && 
               b.password === loginPassword && 
               b.status === 'Ativo'
        );

        if ((allowedAdmins.includes(email) && loginPassword === 'admin2026') || matchedLocalBroker) {
          try {
            console.log(`[Firebase Auth] Registrando e autenticando dinamicamente usuário ${email} no Firebase...`);
            userCredential = await createUserWithEmailAndPassword(auth, email, loginPassword);
            console.log(`[Firebase Auth] Registro dinâmico concluído com sucesso para ${email}!`);
          } catch (createErr: any) {
            console.error("[Firebase Auth] Falha ao criar usuário dinamicamente:", createErr);
            // If they already exist but threw another error, we'll output it later, or log and proceed to fallback
          }
        }
      }

      if (userCredential && userCredential.user?.email && allowedAdmins.includes(userCredential.user.email)) {
        setIsAuthenticated(true);
        setUserRole('admin');
        setLoggedBroker(null);
        setAuthError('');
        console.log("[Firebase Auth] Sessão iniciada como Administrador:", userCredential.user.email);
      } else if (userCredential && userCredential.user?.email) {
        const activeBrokerObj = brokers?.find(b => b.email.toLowerCase() === userCredential.user.email?.toLowerCase() && b.status === 'Ativo');
        if (activeBrokerObj) {
          setIsAuthenticated(true);
          setUserRole('broker');
          setLoggedBroker(activeBrokerObj);
          setAuthError('');
          setActiveTab('chat-panel');
          console.log("[Firebase Auth] Sessão iniciada como Corretor credenciado:", userCredential.user.email);
        } else {
          setAuthError(`Usuário (${userCredential.user.email}) não está ativo na lista de corretores ou não é administrador.`);
          await fbSignOut(auth);
        }
      } else {
        // Ultimate Fallback option (if Firebase Auth is offline or blockages persist): allow master code / passcode login
        if (allowedAdmins.includes(email) && loginPassword === 'admin2026') {
          setIsAuthenticated(true);
          setUserRole('admin');
          setLoggedBroker(null);
          setAuthError('');
          console.warn("[Firebase Auth Fallback] Entrando em modo local offline ADMIN (sem auth.currentUser). Operações banco podem sofrer restrições.");
        } else {
          // Fallback option: local query matchmaking inside the brokers/corretores collection!
          const matchedLocalBroker = brokers?.find(
            b => b.email.toLowerCase() === email && 
                 b.password === loginPassword && 
                 b.status === 'Ativo'
          );
          if (matchedLocalBroker) {
            setIsAuthenticated(true);
            setUserRole('broker');
            setLoggedBroker(matchedLocalBroker);
            localStorage.setItem('vivas_broker_session', matchedLocalBroker.id);
            setAuthError('');
            setActiveTab('chat-panel');
            console.warn(`[Firebase Auth Fallback] Entrando em modo local offline corretor ${email}.`);
          } else {
            setAuthError('Credenciais incorretas (E-mail ou senha inválidos) ou corretor inativo. Se for o primeiro login, use a senha correspondente para que sua conta de segurança possa ser criada.');
          }
        }
      }
    } catch (error: any) {
      console.error("Erro no login por e-mail:", error);
      setAuthError(`Erro de login por e-mail: ${error.message || error}`);
    } finally {
      setIsEmailLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fbSignOut(auth);
      setIsAuthenticated(false);
      setUserRole(null);
      setLoggedBroker(null);
      setPasscode('');
      localStorage.removeItem('vivas_broker_session');
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const res = await seedInitialDatabase();
      setSeedResult(`Sucesso! Banco sincronizado: ${res.propertiesSeeded} imóveis e ${res.bannersSeeded} banners populados.`);
    } catch (e: any) {
      console.error(e);
      setSeedResult(`Erro ao sincronizar banco: ${e.message || e}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // Tab State
  const [activeTab, setActiveTab] = useState<'properties' | 'banners' | 'settings' | 'seo' | 'dashboard' | 'brokers' | 'clients' | 'leads' | 'visits' | 'messages' | 'chat-panel' | 'broker-profile'>('dashboard');

  // NEW CRM FRONTEND FORMS STATE
  const [isBrokerFormOpen, setIsBrokerFormOpen] = useState(false);
  const [editingBrokerId, setEditingBrokerId] = useState<string | null>(null);
  const [brokerName, setBrokerName] = useState('');
  const [brokerEmail, setBrokerEmail] = useState('');
  const [brokerPhone, setBrokerPhone] = useState('');
  const [brokerRegion, setBrokerRegion] = useState('');
  const [brokerStatus, setBrokerStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [brokerChatName, setBrokerChatName] = useState('');
  const [brokerChatPhotoUrl, setBrokerChatPhotoUrl] = useState('');
  const [brokerPassword, setBrokerPassword] = useState('');
  const [brokerReceiveChat, setBrokerReceiveChat] = useState(true);

  // Broker Chat Panel interactive states
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [chatFilter, setChatFilter] = useState<'all' | 'new' | 'my'>('all');

  // Synchronize inputs with currently logged broker profile fields
  useEffect(() => {
    if (loggedBroker) {
      setBrokerChatName(loggedBroker.chatName || loggedBroker.name || '');
      setBrokerChatPhotoUrl(loggedBroker.chatPhotoUrl || '');
      setBrokerPassword(loggedBroker.password || '123456');
    }
  }, [loggedBroker, activeTab]);

  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientFormName, setClientFormName] = useState('');
  const [clientFormEmail, setClientFormEmail] = useState('');
  const [clientFormPhone, setClientFormPhone] = useState('');
  const [clientFormNotes, setClientFormNotes] = useState('');

  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [visitPropId, setVisitPropId] = useState('');
  const [visitBrokerId, setVisitBrokerId] = useState('');
  const [visitClientContact, setVisitClientContact] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitStatus, setVisitStatus] = useState<Visit['status']>('Agendada');

  // Image Upload Progress State
  interface UploadState {
    isUploading: boolean;
    progress: number;
    fileName: string;
    error: string | null;
    success: boolean;
    isFallback?: boolean;
  }
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    fileName: '',
    error: null,
    success: false,
    isFallback: false
  });

  // Form Property State
  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  
  const [propName, setPropName] = useState('');
  const [propStatus, setPropStatus] = useState<Property['status']>('Lançamento');
  const [propDelivery, setPropDelivery] = useState('');
  const [propNeighborhood, setPropNeighborhood] = useState('');
  const [propRegion, setPropRegion] = useState('');
  const [propAddress, setPropAddress] = useState('');
  const [propIsMcmv, setPropIsMcmv] = useState(false);
  const [propMcmvLogoUrl, setPropMcmvLogoUrl] = useState('');
  const [propType, setPropType] = useState('Apartamento');
  const [propBedrooms, setPropBedrooms] = useState<string | number>(2);
  const [propSuites, setPropSuites] = useState<string | number>('');
  const [propArea, setPropArea] = useState<string | number>(80);
  const [propBathrooms, setPropBathrooms] = useState<string | number>('');
  const [propParking, setPropParking] = useState<string | number>(1);
  const [propPrice, setPropPrice] = useState<string | number>(600000);
  const [propDownpayment, setPropDownpayment] = useState(60000);
  const [propInstallments, setPropInstallments] = useState(2500);
  const [propImageInput, setPropImageInput] = useState('');
  const [propImagesList, setPropImagesList] = useState<string[]>([]);
  const [propPrivateNotes, setPropPrivateNotes] = useState('');
  const [propDetailedDescription, setPropDetailedDescription] = useState('');
  const [propFloorPlans, setPropFloorPlans] = useState<FloorPlan[]>([]);
  
  // Financing Percentages and Count settings
  const [propDownpaymentPct, setPropDownpaymentPct] = useState(10);
  const [propDownpaymentInstallmentsCount, setPropDownpaymentInstallmentsCount] = useState(1);
  const [propInstallmentsPct, setPropInstallmentsPct] = useState(60);
  const [propInstallmentsCount, setPropInstallmentsCount] = useState(60);
  const [propReintegrationPct, setPropReintegrationPct] = useState(20);
  const [propReintegrationCount, setPropReintegrationCount] = useState(5);
  const [propReintegrationValue, setPropReintegrationValue] = useState(24000);
  const [propKeysPct, setPropKeysPct] = useState(10);
  const [propKeysValue, setPropKeysValue] = useState(60000);
  const [propCefContractFee, setPropCefContractFee] = useState<number | undefined>(undefined);
  const [propAvailableUnits, setPropAvailableUnits] = useState<number | undefined>(undefined);
  const [propTableConditionDescription, setPropTableConditionDescription] = useState<string>('');

  // Auto-calculation of downpayment, installments, reinforcements (balloon), and keys
  useEffect(() => {
    if (typeof propPrice !== 'number') return;
    const price = propPrice;
    
    // Entrada
    const downpaymentVal = Math.round(price * (Number(propDownpaymentPct) / 100));
    setPropDownpayment(downpaymentVal);
    
    // Mensais
    const installmentsTotal = price * (Number(propInstallmentsPct) / 100);
    const countInst = Number(propInstallmentsCount) || 1;
    const installmentsVal = Math.round(installmentsTotal / countInst);
    setPropInstallments(installmentsVal);
    
    // Reforços (Balões)
    const reintegrationTotal = price * (Number(propReintegrationPct) / 100);
    const countReint = Number(propReintegrationCount) || 1;
    const reintegrationVal = Math.round(reintegrationTotal / countReint);
    setPropReintegrationValue(reintegrationVal);
    
    // Chaves
    const keysVal = Math.round(price * (Number(propKeysPct) / 100));
    setPropKeysValue(keysVal);
  }, [
    propPrice,
    propDownpaymentPct,
    propInstallmentsPct,
    propInstallmentsCount,
    propReintegrationPct,
    propReintegrationCount,
    propKeysPct
  ]);
  
  // Temporary states for working floor plans form inputs inside Admin property form
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanArea, setNewPlanArea] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [newPlanImageUrl, setNewPlanImageUrl] = useState('');
  const [newPlanBedrooms, setNewPlanBedrooms] = useState<string | number | undefined>(undefined);
  const [editingPlanIdx, setEditingPlanIdx] = useState<number | null>(null);
  
  // Form Banner State
  const [isBannerFormOpen, setIsBannerFormOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerActive, setBannerActive] = useState(true);
  const [bannerLink, setBannerLink] = useState('');

  // Default Passcode helper (local simulation backup)
  const MASTER_CODE = 'admin2026';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === MASTER_CODE) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Código de autorização inválido. Tente novamente.');
    }
  };

  // Image Presets for rapid demo insertions
  const IMAGE_PRESETS = [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
  ];

  // Property handlers
  const openAddProperty = () => {
    setEditingPropertyId(null);
    setPropName('');
    setPropStatus('Lançamento');
    setPropDelivery('Mar/28');
    setPropNeighborhood('');
    setPropRegion('');
    setPropAddress('');
    setPropIsMcmv(false);
    setPropMcmvLogoUrl('');
    setPropType('Apartamento');
    setPropBedrooms(2);
    setPropSuites('');
    setPropArea(85);
    setPropParking(2);
    setPropPrice(650000);
    setPropDownpayment(65000);
    setPropInstallments(2600);
    setPropDownpaymentPct(10);
    setPropDownpaymentInstallmentsCount(1);
    setPropInstallmentsPct(60);
    setPropInstallmentsCount(60);
    setPropReintegrationPct(20);
    setPropReintegrationCount(5);
    setPropReintegrationValue(26000);
    setPropKeysPct(10);
    setPropKeysValue(65000);
    setPropCefContractFee(undefined);
    setPropAvailableUnits(undefined);
    setPropTableConditionDescription('');
    setPropImageInput('');
    setPropImagesList([IMAGE_PRESETS[0]]);
    setPropPrivateNotes('');
    setPropDetailedDescription('');
    setPropFloorPlans([]);
    setIsPropertyFormOpen(true);
  };

  const openEditProperty = (p: Property) => {
    setEditingPropertyId(p.id);
    setPropName(p.name);
    setPropStatus(p.status);
    setPropDelivery(p.deliveryDate);
    setPropNeighborhood(p.neighborhood);
    setPropRegion(p.region);
    setPropAddress(p.address);
    setPropIsMcmv(p.isMcmv || false);
    setPropMcmvLogoUrl(p.mcmvLogoUrl || '');
    setPropType(p.projectType);
    setPropBedrooms(p.bedrooms);
    setPropSuites(p.suites !== undefined && p.suites !== null ? p.suites : '');
    setPropArea(p.area);
    setPropParking(p.parkingSpaces);
    setPropPrice(p.price);
    setPropDownpayment(p.downpayment);
    setPropInstallments(p.installments);
    setPropDownpaymentPct(p.downpaymentPct !== undefined ? p.downpaymentPct : 10);
    setPropDownpaymentInstallmentsCount(p.downpaymentInstallmentsCount !== undefined ? p.downpaymentInstallmentsCount : 1);
    setPropInstallmentsPct(p.installmentsPct !== undefined ? p.installmentsPct : 60);
    setPropInstallmentsCount(p.installmentsCount !== undefined ? p.installmentsCount : 60);
    setPropReintegrationPct(p.reintegrationPct !== undefined ? p.reintegrationPct : 20);
    setPropReintegrationCount(p.reintegrationCount !== undefined ? p.reintegrationCount : 5);
    setPropReintegrationValue(p.reintegrationValue !== undefined ? p.reintegrationValue : Math.round((typeof p.price === 'number' ? p.price : Number(p.price) || 0) * 0.2 / 5));
    setPropKeysPct(p.keysPct !== undefined ? p.keysPct : 10);
    setPropKeysValue(p.keysValue !== undefined ? p.keysValue : Math.round((typeof p.price === 'number' ? p.price : Number(p.price) || 0) * 0.1));
    setPropCefContractFee(p.cefContractFee !== undefined ? p.cefContractFee : undefined);
    setPropAvailableUnits(p.availableUnits !== undefined ? p.availableUnits : undefined);
    setPropTableConditionDescription(p.tableConditionDescription || '');
    setPropImageInput('');
    setPropImagesList(p.images);
    setPropPrivateNotes(p.privateNotes || '');
    setPropDetailedDescription(p.detailedDescription || '');
    setPropFloorPlans(p.floorPlans || []);
    setIsPropertyFormOpen(true);
  };

  const handleDuplicateProperty = (p: Property) => {
    setEditingPropertyId(null); // Will create a new property
    setPropName(`${p.name} (Cópia)`);
    setPropStatus(p.status);
    setPropDelivery(p.deliveryDate);
    setPropNeighborhood(p.neighborhood);
    setPropRegion(p.region);
    setPropAddress(p.address);
    setPropIsMcmv(p.isMcmv || false);
    setPropMcmvLogoUrl(p.mcmvLogoUrl || '');
    setPropType(p.projectType);
    setPropBedrooms(p.bedrooms);
    setPropSuites(p.suites !== undefined && p.suites !== null ? p.suites : '');
    setPropArea(p.area);
    setPropParking(p.parkingSpaces);
    setPropPrice(p.price);
    setPropDownpayment(p.downpayment);
    setPropInstallments(p.installments);
    setPropDownpaymentPct(p.downpaymentPct !== undefined ? p.downpaymentPct : 10);
    setPropDownpaymentInstallmentsCount(p.downpaymentInstallmentsCount !== undefined ? p.downpaymentInstallmentsCount : 1);
    setPropInstallmentsPct(p.installmentsPct !== undefined ? p.installmentsPct : 60);
    setPropInstallmentsCount(p.installmentsCount !== undefined ? p.installmentsCount : 60);
    setPropReintegrationPct(p.reintegrationPct !== undefined ? p.reintegrationPct : 20);
    setPropReintegrationCount(p.reintegrationCount !== undefined ? p.reintegrationCount : 5);
    setPropReintegrationValue(p.reintegrationValue !== undefined ? p.reintegrationValue : Math.round((typeof p.price === 'number' ? p.price : Number(p.price) || 0) * 0.2 / 5));
    setPropKeysPct(p.keysPct !== undefined ? p.keysPct : 10);
    setPropKeysValue(p.keysValue !== undefined ? p.keysValue : Math.round((typeof p.price === 'number' ? p.price : Number(p.price) || 0) * 0.1));
    setPropCefContractFee(p.cefContractFee !== undefined ? p.cefContractFee : undefined);
    setPropAvailableUnits(p.availableUnits !== undefined ? p.availableUnits : undefined);
    setPropTableConditionDescription(p.tableConditionDescription || '');
    setPropImageInput('');
    setPropImagesList(p.images);
    setPropPrivateNotes(p.privateNotes || '');
    setPropDetailedDescription(p.detailedDescription || '');
    setPropFloorPlans(p.floorPlans || []);
    setIsPropertyFormOpen(true);
  };

  const handleAddImageUrl = () => {
    if (propImageInput.trim() && !propImagesList.includes(propImageInput)) {
      setPropImagesList([...propImagesList, propImageInput.trim()]);
      setPropImageInput('');
    }
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/webp';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const processAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log(`[Image Process] Iniciando processamento para ${file.name}. Formato original: ${file.type}, Tamanho original: ${(file.size / 1024).toFixed(1)} KB`);
      
      if (!file.type.startsWith('image/')) {
        reject(new Error("Formato de arquivo inválido. Apenas imagens são permitidas."));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Redimensionar para largura máxima de 1920px mantendo proporção
            const MAX_WIDTH = 1920;
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error("Não foi possível obter o contexto 2D do canvas"));
              return;
            }

            // Desenhar imagem no canvas (remove metadados EXIF e mantém perfil sRGB padrão do canvas)
            ctx.drawImage(img, 0, 0, width, height);

            // Aplicar leve nitidez
            try {
              const imageData = ctx.getImageData(0, 0, width, height);
              const data = imageData.data;
              const output = ctx.createImageData(width, height);
              const outData = output.data;
              
              // Kernel de nitidez leve
              const amount = 0.1; // nitidez leve
              const centerWeight = 1 + 4 * amount;
              
              for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                  const idx = (y * width + x) * 4;
                  
                  for (let c = 0; c < 3; c++) { // R, G, B
                    const i = idx + c;
                    const up = ((y - 1) * width + x) * 4 + c;
                    const down = ((y + 1) * width + x) * 4 + c;
                    const left = (y * width + x - 1) * 4 + c;
                    const right = (y * width + x + 1) * 4 + c;

                    const val = data[i] * centerWeight - (data[up] + data[down] + data[left] + data[right]) * amount;
                    outData[i] = Math.min(255, Math.max(0, val));
                  }
                  outData[idx + 3] = data[idx + 3]; // Alpha
                }
              }
              
              // Tratar as bordas (apenas copiar)
              for (let x = 0; x < width; x++) {
                // Top border
                const topIdx = x * 4;
                for (let c = 0; c < 4; c++) outData[topIdx + c] = data[topIdx + c];
                // Bottom border
                const botIdx = ((height - 1) * width + x) * 4;
                for (let c = 0; c < 4; c++) outData[botIdx + c] = data[botIdx + c];
              }
              for (let y = 0; y < height; y++) {
                // Left border
                const leftIdx = y * width * 4;
                for (let c = 0; c < 4; c++) outData[leftIdx + c] = data[leftIdx + c];
                // Right border
                const rightIdx = (y * width + width - 1) * 4;
                for (let c = 0; c < 4; c++) outData[rightIdx + c] = data[rightIdx + c];
              }

              ctx.putImageData(output, 0, 0);
              console.log("[Image Process] Filtro de nitidez leve aplicado com sucesso.");
            } catch (sharpError) {
              console.warn("[Image Process] Falha ao aplicar filtro de nitidez, prosseguindo com imagem original:", sharpError);
              ctx.drawImage(img, 0, 0, width, height);
            }

            // Converter para WebP com compressão gradual se ultrapassar 1MB
            let quality = 0.82;
            let resultBase64 = '';
            let sizeInBytes = 0;
            let attempts = 0;
            const MAX_ATTEMPTS = 5;

            do {
              resultBase64 = canvas.toDataURL('image/webp', quality);
              sizeInBytes = Math.ceil((resultBase64.length - 'data:image/webp;base64,'.length) * 3 / 4);
              console.log(`[Image Process] Conversão WebP - Tentativa ${attempts + 1}: Qualidade ${quality.toFixed(2)}, Tamanho gerado: ${(sizeInBytes / 1024).toFixed(1)} KB`);
              
              if (sizeInBytes <= 1048576) {
                break;
              }
              quality -= 0.12; // Reduz a qualidade gradualmente
              attempts++;
            } while (quality > 0.1 && attempts < MAX_ATTEMPTS);

            console.log(`[Image Process] Conversão concluída para ${file.name}. Tamanho final: ${(sizeInBytes / 1024).toFixed(1)} KB. Qualidade final: ${quality.toFixed(2)}`);
            resolve(resultBase64);
          } catch (err) {
            console.error("[Image Process] Erro interno durante o canvas/processamento:", err);
            reject(err);
          }
        };
        img.onerror = (err) => {
          console.error("[Image Process] Erro ao carregar imagem no objeto Image:", err);
          reject(err);
        };
      };
      reader.onerror = (err) => {
        console.error("[Image Process] Erro na leitura do FileReader:", err);
        reject(err);
      };
    });
  };

  const uploadToStorageWithProgress = (base64Image: string, path: string, fileName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[Upload Storage] Preparando upload para o caminho: ${path}`);
        const blob = dataURLtoBlob(base64Image);
        const storageRef = ref(storage, path);
        
        setUploadState({
          isUploading: true,
          progress: 0,
          fileName: fileName,
          error: null,
          success: false
        });

        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on('state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            console.log(`[Upload Storage] Progresso: ${pct}% concluído para ${fileName}`);
            setUploadState(prev => ({
              ...prev,
              progress: pct
            }));
          },
          (error) => {
            console.error(`[Upload Storage] Erro durante o upload de ${fileName}:`, error);
            setUploadState(prev => ({
              ...prev,
              isUploading: false,
              error: error.message || 'Erro desconhecido no Firebase Storage'
            }));
            reject(error);
          },
          async () => {
            try {
              console.log(`[Upload Storage] Upload concluído com sucesso para ${fileName}. Obtendo URL pública...`);
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              console.log(`[Upload Storage] URL gerada: ${url}`);
              
              setUploadState({
                isUploading: false,
                progress: 100,
                fileName: fileName,
                error: null,
                success: true
              });

              setTimeout(() => {
                setUploadState(prev => {
                  if (prev.success) {
                    return { ...prev, success: false, progress: 0 };
                  }
                  return prev;
                });
              }, 3000);

              resolve(url);
            } catch (urlError) {
              console.error(`[Upload Storage] Erro ao obter download URL para ${fileName}:`, urlError);
              setUploadState(prev => ({
                ...prev,
                isUploading: false,
                error: urlError instanceof Error ? urlError.message : 'Erro ao recuperar URL pública'
              }));
              reject(urlError);
            }
          }
        );
      } catch (err: any) {
        console.error(`[Upload Storage] Erro na inicialização do upload para ${fileName}:`, err);
        setUploadState({
          isUploading: false,
          progress: 0,
          fileName: fileName,
          error: err.message || 'Erro na preparação do arquivo',
          success: false
        });
        reject(err);
      }
    });
  };

  const handleSingleImageUpload = async (file: File, folder: string, setUrl: (url: string) => void) => {
    let resultBase64 = '';
    console.log(`[Upload Debug] Iniciando handleSingleImageUpload para arquivo: ${file.name}, pasta: ${folder}`);
    try {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, envie apenas arquivos de imagem válida!');
        return;
      }
      resultBase64 = await processAndCompressImage(file);
      const storagePath = `${folder}/${Date.now()}_${generateUUID()}.webp`;
      console.log(`[Upload Debug] Uploading to: ${storagePath}`);
      const url = await uploadToStorageWithProgress(resultBase64, storagePath, file.name);
      console.log(`[Upload Debug] Upload bem-sucedido, URL: ${url}`);
      setUrl(url);
    } catch (err: any) {
      console.warn(`[Firebase Storage Fallback] Erro ao enviar para o Storage:`, err);
      if (resultBase64) {
        console.log(`[Upload Debug] Usando fallback para Base64`);
        setUrl(resultBase64);
        
        // Configura o estado de upload para sucesso com aviso de Fallback
        setUploadState({
          isUploading: false,
          progress: 100,
          fileName: `${file.name}`,
          error: null,
          success: true,
          isFallback: true
        });
        
        setTimeout(() => {
          setUploadState(prev => {
            if (prev.success) {
              return { ...prev, success: false, isFallback: false, progress: 0 };
            }
            return prev;
          });
        }, 5000);
      } else {
        console.error(`Erro no processamento da imagem para ${folder}:`, err);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      for (const file of Array.from(files) as File[]) {
        if (!file.type.startsWith('image/')) {
          alert('Por favor, envie apenas arquivos de imagem válida!');
          continue;
        }
        
        let resultBase64 = '';
        try {
          resultBase64 = await processAndCompressImage(file);
          const storagePath = `empreendimentos/${Date.now()}_${generateUUID()}.webp`;
          const url = await uploadToStorageWithProgress(resultBase64, storagePath, file.name);
          setPropImagesList((prev) => {
            if (prev.includes(url)) return prev;
            return [...prev, url];
          });
        } catch (err) {
          console.warn(`[Firebase Storage Fallback] Erro ao enviar para o Storage, usando fallback para Base64 local compactado:`, err);
          if (resultBase64) {
            setPropImagesList((prev) => {
              if (prev.includes(resultBase64)) return prev;
              return [...prev, resultBase64];
            });
            
            // Configura o estado de upload para sucesso com aviso de Fallback
            setUploadState({
              isUploading: false,
              progress: 100,
              fileName: `${file.name}`,
              error: null,
              success: true,
              isFallback: true
            });
            
            setTimeout(() => {
              setUploadState(prev => {
                if (prev.success) {
                  return { ...prev, success: false, isFallback: false, progress: 0 };
                }
                return prev;
              });
            }, 5000);
          } else {
            console.error("Erro na compressão de imagem:", err);
          }
        }
      }
    } catch (err) {
      console.error("Erro no handleImageUpload:", err);
    }
  };

  const handleRemoveImageUrl = (idx: number) => {
    setPropImagesList(propImagesList.filter((_, i) => i !== idx));
  };

  const handleMoveImageLeft = (idx: number) => {
    if (idx === 0) return;
    const newList = [...propImagesList];
    const temp = newList[idx];
    newList[idx] = newList[idx - 1];
    newList[idx - 1] = temp;
    setPropImagesList(newList);
  };

  const handleMoveImageRight = (idx: number) => {
    if (idx === propImagesList.length - 1) return;
    const newList = [...propImagesList];
    const temp = newList[idx];
    newList[idx] = newList[idx + 1];
    newList[idx + 1] = temp;
    setPropImagesList(newList);
  };

  const selectPresetImage = (url: string) => {
    if (!propImagesList.includes(url)) {
      setPropImagesList([...propImagesList, url]);
    } else {
      setPropImagesList(propImagesList.filter((u) => u !== url));
    }
  };

  const handleAddNewPlan = () => {
    if (!newPlanName.trim()) {
      alert('Por favor, informe pelo menos o nome da planta!');
      return;
    }
    const planData: FloorPlan = {
      id: editingPlanIdx !== null ? propFloorPlans[editingPlanIdx].id : `fp-${Date.now()}`,
      name: newPlanName.trim(),
      image: newPlanImageUrl.trim() || 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
      description: newPlanDescription.trim() || 'Planta humanizada com distribuição inteligente e acabamento fino.',
      area: newPlanArea ? Number(newPlanArea) : undefined,
      bedrooms: newPlanBedrooms
    };
    
    if (editingPlanIdx !== null) {
      const updatedPlans = [...propFloorPlans];
      updatedPlans[editingPlanIdx] = planData;
      setPropFloorPlans(updatedPlans);
      setEditingPlanIdx(null);
    } else {
      setPropFloorPlans([...propFloorPlans, planData]);
    }

    // Reset inputs
    setNewPlanName('');
    setNewPlanArea('');
    setNewPlanDescription('');
    setNewPlanImageUrl('');
    setNewPlanBedrooms(undefined);
  };

  const handleRemovePlan = (idx: number) => {
    setPropFloorPlans(propFloorPlans.filter((_, i) => i !== idx));
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleSingleImageUpload(file, 'banners', setBannerImageUrl);
    }
  };

  const handlePlanImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleSingleImageUpload(file, 'empreendimentos/plantas', setNewPlanImageUrl);
    }
  };

  const onSubmitProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName || !propNeighborhood || !propRegion || !propAddress) {
      alert('Favor preencher os campos estruturais obrigatórios!');
      return;
    }

    if (propImagesList.length === 0) {
      alert('Selecione ou insira pelo menos uma imagem para o empreendimento.');
      return;
    }

    const baseSlug = `${propName}-${propNeighborhood}-${propRegion}`
      .toLowerCase()
      .normalize('NFD') // strip Portuguese accents and diacritics
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const propId = editingPropertyId || `prop-${Date.now()}`;
    
    // Check for collision
    let finalSlug = baseSlug;
    const collision = properties.find(p => p.slug === finalSlug && p.id !== propId);
    if (collision) {
      finalSlug = `${baseSlug}-${propId.split('-').pop()}`;
    }

    const calculatedSlug = finalSlug;
    const calculatedSeoTitle = `${propName} | Lançamento ${propStatus} no ${propNeighborhood}`;
    const calculatedSeoDesc = `Conheça ${propName} em ${propNeighborhood}, ${propRegion}. Lançamento residencial luxuoso com ${propBedrooms} dormitórios, ${propArea}m² privativos e parcelas iniciais de R$ ${propInstallments.toLocaleString('pt-BR')}. Agende já!`;
    const calculatedKeywords = `${propName.toLowerCase()}, lançamento ${propNeighborhood.toLowerCase()}, comprar apartamento ${propRegion.toLowerCase()}, vivasc imovel`;
    const calculatedSchema = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": propName,
      "description": calculatedSeoDesc,
      "url": `https://www.meuprimeiroimovelsc.com.br/imovel/${calculatedSlug}`,
      "itemOffered": {
        "@type": "Apartment",
        "name": propName,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": propAddress,
          "addressLocality": propNeighborhood,
          "addressRegion": propRegion,
          "addressCountry": "BR"
        },
        "numberOfRooms": propBedrooms,
        "floorSize": {
          "@type": "QuantitativeValue",
          "value": propArea,
          "unitCode": "MTK"
        }
      }
    }, null, 2);

    const parseFlexField = (val: any) => {
      if (val === undefined || val === null || val === '') return '';
      if (typeof val === 'number') return val;
      const trimmed = String(val).trim();
      const num = Number(trimmed);
      if (!isNaN(num) && trimmed !== '') {
        return num;
      }
      return trimmed;
    };

    const payload: Property = {
      id: editingPropertyId || `prop-${Date.now()}`,
      name: propName,
      status: propStatus,
      deliveryDate: propDelivery,
      neighborhood: propNeighborhood,
      region: propRegion,
      address: propAddress,
      projectType: propType,
      bedrooms: parseFlexField(propBedrooms),
      suites: parseFlexField(propSuites),
      bathrooms: parseFlexField(propBathrooms),
      area: parseFlexField(propArea),
      parkingSpaces: parseFlexField(propParking),
      price: typeof propPrice === 'number' ? propPrice : propPrice.toString(),
      downpayment: Number(propDownpayment),
      installments: Number(propInstallments),
      downpaymentPct: Number(propDownpaymentPct),
      downpaymentInstallmentsCount: Number(propDownpaymentInstallmentsCount),
      installmentsPct: Number(propInstallmentsPct),
      installmentsCount: Number(propInstallmentsCount),
      reintegrationPct: Number(propReintegrationPct),
      reintegrationCount: Number(propReintegrationCount),
      reintegrationValue: Number(propReintegrationValue),
      keysPct: Number(propKeysPct),
      keysValue: Number(propKeysValue),
      images: propImagesList,
      slug: calculatedSlug,
      seoTitle: calculatedSeoTitle,
      seoDescription: calculatedSeoDesc,
      seoKeywords: calculatedKeywords,
      schemaMarkup: calculatedSchema,
      privateNotes: propPrivateNotes,
      detailedDescription: propDetailedDescription,
      floorPlans: propFloorPlans,
      isMcmv: propIsMcmv,
      mcmvLogoUrl: propMcmvLogoUrl,
      cefContractFee: propCefContractFee !== undefined && propCefContractFee > 0 ? Number(propCefContractFee) : undefined,
      availableUnits: propAvailableUnits !== undefined ? Number(propAvailableUnits) : undefined,
      tableConditionDescription: propTableConditionDescription ? propTableConditionDescription.trim() : undefined
    };

    if (editingPropertyId) {
      onEditProperty(payload);
    } else {
      onAddProperty(payload);
    }
    setIsPropertyFormOpen(false);
  };

  // Banner handlers
  const openAddBanner = () => {
    setEditingBannerId(null);
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerImageUrl(IMAGE_PRESETS[3]);
    setBannerActive(true);
    setBannerLink('');
    setIsBannerFormOpen(true);
  };

  const openEditBanner = (b: BannerAd) => {
    setEditingBannerId(b.id);
    setBannerTitle(b.title);
    setBannerSubtitle(b.subtitle || '');
    setBannerImageUrl(b.imageUrl);
    setBannerActive(b.active);
    setBannerLink(b.link || '');
    setIsBannerFormOpen(true);
  };

  const onSubmitBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle || !bannerImageUrl) {
      alert('O título do anúncio e a imagem de fundo são obrigatórios!');
      return;
    }

    const payload: BannerAd = {
      id: editingBannerId || `banner-${Date.now()}`,
      title: bannerTitle,
      subtitle: bannerSubtitle,
      imageUrl: bannerImageUrl,
      active: bannerActive,
      link: bannerLink
    };

    if (editingBannerId) {
      onEditBanner(payload);
    } else {
      onAddBanner(payload);
    }
    setIsBannerFormOpen(false);
  };

  const formatBRL = (val: string | number) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(val);
    }
    
    // Check if the string is actually a number
    const num = Number(val);
    if (!isNaN(num) && val.trim() !== '') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(num);
    }
    
    // If it's a string that's not a number, just return the string
    return val;
  };


  // GATE SCREEN (IF NOT AUTHENTICATED)
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 relative">
        <div className="absolute inset-0 bg-radial-at-c from-orange-950/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          <div className="absolute -top-1 px-4 py-1 left-1/2 -translate-x-1/2 rounded-full border border-orange-500/30 bg-black text-[9px] text-orange-400 font-mono tracking-[0.2em] uppercase">
            Acesso Restrito
          </div>
          
          <div className="text-center mb-6 mt-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-4 animate-pulse">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              Área do Administrador
            </h2>
            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              Gerencie lançamentos imobiliários e banners com segurança. Escolha um método de autenticação abaixo.
            </p>
          </div>

          {/* Login Tabs Selector */}
          <div className="flex border-b border-zinc-800 mb-6 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider">
            <button
              type="button"
              onClick={() => { setLoginTab('google'); setAuthError(''); }}
              className={`flex-1 py-2.5 text-center transition-all border-b-2 ${loginTab === 'google' ? 'text-orange-500 border-orange-500 font-bold' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
            >
              Google Auth
            </button>
            <button
              type="button"
              onClick={() => { setLoginTab('email'); setAuthError(''); }}
              className={`flex-1 py-2.5 text-center transition-all border-b-2 ${loginTab === 'email' ? 'text-orange-500 border-orange-500 font-bold' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
            >
              E-mail e Senha
            </button>
          </div>

          <div className="space-y-5 flex-1">
            {/* TAB 1: GOOGLE AUTH */}
            {loginTab === 'google' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3.5 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 shadow-lg shadow-white/5 active:scale-98"
                >
                  <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Login com Google (Pop-up)
                </button>

                <button
                  type="button"
                  onClick={handleGoogleRedirect}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold tracking-wider uppercase transition-all duration-300 border border-zinc-800 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <Globe className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                  Entrar via Redirecionamento (Alt)
                </button>
              </div>
            )}

            {/* TAB 2: EMAIL AND PASSWORD AUTH */}
            {loginTab === 'email' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">
                    E-mail do Administrador
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-xl bg-black px-4 py-3 text-sm text-white placeholder-zinc-700 border border-zinc-800 focus:border-orange-500/60 outline-none"
                    placeholder="ex: comercial.vivasc@gmail.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">
                    Senha Secreta
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full rounded-xl bg-black px-4 py-3 text-sm text-white placeholder-zinc-700 border border-zinc-800 focus:border-orange-500/60 outline-none font-mono"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isEmailLoggingIn}
                  className="w-full py-3 px-4 rounded-xl bg-orange-500 text-black hover:bg-orange-600 disabled:opacity-55 text-xs font-black tracking-widest uppercase transition-all duration-300 cursor-pointer shadow-lg shadow-orange-500/10 animate-transition"
                >
                  {isEmailLoggingIn ? 'Autenticando...' : 'Entrar com E-mail'}
                </button>
              </form>
            )}

            {authError && (
              authError === 'auth/unauthorized-domain' ? (
                <div className="rounded-xl bg-red-950/20 border border-red-900/40 p-4 text-xs text-red-200 mt-2 space-y-3 font-sans">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-400 text-sm mb-1 uppercase font-mono tracking-wider">
                        Domínio não Autorizado!
                      </h4>
                      <p className="text-zinc-300 leading-relaxed">
                        O Firebase bloqueou este login com Google porque o domínio desta página não está registrado na lista de segurança do seu projeto.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-black/40 border border-zinc-800 rounded-lg p-3 space-y-2 mt-2 font-mono text-[11px] leading-relaxed">
                    <p className="text-zinc-400">Copie este domínio de desenvolvimento:</p>
                    <div className="flex items-center gap-2 bg-zinc-950 px-2 py-1.5 rounded border border-zinc-900 group">
                      <span className="text-orange-400 flex-1 break-all select-all font-semibold font-mono">
                        {window.location.hostname}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.hostname);
                          alert('Domínio copiado para a área de transferência!');
                        }}
                        className="text-zinc-500 hover:text-white transition-colors"
                        title="Copiar link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>

                    {window.location.hostname !== "ais-pre-wiffv4jkprcwv6spmkf2oj-178679523613.us-east1.run.app" && (
                      <>
                        <p className="text-zinc-400 pt-1">Copie o domínio de compartilhamento:</p>
                        <div className="flex items-center gap-2 bg-zinc-950 px-2 py-1.5 rounded border border-zinc-900 group">
                          <span className="text-orange-400 flex-1 break-all select-all font-semibold font-mono">
                            ais-pre-wiffv4jkprcwv6spmkf2oj-178679523613.us-east1.run.app
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("ais-pre-wiffv4jkprcwv6spmkf2oj-178679523613.us-east1.run.app");
                              alert('Domínio de compartilhamento copiado!');
                            }}
                            className="text-zinc-500 hover:text-white transition-colors"
                            title="Copiar link"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-1.5">
                    <a
                      href="https://console.firebase.google.com/project/meuprimeiroimovel/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 w-full justify-center bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all font-mono shadow-md"
                    >
                      <Globe className="h-4 w-4 shrink-0" />
                      Abrir Console do Firebase
                    </a>
                  </div>

                  <div className="text-[10px] text-zinc-400 leading-relaxed bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800">
                    <span className="font-bold text-zinc-300 block mb-0.5">Como autorizar:</span>
                    1. No Console Firebase, clique na aba <strong className="text-orange-400">Settings</strong> (Configurações).<br />
                    2. Selecione <strong className="text-orange-400">Authorized domains</strong> (Domínios autorizados).<br />
                    3. Clique em <strong className="text-white">Add domain</strong> (Adicionar domínio) e cole o domínio copiado acima.
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-red-950/20 border border-red-900/40 p-3.5 text-xs text-red-400 flex items-start gap-2.5 font-mono">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-normal whitespace-pre-line">{authError}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE MAIN ADMIN VIEW
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 relative" style={{ backgroundColor: '#9b9b9b' }}>
      {/* Admin Status metadata and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 mb-6 border border-zinc-850 rounded-2xl bg-zinc-950 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 relative">
            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Sessão Ativa</span>
            <span className="text-xs font-bold text-white font-mono">
              {currentUser ? `Admin: ${currentUser.email}` : 'Modo Visualização Local'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {currentUser && (
            <button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="flex items-center gap-2 px-4 py-2 border border-orange-500/20 text-orange-400 bg-orange-500/5 hover:bg-orange-500 hover:text-black hover:border-orange-500 text-[10px] font-bold tracking-widest uppercase rounded-xl transition-all duration-300 disabled:opacity-45 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isSeeding ? 'Sincronizando...' : 'Sincronizar Banco de Dados'}
            </button>
          )}

          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-red-950 text-red-500 bg-red-950/10 hover:border-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold tracking-widest uppercase rounded-xl transition-all duration-300 cursor-pointer"
          >
            Sair do Console
          </button>
        </div>
      </div>

      {seedResult && (
        <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs font-mono text-orange-400 flex items-center justify-between">
          <span>✦ {seedResult}</span>
          <button onClick={() => setSeedResult(null)} className="text-orange-500 hover:text-white font-bold px-2 cursor-pointer">X</button>
        </div>
      )}

      {/* Header section with credentials and tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-900 mb-8">
        <div style={{ backgroundColor: '#191919' }}>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-mono text-orange-500 font-bold font-mono">
            <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />
            Sessão Autorizada
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight uppercase">
            Terminal de Controle VIVASC
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Cadastre novos projetos imobiliários e administre campanhas de banners promocionais.
          </p>
        </div>

        {/* Master Tab togglers */}
        <div className="flex flex-wrap border border-zinc-800 bg-zinc-950 rounded-xl p-1 gap-1 self-start sm:w-auto w-full">
          {userRole === 'broker' ? (
            <>
              <button
                onClick={() => setActiveTab('chat-panel')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'chat-panel'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Atendimento Chat
              </button>
              <button
                onClick={() => setActiveTab('broker-profile')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'broker-profile'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <User className="h-4 w-4" />
                Configurações do Chat
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('chat-panel')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'chat-panel'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Chat Geral
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'leads'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="h-4 w-4" />
                Leads ({leads.length})
              </button>
              <button
                onClick={() => setActiveTab('properties')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'properties'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Building className="h-4 w-4" />
                Imóveis ({properties.length})
              </button>
              <button
                onClick={() => setActiveTab('brokers')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'brokers'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Corretores ({brokers.length})
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'clients'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                Clientes ({clients.length})
              </button>
              <button
                onClick={() => setActiveTab('visits')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'visits'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                Visitas ({visits.length})
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'messages'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Mensagens ({messages.length})
              </button>
              <button
                onClick={() => setActiveTab('banners')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'banners'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                Banners ({banners.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Tag className="h-4 w-4" />
                Marca
              </button>
              <button
                onClick={() => setActiveTab('seo')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'seo'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Globe className="h-4 w-4" />
                SEO
              </button>
            </>
          )}
        </div>
      </div>

      {/* PROPERTIES SECTION */}
      {activeTab === 'properties' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-zinc-950 p-4 border border-zinc-900 rounded-xl">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              Mostrando {properties.length} registros cadastrados
            </span>
            <button
              onClick={openAddProperty}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 font-bold text-black border border-orange-500 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Novo Imóvel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <div 
                key={p.id}
                className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-zinc-800 transition-all p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-zinc-900 relative">
                    <img 
                      src={p.images[0]} 
                      alt="" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/20"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-orange-400">
                      {p.status} • {p.projectType}
                    </span>
                    <h3 className="text-base font-extrabold text-white tracking-tight line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-zinc-400 font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-orange-400 shrink-0" />
                      {p.neighborhood}, {p.region}
                    </p>
                    <p className="text-[11px] text-orange-500 font-mono font-extrabold mt-1">
                      {formatBRL(p.price)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 my-4 py-3 border-y border-zinc-900 text-center font-mono text-[10px] text-zinc-400 bg-black/20 rounded-lg">
                  <div>
                    <span className="block text-zinc-600 mb-0.5">Dormitórios</span>
                    <span className="font-extrabold text-white">{formatAdminBedrooms(p.bedrooms)}</span>
                  </div>
                  <div className="border-x border-zinc-900">
                    <span className="block text-zinc-600 mb-0.5">Área Útil</span>
                    <span className="font-extrabold text-white">{formatAdminArea(p.area)}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-600 mb-0.5">Vagas</span>
                    <span className="font-extrabold text-white">{formatAdminParking(p.parkingSpaces)}</span>
                  </div>
                </div>

                {/* Anotações Internas / Privadas do Proprietário */}
                <div className="mb-4 p-3 rounded-xl bg-orange-500/5 border border-zinc-850/60 text-left">
                  <span className="block font-bold text-orange-400 font-mono uppercase text-[9px] tracking-wider mb-1">
                    🔑 Anotações Privadas / Contato Proprietário:
                  </span>
                  <p className="whitespace-pre-wrap font-mono text-zinc-300 text-xs mt-1 leading-relaxed">
                    {p.privateNotes && p.privateNotes.trim() ? p.privateNotes : 'Nenhuma anotação privada inserida.'}
                  </p>
                </div>

                <div className="flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => handleDuplicateProperty(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white hover:border-orange-500/50 hover:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5 text-orange-400" />
                    Duplicar
                  </button>
                  <button
                    onClick={() => openEditProperty(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white hover:border-orange-500/50 hover:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-orange-400" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja remover o imóvel "${p.name}"?`)) {
                        onDeleteProperty(p.id);
                      }
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-900 text-zinc-500 hover:text-red-400 hover:border-red-950 hover:bg-red-950/10 transition-all cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {properties.length === 0 && (
              <div className="col-span-full py-16 text-center border border-dashed border-zinc-900 rounded-2xl">
                <AlertCircle className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm font-mono">Nenhum empreendimento registrado no banco de dados.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BANNERS ADVERTISEMENT SECTION */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-zinc-950 p-4 border border-zinc-900 rounded-xl">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              Mostrando {banners.length} banners para a página inicial
            </span>
            <button
              onClick={openAddBanner}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 font-bold text-black border border-orange-500 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Novo Banner ad
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((b) => (
              <div 
                key={b.id}
                className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden hover:border-zinc-800 transition-all flex flex-col justify-between"
              >
                <div className="h-40 bg-zinc-900 relative">
                  <img 
                    src={b.imageUrl} 
                    alt={b.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover filter brightness-[0.6] contrast-[1.05]" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
                  
                  {/* Absolute header overlay */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold font-mono uppercase border ${
                      b.active 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : 'bg-zinc-800/80 text-zinc-500 border-zinc-700/50'
                    }`}>
                      {b.active ? 'Ativo na Home' : 'Inativo / Pausado'}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-lg font-black text-white uppercase leading-none">{b.title}</h3>
                    {b.subtitle && <p className="text-xs text-zinc-300 mt-1 line-clamp-1">{b.subtitle}</p>}
                  </div>
                </div>

                <div className="p-4 flex gap-2">
                  <button
                    onClick={() => openEditBanner(b)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-850 text-zinc-300 hover:text-white hover:border-orange-500/60 hover:bg-zinc-900 transition-all text-xs font-bold cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-orange-400" />
                    Editar Campanhas
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir campanha "${b.title}"?`)) {
                        onDeleteBanner(b.id);
                      }
                    }}
                    className="w-11 h-11 flex items-center justify-center rounded-xl border border-zinc-900 text-zinc-500 hover:text-red-400 hover:border-red-950/60 hover:bg-red-950/10 transition-all cursor-pointer"
                    title="Remover Banner"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {banners.length === 0 && (
              <div className="col-span-full py-16 text-center border border-dashed border-zinc-900 rounded-2xl">
                <AlertCircle className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm font-mono animate-pulse">Não existem banners promocionais ativos.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BRAND & CONTACT SETTINGS SECTION */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-zinc-950 p-6 border border-zinc-900 rounded-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none rounded-tr-2xl"></div>
            
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#FF9D00] font-mono uppercase block mb-1">
                ✦ Customização de Identidade
              </span>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                Configurações de Marca & Contatos
              </h2>
              <p className="text-xs text-zinc-400 leading-normal mt-1">
                Atualize as informações de contato globais e a identidade visual do portal imobiliário. Mudanças são aplicadas instantaneamente em todas as páginas e links.
              </p>
            </div>

            {settingsUpdateStatus && (
              <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 p-4 text-xs text-orange-400 flex items-center justify-between font-mono">
                <span>✦ {settingsUpdateStatus}</span>
                <button onClick={() => setSettingsUpdateStatus(null)} className="text-orange-500 hover:text-white font-black cursor-pointer">X</button>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSettingsUpdating(true);
                setSettingsUpdateStatus(null);
                try {
                  await onSaveSettings({
                    id: 'brand',
                    phone: settingsPhone,
                    email: settingsEmail,
                    logoUrl: settingsLogoUrl,
                    brandName: settingsBrandName,
                    tagline: settingsTagline,
                    faviconUrl: settingsFaviconUrl,
                    shareLogoUrl: settingsShareLogoUrl,
                    companyName: settingsCompanyName,
                    creci: settingsCreci,
                    cnpj: settingsCnpj,
                    footerLogoUrl: settingsFooterLogoUrl,
                    footerLogoHeight: settingsFooterLogoHeight,
                    termsOfUse: settingsTermsOfUse,
                    privacyPolicy: settingsPrivacyPolicy,
                    cookieText: settingsCookieText,
                    enableCookieConsent: settingsEnableCookieConsent,
                    aboutHeading: settingsAboutHeading,
                    aboutSubtitle: settingsAboutSubtitle,
                    aboutHistory: settingsAboutHistory,
                    mcmvLogoUrl: settingsMcmvLogoUrl,
                    cadastroHeading: settingsCadastroHeading,
                    cadastroSubtitle: settingsCadastroSubtitle,
                    cadastroContent: settingsCadastroContent
                  });
                  setSettingsUpdateStatus('Configurações de marca e contatos salvas no Firebase Firestore com sucesso.');
                } catch (err: any) {
                  console.error(err);
                  setSettingsUpdateStatus(`Erro ao salvar configurações: ${err.message || err}`);
                } finally {
                  setIsSettingsUpdating(false);
                }
              }}
              className="space-y-5"
            >
              {/* Row 1: Brand Name & Tagline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                    Nome da Marca / Portal *
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsBrandName}
                    onChange={(e) => setSettingsBrandName(e.target.value)}
                    placeholder="VIVA SC"
                    className="w-full rounded-xl bg-black px-4 py-3 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                    Slogan / Subtítulo Marca
                  </label>
                  <input
                    type="text"
                    value={settingsTagline}
                    onChange={(e) => setSettingsTagline(e.target.value)}
                    placeholder="Futuristic Living"
                    className="w-full rounded-xl bg-black px-4 py-3 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans"
                  />
                </div>
              </div>

              {/* Row 2: WhatsApp Phone & Contact Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                    Telefone WhatsApp (Com DDD e País) *
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsPhone}
                    onChange={(e) => setSettingsPhone(e.target.value)}
                    placeholder="5547999999999"
                    className="w-full rounded-xl bg-black px-4 py-3 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-mono"
                  />
                  <span className="block text-[10px] text-zinc-500 leading-normal font-sans pt-1">
                    * Digite apenas números, incluindo o 55 do país (ex: 5547999999999).
                  </span>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                    E-mail para Formulários de Contato *
                  </label>
                  <input
                    type="email"
                    required
                    value={settingsEmail}
                    onChange={(e) => setSettingsEmail(e.target.value)}
                    placeholder="comercial.vivasc@gmail.com"
                    className="w-full rounded-xl bg-black px-4 py-3 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-mono"
                  />
                  <span className="block text-[10px] text-zinc-500 leading-normal font-sans pt-1">
                    * E-mail centralizado que receberá as propostas e formulários enviados pelo modal do site.
                  </span>
                </div>
              </div>

              {/* Row 3: Logo URL or Drag and Drop base64 upload */}
              <div className="space-y-3.5 border-t border-zinc-900 pt-5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                    Upload ou URL do Logotipo da Marca
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  {/* File Dropzone/Selector */}
                  <div className="md:col-span-2 relative rounded-xl border border-dashed border-zinc-850 bg-black hover:bg-zinc-950 hover:border-orange-500/50 transition-all p-4 flex flex-col items-center justify-center text-center gap-1.5 min-h-[110px] cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleSingleImageUpload(file, 'configuracoes', setSettingsLogoUrl);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-15"
                    />
                    <ImageIcon className="h-6 w-6 text-zinc-500 group-hover:text-orange-500 transition-colors" />
                    <span className="text-[11px] font-bold text-zinc-300">Selecione ou arraste o logo</span>
                    <span className="text-[9px] text-zinc-500 font-mono">PNG, SVG ou JPG (Até 2MB)</span>
                  </div>

                  {/* Logo Preview box */}
                  <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 flex flex-col justify-center items-center text-center">
                    <span className="text-[8px] font-mono text-zinc-600 uppercase mb-2 block">Prévia da Logo</span>
                    {settingsLogoUrl ? (
                      <div className="relative group w-full h-12 flex items-center justify-center bg-black/40 rounded-lg p-2 border border-zinc-900 animate-fade-in">
                        <img
                          src={settingsLogoUrl}
                          alt="Brand Logo"
                          className="max-h-full max-w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setSettingsLogoUrl('')}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-650 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-lg"
                        >
                          x
                        </button>
                      </div>
                    ) : (
                      <div className="h-12 w-full border border-dashed border-zinc-850 rounded-lg flex items-center justify-center text-[10px] text-zinc-600 uppercase font-mono">
                        Nenhuma logo
                      </div>
                    )}
                  </div>
                </div>

                {/* Text input fallback */}
                <div className="space-y-2">
                  <span className="block text-[9px] text-zinc-500 uppercase font-mono">Ou informe a URL absoluta diretamente</span>
                  <input
                    type="text"
                    value={settingsLogoUrl}
                    onChange={(e) => setSettingsLogoUrl(e.target.value)}
                    placeholder="https://suapraca.com.br/arquivos/logo.png"
                    className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-mono placeholder-zinc-850"
                  />
                </div>
              </div>

              {/* Row 3.5: Footer Logo URL or Drag and Drop base64 upload and Size */}
              <div className="space-y-3.5 border-t border-zinc-900 pt-5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold tracking-widest text-[#FF9D00] uppercase font-mono block">
                    ✦ Logotipo Alternativo para o Rodapé (Outra cor/tamanho)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  {/* File Dropzone/Selector */}
                  <div className="md:col-span-2 relative rounded-xl border border-dashed border-zinc-850 bg-black hover:bg-zinc-950 hover:border-orange-500/50 transition-all p-4 flex flex-col items-center justify-center text-center gap-1.5 min-h-[110px] cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleSingleImageUpload(file, 'configuracoes', setSettingsFooterLogoUrl);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-15"
                    />
                    <ImageIcon className="h-6 w-6 text-zinc-500 group-hover:text-orange-500 transition-colors" />
                    <span className="text-[11px] font-bold text-zinc-300">Selecione ou arraste o logo do rodapé</span>
                    <span className="text-[9px] text-zinc-500 font-mono">PNG, SVG ou JPG (ideal cor escura para fundo claro)</span>
                  </div>

                  {/* Footer Logo Preview box - rendered with light-gray background to simulate footer! */}
                  <div className="rounded-xl border border-zinc-900 bg-zinc-100 p-4 flex flex-col justify-center items-center text-center">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase mb-2 block">Prévia no Rodapé</span>
                    {settingsFooterLogoUrl ? (
                      <div className="relative group w-full h-12 flex items-center justify-center bg-white rounded-lg p-2 border border-zinc-200 animate-fade-in">
                        <img
                          src={settingsFooterLogoUrl}
                          alt="Footer Brand Logo"
                          className="max-h-full max-w-full object-contain"
                          style={{ height: settingsFooterLogoHeight || 'auto' }}
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setSettingsFooterLogoUrl('')}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-lg"
                        >
                          x
                        </button>
                      </div>
                    ) : (
                      <div className="h-12 w-full border border-dashed border-zinc-300 rounded-lg flex items-center justify-center text-[10px] text-zinc-500 uppercase font-mono bg-white">
                        Nenhuma logo
                      </div>
                    )}
                  </div>
                </div>

                {/* Text input fallback & height adjustment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <span className="block text-[9px] text-zinc-500 uppercase font-mono text-left">Ou informe a URL absoluta diretamente</span>
                    <input
                      type="text"
                      value={settingsFooterLogoUrl}
                      onChange={(e) => setSettingsFooterLogoUrl(e.target.value)}
                      placeholder="https://suapraca.com.br/arquivos/logo-footer.png"
                      className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-mono placeholder-zinc-850"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <span className="block text-[9px] text-zinc-500 uppercase font-mono">Altura Personalizada (ex: 40px)</span>
                    <input
                      type="text"
                      value={settingsFooterLogoHeight}
                      onChange={(e) => setSettingsFooterLogoHeight(e.target.value)}
                      placeholder="Ex: 40px, 48px, auto"
                      className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-mono placeholder-zinc-850"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Favicon Upload/URL */}
              <div className="space-y-3.5 border-t border-zinc-900 pt-5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold tracking-widest text-[#FF9D00] uppercase font-mono block">
                    ✦ Favicon do Navegador (.ico, .png, .svg)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  {/* File Dropzone/Selector */}
                  <div className="md:col-span-2 relative rounded-xl border border-dashed border-zinc-850 bg-black hover:bg-zinc-950 hover:border-orange-500/50 transition-all p-4 flex flex-col items-center justify-center text-center gap-1.5 min-h-[110px] cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleSingleImageUpload(file, 'configuracoes', setSettingsFaviconUrl);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-15"
                    />
                    <ImageIcon className="h-6 w-6 text-zinc-500 group-hover:text-orange-500 transition-colors" />
                    <span className="text-[11px] font-bold text-zinc-300">Selecione ou arraste o Favicon</span>
                    <span className="text-[9px] text-zinc-500 font-mono">Ícone pequeno de aba (Até 500KB)</span>
                  </div>

                  {/* Favicon Preview box */}
                  <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 flex flex-col justify-center items-center text-center">
                    <span className="text-[8px] font-mono text-zinc-650 uppercase mb-2 block">Prévia do Favicon</span>
                    {settingsFaviconUrl ? (
                      <div className="relative group w-12 h-12 flex items-center justify-center bg-black/40 rounded-lg p-2 border border-zinc-900 animate-fade-in mx-auto">
                        <img
                          src={settingsFaviconUrl}
                          alt="Favicon"
                          className="max-h-full max-w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setSettingsFaviconUrl('')}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-650 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-lg"
                        >
                          x
                        </button>
                      </div>
                    ) : (
                      <div className="h-12 w-12 border border-dashed border-zinc-850 rounded-lg flex items-center justify-center text-[10px] text-zinc-600 uppercase font-mono mx-auto">
                        Vazio
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-[9px] text-zinc-500 uppercase font-mono">Ou informe a URL absoluta diretamente</span>
                  <input
                    type="text"
                    value={settingsFaviconUrl}
                    onChange={(e) => setSettingsFaviconUrl(e.target.value)}
                    placeholder="https://suapraca.com.br/favicon.png"
                    className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-mono placeholder-zinc-850"
                  />
                </div>
              </div>

              {/* Row 5: Share Logo/Preview Upload/URL */}
              <div className="space-y-3.5 border-t border-zinc-900 pt-5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold tracking-widest text-[#FF9D00] uppercase font-mono block">
                    ✦ Imagem para Compartilhamento da Home (Social og:image)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  {/* File Dropzone/Selector */}
                  <div className="md:col-span-2 relative rounded-xl border border-dashed border-zinc-850 bg-black hover:bg-zinc-950 hover:border-orange-500/50 transition-all p-4 flex flex-col items-center justify-center text-center gap-1.5 min-h-[110px] cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleSingleImageUpload(file, 'configuracoes', setSettingsShareLogoUrl);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-15"
                    />
                    <ImageIcon className="h-6 w-6 text-zinc-500 group-hover:text-orange-500 transition-colors" />
                    <span className="text-[11px] font-bold text-zinc-300">Selecione ou arraste a imagem social</span>
                    <span className="text-[9px] text-zinc-500 font-mono">Recomendado: 1200x630px JPG/PNG (Até 2MB)</span>
                  </div>

                  {/* Share Preview box */}
                  <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 flex flex-col justify-center items-center text-center">
                    <span className="text-[8px] font-mono text-zinc-650 uppercase mb-2 block">Prévia da og:image</span>
                    {settingsShareLogoUrl ? (
                      <div className="relative group w-full h-12 flex items-center justify-center bg-black/40 rounded-lg p-2 border border-zinc-900 animate-fade-in">
                        <img
                          src={settingsShareLogoUrl}
                          alt="Social Share"
                          className="max-h-full max-w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setSettingsShareLogoUrl('')}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-650 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-lg"
                        >
                          x
                        </button>
                      </div>
                    ) : (
                      <div className="h-12 w-full border border-dashed border-zinc-850 rounded-lg flex items-center justify-center text-[10px] text-zinc-600 uppercase font-mono">
                        Nenhuma imagem
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-[9px] text-zinc-500 uppercase font-mono">Ou informe a URL absoluta diretamente</span>
                  <input
                    type="text"
                    value={settingsShareLogoUrl}
                    onChange={(e) => setSettingsShareLogoUrl(e.target.value)}
                    placeholder="https://suapraca.com.br/og-image.png"
                    className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-mono placeholder-zinc-850"
                  />
                  <span className="block text-[9px] text-zinc-500 leading-normal pt-0.5 font-sans">
                    * Se deixado em branco, o portal usará automaticamente o logotipo principal como imagem de compartilhamento da home.
                  </span>
                </div>
              </div>

              {/* Row 6: Dados Cadastrais / Empresa */}
              <div className="space-y-3.5 border-t border-zinc-900 pt-5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold tracking-widest text-[#FF9D00] uppercase font-mono block">
                    ✦ Dados Cadastrais / Dados da Empresa (Impressos no Rodapé)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-mono text-zinc-400 font-bold block">
                      Nome da Empresa / Razão Social
                    </label>
                    <input
                      type="text"
                      value={settingsCompanyName}
                      onChange={(e) => setSettingsCompanyName(e.target.value)}
                      placeholder="Meu Primeiro Imóvel ME"
                      className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-mono text-zinc-400 font-bold block">
                      CRECI (Registro Imobiliário)
                    </label>
                    <input
                      type="text"
                      value={settingsCreci}
                      onChange={(e) => setSettingsCreci(e.target.value)}
                      placeholder="Creci 36847"
                      className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-mono text-zinc-400 font-bold block">
                      CNPJ (Cadastro de Pessoa Jurídica)
                    </label>
                    <input
                      type="text"
                      value={settingsCnpj}
                      onChange={(e) => setSettingsCnpj(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Row 7: LGPD, Terms of Use, Privacy Policy & Cookie Banner */}
              <div className="space-y-4 border-t border-zinc-900 pt-5">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#FF9D00] font-mono uppercase block mb-1">
                    ✦ Compliance, Cookies & LGPD
                  </span>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Customize o comportamento e os textos dos termos legais, política de privacidade e aviso de cookies em conformidade com a LGPD.
                  </p>
                </div>

                {/* Cookie banner config */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-mono text-zinc-400 font-bold block">
                      Cookie Consent
                    </label>
                    <div className="flex items-center gap-3 bg-black border border-zinc-900 rounded-xl px-4 py-3 cursor-pointer select-none" onClick={() => setSettingsEnableCookieConsent(!settingsEnableCookieConsent)}>
                      <input
                        type="checkbox"
                        checked={settingsEnableCookieConsent}
                        onChange={(e) => setSettingsEnableCookieConsent(e.target.checked)}
                        className="h-4 w-4 rounded bg-zinc-900 border-zinc-950 text-orange-500 focus:ring-0 focus:ring-offset-0 focus:outline-none accent-orange-500 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs text-white font-medium select-none">Habilitar Banner de Cookies</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[9px] uppercase font-mono text-zinc-400 font-bold block">
                      Texto do Banner de Consentimento
                    </label>
                    <textarea
                      rows={2}
                      value={settingsCookieText}
                      onChange={(e) => setSettingsCookieText(e.target.value)}
                      placeholder="Este site utiliza cookies de navegação para personalizar anúncios e analisar o tráfego do site de forma segura, conforme nossas políticas. Ao prosseguir, você consente com seu uso."
                      className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans resize-none placeholder-zinc-800"
                    />
                  </div>
                </div>

                {/* Terms of Use and Privacy Policy Multi-line Rich Text areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-mono text-[#FF9D00] font-bold block">
                      Termos de Uso e Consentimento de Cadastro
                    </label>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Insira os termos que são mostrados ao usuário na aba correspondente do site ou nos formulários de interesse.
                    </p>
                    <textarea
                      rows={6}
                      value={settingsTermsOfUse}
                      onChange={(e) => setSettingsTermsOfUse(e.target.value)}
                      placeholder="Insira os termos de uso legais da sua imobiliária de forma estruturada..."
                      className="w-full rounded-xl bg-black px-4 py-3 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans placeholder-zinc-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-mono text-[#FF9D00] font-bold block">
                      Política de Privacidade e Proteção de Dados (LGPD)
                    </label>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Insira as diretrizes de privacidade sobre como você processará os dados fornecidos no formulário.
                    </p>
                    <textarea
                      rows={6}
                      value={settingsPrivacyPolicy}
                      onChange={(e) => setSettingsPrivacyPolicy(e.target.value)}
                      placeholder="Insira as regras e políticas de privacidade conforme a LGPD..."
                      className="w-full rounded-xl bg-black px-4 py-3 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans placeholder-zinc-800"
                    />
                  </div>
                </div>
              </div>

              {/* Textos do Menu Sobre Nós Section */}
              <div className="space-y-4 border-t border-zinc-900 pt-5">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#FF9D00] font-mono uppercase block mb-1">
                    ✦ Menu Sobre Nós
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Textos da Página Sobre Nós
                  </h3>
                  <p className="text-xs text-zinc-500 leading-normal mt-1">
                    Preencha e personalize os textos exibidos aos usuários na página institucional "Sobre Nós" do portal.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                      Etiqueta do Crachá/Badge
                    </label>
                    <input
                      type="text"
                      value={settingsAboutHeading}
                      onChange={(e) => setSettingsAboutHeading(e.target.value)}
                      placeholder="Portal imobiliário de lançamentos"
                      className="w-full rounded-xl bg-black px-4 py-3 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans"
                    />
                    <span className="block text-[10px] text-zinc-550 leading-normal">
                      * Texto em destaque de cor dourada exibido acima do título principal "Sobre Nós".
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                      Subtítulo de Introdução
                    </label>
                    <textarea
                      rows={2}
                      value={settingsAboutSubtitle}
                      onChange={(e) => setSettingsAboutSubtitle(e.target.value)}
                      placeholder="Conectamos você aos lançamentos mais promissores..."
                      className="w-full rounded-xl bg-black px-4 py-3 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans"
                    />
                    <span className="block text-[10px] text-zinc-550 leading-normal">
                      * O parágrafo principal explicativo logo abaixo do título "Sobre Nós".
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                      História & Propósito
                    </label>
                    <textarea
                      rows={5}
                      value={settingsAboutHistory}
                      onChange={(e) => setSettingsAboutHistory(e.target.value)}
                      placeholder="História completa..."
                      className="w-full rounded-xl bg-black px-4 py-3 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans placeholder-zinc-850"
                    />
                    <span className="block text-[10px] text-zinc-550 leading-normal">
                      * Texto explicativo detalhado sobre a história e propósito da imobiliária.
                    </span>
                  </div>
                </div>
              </div>

                <div className="mt-8 pt-8 border-t border-zinc-900 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-[#FF9D00] font-mono uppercase block mb-1">
                        ✦ Menu Cadastro
                      </span>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Textos da Página de Cadastro
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                        URL do Logo Minha Casa Minha Vida
                      </label>
                      <input
                        type="text"
                        value={settingsMcmvLogoUrl}
                        onChange={(e) => setSettingsMcmvLogoUrl(e.target.value)}
                        placeholder="https://exemplo.com/logo-mcmv.png"
                        className="w-full rounded-xl bg-black px-4 py-3 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                        Título da Página
                      </label>
                      <input
                        type="text"
                        value={settingsCadastroHeading}
                        onChange={(e) => setSettingsCadastroHeading(e.target.value)}
                        placeholder="Faça seu cadastro"
                        className="w-full rounded-xl bg-black px-4 py-3 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                        Subtítulo da Página
                      </label>
                      <textarea
                        rows={2}
                        value={settingsCadastroSubtitle}
                        onChange={(e) => setSettingsCadastroSubtitle(e.target.value)}
                        placeholder="Informações para simulação"
                        className="w-full rounded-xl bg-black px-4 py-3 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                        Conteúdo Principal
                      </label>
                      <textarea
                        rows={5}
                        value={settingsCadastroContent}
                        onChange={(e) => setSettingsCadastroContent(e.target.value)}
                        placeholder="Conteúdo informativo..."
                        className="w-full rounded-xl bg-black px-4 py-3 text-xs text-white border border-zinc-900 focus:border-orange-500/60 outline-none font-sans"
                      />
                    </div>
                  </div>
                </div>

              {/* Submit panel buttons */}
              <div className="border-t border-zinc-900 pt-5 text-right">
                <button
                  type="submit"
                  disabled={isSettingsUpdating || uploadState.isUploading}
                  className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold tracking-widest uppercase transition-all duration-300 shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSettingsUpdating 
                    ? 'Atualizando marca...' 
                    : uploadState.isUploading 
                      ? 'Aguardando Upload...' 
                      : 'Salvar no Firebase'}
                </button>
              </div>
            </form>
          </div>

          {/* Diagnostic & Troubleshooting Area for SMTP / Emails */}
          <div className="bg-zinc-950 p-6 border border-zinc-900 rounded-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold tracking-widest text-[#FF9D00] font-mono uppercase block">Suporte & Integrações</span>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Guia de Diagnóstico de E-mails (SMTP)</h3>
              </div>
            </div>

            <div className="text-xs text-zinc-400 space-y-3 leading-relaxed">
              <p>
                O sistema de notificações de leads e pré-aprovações dispara e-mails automáticos em tempo real para <strong className="text-white">{settingsEmail || 'comercial.vivasc@gmail.com'}</strong> sempre que um novo prospect preenche um cadastro no portal.
              </p>
              <p>
                Se você receber erros de credenciais ao enviar e-mails (como <code className="text-orange-400 bg-black/40 px-1.5 py-0.5 rounded font-mono">Invalid login: 535-5.7.8 Username and Password not accepted</code>), é porque a Google bloqueia logins utilizando sua senha de e-mail comum. Siga as instruções abaixo para resolver:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-900/60 pt-5">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase font-mono">Como configurar o Gmail (App Password):</h4>
                <ol className="list-decimal list-inside text-xs text-zinc-400 space-y-2">
                  <li>
                    Acesse a sua conta Google em <a href="https://myaccount.google.com" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline inline-flex items-center gap-0.5">myaccount.google.com <Globe className="w-3 h-3 inline" /></a>.
                  </li>
                  <li>
                    No menu esquerdo, vá para a seção de <strong className="text-white">Segurança</strong>.
                  </li>
                  <li>
                    Certifique-se de que a <strong className="text-emerald-400">Verificação em duas etapas</strong> está ativada.
                  </li>
                  <li>
                    Ao final da página de Verificação em duas etapas, localize a opção <strong className="text-white">Senhas de App (App Passwords)</strong>.
                  </li>
                  <li>
                    Crie uma nova senha escolhendo qualquer nome (Ex: <code className="text-orange-400 font-mono">CRM VIVASC</code>).
                  </li>
                  <li>
                    O Google exibirá um código seguro de <strong className="text-orange-400 font-mono">16 caracteres</strong>. Salve-o.
                  </li>
                  <li>
                    Introduza essa senha de 16 caracteres sem espaços no segredo <code className="text-orange-400 font-mono">SMTP_PASS</code> da plataforma.
                  </li>
                </ol>
              </div>

              <div className="space-y-3 bg-black/40 border border-zinc-900 p-4 rounded-xl">
                <h4 className="text-[10px] font-bold tracking-widest text-[#FF9D00] uppercase font-mono">Valores de Configuração Corretos:</h4>
                <div className="space-y-2.5 text-[11px] font-mono text-zinc-400">
                  <div className="flex justify-between border-b border-zinc-900/40 pb-1.5">
                    <span className="text-zinc-550">SMTP_HOST:</span>
                    <span className="text-white font-bold">smtp.gmail.com</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900/40 pb-1.5">
                    <span className="text-zinc-550">SMTP_PORT:</span>
                    <span className="text-white font-bold">587</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900/40 pb-1.5">
                    <span className="text-zinc-550">SMTP_SECURE:</span>
                    <span className="text-white font-bold">false</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900/40 pb-1.5">
                    <span className="text-zinc-550">SMTP_USER:</span>
                    <span className="text-white font-bold">comercial.vivasc@gmail.com</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900/40 pb-1.5">
                    <span className="text-zinc-550 font-sans text-orange-400">SMTP_PASS (Senha de App):</span>
                    <span className="text-orange-400 font-bold font-sans text-right">Seu código de 16 caracteres</span>
                  </div>
                  <div className="flex justify-between pb-0.5">
                    <span className="text-zinc-550">EMAIL_FROM:</span>
                    <span className="text-white font-bold">comercial.vivasc@gmail.com</span>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 font-sans leading-normal pt-2 border-t border-zinc-900 mt-2">
                  ℹ Caso precise alterar as variáveis ambientais no painel do servidor, reinicie o container para aplicar os novos dados.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          1. DASHBOARD MODULE RENDERING
          ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Top summary row stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-950 p-5 border border-zinc-900 rounded-2xl relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300 select-none">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/5 to-transparent rounded-tr-2xl"></div>
              <Building className="h-6 w-6 text-orange-500 mb-3 group-hover:scale-110 transition-transform duration-300" />
              <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase font-mono">Portfólio de Imóveis</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{properties.length}</h3>
              <p className="text-[10px] text-zinc-400 mt-2">✦ Prontos, Lançamentos & Obras</p>
            </div>
            
            <div className="bg-zinc-950 p-5 border border-zinc-900 rounded-2xl relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300 select-none">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-tr-2xl"></div>
              <Layers className="h-6 w-6 text-cyan-400 mb-3 group-hover:scale-110 transition-transform duration-300" />
              <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase font-mono">Leads de Interesse</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{leads.length}</h3>
              <p className="text-[10px] text-zinc-400 mt-2">✦ Oportunidades CRM ativas</p>
            </div>

            <div className="bg-zinc-950 p-5 border border-zinc-900 rounded-2xl relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300 select-none">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/5 to-transparent rounded-tr-2xl"></div>
              <Users className="h-6 w-6 text-purple-400 mb-3 group-hover:scale-110 transition-transform duration-300" />
              <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase font-mono">Diretório de Clientes</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{clients.length}</h3>
              <p className="text-[10px] text-zinc-400 mt-2">✦ Cadastro de investidores</p>
            </div>

            <div className="bg-zinc-950 p-5 border border-zinc-900 rounded-2xl relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300 select-none">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-tr-2xl"></div>
              <CalendarDays className="h-6 w-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform duration-300" />
              <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase font-mono">Visitas Agendadas</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{visits.length}</h3>
              <p className="text-[10px] text-zinc-400 mt-2">✦ Agendas de campo técnicas</p>
            </div>
          </div>

          {/* Graphics plots Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Status Chart Card */}
            <div className="bg-zinc-950 p-5 border border-zinc-900 rounded-2xl space-y-4">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-orange-500 block">✦ Ativação Comercial</span>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Leads por Canal Comercial (Métricas do Funil)</h4>
              
              <div className="h-64 w-full">
                {leads.length === 0 ? (
                  <div className="flex items-center justify-center h-full border border-dashed border-zinc-850 rounded-xl bg-black">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Sem dados de Leads para plotagem</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { canal: 'Novo', leads: leads.filter(l => l.status === 'Novo').length },
                        { canal: 'Em Atendimento', leads: leads.filter(l => l.status === 'Em Atendimento').length },
                        { canal: 'Visita Marcada', leads: leads.filter(l => l.status === 'Visita Agendada').length },
                        { canal: 'Vendidos / Fim', leads: leads.filter(l => l.status === 'Finalizado').length }
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#1c1c1e" strokeDasharray="3 3" />
                      <XAxis dataKey="canal" stroke="#71717a" fontSize={10} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                        labelStyle={{ fontStyle: 'bold', color: '#ff7a00' }}
                      />
                      <Bar dataKey="leads" fill="#ff7a00" radius={[6, 6, 0, 0]}>
                        <Cell fill="#f97316" />
                        <Cell fill="#06b6d4" />
                        <Cell fill="#10b981" />
                        <Cell fill="#8b5cf6" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Leads Origin breakdown & Click ratios */}
            <div className="bg-zinc-950 p-5 border border-zinc-900 rounded-2xl space-y-4">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-cyan-400 block">✦ Origens e Atração</span>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Origem das Solicitações e Rastreamento UTM</h4>
              
              <div className="h-64 w-full">
                {leads.length === 0 ? (
                  <div className="flex items-center justify-center h-full border border-dashed border-zinc-850 rounded-xl bg-black">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Sem dados para plotagem de origens</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { dia: 'Seg', direta: 2, whatsApp: 4, entrada: 1 },
                        { dia: 'Ter', direta: 4, whatsApp: 5, entrada: 3 },
                        { dia: 'Qua', direta: 3, whatsApp: 8, entrada: 2 },
                        { dia: 'Qui', direta: 5, whatsApp: 7, entrada: 4 },
                        { dia: 'Sex', direta: 7, whatsApp: 9, entrada: 5 },
                        { dia: 'Sáb', direta: 9, whatsApp: 12, entrada: 8 },
                        { dia: 'Dom', direta: 6, whatsApp: 15, entrada: 7 }
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorWhats" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1c1c1e" />
                      <XAxis dataKey="dia" stroke="#71717a" fontSize={10} />
                      <YAxis stroke="#71717a" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Area type="monotone" dataKey="whatsApp" stroke="#06b6d4" fillOpacity={1} fill="url(#colorWhats)" name="Cliques WhatsApp" />
                      <Area type="monotone" dataKey="entrada" stroke="#10b981" fillOpacity={1} fill="url(#colorDown)" name="Filtro Entrada" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Broker Metrics and Properties Stats Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Brokers List Stats */}
            <div className="bg-zinc-950 p-5 border border-zinc-900 rounded-2xl lg:col-span-2 space-y-4">
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Gestão Comercial & Performance de Corretores</h4>
              <div className="overflow-x-auto border border-zinc-900 rounded-xl bg-black">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-950/50">
                      <th className="p-3 text-[10px] uppercase font-mono tracking-widest text-zinc-500">Corretor</th>
                      <th className="p-3 text-[10px] uppercase font-mono tracking-widest text-zinc-500">Região de atuação</th>
                      <th className="p-3 text-[10px] uppercase font-mono tracking-widest text-zinc-500">Status</th>
                      <th className="p-3 text-[10px] uppercase font-mono tracking-widest text-zinc-500 text-center">Leads Ativos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brokers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-xs text-zinc-600 font-mono">Não existem corretores credenciados para exibição.</td>
                      </tr>
                    ) : (
                      brokers.map(b => (
                        <tr key={b.id} className="border-b border-zinc-900/60 hover:bg-zinc-950 transition-colors">
                          <td className="p-3">
                            <span className="block text-xs font-bold text-white">{b.name}</span>
                            <span className="block text-[10px] font-mono text-zinc-500">{b.email}</span>
                          </td>
                          <td className="p-3 text-xs text-zinc-400">{b.region || 'Balneário Camboriú'}</td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${b.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'}`}>{b.status}</span>
                          </td>
                          <td className="p-3 text-xs font-mono font-bold text-orange-500 text-center">
                            {leads.filter(l => l.brokerId === b.id).length}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top viewed properties sidebar */}
            <div className="bg-zinc-950 p-5 border border-zinc-900 rounded-2xl space-y-4 select-none">
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Top Lançamentos Visados</h4>
              <div className="space-y-3">
                {properties.slice(0, 4).map((p, index) => (
                  <div key={p.id} className="flex gap-3 items-center p-3 rounded-xl border border-zinc-900 bg-black/40">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-mono font-bold text-orange-500 border border-zinc-800">#{index+1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate uppercase">{p.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{p.neighborhood}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-300">R$ {(((typeof p.price === 'number' ? p.price : Number(p.price) || 0) / 1000000).toFixed(1))}M</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. BROKERS CONTROL PANEL MODULE
          ========================================================================= */}
      {activeTab === 'brokers' && (
        <div className="space-y-6 max-w-6xl mx-auto">
          <div className="flex justify-between items-center bg-zinc-950 p-4 border border-zinc-900 rounded-xl">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              Mostrando {brokers.length} corretores credenciados
            </span>
            <button
              onClick={() => {
                setEditingBrokerId(null);
                setBrokerName('');
                setBrokerEmail('');
                setBrokerPhone('');
                setBrokerRegion('');
                setBrokerStatus('Ativo');
                setBrokerChatName('');
                setBrokerChatPhotoUrl('');
                setBrokerPassword('');
                setBrokerReceiveChat(true);
                setIsBrokerFormOpen(true);
              }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 font-bold text-black border border-orange-500 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Novo Corretor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brokers.map(b => (
              <div key={b.id} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4 hover:border-zinc-800 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <img
                      src={b.chatPhotoUrl || EXECUTIVE_AVATAR}
                      alt={b.chatName || b.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border border-zinc-800 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${b.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-800'}`}>{b.status}</span>
                        {b.receiveChat !== false && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">Chat Ativo</span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-white mt-1 uppercase tracking-tight">{b.name}</h4>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0 z-10">
                    <button
                      onClick={() => {
                        setEditingBrokerId(b.id);
                        setBrokerName(b.name);
                        setBrokerEmail(b.email);
                        setBrokerPhone(b.phone);
                        setBrokerRegion(b.region);
                        setBrokerStatus(b.status);
                        setBrokerChatName(b.chatName || b.name);
                        setBrokerChatPhotoUrl(b.chatPhotoUrl || '');
                        setBrokerPassword(b.password || '123456');
                        setBrokerReceiveChat(b.receiveChat !== false);
                        setIsBrokerFormOpen(true);
                      }}
                      className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-850 hover:bg-zinc-850 transition-all cursor-pointer"
                      title="Editar Corretor"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Tem certeza que deseja descredenciar o corretor ${b.name}?`)) {
                          await deleteBrokerFromFirestore(b.id);
                        }
                      }}
                      className="p-2 rounded-lg bg-zinc-900 text-orange-500 hover:text-orange-400 border border-zinc-850 hover:bg-orange-950/20 transition-all cursor-pointer"
                      title="Remover Corretor"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-zinc-900/60 font-mono text-[11px] text-zinc-400">
                  <div className="flex justify-between">
                    <span className="text-zinc-550 header-title">Email:</span>
                    <span className="text-white truncate max-w-[180px]">{b.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-550 header-title">Telefone:</span>
                    <span className="text-white">{b.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-550 header-title">Região:</span>
                    <span className="text-white">{b.region || 'Balneário Camboriú'}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-900/40 pt-1.5 mt-1.5 font-sans">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Nome no Chat:</span>
                    <span className="text-xs text-orange-400 font-extrabold">{b.chatName || b.name}</span>
                  </div>
                </div>
              </div>
            ))}

            {brokers.length === 0 && (
              <div className="md:col-span-3 text-center py-16 border border-dashed border-zinc-850 rounded-2xl bg-black">
                <Users className="h-10 w-10 text-zinc-500 mx-auto mb-4" />
                <p className="text-sm font-bold text-white uppercase tracking-wider">Lista vazia</p>
                <p className="text-xs text-zinc-500 mt-1">Nenhum corretor cadastrado no banco.</p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {isBrokerFormOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative"
                >
                  <button
                    onClick={() => setIsBrokerFormOpen(false)}
                    className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider mb-6">
                    {editingBrokerId ? 'Editar Corretor Credenciado' : 'Credenciar Novo Corretor'}
                  </h3>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!brokerName || !brokerEmail || !brokerPhone) {
                        alert('Preencha os campos estruturais obrigatórios!');
                        return;
                      }
                      const payload: Broker = {
                        id: editingBrokerId || `broker-${Date.now()}`,
                        name: brokerName,
                        email: brokerEmail,
                        phone: brokerPhone,
                        region: brokerRegion,
                        status: brokerStatus,
                        chatName: brokerChatName || brokerName,
                        chatPhotoUrl: brokerChatPhotoUrl || EXECUTIVE_AVATAR,
                        password: brokerPassword || '123456',
                        receiveChat: brokerReceiveChat,
                        createdAt: new Date().toISOString()
                      };
                      await saveBrokerToFirestore(payload);
                      setIsBrokerFormOpen(false);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        value={brokerName}
                        onChange={(e) => setBrokerName(e.target.value)}
                        placeholder="Nome do corretor"
                        className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none placeholder-zinc-850"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Email de Acesso *</label>
                      <input
                        type="email"
                        required
                        value={brokerEmail}
                        onChange={(e) => setBrokerEmail(e.target.value)}
                        placeholder="email@vivasc.com.br"
                        className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none placeholder-zinc-850"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">WhatsApp / Celular *</label>
                      <input
                        type="text"
                        required
                        value={brokerPhone}
                        onChange={(e) => setBrokerPhone(e.target.value)}
                        placeholder="+55 (47) 99999-9999"
                        className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none placeholder-zinc-850"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Região / Cidade</label>
                      <input
                        type="text"
                        value={brokerRegion}
                        onChange={(e) => setBrokerRegion(e.target.value)}
                        placeholder="Ex: Praia Brava / Balneário Camboriú"
                        className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none placeholder-zinc-850"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Status de Credenciamento</label>
                      <select
                        value={brokerStatus}
                        onChange={(e) => setBrokerStatus(e.target.value as 'Ativo' | 'Inativo')}
                        className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none"
                      >
                        <option value="Ativo">Ativo / Prontamente para Leads</option>
                        <option value="Inativo">Inativo / Fora de Escalabilidade</option>
                      </select>
                    </div>

                    <div className="border-t border-zinc-900 pt-4 space-y-4">
                      <h4 className="text-[10px] font-bold tracking-widest text-orange-400 uppercase font-mono">Configurações de Atendimento & Chat</h4>
                      
                      <div>
                        <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Nome de Exibição no Chat</label>
                        <input
                          type="text"
                          value={brokerChatName}
                          onChange={(e) => setBrokerChatName(e.target.value)}
                          placeholder="Ex: Amanda Santos"
                          className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none placeholder-zinc-850"
                        />
                        <span className="text-[9px] text-zinc-500 mt-1 block">Nome amigável que o cliente verá no balão flutuante. Caso deixe em branco, usará o nome completo.</span>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">URL da Foto de Perfil no Chat</label>
                        <input
                          type="url"
                          value={brokerChatPhotoUrl}
                          onChange={(e) => setBrokerChatPhotoUrl(e.target.value)}
                          placeholder="Ex: https://images.unsplash.com/..."
                          className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none placeholder-zinc-850"
                        />
                        <span className="text-[9px] text-zinc-500 mt-1 block">Insira um link HTTPS válido para a imagem do corretor para o botão de bate-papo.</span>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Senha de Login do Corretor *</label>
                        <input
                          type="password"
                          value={brokerPassword}
                          onChange={(e) => setBrokerPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none placeholder-zinc-850"
                        />
                        <span className="text-[9px] text-zinc-500 mt-1 block">Esta senha será usada para login direto por e-mail e senha. Inicializada como '123456'.</span>
                      </div>

                      <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-zinc-900">
                        <input
                          type="checkbox"
                          id="receiveChatCheckbox"
                          checked={brokerReceiveChat}
                          onChange={(e) => setBrokerReceiveChat(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-900 text-orange-500 focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="receiveChatCheckbox" className="text-xs font-medium text-white cursor-pointer select-none">
                          Habilitar recebimento de chamados e chats flutuantes
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-900 flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setIsBrokerFormOpen(false)}
                        className="px-5 py-2.5 rounded-xl border border-zinc-850 text-zinc-400 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Descartar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-orange-500 text-black text-xs font-extrabold tracking-wider uppercase hover:bg-orange-600 transition-all cursor-pointer shadow-lg shadow-orange-500/10"
                      >
                        Salvar Corretor
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* =========================================================================
          3. SATELLITE CLIENTS DIRECTORY
          ========================================================================= */}
      {activeTab === 'clients' && (
        <div className="space-y-6 max-w-6xl mx-auto">
          <div className="flex justify-between items-center bg-zinc-950 p-4 border border-zinc-900 rounded-xl">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              Mostrando {clients.length} investidores cadastrados
            </span>
            <button
              onClick={() => {
                setEditingClientId(null);
                setClientFormName('');
                setClientFormEmail('');
                setClientFormPhone('');
                setClientFormNotes('');
                setIsClientFormOpen(true);
              }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 font-bold text-black border border-orange-500 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Novo Cliente
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(c => (
              <div key={c.id} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4 hover:border-zinc-800 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <UserCheck className="h-6 w-6 text-orange-500 mb-2" />
                    <h4 className="text-base font-extrabold text-white uppercase tracking-tight truncate max-w-[200px]">{c.name}</h4>
                  </div>
                  <div className="flex gap-1.5 shrink-0 z-10">
                    <button
                      onClick={() => {
                        setEditingClientId(c.id);
                        setClientFormName(c.name);
                        setClientFormEmail(c.email);
                        setClientFormPhone(c.phone);
                        setClientFormNotes(c.observations || '');
                        setIsClientFormOpen(true);
                      }}
                      className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-850 hover:bg-zinc-850 transition-all cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Excluir investidor ${c.name}?`)) {
                          await deleteClientFromFirestore(c.id);
                        }
                      }}
                      className="p-2 rounded-lg bg-zinc-900 text-orange-500 hover:text-orange-400 border border-zinc-850 hover:bg-orange-950/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-zinc-900/60 font-mono text-[11px] text-zinc-400">
                  <div className="flex justify-between">
                    <span className="text-zinc-550 header-title">Email:</span>
                    <span className="text-white truncate max-w-[180px]">{c.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-550 header-title">Celular:</span>
                    <span className="text-white">{c.phone}</span>
                  </div>
                  <div className="flex flex-col pt-1.5 mt-1.5 border-t border-zinc-900/20">
                    <span className="text-zinc-500 text-[9px] uppercase tracking-wider select-none mb-1">Observações Privadas:</span>
                    <p className="text-white not-italic font-sans text-xs bg-black p-2 rounded-lg line-clamp-2 border border-zinc-900/80">{c.observations || 'Nenhuma restrição registrada'}</p>
                  </div>
                </div>
              </div>
            ))}

            {clients.length === 0 && (
              <div className="md:col-span-3 text-center py-16 border border-dashed border-zinc-850 rounded-2xl bg-black">
                <Users className="h-10 w-10 text-zinc-500 mx-auto mb-4" />
                <p className="text-sm font-bold text-white uppercase tracking-wider">Diretório Vazio</p>
                <p className="text-xs text-zinc-500 mt-1">Registre investidores no terminal para funil comercial.</p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {isClientFormOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative"
                >
                  <button
                    onClick={() => setIsClientFormOpen(false)}
                    className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider mb-6 font-mono">
                    {editingClientId ? 'Editar Investidor' : 'Inserir Novo Cliente'}
                  </h3>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!clientFormName || !clientFormPhone) {
                        alert('Nome e Telefone são campos estruturais obrigatórios!');
                        return;
                      }
                      const payload: Client = {
                        id: editingClientId || `client-${Date.now()}`,
                        name: clientFormName,
                        email: clientFormEmail,
                        phone: clientFormPhone,
                        observations: clientFormNotes,
                        createdAt: new Date().toISOString()
                      };
                      await saveClientToFirestore(payload);
                      setIsClientFormOpen(false);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        value={clientFormName}
                        onChange={(e) => setClientFormName(e.target.value)}
                        placeholder="Nome do cliente"
                        className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none placeholder-zinc-850 border-box"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Email de Contato</label>
                      <input
                        type="email"
                        value={clientFormEmail}
                        onChange={(e) => setClientFormEmail(e.target.value)}
                        placeholder="cliente@email.com"
                        className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none placeholder-zinc-850"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">WhatsApp / Celular *</label>
                      <input
                        type="text"
                        required
                        value={clientFormPhone}
                        onChange={(e) => setClientFormPhone(e.target.value)}
                        placeholder="+55 (47) 98888-8888"
                        className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none placeholder-zinc-850"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Notas Comerciais d'Compra, Loteamento de Preferência</label>
                      <textarea
                        value={clientFormNotes}
                        onChange={(e) => setClientFormNotes(e.target.value)}
                        placeholder="Investidor busca 3 quartos na Praia Brava, entrada de até R$ 200k..."
                        className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none placeholder-zinc-850 h-24 resize-none"
                      />
                    </div>

                    <div className="pt-4 border-t border-zinc-900 flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setIsClientFormOpen(false)}
                        className="px-5 py-2.5 rounded-xl border border-zinc-850 text-zinc-400 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Descartar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-orange-500 text-black text-xs font-extrabold tracking-wider uppercase hover:bg-orange-600 transition-all cursor-pointer shadow-lg shadow-orange-500/10"
                      >
                        Gravar Investidor
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* =========================================================================
          4. LEADS AND FUNNEL MANAGEMENT
          ========================================================================= */}
      {activeTab === 'leads' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="overflow-x-auto border border-zinc-900 rounded-2xl bg-zinc-950">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-zinc-900 bg-black/60">
                  <th className="p-4 text-[10px] uppercase font-mono tracking-widest text-zinc-550">Interessado</th>
                  <th className="p-4 text-[10px] uppercase font-mono tracking-widest text-zinc-550">Lançamento de Interesse</th>
                  <th className="p-4 text-[10px] uppercase font-mono tracking-widest text-zinc-550">Data/Hora de Registro</th>
                  <th className="p-4 text-[10px] uppercase font-mono tracking-widest text-zinc-550">Responsável Vinculado</th>
                  <th className="p-4 text-[10px] uppercase font-mono tracking-widest text-zinc-550">Status Funil</th>
                  <th className="p-4 text-[10px] uppercase font-mono tracking-widest text-zinc-550 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-xs text-zinc-600 uppercase font-mono">Sem leads capturados por formulários no momento.</td>
                  </tr>
                ) : (
                  leads.map(l => (
                    <tr key={l.id} className="border-b border-zinc-900/60 hover:bg-black/30 transition-all duration-150">
                      <td className="p-4 align-top">
                        <span className="block text-xs font-bold text-white uppercase">{l.name}</span>
                        <span className="block text-[10px] font-mono text-zinc-500 mt-0.5">{l.contact}</span>
                        <p className="text-[10px] text-zinc-400 font-sans italic bg-black/40 border border-zinc-900 p-2 rounded-lg mt-2 max-w-[300px] line-clamp-2" title={l.message}>"{l.message}"</p>

                        {/* Expandable/Interactive Pre-Approval Form Details */}
                        {l.preApprovalData && (
                          <div className="mt-3.5 border border-amber-500/25 bg-amber-500/5 p-3 rounded-xl max-w-md space-y-3 text-left">
                            <div className="flex items-center justify-between border-b border-amber-500/10 pb-1.5">
                              <span className="text-[9px] uppercase font-black tracking-widest text-amber-500 flex items-center gap-1 font-mono">
                                ✦ Fita de Pré-Aprovação de Crédito
                              </span>
                              <span className="text-[8px] uppercase tracking-wider font-extrabold bg-[#e52521] text-white px-2 py-0.5 rounded-full">
                                Cadastrado
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] font-mono text-zinc-350">
                              <div>
                                <span className="text-zinc-550 uppercase block text-[8px] tracking-wider">CPF</span>
                                <span className="text-zinc-200 font-bold">{l.preApprovalData.cpf}</span>
                              </div>
                              <div>
                                <span className="text-zinc-550 uppercase block text-[8px] tracking-wider">Estado Civil</span>
                                <span className="text-zinc-200 font-bold">{l.preApprovalData.estadoCivil}</span>
                              </div>
                              <div>
                                <span className="text-zinc-550 uppercase block text-[8px] tracking-wider">Profissão</span>
                                <span className="text-zinc-200 font-bold">{l.preApprovalData.profissao}</span>
                              </div>
                              <div>
                                <span className="text-zinc-550 uppercase block text-[8px] tracking-wider">Regime Regime</span>
                                <span className="text-zinc-200 font-bold uppercase">{l.preApprovalData.regimeTrabalho}</span>
                              </div>
                              <div className="col-span-2 border-t border-zinc-900 pt-1.5 mt-0.5">
                                <span className="text-zinc-550 uppercase block text-[8px] tracking-wider">Renda Total Bruta</span>
                                <span className="text-amber-400 font-extrabold text-xs">R$ {l.preApprovalData.rendaBruta}</span>
                                <span className="text-[8px] text-zinc-500 lowercase ml-1.5">(sem abatimentos)</span>
                              </div>
                              <div>
                                <span className="text-zinc-550 uppercase block text-[8px] tracking-wider">Compõe mais Renda?</span>
                                <span className={l.preApprovalData.comporRenda ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                                  {l.preApprovalData.comporRenda ? "Sim (Renda Familiar)" : "Não"}
                                </span>
                              </div>
                              <div className="col-span-2 border-t border-zinc-900 pt-1.5">
                                <span className="text-zinc-550 uppercase block text-[8px] tracking-wider">Entrada Disponível</span>
                                <span className="text-zinc-100 font-bold text-[11px]">{l.preApprovalData.entradaDisponivel || "Não possui"}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-zinc-550 uppercase block text-[8px] tracking-wider">Parcela Mensal Disponível</span>
                                <span className="text-zinc-100 font-bold text-[11px]">{l.preApprovalData.parcelaDisponivel || "Não possui"}</span>
                              </div>
                            </div>

                            {/* Cópia Documentos para Download */}
                            <div className="border-t border-zinc-900 pt-2.5 mt-2 space-y-2">
                              <span className="text-[8px] font-mono uppercase tracking-widest text-[#203366] font-extrabold block">
                                Baixar Cópias de Auditoria:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {l.preApprovalData.rgCpfDoc ? (
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = l.preApprovalData.rgCpfDoc!.base64;
                                      link.download = `RG_CPF_${l.name.replace(/\s+/g, '_')}_${l.preApprovalData.rgCpfDoc!.name}`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="px-2.5 py-1.5 rounded bg-zinc-905 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-[10px] font-bold text-amber-500 flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95"
                                    title={`Clique para baixar: ${l.preApprovalData.rgCpfDoc.name}`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>RG/CPF</span>
                                  </button>
                                ) : (
                                  <span className="px-2 py-1 text-[8px] text-zinc-650 bg-black/40 border border-zinc-900 rounded font-mono">Sem RG/CPF</span>
                                )}

                                {l.preApprovalData.residenciaDoc ? (
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = l.preApprovalData.residenciaDoc!.base64;
                                      link.download = `RESIDENCIA_${l.name.replace(/\s+/g, '_')}_${l.preApprovalData.residenciaDoc!.name}`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="px-2.5 py-1.5 rounded bg-zinc-905 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-[10px] font-bold text-amber-500 flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95"
                                    title={`Clique para baixar: ${l.preApprovalData.residenciaDoc.name}`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Residência</span>
                                  </button>
                                ) : (
                                  <span className="px-2 py-1 text-[8px] text-zinc-650 bg-black/40 border border-zinc-900 rounded font-mono">Sem Residência</span>
                                )}

                                {l.preApprovalData.rendaDoc ? (
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = l.preApprovalData.rendaDoc!.base64;
                                      link.download = `RENDA_${l.name.replace(/\s+/g, '_')}_${l.preApprovalData.rendaDoc!.name}`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="px-2.5 py-1.5 rounded bg-zinc-905 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-[10px] font-bold text-amber-500 flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95"
                                    title={`Clique para baixar: ${l.preApprovalData.rendaDoc.name}`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Renda / IR</span>
                                  </button>
                                ) : (
                                  <span className="px-2 py-1 text-[8px] text-zinc-650 bg-black/40 border border-zinc-900 rounded font-mono">Sem Renda</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-xs font-bold text-orange-500 uppercase">
                        {l.propertyName || 'Portal VIVASC'}
                      </td>
                      <td className="p-4 text-xs text-zinc-400 font-mono">
                        {l.createdAt ? new Date(l.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                      </td>
                      <td className="p-4">
                        <select
                          value={l.brokerId || ''}
                          onChange={async (e) => {
                            const brokId = e.target.value;
                            const brok = brokers.find(b => b.id === brokId);
                            await saveLeadToFirestore({
                              ...l,
                              brokerId: brokId || undefined,
                              brokerName: brok ? brok.name : undefined
                            });
                          }}
                          className="rounded-lg bg-black text-xs text-white border border-zinc-900 p-1.5 focus:border-orange-500 outline-none max-w-[160px]"
                        >
                          <option value="">-- Não Definido --</option>
                          {brokers.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <select
                          value={l.status}
                          onChange={async (e) => {
                            const newSt = e.target.value as Lead['status'];
                            await saveLeadToFirestore({ ...l, status: newSt });
                          }}
                          className={`rounded-lg bg-black text-xs border p-1.5 font-bold focus:border-orange-500 outline-none uppercase tracking-wide cursor-pointer ${
                            l.status === 'Novo' ? 'border-amber-500/30 text-amber-500' :
                            l.status === 'Em Atendimento' ? 'border-cyan-500/30 text-cyan-400' :
                            l.status === 'Visita Agendada' ? 'border-purple-500/30 text-purple-400' :
                            'border-emerald-500/30 text-emerald-400'
                          }`}
                        >
                          <option value="Novo">Novo</option>
                          <option value="Em Atendimento">Em Atendimento</option>
                          <option value="Visita Agendada">Visita Agendada</option>
                          <option value="Finalizado">Finalizado (Ganho)</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={async () => {
                            if (confirm(`Remover lead comercial de ${l.name}?`)) {
                              await deleteLeadFromFirestore(l.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-zinc-900 border border-zinc-850 text-orange-500 hover:text-orange-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. VISITS SCHEDULER BOARD
          ========================================================================= */}
      {activeTab === 'visits' && (
        <div className="space-y-6 max-w-6xl mx-auto">
          <div className="flex justify-between items-center bg-zinc-950 p-4 border border-zinc-900 rounded-xl">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              Mostrando {visits.length} agendas técnicas de amostragem
            </span>
            <button
              onClick={() => {
                setEditingVisitId(null);
                setVisitPropId(properties[0]?.id || '');
                setVisitBrokerId(brokers[0]?.id || '');
                setVisitClientContact('');
                setVisitDate('');
                setVisitTime('');
                setVisitStatus('Agendada');
                setIsVisitFormOpen(true);
              }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 font-bold text-black border border-orange-500 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Agendar Visita
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visits.map(v => {
              const connectedBroker = brokers.find(b => b.id === v.brokerId);
              return (
                <div key={v.id} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4 hover:border-zinc-800 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                        v.status === 'Confirmada' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        v.status === 'Realizada' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        v.status === 'Cancelada' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>{v.status || 'Agendada'}</span>
                      <h4 className="text-sm font-extrabold text-white mt-2 uppercase tracking-tight truncate max-w-[200px]">{v.clientName}</h4>
                      <p className="text-[10px] font-mono text-zinc-500">{v.clientContact}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0 z-10">
                      <button
                        onClick={() => {
                          setEditingVisitId(v.id);
                          setVisitPropId(v.propertyId);
                          setVisitBrokerId(v.brokerId || '');
                          setVisitClientContact(v.clientContact);
                          setVisitDate(v.date);
                          setVisitTime(v.time);
                          setVisitStatus(v.status || 'Agendada');
                          setIsVisitFormOpen(true);
                        }}
                        className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-850 hover:bg-zinc-850 transition-all"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Excluir visita agendada de ${v.clientName}?`)) {
                            await deleteVisitFromFirestore(v.id);
                          }
                        }}
                        className="p-2 rounded-lg bg-zinc-900 text-orange-500 hover:text-orange-400 border border-zinc-850 hover:bg-orange-950/20 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-zinc-900/60 font-mono text-[11px] text-zinc-400">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Imóvel:</span>
                      <span className="text-orange-500 font-bold truncate max-w-[140px] uppercase select-all">{v.propertyName || 'Ver no banco'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Corretor:</span>
                      <span className="text-white truncate max-w-[140px]">{connectedBroker ? connectedBroker.name : 'Não Atribuído'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Data/Hora:</span>
                      <span className="text-emerald-400 font-bold">{v.date} às {v.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {visits.length === 0 && (
              <div className="md:col-span-3 text-center py-16 border border-dashed border-zinc-850 rounded-2xl bg-black animate-pulse">
                <CalendarDays className="h-10 w-10 text-zinc-500 mx-auto mb-4" />
                <p className="text-sm font-bold text-white uppercase tracking-wider">Nenhuma Visita Agendada</p>
                <p className="text-xs text-zinc-500 mt-1">Nenhum agendamento técnico de amostragem foi registrado.</p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {isVisitFormOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative"
                >
                  <button
                    onClick={() => setIsVisitFormOpen(false)}
                    className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider mb-6 font-mono select-none">
                    {editingVisitId ? 'Editar Visita Técnica' : 'Agendar Visita de Campo'}
                  </h3>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!visitPropId || !visitClientContact || !visitDate || !visitTime) {
                        alert('Preencha as informações obrigatórias para agendamento!');
                        return;
                      }
                      const activeProperty = properties.find(p => p.id === visitPropId);
                      const payload: Visit = {
                        id: editingVisitId || `visit-${Date.now()}`,
                        propertyId: visitPropId,
                        propertyName: activeProperty ? activeProperty.name : 'Lançamento VIVASC',
                        clientName: visitClientContact.split('@')[0] || 'Investidor Visitante',
                        clientContact: visitClientContact,
                        date: visitDate,
                        time: visitTime,
                        brokerId: visitBrokerId || undefined,
                        status: visitStatus,
                        createdAt: new Date().toISOString()
                      };
                      await saveVisitToFirestore(payload);
                      setIsVisitFormOpen(false);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Escolher Empreendimento *</label>
                      <select
                        value={visitPropId}
                        onChange={(e) => setVisitPropId(e.target.value)}
                        className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none"
                      >
                        {properties.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.neighborhood})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Escolher corretor responsável</label>
                      <select
                        value={visitBrokerId}
                        onChange={(e) => setVisitBrokerId(e.target.value)}
                        className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none"
                      >
                        <option value="">-- Nenhum Atribuído --</option>
                        {brokers.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">WhatsApp / Email do Cliente *</label>
                      <input
                        type="text"
                        required
                        value={visitClientContact}
                        onChange={(e) => setVisitClientContact(e.target.value)}
                        placeholder="contato@cliente.com ou +554700000000"
                        className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none placeholder-zinc-850"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Data Técnica *</label>
                        <input
                          type="date"
                          required
                          value={visitDate}
                          onChange={(e) => setVisitDate(e.target.value)}
                          className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Horário *</label>
                        <input
                          type="time"
                          required
                          value={visitTime}
                          onChange={(e) => setVisitTime(e.target.value)}
                          className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Status do Agendamento</label>
                      <select
                        value={visitStatus}
                        onChange={(e) => setVisitStatus(e.target.value as Visit['status'])}
                        className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none"
                      >
                        <option value="Pendente">Aguardando Confirmação do Proprietário</option>
                        <option value="Confirmada">Confirmada / Visita de Campo na Agenda</option>
                        <option value="Realizada">Realizada / Concluída com Feedback</option>
                        <option value="Cancelada">Cancelada / Abortada</option>
                      </select>
                    </div>

                    <div className="pt-4 border-t border-zinc-900 flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setIsVisitFormOpen(false)}
                        className="px-5 py-2.5 rounded-xl border border-zinc-850 text-zinc-400 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Descartar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-orange-500 text-black text-xs font-extrabold tracking-wider uppercase hover:bg-orange-600 transition-all cursor-pointer shadow-lg shadow-orange-500/10"
                      >
                        Gravar Agenda
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* =========================================================================
          BROKER INTERACTIVE CHAT PANEL
          ========================================================================= */}
      {activeTab === 'chat-panel' && (
        <div className="space-y-6 max-w-6xl mx-auto font-sans">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-950 p-5 border border-zinc-900 rounded-2xl gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-orange-400">Atendimento Digital</span>
              <h3 className="text-lg font-black text-white uppercase tracking-tight mt-1">Painel Interativo de Chat Leads</h3>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-black p-1 rounded-xl border border-zinc-900">
              <button
                onClick={() => setChatFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${chatFilter === 'all' ? 'bg-zinc-900 text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-400'}`}
              >
                Todas ({messages.length})
              </button>
              <button
                onClick={() => setChatFilter('new')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${chatFilter === 'new' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-zinc-500 hover:text-zinc-400'}`}
              >
                Novas ({messages.filter(m => m.status === 'Novo' || !m.status).length})
              </button>
              {loggedBroker && (
                <button
                  onClick={() => setChatFilter('my')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${chatFilter === 'my' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-500 hover:text-zinc-400'}`}
                >
                  Minhas ({messages.filter(m => m.assignedBrokerId === loggedBroker.id).length})
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
            {/* Conversations Left Rail Sidebar (12-col layout) */}
            <div className="lg:col-span-5 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col overflow-hidden max-h-[600px] overflow-y-auto">
              <div className="p-4 border-b border-zinc-900 bg-black/40">
                <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase font-mono block">Canal de Entrada em Tempo Real</span>
              </div>
              
              <div className="divide-y divide-zinc-900/60">
                {messages
                  .filter(m => {
                    if (chatFilter === 'new') return m.status === 'Novo' || !m.status;
                    if (chatFilter === 'my') return loggedBroker && m.assignedBrokerId === loggedBroker.id;
                    return true;
                  })
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(m => {
                    const isSelected = m.id === selectedMessageId;
                    const plainPhone = m.contact.replace(/\D/g, '');
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMessageId(m.id);
                          setReplyText('');
                        }}
                        className={`p-4 transition-all cursor-pointer text-left relative flex items-start gap-3.5 ${isSelected ? 'bg-zinc-900' : 'hover:bg-zinc-900/30'}`}
                      >
                        {/* Status Dots */}
                        <span className={`absolute top-4 right-4 w-2 h-2 rounded-full ${m.status === 'Finalizado' ? 'bg-emerald-500' : m.status === 'Atendendo' ? 'bg-orange-500' : 'bg-blue-500 animate-pulse'}`}></span>
                        
                        <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-xs font-extrabold text-orange-400 uppercase tracking-tight">
                          {m.name.slice(0, 2)}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-white uppercase tracking-tight">{m.name}</span>
                            <span className="text-[9px] font-mono text-zinc-500">| {new Date(m.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                          
                          <p className="text-[11px] text-zinc-400 truncate leading-relaxed">{m.message}</p>
                          
                          <div className="flex gap-2 flex-wrap pt-0.5 items-center">
                            <span className="inline-flex px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-[9px] text-zinc-400 uppercase font-mono">{m.propertyId || 'Imóvel Geral'}</span>
                            {m.assignedBrokerName && (
                              <span className="inline-flex px-1.5 bg-orange-500/10 border border-orange-500/20 text-[9px] text-orange-400 rounded">Log: {m.assignedBrokerName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {messages.length === 0 && (
                  <div className="text-center py-20 px-4 text-zinc-500 space-y-3">
                    <MessageSquare className="w-8 h-8 mx-auto text-zinc-700 block animate-pulse" />
                    <p className="text-xs font-bold text-zinc-400 uppercase font-mono">Nenhum atendimento listado</p>
                    <p className="text-[10px] text-zinc-600">Aguarde a entrada de novas propostas pelo chat flutuante.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Conversation Detail Box Area (12-col layout) */}
            <div className="lg:col-span-7 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between overflow-hidden min-h-[500px]">
              {selectedMessageId ? (() => {
                const selectedMsg = messages.find(m => m.id === selectedMessageId);
                if (!selectedMsg) return null;
                const plainPhone = selectedMsg.contact.replace(/\D/g, '');
                const waBaseUrl = `https://wa.me/${plainPhone}`;
                return (
                  <>
                    {/* Selected Message Header info bar */}
                    <div className="p-4 border-b border-zinc-900 bg-black/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">{selectedMsg.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${selectedMsg.status === 'Finalizado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : selectedMsg.status === 'Atendendo' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                            {selectedMsg.status || 'Novo'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400 mt-1">Contato: {selectedMsg.contact}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Visando: {selectedMsg.propertyId}</p>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {/* Assignment picker */}
                        {selectedMsg.assignedBrokerId !== loggedBroker?.id && (
                          <button
                            onClick={async () => {
                              const updated = {
                                ...selectedMsg,
                                assignedBrokerId: loggedBroker?.id || 'admin',
                                assignedBrokerName: loggedBroker?.chatName || loggedBroker?.name || 'Administrador',
                                status: 'Atendendo' as const
                              };
                              await saveMessageToFirestore(updated);
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Assumir Conversa
                          </button>
                        )}

                        {/* Status selection */}
                        <select
                          value={selectedMsg.status || 'Novo'}
                          onChange={async (e) => {
                            const updated = {
                              ...selectedMsg,
                              status: e.target.value as any
                            };
                            await saveMessageToFirestore(updated);
                          }}
                          className="bg-black border border-zinc-900 rounded-lg text-[10px] font-sans font-bold uppercase py-1.5 px-2.5 text-zinc-300 outline-none focus:border-orange-500"
                        >
                          <option value="Novo">Status: Novo</option>
                          <option value="Atendendo">Status: Em Atendimento</option>
                          <option value="Finalizado">Status: Finalizado</option>
                        </select>

                        {userRole === 'admin' && (
                          <button
                            onClick={async () => {
                              if (confirm('Tem certeza que deseja apagar permanentemente esse log de chat?')) {
                                await deleteMessageFromFirestore(selectedMsg.id);
                                setSelectedMessageId(null);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-orange-950/20 text-orange-500 border border-zinc-850 hover:border-orange-500/20 cursor-pointer"
                            title="Deletar Conversa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Chat Messages Log Section */}
                    <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[350px] bg-black/20 flex flex-col">
                      {/* Original Customer Message (Left side) */}
                      <div className="text-left max-w-[85%] self-start space-y-1 bg-zinc-900 border border-zinc-850 p-4 rounded-2xl rounded-tl-none">
                        <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest block font-mono">Atendimento Iniciado</span>
                        <p className="text-xs text-white leading-relaxed font-sans">{selectedMsg.message}</p>
                        <span className="text-[8px] font-mono text-zinc-500 block text-right">
                          {new Date(selectedMsg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Logged replies */}
                      {selectedMsg.replies?.map((rep) => (
                        <div
                          key={rep.id}
                          className={`max-w-[85%] rounded-2xl p-4 text-left space-y-1 ${
                            rep.isBroker 
                              ? 'self-end bg-orange-500/10 border border-orange-500/20 rounded-tr-none text-right' 
                              : 'self-start bg-zinc-900 border border-zinc-850 rounded-tl-none'
                          }`}
                        >
                          <span className={`text-[8px] font-bold uppercase tracking-widest block font-mono ${rep.isBroker ? 'text-orange-400' : 'text-zinc-400'}`}>
                            {rep.isBroker ? `Atendente (${rep.author})` : 'Prospect'}
                          </span>
                          <p className="text-xs text-white leading-relaxed font-sans">{rep.content}</p>
                          <span className="text-[8px] font-mono text-zinc-500 block">
                            {new Date(rep.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Chat footer input response text area */}
                    <div className="p-4 border-t border-zinc-900 bg-black/40 space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escreva sua resposta de acompanhamento ou proposta..."
                        rows={2}
                        className="w-full rounded-xl bg-black px-4 py-3 text-xs text-zinc-200 border border-zinc-900 focus:border-orange-500 outline-none placeholder-zinc-800 resize-none font-sans"
                      />
                      
                      <div className="flex flex-wrap justify-between items-center gap-3">
                        <span className="text-[9px] text-zinc-500 font-mono">Atendente logado: <strong className="text-orange-400">{loggedBroker?.chatName || loggedBroker?.name || 'Administrador'}</strong></span>
                        
                        <div className="flex items-center gap-2">
                          {/* Internal log button */}
                          <button
                            type="button"
                            onClick={async () => {
                              if (!replyText.trim()) return;
                              const updatedReplies = [...(selectedMsg.replies || []), {
                                id: `rep_${Date.now()}`,
                                author: loggedBroker?.chatName || loggedBroker?.name || 'Administrador',
                                content: replyText.trim(),
                                createdAt: new Date().toISOString(),
                                isBroker: true
                              }];
                              const updated = {
                                ...selectedMsg,
                                replies: updatedReplies,
                                status: 'Atendendo' as const
                              };
                              await saveMessageToFirestore(updated);
                              setReplyText('');
                            }}
                            className="px-4 py-2 text-[10px] font-bold tracking-wider uppercase bg-zinc-900 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 cursor-pointer transition-all active:scale-95"
                          >
                            Salvar Histórico
                          </button>

                          {/* WhatsApp forward response button */}
                          <button
                            type="button"
                            onClick={async () => {
                              if (!replyText.trim()) return;
                              const updatedReplies = [...(selectedMsg.replies || []), {
                                id: `rep_${Date.now()}`,
                                author: loggedBroker?.chatName || loggedBroker?.name || 'Administrador',
                                content: replyText.trim(),
                                createdAt: new Date().toISOString(),
                                isBroker: true
                              }];
                              const updated = {
                                ...selectedMsg,
                                replies: updatedReplies,
                                status: 'Atendendo' as const
                              };
                              await saveMessageToFirestore(updated);
                              
                              const waUrl = `https://wa.me/${plainPhone}?text=${encodeURIComponent(replyText.trim())}`;
                              window.open(waUrl, '_blank', 'noreferrer,noopener');
                              setReplyText('');
                            }}
                            className="px-4 py-2 text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Responder via WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })() : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 select-none">
                  <MessageSquare className="w-12 h-12 text-zinc-800 block mb-3 animate-pulse" />
                  <p className="text-xs font-bold text-zinc-400 uppercase font-mono">Nenhuma conversa selecionada</p>
                  <p className="text-[10px] text-zinc-600 mt-1 max-w-sm leading-relaxed">Selecione algum lead ou chat flutuante na lista lateral para conversar em tempo real, mudar o status de atendimento e logar históricos.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BROKER PERSONAL PROFILE CONFIGURATION PANEL
          ========================================================================= */}
      {activeTab === 'broker-profile' && loggedBroker && (
        <div className="max-w-xl mx-auto space-y-6 font-sans">
          <div className="bg-zinc-950 p-6 border border-zinc-900 rounded-2xl relative overflow-hidden flex flex-col md:flex-row gap-6">
            <div className="space-y-4 flex-1">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#FF9D00]">Personalização do Atendimento</span>
                <h3 className="text-lg font-black text-white uppercase tracking-tight mt-1">Configurar Meu Perfil do Chat</h3>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-1">Aqui você pode personalizar a sua foto e o nome que as pessoas verão no balão de bate-papo no rodapé do portal.</p>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4 pt-3 border-t border-zinc-900">
                <div>
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Seu E-mail (Identidade Única)</label>
                  <input
                    type="email"
                    disabled
                    value={loggedBroker.email}
                    className="w-full rounded-xl bg-zinc-900/50 cursor-not-allowed px-4 py-2.5 text-xs text-zinc-500 border border-zinc-850 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Seu Nome Preferencial do Chat</label>
                  <input
                    type="text"
                    required
                    value={brokerChatName}
                    onChange={(e) => setBrokerChatName(e.target.value)}
                    placeholder="Amanda Plantão VIVASC"
                    className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none"
                  />
                  <span className="text-[9px] text-zinc-500 mt-1 block">Escolha um apelido profissional ou primeiro nome + sobrenome para seu botão de contato rápido!</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Sua Foto de Perfil no Chat URL</label>
                  <input
                    type="url"
                    required
                    value={brokerChatPhotoUrl}
                    onChange={(e) => setBrokerChatPhotoUrl(e.target.value)}
                    placeholder="Link HTTPS para sua imagem de perfil"
                    className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none"
                  />
                  <span className="text-[9px] text-zinc-500 mt-1 block">Coloque um link público válido de imagem para carregar seu rosto no botão do chat.</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Sua Senha de Login Privada</label>
                  <input
                    type="password"
                    required
                    value={brokerPassword}
                    onChange={(e) => setBrokerPassword(e.target.value)}
                    placeholder="Mínimo de 6 dígitos"
                    className="w-full rounded-xl bg-black px-4 py-2.5 text-xs text-white border border-zinc-900 focus:border-orange-500 outline-none"
                  />
                  <span className="text-[9px] text-zinc-500 mt-1 block">A sua senha atual cadastrada no sistema. Caso altere, clique para salvar.</span>
                </div>
              </div>

              {/* Save trigger */}
              <div className="pt-4 border-t border-zinc-900 flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    if (!brokerChatName.trim()) {
                      alert('Digite o seu nome de chat preferido!');
                      return;
                    }
                    try {
                      const updated: Broker = {
                        ...loggedBroker,
                        chatName: brokerChatName.trim(),
                        chatPhotoUrl: brokerChatPhotoUrl.trim() || EXECUTIVE_AVATAR,
                        password: brokerPassword.trim() || '123456'
                      };
                      await saveBrokerToFirestore(updated);
                      setLoggedBroker(updated);
                      alert('Perfil do corretor atualizado com sucesso no banco de dados!');
                    } catch (err) {
                      console.error("Erro saving profile:", err);
                      alert('Falha ao gravar alterações no perfil.');
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black text-xs font-extrabold tracking-wider uppercase transition-all shadow-lg shadow-orange-500/10 cursor-pointer"
                >
                  Salvar Alterações do Chat
                </button>
              </div>
            </div>

            {/* Live Visual Preview of Chat Badge */}
            <div className="w-full md:w-48 shrink-0 flex flex-col items-center justify-center p-4 bg-zinc-900/50 rounded-2xl border border-zinc-900 space-y-4 select-none">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono">Prévia em Tempo Real</span>
              
              <div className="relative">
                <img
                  src={brokerChatPhotoUrl || EXECUTIVE_AVATAR}
                  alt={brokerChatName}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full border-2 border-orange-500 object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if url is wrong/empty so layout stays elegant
                    (e.target as HTMLImageElement).src = EXECUTIVE_AVATAR;
                  }}
                />
                <span className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-emerald-500 border-2 border-zinc-950 rounded-full"></span>
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs font-extrabold text-white uppercase tracking-wider block truncate max-w-[130px]">{brokerChatName || loggedBroker.name}</p>
                <p className="text-[10px] font-medium text-zinc-500 block">Corretor de Plantão</p>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[8px] font-bold font-mono text-emerald-400 uppercase mt-2">● Online</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. MESSAGES CENTER INBOX
          ========================================================================= */}
      {activeTab === 'messages' && (
        <div className="space-y-6 max-w-6xl mx-auto select-none">
          <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              CAIXA DE ENTRADA CLIENT CONVERSATIONS - {messages.length} MENSAGENS DENTRO DA COLEÇÃO
            </span>
          </div>

          <div className="space-y-4">
            {messages.map(m => {
              const pairedProperty = properties.find(p => p.id === m.propertyId);
              return (
                <div key={m.id} className="bg-zinc-950 p-5 border border-zinc-900 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-zinc-800 transition-all">
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                      <span className="text-xs font-bold text-white uppercase">{m.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500">| Contato: {m.contact}</span>
                    </div>
                    {pairedProperty && (
                      <span className="inline-flex px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-[9px] font-mono text-orange-400 uppercase font-semibold">Suporte: {pairedProperty.name}</span>
                    )}
                    <blockquote className="text-xs text-zinc-300 leading-relaxed font-serif pt-1 bg-black/40 p-3.5 border border-zinc-900 rounded-lg">
                      "{m.message}"
                    </blockquote>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                    </span>
                    <button
                      onClick={async () => {
                        if (confirm('Tem certeza que deseja apagar permanentemente essa mensagem da base de dados?')) {
                          await deleteMessageFromFirestore(m.id);
                        }
                      }}
                      className="p-2 bg-zinc-900 text-orange-500 hover:text-orange-400 border border-zinc-850 hover:bg-orange-950/20 rounded-xl transition-all"
                      title="Apagar no Firestore"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {messages.length === 0 && (
              <div className="text-center py-16 border border-dashed border-zinc-850 rounded-2xl bg-black">
                <MessageSquare className="h-10 w-10 text-zinc-500 mx-auto mb-4" />
                <p className="text-sm font-bold text-white uppercase tracking-wider">Histórico Limpo</p>
                <p className="text-xs text-zinc-500 mt-1">Nenhum formulário web recebido.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BRAND SEO PORTAL ACTIVE CONTROLS PANEL */}
      {activeTab === 'seo' && (
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Header Card */}
          <div className="bg-zinc-950 p-6 border border-zinc-900 rounded-2xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none rounded-tr-2xl"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-mono text-orange-500 font-bold mb-1">
                  ✦ Inteligência de Busca Imobiliária
                </span>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
                  Painel de SEO Técnico & Prompt Integrado
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                  Ative o robô de busca para o mercado imobiliário em Balneário Camboriú, Praia Brava e Itajaí. Otimização profunda com foco em indexação rápida e autoridade EEAT.
                </p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(SEO_PROMPT_TEXT);
                  setCopiedPrompt(true);
                  setTimeout(() => setCopiedPrompt(false), 2000);
                }}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 font-extrabold text-black px-4.5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-orange-500/10 shrink-0 select-none active:scale-95"
              >
                {copiedPrompt ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedPrompt ? 'Copiado!' : 'Copiar Prompt SEO Técnico'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Expandable Directives (15 items) - Span 5 */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-1">
                  As 15 Diretrizes SEO Incorporadas
                </h3>
                <p className="text-[10px] text-zinc-500">
                  Cada detalhe do portal segue rigorosamente os padrões de indexação do algoritmo do Google:
                </p>
              </div>

              <div className="space-y-2">
                {SEO_DIRECTIVES.map((dir, idx) => {
                  const isExpanded = activeSeoAccordion === idx;
                  return (
                    <div 
                      key={idx} 
                      className="border border-zinc-900 rounded-xl bg-zinc-950 overflow-hidden transition-all duration-300"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveSeoAccordion(isExpanded ? null : idx)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 text-white hover:bg-zinc-900/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[11px] font-mono text-orange-500 font-bold bg-orange-500/10 h-5 w-5 rounded flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-zinc-200 truncate uppercase tracking-wider">
                            {dir.title.replace(/^\d+\.\s*/, '')}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#FF9D00] font-mono shrink-0">
                          {isExpanded ? 'RECOLHER ▲' : 'DETALHES ▼'}
                        </span>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-zinc-900 bg-black/40 p-4 text-xs space-y-3"
                          >
                            <div className="space-y-1">
                              <span className="block text-[9px] font-bold uppercase font-mono text-zinc-500">Diretriz Técnica</span>
                              <p className="leading-relaxed text-zinc-300 text-[11px] font-sans">{dir.rules}</p>
                            </div>
                            {dir.examples && (
                              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-900/80 space-y-1">
                                <span className="block text-[9px] font-bold uppercase font-mono text-zinc-500">Esquema Prático</span>
                                <p className="font-mono text-[10px] text-zinc-400 whitespace-pre-line leading-relaxed">
                                  {dir.examples}
                                </p>
                              </div>
                            )}
                            <div className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                              ✓ PADRÃO ATIVO NO PORTAL
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Simulated Google / Social Snippets - Span 7 */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-zinc-950 p-5 sm:p-6 border border-zinc-900 rounded-2xl space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                    Simulador & Validador de Resultados Google
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Gere em tempo real os códigos de metatags descritivos e o JSON-LD que o robô do Google lê para criar as listagens with destaque orgânico nos rankings de buscas.
                  </p>
                </div>

                {/* Combobox selected property */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-[#FF9D00] uppercase font-mono block">
                    Escolha um Empreendimento cadastrado:
                  </label>
                  {properties.length === 0 ? (
                    <div className="text-xs text-orange-400 font-mono bg-orange-500/5 border border-orange-500/10 p-4 rounded-xl leading-relaxed">
                      Nenhum projeto encontrado. Retorne para a aba "Empreendimentos" para criar seu primeiro projeto imobiliário no banco de dados.
                    </div>
                  ) : (
                    <select
                      value={selectedSeoPropertyId}
                      onChange={(e) => setSelectedSeoPropertyId(e.target.value)}
                      className="w-full bg-black rounded-xl border border-zinc-900 px-4 py-3 text-xs text-zinc-200 focus:border-orange-500/50 outline-none font-sans cursor-pointer"
                    >
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {p.neighborhood} ({p.region})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Display outputs if property found */}
                {(() => {
                  const prop = properties.find((p) => p.id === selectedSeoPropertyId);
                  if (!prop) return null;

                  const formatBRL = (val: number | null) => {
                    if (val === null || isNaN(val)) return 'Sob Consulta';
                    return new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0
                    }).format(val);
                  };

                  // Structured fields based on local variables
                  const simulatedTitle = `${prop.name} à Venda em ${prop.neighborhood} | ${prop.region} SC - Lançamento`;
                  const simulatedDescription = `Confira Lançamento ${prop.name} em ${prop.neighborhood} (${prop.region} SC) de Alto Padrão. Entrada de ${formatBRL(prop.downpayment)}, agende visita e conheça os detalhes.`.slice(0, 155);
                  
                  const slug = prop.name.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9 ]/g, '')
                    .replace(/\s+/g, '-');
                  
                  const neighborhoodSlug = prop.neighborhood.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9 ]/g, '')
                    .replace(/\s+/g, '-');

                  const simulatedSlugUrl = `/apartamento-venda-${slug}-${neighborhoodSlug}`;
                  const simulatedKeywords = [
                    `apartamento em ${prop.region.toLowerCase()}`,
                    `imovel de luxo ${prop.region.toLowerCase()}`,
                    `apartamento alto padrao ${prop.neighborhood.toLowerCase()}`,
                    `investir em ${prop.region.toLowerCase()}`,
                    `${prop.name.toLowerCase()} ${prop.neighborhood.toLowerCase()}`,
                    `lancamentos ${prop.region.toLowerCase()}`
                  ];

                  // Construct dynamic JSON-LD according to Schema.org standards
                  const simulatedSchema = {
                    "@context": "https://schema.org",
                    "@type": "Product",
                    "name": prop.name,
                    "image": (prop.images && prop.images[0]) || "https://i.postimg.cc/mrCcfw9n/MODELO-2.png",
                    "description": simulatedDescription,
                    "brand": {
                      "@type": "Brand",
                      "name": settings?.brandName || "VIVA SC"
                    },
                    "offers": {
                      "@type": "Offer",
                      "price": prop.price || 1500000,
                      "priceCurrency": "BRL",
                      "availability": "https://schema.org/InStock",
                      "url": `https://meuprimeiroimovelsc.com.br${simulatedSlugUrl}`
                    }
                  };

                  const schemaText = JSON.stringify(simulatedSchema, null, 2);

                  return (
                    <div className="space-y-6 pt-4 border-t border-zinc-900 animate-fade-in text-left">
                      
                      {/* Google Preview Snippet */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono">
                            ✦ Prévia de Indexação Google (SERP)
                          </span>
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            RICH SNIPPET ATIVO
                          </span>
                        </div>
                        <div className="bg-[#17181c] p-4 rounded-xl border border-zinc-850 space-y-1">
                          <span className="text-zinc-400 text-xs flex items-center gap-1">
                            https://portal.vivasc.com.br <span className="text-zinc-500 font-mono text-[10px]">{simulatedSlugUrl}</span>
                          </span>
                          <a href="#" onClick={(e) => e.preventDefault()} className="text-[#8ab4f8] hover:underline hover:text-[#c5d3f8] text-[15px] font-medium leading-snug block transition-colors mt-0.5">
                            {simulatedTitle}
                          </a>
                          <p className="text-[#bdc1c6] text-xs leading-relaxed">
                            <span className="text-[#9aa0a6]">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} — </span>
                            {simulatedDescription}
                          </p>
                        </div>
                      </div>

                      {/* WhatsApp Share Snippet */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                          ✦ Prévia do Link no WhatsApp / Instagram
                        </span>
                        <div className="bg-[#0c1317] rounded-xl border border-zinc-805 overflow-hidden flex flex-col sm:flex-row items-stretch">
                          <div className="w-full sm:w-1/4 h-24 sm:h-auto relative shrink-0 bg-zinc-900">
                            <img
                              src={(prop.images && prop.images[0]) || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80"}
                              alt="Listing cover"
                              className="absolute inset-0 w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="p-3.5 flex flex-col justify-center text-left space-y-0.5 min-w-0">
                            <span className="text-[9px] font-mono text-emerald-500 font-medium">portal.vivasc.com.br</span>
                            <span className="text-xs font-bold text-zinc-100 uppercase tracking-wide truncate">{simulatedTitle}</span>
                            <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{simulatedDescription}</p>
                          </div>
                        </div>
                      </div>

                      {/* SEO technical grid */}
                      <div className="bg-black/40 rounded-xl border border-zinc-900 overflow-hidden text-xs">
                        <div className="grid grid-cols-3 border-b border-zinc-900 bg-zinc-950 p-2.5 font-mono text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                          <div>Sinalizador SEO</div>
                          <div className="col-span-2">Texto Calculado Conforme Diretrizes</div>
                        </div>

                        {/* Line 1: Meta Title */}
                        <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2 border-b border-zinc-900">
                          <div className="font-mono text-[10px] font-semibold text-zinc-400">
                            META TITLE <span className="block text-[8px] text-zinc-500">({simulatedTitle.length} / 60 carac.)</span>
                          </div>
                          <div className="col-span-2 font-mono text-[10.5px] text-zinc-200">
                            {simulatedTitle}
                          </div>
                        </div>

                        {/* Line 2: Meta description */}
                        <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2 border-b border-zinc-900">
                          <div className="font-mono text-[10px] font-semibold text-zinc-400">
                            META DESCRIPTION <span className="block text-[8px] text-zinc-500">({simulatedDescription.length} / 160 carac.)</span>
                          </div>
                          <div className="col-span-2 text-zinc-300 leading-normal">
                            {simulatedDescription}
                          </div>
                        </div>

                        {/* Line 3: Headings structures */}
                        <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2 border-b border-zinc-900">
                          <div className="font-mono text-[10px] font-semibold text-zinc-400">ESTRUTURA DE HEADINGS</div>
                          <div className="col-span-2 space-y-1">
                            <div className="text-[10.5px] text-zinc-400 mt-1"><strong className="text-orange-500 font-mono text-[9px] border border-orange-500/25 px-1 rounded mr-1">H1</strong> {prop.name} à Venda em {prop.neighborhood}</div>
                            <div className="text-[10.5px] text-zinc-400"><strong className="text-zinc-500 font-mono text-[9px] border border-zinc-800 px-1 rounded mr-1">H2</strong> Características e Facilidades do {prop.name}</div>
                            <div className="text-[10.5px] text-zinc-400"><strong className="text-zinc-500 font-mono text-[9px] border border-zinc-800 px-1 rounded mr-1">H2</strong> Localização Exclusiva no Bairro {prop.neighborhood} ({prop.region})</div>
                            <div className="text-[10.5px] text-zinc-400"><strong className="text-zinc-500 font-mono text-[9px] border border-zinc-800 px-1 rounded mr-1">H2</strong> Condição de Pagamento Especial - Entrada de {formatBRL(prop.downpayment)}</div>
                          </div>
                        </div>

                        {/* Line 4: Primary & Secondary Keywords */}
                        <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="font-mono text-[10px] font-semibold text-zinc-400">PALAVRAS-CHAVE EXCLUSIVAS</div>
                          <div className="col-span-2 flex flex-wrap gap-1">
                            {simulatedKeywords.map((kw, kIdx) => (
                              <span key={kIdx} className="bg-zinc-950 border border-zinc-900 rounded-lg px-2 py-0.5 text-[9.5px] font-mono text-zinc-400">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Schema Markup segment */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                            ✦ Script JSON-LD Gerado para Rich Snippets
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(schemaText);
                              setCopiedSchemaId(prop.id);
                              setTimeout(() => setCopiedSchemaId(null), 2000);
                            }}
                            className="font-mono text-[9px] font-bold text-[#FF9D00] uppercase cursor-pointer flex items-center gap-1 border border-[#FF9D00]/20 px-2 py-0.5 rounded bg-[#FF9D00]/5 hover:bg-[#FF9D00]/10 truncate"
                          >
                            {copiedSchemaId === prop.id ? 'COPIADO!' : 'COPIAR JSON-LD'}
                          </button>
                        </div>
                        <pre className="p-4 rounded-xl border border-zinc-900 bg-black text-orange-500/90 font-mono text-[10px] overflow-x-auto max-h-[160px] leading-relaxed select-all">
                          {schemaText}
                        </pre>
                      </div>

                    </div>
                  );
                })()}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* RENDER DYNAMIC SLIDE-CAROUSEL PROPERTY FORM MODAL */}
      <AnimatePresence>
        {isPropertyFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPropertyFormOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto"
            >
              {/* Corner Close button */}
              <button
                onClick={() => setIsPropertyFormOpen(false)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-6 pb-2 border-b border-zinc-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white uppercase tracking-tight">
                    {editingPropertyId ? 'Editar Detalhes do Empreendimento' : 'Cadastrar Novo Lançamento'}
                  </h2>
                  <p className="text-xs text-zinc-400">Insira valores precisos e metragens para o buscador geral.</p>
                </div>
              </div>

              <form onSubmit={onSubmitProperty} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Empreendimento name */}
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Nome de Vendas do Empreendimento *</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                      placeholder="Ex: Nexus Future Tower"
                      value={propName}
                      onChange={(e) => setPropName(e.target.value)}
                    />
                  </div>

                  {/* Status do Imovel */}
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Status da Obra *</label>
                    <select
                      className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2.5 text-sm text-white focus:border-orange-500 outline-none"
                      value={propStatus}
                      onChange={(e) => setPropStatus(e.target.value as Property['status'])}
                    >
                      <option value="Lançamento">🚀 Lançamento</option>
                      <option value="Em construção">🏗️ Em construção</option>
                      <option value="Pronto">🔑 Pronto para Morar</option>
                      <option value="Pré-lançamento">🕒 Pré-lançamento</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Delivery date */}
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5 font-bold">Entrega Prevista</label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                      placeholder="Ex: Mar/26 ou Pronto"
                      value={propDelivery}
                      onChange={(e) => setPropDelivery(e.target.value)}
                    />
                  </div>

                  {/* Project Type */}
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Tipo do Empreendimento</label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                      placeholder="Ex: Apartamento, Cobertura, Studio"
                      value={propType}
                      onChange={(e) => setPropType(e.target.value)}
                    />
                  </div>

                  {/* Bairro */}
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Bairro *</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                      placeholder="Ex: Meia Praia"
                      value={propNeighborhood}
                      onChange={(e) => setPropNeighborhood(e.target.value)}
                    />
                  </div>

                  {/* Cidade / Região */}
                  <div>
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Cidade ou Região *</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                      placeholder="Ex: Itapema, São Paulo"
                      value={propRegion}
                      onChange={(e) => setPropRegion(e.target.value)}
                    />
                  </div>
                </div>

                {/* Complete Address */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Endereço Completo *</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2.5 text-sm text-white focus:border-orange-500 outline-none"
                    placeholder="Ex: Av. Beira Mar, 2100 - Itapema - SC"
                    value={propAddress}
                    onChange={(e) => setPropAddress(e.target.value)}
                  />
                </div>

                {/* Marca MCMV */}
                <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="pr-4">
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1">PROGRAMA MINHA CASA MINHA VIDA (MCMV)</label>
                      <span className="text-xs text-zinc-500">Marque para exibir o selo "Minha Casa Minha Vida" no topo do card do imóvel.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={propIsMcmv}
                        onChange={(e) => setPropIsMcmv(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-none after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  {propIsMcmv && (
                    <div className="pt-3 border-t border-zinc-800 space-y-2">
                      <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">Marca / Selo MCMV Personalizado (Opcional)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                          placeholder="Link da imagem ou faça upload ao lado..."
                          value={propMcmvLogoUrl}
                          onChange={(e) => setPropMcmvLogoUrl(e.target.value)}
                        />
                        <label className="bg-zinc-805 hover:bg-zinc-700 text-zinc-300 text-xs px-3.5 py-2.5 rounded-lg font-bold font-mono tracking-wide cursor-pointer transition-colors border border-zinc-700/50 shrink-0 select-none">
                          Selecionar Arquivo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                await handleSingleImageUpload(file, 'empreendimentos/mcmv', setPropMcmvLogoUrl);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <span className="text-[11px] text-zinc-500 block">Deixe vazio para usar a marca/logo padrão super bonita e colorida do Minha Casa Minha Vida.</span>
                      {propMcmvLogoUrl && (
                        <div className="relative inline-block mt-1">
                          <img src={propMcmvLogoUrl} alt="Logo MCMV" className="h-10 w-auto object-contain rounded border border-zinc-800 bg-white/5 p-1" />
                          <button
                            type="button"
                            onClick={() => setPropMcmvLogoUrl('')}
                            className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-red-700 shadow-lg"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* technical metrics details */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-black/30 border border-zinc-900 rounded-xl p-4">
                  {/* Bedrooms */}
                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1">Dormitórios (Ex: 2 e 3 Qts)</label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                      value={propBedrooms}
                      onChange={(e) => setPropBedrooms(e.target.value)}
                      placeholder="Ex: 2, 3 ou 2 e 3 Qts"
                    />
                  </div>

                  {/* Suites */}
                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1">Suítes (Deixe vazio p/ ocultar)</label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                      value={propSuites}
                      onChange={(e) => setPropSuites(e.target.value)}
                      placeholder="Ex: 1, 2 ou deixe vazio"
                    />
                  </div>

                  {/* Bathrooms */}
                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1">Banheiros (Ex: 1 ou 2)</label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                      value={propBathrooms}
                      onChange={(e) => setPropBathrooms(e.target.value)}
                      placeholder="Ex: 1, 2"
                    />
                  </div>

                  {/* Area */}
                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1">Área Privativa (Ex: 80 a 120)</label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                      value={propArea}
                      onChange={(e) => setPropArea(e.target.value)}
                      placeholder="Ex: 80, 120 ou 80 a 120"
                    />
                  </div>

                  {/* Vagas */}
                  <div className="col-span-2 lg:col-span-1">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1">Vagas de Garagem (Ex: 1 e 2)</label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                      value={propParking}
                      onChange={(e) => setPropParking(e.target.value)}
                      placeholder="Ex: 1, 2 ou 1 e 2 vgs"
                    />
                  </div>
                </div>

                {/* Condições e Fluxo de Pagamento Totalmente Automatizado */}
                <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl shadow-black/25">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-500 font-mono">
                      💰 Fluxo Integrado de Pagamento & Financiamento
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 font-sans">
                      Informe o valor de lista e os percentuais/prazos abaixo. O sistema calculará todas as parcelas de forma lógica e automática em tempo real.
                    </p>
                  </div>

                  {/* Valor de Lista Principal */}
                  <div className="bg-black/40 border border-zinc-900 rounded-xl p-4">
                    <span className="text-[10px] font-mono tracking-wider font-extrabold text-orange-500 block mb-1 text-center uppercase">
                      VALOR DE LISTA / PREÇO INICIAL (R$) *
                    </span>
                    <input
                      type="text"
                      className="w-full text-center rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-3 text-lg font-bold text-white focus:border-orange-500 outline-none font-mono"
                      value={propPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPropPrice(isNaN(Number(val)) || val === '' ? val : Number(val));
                      }}
                    />
                    <div className="text-center font-bold text-sm text-zinc-400 mt-1.5 font-mono">
                      {typeof propPrice === 'number' ? formatBRL(propPrice) : propPrice}
                    </div>
                  </div>

                  {/* Detalhes de Entrada e Mensais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    
                    {/* ENTRADA CARD */}
                    <div className="bg-black/30 border border-zinc-850/60 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-[10px] font-mono tracking-wider font-bold text-zinc-400 uppercase">
                          1️⃣ Entrada
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-14 rounded bg-zinc-900 border border-zinc-800 px-1.5 py-1 text-xs text-center text-white font-mono font-bold focus:border-orange-500 outline-none"
                              value={propDownpaymentPct}
                              onChange={(e) => setPropDownpaymentPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                            />
                            <span className="text-xs text-zinc-500 font-mono">%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              className="w-16 rounded bg-zinc-900 border border-zinc-800 px-1.5 py-1 text-xs text-center text-white font-mono focus:border-orange-500 outline-none"
                              placeholder="Parcelas"
                              value={propDownpaymentInstallmentsCount}
                              onChange={(e) => setPropDownpaymentInstallmentsCount(Math.max(1, Number(e.target.value)))}
                            />
                            <span className="text-[10px] text-zinc-500 font-sans">vezes</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase block mb-1 font-mono">Valor da Entrada (R$)</label>
                        <input
                          type="number"
                          className="w-full rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white font-mono"
                          value={propDownpayment}
                          onChange={(e) => setPropDownpayment(Number(e.target.value))}
                        />
                        <span className="text-[10px] text-zinc-500 mt-1 block font-mono text-right">
                          {formatBRL(propDownpayment)}
                          {propDownpaymentInstallmentsCount > 1 && ` (ou ${propDownpaymentInstallmentsCount}x de ${formatBRL(Math.round(propDownpayment / propDownpaymentInstallmentsCount))})`}
                        </span>
                      </div>
                    </div>

                    {/* MENSAIS CARD */}
                    <div className="bg-black/30 border border-zinc-850/60 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-[10px] font-mono tracking-wider font-bold text-zinc-400 uppercase">
                          2️⃣ Mensais
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-14 rounded bg-zinc-900 border border-zinc-800 px-1.5 py-1 text-xs text-center text-white font-mono font-bold focus:border-orange-500 outline-none"
                              value={propInstallmentsPct}
                              onChange={(e) => setPropInstallmentsPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                            />
                            <span className="text-xs text-zinc-500 font-mono">%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              className="w-16 rounded bg-zinc-900 border border-zinc-800 px-1.5 py-1 text-xs text-center text-white font-mono focus:border-orange-500 outline-none"
                              placeholder="Parcelas"
                              value={propInstallmentsCount}
                              onChange={(e) => setPropInstallmentsCount(Math.max(1, Number(e.target.value)))}
                            />
                            <span className="text-[10px] text-zinc-500 font-sans">meses</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase block mb-1 font-mono">Valor Unitário das Parcelas (R$)</label>
                        <input
                          type="number"
                          className="w-full rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white font-mono"
                          value={propInstallments}
                          onChange={(e) => setPropInstallments(Number(e.target.value))}
                        />
                        <span className="text-[10px] text-zinc-500 mt-1 block font-mono text-right">{propInstallmentsCount}x de {formatBRL(propInstallments)}</span>
                      </div>
                    </div>

                    {/* REFORÇOS / BALÕES CARD */}
                    <div className="bg-black/30 border border-zinc-850/60 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-[10px] font-mono tracking-wider font-bold text-zinc-400 uppercase">
                          3️⃣ Reforços / Balões
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-14 rounded bg-zinc-900 border border-zinc-800 px-1.5 py-1 text-xs text-center text-white font-mono font-bold focus:border-orange-500 outline-none"
                              value={propReintegrationPct}
                              onChange={(e) => setPropReintegrationPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                            />
                            <span className="text-xs text-zinc-500 font-mono">%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              className="w-16 rounded bg-zinc-900 border border-zinc-800 px-1.5 py-1 text-xs text-center text-white font-mono focus:border-orange-500 outline-none"
                              placeholder="Balões"
                              value={propReintegrationCount}
                              onChange={(e) => setPropReintegrationCount(Math.max(1, Number(e.target.value)))}
                            />
                            <span className="text-[10px] text-zinc-500 font-sans">reforços</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase block mb-1 font-mono">Valor Unitário por Balão (R$)</label>
                        <input
                          type="number"
                          className="w-full rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white font-mono"
                          value={propReintegrationValue}
                          onChange={(e) => setPropReintegrationValue(Number(e.target.value))}
                        />
                        <span className="text-[10px] text-zinc-500 mt-1 block font-mono text-right">{propReintegrationCount}x de {formatBRL(propReintegrationValue)}</span>
                      </div>
                    </div>

                    {/* CHAVES CARD */}
                    <div className="bg-black/30 border border-zinc-850/60 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono tracking-wider font-bold text-zinc-400 uppercase">
                          4️⃣ Chaves
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-14 rounded bg-zinc-900 border border-zinc-800 px-1.5 py-1 text-xs text-center text-white font-mono font-bold focus:border-orange-500 outline-none"
                            value={propKeysPct}
                            onChange={(e) => setPropKeysPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                          />
                          <span className="text-xs text-zinc-500 font-mono">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase block mb-1 font-mono">Valor da Entrega das Chaves (R$)</label>
                        <input
                          type="number"
                          className="w-full rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white font-mono"
                          value={propKeysValue}
                          onChange={(e) => setPropKeysValue(Number(e.target.value))}
                        />
                        <span className="text-[10px] text-zinc-500 mt-1 block font-mono text-right">{formatBRL(propKeysValue)}</span>
                      </div>
                    </div>

                    {/* ADESÃO DE CONTRATO CEF */}
                    <div className="bg-black/30 border border-zinc-850/60 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono tracking-wider font-bold text-zinc-400 uppercase">
                          5️⃣ Adesão CEF
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            id="enableCefContractFee"
                            className="rounded border-zinc-850 bg-zinc-900 text-orange-500 focus:ring-orange-500 h-3.5 w-3.5"
                            checked={propCefContractFee !== undefined}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPropCefContractFee(3500); // Default placeholder fee
                              } else {
                                setPropCefContractFee(undefined);
                              }
                            }}
                          />
                          <label htmlFor="enableCefContractFee" className="text-[10px] text-zinc-400 font-bold select-none cursor-pointer uppercase">Habilitar</label>
                        </div>
                      </div>
                      {propCefContractFee !== undefined && (
                        <div>
                          <label className="text-[9px] text-zinc-500 uppercase block mb-1 font-mono">Valor da Taxa de Adesão CEF (R$)</label>
                          <input
                            type="number"
                            className="w-full rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white font-mono"
                            placeholder="Valor da adesão CEF"
                            value={propCefContractFee}
                            onChange={(e) => setPropCefContractFee(Number(e.target.value))}
                          />
                          <span className="text-[10px] text-zinc-500 mt-1 block font-mono text-right">{formatBRL(propCefContractFee)}</span>
                        </div>
                      )}
                    </div>

                    {/* UNIDADES DISPONÍVEIS */}
                    <div className="bg-black/30 border border-zinc-850/60 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono tracking-wider font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                          📊 Unidades Disponíveis
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            id="enableAvailableUnits"
                            className="rounded border-zinc-850 bg-zinc-900 text-orange-500 focus:ring-orange-500 h-3.5 w-3.5"
                            checked={propAvailableUnits !== undefined}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPropAvailableUnits(15); // Default start
                              } else {
                                setPropAvailableUnits(undefined);
                              }
                            }}
                          />
                          <label htmlFor="enableAvailableUnits" className="text-[10px] text-zinc-400 font-bold select-none cursor-pointer uppercase">Habilitar</label>
                        </div>
                      </div>
                      {propAvailableUnits !== undefined && (
                        <div>
                          <label className="text-[9px] text-zinc-500 uppercase block mb-1 font-mono">Unidades no Empreendimento</label>
                          <input
                            type="number"
                            min="0"
                            className="w-full rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:border-orange-500 outline-none"
                            placeholder="Ex: 5, 12, 100"
                            value={propAvailableUnits}
                            onChange={(e) => setPropAvailableUnits(e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)))}
                          />
                          <span className="text-[10px] text-zinc-550 mt-1 block font-sans text-right font-medium">
                            {propAvailableUnits <= 10 ? '⚠️ Alerta de escassez ativo (≤ 10)' : 'Status normal (> 10)'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CONDIÇÃO DE TABELA */}
                    <div className="bg-black/30 border border-zinc-850/60 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono tracking-wider font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                          📝 Condição de Tabela
                        </span>
                        <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Editável</span>
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase block mb-1 font-mono">Condição de tabela do imóvel</label>
                        <textarea
                          rows={2}
                          className="w-full rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white font-sans focus:border-orange-500 outline-none resize-none leading-relaxed"
                          placeholder="Monte uma condição de pagamento flexível conforme sua capacidade financeira..."
                          value={propTableConditionDescription}
                          onChange={(e) => setPropTableConditionDescription(e.target.value)}
                        />
                        <span className="text-[9px] text-zinc-550 mt-1 block leading-normal">
                          Se em branco: exibirá o aviso padrão. Se alterado: exibirá o texto preenchido acima.
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Percentage Summary and warnings */}
                  <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono border-t border-zinc-900 pt-3 text-zinc-500 gap-1.5 col-span-full">
                    <div>
                      <span>Esquema total do saldo devedor: </span>
                      <span className={`font-bold ${
                        (Number(propDownpaymentPct) + Number(propInstallmentsPct) + Number(propReintegrationPct) + Number(propKeysPct)) === 100
                          ? 'text-green-400'
                          : 'text-orange-400'
                      }`}>
                        {Number(propDownpaymentPct)}% + {Number(propInstallmentsPct)}% + {Number(propReintegrationPct)}% + {Number(propKeysPct)}% = {Number(propDownpaymentPct) + Number(propInstallmentsPct) + Number(propReintegrationPct) + Number(propKeysPct)}%
                      </span>
                    </div>
                    {((Number(propDownpaymentPct) + Number(propInstallmentsPct) + Number(propReintegrationPct) + Number(propKeysPct)) !== 100) && (
                      <div className="text-orange-400 font-sans italic text-right">
                        💡 Recomenda-se ajustar os percentuais para totalizar 100% da transação.
                      </div>
                    )}
                  </div>
                </div>

                {/* IMAGES MANAGER IN FORM */}
                <div className="border border-zinc-900 rounded-xl p-4 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">Imagens do Empreendimento ({propImagesList.length} registradas)</label>
                    <p className="text-xs text-zinc-500 mt-0.5">Use os presets rápidos abaixo ou insira um link de imagem externo.</p>
                  </div>

                  {/* Preset quick selection gallery */}
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {IMAGE_PRESETS.map((pUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectPresetImage(pUrl)}
                        className={`aspect-square rounded border relative overflow-hidden focus:outline-none transition-all ${
                          propImagesList.includes(pUrl) 
                            ? 'border-orange-500 scale-95 ring-[1.5px] ring-orange-500/40' 
                            : 'border-zinc-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={pUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        {propImagesList.includes(pUrl) && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Check className="h-5 w-5 text-orange-500 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Local File Upload Selector */}
                  <div className="border border-dashed border-zinc-800 hover:border-orange-500/50 rounded-xl p-4 sm:p-5 bg-black/15 transition-all flex flex-col items-center justify-center text-center relative group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                    />
                    <div className="h-9 w-9 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-105 transition-transform">
                      <Upload className="h-4.5 w-4.5 text-orange-500" />
                    </div>
                    <span className="text-[11px] font-extrabold text-white uppercase tracking-wider mt-2.5">
                      Fazer Upload de Imagens do Dispositivo
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-1 max-w-sm">
                      Selecione múltiplos arquivos simultâneos de foto. Eles serão convertidos para alta fidelidade e anexados à galeria.
                    </span>
                  </div>

                  {/* Manual input section */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      className="flex-1 rounded-lg bg-black/60 border border-zinc-850 px-3 py-2.5 text-xs text-white focus:border-orange-500 outline-none font-mono"
                      placeholder="Ou insira um link externo: https://exemplo.com/foto.jpg"
                      value={propImageInput}
                      onChange={(e) => setPropImageInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs hover:text-white hover:border-orange-500 transition-all cursor-pointer font-bold shrink-0 uppercase tracking-widest"
                    >
                      Inserir Link
                    </button>
                  </div>

                  {/* Current selected image list preview list */}
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase font-mono block mb-2">Imagens adicionadas / Ordem de exibição</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {propImagesList.map((url, idx) => (
                        <div 
                          key={idx}
                          className="group/img relative aspect-square border border-zinc-800 rounded-xl overflow-hidden bg-black/40 flex flex-col"
                        >
                          {/* Image preview */}
                          <img 
                            src={url} 
                            alt={`Imagem ${idx + 1}`} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform group-hover/img:scale-105" 
                          />
                          
                          {/* Top-right delete/remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImageUrl(idx)}
                            className="absolute top-1.5 right-1.5 z-10 p-1.5 rounded-full bg-black/70 hover:bg-red-950 hover:text-red-400 border border-white/10 text-zinc-400 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                            title="Deletar Imagem"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Image count label */}
                          <div className="absolute top-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-zinc-300 border border-white/5">
                            #{idx + 1}
                          </div>

                          {/* Bottom reordering controls bar */}
                          <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-xs py-1 px-1.5 flex items-center justify-between border-t border-zinc-850 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveImageLeft(idx)}
                              className={`p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-orange-500 hover:border-orange-500/50 transition-all ${
                                idx === 0 ? 'opacity-30 cursor-not-allowed text-zinc-650' : 'cursor-pointer'
                              }`}
                              title="Mover para Esquerda"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>

                            <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                              Posição
                            </span>

                            <button
                              type="button"
                              disabled={idx === propImagesList.length - 1}
                              onClick={() => handleMoveImageRight(idx)}
                              className={`p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-orange-500 hover:border-orange-500/50 transition-all ${
                                idx === propImagesList.length - 1 ? 'opacity-30 cursor-not-allowed text-zinc-650' : 'cursor-pointer'
                              }`}
                              title="Mover para Direita"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* GERENCIADOR DE PLANTAS DO IMÓVEL */}
                <div className="border border-zinc-900 rounded-xl p-4 sm:p-5 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">Plantas Do Empreendimento ({propFloorPlans.length} cadastradas)</label>
                    <p className="text-xs text-zinc-500 mt-0.5">Cadastre as opções de plantas humanizadas que ficarão disponíveis para o cliente ver e interagir na página de detalhes do imóvel.</p>
                  </div>

                  {/* List of current registered plans */}
                  {propFloorPlans.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-zinc-900">
                      {propFloorPlans.map((p, idx) => (
                        <div key={p.id || idx} className="flex gap-3 bg-black/40 border border-zinc-850 p-3 rounded-lg relative group">
                          <img src={p.image} className="w-16 h-12 rounded object-cover shrink-0 bg-black/20" alt={p.name} />
                          <div className="overflow-hidden">
                            <h6 className="text-[11px] font-extrabold text-white truncate">{p.name}</h6>
                            <p className="text-[10px] text-[#FF9D00] font-mono mt-0.5">{p.area ? `${p.area} m²` : 'Metragem sob consulta'}</p>
                            <p className="text-[9px] text-zinc-500 truncate mt-0.5 font-sans">{p.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlanIdx(idx);
                              setNewPlanName(p.name);
                              setNewPlanArea(p.area ? String(p.area) : '');
                              setNewPlanDescription(p.description || '');
                              setNewPlanImageUrl(p.image || '');
                              setNewPlanBedrooms(p.bedrooms);
                            }}
                            className="absolute top-2 right-9 p-1 rounded bg-zinc-900 hover:bg-zinc-700 text-zinc-500 transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePlan(idx)}
                            className="absolute top-2 right-2 p-1 rounded bg-zinc-900 hover:bg-red-950 hover:text-red-400 text-zinc-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inputs for adding a plan */}
                  <div className="bg-black/35 p-3 sm:p-4 rounded-xl border border-zinc-850 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="block text-[10px] font-black text-orange-500 uppercase font-mono tracking-wider">
                        {editingPlanIdx !== null ? '✏️ Editando Planta' : '➕ Cadastrar Nova Planta'}
                      </span>
                      {editingPlanIdx !== null && (
                        <button type="button" onClick={() => {
                          setEditingPlanIdx(null);
                          setNewPlanName('');
                          setNewPlanArea('');
                          setNewPlanDescription('');
                          setNewPlanImageUrl('');
                          setNewPlanBedrooms(undefined);
                        }} className="text-[10px] text-zinc-400 hover:text-white">Cancelar</button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide block mb-1">Nome da Planta *</label>
                        <input
                          type="text"
                          className="w-full rounded bg-black/50 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:border-orange-500 outline-none"
                          placeholder="Ex: Planta Tipo A"
                          value={newPlanName}
                          onChange={(e) => setNewPlanName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide block mb-1">Metragem (m²)</label>
                        <input
                          type="number"
                          className="w-full rounded bg-black/50 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:border-orange-500 outline-none font-mono"
                          placeholder="Ex: 120"
                          value={newPlanArea}
                          onChange={(e) => setNewPlanArea(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide block mb-1">Dormitórios</label>
                        <input
                          type="text"
                          className="w-full rounded bg-black/50 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:border-orange-500 outline-none font-mono"
                          placeholder="Ex: 1 a 2"
                          value={newPlanBedrooms || ''}
                          onChange={(e) => setNewPlanBedrooms(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide block mb-1">Descrição Detalhada / Características</label>
                      <textarea
                        rows={2}
                        className="w-full rounded bg-black/50 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:border-orange-500 outline-none"
                        placeholder="Ex: Ampla sacada gourmet, churrasqueira a carvão, 3 suítes plenas, dependência de empregada e lavabo."
                        value={newPlanDescription}
                        onChange={(e) => setNewPlanDescription(e.target.value)}
                      />
                    </div>

                    {/* Image handling for plans */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide block mb-1">Imagem da Planta (URL)</label>
                        <input
                          type="text"
                          className="w-full rounded bg-black/50 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:border-orange-500 outline-none font-mono"
                          placeholder="Link da imagem ou faça upload ao lado..."
                          value={newPlanImageUrl}
                          onChange={(e) => setNewPlanImageUrl(e.target.value)}
                        />
                      </div>

                      {/* Direct file upload for floor plan */}
                      <div className="relative">
                        <input
                          type="file"
                          id="plan-image-upload"
                          accept="image/*"
                          onChange={handlePlanImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-15"
                        />
                        <button
                          type="button"
                          className="w-full py-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 hover:text-white text-zinc-300 text-xs transition-colors flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider"
                        >
                          <Upload className="h-3 w-3 text-orange-500" />
                          Selecionar Arquivo Local
                        </button>
                      </div>
                    </div>

                    {/* Image Preview if available */}
                    {newPlanImageUrl && (
                      <div className="mt-1.5 flex items-center gap-2 bg-black/40 p-2 rounded border border-zinc-850">
                        <img src={newPlanImageUrl} alt="Preview Planta" className="w-12 h-10 rounded object-cover" />
                        <span className="text-[10px] text-zinc-400 font-mono truncate">Imagem da Planta pronta!</span>
                        <button type="button" onClick={() => setNewPlanImageUrl('')} className="p-1 rounded text-red-500 hover:text-red-400 font-mono text-[9px] uppercase ml-auto">Excluir</button>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddNewPlan}
                        className="px-5 py-2 rounded-lg bg-[#FF9D00]/15 border border-[#FF9D00]/30 text-[#FF9D00] hover:bg-[#FF9D00] hover:text-black font-extrabold text-xs transition-all uppercase tracking-wider cursor-pointer"
                      >
                        ➕ Adicionar Planta ao Imóvel
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detailed Description Section */}
                <div className="space-y-2 border-t border-zinc-900 pt-6">
                  <label className="text-[10px] font-bold tracking-widest text-[#FF9D00] uppercase font-mono block">
                    Descrição Detalhada do Imóvel (Pública — Aparece no site)
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    Insira a descrição detalhada que será mostrada no card expandido do imóvel para os clientes. Caso fique em branco, o sistema gerará uma descrição padrão contendo as características fundamentais do imóvel.
                  </p>
                  <textarea
                    rows={6}
                    className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2.5 text-xs text-white focus:border-orange-500 outline-none font-sans"
                    placeholder="Ex: Este espetacular empreendimento localizado no prestigiado bairro Meia Praia redefine os conceitos de sofisticação..."
                    value={propDetailedDescription}
                    onChange={(e) => setPropDetailedDescription(e.target.value)}
                  />
                </div>

                {/* Private Notes Section */}
                <div className="space-y-2 border-t border-zinc-900 pt-6">
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                    Anotações Internas (Privadas — Não aparecem no site)
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    Insira informações privadas do proprietário, contato telefônico direto, comissão, condições especiais de pagamento ou outras anotações particulares para controle interno exclusivo.
                  </p>
                  <textarea
                    rows={4}
                    className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2.5 text-xs text-white focus:border-orange-500 outline-none font-mono"
                    placeholder="Ex: Contato proprietário: Sr. João (47) 99999-9999. Aceita permuta de menor valor de até 40%. Comissão integral de 6%."
                    value={propPrivateNotes}
                    onChange={(e) => setPropPrivateNotes(e.target.value)}
                  />
                </div>

                <div className="pt-4 border-t border-zinc-900 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPropertyFormOpen(false)}
                    className="px-6 py-3 rounded-xl border border-zinc-850 text-zinc-400 hover:text-white transition-all hover:bg-zinc-900 text-xs uppercase font-extrabold tracking-widest cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    disabled={uploadState.isUploading}
                    className="px-8 py-3 rounded-xl bg-orange-500 text-black text-xs font-extrabold tracking-widest uppercase hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/15 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {uploadState.isUploading ? 'Aguardando Upload...' : 'Salvar Empreendimento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENDER BANNERS FORM MODAL */}
      <AnimatePresence>
        {isBannerFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBannerFormOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl z-10"
            >
              {/* Corner Close button */}
              <button
                onClick={() => setIsBannerFormOpen(false)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-6 pb-2 border-b border-zinc-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white uppercase tracking-tight">
                    {editingBannerId ? 'Editar Banner Publicitário' : 'Novo Banner Autoplay'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono">Banners rodam automaticamente no fundo do buscador.</p>
                </div>
              </div>

              <form onSubmit={onSubmitBanner} className="space-y-4">
                {/* Banner title */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5">Título do Anúncio *</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                    placeholder="Ex: O Futuro Mora no Topo"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                  />
                </div>

                {/* Banner subtitle */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-1.5 font-bold">Subtítulo do Anúncio</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                    placeholder="Ex: Condomínios de alto padrão com tecnologia integrada para redefinir o viver..."
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                  />
                </div>

                {/* Banner Image Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">Imagem de Fundo (1920x1080 recomendado) *</label>
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Arquivo ou URL</span>
                  </div>

                  <div className="space-y-2">
                    {/* URL Input */}
                    <input
                      type="text"
                      className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-orange-500 outline-none font-mono"
                      placeholder="https://link-de-imagem.com/hotel.jpg"
                      value={bannerImageUrl}
                      onChange={(e) => setBannerImageUrl(e.target.value)}
                    />

                    {/* Image File Upload Trigger */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                      />
                      <button
                        type="button"
                        className="w-full py-2.5 rounded bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 hover:text-white text-zinc-300 text-xs transition-colors flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider"
                      >
                        <Upload className="h-3 w-3 text-orange-500" />
                        Upload do Dispositivo / Foto Local
                      </button>
                    </div>

                    {bannerImageUrl && (
                      <div className="flex items-center gap-2.5 bg-black/40 p-2 rounded-xl border border-zinc-900 mt-2">
                        <img 
                          src={bannerImageUrl} 
                          alt="Preview do Banner" 
                          referrerPolicy="no-referrer"
                          className="w-14 h-10 rounded border border-zinc-800 object-cover" 
                        />
                        <div className="overflow-hidden">
                          <span className="text-[10px] text-zinc-400 font-mono block truncate">Imagem selecionada</span>
                          <span className="text-[8px] text-zinc-600 font-mono block truncate">
                            {bannerImageUrl.startsWith('data:') ? 'Arquivo do Dispositivo (Base64)' : bannerImageUrl}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Easy preset images select */}
                  <div className="mt-3">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Favoritos e Sugestões:</span>
                    <div className="flex gap-2.5 overflow-x-auto pb-1">
                      {IMAGE_PRESETS.slice(0, 5).map((imgUrl, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setBannerImageUrl(imgUrl)}
                          className={`w-14 h-10 rounded border overflow-hidden shrink-0 transition-all ${
                            bannerImageUrl === imgUrl ? 'border-orange-500 scale-95' : 'border-zinc-800'
                          }`}
                        >
                          <img src={imgUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Banner Property Link */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest text-[#FFBC00] uppercase font-mono block mb-1.5 font-bold">Imóvel Vinculado (Anúncio)</label>
                  <select
                    className="w-full rounded-lg bg-black/60 border border-zinc-850 px-3 py-2 text-sm text-white focus:border-[#FFBC00] outline-none"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                  >
                    <option value="">-- Sem Vínculo (Banner Geral) --</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.projectType}] {p.name} - {p.neighborhood} (Ref: {p.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">Ao selecionar um imóvel, o botão "Conhecer Agora" aparecerá no banner da Home e abrirá as informações detalhadas dele.</p>
                </div>

                {/* Active Switcher checkbox */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-900 bg-black/20 mt-4">
                  <div>
                    <span className="text-xs font-bold text-white uppercase block">Ativar Campanhas</span>
                    <span className="text-[10px] text-zinc-500">Determina se o banner entra no carrossel de fundos da Home.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBannerActive(!bannerActive)}
                    className="text-orange-500 active:scale-95 transition-all outline-none"
                  >
                    {bannerActive ? (
                      <ToggleRight className="h-10 w-10 text-orange-500 stroke-[1.5]" />
                    ) : (
                      <ToggleLeft className="h-10 w-10 text-zinc-600 stroke-[1.5]" />
                    )}
                  </button>
                </div>

                <div className="pt-4 border-t border-zinc-900 flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsBannerFormOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-zinc-850 text-zinc-400 hover:text-white transition-all hover:bg-zinc-900 text-xs uppercase font-bold tracking-widest cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    disabled={uploadState.isUploading}
                    className="px-6 py-2.5 rounded-xl bg-orange-500 text-black text-xs font-extrabold tracking-widest uppercase hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {uploadState.isUploading ? 'Aguardando Upload...' : 'Salvar Banner'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING IMAGE UPLOAD PROGRESS NOTIFICATION */}
      <AnimatePresence>
        {uploadState.isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] w-80 bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-2xl shadow-black/80 flex flex-col gap-3 font-sans"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono block">
                Enviando Imagem...
              </span>
              <span className="text-xs font-mono font-bold text-orange-500">
                {uploadState.progress}%
              </span>
            </div>
            
            <p className="text-[11px] text-zinc-300 font-mono truncate max-w-full">
              {uploadState.fileName}
            </p>

            {/* Progress bar container */}
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-600 to-orange-400"
                style={{ width: `${uploadState.progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${uploadState.progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}

        {/* Upload Success Alert */}
        {uploadState.success && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[100] w-80 bg-zinc-950 border ${
              uploadState.isFallback ? 'border-orange-500/30' : 'border-green-500/30'
            } rounded-xl p-4 shadow-2xl shadow-black/80 flex items-center gap-3 font-sans`}
          >
            <div className={`h-8 w-8 rounded-full ${
              uploadState.isFallback ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'
            } flex items-center justify-center shrink-0 font-bold`}>
              {uploadState.isFallback ? '⚠️' : '✓'}
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white">
                {uploadState.isFallback ? 'Salvo no Banco Local' : 'Upload Concluído'}
              </h4>
              <p className="text-[10px] text-zinc-400">
                {uploadState.isFallback 
                  ? 'Firebase Storage inativo. Imagem salva em formato local compactado.' 
                  : 'Imagem enviada com sucesso.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Upload Error Alert */}
        {uploadState.error && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] w-80 bg-zinc-950 border border-red-500/30 rounded-xl p-4 shadow-2xl shadow-black/80 flex flex-col gap-2 font-sans"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 font-bold">
                ✕
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white">Erro no Envio</h4>
                <p className="text-[10px] text-zinc-400">Falha ao processar ou enviar a imagem.</p>
              </div>
              <button
                onClick={() => setUploadState(prev => ({ ...prev, error: null }))}
                className="text-zinc-500 hover:text-white text-xs font-bold font-mono"
              >
                ✕
              </button>
            </div>
            <div className="p-2 bg-red-950/20 rounded border border-red-500/10 max-h-24 overflow-y-auto text-[9px] font-mono text-red-400 leading-relaxed break-all">
              {uploadState.error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SeoDirective {
  title: string;
  rules: string;
  examples: string;
}

const SEO_DIRECTIVES: SeoDirective[] = [
  {
    title: "1. Meta Title",
    rules: "Títulos entre 50 e 60 caracteres contendo: Tipo do imóvel, Cidade, Bairro e Palavra-chave principal.",
    examples: "Apartamento à Venda na Praia Brava | Itajaí SC"
  },
  {
    title: "2. Meta Description",
    rules: "Descrição entre 140 e 160 caracteres contendo: Benefício, Localização e Call-To-Action (CTA).",
    examples: "Apartamentos na Praia Brava com localização de excelência. Veja fotos oficiais, valores diretos e agende sua visita hoje."
  },
  {
    title: "3. URL Amigável",
    rules: "Gerar URLs curtas, diretas e limpas em letras minúsculas, usando apenas hifens para separar termos de interesse.",
    examples: "/apartamento-venda-praia-brava-itajai\n/cobertura-balneario-camboriu\n/imovel-frente-mar-balneario-camboriu"
  },
  {
    title: "4. Headings SEO",
    rules: "Utilizar cabeçalho H1 único de foco por página, H2s complementares contendo as principais palavras-chave do projeto, e H3s para diferenciais específicos.",
    examples: "H1: Apartamento à Venda na Praia Brava\nH2: Diferenciais do Imóvel\nH2: Qualidade Construtiva\nH2: Agende Uma Visita Técnica"
  },
  {
    title: "5. SEO Local",
    rules: "Indexação direta de termos das regiões mais quentes de Santa Catarina (Balneário Camboriú, Praia Brava, Itajaí, Centro, Barra Sul, Pioneiros, Nações, Fazenda, Cabeçudas) de forma integrada nas páginas de cada projeto.",
    examples: "Focado em impulsionar o tráfego regional com buscas diretas do Google Maps / Google My Business."
  },
  {
    title: "6. Palavras-chave",
    rules: "Fórmula de palavras-chave combinando principal, secundárias de apoio estrutural e variações long-tail de desejo de compra.",
    examples: "apartamento em balneário camboriú\nimóvel alto padrão balneário camboriú\napartamento frente mar balneário camboriú\ninvestir em imóvel em balneário camboriú\napartamento com vista mar praia brava"
  },
  {
    title: "7. Schema Markup",
    rules: "Geração automática do schema estruturado JSON-LD que comunica ao buscador todos os dados da oferta (RealEstateListing, Product, LocalBusiness, Organization, BreadcrumbList, FAQPage).",
    examples: "Injetado no cabeçalho invisível para exibição de Rich Snippets de preço e notas no Google."
  },
  {
    title: "8. Open Graph",
    rules: "Tags Open Graph completas de compartilhamento social (og:title, og:description, og:image, og:url, og:type) para garantir links chamativos no Instagram, WhatsApp e Facebook.",
    examples: "Contendo a imagem em alta resolução e o resumo persuasivo do lançamento."
  },
  {
    title: "9. SEO para Imóveis",
    rules: "Cada projeto imobiliário possui uma arquitetura semântica exclusiva, textos autorais inéditos superando o mínimo de 600 palavras estruturadas, evitando qualquer conteúdo duplicado que possa sofrer penalizações.",
    examples: "Estruturação sob medida para os lançamentos de luxo listados."
  },
  {
    title: "10. SEO para Empreendimentos",
    rules: "Páginas indexáveis por termos de construtoras renomadas, bairros de prestígio e marcas imobiliárias conceituadas do litoral de SC.",
    examples: "FG Empreendimentos, Embraed, CN Empreendimentos, Pasqualotto, Solara Residence."
  },
  {
    title: "11. Blog SEO Automático",
    rules: "Textos robustos excedendo 1.500 palavras focados em esclarecer dúvidas de investidores, contendo FAQ com markup estruturado e links de destino de compra.",
    examples: "Assuntos quentes: 'Vale a pena investir na Praia Brava?', 'Melhores bairros de Balneário Camboriú', etc."
  },
  {
    title: "12. Performance Técnica",
    rules: "Conceito de carregamento ultrarrápido (Core Web Vitals verdes), carregamento sob demanda (Lazy Load) para preservar banda, otimização de imagens WebP de alta eficiência, robots.txt amigável e canais limpos de sitemaps.",
    examples: "Arquitetura otimizada para SEO Técnico no nível do servidor com baixo tempo de carregamento de páginas."
  },
  {
    title: "13. Inteligência de Busca",
    rules: "Categorias e páginas sob demanda mapeadas para responder instantaneamente a combinações avançadas de alta intenção comercial no Google.",
    examples: "Cobertura Duplex Balneário Camboriú, Apartamento Alto Padrão no Litoral de SC, Frente Mar Praia Brava."
  },
  {
    title: "14. SEO de Conversão",
    rules: "Conexão clara entre otimização e vendas. Atendimento flutuante do WhatsApp oficial, links telefônicos interativos, e canais integrados de formulário de contato.",
    examples: "Capture o tráfego gerado antes de o visitante sair da página."
  },
  {
    title: "15. Objetivo Final (EEAT)",
    rules: "Autoridade total no nicho de imóveis de luxo de Balneário Camboriú, Praia Brava e Itajaí, demonstrando Experiência, Especialização, Autoridade e Confiabilidade frente aos critérios do Google.",
    examples: "O portal ranqueia acima da concorrência local por meio de conteúdo técnico e design profissional."
  }
];

const SEO_PROMPT_TEXT = `PROMPT SEO AVANÇADO PARA PORTAL IMOBILIÁRIO

Você é um especialista sênior em SEO técnico, SEO local, SEO imobiliário, Google Search Console, Google Business Profile e otimização para mecanismos de busca.

Sua missão é transformar cada página do portal imobiliário em uma página altamente otimizada para aparecer nas primeiras posições do Google.

Objetivos
Maximizar posicionamento orgânico.
Aumentar tráfego qualificado.
Melhorar indexação.
Gerar mais leads.
Dominar buscas locais.
Aparecer em pesquisas por bairro, cidade, empreendimento e tipo de imóvel.

Estrutura SEO obrigatória para todas as páginas

1. Meta Title
Criar títulos entre 50 e 60 caracteres contendo:
Tipo do imóvel
Cidade
Bairro
Palavra-chave principal
Exemplo:
Apartamento à Venda na Praia Brava | Itajaí SC

2. Meta Description
Criar descrição entre 140 e 160 caracteres contendo:
Benefício
Localização
CTA
Exemplo:
Apartamentos na Praia Brava com localização privilegiada. Confira fotos, valores e agende sua visita.

3. URL Amigável
Gerar URLs curtas e otimizadas.
Exemplo:
/apartamento-venda-praia-brava-itajai
/cobertura-balneario-camboriu
/imovel-frente-mar-balneario-camboriu

4. Headings SEO
Criar:
H1 único
H2 estratégicos
H3 complementares
Exemplo:
H1: Apartamento à Venda na Praia Brava
H2: Características do Imóvel
H2: Localização Privilegiada
H2: Por que investir na Praia Brava
H2: Agende sua visita

5. SEO Local
Inserir automaticamente:
Balneário Camboriú, Praia Brava, Itajaí, Centro, Barra Sul, Pioneiros, Nações, Fazenda, Cabeçudas sempre que houver relação com o imóvel.

6. Palavras-chave
Gerar lista de:
Palavra-chave principal
Palavras-chave secundárias
Palavras-chave de cauda longa
Exemplo:
apartamento em balneário camboriú
imóvel alto padrão balneário camboriú
apartamento frente mar balneário camboriú
investir em imóvel em balneário camboriú
apartamento com vista mar praia brava

7. Schema Markup
Implementar automaticamente:
RealEstateListing, Product, LocalBusiness, Organization, BreadcrumbList, FAQPage no formato JSON-LD.

8. Open Graph
Gerar:
og:title, og:description, og:image, og:url, og:type para otimização no Facebook, Instagram e WhatsApp.

9. SEO para Imóveis
Cada imóvel deve gerar automaticamente:
Título SEO exclusivo.
Descrição SEO exclusiva.
URL exclusiva.
Keywords exclusivas.
Texto mínimo de 600 palavras.
Nunca duplicar conteúdo.

10. SEO para Empreendimentos
Criar páginas completas para:
Empreendimento, Construtora, Bairro, Cidade.
Exemplo: Solara Residence, FG Empreendimentos, Embraed, CN Empreendimentos, Pasqualotto.

11. Blog SEO Automático
Criar artigos otimizados para:
Melhores bairros de Balneário Camboriú, Vale a pena investir na Praia Brava?, Mercado imobiliário de Itajaí, Imóveis frente mar em SC, Lançamentos imobiliários.
Cada artigo com:
1.500+ palavras, FAQ, Schema FAQ, CTA.

12. Performance Técnica
Garantir:
Core Web Vitals verde, Lazy Load, Compressão WebP, Sitemap XML automático, Robots.txt otimizado, Canonical URL, Breadcrumbs, Mobile First, Responsividade total.

13. Inteligência de Busca
Criar páginas otimizadas para buscas como:
Apartamento em Balneário Camboriú, Apartamento Frente Mar Balneário Camboriú, Cobertura Balneário Camboriú, Imóveis Praia Brava, Apartamento Alto Padrão Praia Brava, Investir em Balneário Camboriú, Imobiliária Balneário Camboriú, Imobiliária Praia Brava, Lançamentos Balneário Camboriú, Cobertura Duplex Balneário Camboriú.

14. SEO de Conversão
Inserir automaticamente:
Botão WhatsApp fixo, CTA no topo, CTA no meio, CTA no final, Formulário de contato, Clique para ligar.

15. Objetivo Final
Toda página criada deve ser desenvolvida para competir pelas primeiras posições do Google para buscas relacionadas a: Balneário Camboriú, Praia Brava, Itajaí, Apartamentos, Coberturas, Frente Mar, Alto Padrão, Investimentos Imobiliários, Imobiliária em Balneário Camboriú. Priorizar SEO Local, SEO Técnico, SEO Semântico, EEAT (Experiência, Especialização, Autoridade e Confiabilidade) e indexação rápida no Google.`;
