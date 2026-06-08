import React, { useState } from 'react';
import { Bed, Maximize, Car, MapPin, Calendar, Compass, Share2, MessageSquare, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Property, BrandSettings } from '../types';
import { saveLeadToFirestore, saveMessageToFirestore } from '../services/firestoreService';

// Helper formatters supporting flexible raw text/integers inside properties
const formatBedroomsLabel = (val: string | number, suffix: string = 'Qts') => {
  const s = String(val).trim();
  const lower = s.toLowerCase();
  if (lower.includes('qt') || lower.includes('quart') || lower.includes('dorm')) {
    return s;
  }
  return `${s} ${suffix}`;
};

const formatAreaLabel = (val: string | number) => {
  const s = String(val).trim();
  const lower = s.toLowerCase();
  if (lower.includes('m²') || lower.includes('m2') || lower.includes('metr')) {
    return s;
  }
  return `${s} m²`;
};

const formatParkingLabel = (val: string | number, isShort: boolean = true) => {
  const s = String(val).trim();
  const lower = s.toLowerCase();
  if (lower.includes('opcion') || lower === 'opcional') {
    return 'Vaga Opcional';
  }
  if (lower.includes('vag') || lower.includes('vg')) {
    return s;
  }
  const suffix = s === '1' ? (isShort ? 'Vag.' : 'Vaga') : (isShort ? 'Vags.' : 'Vagas');
  return `${s} ${suffix}`;
};

const formatBathroomsLabel = (bedrooms: string | number) => {
  const numVal = Number(bedrooms);
  if (!isNaN(numVal)) {
    return `${numVal + 1} Banh.`;
  }
  const s = String(bedrooms).trim();
  const changed = s.replace(/qts|qt|quartos|quarto|dormitórios|dormitório/gi, 'Banh.').trim();
  if (changed !== s) return changed;
  return `${s} Banh.`;
};

interface PropertyCardProps {
  property: Property;
  allProperties?: Property[];
  key?: React.Key;
  settings?: BrandSettings;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isModalOnly?: boolean;
}

