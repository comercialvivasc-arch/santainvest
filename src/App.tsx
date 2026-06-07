import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import SearchHero from './components/SearchHero';
import SearchPanel from './components/SearchPanel';
import PropertyCard from './components/PropertyCard';
import AdminPanel from './components/AdminPanel';
import { Property, BannerAd, SearchFilters, BrandSettings, Broker, Client, Lead, Visit, Message } from './types';
import { INITIAL_PROPERTIES, INITIAL_BANNERS, DEFAULT_BRAND_SETTINGS } from './data';
import { 
  Building, MapPin, MessageSquare, ShieldCheck, HelpCircle, 
  Sparkles, Compass, Instagram, Facebook, ArrowUpRight, FilterX, HelpCircle as HelpIcon 
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

  // Search filter parameters
  const [query, setQuery] = useState('');
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(10000000); // Default to R$ 10 M to match slider cap
  const [selectedStatus, setSelectedStatus] = useState<Property['status'] | null>(null);
  const [maxDownpayment, setMaxDownpayment] = useState<number>(0); // 0 means any

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

      // 2. Bedrooms filter 
      if (selectedBedrooms !== null) {
        const bedsStr = String(p.bedrooms);
        const matchNumberInput = bedsStr.includes(String(selectedBedrooms));
        const numVal = Number(p.bedrooms);
        const matchNumberStrict = !isNaN(numVal) && numVal === selectedBedrooms;
        
        if (!matchNumberInput && !matchNumberStrict) {
          return false;
        }
      }

      // 3. Max Price Limit filter
      if (p.price > maxPrice) {
        return false;
      }

      // 4. Construction Stage / Status Filter
      if (selectedStatus !== null) {
        if (p.status !== selectedStatus) {
          return false;
        }
      }

      // 5. Downpayment (Entrada) Budget Filter - "imóveis próximos deste valor"
      // If user inputs a downpayment value, match features requiring downpurchase <= 1.30 * maxDownpayment
      // This behaves as an accommodating limit finding options matching or close below/slightly above budget
      if (maxDownpayment > 0) {
        if (p.downpayment > maxDownpayment * 1.30) {
          return false;
        }
      }

      return true;
    });
  }, [properties, query, selectedBedrooms, maxPrice, selectedStatus, maxDownpayment]);

  // Resets filters to original parameters
  const handleResetFilters = () => {
    setQuery('');
    setSelectedBedrooms(null);
    setMaxPrice(10000000);
    setSelectedStatus(null);
    setMaxDownpayment(0);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#f4f4f5] flex flex-col justify-between selection:bg-primary selection:text-black" id="root-portal">
      {/* 1. STICKY GLASS HEADER */}
      <Header 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        query={query} 
        setQuery={setQuery} 
        settings={settings}
      />

      {/* 2. DYNAMIC MAIN BODY ROUTER */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentView === 'home' ? (
            <motion.div
              key="landing-page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Dynamic full-screen Hero Slider */}
              <SearchHero 
                properties={properties}
                banners={banners}
              />

              {/* Integrated Search & Filters Section under the slider */}
              <SearchPanel 
                properties={properties}
                selectedBedrooms={selectedBedrooms}
                setSelectedBedrooms={setSelectedBedrooms}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                maxDownpayment={maxDownpayment}
                setMaxDownpayment={setMaxDownpayment}
                onSearch={({ query: q, bedrooms: b, maxPrice: m, status: s, maxDownpayment: d }) => {
                  setQuery(q);
                  if (b !== undefined) setSelectedBedrooms(b);
                  if (m !== undefined) setMaxPrice(m);
                  if (s !== undefined) setSelectedStatus(s);
                  if (d !== undefined) setMaxDownpayment(d);
                }}
              />

              {/* Real Estate Suggested Grid Section */}
              <section id="projects-showcase" className="w-full bg-white text-zinc-900 py-20 relative border-y border-zinc-100">
                {/* Visual grid accent lines from design guideline */}
                <div className="absolute top-0 right-[25%] w-[1px] h-full bg-zinc-100 pointer-events-none"></div>
                <div className="absolute top-0 left-[25%] w-[1px] h-full bg-zinc-100 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 relative z-10">
                    <div>
                      <span className="text-[11px] font-bold tracking-widest text-[#FF6600] uppercase font-mono block mb-1">
                        ✦ Portfolio Selecionado
                      </span>
                      <h2 className="text-3xl font-black text-zinc-950 tracking-tight sm:text-4xl uppercase">
                        Lançamentos Sugeridos
                      </h2>
                      <p className="mt-2 text-sm text-zinc-500">
                        Projetos modernos com arquitetura futurista e excelentes simulações de parcelamento.
                      </p>
                    </div>

                    {/* Dynamic stats tracker indicator (Translucent widget) */}
                    <div className="flex items-center gap-6 text-zinc-700 font-mono text-[11px] bg-zinc-50 p-4 border border-zinc-200 rounded-xl shadow-sm">
                      <div>
                        <span className="block text-zinc-400 font-bold uppercase text-[9px]">Lançamentos</span>
                        <span className="text-base font-extrabold text-zinc-900 block mt-0.5">{properties.length}</span>
                      </div>
                      <div className="h-8 w-[1px] bg-zinc-200"></div>
                      <div>
                        <span className="block text-zinc-400 font-bold uppercase text-[9px]">Filtrados</span>
                        <span className="text-base font-extrabold text-[#FF6600] block mt-0.5">{filteredProperties.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Grid items */}
                  <motion.div 
                    layout 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10"
                  >
                    {filteredProperties.map((prop) => (
                      <PropertyCard key={prop.id} property={prop} allProperties={properties} settings={settings} />
                    ))}
                  </motion.div>

                  {/* Empty listings state inside showcase */}
                  {filteredProperties.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-md mx-auto text-center py-16 border border-zinc-200 rounded-2xl bg-zinc-50 p-8 relative z-10 shadow-sm"
                    >
                      <FilterX className="h-10 w-10 text-[#FF6600] mx-auto mb-4 animate-pulse" />
                      <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">Nenhum Imóvel Encontrado</h3>
                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                        Não existem lançamentos integrados que correspondam simultaneamente a todos os filtros selecionados:
                        <span className="block text-[#FF6600] font-mono mt-1 font-semibold">
                          {query ? `Busca "${query}"` : ''} 
                          {selectedBedrooms ? ` | ${selectedBedrooms} Dorms` : ''} 
                          {` | Valor até R$ ${(maxPrice / 1000000).toFixed(1)}M`}
                        </span>
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[#FF6600] px-5 py-3 text-xs font-bold text-black uppercase tracking-wider hover:bg-[#e65c00] hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer"
                      >
                        Limpar Filtros e Ver Todos
                      </button>
                    </motion.div>
                  )}
                </div>
              </section>
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

      {/* 4. FUTURISTIC FINE FOOTER */}
      <footer className="border-t border-white/10 bg-black/60 py-12 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="text-sm font-extrabold text-white tracking-widest uppercase">
              {settings?.brandName ? (
                <span>{settings.brandName}</span>
              ) : (
                <>VIVA<span className="text-primary font-black">SC</span></>
              )}
            </span>
            <span className="text-[9px] font-mono tracking-wider text-zinc-500">
              © 2026 {settings?.brandName || 'VIVASC'} Lançamentos Imobiliários. Todos os direitos reservados.
            </span>
          </div>

          <div className="flex gap-6 uppercase font-mono tracking-widest text-[9px] text-zinc-300">
            <a href="#projects-showcase" onClick={() => setCurrentView('home')} className="hover:text-primary transition-colors">Voltar ao topo</a>
            <span className="text-white/15">•</span>
            <button onClick={() => setCurrentView('admin')} className="hover:text-primary transition-colors cursor-pointer">Login Admin</button>
            <span className="text-white/15">•</span>
            <a href={`https://wa.me/${(settings?.phone || '5547999999999').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="hover:text-primary transition-colors">WhatsApp Oficial</a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-primary/40 text-zinc-400 hover:text-white transition-all"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-primary/40 text-zinc-400 hover:text-white transition-all"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
