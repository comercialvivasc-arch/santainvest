import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, ChevronDown, Search, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Property, BannerAd } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SearchHeroProps {
  properties: Property[];
  banners: BannerAd[];
  query: string;
  setQuery: (q: string) => void;
  onOpenProperty?: (id: string) => void;
}

export default function SearchHero({
  properties,
  banners,
  query,
  setQuery,
  onOpenProperty,
}: SearchHeroProps) {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [searchInput, setSearchInput] = useState(query || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { language, t } = useLanguage();

  // Synchronize local input with outer query changes
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Aggregate stats per city/region and neighborhood dynamically
  const regionStats = useMemo(() => {
    const statsMap: Record<string, { name: string; count: number; type: 'Bairro' | 'Cidade' }> = {};
    
    properties.forEach((p) => {
      // Neighborhood stats
      if (p.neighborhood) {
        const key = `neigh-${p.neighborhood.trim().toLowerCase()}`;
        if (!statsMap[key]) {
          statsMap[key] = { name: p.neighborhood.trim(), count: 0, type: 'Bairro' };
        }
        statsMap[key].count += 1;
      }
      
      // City/Region stats
      if (p.region) {
        const key = `reg-${p.region.trim().toLowerCase()}`;
        if (!statsMap[key]) {
          statsMap[key] = { name: p.region.trim(), count: 0, type: 'Cidade' };
        }
        statsMap[key].count += 1;
      }
    });
    
    return Object.values(statsMap);
  }, [properties]);

  const filteredSuggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    const low = searchInput.toLowerCase();
    
    return regionStats
      .filter((s) => s.name.toLowerCase().includes(low))
      .sort((a, b) => {
        const aIndex = a.name.toLowerCase().indexOf(low);
        const bIndex = b.name.toLowerCase().indexOf(low);
        if (aIndex !== bIndex) return aIndex - bIndex;
        return b.count - a.count;
      })
      .slice(0, 5);
  }, [searchInput, regionStats]);

  // Filter active banners
  const activeBanners = useMemo(() => {
    const active = banners.filter((b) => b.active);
    if (active.length > 0) return active;

    const defaultTitle = language === 'en' 
      ? 'The Future of Premium Architecture' 
      : language === 'es' 
        ? 'El Futuro de la Arquitectura Premium' 
        : 'O Futuro da Arquitetura Premium';
        
    const defaultSubtitle = language === 'en'
      ? 'Next-generation property launches with biophilic design and smart technology.'
      : language === 'es'
        ? 'Lanzamientos inmobiliarios de última generación con diseño biofílico y tecnología inteligente.'
        : 'Lançamentos imobiliários de última geração com design biofílico e tecnologia inteligente.';

    return [
      {
        id: 'default-hero',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
        title: defaultTitle,
        subtitle: defaultSubtitle,
        active: true
      }
    ];
  }, [banners, language]);

  // Rotates high-end banners every 8 seconds automatically
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 8005);
    return () => clearInterval(interval);
  }, [activeBanners]);

  // Handle banner safe boundaries
  const currentBanner = activeBanners[activeBannerIndex] || activeBanners[0];

  return (
    <div className="w-full flex flex-col bg-[#0a0a0c]">
      {/* 1. HERO SLIDER VIEWPORT */}
      <section className="relative h-[78vh] min-h-[600px] w-full overflow-hidden flex flex-col items-center justify-center">
        {/* Background Banners list with smooth slide-fade animation */}
        <div className="absolute inset-0 z-0 bg-black">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner.id + '-' + activeBannerIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.65, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <img
                src={currentBanner.imageUrl}
                alt={currentBanner.title}
                referrerPolicy="no-referrer"
                style={{ borderColor: '#e7e7e7' }}
                className="h-full w-full object-cover object-center filter brightness-[0.70] contrast-[1.05]"
              />
            </motion.div>
          </AnimatePresence>
          {/* Futurist Grid and gradient mesh overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 pointer-events-none"></div>
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/30 to-black/80 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
        </div>

        {/* Stable Text Slide Container */}
        <div className="relative z-10 w-full max-w-4xl px-6 md:px-8 text-center flex flex-col items-center justify-center">
          <motion.div
            key={'content-' + currentBanner.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl flex flex-col items-center justify-center w-full"
          >
            <span 
              style={{ color: '#FF9D00' }}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3.5 py-1 text-xs font-semibold tracking-widest uppercase border border-orange-500/20 mb-4 backdrop-blur-sm"
            >
              <Sparkles className="h-3 w-3 animate-pulse text-orange-500" />
              {t('hero.badge')}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl uppercase leading-tight font-sans">
              {currentBanner.title}
            </h1>
            {currentBanner.subtitle && (
              <p className="mt-4 text-sm md:text-lg text-zinc-300 font-sans tracking-wide">
                {currentBanner.subtitle}
              </p>
            )}

            {/* Button "Conhecer agora" */}
            <button
              onClick={() => {
                if (currentBanner.link && onOpenProperty) {
                  onOpenProperty(currentBanner.link);
                } else {
                  const el = document.getElementById('projects-showcase');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
              style={{ backgroundColor: '#FF9D00', color: '#203366' }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl font-extrabold text-xs sm:text-sm px-6 py-3.5 hover:shadow-xl transition-all duration-300 active:scale-95 cursor-pointer uppercase tracking-wider border-0"
            >
              {language === 'en' ? 'Learn more' : language === 'es' ? 'Conocer ahora' : 'Conhecer agora'}
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. CHAVES NAMAO PREMIUM STATIC SEARCH BAR SECTION (FULLY INDEPENDENT) */}
      <div className="w-full bg-white border-y border-zinc-200 py-8 px-4 flex flex-col items-center justify-center shadow-lg relative z-30">
        <div className="w-full max-w-xl relative">
          <div 
            style={{ backgroundColor: '#ffffff', borderRadius: '14px', height: '58px' }}
            className="flex items-center border border-zinc-200/85 focus-within:border-[#203366] transition-all duration-300 pl-4 pr-1.5 py-1.5 shadow-md relative"
          >
            <MapPin className="h-5.5 w-5.5 text-[#FF9D00] shrink-0" />
            <input
              type="text"
              className="w-full bg-transparent px-3 py-1.5 text-zinc-900 placeholder-zinc-500 outline-none focus:ring-0 font-sans font-semibold text-base border-none hover:bg-transparent"
              placeholder={t('search.placeholder')}
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setQuery('');
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-800 cursor-pointer mr-1"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            )}
            
            {/* ONLY sleek magnifying glass as lookup function, absolutely no text */}
            <button
              type="button"
              onClick={() => {
                setQuery(searchInput);
                setShowSuggestions(false);
                const el = document.getElementById('projects-showcase');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ backgroundColor: '#FF9D00', color: '#203366' }}
              className="hover:scale-110 flex items-center justify-center h-11 w-11 rounded-full transition-all cursor-pointer shrink-0 active:scale-95"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Suggestions Dropdown with elegant white background theme matching the search bar */}
          <AnimatePresence>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-0 right-0 mt-3 rounded-2xl border border-zinc-200 bg-white/95 backdrop-blur-md p-1.5 shadow-2xl z-50 text-left overflow-hidden max-h-72 overflow-y-auto"
              >
                <div className="text-[9px] font-mono font-bold text-zinc-400 tracking-wider px-3 py-2 border-b border-zinc-100 uppercase">
                  {t('search.regions_found')}
                </div>
                {filteredSuggestions.map((item, idx) => {
                  const typeLabel = item.type === 'Bairro'
                    ? (language === 'en' ? 'Neighborhood' : language === 'es' ? 'Barrio' : 'Bairro')
                    : (language === 'en' ? 'City' : language === 'es' ? 'Ciudad' : 'Cidade');

                  return (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => {
                        setSearchInput(item.name);
                        setQuery(item.name);
                        setShowSuggestions(false);
                        const el = document.getElementById('projects-showcase');
                        setTimeout(() => {
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }, 80);
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-3 py-3 hover:bg-zinc-50 border-b border-zinc-100/50 text-left transition-all cursor-pointer group"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#FF9D00] shrink-0" />
                        <span className="text-xs font-bold text-zinc-800 group-hover:text-zinc-950">{item.name}</span>
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] leading-none uppercase tracking-wider font-mono bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                          {typeLabel}
                        </span>
                        <span className="text-[10px] leading-none font-bold text-[#203366] font-mono bg-[#FF9D00]/10 border border-[#FF9D00]/25 px-2 py-0.5 rounded-full">
                          {item.count} {item.count === 1 ? t('search.property') : t('search.properties')}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
