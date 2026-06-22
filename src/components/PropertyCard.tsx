import React, { useState } from 'react';
import { Bed, Maximize, Car, MapPin, Calendar, Compass, Share2, MessageSquare, ChevronLeft, ChevronRight, X, Sparkles, CheckCircle, Upload, FileUp, FileText, Check, ShieldCheck, UserCheck, HelpCircle, User, Briefcase, Coins, Trash2, Eye, Phone, BookOpen, ArrowLeft, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Property, BrandSettings } from '../types';
import { saveLeadToFirestore, saveMessageToFirestore } from '../services/firestoreService';
import Footer from './Footer';

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

const McmvBadge = ({ customLogoUrl, className = "h-8" }: { customLogoUrl?: string; className?: string }) => {
  if (customLogoUrl) {
    return (
      <img 
        src={customLogoUrl} 
        alt="Selo Minha Casa Minha Vida" 
        className="object-contain shrink-0" 
        style={{ width: "105px", height: "52px" }}
      />
    );
  }
  
  return (
    <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 shadow-sm px-3 py-1.5 rounded-lg shrink-0 select-none">
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,4 3,12 6,12 6,21 18,21 18,12 21,12" fill="#004797" />
        <polygon points="12,4 3,12 12,12" fill="#0D9F4F" />
        <polygon points="12,4 21,12 12,12" fill="#FFCC00" />
        <rect x="10.5" y="15" width="3" height="6" fill="#FFFFFF" />
      </svg>
      <div className="flex flex-col leading-[1.1] text-[8.5px] font-black tracking-tight uppercase select-none text-left font-sans">
        <span className="text-emerald-600 font-extrabold">Minha Casa</span>
        <span className="text-blue-700 font-extrabold">Minha Vida</span>
      </div>
    </div>
  );
};

interface PropertyCardProps {
  property: Property;
  allProperties?: Property[];
  key?: React.Key;
  settings?: BrandSettings;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isModalOnly?: boolean;
  onNavigateToProperty?: (id: string | null) => void;
  onNavigateToAdmin?: () => void;
}

