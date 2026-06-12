import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import SearchHero from './components/SearchHero';
import SearchPanel from './components/SearchPanel';
import PropertyCard from './components/PropertyCard';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import LegalDocsModal from './components/LegalDocsModal';
import CookieConsent from './components/CookieConsent';
import { Property, BannerAd, SearchFilters, BrandSettings, Broker, Client, Lead, Visit, Message } from './types';
import { INITIAL_PROPERTIES, INITIAL_BANNERS, DEFAULT_BRAND_SETTINGS } from './data';
import { 
  Building, MapPin, MessageSquare, ShieldCheck, HelpCircle, 
  Sparkles, Compass, Instagram, Facebook, ArrowUpRight, FilterX, HelpCircle as HelpIcon,
  SlidersHorizontal, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  subscribeProperties, 
  subscribeBanners, 
  subscribeSettings,
  savePropertyToFirestore, 
  deletePropertyFromFirestore, 
  saveBannerToFirestore, 
  deleteBannerFromFirestore,
  saveSettingsToFirestore,
  seedInitialDatabase,
  subscribeBrokers,
  saveBrokerToFirestore,
  deleteBrokerFromFirestore,
  subscribeClients,
  saveClientToFirestore,
  deleteClientFromFirestore,
  subscribeLeads,
  saveLeadToFirestore,
  deleteLeadFromFirestore,
  subscribeVisits,
  saveVisitToFirestore,
  deleteVisitFromFirestore,
  subscribeMessages,
  saveMessageToFirestore,
  deleteMessageFromFirestore
} from './services/firestoreService';
import { auth } from './firebase';

