import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed, Maximize, Car, MapPin, Calendar, Compass, Share2, MessageSquare, ChevronLeft, ChevronRight, X, Sparkles, ShieldCheck, Check, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Property, BrandSettings } from '../types';
import { formatBedroomsLabel, formatAreaLabel, formatParkingLabel, formatPropRef, formatBRL } from '../utils/formatters';
import McmvBadge from './McmvBadge';
import { saveLeadToFirestore, saveMessageToFirestore } from '../services/firestoreService';

export default function PropertyDetailsContent({ property, allProperties, settings, onClose }: { property: Property; allProperties: Property[]; settings: BrandSettings; onClose: () => void }) {
  const navigate = useNavigate();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [activePlanIdx, setActivePlanIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  
  const [isPaModalOpen, setIsPaModalOpen] = useState(false);
  
  const similarProperties = useMemo(() => {
    const currentNeigh = (property.neighborhood || '').trim().toLowerCase();
    const currentReg = (property.region || '').trim().toLowerCase();
    
    // First, find properties in same neighborhood
    let filtered = allProperties.filter(p => 
      p.id !== property.id && 
      (p.neighborhood || '').trim().toLowerCase() === currentNeigh
    );
    
    // If we have fewer than 3, fill with properties in the same region
    if (filtered.length < 3) {
      const byRegion = allProperties.filter(p => 
        p.id !== property.id && 
        !filtered.some(f => f.id === p.id) &&
        (p.region || '').trim().toLowerCase() === currentReg
      );
      filtered = [...filtered, ...byRegion];
    }
    
    // If still empty/few, fill with any other properties to be helpful
    if (filtered.length < 3) {
      const others = allProperties.filter(p => 
        p.id !== property.id && 
        !filtered.some(f => f.id === p.id)
      );
      filtered = [...filtered, ...others];
    }
    
    return filtered.slice(0, 3);
  }, [allProperties, property.neighborhood, property.region, property.id]);
  const [emailFormName, setEmailFormName] = useState('');
  const [emailFormContact, setEmailFormContact] = useState('');
  const [emailFormMsg, setEmailFormMsg] = useState('');
  const [emailFormStatus, setEmailFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  
  const [paStatus, setPaStatus] = useState<'idle' | 'success' | 'submitting'>('idle');

  // Re-use logic for favorites (same as before)
  React.useEffect(() => {
    const checkFav = () => {
        try {
            const saved = localStorage.getItem('vivasc_favorites');
            if (saved) {
                const list = JSON.parse(saved);
                setIsFavorited(Array.isArray(list) && list.includes(property.id));
            }
        } catch (e) {
            console.error(e);
        }
    };
    checkFav();
    window.addEventListener('favorites-updated', checkFav);
    return () => window.removeEventListener('favorites-updated', checkFav);
  }, [property.id]);

  const getCleanPhone = () => {
    let num = (settings?.phone || '5547999999999').replace(/\D/g, '');
    if (num && !num.startsWith('55') && (num.length === 10 || num.length === 11)) num = '55' + num;
    return num;
  };
  
  const getWhatsAppUrl = (msg: string) => `https://wa.me/${getCleanPhone()}?text=${encodeURIComponent(msg)}`;
  
  const getPriceNum = (p: string | number) => typeof p === 'number' ? p : Number(p) || 0;

  const floorPlansList = useMemo(() => {
    if (property.floorPlans && property.floorPlans.length > 0) return property.floorPlans;
    return [
      { id: `fp-${property.id}-f1`, name: 'Planta Integrada', image: property.images[1] || 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80', description: 'Planta otimizada.', area: property.area, bedrooms: property.bedrooms },
      { id: `fp-${property.id}-f2`, name: 'Planta Concept', image: property.images[2] || property.images[0] || 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80', description: 'Opção contemporânea.', area: property.area, bedrooms: property.bedrooms }
    ];
  }, [property]);

  const toggleFavorite = (e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    try {
      const saved = localStorage.getItem('vivasc_favorites');
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (list.includes(property.id)) {
        list = list.filter((id) => id !== property.id);
        setIsFavorited(false);
      } else {
        list.push(property.id);
        setIsFavorited(true);
      }
      localStorage.setItem('vivasc_favorites', JSON.stringify(list));
      window.dispatchEvent(new Event('favorites-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = (e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const realUrl = `${window.location.origin}/imovel/${property.slug || property.id}`;
    const shareData = { title: property.name, url: realUrl };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        navigator.clipboard?.writeText(realUrl);
      });
    } else {
      navigator.clipboard?.writeText(realUrl);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Lançamento': return 'bg-orange-500/90 text-white';
      case 'Em construção': return 'bg-amber-500/90 text-black';
      case 'Pronto': return 'bg-emerald-500/90 text-white';
      case 'Pré-lançamento': return 'bg-purple-500/90 text-white';
      default: return 'bg-zinc-700/90 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Scrollable content */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 relative z-10 text-left">
        
        <button onClick={onClose} className="text-sm font-bold uppercase tracking-wider text-zinc-700 hover:text-zinc-950 mb-4 flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>

        {/* PROPERTY TYPE & HERO IMAGE SLIDER */}
        <span className="text-sm text-zinc-500 font-medium uppercase tracking-wider mb-0.5">
            {property.projectType || 'Imóvel'}
        </span>
        <h1 className="text-3xl font-black text-zinc-900 mb-4">{property.name}</h1>
        
        {property.images.length > 0 && (
          <div className="space-y-3">
            <div className="relative w-full h-64 sm:h-96 rounded-2xl overflow-hidden shadow-lg cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(property.status)} z-10`}>
                    {property.status}
                </div>
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button onClick={handleShare} className="bg-white/90 p-2 rounded-full hover:bg-white shadow-md">
                        <Share2 className="h-5 w-5 text-zinc-700" />
                    </button>
                    <button onClick={toggleFavorite} className="bg-white/90 p-2 rounded-full hover:bg-white shadow-md">
                        <Heart className={`h-5 w-5 ${isFavorited ? 'text-red-500 fill-current' : 'text-zinc-700'}`} />
                    </button>
                </div>
                <img src={property.images[currentImgIndex]} alt={property.name} className="w-full h-full object-cover" />
                {property.images.length > 1 && (
                <>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentImgIndex((prev) => (prev - 1 + property.images.length) % property.images.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                    <ChevronLeft />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentImgIndex((prev) => (prev + 1) % property.images.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                    <ChevronRight />
                    </button>
                </>
                )}
            </div>
            
            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {property.images.map((imgUrl, idx) => (
                    <button key={idx} onClick={() => setCurrentImgIndex(idx)} className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 ${idx === currentImgIndex ? 'ring-2 ring-orange-500' : ''}`}>
                        <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
          </div>
        )}

        {/* TRANSACTION / PRICE SUB-BAR */}
        <div className="w-full flex items-center justify-between border-b border-zinc-200 pb-5" id="details-section">
          <div>
            <span className="text-[10px] sm:text-xs tracking-widest font-bold uppercase font-mono block text-[#3f3f47]">
              {property.status === 'Pronto' ? 'Venda / Pronto' : 'A PARTIR DE'}
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono mt-0.5 text-[#ff6200]">
              {formatBRL(property.price)}
            </div>
            <p className="mt-1 text-xs uppercase font-mono tracking-wider font-semibold text-[#3f3f47]">
              {property.status === 'Pronto' ? 'Pronto para Morar' : `Previsão ${property.deliveryDate}`}
            </p>
          </div>
          <button 
            onClick={() => {
              const el = document.getElementById('simulador-box');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="rounded-xl bg-[#ff6200] text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 transition-all active:scale-95 shadow-lg shadow-[#FF9D00]/10 cursor-pointer uppercase tracking-wider"
          >
            Ver parcelas
          </button>
        </div>

        {/* SPEC GRID */}
        {(() => {
          const hasSuites = property.suites !== undefined && property.suites !== null && property.suites !== 0 && property.suites !== '0';
          return (
            <div className={`grid grid-cols-2 ${hasSuites ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-3 mt-1.5`}>
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-center flex flex-col items-center justify-center">
                <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Área útil</span>
                <span className="text-sm font-extrabold text-zinc-900 mt-1.5 font-mono">{formatAreaLabel(property.area)}</span>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-center flex flex-col items-center justify-center">
                <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Quartos</span>
                <span className="text-sm font-extrabold text-zinc-900 mt-1.5 font-mono">{formatBedroomsLabel(property.bedrooms, 'Quartos')}</span>
              </div>
              {hasSuites && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-center flex flex-col items-center justify-center">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Suítes</span>
                  <span className="text-sm font-extrabold text-zinc-900 mt-1.5 font-mono">{formatBedroomsLabel(property.suites!, 'Suítes')}</span>
                </div>
              )}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-center flex flex-col items-center justify-center">
                <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Banheiros</span>
                <span className="text-sm font-extrabold text-zinc-900 mt-1.5 font-mono">{property.bathrooms || '1'}</span>
              </div>
              <div className={`bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-center flex flex-col items-center justify-center ${hasSuites ? 'col-span-2 sm:col-span-1' : 'col-span-2 sm:col-span-1'}`}>
                <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Vagas</span>
                <span className="text-sm font-extrabold text-zinc-900 mt-1.5 font-mono">{formatParkingLabel(property.parkingSpaces, false)}</span>
              </div>
            </div>
          );
        })()}

        {/* MAIN DESCRIPTION */}
        <div className="text-left py-4 border-t border-zinc-200">
           <h2 className="text-2xl font-extrabold tracking-tight mb-2 uppercase text-[#02036c]">{property.name}</h2>
           <p className="text-sm text-zinc-700 leading-relaxed font-sans whitespace-pre-line">{property.detailedDescription}</p>
        </div>

        {/* FLOOR PLANS */}
        {floorPlansList && floorPlansList.length > 0 && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-left space-y-5 shadow-sm">
            <h4 className="text-md font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Compass className="h-5 w-5 text-orange-500" />
              Plantas Disponíveis
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {floorPlansList.map((plan, idx) => (
                <button key={plan.id} onClick={() => setActivePlanIdx(idx)} className={`px-4 py-2 rounded-xl font-bold ${idx === activePlanIdx ? 'bg-orange-500 text-white' : 'bg-zinc-200'}`}>
                  {plan.name}
                </button>
              ))}
            </div>
            {/* Active plan view */}
            <div className="border rounded-xl p-4">
              <img src={floorPlansList[activePlanIdx].image} alt={floorPlansList[activePlanIdx].name} className="w-full h-auto" />
              <p className="mt-2 text-sm">{floorPlansList[activePlanIdx].description}</p>
            </div>
          </div>
        )}

        {/* PAYMENT SIMULATOR */}
        <div id="simulador-box" className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 text-left space-y-4">
          <h3 className="text-sm tracking-widest font-extrabold text-zinc-900 uppercase font-mono">Valores de pagamento</h3>
          
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-4">
            <span className="text-xs text-zinc-550 uppercase tracking-wide">UNIDADES A PARTIR DE</span>
            <span className="text-xl font-black text-zinc-900 font-mono">
              {formatBRL(property.price)}
            </span>
          </div>

          <div className="space-y-4 font-mono text-sm">
            {/* 1. Entrada */}
            <div className="flex items-start justify-between border-b border-zinc-200 pb-2.5">
              <div>
                <span className="text-xs text-zinc-800 uppercase font-bold block">1. Entrada</span>
                <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">Ato ou sinal facilitado ({property.downpaymentPct || 10}%)</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-zinc-900 block">{formatBRL(property.downpayment)}</span>
                {property.downpaymentInstallmentsCount !== undefined && property.downpaymentInstallmentsCount > 1 && (
                  <span className="text-[10px] text-zinc-500 block mt-0.5">{property.downpaymentInstallmentsCount}x de {formatBRL(Math.round(property.downpayment / property.downpaymentInstallmentsCount))}</span>
                )}
              </div>
            </div>

            {/* 2. Mensais */}
            <div className="flex items-start justify-between border-b border-zinc-200 pb-2.5">
              <div>
                <span className="text-xs text-zinc-800 uppercase block font-bold">2. Mensais ({property.installmentsPct || 60}%)</span>
                <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">Prazo direto da construtora ({property.installmentsCount || 60} parcelas)</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold block text-[#ff6200]">{formatBRL(property.installments)}</span>
                <span className="text-[11px] text-zinc-500 block uppercase font-bold mt-0.5">Por mês</span>
              </div>
            </div>

            {/* 3. Reforços (Balões) */}
            <div className="flex items-start justify-between border-b border-zinc-200 pb-2.5">
              <div>
                <span className="text-xs text-zinc-800 uppercase block font-bold">3. Reforços / Balões ({property.reintegrationPct || 20}%)</span>
                <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">Investimento em {property.reintegrationCount || 5} parcelas anuais/semestrais</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-zinc-900 block">
                  {formatBRL(property.reintegrationValue || Math.round(getPriceNum(property.price) * (property.reintegrationPct || 0.2) / (property.reintegrationCount || 5)))}
                </span>
              </div>
            </div>
            
            {/* 4. Nas Chaves */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-zinc-800 uppercase block font-bold">4. Nas Chaves ({property.keysPct || 10}%)</span>
                <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">Entrega efetiva do imóvel ou financiamento bancário</span>
              </div>
              <span className="text-sm font-extrabold text-zinc-900">
                {formatBRL(property.keysValue || Math.round(getPriceNum(property.price) * (property.keysPct || 0.1)))}
              </span>
            </div>
          </div>
          
          <div className="bg-orange-500/5 border border-orange-500/20 p-3 rounded-lg text-zinc-800 leading-normal font-sans text-xs">
            💡 <strong>Condição de tabela:</strong> {property.tableConditionDescription || "Monte uma condição de pagamento flexível conforme sua capacidade financeira, sujeita à análise da construtora."}
          </div>

          <a
            href={getWhatsAppUrl(`Olá, me interessei pelo Empreendimento ${property.name}, com os valores de pagamento a partir de: Entrada ${formatBRL(property.downpayment)}, Mensais ${formatBRL(property.installments)}, Reforços ${formatBRL(property.reintegrationValue || 0)} e nas Chaves ${formatBRL(property.keysValue || 0)}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white font-extrabold text-sm uppercase tracking-wider py-4 transition-all hover:bg-[#20ba5a]"
          >
            SIMULAR PAGAMENTO
          </a>
        </div>

        {/* PRE-APPROVAL */}
        <div className="bg-[#ff6200] rounded-2xl p-6 text-white text-left space-y-4 shadow-sm">
          <h4 className="font-black uppercase flex items-center gap-2"><ShieldCheck/> Análise de Pré-Aprovação</h4>
          <p className="text-xs">Inicie seu cadastro para obter a melhor forma de pagamento.</p>
          <button className="bg-[#203366] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase" onClick={() => navigate('/cadastro')}>Simular agora</button>
        </div>

        {/* MAP */}
        <div id="location-section" className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
          <h4 className="font-black uppercase flex items-center gap-2"><MapPin/> Localização</h4>
          <div className="w-full h-64 rounded-xl overflow-hidden">
             <iframe title="map" src={`https://maps.google.com/maps?q=${encodeURIComponent(`${property.address}, ${property.neighborhood}, ${property.region}, SC, Brasil`)}&output=embed`} className="w-full h-full border-0" />
          </div>
        </div>

        {/* SIMILAR PROPERTIES */}
        {similarProperties.length > 0 && (
          <div className="py-8 border-t border-zinc-200 space-y-6">
            <div className="flex flex-col space-y-1 text-left">
              <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest font-mono">Imóveis na mesma região</h4>
              <p className="text-xs text-zinc-500">Mais opções para você conhecer no bairro {property.neighborhood}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {similarProperties.map(p => (
                 <div 
                   key={p.id} 
                   className="bg-white rounded-2xl border border-zinc-200 overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col group" 
                   onClick={() => {
                     navigate(`/imovel/${p.slug || p.id}`);
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                   }}
                 >
                    <div className="relative h-32 w-full overflow-hidden bg-zinc-100">
                      <img 
                        src={p.images[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80'} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-zinc-900/80 text-white backdrop-blur-sm">
                        {p.status}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between text-left space-y-2">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                          {p.projectType || 'Imóvel'}
                        </span>
                        <p className="font-black text-zinc-900 text-sm line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <MapPin size={10} className="text-zinc-400" />
                          {p.neighborhood}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-mono">VALOR A PARTIR DE</span>
                        <span className="font-black text-zinc-900 text-xs font-mono">
                          {formatBRL(p.price)}
                        </span>
                      </div>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        )}
        
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
          <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => setIsLightboxOpen(false)}>
              <img src={property.images[currentImgIndex]} alt="Full size" className="max-w-full max-h-full object-contain" />
              <button className="absolute top-4 right-4 text-white p-2" onClick={() => setIsLightboxOpen(false)}><X size={32}/></button>
          </div>
      )}

      {/* Bottom Fixed Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex gap-3 z-50">
          <button onClick={() => navigate('/catalogo')} className="flex-1 bg-zinc-900 text-white py-3 rounded-xl font-bold uppercase text-xs">Catálogo</button>
          <a href={getWhatsAppUrl(`Olá! Gostaria de mais informações sobre o imóvel: ${property.name}. Link: ${window.location.href}`)} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25D366] text-white py-3 rounded-xl font-bold uppercase text-xs text-center">WhatsApp</a>
      </div>
    </div>
  );

}
