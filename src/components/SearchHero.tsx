import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, ChevronDown, Search, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Property, BannerAd } from '../types';

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
    return active.length > 0 ? active : [
      {
        id: 'default-hero',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
        title: 'O Futuro da Arquitetura Premium',
        subtitle: 'Lançamentos imobiliários de última geração com design biofílico e tecnologia inteligente.',
        active: true
      }
    ];
  }, [banners]);

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
    <section className="relative h-screen min-h-[85vh] w-full overflow-hidden flex flex-col items-center justify-center">
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-black/40 to-black/60 pointer-events-none"></div>
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/30 to-[#0a0a0c] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0c] to-transparent pointer-events-none"></div>
      </div>

      {/* Main Container Overly */}
      <div className="relative z-10 w-full max-w-4xl px-6 md:px-8 text-center flex flex-col items-center justify-center">
        {/* Dynamic Banner Advert Titles */}
        <motion.div
          key={'content-' + currentBanner.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl flex flex-col items-center justify-center w-full"
        >
          {/* Region Search Bar above banner texts */}
          <div className="w-full max-w-md mx-auto mb-10 relative z-50">
            <div 
              style={{ backgroundColor: '#ffffff', borderRadius: '10px', height: '52px', fontSize: '16px' }}
              className="flex items-center border border-zinc-200 focus-within:border-primary/80 transition-all duration-300 pl-4 pr-1.5 py-1.5 shadow-2xl backdrop-blur-md"
            >
              <Search className="h-4 w-4 text-zinc-500 shrink-0 animate-pulse" />
              <input
                type="text"
                className="w-full bg-transparent px-3 py-1.5 text-zinc-900 placeholder-zinc-500 outline-none focus:ring-0 font-sans font-medium"
                style={{ fontSize: '16px' }}
                placeholder="Qual cidade ou bairro você busca?"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setQuery('');
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-800 cursor-pointer mr-1.5"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setQuery(searchInput);
                  setShowSuggestions(false);
                  const el = document.getElementById('projects-showcase');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ backgroundColor: '#FFBC00', color: '#203366' }}
                className="hover:scale-105 px-4.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
              >
                Buscar
              </button>
            </div>

            {/* Suggestions Overlay with actual statistics counts */}
            <AnimatePresence>
              {showSuggestions && filteredSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 right-0 mt-2 rounded-2xl border border-zinc-800 bg-black/95 backdrop-blur-md p-1.5 shadow-3xl z-50 text-left overflow-hidden max-h-72 overflow-y-auto"
                >
                  <div className="text-[9px] font-mono font-bold text-zinc-500 tracking-wider px-3 py-1.5 border-b border-zinc-900 uppercase">
                    Regiões Encontradas
                  </div>
                  {filteredSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSearchInput(item.name);
                        setQuery(item.name);
                        setShowSuggestions(false);
                        const el = document.getElementById('projects-showcase');
                        setTimeout(() => {
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }, 80);
                      }}
                      className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-zinc-900 border-b border-zinc-950/20 text-left transition-all cursor-pointer group"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-xs font-bold text-zinc-100 group-hover:text-white">{item.name}</span>
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] leading-none uppercase tracking-wider font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          {item.type}
                        </span>
                        <span className="text-[10px] leading-none font-bold text-primary font-mono bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full">
                          {item.count} {item.count === 1 ? 'imóvel' : 'imóveis'}
                        </span>
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span 
            style={{ color: '#FFBC00' }}
            className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3.5 py-1 text-xs font-semibold tracking-widest uppercase border border-orange-500/20 mb-4 backdrop-blur-sm"
          >
            <Sparkles className="h-3 w-3 animate-pulse text-orange-500" />
            Lançamentos de Alto Padrão
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
            style={{ backgroundColor: '#FFBC00', color: '#203366' }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl font-extrabold text-xs sm:text-sm px-6 py-3.5 hover:shadow-xl transition-all duration-300 active:scale-95 cursor-pointer uppercase tracking-wider border-0"
          >
            Conhecer agora
          </button>

          {/* Scroll Indicator containing ONLY the arrow icon inside the circle */}
          <button
            onClick={() => {
              const el = document.getElementById('projects-showcase');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="mt-8 flex items-center justify-center h-11 w-11 rounded-full bg-black/60 border border-zinc-800 text-zinc-400 hover:text-[#FFBC00] hover:border-[#FFBC00]/80 transition-all duration-300 hover:shadow-lg hover:shadow-[#FFBC00]/15 active:scale-95 group cursor-pointer"
            aria-label="Rolar para pesquisa"
          >
            <ChevronDown className="h-5 w-5 stroke-[2.5] group-hover:translate-y-0.5 transition-transform duration-300" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