export default function PropertyCard({ 
  property, 
  allProperties = [], 
  settings, 
  isOpen, 
  onOpenChange, 
  isModalOnly = false,
  onNavigateToProperty,
  onNavigateToAdmin
}: PropertyCardProps) {
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
  const [emailFormStatus, setEmailFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Pre-approval form states
  const [paName, setPaName] = useState('');
  const [paCpf, setPaCpf] = useState('');
  const [paEstadoCivil, setPaEstadoCivil] = useState('Solteiro(a)');
  const [paProfissao, setPaProfissao] = useState('');
  const [paEmail, setPaEmail] = useState('');
  const [paTelefone, setPaTelefone] = useState('');
  const [paRendaBruta, setPaRendaBruta] = useState('');
  const [paRegimeTrabalho, setPaRegimeTrabalho] = useState<'CLT' | 'Autônomo'>('CLT');
  const [paComporRenda, setPaComporRenda] = useState(false);
  const [paHasEntrada, setPaHasEntrada] = useState(true);
  const [paEntrada, setPaEntrada] = useState('');
  const [paHasParcela, setPaHasParcela] = useState(true);
  const [paParcela, setPaParcela] = useState('');

  // Attached documents base64 objects
  const [paDocRgCpf, setPaDocRgCpf] = useState<{ name: string; size: number; base64: string } | null>(null);
  const [paDocResidencia, setPaDocResidencia] = useState<{ name: string; size: number; base64: string } | null>(null);
  const [paDocRenda, setPaDocRenda] = useState<{ name: string; size: number; base64: string } | null>(null);

  const [paStatus, setPaStatus] = useState<'idle' | 'success' | 'submitting'>('idle');
  const [paError, setPaError] = useState<string | null>(null);
  const [isPaModalOpen, setIsPaModalOpen] = useState(false);

  // Helper to read and convert file to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'rgCpf' | 'residencia' | 'renda') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reject files > 3MB to avoid excessive Firestore document payload
    if (file.size > 3 * 1024 * 1024) {
      alert('Arquivo muito grande! Escolha um arquivo de no máximo 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      const fileObj = { name: file.name, size: file.size, base64: base64String };
      if (field === 'rgCpf') setPaDocRgCpf(fileObj);
      if (field === 'residencia') setPaDocResidencia(fileObj);
      if (field === 'renda') setPaDocRenda(fileObj);
    };
    reader.onerror = () => {
      console.error('Erro ao ler arquivo para base64.');
    };
    reader.readAsDataURL(file);
  };

  // Reset internal sliding & interaction states when entering another property detail pages
  React.useEffect(() => {
    setCurrentImgIndex(0);
    setActivePlanIdx(0);
    setQuickQuestion('');
    setEmailFormName('');
    setEmailFormContact('');
    setEmailFormMsg('');
    setEmailFormStatus('idle');

    // Reset pre-approval form states
    setPaName('');
    setPaCpf('');
    setPaEstadoCivil('Solteiro(a)');
    setPaProfissao('');
    setPaEmail('');
    setPaTelefone('');
    setPaRendaBruta('');
    setPaRegimeTrabalho('CLT');
    setPaComporRenda(false);
    setPaHasEntrada(true);
    setPaEntrada('');
    setPaHasParcela(true);
    setPaParcela('');
    setPaDocRgCpf(null);
    setPaDocResidencia(null);
    setPaDocRenda(null);
    setPaStatus('idle');
    setPaError(null);
  }, [property.id]);

  // Favorites state hooks & localStorage sync
  const [isFavorited, setIsFavorited] = useState<boolean>(() => {
    try {
      // Migrate legacy favorites if they exist for continuous support
      let saved = localStorage.getItem('vivasc_favorites');
      if (!saved) {
        const legacy = localStorage.getItem('vivas_favorites');
        if (legacy) {
          localStorage.setItem('vivasc_favorites', legacy);
          saved = legacy;
        }
      }
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
      const saved = localStorage.getItem('vivasc_favorites');
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
      
      localStorage.setItem('vivasc_favorites', JSON.stringify(list));
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
        const saved = localStorage.getItem('vivasc_favorites');
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

  const getCleanPhone = () => {
    let num = (settings?.phone || '5547999999999').replace(/\D/g, '');
    if (num && !num.startsWith('55') && (num.length === 10 || num.length === 11)) {
      num = '55' + num;
    }
    return num;
  };

  // Build Whatsapp text link helper
  const getWhatsAppLink = (isConsult = false) => {
    const text = isConsult 
      ? `Olá! Gostaria de consultar mais detalhes e condições exclusivas sobre o lançamento imobiliário "${property.name}" localizado no bairro ${property.neighborhood} (${property.region}).`
      : `Olá! Tenho interesse no lançamento "${property.name}" em ${property.neighborhood}. Valor sugerido: ${formatBRL(property.price)}. Gostaria de maiores informações sobre a Entrada de ${formatBRL(property.downpayment)} e parcelas de ${formatBRL(property.installments)}.`;
    
    return `https://wa.me/${getCleanPhone()}?text=${encodeURIComponent(text)}`;
  };

  const getCatalogWhatsAppLink = () => {
    const text = `Olá, me interessou este projeto e gostaria de receber o Catálogo do empreendimento ${property.name} (Ref: ${property.id}). Aguardo contato.`;
    return `https://wa.me/${getCleanPhone()}?text=${encodeURIComponent(text)}`;
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
              <Calendar className="h-3 w-3 text-[#FF9D00] shrink-0" />
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
            <div className="flex items-center justify-between text-[12px] mb-1">
              <div className="flex items-center gap-1 font-bold tracking-wider text-primary uppercase font-mono">
                <Compass className="h-3 w-3" />
                {property.projectType}
              </div>
              {property.isMcmv && (
                <McmvBadge customLogoUrl={property.mcmvLogoUrl} className="h-6" />
              )}
            </div>

            {/* Nome do Projeto */}
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight leading-[1.15] mt-1 group-hover:text-primary transition-colors">
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
                <span className="font-extrabold text-zinc-900 text-[14px] block">
                  {formatBRL(property.downpayment)}
                </span>
              </div>
              <div className="border-l border-zinc-200 pl-3">
                <span className="text-[9px] font-bold tracking-wider text-zinc-550 uppercase block mb-0.5">
                  Mensais R$
                </span>
                <span className="font-extrabold text-[#FF9D00] text-[14px] block">
                  {formatBRL(property.installments)}
                </span>
              </div>
            </div>

            {/* Botao Ver Oferta */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold tracking-wider uppercase cursor-pointer hover:bg-[#e0b92f] hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              style={{ color: '#203366' }}
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
            <div className="sticky top-0 z-[120] w-full bg-white/95 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-4 sm:px-6 shrink-0 shadow-sm">
              {/* Left: Close/Back button */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex items-center gap-1.5 transition-all cursor-pointer font-black text-xs uppercase tracking-wider py-2 px-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl border border-zinc-350 shadow-sm text-[#203366]"
                title="Sair e voltar ao portal"
              >
                <ChevronLeft className="h-4 w-4 stroke-[3.5] text-[#e52521]" />
                <span>SAIR</span>
              </button>

              {/* Middle: Custom Navigation Scroll Anchors */}
              <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-bold">
                <button 
                  onClick={() => {
                    const el = document.getElementById('details-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-primary border-b-2 border-primary pb-1 px-1 focus:outline-none cursor-pointer"
                >
                  Dados
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('thumb-gallery');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-zinc-550 hover:text-zinc-950 transition-colors pb-1 px-1 focus:outline-none cursor-pointer"
                >
                  {property.images.length} Fotos
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('location-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-zinc-550 hover:text-zinc-950 transition-colors pb-1 px-1 focus:outline-none cursor-pointer"
                >
                  Mapa
                </button>
              </div>

              {/* Right: Close X trigger */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-9 px-3 flex items-center justify-center gap-1 rounded-xl bg-[#e52521] border border-[#e52521] text-white hover:bg-red-700 hover:scale-[1.02] transition-all cursor-pointer shadow-sm font-extrabold text-xs uppercase tracking-wider shrink-0"
                title="Fechar anúncio"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
                <span className="hidden xs:inline">FECHAR</span>
              </button>
            </div>

            {/* SCROLLABLE INNER CONTAINER (Perfect scroll viewport without jittering fixed bottom navigation) */}
            <div className="flex-1 w-full overflow-y-auto scroll-smooth flex flex-col items-center pb-24">

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
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#FF9D00] tracking-tight font-mono mt-0.5" style={{ fontSize: '33px' }}>
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
                  className="rounded-xl bg-[#FF9D00] hover:bg-[#E08A00] text-black font-extrabold text-xs sm:text-sm px-5 py-3 sm:px-6 py-3.5 transition-all active:scale-95 shadow-lg shadow-[#FF9D00]/10 cursor-pointer uppercase tracking-wider"
                  style={{ backgroundColor: '#FF9D00', color: '#203366' }}
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
                        onClick={() => {
                          setCurrentImgIndex(index);
                          setIsLightboxOpen(true);
                        }}
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
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="bg-[#FF9D00]/10 border border-[#FF9D00]/20 text-[#FF9D00] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md font-mono">
                    {property.projectType || 'Lançamento'}
                  </span>
                  {property.isMcmv && (
                    <McmvBadge customLogoUrl={property.mcmvLogoUrl} className="h-7" />
                  )}
                  <span className="text-zinc-400">•</span>
                  <span className="text-[11px] text-zinc-600 font-mono">Ref do Produto: VIVASC-{property.id}</span>
                </div>
                
                {/* Nome do Empreendimento */}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#203366] tracking-tight mb-2 uppercase leading-[1.1]">
                  {property.name}
                </h2>
                
                <h3 className="text-md sm:text-lg font-bold text-zinc-600 uppercase tracking-tight leading-snug">
                  {property.projectType || 'Imóvel'} à venda com {property.bedrooms} quartos no {property.neighborhood}, {property.region}
                </h3>

                <div className="mt-5 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#FF9D00] font-mono">Descrição detalhada</h4>
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
                              ? 'bg-[#FF9D00] text-black shadow-lg shadow-[#FF9D00]/25 border border-transparent'
                              : 'bg-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-305 border border-zinc-300'
                          }`}
                          style={isSelected ? { color: '#203366' } : undefined}
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
                          <span className="text-[10px] font-bold text-[#FF9D00] tracking-widest uppercase font-mono">
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

               <div id="simulador-box" className="bg-zinc-50 p-5 sm:p-6 rounded-2xl border border-zinc-200 text-left space-y-4">
                <div className="border-b border-zinc-200 pb-3.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4.5 w-4.5 text-[#FF9D00]" />
                    <h3 translate="no" className="notranslate text-xs sm:text-sm tracking-widest font-extrabold text-zinc-900 uppercase font-mono">
                      Valores iniciais de pagamento
                    </h3>
                  </div>
                  {property.availableUnits !== undefined && property.availableUnits > 0 && (
                    <div className="pt-0.5">
                      {property.availableUnits <= 10 ? (
                        <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-250/50 px-2.5 py-1 rounded-lg text-[10px] font-sans font-extrabold uppercase tracking-wide animate-pulse">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="h-3.5 w-3.5 text-red-600 fill-current animate-bounce"
                          >
                            <path 
                              style={{ color: '#fff400', borderColor: '#0f0f0f' }} 
                              d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" 
                            />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <span>Apenas {property.availableUnits} {property.availableUnits === 1 ? 'unidade restante!' : 'unidades restantes!'}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-250/50 px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 relative flex font-semibold">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span>{property.availableUnits} unidades disponíveis</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-4 pt-1 font-mono">
                  {/* Valor Fina */}
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                    <span className="text-xs text-zinc-550 uppercase tracking-wide">UNIDADES A PARTIR DE</span>
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
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-zinc-900 block">
                        {formatBRL(property.downpayment)}
                      </span>
                      {property.downpaymentInstallmentsCount !== undefined && property.downpaymentInstallmentsCount > 1 && (
                        <span className="text-[12px] text-zinc-550 block font-bold mt-0.5">
                          {property.downpaymentInstallmentsCount}x de {formatBRL(Math.round(property.downpayment / property.downpaymentInstallmentsCount))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Mensais */}
                  <div className="flex items-start justify-between border-b border-zinc-200 pb-2.5">
                    <div>
                      <span className="text-xs text-zinc-800 uppercase block font-bold">2. Mensais ({property.installmentsPct !== undefined ? property.installmentsPct : 60}%)</span>
                      <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">Prazo direto da construtora ({property.installmentsCount || 60} parcelas)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-[#FF9D00] block">
                        {formatBRL(property.installments)}
                      </span>
                      <span className="text-[11px] text-zinc-500 block uppercase font-bold mt-0.5">Por mês</span>
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
                      <span className="text-[11px] text-zinc-500 block font-bold mt-0.5">{property.reintegrationCount || 5}x Anuais</span>
                    </div>
                  </div>

                  {/* 4. Entrega das Chaves */}
                  <div className={`flex items-start justify-between pb-1.5 ${property.cefContractFee !== undefined && property.cefContractFee > 0 ? 'border-b border-zinc-200 pb-2.5' : ''}`}>
                    <div>
                      <span className="text-xs text-zinc-800 uppercase block font-bold">4. Nas Chaves ({property.keysPct !== undefined ? property.keysPct : 10}%)</span>
                      <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">Entrega efetiva do imóvel ou financiamento bancário</span>
                    </div>
                    <span className="text-sm font-extrabold text-zinc-900">
                      {formatBRL(property.keysValue !== undefined ? property.keysValue : Math.round(property.price * 0.1))}
                    </span>
                  </div>

                  {/* 5. Adesão de contrato CEF (only shown if configured) */}
                  {property.cefContractFee !== undefined && property.cefContractFee > 0 && (
                    <div className="flex items-start justify-between pb-1.5 pt-1">
                      <div>
                        <span className="text-xs text-zinc-800 uppercase block font-bold">5. Adesão Contrato CEF</span>
                        <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">Taxa de adesão do contrato CEF</span>
                      </div>
                      <span className="text-sm font-extrabold text-zinc-900">
                        {formatBRL(property.cefContractFee)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-orange-500/5 border border-orange-500/20 p-3 rounded-lg text-[10px] text-zinc-800 leading-normal font-sans block">
                  {property.tableConditionDescription ? (
                    <span className="whitespace-pre-line">💡 <strong>Condição de tabela:</strong> {property.tableConditionDescription}</span>
                  ) : (
                    <>
                      💡 <strong>Condição de tabela:</strong> Monte uma condição de pagamento flexível conforme sua capacidade financeira, sujeita à análise da construtora. Valores, disponibilidade e condições podem ser alterados sem aviso prévio. Consulte e confirme as informações no momento da proposta.
                    </>
                  )}
                </div>

                {/* Simulated Payment WhatsApp redirection button */}
                <a
                  href={`https://wa.me/${getCleanPhone()}?text=${encodeURIComponent(
                    (() => {
                      const rValue = property.reintegrationValue !== undefined 
                        ? property.reintegrationValue 
                        : Math.round(property.price * 0.2 / (property.reintegrationCount || 5));
                      const rCount = property.reintegrationCount || 5;
                      
                      const kValue = property.keysValue !== undefined 
                        ? property.keysValue 
                        : Math.round(property.price * 0.1);

                      const entradaDetail = property.downpaymentInstallmentsCount !== undefined && property.downpaymentInstallmentsCount > 1 
                        ? ` (parcelada em ${property.downpaymentInstallmentsCount}x de ${formatBRL(Math.round(property.downpayment / property.downpaymentInstallmentsCount))})` 
                        : '';

                      const formattedReforcos = `Reforços/Balões: ${rCount}x de ${formatBRL(rValue)}`;
                      const formattedChaves = `Nas chaves: ${formatBRL(kValue)}`;
                      const formattedCef = property.cefContractFee !== undefined && property.cefContractFee > 0 
                        ? `Adesão Conta CEF: ${formatBRL(property.cefContractFee)}` 
                        : '';

                      return [
                        `Olá! Estou visualizando o lançamento "${property.name}" (Ref: ${property.id}) e gostaria de receber uma simulação de pagamento personalizada.`,
                        '',
                        `Valor: ${formatBRL(property.price)}`,
                        `Entrada de: ${formatBRL(property.downpayment)}${entradaDetail}`,
                        `Parcelas de: ${formatBRL(property.installments)}/mês`,
                        formattedReforcos,
                        formattedChaves,
                        formattedCef
                      ].filter(Boolean).join('\n');
                    })()
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-sm uppercase tracking-wider py-4 transition-all text-center cursor-pointer select-none active:scale-[0.99] mt-3 hover:shadow-lg hover:shadow-green-500/15"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.197 1.488 4.792 1.489 5.4 0 9.794-4.39 9.797-9.786.002-2.613-1.015-5.07-2.868-6.924C16.483 2.08 14.025 1.06 11.4 1.06 6.002 1.06 1.61 5.45 1.607 10.843c0 1.698.446 3.353 1.295 4.81l-.827 3.02 3.111-.817.039.02l.042.022zM18.006 14.77c-.31-.155-1.84-.907-2.124-1.01-.284-.105-.49-.156-.697.155-.207.31-.802 1.01-.983 1.218-.18.208-.363.233-.673.078-1.554-.775-2.63-1.34-3.666-3.123-.272-.468.272-.434.782-1.448.086-.172.043-.323-.021-.453-.065-.13-.532-1.282-.73-1.758-.192-.463-.385-.4-.532-.407h-.453c-.156 0-.41.058-.625.295-.215.237-.822.802-.822 1.954 0 1.152.837 2.267.954 2.422.117.155 1.647 2.515 3.99 3.528 1.83.792 2.51.782 3.407.641.447-.07 1.84-.75 2.1-1.474.26-.723.26-1.344.18-1.474-.077-.13-.284-.207-.595-.363z"/>
                  </svg>
                  <span>SIMULAR PAGAMENTO</span>
                </a>
              </div>

              {/* VIDEO ANNEXED BY PROPERTY ADMIN PANEL */}
              {property.videoUrl && (
                <div id="video-section" className="bg-zinc-50 p-5 sm:p-6 rounded-2xl border border-zinc-200 text-left space-y-4">
                  <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
                    <svg className="h-5 w-5 text-[#FF9D00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

              {/* CADASTRO DE PRÉ-APROVAÇÃO WIDGET */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 sm:p-6 text-left space-y-4 shadow-sm scroll-mt-20">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-200 pb-3">
                  <div className="space-y-1">
                    <h4 className="text-md sm:text-lg font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      Análise para Pré-Aprovação
                    </h4>
                    <p className="text-[11px] text-zinc-500 leading-normal">
                      Inicie seu cadastro de crédito imobiliário de forma segura e 100% criptografada direta com os bancos.
                    </p>
                  </div>
                  <div className="shrink-0">
                    {paStatus === 'success' ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-xl">
                        <Check className="h-3 w-3 stroke-[3]" /> Enviado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-[#FF9D00]/10 border border-[#FF9D00]/30 text-zinc-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg font-mono">
                        GRATUITO
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-650 leading-relaxed font-semibold">
                  Com esse cadastro, nossa equipe de correspondentes bancários credenciados irá simular e buscar a melhor taxa de financiamento para você em instituições como Caixa, Itaú, Bradesco e Santander.
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsPaModalOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF9D00] hover:bg-[#E08A00] text-black font-extrabold text-xs uppercase tracking-wider py-3.5 px-6 transition-all text-center cursor-pointer select-none active:scale-[0.99] shadow-sm hover:shadow-md"
                  >
                    <Sparkles className="h-4 w-4 text-black shrink-0" />
                    <span>{paStatus === 'success' ? 'Ver ou Refazer Cadastro' : 'Saber mais e simular agora'}</span>
                  </button>
                </div>
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
                    <p className="text-xs font-semibold text-emerald-600">Mensagem enviada com sucesso!</p>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Sua mensagem foi enviada de forma 100% segura para: <strong className="text-zinc-800">{settings?.email || 'comercial.vivasc@gmail.com'}</strong>. Nossa equipe entrará em contato em breve!
                    </p>
                    <button
                      onClick={() => setEmailFormStatus('idle')}
                      className="px-3 py-1 rounded-lg bg-zinc-200 border border-zinc-300 hover:bg-zinc-250 text-[10px] uppercase font-bold text-zinc-800 transition-all cursor-pointer"
                    >
                      Enviar outra mensagem
                    </button>
                  </div>
                ) : emailFormStatus === 'submitting' ? (
                  <div className="bg-zinc-100 border border-zinc-200 rounded-xl p-6 text-center space-y-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-semibold text-zinc-750 animate-pulse">Enviando mensagem...</p>
                    <p className="text-[10px] text-zinc-550 leading-relaxed">
                      Aguarde, estamos enviando seus dados diretamente aos corretores responsáveis...
                    </p>
                  </div>
                ) : emailFormStatus === 'error' ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center space-y-2">
                    <p className="text-xs font-semibold text-red-650">Erro ao enviar</p>
                    <p className="text-[10px] text-zinc-550 leading-relaxed">
                      Não foi possível transmitir a mensagem automaticamente por e-mail.
                    </p>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setEmailFormStatus('idle')}
                        className="px-3 py-1.5 rounded-lg bg-zinc-200 border border-zinc-300 hover:bg-zinc-250 text-[10px] uppercase font-bold text-zinc-800 transition-all cursor-pointer"
                      >
                        Tentar Novamente
                      </button>
                      <a
                        href={`mailto:${settings?.email || 'comercial.vivasc@gmail.com'}?subject=${encodeURIComponent(`Interesse no Lançamento VIVASC-${property.id}: ${property.name}`)}&body=${encodeURIComponent(`Nome do Interessado: ${emailFormName}\nContato: ${emailFormContact}\nMensagem:\n${emailFormMsg}`)}`}
                        className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-[10px] uppercase font-bold text-black transition-all text-center cursor-pointer"
                      >
                        Enviar Manualmente
                      </a>
                    </div>
                  </div>
                ) : (
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!emailFormName || !emailFormMsg) return;
                      
                      setEmailFormStatus('submitting');
                      
                      const idLead = 'lead_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                      const idMsg = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                      
                      try {
                        await saveLeadToFirestore({
                          id: idLead,
                          name: emailFormName,
                          contact: emailFormContact,
                          message: emailFormMsg,
                          propertyId: property.id,
                          propertyName: property.name,
                          status: 'Novo',
                          createdAt: new Date().toISOString()
                        });

                        await saveMessageToFirestore({
                          id: idMsg,
                          name: emailFormName,
                          contact: emailFormContact,
                          message: emailFormMsg,
                          propertyId: property.id,
                          createdAt: new Date().toISOString()
                        }, false);

                        setEmailFormStatus('success');
                        setEmailFormName('');
                        setEmailFormContact('');
                        setEmailFormMsg('');
                      } catch (err) {
                        console.error('Email form CRM submission error', err);
                        setEmailFormStatus('error');
                      }
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
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF9D00] hover:bg-[#E08A00] text-black font-extrabold text-xs uppercase tracking-wider py-3.5 transition-all text-center cursor-pointer select-none active:scale-[0.99]"
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
                className="bg-zinc-50 border border-zinc-200 shadow-md rounded-2xl p-4 sm:p-5 flex items-center justify-between hover:border-[#FF9D00]/40 hover:bg-zinc-100 transition-all cursor-pointer group"
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
                          if (onNavigateToProperty) {
                            onNavigateToProperty(simProp.id);
                          } else {
                            const params = new URLSearchParams(window.location.search);
                            params.set('imovel', simProp.id);
                            window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                            window.dispatchEvent(new Event('popstate'));
                          }
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
                            <div className="text-md font-black text-[#FF9D00] font-mono pt-1">
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

            </div>

            </div>

            {/* 4. FIXED FOOTER BAR - Pinned perfectly at screen bottom for both Web & Mobile */}
            <div className="shrink-0 w-full bg-white/95 backdrop-blur-md border-t border-zinc-200 px-3 sm:px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] z-[130] shadow-2xl">
              <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
                {/* Telephone call items with updated Lucide Phone icon */}
                <a
                  href={`tel:${(settings?.phone || '5547999999999').replace(/\D/g, '')}`}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-250 bg-zinc-100 text-zinc-700 hover:text-zinc-950 hover:border-primary active:scale-90 transition-all cursor-pointer shadow-lg shrink-0"
                  title="Ligar para consultor"
                >
                  <Phone className="h-5 w-5 text-zinc-800 stroke-[2.5]" />
                </a>

                {/* New Catálogo Button with WhatsApp Link and requested customized text */}
                <a
                  href={getCatalogWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="flex-1 flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#FF9D00] hover:bg-[#E08A00] font-extrabold text-xs uppercase tracking-wider text-black shrink-0 cursor-pointer shadow-md shadow-[#FF9D00]/10 active:scale-[0.98] transition-all px-2 text-center"
                  title="Solicitar Catálogo Completo"
                >
                  <BookOpen className="h-4 w-4 stroke-[3]" />
                  <span>Catálogo</span>
                </a>

                {/* Green WhatsApp direct item containing WhatsApp icon */}
                <a
                  href={getWhatsAppLink(false)}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="flex-1 flex h-12 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs uppercase tracking-wider text-white shrink-0 cursor-pointer shadow-md shadow-emerald-600/10 active:scale-[0.98] transition-all px-2 text-center"
                >
                  <MessageSquare className="h-4 w-4 stroke-[2.5]" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL PARA CADASTRO DE PRÉ-APROVAÇÃO */}
      <AnimatePresence>
        {isPaModalOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden">
            {/* Modal Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaModalOpen(false)}
              className="absolute inset-0 bg-black/50 cursor-pointer"
            />

            {/* Modal Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-zinc-200 z-10 text-zinc-900"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#FF9D00]/10 flex items-center justify-center text-[#FF9D00] shrink-0">
                    <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-zinc-950 uppercase tracking-wider leading-none">
                      Análise para Pré-Aprovação
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-zinc-500 font-semibold mt-1.5 leading-none">
                      Formulário de Crédito Criptografado &bull; Gratuito e Seguro
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPaModalOpen(false)}
                  className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 transition-all cursor-pointer font-extrabold text-xs uppercase tracking-wider border border-zinc-200 shadow-sm"
                  title="Fechar cadastro"
                >
                  <X className="h-4 w-4 stroke-[3] text-[#e52521]" />
                  <span>Sair</span>
                </button>
              </div>

              {/* Scrollable Form Box */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-white flex-1 scrollbar-thin text-left">
                {paStatus === 'success' ? (
                  <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-2xl p-6 text-center space-y-4">
                    <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                      <Check className="h-6 w-6 stroke-[3]" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-zinc-900 text-sm uppercase tracking-wider">Cadastro Enviado com Sucesso!</h5>
                      <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
                        Sua solicitação de pré-análise cadastral e financeira foi salva com êxito! Uma cópia de auditoria e aviso foi gerada e enviada via e-mail para <strong className="text-zinc-800">{settings?.email || 'comercial.vivasc@gmail.com'}</strong>.
                      </p>
                      <p className="text-[11px] text-zinc-400 max-w-sm mx-auto mt-2 italic bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                        Dica: Nossos corretores licenciados já receberam seus dados no painel e iniciarão a análise técnica no banco. O prazo médio de retorno é de até 24 horas úteis.
                      </p>
                    </div>

                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPaStatus('idle')}
                        className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-850 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer border border-zinc-300"
                      >
                        Novo Simulado
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPaModalOpen(false)}
                        className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Fechar Tela
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!paName || !paCpf || !paEmail || !paTelefone || !paRendaBruta) {
                      setPaError('Por favor, preencha todos os campos obrigatórios identificados com asterisco (*).');
                      return;
                    }
                    
                    setPaStatus('submitting');
                    setPaError(null);

                    try {
                      const idLead = 'lead_pa_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                      
                      const leadObj = {
                        id: idLead,
                        name: paName,
                        contact: `${paEmail} • ${paTelefone}`,
                        message: `🚀 Novo cadastro automático de pré-aprovação de crédito no portal. Renda informada: R$ ${paRendaBruta} (${paRegimeTrabalho}).`,
                        propertyId: property.id,
                        propertyName: property.name,
                        status: 'Novo' as const,
                        createdAt: new Date().toISOString(),
                        preApprovalData: {
                          cpf: paCpf,
                          estadoCivil: paEstadoCivil,
                          profissao: paProfissao,
                          email: paEmail,
                          telefone: paTelefone,
                          rendaBruta: paRendaBruta,
                          regimeTrabalho: paRegimeTrabalho,
                          comporRenda: paComporRenda,
                          entradaDisponivel: paHasEntrada ? paEntrada : 'Não possuo entrada',
                          parcelaDisponivel: paHasParcela ? paParcela : 'Não possuo parcela',
                          ...(paDocRgCpf ? { rgCpfDoc: paDocRgCpf } : {}),
                          ...(paDocResidencia ? { residenciaDoc: paDocResidencia } : {}),
                          ...(paDocRenda ? { rendaDoc: paDocRenda } : {})
                        }
                      };

                      // Save to Firestore
                      await saveLeadToFirestore(leadObj);

                      // Also generate a Message object for CRM logs
                      const idMsg = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                      await saveMessageToFirestore({
                        id: idMsg,
                        name: paName,
                        contact: paTelefone,
                        message: `Nova pré-aprovação imobiliária preenchida. Renda R$ ${paRendaBruta}, Entrada: ${paHasEntrada ? paEntrada : 'Não'}, Parcela: ${paHasParcela ? paParcela : 'Não'}.`,
                        propertyId: property.id,
                        createdAt: new Date().toISOString()
                      }, false).catch((e) => console.error('Error saving message log', e));

                      // Construct the beautiful client-side mailto fallback link to send copy
                      const destEmail = settings?.email || 'comercial.vivasc@gmail.com';
                      const emailSubject = `[PÁ CORRETOR] Pré-Aprovação de Crédito - ${paName} - ${property.name}`;
                      const emailBody = 
                        `Olá Corretor, segue uma fita cadastral de simulação imobiliária preenchida pelo cliente:\n\n` +
                        `=== DADOS DA ANÁLISE DE CRÉDITO DE PARCERIA ===\n` +
                        `Empreendimento de Referência: ${property.name} (Ref: ${property.id})\n\n` +
                        `---------------- DADOS PESSOAIS ----------------\n` +
                        `* Nome Completo: ${paName}\n` +
                        `* CPF: ${paCpf}\n` +
                        `* Estado Civil: ${paEstadoCivil}\n` +
                        `* Profissão: ${paProfissao}\n` +
                        `* E-mail: ${paEmail}\n` +
                        `* Telefone/WhatsApp: ${paTelefone}\n\n` +
                        `--------------- FINANCIAMENTO/RENDA ---------------\n` +
                        `* Regime de Trabalho: ${paRegimeTrabalho}\n` +
                        `* Renda Familiar Bruta Mensal: R$ ${paRendaBruta}\n` +
                        `  (Conforme renda total bruta sem abatimentos)\n` +
                        `* Deseja compor renda familiar com cônjuge/outra pessoa? ${paComporRenda ? 'SIM' : 'NÃO'}\n` +
                        `* Entrada disponível: ${paHasEntrada ? `R$ ${paEntrada}` : 'NÃO POSSUI VALOR DE ENTRADA'}\n` +
                        `* Parcela mensal disponível: ${paHasParcela ? `R$ ${paParcela}` : 'NÃO TEM DISPONIBILIDADE DE PARCELA'}\n\n` +
                        `--------------- DOCUMENTOS EM ANEXO ---------------\n` +
                        `* Cópia do RG/CPF: ${paDocRgCpf ? `Vinculado (${paDocRgCpf.name})` : 'Não enviado'}\n` +
                        `* Comprovante de Residência: ${paDocResidencia ? `Vinculado (${paDocResidencia.name})` : 'Não enviado'}\n` +
                        `* Comprovante de Renda (IR/Holerite/INSS): ${paDocRenda ? `Vinculado (${paDocRenda.name})` : 'Não enviado'}\n\n` +
                        `📢 Atenção Corretor: Os arquivos anexados acima em formato Base64 foram enviados de forma segura e criptografada para o seu banco de dados Firebase. Você pode baixá-los a qualquer momento clicando no botão "Donwload" na fita cadastral deste Lead no seu Painel de Administrador.\n\n` +
                        `Enviado automaticamente pelo portal imobiliário ${settings?.brandName || 'Meu Primeiro Imóvel'}.`;

                      window.location.href = `mailto:${destEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                      
                      setPaStatus('success');
                    } catch (err: any) {
                      console.error('Pre-approval write failure', err);
                      setPaError('Ocorreu um erro ao enviar sua proposta para a nuvem. Tentando abrir cliente de email direto...');
                      setPaStatus('idle');
                    }
                  }} className="space-y-4">
                    
                    {paError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-650">
                        {paError}
                      </div>
                    )}

                    {/* Step 1: Info Pessoal */}
                    <div className="space-y-3">
                      <div className="text-[10px] uppercase tracking-widest font-mono text-[#203366] font-extrabold flex items-center gap-1.5">
                        <User className="h-4 w-4 text-primary" />
                        1. Informações Pessoais
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-500 block mb-1">
                            Nome Completo *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: João da Silva Santos"
                            value={paName}
                            onChange={(e) => setPaName(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl px-3 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-sans"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-500 block mb-1">
                            CPF (Somente Números) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: 000.000.000-00"
                            value={paCpf}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length > 11) val = val.slice(0, 11);
                              if (val.length > 9) {
                                val = val.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
                              } else if (val.length > 6) {
                                val = val.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
                              } else if (val.length > 3) {
                                val = val.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
                              }
                              setPaCpf(val);
                            }}
                            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl px-3 py-2.5 text-xs text-zinc-850 placeholder-zinc-400 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-500 block mb-1">
                            Estado Civil *
                          </label>
                          <select
                            value={paEstadoCivil}
                            onChange={(e) => setPaEstadoCivil(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl px-3 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-primary/40 focus:bg-white transition-all cursor-pointer font-sans"
                          >
                            <option value="Solteiro(a)">Solteiro(a)</option>
                            <option value="Casado(a) (Comunhão de Bens)">Casado(a) (Comunhão Parcial)</option>
                            <option value="Casado(a) (Comunhão Universal)">Casado(a) (Comunhão Universal)</option>
                            <option value="União Estável">União Estável</option>
                            <option value="Divorciado(a)">Divorciado(a)</option>
                            <option value="Viúvo(a)">Viúvo(a)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-500 block mb-1">
                            Profissão *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Engenheiro Civil, Gerente, etc"
                            value={paProfissao}
                            onChange={(e) => setPaProfissao(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl px-3 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-500 block mb-1">
                            E-mail de Contato *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="Ex: seuemail@provedor.com"
                            value={paEmail}
                            onChange={(e) => setPaEmail(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl px-3 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-sans"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-500 block mb-1">
                            Telefone / WhatsApp *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="Ex: (47) 99999-9999"
                            value={paTelefone}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length > 11) val = val.slice(0, 11);
                              if (val.length > 10) {
                                val = val.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
                              } else if (val.length > 6) {
                                val = val.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
                              } else if (val.length > 2) {
                                val = val.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
                              }
                              setPaTelefone(val);
                            }}
                            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl px-3 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-primary/40 focus:bg-white transition-all font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Info Financeiras */}
                    <div className="space-y-3 pt-3 border-t border-zinc-150">
                      <div className="text-[10px] uppercase tracking-widest font-mono text-[#203366] font-extrabold flex items-center gap-1.5">
                        <Coins className="h-4 w-4 text-primary" />
                        2. Informações Financeiras & Renda
                      </div>

                      {/* Regime de Trabalho select buttons */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-500 block">
                          Regime Ativo de Trabalho *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setPaRegimeTrabalho('CLT')}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border select-none cursor-pointer ${
                              paRegimeTrabalho === 'CLT'
                                ? 'bg-[#FF9D00] border-[#FF9D00] text-black shadow-sm'
                                : 'bg-zinc-50 border-zinc-250 text-zinc-700 hover:bg-zinc-100'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            Regime CLT
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaRegimeTrabalho('Autônomo')}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border select-none cursor-pointer ${
                              paRegimeTrabalho === 'Autônomo'
                                ? 'bg-[#FF9D00] border-[#FF9D00] text-black shadow-sm'
                                : 'bg-zinc-50 border-zinc-250 text-zinc-700 hover:bg-zinc-100'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            Autônomo
                          </button>
                        </div>
                      </div>

                      {/* Renda Bruta Mensal */}
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <label className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-550 block">
                            Renda Bruta Mensal Aproximada *
                          </label>
                          <span className="text-[8px] text-zinc-450 tracking-tight font-bold select-none">
                            renda familiar sem abatimentos
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-zinc-400">
                            R$
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="Ex: 8.500,00"
                            value={paRendaBruta}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length > 8) val = val.slice(0, 8);
                              if (val) {
                                const float = parseFloat(val) / 100;
                                setPaRendaBruta(float.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                              } else {
                                setPaRendaBruta('');
                              }
                            }}
                            className="w-full bg-zinc-50 border border-zinc-250 rounded-xl pl-10 pr-3 py-2.5 text-xs text-zinc-855 font-bold focus:outline-none focus:border-[#FF9D00]/40 focus:bg-white transition-all font-mono"
                          />
                        </div>
                      </div>

                      {/* Checkbox item for family compositions */}
                      <button
                        type="button"
                        onClick={() => setPaComporRenda(!paComporRenda)}
                        className="w-full flex items-center gap-3 bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-left cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={paComporRenda}
                          onChange={(e) => setPaComporRenda(e.target.checked)}
                          className="h-4 w-4 rounded text-[#FF9D00] accent-[#FF9D00] bg-white border-zinc-300 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <p className="text-xs font-bold text-zinc-800">Desejo compor renda imobiliária</p>
                          <p className="text-[10px] text-zinc-450">Somar rendimentos próprios com cônjuges ou parentes.</p>
                        </div>
                      </button>

                      {/* ENTRADA APROXIMADA */}
                      <div className="border border-zinc-200 rounded-xl bg-zinc-50 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-700 block">
                            Entrada Aproximada Disponível
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setPaHasEntrada(!paHasEntrada);
                              if (paHasEntrada) setPaEntrada('');
                            }}
                            className={`px-2 py-1 text-[8px] uppercase tracking-wider font-extrabold rounded-md border transition-all cursor-pointer ${
                              !paHasEntrada 
                                ? 'bg-zinc-900 border-zinc-900 text-white' 
                                : 'bg-white border-zinc-250 text-zinc-600 hover:bg-zinc-100'
                            }`}
                          >
                            Não possuo entrada
                          </button>
                        </div>

                        {paHasEntrada ? (
                          <div className="relative">
                            <span className="absolute left-3.5 top-2 text-xs font-mono font-bold text-zinc-400">R$</span>
                            <input
                              type="text"
                              required={paHasEntrada}
                              placeholder="Ex: 50.000,00"
                              value={paEntrada}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val) {
                                  const float = parseFloat(val) / 100;
                                  setPaEntrada(float.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                } else {
                                  setPaEntrada('');
                                }
                              }}
                              className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-800 font-semibold focus:outline-none focus:border-primary/45 font-mono"
                            />
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-500 italic">Entrada cadastrada como: "Financiamento Integral (100%)".</p>
                        )}
                      </div>

                      {/* PARCELA MENSAL DISPONIVEL */}
                      <div className="border border-zinc-200 rounded-xl bg-zinc-50 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-700 block">
                            Disponibilidade de Parcela Mensal
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setPaHasParcela(!paHasParcela);
                              if (paHasParcela) setPaParcela('');
                            }}
                            className={`px-2 py-1 text-[8px] uppercase tracking-wider font-extrabold rounded-md border transition-all cursor-pointer ${
                              !paHasParcela 
                                ? 'bg-zinc-900 border-zinc-900 text-white' 
                                : 'bg-white border-zinc-250 text-zinc-600 hover:bg-zinc-100'
                            }`}
                          >
                            Sem valor mensal
                          </button>
                        </div>

                        {paHasParcela ? (
                          <div className="relative">
                            <span className="absolute left-3.5 top-2 text-xs font-mono font-bold text-zinc-400">R$</span>
                            <input
                              type="text"
                              required={paHasParcela}
                              placeholder="Ex: 1.500,00"
                              value={paParcela}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val) {
                                  const float = parseFloat(val) / 100;
                                  setPaParcela(float.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                } else {
                                  setPaParcela('');
                                }
                              }}
                              className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-850 font-semibold focus:outline-none focus:border-primary/45 font-mono"
                            />
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-500 italic">Não declarado (correspondentes irão buscar parcelas sob demanda do banco).</p>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Anexar Documentos */}
                    <div className="space-y-3 pt-3 border-t border-zinc-150">
                      <div className="text-[10px] uppercase tracking-widest font-mono text-[#203366] font-extrabold flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-primary" />
                        3. Cópias de Documentos Necessários
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-normal">
                        Deseja anexar seus comprovantes agora? (Opcional, agiliza a análise operacional):
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* RG / CPF */}
                        <div className="relative">
                          <label className="text-[8px] uppercase tracking-wider font-mono font-extrabold text-zinc-500 block mb-1">
                            Cópia RG/CPF (ou CNH)
                          </label>
                          <div className={`border border-dashed rounded-xl p-3 text-center flex flex-col items-center justify-center transition-all cursor-pointer relative bg-zinc-50 ${
                            paDocRgCpf ? 'border-emerald-500 bg-emerald-50/30' : 'border-zinc-250 hover:border-[#FF9D00]'
                          }`}>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileChange(e, 'rgCpf')}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              id="btn-upload-rg"
                            />
                            {paDocRgCpf ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-emerald-600 mb-0.5" />
                                <p className="text-[9px] font-bold text-emerald-950 truncate w-full max-w-[120px]">{paDocRgCpf.name}</p>
                              </>
                            ) : (
                              <>
                                <FileUp className="h-4 w-4 text-zinc-400 mb-0.5" />
                                <p className="text-[9px] font-bold text-zinc-750">Selecionar arquivo</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Residência */}
                        <div className="relative">
                          <label className="text-[8px] uppercase tracking-wider font-mono font-extrabold text-zinc-500 block mb-1">
                            Comprovante Residência
                          </label>
                          <div className={`border border-dashed rounded-xl p-3 text-center flex flex-col items-center justify-center transition-all cursor-pointer relative bg-zinc-50 ${
                            paDocResidencia ? 'border-emerald-500 bg-emerald-50/30' : 'border-zinc-250 hover:border-[#FF9D00]'
                          }`}>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileChange(e, 'residencia')}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              id="btn-upload-resid"
                            />
                            {paDocResidencia ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-emerald-600 mb-0.5" />
                                <p className="text-[9px] font-bold text-emerald-950 truncate w-full max-w-[120px]">{paDocResidencia.name}</p>
                              </>
                            ) : (
                              <>
                                <FileUp className="h-4 w-4 text-zinc-400 mb-0.5" />
                                <p className="text-[9px] font-bold text-zinc-750">Selecionar arquivo</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Renda */}
                        <div className="relative">
                          <label className="text-[8px] uppercase tracking-wider font-mono font-extrabold text-zinc-500 block mb-1">
                            Renda (Holerite / IR)
                          </label>
                          <div className={`border border-dashed rounded-xl p-3 text-center flex flex-col items-center justify-center transition-all cursor-pointer relative bg-zinc-50 ${
                            paDocRenda ? 'border-emerald-500 bg-emerald-55/30' : 'border-zinc-250 hover:border-[#FF9D00]'
                          }`}>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileChange(e, 'renda')}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              id="btn-upload-renda"
                            />
                            {paDocRenda ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-emerald-600 mb-0.5" />
                                <p className="text-[9px] font-bold text-emerald-950 truncate w-full max-w-[120px]">{paDocRenda.name}</p>
                              </>
                            ) : (
                              <>
                                <FileUp className="h-4 w-4 text-zinc-400 mb-0.5" />
                                <p className="text-[9px] font-bold text-zinc-750">Selecionar arquivo</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={paStatus === 'submitting'}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF9D00] hover:bg-[#E08A00] text-black border border-[#FF9D00] font-extrabold text-xs uppercase tracking-wider py-3.5 transition-all text-center cursor-pointer select-none active:scale-[0.99] disabled:opacity-55 disabled:cursor-not-allowed"
                      >
                        {paStatus === 'submitting' ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-zinc-900/35 border-t-zinc-900 rounded-full animate-spin" />
                            <span>Enviando dados seguros...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span>Solicitar Pré-Aprovação Cadastral</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
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
                          ? 'border-[#FF9D00] ring-1 ring-[#FF9D00] scale-95 shadow-lg'
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
