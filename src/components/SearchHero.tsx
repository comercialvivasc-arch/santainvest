import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Property, BannerAd } from '../types';

interface SearchHeroProps {
  properties: Property[];
  banners: BannerAd[];
  onOpenProperty?: (id: string) => void;
}

export default function SearchHero({
  properties,
  banners,
  onOpenProperty,
}: SearchHeroProps) {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

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
          className="max-w-2xl flex flex-col items-center justify-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3.5 py-1 text-xs font-semibold tracking-widest text-[#FF6600] uppercase border border-orange-500/20 mb-4 backdrop-blur-sm">
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

          {/* Button "Conhecer agora" (only if currentBanner.link is set) */}
          {currentBanner.link && (
            <button
              onClick={() => {
                if (onOpenProperty && currentBanner.link) {
                  onOpenProperty(currentBanner.link);
                }
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FF6600] text-black font-extrabold text-xs sm:text-sm px-6 py-3.5 hover:bg-[#e65c00] hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 active:scale-95 cursor-pointer uppercase tracking-wider shadow-lg shadow-orange-500/10 border-0"
            >
              Conhecer agora
            </button>
          )}

          {/* Scroll Indicator containing ONLY the arrow icon inside the circle */}
          <button
            onClick={() => {
              const el = document.getElementById('search-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="mt-8 flex items-center justify-center h-11 w-11 rounded-full bg-black/60 border border-zinc-800 text-zinc-400 hover:text-[#FF6600] hover:border-[#FF6600]/80 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/15 active:scale-95 group cursor-pointer"
            aria-label="Rolar para pesquisa"
          >
            <ChevronDown className="h-5 w-5 stroke-[2.5] group-hover:translate-y-0.5 transition-transform duration-300" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