export default function PropertyCard({ property, allProperties = [], settings, isOpen, onOpenChange, isModalOnly = false }: PropertyCardProps) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen = isOpen !== undefined ? isOpen : internalModalOpen;
  const setIsModalOpen = (val: boolean) => {
    if (onOpenChange) {
      onOpenChange(val);
    } else {
      setInternalModalOpen(val);
    }
  };
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [quickQuestion, setQuickQuestion] = useState('');
  const [activePlanIdx, setActivePlanIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [emailFormName, setEmailFormName] = useState('');
  const [emailFormContact, setEmailFormContact] = useState('');
  const [emailFormMsg, setEmailFormMsg] = useState('');
  const [emailFormStatus, setEmailFormStatus] = useState<'idle' | 'success'>('idle');

  // Favorites state hooks & localStorage sync
  const [isFavorited, setIsFavorited] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vivas_favorites');
      if (saved) {
        const list = JSON.parse(saved);
        return Array.isArray(list) && list.includes(property.id);
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  const toggleFavorite = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    try {
      const saved = localStorage.getItem('vivas_favorites');
      let list: string[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          list = parsed;
        }
      }
      
      let nextState = false;
      if (list.includes(property.id)) {
        list = list.filter((id) => id !== property.id);
        nextState = false;
      } else {
        list.push(property.id);
        nextState = true;
      }
      
      localStorage.setItem('vivas_favorites', JSON.stringify(list));
      setIsFavorited(nextState);
      
      // Notify other instances immediately
      window.dispatchEvent(new Event('favorites-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('vivas_favorites');
        if (saved) {
          const list = JSON.parse(saved);
          setIsFavorited(Array.isArray(list) && list.includes(property.id));
        } else {
          setIsFavorited(false);
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    window.addEventListener('favorites-updated', handleUpdate);
    return () => window.removeEventListener('favorites-updated', handleUpdate);
  }, [property.id]);

  // Native share handler
  const handleShare = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const realUrl = `${window.location.origin}${window.location.pathname}?imovel=${property.id}`;
    const shareData = {
      title: property.name,
      text: `${property.projectType || 'Lançamento'} - ${property.neighborhood}, ${property.region}. Veja fotos, plantas e plano de parcelas facilitado!`,
      url: realUrl,
    };
    
    if (navigator.share) {
      navigator.share(shareData)
        .catch((err) => {
          navigator.clipboard?.writeText(realUrl);
          alert("Link do imóvel copiado!");
        });
    } else {
      navigator.clipboard?.writeText(realUrl);
      alert("Link do imóvel copiado para a área de transferência!");
    }
  };

  // Filter for similar properties excluding this one
  const similarProperties = React.useMemo(() => {
    return allProperties
      .filter((p) => p.id !== property.id)
      .sort((a, b) => {
        if (a.neighborhood === property.neighborhood && b.neighborhood !== property.neighborhood) return -1;
        if (a.neighborhood !== property.neighborhood && b.neighborhood === property.neighborhood) return 1;
        if (a.region === property.region && b.region !== property.region) return -1;
        if (a.region !== property.region && b.region === property.region) return 1;
        return 0;
      });
  }, [allProperties, property.id, property.neighborhood, property.region]);

  const floorPlansList = React.useMemo(() => {
    if (property.floorPlans && property.floorPlans.length > 0) {
      return property.floorPlans;
    }
    // Dynamic customized fallback floor plans using property photos if custom ones aren't loaded
    return [
      {
        id: `fp-${property.id}-fallback-1`,
        name: 'Planta Integrada (Premium)',
        image: property.images[1] || 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
        description: `Planta otimizada e pensada com foco na amplitude espacial. Dispõe de ${formatBedroomsLabel(property.bedrooms)} de altíssimo conforto, living social integrado com varanda gourmet, iluminação natural valorizada pelas grandes janelas e acabamento impecável em porcelanato.`,
        area: property.area
      },
      {
        id: `fp-${property.id}-fallback-2`,
        name: 'Planta Concept (Living Expandido)',
        image: property.images[2] || property.images[0] || 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80',
        description: `Opção contemporânea com suíte master estendida com closet integrado, cozinha gourmet em formato ilha, lavabo independente e living central ampliado integrado com a área de lazer de forma fluida. Ideal para recepção e hospitalidade.`,
        area: property.area
      }
    ];
  }, [property]);

  React.useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Currency Formatter helper
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Carousel helpers
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (property.images.length === 0) return;
    setCurrentImgIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (property.images.length === 0) return;
    setCurrentImgIndex((prev) => (prev === property.images.length - 1 ? 0 : prev + 1));
  };

  // Touch handlers for swipe (passar o dedo no slide)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setCurrentImgIndex((prev) => (prev === property.images.length - 1 ? 0 : prev + 1));
    } else if (isRightSwipe) {
      setCurrentImgIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
    }
  };

  // Get Custom Badge Colors
  const getStatusBadge = (status: Property['status']) => {
    switch (status) {
      case 'Lançamento':
        return 'from-orange-500 to-amber-500 text-black font-extrabold';
      case 'Em construção':
        return 'from-amber-600 to-yellow-500 text-black font-extrabold';
      case 'Pronto':
        return 'from-emerald-500 to-teal-600 text-white font-bold';
      case 'Pré-lançamento':
        return 'from-purple-500 to-indigo-600 text-white font-bold';
      default:
        return 'from-zinc-700 to-zinc-800 text-white';
    }
  };

  // Build Whatsapp text link helper
  const getWhatsAppLink = (isConsult = false) => {
    const text = isConsult 
      ? `Olá! Gostaria de consultar mais detalhes e condições exclusivas sobre o lançamento imobiliário "${property.name}" localizado no bairro ${property.neighborhood} (${property.region}).`
      : `Olá! Tenho interesse no lançamento "${property.name}" em ${property.neighborhood}. Valor sugerido: ${formatBRL(property.price)}. Gostaria de maiores informações sobre a Entrada de ${formatBRL(property.downpayment)} e parcelas de ${formatBRL(property.installments)}.`;
    
    const cleanPhone = (settings?.phone || '5547999999999').replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <>
      {!isModalOnly && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="group relative rounded-2xl border border-zinc-205 bg-white overflow-hidden flex flex-col justify-between hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all duration-500"
        >
        {/* Absolute top neon corner decoration */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none rounded-tr-2xl"></div>

        {/* IMAGE SLIDER (passam em slide com o dedo ou setas) */}
        <div 
          className="relative h-64 w-full overflow-hidden bg-zinc-100 group-second select-none touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Header badged overlays above image */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
            {/* Status do Imovel */}
            <span className={`rounded-md bg-gradient-to-r ${getStatusBadge(property.status)} px-2.5 py-1 text-[10px] uppercase tracking-wider shadow-md font-mono`}>
              {property.status}
            </span>

            {/* Data de Entrega */}
            <span className="flex items-center gap-1 rounded-md bg-black/70 px-2.5 py-1 text-[10px] tracking-wide text-zinc-100 border border-white/10 backdrop-blur-sm font-mono font-bold">
              <Calendar className="h-3 w-3 text-[#FFBC00] shrink-0" />
              {property.status === 'Pronto' ? 'Pronto' : `Entrega: ${property.deliveryDate}`}
            </span>
          </div>

          {/* Current Carousel Image */}
          {property.images.length > 0 ? (
            <img
              src={property.images[currentImgIndex]}
              alt={`${property.name} - slide ${currentImgIndex + 1}`}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-zinc-500 bg-zinc-200 font-mono text-xs">
              Sem Imagens Cadastradas
            </div>
          )}

          {/* Carousel Interactive Controls (Visible on hover or mobile) */}
          {property.images.length > 1 && (
            <>
              {/* Left Arrow */}
              <button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-primary hover:text-black hover:scale-105 border border-white/10 transition-all z-20 cursor-pointer"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
              </button>

              {/* Right Arrow */}
              <button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-primary hover:text-black hover:scale-105 border border-white/10 transition-all z-20 cursor-pointer"
                aria-label="Próximo"
              >
                <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              </button>

              {/* Bullet Indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                {property.images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === currentImgIndex ? 'w-4 bg-primary' : 'w-1 bg-zinc-400'
                    }`}
                  ></div>
                ))}
              </div>
            </>
          )}

          {/* Heart button on card image bottom-right */}
          <button
            onClick={toggleFavorite}
            className={`absolute bottom-3 right-3 z-30 h-8 w-8 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border hover:scale-110 active:scale-90 transition-all cursor-pointer ${
              isFavorited 
                ? 'text-red-500 border-red-500/40 bg-red-950/20 shadow-red-500/20 shadow-sm' 
                : 'text-zinc-200 border-white/10 hover:text-red-500 hover:border-red-500'
            }`}
            title={isFavorited ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
          >
            <svg className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'fill-none stroke-current'}`} viewBox="0 0 24 24" strokeWidth="2.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>

        {/* BOTTOM METRICS AND TEXTS */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Project template / type & location subheaders */}
            <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-primary uppercase font-mono mb-1">
              <Compass className="h-3 w-3" />
              {property.projectType}
            </div>

            {/* Nome do Projeto */}
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight leading-snug group-hover:text-primary transition-colors">
              {property.name}
            </h3>

            {/* Bairro */}
            <p className="mt-1 text-sm font-semibold text-zinc-700 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              {property.neighborhood}, {property.region}
            </p>

            {/* Endereço */}
            <p className="mt-1 text-xs text-zinc-550 line-clamp-1 italic">
              {property.address}
            </p>

            {/* Icones Relativos: e.g. 2 Qts, 80m2, 2 Vagas */}
            <div className="my-4 pt-4 border-t border-zinc-200/80 flex justify-between items-center text-xs text-zinc-700 font-mono">
              <span className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1.5 rounded-lg border border-zinc-200/80">
                <Bed className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{formatBedroomsLabel(property.bedrooms)}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1.5 rounded-lg border border-zinc-200/80">
                <Maximize className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{formatAreaLabel(property.area)}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1.5 rounded-lg border border-zinc-200/80">
                <Car className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{formatParkingLabel(property.parkingSpaces)}</span>
              </span>
            </div>
          </div>

          <div className="border-t border-zinc-200/80 pt-4 mt-auto">
            {/* Valor A partir R$ */}
            <div className="mb-3">
              <span className="text-[10px] tracking-widest font-bold text-zinc-500 uppercase font-mono block">
                Investimento Estimado
              </span>
              <div className="text-xl font-extrabold text-zinc-900">
                <span className="text-xs font-semibold text-primary mr-1 font-mono">A partir</span>
                {formatBRL(property.price)}
              </div>
            </div>

            {/* Entrada a partir R$ | Parcela a partir R$ */}
            <div className="grid grid-cols-2 gap-3 mb-4 rounded-xl bg-zinc-50 border border-zinc-250 p-3 text-xs font-mono">
              <div>
                <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase block mb-0.5">
                  Entrada R$
                </span>
                <span className="font-extrabold text-zinc-900 text-[11px] block">
                  {formatBRL(property.downpayment)}
                </span>
              </div>
              <div className="border-l border-zinc-200 pl-3">
                <span className="text-[9px] font-bold tracking-wider text-zinc-550 uppercase block mb-0.5">
                  Mensais R$
                </span>
                <span className="font-extrabold text-[#FFBC00] text-[11px] block">
                  {formatBRL(property.installments)}
                </span>
              </div>
            </div>

            {/* Botao Ver Oferta */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold tracking-wider text-black uppercase cursor-pointer hover:bg-[#e0b92f] hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              <Sparkles className="h-4 w-4 shrink-0 stroke-[2.5]" />
              Ver Oferta
            </button>
          </div>
        </div>
      </motion.div>
      )}

      {/* RENDER MODAL OVERLAY ON CLICK (IMMERSE FULL-SCREEN DETAIL PAGE) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] w-full max-w-full h-full max-h-full sm:h-[100vh] h-[100dvh] bg-white flex flex-col backdrop-blur-md overflow-hidden">
            {/* Opaque backdrop behind immersive layout */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/95 pointer-events-none -z-10"
            ></motion.div>

            {/* 1. STICKY TOP NAVIGATION TAB BAR (MATCHING SCREENSHOT LAYOUT WITH <- BACK TRIGGER AND TABS) */}
            <div className="sticky top-0 z-[120] w-full bg-white/95 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-4 py-3 sm:px-6 shrink-0">
              {/* Left: Close/Back button */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 transition-all cursor-pointer font-bold text-xs sm:text-sm uppercase tracking-wide py-1.5"
              >
                <ChevronLeft className="h-4 w-4 stroke-[3]" />
                <span>Anúncio</span>
              </button>

              {/* Middle: Custom Navigation Scroll Anchors */}
              <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold">
                <button 
                  onClick={() => {
                    const el = document.getElementById('details-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-primary border-b-2 border-primary pb-2 px-1 focus:outline-none cursor-pointer"
                >
                  Dados
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('thumb-gallery');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-zinc-550 hover:text-zinc-950 transition-colors pb-2 px-1 focus:outline-none cursor-pointer"
                >
                  {property.images.length} Fotos
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('location-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-zinc-550 hover:text-zinc-950 transition-colors pb-2 px-1 focus:outline-none cursor-pointer"
                >
                  Mapa
                </button>
              </div>

              {/* Right: Close X trigger */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-100 border border-zinc-250 text-zinc-650 hover:text-zinc-950 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SCROLLABLE INNER CONTAINER (Perfect scroll viewport without jittering fixed bottom navigation) */}
            <div className="flex-1 w-full overflow-y-auto scroll-smooth flex flex-col items-center">

              {/* 2. IMMERSIVE BLEEDING HERO IMAGE AT THE VERY TOP (EDGE-TO-EDGE) */}
            <div className="w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] relative bg-black flex items-center justify-center flex-shrink-0">
              <div 
                className="w-full h-full relative"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {property.images.length > 0 ? (
                  <img
                    src={property.images[currentImgIndex]}
                    alt={property.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover select-none cursor-zoom-in"
                    onClick={() => setIsLightboxOpen(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 font-mono text-xs">Sem Imagens Cadastradas</div>
                )}

                {/* Overlaid share/favorites at top-right of image */}
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                  <button 
                    onClick={handleShare}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-zinc-200 hover:text-primary hover:border-primary transition-all cursor-pointer"
                    title="Compartilhar"
                  >
                    <Share2 className="h-4.5 w-4.5" />
                  </button>
                  <button 
                    onClick={toggleFavorite}
                    className={`h-10 w-10 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border transition-all cursor-pointer ${
                      isFavorited 
                        ? 'text-red-500 border-red-500/40 bg-red-950/20' 
                        : 'text-zinc-200 border-white/15 hover:text-red-500 hover:border-red-500'
                    }`}
                    title={isFavorited ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                  >
                    <svg className={`h-4.5 w-4.5 ${isFavorited ? 'fill-red-500 text-red-500' : 'fill-none stroke-current'}`} viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>

                {/* Status indicator Badge */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 pointer-events-none">
                  <span className={`rounded-md bg-gradient-to-r ${getStatusBadge(property.status)} px-2.5 py-1 text-[10px] uppercase tracking-wider shadow-md font-mono font-bold`}>
                    {property.status}
                  </span>
                </div>

                {/* Left and Right navigation Chevrons */}
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-primary hover:text-black border border-white/10 hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
                      aria-label="Anterior"
                    >
                      <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-primary hover:text-black border border-white/10 hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
                      aria-label="Próximo"
                    >
                      <ChevronRight className="h-5 w-5 stroke-[2.5]" />
                    </button>
                  </>
                )}

                {/* Custom Photo count overlay bottom-right (ChavesNamao style) */}
                {property.images.length > 0 && (
                  <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/15 text-xs text-zinc-100 font-mono flex items-center gap-1.5 shadow-xl select-none">
                    <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>{currentImgIndex + 1}/{property.images.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. SCROLLING PORTRAIT CONTENT WRAPPER */}
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 relative z-10 text-left">
              
              {/* TRANSACTION / PRICE SUB-BAR (MATCHING LAYOUT IN SCREENSHOT 3) */}
              <div className="w-full flex items-center justify-between border-b border-zinc-200 pb-5" id="details-section">
                <div>
                  <span className="text-[10px] sm:text-xs tracking-widest font-bold text-zinc-550 uppercase font-mono block">
                    {property.status === 'Pronto' ? 'Venda / Pronto' : 'A PARTIR DE'}
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#FFBC00] tracking-tight font-mono mt-0.5">
                    {formatBRL(property.price)}
                  </div>
                  <p className="mt-1 text-xs text-zinc-650 uppercase font-mono tracking-wider font-semibold">
                    {property.status === 'Pronto' ? 'Pronto para Morar' : `Previsão ${property.deliveryDate}`}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    const el = document.getElementById('simulador-box');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="rounded-xl bg-[#FFBC00] hover:bg-[#E0A500] text-black font-extrabold text-xs sm:text-sm px-5 py-3 sm:px-6 py-3.5 transition-all active:scale-95 shadow-lg shadow-[#FFBC00]/10 cursor-pointer uppercase tracking-wider"
                  style={{ backgroundColor: '#FFBC00' }}
                >
                  Ver parcelas
                </button>
              </div>

              {/* SPEC GRID (CHAVES NAMAO 5-COLUMN METRIC TILES) */}
              {(() => {
                const hasSuites = property.suites !== undefined && 
                  property.suites !== null && 
                  property.suites !== '' && 
                  property.suites !== 0 && 
                  property.suites !== '0' && 
                  String(property.suites).toLowerCase().trim() !== 'sem suítes' && 
                  String(property.suites).toLowerCase().trim() !== 'sem suite' && 
                  String(property.suites).toLowerCase().trim() !== 'não';

                return (
                  <div className={`grid grid-cols-2 ${hasSuites ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-3 mt-1.5`}>
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-center flex flex-col items-center justify-center hover:bg-zinc-100 transition-all">
                      <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Área útil</span>
                      <span className="text-sm font-extrabold text-zinc-900 mt-1.5 font-mono">{formatAreaLabel(property.area)}</span>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-center flex flex-col items-center justify-center hover:bg-zinc-100 transition-all">
                      <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Quartos</span>
                      <span className="text-sm font-extrabold text-zinc-900 mt-1.5 font-mono">{formatBedroomsLabel(property.bedrooms, 'Quartos')}</span>
                    </div>
                    {hasSuites && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-center flex flex-col items-center justify-center hover:bg-zinc-100 transition-all">
                        <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Suítes</span>
                        <span className="text-sm font-extrabold text-zinc-900 mt-1.5 font-mono">{formatBedroomsLabel(property.suites!, 'Suítes')}</span>
                      </div>
                    )}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-center flex flex-col items-center justify-center hover:bg-zinc-100 transition-all">
                      <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Banheiros</span>
                      <span className="text-sm font-extrabold text-zinc-900 mt-1.5 font-mono">{formatBathroomsLabel(property.bedrooms)}</span>
                    </div>
                    <div className={`bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-center flex flex-col items-center justify-center hover:bg-zinc-100 transition-all ${hasSuites ? 'col-span-2 sm:col-span-1' : 'col-span-2 sm:col-span-1'}`}>
                      <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Vagas / Garagem</span>
                      <span className="text-sm font-extrabold text-zinc-900 mt-1.5 font-mono">{formatParkingLabel(property.parkingSpaces, false)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* HORIZONTAL THUMBNAIL PHOTO SLIDER */}
              {property.images.length > 0 && (
                <div className="w-full text-left mt-1" id="thumb-gallery">
                  <p className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 mb-2 font-semibold">
                    Galeria Completa ({property.images.length} fotos do imóvel)
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-zinc-100 scrollbar-thumb-zinc-300">
                    {property.images.map((imgUrl, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImgIndex(index)}
                        className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                          index === currentImgIndex
                            ? 'border-primary shadow-lg scale-95'
                            : 'border-zinc-200 hover:border-zinc-350 hover:scale-95'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`${property.name} thumb ${index + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MAIN TITLE, BADGE CATEGORY, AND LONG DESCRIPTION */}
              <div className="text-left py-4 border-t border-zinc-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#FFBC00]/10 border border-[#FFBC00]/20 text-[#FFBC00] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md font-mono">
                    {property.projectType || 'Lançamento'}
                  </span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-[11px] text-zinc-600 font-mono">Ref do Produto: VIVASC-{property.id}</span>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-black text-zinc-900 uppercase tracking-tight leading-snug">
                  {property.projectType || 'Imóvel'} à venda com {property.bedrooms} quartos no {property.neighborhood}, {property.region}
                </h3>

                <div className="mt-5 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#FFBC00] font-mono">Descrição detalhada</h4>
                  {property.detailedDescription ? (
                    <div className="text-sm text-zinc-700 leading-relaxed font-sans whitespace-pre-line">
                      {property.detailedDescription}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-700 leading-relaxed font-sans">
                      Este espetacular empreendimento localizado no prestigiado bairro {property.neighborhood} ({property.region}) redefine os conceitos de sofisticação, conforto e liquidez na região de Santa Catarina. O projeto arquitetônico traz design de linhas marcantes futuristas, além de contar com áreas com metragens de {property.area}m², contendo {property.bedrooms} amplos dormitórios e infraestrutura completa de lazer, segurança monitorada por IA e áreas comuns de finíssimo acabamento. Oferece simulação simplificada com as melhores taxas do mercado.
                    </p>
                  )}
                </div>

                <p className="mt-6 text-[10px] text-zinc-500 font-mono">
                  Última atualização: 18/05/2026 às 10:00h | Código: VIVASC-{property.id}
                </p>
              </div>

              {/* INTERACTIVE FLOOR PLANS (CAMPO DE PLANTAS DISPONÍVEIS) */}
              {floorPlansList && floorPlansList.length > 0 && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 sm:p-6 text-left space-y-5 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  
                  <div>
                    <h4 className="text-md sm:text-lg font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                      <Compass className="h-5 w-5 text-orange-500" />
                      Plantas Disponíveis
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1">
                      Explore as opções de plantas humanizadas e distribuições internas disponíveis para este empreendimento.
                    </p>
                  </div>

                  {/* Floor Plan selector tabs */}
                  <div className="flex flex-wrap gap-2 text-xs border-b border-zinc-250 pb-3">
                    {floorPlansList.map((plan, idx) => {
                      const isSelected = idx === (activePlanIdx >= floorPlansList.length ? 0 : activePlanIdx);
                      return (
                        <button
                          key={plan.id || idx}
                          onClick={() => setActivePlanIdx(idx)}
                          className={`px-4 py-2.5 rounded-xl font-bold tracking-wide uppercase text-[11px] transition-all duration-300 cursor-pointer ${
                            isSelected
                              ? 'bg-[#FFBC00] text-black shadow-lg shadow-[#FFBC00]/25 border border-transparent'
                              : 'bg-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-305 border border-zinc-300'
                          }`}
                        >
                          {plan.name} {plan.area ? `(${formatAreaLabel(plan.area)})` : ''}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active plan container */}
                  {floorPlansList[activePlanIdx >= floorPlansList.length ? 0 : activePlanIdx] && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-2 bg-white p-4 rounded-xl border border-zinc-250 items-center">
                      {/* Left: Interactive Image with lightbox hover effect */}
                      <div className="md:col-span-7 space-y-2">
                        <div 
                          className="relative aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 cursor-zoom-in group"
                          onClick={() => {
                            // Expand plant image inside standard main slider or fallback to open in tab
                            const matchedImgUrl = floorPlansList[activePlanIdx >= floorPlansList.length ? 0 : activePlanIdx].image;
                            window.open(matchedImgUrl, '_blank', 'referrerPolicy=no-referrer');
                          }}
                        >
                          <img
                            src={floorPlansList[activePlanIdx >= floorPlansList.length ? 0 : activePlanIdx].image}
                            alt={floorPlansList[activePlanIdx >= floorPlansList.length ? 0 : activePlanIdx].name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain p-2 group-hover:scale-102 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-black/80 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest text-white border border-white/10 flex items-center gap-1">
                              Clique para ampliar
                            </span>
                          </div>

                          {floorPlansList[activePlanIdx >= floorPlansList.length ? 0 : activePlanIdx].area && (
                            <div 
                              className="absolute top-2 left-2 bg-zinc-900/90 border border-zinc-750 px-2.5 py-1 rounded text-[10px] font-mono font-extrabold text-orange-450"
                              style={{ color: '#fefeff' }}
                            >
                              {formatAreaLabel(floorPlansList[activePlanIdx >= floorPlansList.length ? 0 : activePlanIdx].area || '')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Descritivo */}
                      <div className="md:col-span-5 space-y-3 flex flex-col justify-center">
                        <div>
                          <span className="text-[10px] font-bold text-[#FFBC00] tracking-widest uppercase font-mono">
                            Layout Premium Selecionado
                          </span>
                          <h5 className="text-sm sm:text-md font-bold text-zinc-900 mt-1">
                            {floorPlansList[activePlanIdx >= floorPlansList.length ? 0 : activePlanIdx].name}
                          </h5>
                        </div>

                        <p className="text-xs text-zinc-700 leading-relaxed font-sans bg-zinc-55 p-3.5 rounded-lg border border-zinc-200">
                          {floorPlansList[activePlanIdx >= floorPlansList.length ? 0 : activePlanIdx].description}
                        </p>

                        <div className="flex gap-4 text-[11px] font-mono font-bold text-zinc-500 px-1">
                          {floorPlansList[activePlanIdx >= floorPlansList.length ? 0 : activePlanIdx].area && (
                            <div>
                              <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Área da Privativa</span>
                              <span className="text-zinc-900 text-xs">{formatAreaLabel(floorPlansList[activePlanIdx >= floorPlansList.length ? 0 : activePlanIdx].area || '')}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-zinc-500 block text-[9px] uppercase font-semibold">Unidade Referencial</span>
                            <span className="text-zinc-900 text-xs">{property.projectType || 'Apartamento'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

                       {/* DETAILED FINANCIAL SIMULATOR BLOCK */}
              <div id="simulador-box" className="bg-zinc-50 p-5 sm:p-6 rounded-2xl border border-zinc-200 text-left space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
                  <Compass className="h-4.5 w-4.5 text-[#FFBC00]" />
                  <h3 className="text-xs sm:text-sm tracking-widest font-extrabold text-zinc-900 uppercase font-mono">
                    Plano de Pagamento Facilitado
                  </h3>
                </div>
                
                <div className="space-y-4 pt-1 font-mono">
                  {/* Valor Fina */}
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                    <span className="text-xs text-zinc-550 uppercase tracking-wide">Valor de Lista</span>
                    <span className="text-xl sm:text-2xl font-black text-zinc-900 font-mono">
                      {formatBRL(property.price)}
                    </span>
                  </div>

                  {/* 1. Entrada */}
                  <div className="flex items-start justify-between border-b border-zinc-200 pb-2.5">
                    <div>
                      <span className="text-xs text-zinc-800 uppercase font-bold block">1. Entrada</span>
                      <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">Ato ou sinal facilitado ({property.downpaymentPct !== undefined ? property.downpaymentPct : 10}%)</span>
                    </div>
                    <span className="text-sm font-extrabold text-zinc-900">
                      {formatBRL(property.downpayment)}
                    </span>
                  </div>

                  {/* 2. Mensais */}
                  <div className="flex items-start justify-between border-b border-zinc-200 pb-2.5">
                    <div>
                      <span className="text-xs text-zinc-800 uppercase block font-bold">2. Mensais ({property.installmentsPct !== undefined ? property.installmentsPct : 60}%)</span>
                      <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">Prazo direto da construtora ({property.installmentsCount || 60} parcelas)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-[#FFBC00] block">
                        {formatBRL(property.installments)}
                      </span>
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold mt-0.5">Por mês</span>
                    </div>
                  </div>

                  {/* 3. Reforços (Balões) */}
                  <div className="flex items-start justify-between border-b border-zinc-200 pb-2.5">
                    <div>
                      <span className="text-xs text-zinc-800 uppercase block font-bold">3. Reforços / Balões ({property.reintegrationPct !== undefined ? property.reintegrationPct : 20}%)</span>
                      <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">Investimento em {property.reintegrationCount || 5} parcelas anuais/semestrais</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-zinc-900 block">
                        {formatBRL(property.reintegrationValue !== undefined ? property.reintegrationValue : Math.round(property.price * 0.2 / (property.reintegrationCount || 5)))}
                      </span>
                      <span className="text-[9px] text-zinc-500 block font-bold mt-0.5">{property.reintegrationCount || 5}x Anuais</span>
                    </div>
                  </div>

                  {/* 4. Entrega das Chaves */}
                  <div className="flex items-start justify-between pb-1.5">
                    <div>
                      <span className="text-xs text-zinc-800 uppercase block font-bold">4. Nas Chaves ({property.keysPct !== undefined ? property.keysPct : 10}%)</span>
                      <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">Entrega efetiva do imóvel ou financiamento bancário</span>
                    </div>
                    <span className="text-sm font-extrabold text-zinc-900">
                      {formatBRL(property.keysValue !== undefined ? property.keysValue : Math.round(property.price * 0.1))}
                    </span>
                  </div>
                </div>

                <div className="bg-orange-500/5 border border-orange-500/20 p-3 rounded-lg text-[10px] text-zinc-800 leading-normal font-sans block">
                  💡 <strong>Condição Facilitada VivaSC:</strong> Fluxo calculado de forma integrada ({((property.downpaymentPct || 10) + (property.installmentsPct || 60) + (property.reintegrationPct || 20) + (property.keysPct || 10))}%). Fluxo e parcelamento direto com a incorporadora altamente maleável conforme sua necessidade de liquidez.
                </div>

                {/* Simulated Payment WhatsApp redirection button */}
                <a
                  href={`https://wa.me/${(settings?.phone || '5547999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá! Estou visualizando o lançamento "${property.name}" (Ref: ${property.id}) e gostaria de receber uma simulação de pagamento personalizada.\n\nValor: ${formatBRL(property.price)}\nEntrada de: ${formatBRL(property.downpayment)}\nParcelas de: ${formatBRL(property.installments)}/mês`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-sm uppercase tracking-wider py-4 transition-all text-center cursor-pointer select-none active:scale-[0.99] mt-3 hover:shadow-lg hover:shadow-green-500/15"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.197 1.488 4.792 1.489 5.4 0 9.794-4.39 9.797-9.786.002-2.613-1.015-5.07-2.868-6.924C16.483 2.08 14.025 1.06 11.4 1.06 6.002 1.06 1.61 5.45 1.607 10.843c0 1.698.446 3.353 1.295 4.81l-.827 3.02 3.111-.817.039.02l.042.022zM18.006 14.77c-.31-.155-1.84-.907-2.124-1.01-.284-.105-.49-.156-.697.155-.207.31-.802 1.01-.983 1.218-.18.208-.363.233-.673.078-1.554-.775-2.63-1.34-3.666-3.123-.272-.468.272-.434.782-1.448.086-.172.043-.323-.021-.453-.065-.13-.532-1.282-.73-1.758-.192-.463-.385-.4-.532-.407h-.453c-.156 0-.41.058-.625.295-.215.237-.822.802-.822 1.954 0 1.152.837 2.267.954 2.422.117.155 1.647 2.515 3.99 3.528 1.83.792 2.51.782 3.407.641.447-.07 1.84-.75 2.1-1.474.26-.723.26-1.344.18-1.474-.077-.13-.284-.207-.595-.363z"/>
                  </svg>
                  <span>Simular Pagamento no WhatsApp</span>
                </a>
              </div>

              {/* VIDEO ANNEXED BY PROPERTY ADMIN PANEL */}
              {property.videoUrl && (
                <div id="video-section" className="bg-zinc-50 p-5 sm:p-6 rounded-2xl border border-zinc-200 text-left space-y-4">
                  <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
                    <svg className="h-5 w-5 text-[#FFBC00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    <h3 className="text-xs sm:text-sm tracking-widest font-extrabold text-zinc-900 uppercase font-mono">
                      Apresentação em Vídeo
                    </h3>
                  </div>
                  
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner border border-zinc-200">
                    {(() => {
                      const videoUrl = property.videoUrl.trim();
                      const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                      const match = videoUrl.match(ytRegExp);
                      
                      if (match && match[2].length === 11) {
                        const ytId = match[2];
                        return (
                          <iframe
                            className="w-full h-full border-0"
                            src={`https://www.youtube.com/embed/${ytId}`}
                            title="Apresentação do Imóvel"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            referrerPolicy="no-referrer"
                          />
                        );
                      }
                      
                      const vimeoRegExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
                      const vimeoMatch = videoUrl.match(vimeoRegExp);
                      if (vimeoMatch && vimeoMatch[3]) {
                        return (
                          <iframe
                            src={`https://player.vimeo.com/video/${vimeoMatch[3]}`}
                            className="w-full h-full border-0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            title="Apresentação do Imóvel"
                            referrerPolicy="no-referrer"
                          />
                        );
                      }

                      return (
                        <video 
                          src={videoUrl} 
                          controls 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        >
                          Seu navegador não suporta a tag de vídeo. Como alternativa, por favor clique no link abaixo para visualizar.
                        </video>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* FAST QUESTIONS ENQUIRY WIDGET (SCREENSHOT 2 REAL IMPLEMENTATION) */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 sm:p-6 text-left space-y-4">
                <h4 className="text-md sm:text-lg font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Perguntas rápidas para o anunciante
                </h4>
                <p className="text-xs text-zinc-650 leading-relaxed">
                  Faça perguntas rápidas ao anunciante ou simplesmente escreva a sua própria pergunta.
                </p>

                {/* Question Suggestion Bubles */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    "Eu posso visitar?",
                    "Aceita permuta?",
                    "Me retorne no whatsapp!",
                    "Tenho interesse, está disponível?"
                  ].map((questionText, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuickQuestion(questionText)}
                      className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-all border ${
                        quickQuestion === questionText 
                          ? 'bg-primary border-primary text-black font-semibold'
                          : 'bg-zinc-100 border-zinc-250 text-zinc-750 hover:bg-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      {questionText}
                    </button>
                  ))}
                </div>

                {/* Quick inquiry typing textarea */}
                <div className="relative">
                  <textarea
                    value={quickQuestion}
                    onChange={(e) => setQuickQuestion(e.target.value.slice(0, 200))}
                    placeholder="Escreva sua pergunta..."
                    className="w-full bg-white border border-zinc-250 rounded-xl p-4 text-xs tracking-wide text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-primary/40 focus:bg-zinc-50 transition-all font-sans min-h-[90px] resize-none"
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] text-zinc-500 font-mono">
                    {quickQuestion.length}/200
                  </div>
                </div>

                {/* Submitting Enquiry Red Button */}
                <a
                  href={`https://wa.me/${(settings?.phone || '5547999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá! Estou visualizando o lançamento inovador "${property.name}" (Ref do Portal VIVASC-${property.id}). Pergunta rápida: ${quickQuestion || "Tenho interesse, gostaria de simular o fluxo"}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-650 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 transition-all text-center cursor-pointer select-none active:scale-[0.99]"
                >
                  <span>Enviar pergunta</span>
                </a>
              </div>

              {/* CONTACT FORM EMAIL WIDGET (o email que será para contato de formulários) */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 sm:p-6 text-left space-y-4">
                <h4 className="text-md sm:text-lg font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-primary text-base font-mono">@</span>
                  Fale por E-mail
                </h4>
                <p className="text-xs text-zinc-650 leading-relaxed">
                  Deseja enviar uma mensagem direta por e-mail? Escreva abaixo para falar com o anunciante.
                </p>

                {emailFormStatus === 'success' ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center space-y-2">
                    <p className="text-xs font-semibold text-emerald-600">Mensagem gerada com sucesso!</p>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Seu cliente de e-mail foi aberto para envio seguro para: <strong className="text-zinc-800">{settings?.email || 'comercial.vivasc@gmail.com'}</strong>.
                    </p>
                    <button
                      onClick={() => setEmailFormStatus('idle')}
                      className="px-3 py-1 rounded-lg bg-zinc-200 border border-zinc-300 hover:bg-zinc-250 text-[10px] uppercase font-bold text-zinc-800 transition-all cursor-pointer"
                    >
                      Enviar outra mensagem
                    </button>
                  </div>
                ) : (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!emailFormName || !emailFormMsg) return;
                      
                      const idLead = 'lead_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                      const idMsg = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                      
                      saveLeadToFirestore({
                        id: idLead,
                        name: emailFormName,
                        contact: emailFormContact,
                        message: emailFormMsg,
                        propertyId: property.id,
                        propertyName: property.name,
                        status: 'Novo',
                        createdAt: new Date().toISOString()
                      }).catch((err) => console.error('Firestore CRM lead failure', err));

                      saveMessageToFirestore({
                        id: idMsg,
                        name: emailFormName,
                        contact: emailFormContact,
                        message: emailFormMsg,
                        propertyId: property.id,
                        createdAt: new Date().toISOString()
                      }).catch((err) => console.error('Firestore CRM msg failure', err));

                      const subject = encodeURIComponent(`Interesse no Lançamento VIVASC-${property.id}: ${property.name}`);
                      const body = encodeURIComponent(
                        `Nome do Interessado: ${emailFormName}\n` +
                        `Contato (Email/WhatsApp): ${emailFormContact}\n\n` +
                        `Mensagem:\n${emailFormMsg}`
                      );
                      
                      window.location.href = `mailto:${settings?.email || 'comercial.vivasc@gmail.com'}?subject=${subject}&body=${body}`;
                      setEmailFormStatus('success');
                      setEmailFormName('');
                      setEmailFormContact('');
                      setEmailFormMsg('');
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <input
                        type="text"
                        required
                        value={emailFormName}
                        onChange={(e) => setEmailFormName(e.target.value)}
                        placeholder="Seu Nome Completo"
                        className="w-full bg-white border border-zinc-250 rounded-xl px-4 py-2.5 text-xs text-zinc-850 placeholder-zinc-400 focus:outline-none focus:border-primary/40 focus:bg-zinc-50 transition-all"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        value={emailFormContact}
                        onChange={(e) => setEmailFormContact(e.target.value)}
                        placeholder="Seu E-mail ou Telefone"
                        className="w-full bg-white border border-zinc-250 rounded-xl px-4 py-2.5 text-xs text-zinc-850 placeholder-zinc-400 focus:outline-none focus:border-primary/40 focus:bg-zinc-50 transition-all"
                      />
                    </div>
                    <div>
                      <textarea
                        required
                        value={emailFormMsg}
                        onChange={(e) => setEmailFormMsg(e.target.value)}
                        placeholder="Estou interessado neste lançamento, gostaria de receber mais informações e detalhes de financiamento..."
                        className="w-full bg-white border border-zinc-250 rounded-xl p-4 text-xs text-zinc-850 placeholder-zinc-400 focus:outline-none focus:border-primary/40 focus:bg-zinc-50 transition-all min-h-[80px] resize-none"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 transition-all text-center cursor-pointer select-none active:scale-[0.99]"
                    >
                      Enviar Mensagem por E-mail
                    </button>
                  </form>
                )}
              </div>

              {/* LOCATION BANNER CARD (WITH RED PIN HOVERABLE CARD IN SCREENSHOTS) */}
              <div 
                id="location-section"
                onClick={() => {
                  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.neighborhood}, ${property.region}, SC, Brasil`)}`;
                  window.open(mapUrl, '_blank', 'referrerPolicy=no-referrer');
                }}
                className="bg-zinc-50 border border-zinc-200 shadow-md rounded-2xl p-4 sm:p-5 flex items-center justify-between hover:border-[#FFBC00]/40 hover:bg-zinc-100 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-105 transition-all shrink-0">
                    <MapPin className="h-5.5 w-5.5 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-zinc-900 uppercase tracking-wider">Localização do Imóvel</h4>
                    <p className="text-xs text-zinc-600 mt-0.5 font-mono">{property.neighborhood}, {property.region} / SC</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-primary transition-colors shrink-0" />
              </div>

              {/* SUGGESTED RECOMMENDED CAROUSEL / GRID IN REGION (SCREENSHOT 1 HIGH FIDELITY RESEMBLANCE) */}
              {similarProperties.length > 0 && (
                <div className="w-full text-left space-y-4 border-t border-zinc-200 pt-8" id="recommended-showcase">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md sm:text-lg font-extrabold text-zinc-900 uppercase tracking-tight leading-none">
                      Anúncios na região de {property.neighborhood}!
                    </h4>
                    <span className="text-[10px] font-mono uppercase bg-zinc-100 border border-zinc-250 px-2.5 py-1 rounded text-zinc-600">Excelente Oportunidade</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {similarProperties.slice(0, 2).map((simProp) => (
                      <div 
                        key={simProp.id}
                        onClick={() => {
                          const contactText = `Olá! Vi o anúncio recomendado de "${simProp.name}" na região de ${simProp.neighborhood} e gostaria de simular!`;
                          window.open(`https://wa.me/5547999999999?text=${encodeURIComponent(contactText)}`, '_blank', 'referrerPolicy=no-referrer');
                        }}
                        className="flex flex-col bg-zinc-50 border border-zinc-250 rounded-2xl overflow-hidden hover:border-primary/40 transition-all cursor-pointer group/sim relative relative"
                      >
                        <div className="h-40 w-full relative overflow-hidden bg-black shrink-0">
                          <img 
                            src={simProp.images[0] || ""} 
                            alt={simProp.name} 
                            className="w-full h-full object-cover group-hover/sim:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded text-[9px] font-mono font-black text-primary uppercase tracking-wider">
                            {simProp.projectType}
                          </span>
                        </div>
                        <div className="p-4 space-y-1.5 flex-grow flex flex-col justify-between">
                          <div>
                            <h5 className="font-extrabold text-sm sm:text-base text-zinc-900 group-hover/sim:text-primary transition-colors leading-snug line-clamp-1 uppercase">{simProp.name}</h5>
                            <p className="text-[11px] text-zinc-650 flex items-center gap-1 font-mono">
                              <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                              {simProp.neighborhood}, {simProp.region} / SC
                            </p>
                          </div>
                          <div>
                            <div className="text-md font-black text-[#FFBC00] font-mono pt-1">
                              {formatBRL(simProp.price)}
                            </div>
                            <div className="text-[10px] text-zinc-600 font-mono pt-1 border-t border-zinc-200 mt-2 flex justify-between">
                              <span>{formatBedroomsLabel(simProp.bedrooms, 'Quartos')}</span>
                              <span>{formatAreaLabel(simProp.area)}</span>
                              <span>{formatParkingLabel(simProp.parkingSpaces, false)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Espaçador de segurança para que o conteúdo não fique sob o menu fixo inferior de contato */}
              <div className="h-24 w-full shrink-0" aria-hidden="true" />

            </div>

            </div>

            {/* 4. FIXED FOOTER BAR - Pinned perfectly at screen bottom for both Web & Mobile */}
            <div className="shrink-0 w-full bg-white/95 backdrop-blur-md border-t border-zinc-200 px-3 sm:px-4 py-3 pb-safe z-[130] shadow-2xl">
              <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
                {/* Telephone call outline item */}
                <a
                  href={`tel:${(settings?.phone || '5547999999999').replace(/\D/g, '')}`}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-250 bg-zinc-100 text-zinc-750 hover:text-zinc-950 hover:border-primary active:scale-90 transition-all cursor-pointer shadow-lg shrink-0"
                  title="Ligar para consultor"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.622c0-1.272.83-2.36 2.05-2.822.67-.253 1.417-.22 2.05.1l3.528 1.764c.67.336.985 1.092.774 1.76l-.772 2.47a1.125 1.125 0 00.316 1.086l4.636 4.636a1.125 1.125 0 001.086.316l2.47-.772a1.125 1.125 0 011.76.774l1.764 3.528c.32.633.32 1.38-.1 2.05-1.01 1.6-2.87 2.25-4.63 1.5l-2.05-.85a18.335 18.335 0 01-8.586-8.586l-.85-2.05c-.75-1.76-.1-3.63 1.5-4.63z" />
                  </svg>
                </a>

                {/* center Contatar trigger scrolling to simulator table */}
                <button
                  onClick={() => {
                    const el = document.getElementById('simulador-box');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex-1 flex h-12 items-center justify-center rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-extrabold text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-md active:scale-[0.98] transition-all"
                >
                  Contatar
                </button>

                {/* right Green WhatsApp direct item containing WhatsApp SVG/icon */}
                <a
                  href={getWhatsAppLink(false)}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="flex-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs uppercase tracking-wider text-white shrink-0 cursor-pointer shadow-md shadow-emerald-600/10 active:scale-[0.98] transition-all"
                >
                  <MessageSquare className="h-4 w-4 stroke-[2.5]" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN LIGHTBOX FOR IMAGE ZOOMING */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div className="fixed inset-0 z-[150] flex flex-col justify-between p-4 md:p-6 select-none bg-black/95 backdrop-blur-md">
            {/* Top Bar with counter and close */}
            <div className="w-full flex items-center justify-between text-white z-10">
              <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                Visualização Ampliada • {currentImgIndex + 1} de {property.images.length}
              </span>
              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all text-white cursor-pointer"
                title="Fechar Zoom"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Central stage area */}
            <div className="flex-1 w-full max-w-5xl mx-auto flex items-center justify-center relative my-4">
              {property.images.length > 0 ? (
                <motion.img
                  key={currentImgIndex}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  src={property.images[currentImgIndex]}
                  alt={`${property.name} zoom`}
                  referrerPolicy="no-referrer"
                  className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
                />
              ) : null}

              {/* Prev and Next navigation arrows inside Lightbox */}
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
                    aria-label="Imagem Anterior"
                  >
                    <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
                    aria-label="Próxima Imagem"
                  >
                    <ChevronRight className="h-6 w-6 stroke-[2.5]" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom mini-gallery selector inside Lightbox */}
            {property.images.length > 1 && (
              <div className="w-full text-center z-10 max-w-3xl mx-auto">
                <div className="flex gap-2 justify-center overflow-x-auto py-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                  {property.images.map((imgUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImgIndex(index)}
                      className={`relative flex-shrink-0 w-16 h-11 rounded-md overflow-hidden border transition-all duration-200 cursor-pointer ${
                        index === currentImgIndex
                          ? 'border-[#FFBC00] ring-1 ring-[#FFBC00] scale-95 shadow-lg'
                          : 'border-white/10 opacity-60 hover:opacity-100 hover:scale-95'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`${property.name} zoom thumb ${index + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
