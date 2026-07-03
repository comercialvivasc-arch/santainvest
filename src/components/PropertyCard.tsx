import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const formatPropRef = (id: string | number) => {
  const idStr = String(id);
  const match = idStr.match(/\d+/);
  if (match) {
    return match[0].padStart(3, '0');
  }
  return idStr;
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
  index?: number;
}

export default function PropertyCard({ 
  property, 
  allProperties = [], 
  settings, 
  isOpen, 
  onOpenChange, 
  isModalOnly = false,
  onNavigateToProperty,
  onNavigateToAdmin,
  index
}: PropertyCardProps) {
  const navigate = useNavigate();
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
    const realUrl = `${window.location.origin}/imovel/${property.slug || property.id}`;
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

  const getPriceNum = (p: string | number) => typeof p === 'number' ? p : Number(p) || 0;

  // Currency Formatter helper
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
    const baseText = isConsult 
      ? `Olá! Gostaria de consultar mais detalhes e condições exclusivas sobre o lançamento imobiliário "${property.name}" localizado no bairro ${property.neighborhood} (${property.region}).`
      : `Olá! Tenho interesse no lançamento "${property.name}" em ${property.neighborhood}. Valor sugerido: ${formatBRL(property.price)}. Gostaria de maiores informações sobre a Entrada de ${formatBRL(property.downpayment)} e parcelas de ${formatBRL(property.installments)}.`;
    
    const realUrl = `${window.location.origin}/imovel/${property.slug || property.id}`;
    const fullText = `${baseText}\n\nLink do imóvel: ${realUrl}`;
    
    return `https://wa.me/${getCleanPhone()}?text=${encodeURIComponent(fullText)}`;
  };

  const getCatalogWhatsAppLink = () => {
    const baseText = `Olá, me interessou este projeto e gostaria de receber o Catálogo do empreendimento ${property.name} (Ref: ${formatPropRef(property.id)}). Aguardo contato.`;
    
    const realUrl = `${window.location.origin}/imovel/${property.slug || property.id}`;
    const fullText = `${baseText}\n\nLink do imóvel: ${realUrl}`;
    
    return `https://wa.me/${getCleanPhone()}?text=${encodeURIComponent(fullText)}`;
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
              className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105 border-2"
              style={{ borderColor: '#ffffff' }}
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
                    key={`${property.id}-${idx}`}
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
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Project template / type & location subheaders */}
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <div className="flex items-center gap-1 font-bold tracking-wider text-primary uppercase font-mono" style={{ color: '#ff6200' }}>
                <Compass className="h-3 w-3" />
                {property.projectType}
              </div>
              {property.isMcmv && (
                <McmvBadge customLogoUrl={property.mcmvLogoUrl} className="h-5" />
              )}
            </div>

            {/* Nome do Projeto */}
            <h3 className="text-[15px] font-bold text-zinc-900 tracking-tight leading-[1.15] mt-0.5 group-hover:text-primary transition-colors">
              {property.name}
            </h3>

            {/* Bairro */}
            <p className="mt-0.5 text-sm font-semibold text-zinc-700 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" style={{ color: '#ff6200' }} />
              {property.neighborhood}, {property.region}
            </p>

            {/* Endereço */}
            <p className="mt-0 text-xs text-zinc-550 line-clamp-1 italic">
              {property.address}
            </p>

            {/* Icones Relativos: e.g. 2 Qts, 80m2, 2 Vagas */}
            <div className="my-3 pt-3 border-t border-zinc-200/80 flex justify-between items-center text-[11px] text-zinc-700 font-mono">
              <span className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-lg border border-zinc-200/80">
                <Bed className="h-3 w-3 text-primary shrink-0" style={{ color: '#ff6200' }} />
                <span style={{ color: '#71717b' }}>{formatBedroomsLabel(property.bedrooms)}</span>
              </span>
              <span className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-lg border border-zinc-200/80">
                <Maximize className="h-3 w-3 text-primary shrink-0" />
                <span>{formatAreaLabel(property.area)}</span>
              </span>
              <span className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-lg border border-zinc-200/80">
                <span>{property.bathrooms || '1'} Banh.</span>
              </span>
              <span className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-lg border border-zinc-200/80">
                <Car className="h-3 w-3 text-primary shrink-0" />
                <span>{formatParkingLabel(property.parkingSpaces)}</span>
              </span>
            </div>
          </div>

          <div className="border-t border-zinc-200/80 pt-3 mt-auto">
            {/* Valor A partir R$ */}
            <div className="mb-2">
              <span className="text-[9px] tracking-widest font-bold text-zinc-500 uppercase font-mono block">
                Investimento Estimado
              </span>
              <div className="text-lg font-extrabold text-zinc-900">
                <span className="text-[10px] font-semibold text-primary mr-1 font-mono" style={index === 0 ? { color: '#ff6200' } : undefined}>A partir</span>
                {formatBRL(property.price)}
              </div>
            </div>

            {/* Entrada a partir R$ | Parcela a partir R$ */}
            <div className="grid grid-cols-2 gap-2 mb-3 rounded-xl bg-zinc-50 border border-zinc-250 p-2 text-[11px] font-mono">
              <div>
                <span className="text-[8px] font-bold tracking-wider text-zinc-550 uppercase block mb-0.5" style={{ color: index === 1 ? '#71717b' : '#ff6200' }}>
                  Entrada R$
                </span>
                <span className="font-extrabold text-zinc-900 text-[12px] block">
                  {formatBRL(property.downpayment)}
                </span>
              </div>
              <div className="border-l border-zinc-200 pl-2">
                <span className="text-[8px] font-bold tracking-wider text-zinc-550 uppercase block mb-0.5" style={{ color: '#71717b' }}>
                  Mensais R$
                </span>
                <span className="font-extrabold text-[#FF9D00] text-[12px] block" style={{ color: '#18181b' }}>
                  {formatBRL(property.installments)}
                </span>
              </div>
            </div>

            {/* Botao Ver Oferta */}
            <button
              onClick={() => navigate(`/imovel/${property.slug || property.id}`)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold tracking-wider uppercase cursor-pointer hover:opacity-90 transition-all duration-300 text-[#fefefe] bg-[#ff6200]"
              style={{ fontWeight: 'normal' }}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
              <span style={{ fontWeight: 'normal' }}>Ver Oferta</span>
            </button>
          </div>
        </div>
      </motion.div>
      )}
    </>
  );
}