export default function App() {
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticatedUser(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Central State loaded from localStorage or initialized with defaults, updated in real-time by Firestore
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('vivas_properties');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing properties from localstorage', e);
      }
    }
    return INITIAL_PROPERTIES;
  });

  const [banners, setBanners] = useState<BannerAd[]>(() => {
    const saved = localStorage.getItem('vivas_banners');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing banners from localstorage', e);
      }
    }
    return INITIAL_BANNERS;
  });

  const [settings, setSettings] = useState<BrandSettings>(() => {
    const saved = localStorage.getItem('vivas_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing settings from localstorage', e);
      }
    }
    return DEFAULT_BRAND_SETTINGS;
  });

  // NEW CRM STATES
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isDbLoading, setIsDbLoading] = useState(true);

  // Navigation View ('home' or 'admin')
  const [currentView, setCurrentView] = useState<'home' | 'admin'>('home');
  const [currentTab, setCurrentTab] = useState<'home' | 'sobre' | 'lançamentos' | 'bairros' | 'favoritos' | 'contato'>('home');
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Sync favorites with client-side localStorage
  useEffect(() => {
    const updateFavorites = () => {
      try {
        const favs = localStorage.getItem('vivasc_favorites');
        if (favs) {
          const parsed = JSON.parse(favs);
          if (Array.isArray(parsed)) {
            setFavoriteIds(parsed);
          }
        } else {
          setFavoriteIds([]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    updateFavorites();
    const interval = setInterval(updateFavorites, 1500);
    window.addEventListener('storage', updateFavorites);
    window.addEventListener('favorites-updated', updateFavorites);
    return () => {
      window.removeEventListener('storage', updateFavorites);
      window.removeEventListener('favorites-updated', updateFavorites);
      clearInterval(interval);
    };
  }, [currentTab]);

  const [globalSelectedPropertyId, setGlobalSelectedPropertyId] = useState<string | null>(null);

  // Search filter parameters
  const [query, setQuery] = useState('');
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState<number>(100000);
  const [maxPrice, setMaxPrice] = useState<number>(20000000);
  const [selectedStatus, setSelectedStatus] = useState<Property['status'] | null>(null);
  const [selectedProjectType, setSelectedProjectType] = useState<string | null>(null);
  const [maxDownpayment, setMaxDownpayment] = useState<number>(0); // 0 means any
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);

  // Real-time public Firestore listeners
  useEffect(() => {
    const unsubProps = subscribeProperties(
      (updatedProps) => {
        if (updatedProps.length > 0) {
          setProperties(updatedProps);
        }
        setIsFirebaseConnected(true);
        setIsDbLoading(false);
      },
      (error) => {
        console.warn('Fallback to localstorage for properties due to Firestore access limits', error);
        setIsDbLoading(false);
      }
    );

    const unsubBanners = subscribeBanners(
      (updatedBanners) => {
        if (updatedBanners.length > 0) {
          setBanners(updatedBanners);
        }
        setIsFirebaseConnected(true);
        setIsDbLoading(false);
      },
      (error) => {
        console.warn('Fallback to localstorage for banners due to Firestore access limits', error);
        setIsDbLoading(false);
      }
    );

    const unsubSettings = subscribeSettings(
      (updatedSettings) => {
        if (updatedSettings) {
          setSettings(updatedSettings);
        }
        setIsFirebaseConnected(true);
        setIsDbLoading(false);
      },
      (error) => {
        console.warn('Fallback to localstorage for settings due to Firestore access limits', error);
        setIsDbLoading(false);
      }
    );

    return () => {
      unsubProps();
      unsubBanners();
      unsubSettings();
    };
  }, []);

  // Real-time CRM/Authenticated Firestore listeners
  useEffect(() => {
    if (!isAuthenticatedUser) {
      setBrokers([]);
      setClients([]);
      setLeads([]);
      setVisits([]);
      setMessages([]);
      return;
    }

    const unsubBrokers = subscribeBrokers(
      (updatedBrokers) => setBrokers(updatedBrokers),
      (error) => console.warn('Broker subscriber limited or off', error)
    );

    const unsubClients = subscribeClients(
      (updatedClients) => setClients(updatedClients),
      (error) => console.warn('Clients subscriber limited or off', error)
    );

    const unsubLeads = subscribeLeads(
      (updatedLeads) => setLeads(updatedLeads),
      (error) => console.warn('Leads subscriber limited or off', error)
    );

    const unsubVisits = subscribeVisits(
      (updatedVisits) => setVisits(updatedVisits),
      (error) => console.warn('Visits subscriber limited or off', error)
    );

    const unsubMessages = subscribeMessages(
      (updatedMessages) => setMessages(updatedMessages),
      (error) => console.warn('Messages subscriber limited or off', error)
    );

    return () => {
      unsubBrokers();
      unsubClients();
      unsubLeads();
      unsubVisits();
      unsubMessages();
    };
  }, [isAuthenticatedUser]);

  // Auto-seeding and integration helper for authorized administrators if connected database is empty
  useEffect(() => {
    if (!isAuthenticatedUser) return;
    
    const userEmail = auth.currentUser?.email;
    const allowedAdmins = ['comercial.vivasc@gmail.com', 'meuprimeiroimovel.adm@gmail.com'];
    
    if (userEmail && allowedAdmins.includes(userEmail)) {
      const checkAndAutoSeed = async () => {
        try {
          console.log('[Auto-Integrator] Logged in as Admin. Checking if Firestore requires auto-seeding...');
          const res = await seedInitialDatabase();
          if (res.propertiesSeeded > 0 || res.bannersSeeded > 0 || res.settingsSeeded) {
            console.log('[Auto-Integrator] Database was empty! Successfully integrated and auto-seeded:', res);
          } else {
            console.log('[Auto-Integrator] Database is already populated or updated.');
          }
        } catch (err) {
          console.warn('[Auto-Integrator] Auto-seed skip or permissions pending:', err);
        }
      };
      // Allow general render to finish and then perform the automatic check
      const timer = setTimeout(() => {
        checkAndAutoSeed();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticatedUser]);

  // Sync state to localStorage on modification as offline cache fallback
  useEffect(() => {
    localStorage.setItem('vivas_properties', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('vivas_banners', JSON.stringify(banners));
  }, [banners]);

  useEffect(() => {
    localStorage.setItem('vivas_settings', JSON.stringify(settings));
  }, [settings]);

  // Dynamic header metadata injection (Favicon, OG Image, SEO tags)
  useEffect(() => {
    // 1. Dynamic Favicon Update
    const faviconUrl = settings?.faviconUrl || '';
    if (faviconUrl) {
      // Find or create rel="icon"
      let linkIcon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!linkIcon) {
        linkIcon = document.createElement('link');
        linkIcon.rel = 'icon';
        document.head.appendChild(linkIcon);
      }
      linkIcon.href = faviconUrl;

      // Find or create rel="shortcut icon"
      let linkShortcut = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement;
      if (!linkShortcut) {
        linkShortcut = document.createElement('link');
        linkShortcut.rel = 'shortcut icon';
        document.head.appendChild(linkShortcut);
      }
      linkShortcut.href = faviconUrl;
    }

    // 2. Metadata details selection
    let shareTitle = settings?.brandName ? `${settings.brandName} | Lançamentos Imobiliários` : 'VIVA SC | Lançamentos Imobiliários';
    let shareDesc = settings?.tagline || 'Veja os melhores projetos de alto padrão com as melhores condições de pagamento direto com a construtora.';
    let shareImg = settings?.shareLogoUrl || settings?.logoUrl || '/logo.svg';

    // If an active property is loaded
    if (globalSelectedPropertyId) {
      const activeProperty = properties.find(p => p.id === globalSelectedPropertyId);
      if (activeProperty) {
        shareTitle = `${activeProperty.name} | ${settings?.brandName || 'VIVA SC'}`;
        shareDesc = `${activeProperty.projectType || 'Lançamento'} - ${activeProperty.neighborhood}, ${activeProperty.region}. Veja fotos, plantas e plano de parcelas facilitado!`;
        if (activeProperty.images && activeProperty.images.length > 0) {
          shareImg = activeProperty.images[0];
        } else if (activeProperty.mainImage) {
          shareImg = activeProperty.mainImage;
        }
      }
    }

    // Helper functions to set/update meta tags safely
    const setMetaTag = (propertyOrName: string, content: string, isPropertyName = true) => {
      if (!content) return;
      const selector = isPropertyName ? `meta[property='${propertyOrName}']` : `meta[name='${propertyOrName}']`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (isPropertyName) {
          el.setAttribute('property', propertyOrName);
        } else {
          el.setAttribute('name', propertyOrName);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Update typical OG / Meta Tags
    setMetaTag('og:title', shareTitle, true);
    setMetaTag('og:description', shareDesc, true);
    if (shareImg) {
      setMetaTag('og:image', shareImg, true);
    }
    setMetaTag('og:url', window.location.href, true);
    setMetaTag('og:type', 'website', true);

    setMetaTag('twitter:card', 'summary_large_image', false);
    setMetaTag('twitter:title', shareTitle, false);
    setMetaTag('twitter:description', shareDesc, false);
    if (shareImg) {
      setMetaTag('twitter:image', shareImg, false);
    }

    // Update document title dynamically
    document.title = shareTitle;
  }, [globalSelectedPropertyId, properties, settings]);

  // Open Admin view automatically if ?admin=true or hash is #admin on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || window.location.hash === '#admin') {
      setCurrentView('admin');
    }
  }, []);

  // Deep link parsing on mount or properties load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const imovelId = params.get('imovel') || params.get('id');
    if (imovelId && imovelId !== globalSelectedPropertyId) {
      const found = properties.some((p) => p.id === imovelId);
      if (found) {
        setGlobalSelectedPropertyId(imovelId);
      }
    }
  }, [properties]);

  // Sync globalSelectedPropertyId to URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentParam = params.get('imovel') || params.get('id');
    if (globalSelectedPropertyId) {
      if (currentParam !== globalSelectedPropertyId) {
        params.set('imovel', globalSelectedPropertyId);
        // Preserve other existing params if present
        const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
    } else {
      if (currentParam) {
        params.delete('imovel');
        params.delete('id');
        const searchStr = params.toString();
        const newUrl = `${window.location.pathname}${searchStr ? '?' + searchStr : ''}${window.location.hash}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
    }
  }, [globalSelectedPropertyId]);

  // MUTATION CALLBACKS FOR ADMIN ACTIONS (COMMITS TO FIRESTORE AND FORWARD UPDATED LOGIC)
  const handleSaveSettings = async (updatedSettings: BrandSettings) => {
    try {
      setSettings(updatedSettings);
      await saveSettingsToFirestore(updatedSettings);
    } catch (err) {
      console.error('Error saving brand settings on Firestore', err);
    }
  };

  const handleAddProperty = async (newProp: Property) => {
    try {
      setProperties((prev) => [newProp, ...prev]);
      await savePropertyToFirestore(newProp);
    } catch (err) {
      console.error('Error writing new property to Firestore', err);
    }
  };

  const handleEditProperty = async (updatedProp: Property) => {
    try {
      setProperties((prev) => prev.map((p) => p.id === updatedProp.id ? updatedProp : p));
      await savePropertyToFirestore(updatedProp);
    } catch (err) {
      console.error('Error editing property on Firestore', err);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      await deletePropertyFromFirestore(id);
    } catch (err) {
      console.error('Error deleting property from Firestore', err);
    }
  };

  const handleAddBanner = async (newBanner: BannerAd) => {
    try {
      setBanners((prev) => [newBanner, ...prev]);
      await saveBannerToFirestore(newBanner);
    } catch (err) {
      console.error('Error writing banner to Firestore', err);
    }
  };

  const handleEditBanner = async (updatedBanner: BannerAd) => {
    try {
      setBanners((prev) => prev.map((b) => b.id === updatedBanner.id ? updatedBanner : b));
      await saveBannerToFirestore(updatedBanner);
    } catch (err) {
      console.error('Error editing banner on Firestore', err);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      setBanners((prev) => prev.filter((b) => b.id !== id));
      await deleteBannerFromFirestore(id);
    } catch (err) {
      console.error('Error deleting banner from Firestore', err);
    }
  };

  // ADVANCED REAL-TIME FILTER ENGINE
  const globalSelectedProperty = useMemo(() => {
    return properties.find((p) => p.id === globalSelectedPropertyId) || null;
  }, [properties, globalSelectedPropertyId]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // 1. Text Filter (Name, Neighborhood, Region, Type)
      if (query.trim()) {
        const term = query.toLowerCase();
        const propName = p.name.toLowerCase();
        const propNeigh = p.neighborhood.toLowerCase();
        const propReg = p.region.toLowerCase();
        const propType = p.projectType.toLowerCase();
        
        if (!propName.includes(term) && 
            !propNeigh.includes(term) && 
            !propReg.includes(term) && 
            !propType.includes(term)) {
          return false;
        }
      }

      // 2. Bedrooms filter (All, 1, 2, 3, 4, +5)
      if (selectedBedrooms !== null) {
        const numVal = Number(p.bedrooms);
        if (selectedBedrooms === 5) {
          if (isNaN(numVal) || numVal < 5) {
            return false;
          }
        } else {
          if (isNaN(numVal) || numVal !== selectedBedrooms) {
            return false;
          }
        }
      }

      // 3. Price range filter (Min to Max)
      if (p.price < minPrice || p.price > maxPrice) {
        return false;
      }

      // 4. Construction Stage / Status Filter ('Pré-lançamento', 'Lançamento', 'Em construção', 'Pronto')
      if (selectedStatus !== null) {
        const pStatusNorm = (p.status || '').toLowerCase().trim();
        const selStatusNorm = selectedStatus.toLowerCase().trim();
        // Handle "lançado" matching with "lançamento"
        if (selStatusNorm === 'lançado') {
          if (pStatusNorm !== 'lançamento' && pStatusNorm !== 'lançado') {
            return false;
          }
        } else if (pStatusNorm !== selStatusNorm) {
          return false;
        }
      }

      // 5. Project Type Filter
      if (selectedProjectType !== null) {
        const pTypeNorm = (p.projectType || '').toLowerCase().trim();
        const selTypeNorm = selectedProjectType.toLowerCase().trim();
        // Handle plural/singular matches if any
        const matchSingularPlural = pTypeNorm === selTypeNorm || 
                                    pTypeNorm + 's' === selTypeNorm || 
                                    selTypeNorm + 's' === pTypeNorm ||
                                    (selTypeNorm === 'casas' && pTypeNorm === 'casa') ||
                                    (selTypeNorm === 'apartamentos' && pTypeNorm === 'apartamento') ||
                                    (selTypeNorm === 'studios' && pTypeNorm === 'studio') ||
                                    (selTypeNorm === 'coberturas' && pTypeNorm === 'cobertura');
        if (!matchSingularPlural) {
          return false;
        }
      }

      // 6. Downpayment (Entrada) Budget Filter - "imóveis próximos deste valor"
      if (maxDownpayment > 0) {
        if (p.downpayment > maxDownpayment * 1.30) {
          return false;
        }
      }

      return true;
    });
  }, [properties, query, selectedBedrooms, minPrice, maxPrice, selectedStatus, selectedProjectType, maxDownpayment]);

  // Resets filters to original parameters
  const handleResetFilters = () => {
    setQuery('');
    setSelectedBedrooms(null);
    setMinPrice(100000);
    setMaxPrice(20000000);
    setSelectedStatus(null);
    setSelectedProjectType(null);
    setMaxDownpayment(0);
  };

  // --- RENDERS FOR EXTRA CUSTOM PAGES ---
  const renderSobreSection = () => (
    <div className="w-full bg-white text-zinc-900 py-16 px-6 lg:px-8 mt-1 border-t border-zinc-150 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="text-[11px] font-bold tracking-widest text-[#FF9D00] uppercase font-mono block">
            ✦ Boutique Imobiliária de Lançamentos
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#203366] uppercase tracking-tight">
            Sobre Nós
          </h1>
          <p className="max-w-2xl mx-auto text-sm text-zinc-500 leading-relaxed md:text-base">
            Conectamos você aos lançamentos mais promissores e de altíssimo padrão das principais construtoras no litoral de Santa Catarina.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-4">
          <div className="bg-zinc-50 p-6 sm:p-8 rounded-3xl border border-zinc-200 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#203366] uppercase tracking-tight mb-4">
                História & Propósito
              </h2>
              <p className="text-xs text-zinc-650 leading-relaxed space-y-3">
                Fundada sob os pilares da transparência e inovação tecnológica, a imobiliária <span className="font-bold text-zinc-900">{settings?.companyName || 'Meu Primeiro Imóvel ME'}</span> atua de forma diferenciada no mercado litoral do sul do país. 
                <br /><br />
                Acreditamos que a compra do primeiro ou múltiplos investimentos de alto padrão deve ser guiada por análise preditiva de valorização espacial, planos de parcelas adaptados diretamente à sua capacidade e segurança jurídica plena.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-200 text-[10px] font-mono text-zinc-550">
              Regulado perante: CRECI {settings?.creci || '36847'}
            </div>
          </div>

          <div className="bg-[#203366] text-white p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#FF9D00] uppercase tracking-tight mb-4">
                Nossos Diferenciais
              </h2>
              <ul className="space-y-4 text-xs text-zinc-200">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FF9D00] text-sm leading-none">✦</span>
                  <span><strong>Assessoria Exclusiva:</strong> Atendimento individualizado por profissionais cadastrados e especializados em lançamentos imobiliários.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FF9D00] text-sm leading-none">✦</span>
                  <span><strong>Simulação Facilitada:</strong> Tabelas de poupança direto com a construtora com balões, entrada facilitada e planos personalizáveis.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FF9D00] text-sm leading-none">✦</span>
                  <span><strong>Portfólio Seletivo:</strong> Garantia de trabalhar apenas com construtoras com alto padrão construtivo e histórico de incorporações de sucesso.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Legal credentials card */}
        <div className="bg-zinc-50 border border-zinc-200 p-8 rounded-3xl text-center space-y-4">
          <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-800 font-mono">✦ Registro e Transparência de Marca ✦</h3>
          <p className="text-xs text-zinc-550 leading-relaxed max-w-2xl mx-auto">
            O portal {settings?.brandName || 'VIVASC'} é operado sob a designação social <span className="font-semibold text-zinc-900">{settings?.companyName || 'Meu Primeiro Imóvel ME'}</span>, devidamente registrada sob o CNPJ {settings?.cnpj || '51.874.234/0001-90'} e CRECI nº {settings?.creci || '36847'}. Todas as imagens de maquetes, simulação de parcelamentos e preços são de caráter demonstrativo e sujeitos à reajustes em virtude de variações do CUB/SC.
          </p>
        </div>
      </div>
    </div>
  );

  const renderBairrosSection = () => {
    const bairrosList = [
      {
        name: 'Centro',
        desc: 'Infraestrutura completa com conveniências à pé, gastronomia rica e excelente localização comercial.',
        vibe: 'Premium Urbano',
        count: properties.filter(p => (p.neighborhood || '').toLowerCase().includes('centro')).length
      },
      {
        name: 'Barra Sul',
        desc: 'Reduto dos arranha-céus mais altos e luxuosos da América Latina, fácil acesso a marinas e teleférico.',
        vibe: 'Altíssimo Padrão',
        count: properties.filter(p => (p.neighborhood || '').toLowerCase().includes('barra sul')).length
      },
      {
        name: 'Pontal Norte',
        desc: 'Belo cinturão verde, passarela de madeira integrada à natureza e atmosfera residencial tranquila.',
        vibe: 'Sossego & Natureza',
        count: properties.filter(p => (p.neighborhood || '').toLowerCase().includes('pontal norte') || (p.neighborhood || '').toLowerCase().includes('pioneiros')).length
      },
      {
        name: 'Praia Brava',
        desc: 'Área extremamente desejada, mar de águas limpas, excelente praia e alta valorização imobiliária anual.',
        vibe: 'Estilo de Vida & Mar',
        count: properties.filter(p => (p.neighborhood || '').toLowerCase().includes('brava') || (p.neighborhood || '').toLowerCase().includes('amores')).length
      },
      {
        name: 'Ariribá',
        desc: 'Bairro nobre eminentemente familiar, ruas tranquilas e arborizadas, próximo a área central.',
        vibe: 'Residencial Calmo',
        count: properties.filter(p => (p.neighborhood || '').toLowerCase().includes('ariribá')).length
      },
      {
        name: 'Pioneiros',
        desc: 'Setor hospitalar conceituado, próximo à big wheel, de fácil locomoção e muito seguro.',
        vibe: 'Comodidade & Saúde',
        count: properties.filter(p => (p.neighborhood || '').toLowerCase().includes('pioneiros')).length
      }
    ];

    return (
      <div className="w-full bg-white text-zinc-900 py-16 px-6 lg:px-8 mt-1 border-t border-zinc-150 animate-fade-in">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold tracking-widest text-[#FF9D00] uppercase font-mono block">
              ✦ Pesquisa por Localização
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#203366] uppercase tracking-tight">
              Bairros & Regiões Ativas
            </h1>
            <p className="max-w-2xl mx-auto text-sm text-zinc-500 leading-relaxed">
              Descubra o estilo de cada região de Balneário Camboriú e clique para filtrar instantaneamente os lançamentos imobiliários disponíveis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {bairrosList.map((b) => (
              <div 
                key={b.name}
                onClick={() => {
                  setQuery(b.name);
                  setCurrentTab('lançamentos');
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                className="group rounded-3xl border border-zinc-200 bg-zinc-50 p-6 flex flex-col justify-between hover:border-[#FF9D00] hover:bg-white hover:shadow-xl transition-all duration-300 cursor-pointer select-none"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-zinc-150 rounded text-[9px] font-mono uppercase tracking-widest font-black text-zinc-500">
                      {b.vibe}
                    </span>
                    <span className="text-xs bg-orange-100 text-[#E08A00] font-mono px-2 py-0.5 rounded font-extrabold">
                      {b.count} {b.count === 1 ? 'imóvel' : 'imóveis'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#203366] uppercase tracking-tight">
                      {b.name}
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed mt-2 line-clamp-3">
                      {b.desc}
                    </p>
                  </div>
                </div>
                <div className="pt-6 font-mono text-[10px] font-bold text-[#203366] flex items-center gap-1 group-hover:gap-2 transition-all">
                  <span>Ver imóveis no {b.name}</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFavoritosSection = () => {
    const favoriteProperties = properties.filter(p => favoriteIds.includes(p.id));

    return (
      <div className="w-full bg-white text-zinc-900 py-16 px-6 lg:px-8 mt-1 border-t border-zinc-150 animate-fade-in">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold tracking-widest text-[#FF9D00] uppercase font-mono block">
              ✦ Suas Opções Favoritadas
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#203366] uppercase tracking-tight">
              Seus Favoritos
            </h1>
            <p className="max-w-2xl mx-auto text-sm text-zinc-500 leading-relaxed">
              Aqui você acompanha rapidamente todos os lançamentos que escolheu enquanto navegava no portal.
            </p>
          </div>

          {favoriteProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
              {favoriteProperties.map((prop) => (
                <PropertyCard 
                  key={prop.id} 
                  property={prop} 
                  allProperties={properties} 
                  settings={settings} 
                  onNavigateToProperty={setGlobalSelectedPropertyId}
                />
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center py-16 border border-zinc-200 rounded-3xl bg-zinc-50 p-8 shadow-sm">
              <span className="text-[#FF9D00] text-4xl block mb-2">★</span>
              <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">Nenhum Favorito</h3>
              <p className="text-xs text-zinc-550 mt-2 leading-relaxed">
                Você ainda não favoritou nenhum lançamento comercial. Clique nos anúncios e favorite o imóvel de seu interesse!
              </p>
              <button
                onClick={() => setCurrentTab('lançamentos')}
                className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[#203366] px-5 py-3 text-xs font-bold text-white uppercase tracking-wider hover:bg-[#111] transition-all duration-300 cursor-pointer"
              >
                Explorar Catálogo
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContatoSection = () => {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [subject, setSubject] = useState('Dúvida Geral / Agendar Visita');
    const [msg, setMsg] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const idMsg = 'msg_' + Math.random().toString(36).substring(2, 9);
        await saveMessageToFirestore({
          id: idMsg,
          name: name,
          contact: contact,
          message: msg,
          propertyId: subject,
          createdAt: new Date().toISOString()
        });
        setStatus('success');
        setName('');
        setContact('');
        setMsg('');
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    return (
      <div className="w-full bg-white text-zinc-900 py-16 px-6 lg:px-8 mt-1 border-t border-zinc-150 animate-fade-in">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold tracking-widest text-[#FF9D00] uppercase font-mono block">
              ✦ Atendimento de Boutique Exclusivo
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#203366] uppercase tracking-tight">
              Entre em Contato
            </h1>
            <p className="max-w-2xl mx-auto text-sm text-zinc-550 leading-relaxed">
              Nossa equipe está capacitada para simular, esclarecer as tabelas de poupança direto com a construtora e agendar sua visita aos decorados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-4">
            {/* Contact details */}
            <div className="bg-[#203366] text-white p-8 rounded-3xl flex flex-col justify-between shadow-lg">
              <div className="space-y-6">
                <h2 className="text-lg font-bold uppercase tracking-tight text-[#FF9D00]">
                  Canais Diretos
                </h2>

                <div className="space-y-4 text-xs text-zinc-200">
                  <div className="flex flex-col space-y-1 border-b border-white/10 pb-4">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-[#FF9D00]">WhatsApp Oficial</span>
                    <a 
                      href={`https://wa.me/${(settings?.phone || '5547999999999').replace(/\D/g, '')}?text=Olá! Gostaria de falar com um corretor sobre os lançamentos.`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-base font-black text-white hover:underline hover:text-[#FF9D00] transition-all"
                    >
                      +{settings?.phone || '55 47 99999-9999'}
                    </a>
                  </div>

                  <div className="flex flex-col space-y-1 border-b border-white/10 pb-4">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-[#FF9D00]">E-mail Corporativo</span>
                    <a href={`mailto:${settings?.email || 'comercial.vivasc@gmail.com'}`} className="text-sm hover:underline hover:text-[#FF9D00] transition-all">
                      {settings?.email || 'comercial.vivasc@gmail.com'}
                    </a>
                  </div>

                  <div className="flex flex-col space-y-1 pb-2">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-[#FF9D00]">Cidade Sede</span>
                    <span className="text-sm font-semibold">Balneário Camboriú / SC</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 text-[10px] font-mono text-zinc-300 leading-relaxed">
                <strong>{settings?.companyName || 'Meu Primeiro Imóvel ME'}</strong>
                <br />CRECI: {settings?.creci || '36847'}
                <br />CNPJ: {settings?.cnpj || '51.874.234/0001-90'}
              </div>
            </div>

            {/* Form */}
            <div className="bg-zinc-50 border border-zinc-200 p-8 rounded-3xl shadow-sm">
              <h2 className="text-lg font-bold text-zinc-950 uppercase tracking-tight mb-4">
                Envie-nos um e-mail
              </h2>

              {status === 'success' && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 font-bold mb-4">
                  ✦ Mensagem enviada com sucesso! Nossos parceiros heróis entrarão em contato no WhatsApp fornecido.
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full rounded-xl bg-white border border-zinc-200 px-4 py-2.5 text-xs text-zinc-900 focus:border-[#203366] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Celular / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="(47) 99999-9999"
                    className="w-full rounded-xl bg-white border border-zinc-200 px-4 py-2.5 text-xs text-zinc-900 focus:border-[#203366] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Referência ou Assunto</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl bg-white border border-zinc-200 px-4 py-2.5 text-xs text-zinc-900 focus:border-[#203366] outline-none"
                  >
                    <option value="Dúvida Geral / Agendar Visita">Dúvida Geral / Agendar Visita</option>
                    <option value="Simulação de Fluxo de Financiamento">Simular Meu Parcelamento</option>
                    {properties.map(p => (
                      <option key={p.id} value={`Sobre o Imóvel: ${p.name}`}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Sua Mensagem</label>
                  <textarea
                    required
                    rows={3}
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="Olá! Gostaria de receber o plano de parcelas e memorial descritivo..."
                    className="w-full rounded-xl bg-white border border-zinc-200 p-4 text-xs text-zinc-900 focus:border-[#203366] outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center h-11 rounded-xl bg-[#203366] hover:bg-zinc-900 text-white font-extrabold text-xs uppercase tracking-widest shadow transition-all cursor-pointer"
                >
                  Enviar Requisição
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#f4f4f5] flex flex-col justify-between selection:bg-primary selection:text-black" id="root-portal">
      {/* 1. STICKY GLASS HEADER */}
      <Header 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        query={query} 
        setQuery={setQuery} 
        settings={settings}
      />

      {/* 2. DYNAMIC MAIN BODY ROUTER */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentView === 'home' ? (
            <motion.div
              key={`landing-page-${currentTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {currentTab === 'home' && (
                <SearchHero 
                  properties={properties}
                  banners={banners}
                  query={query}
                  setQuery={setQuery}
                  onOpenProperty={(id) => setGlobalSelectedPropertyId(id)}
                />
              )}

              {/* Real Estate Suggested Grid Section */}
              {(currentTab === 'home' || currentTab === 'lançamentos') && (
                <section id="projects-showcase" className="w-full bg-white text-zinc-900 py-20 relative border-y border-zinc-100">
                  {/* Visual grid accent lines from design guideline */}
                  <div className="absolute top-0 right-[25%] w-[1px] h-full bg-zinc-100 pointer-events-none"></div>
                  <div className="absolute top-0 left-[25%] w-[1px] h-full bg-zinc-100 pointer-events-none"></div>

                  <div className="max-w-7xl mx-auto px-6 lg:px-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 relative z-10">
                    <div>
                      <span className="text-[11px] font-bold tracking-widest text-[#FF9D00] uppercase font-mono block mb-1">
                        ✦ Portfolio Selecionado
                      </span>
                      <h2 className="text-3xl font-black text-zinc-950 tracking-tight sm:text-4xl uppercase">
                        Lançamentos Sugeridos
                      </h2>
                      <p className="mt-2 text-sm text-zinc-500">
                        Projetos modernos com arquitetura futurista e excelentes simulações de parcelamento.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {/* FILTERS POPUP TRIGGER BUTTON */}
                      <button 
                        onClick={() => setIsFilterPopupOpen(true)}
                        className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-[#FF9D00]/40 px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-zinc-900 transition-all duration-300 shadow-sm cursor-pointer"
                        title="Abrir filtros de pesquisa"
                      >
                        <SlidersHorizontal className="h-4 w-4 text-[#FF9D00]" />
                        Filtrar Lançamentos
                      </button>

                      {/* Dynamic stats tracker indicator (Translucent widget) */}
                      <div className="flex items-center gap-6 text-zinc-700 font-mono text-[11px] bg-zinc-50 p-4 border border-zinc-200 rounded-xl shadow-sm">
                      <div>
                        <span className="block text-zinc-400 font-bold uppercase text-[9px]">Lançamentos</span>
                        <span className="text-base font-extrabold text-zinc-900 block mt-0.5">{properties.length}</span>
                      </div>
                      <div className="h-8 w-[1px] bg-zinc-200"></div>
                      <div>
                        <span className="block text-zinc-400 font-bold uppercase text-[9px]">Filtrados</span>
                        <span className="text-base font-extrabold text-[#FF9D00] block mt-0.5">{filteredProperties.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Grid items */}
                  <motion.div 
                    layout 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10"
                  >
                    {filteredProperties.map((prop) => (
                      <PropertyCard 
                        key={prop.id} 
                        property={prop} 
                        allProperties={properties} 
                        settings={settings} 
                        onNavigateToProperty={setGlobalSelectedPropertyId}
                      />
                    ))}
                  </motion.div>

                  {/* Empty listings state inside showcase */}
                  {filteredProperties.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-md mx-auto text-center py-16 border border-zinc-200 rounded-2xl bg-zinc-50 p-8 relative z-10 shadow-sm"
                    >
                      <FilterX className="h-10 w-10 text-[#FF9D00] mx-auto mb-4 animate-pulse" />
                      <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">Nenhum Imóvel Encontrado</h3>
                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                        Não existem lançamentos integrados que correspondam simultaneamente a todos os filtros selecionados:
                        <span className="block text-[#FF9D00] font-mono mt-1 font-semibold">
                          {query ? `Busca "${query}"` : ''} 
                          {selectedBedrooms ? ` | ${selectedBedrooms} Dorms` : ''} 
                          {` | Valor até R$ ${(maxPrice / 1000000).toFixed(1)}M`}
                        </span>
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[#FF9D00] px-5 py-3 text-xs font-bold text-black uppercase tracking-wider hover:bg-[#E08A00] hover:shadow-lg hover:shadow-[#FF9D00]/20 transition-all duration-300 cursor-pointer"
                      >
                        Limpar Filtros e Ver Todos
                      </button>
                    </motion.div>
                  )}
                </div>
              </section>
              )}

              {/* Conditional sub-page renders */}
              {currentTab === 'sobre' && renderSobreSection()}
              {currentTab === 'bairros' && renderBairrosSection()}
              {currentTab === 'favoritos' && renderFavoritosSection()}
              {currentTab === 'contato' && renderContatoSection()}

              {/* Filters Popup Modal */}
              <AnimatePresence>
                {isFilterPopupOpen && (
                  <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    {/* Close backdrop on click */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 cursor-default"
                      onClick={() => setIsFilterPopupOpen(false)}
                    />

                    <motion.div
                      initial={{ scale: 0.95, opacity: 0, y: 15 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 15 }}
                      className="relative w-full max-w-4xl bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
                    >
                      {/* Scrollable Filters */}
                      <div className="overflow-y-auto flex-1 styles-scrollbar-custom bg-white">
                        <SearchPanel 
                          properties={properties}
                          selectedBedrooms={selectedBedrooms}
                          setSelectedBedrooms={setSelectedBedrooms}
                          minPrice={minPrice}
                          setMinPrice={setMinPrice}
                          maxPrice={maxPrice}
                          setMaxPrice={setMaxPrice}
                          selectedStatus={selectedStatus}
                          setSelectedStatus={setSelectedStatus}
                          selectedProjectType={selectedProjectType}
                          setSelectedProjectType={setSelectedProjectType}
                          onSearch={({ query: q, bedrooms: b, minPrice: minVal, maxPrice: maxVal, status: s, projectType: pt }) => {
                            setQuery(q);
                            if (b !== undefined) setSelectedBedrooms(b);
                            if (minVal !== undefined) setMinPrice(minVal);
                            if (maxVal !== undefined) setMaxPrice(maxVal);
                            if (s !== undefined) setSelectedStatus(s);
                            if (pt !== undefined) setSelectedProjectType(pt);
                          }}
                          onClose={() => setIsFilterPopupOpen(false)}
                          onClearFilters={handleResetFilters}
                        />
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

            </motion.div>
          ) : (
            <motion.div
              key="admin-page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <AdminPanel
                properties={properties}
                banners={banners}
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onAddProperty={handleAddProperty}
                onEditProperty={handleEditProperty}
                onDeleteProperty={handleDeleteProperty}
                onAddBanner={handleAddBanner}
                onEditBanner={handleEditBanner}
                onDeleteBanner={handleDeleteBanner}
                brokers={brokers}
                clients={clients}
                leads={leads}
                visits={visits}
                messages={messages}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. FLOATING WHATSAPP BUTTON (with premium pulse ring glow) */}
      <a
        href={`https://wa.me/${(settings?.phone || '5547999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
          `Olá! Estou navegando no portal ${settings?.brandName || 'VIVASC'} e gostaria de falar com um consultor sobre os lançamentos ativos.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-xl shadow-primary/20 border border-primary hover:scale-110 active:scale-95 transition-all group cursor-pointer"
        title="Fale conosco no WhatsApp"
        id="whatsapp-floating-btn"
      >
        <MessageSquare className="h-6 w-6 text-black stroke-[2.5] relative z-10" />
        {/* Dynamic radar outer indicator rings */}
        <div className="absolute inset-0 rounded-full bg-primary/30 blur-md -z-10 animate-ping group-hover:bg-primary/50"></div>
        <div className="absolute inset-0 rounded-full bg-primary/20 blur animate-pulse -z-10"></div>
      </a>

      {/* 4. DURABLE BRANDED LIGHT GRAY FOOTER */}
      <Footer 
        settings={settings} 
        onTabChange={setCurrentTab}
        onNavigateToHome={() => setCurrentView('home')}
        onNavigateToAdmin={() => setCurrentView('admin')}
        onOpenTerms={() => setLegalModalType('terms')}
        onOpenPrivacy={() => setLegalModalType('privacy')}
      />

      {/* Cookie Consent overlay */}
      <CookieConsent 
        settings={settings}
        onOpenTerms={() => setLegalModalType('terms')}
        onOpenPrivacy={() => setLegalModalType('privacy')}
      />

      {/* Shared Legal Document Modals */}
      <LegalDocsModal 
        isOpen={!!legalModalType}
        onClose={() => setLegalModalType(null)}
        type={legalModalType || 'terms'}
        settings={settings}
      />

      {/* Global Property Detail Modal Host */}
      {globalSelectedProperty && (
        <PropertyCard 
          property={globalSelectedProperty}
          allProperties={properties}
          settings={settings}
          isOpen={true}
          isModalOnly={true}
          onOpenChange={(open) => {
            if (!open) setGlobalSelectedPropertyId(null);
          }}
          onNavigateToProperty={setGlobalSelectedPropertyId}
          onNavigateToAdmin={() => setCurrentView('admin')}
        />
      )}
    </div>
  );
}
