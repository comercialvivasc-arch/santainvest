import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Sparkles, SlidersHorizontal, Home, HelpCircle, X, Building, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Property } from '../types';

interface SearchPanelProps {
  properties: Property[];
  onSearch: (filters: { 
    query: string; 
    bedrooms: number | null; 
    minPrice: number;
    maxPrice: number;
    status: Property['status'] | null;
    projectType: string | null;
  }) => void;
  selectedBedrooms: number | null;
  setSelectedBedrooms: (bedrooms: number | null) => void;
  minPrice: number;
  setMinPrice: (price: number) => void;
  maxPrice: number;
  setMaxPrice: (price: number) => void;
  selectedStatus: Property['status'] | null;
  setSelectedStatus: (status: Property['status'] | null) => void;
  selectedProjectType: string | null;
  setSelectedProjectType: (type: string | null) => void;
  onClearFilters: () => void;
  onClose?: () => void;
}

export default function SearchPanel({
  properties,
  onSearch,
  selectedBedrooms,
  setSelectedBedrooms,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  selectedStatus,
  setSelectedStatus,
  selectedProjectType,
  setSelectedProjectType,
  onClearFilters,
  onClose,
}: SearchPanelProps) {
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // States to manage input texts for typing manually
  const [minPriceText, setMinPriceText] = useState('');
  const [maxPriceText, setMaxPriceText] = useState('');

  // Format real-time while typing
  const formatBRLValue = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val);
  };

  const parseBRLString = (str: string): number => {
    const clean = str.replace(/\D/g, '');
    return clean ? parseInt(clean, 10) : 0;
  };

  // Sync state variables to input fields
  useEffect(() => {
    setMinPriceText(formatBRLValue(minPrice));
  }, [minPrice]);

  useEffect(() => {
    setMaxPriceText(formatBRLValue(maxPrice));
  }, [maxPrice]);

  // Suggestions dynamic generator
  const suggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    
    const input = searchInput.toLowerCase();
    const matchesSet = new Set<string>();
    const helperArray: { text: string; type: 'Bairro' | 'Região' | 'Tipo' }[] = [];

    properties.forEach((p) => {
      if (p.neighborhood.toLowerCase().includes(input) && !matchesSet.has(p.neighborhood)) {
        matchesSet.add(p.neighborhood);
        helperArray.push({ text: p.neighborhood, type: 'Bairro' });
      }
      if (p.region.toLowerCase().includes(input) && !matchesSet.has(p.region)) {
        matchesSet.add(p.region);
        helperArray.push({ text: p.region, type: 'Região' });
      }
      if (p.projectType.toLowerCase().includes(input) && !matchesSet.has(p.projectType)) {
        matchesSet.add(p.projectType);
        helperArray.push({ text: p.projectType, type: 'Tipo' });
      }
      if (p.name.toLowerCase().includes(input) && !matchesSet.has(p.name)) {
        matchesSet.add(p.name);
        helperArray.push({ text: p.name, type: 'Tipo' });
      }
    });

    return helperArray.slice(0, 5);
  }, [searchInput, properties]);

  // Get dynamic unique project types available in active real estates
  const availableProjectTypes = useMemo(() => {
    const typesSet = new Set<string>();
    properties.forEach((p) => {
      if (p.projectType) {
        typesSet.add(p.projectType);
      }
    });
    return Array.from(typesSet);
  }, [properties]);

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('casa')) return <Home className="h-4.5 w-4.5" />;
    if (t.includes('apartamento')) return <Building className="h-4.5 w-4.5" />;
    if (t.includes('studio') || t.includes('loft')) return <Layers className="h-4.5 w-4.5" />;
    if (t.includes('cobertura') || t.includes('penthouse')) return <Sparkles className="h-4.5 w-4.5" />;
    return <Building className="h-4.5 w-4.5" />;
  };

  const getPluralTypeName = (type: string) => {
    const t = type.toLowerCase().trim();
    if (t === 'casa') return 'Casas';
    if (t === 'apartamento') return 'Apartamentos';
    if (t === 'studio') return 'Studios';
    if (t === 'cobertura') return 'Coberturas';
    
    // Default pluralize
    if (type.endsWith('o') || type.endsWith('a') || type.endsWith('e')) {
      return type + 's';
    }
    return type;
  };

  const handleQueryChange = (val: string) => {
    setSearchInput(val);
    onSearch({ query: val, bedrooms: selectedBedrooms, minPrice, maxPrice, status: selectedStatus, projectType: selectedProjectType });
  };

  const selectSuggestion = (val: string) => {
    setSearchInput(val);
    setShowSuggestions(false);
    onSearch({ query: val, bedrooms: selectedBedrooms, minPrice, maxPrice, status: selectedStatus, projectType: selectedProjectType });
  };

  const handleBedroomsClick = (beds: number | null) => {
    setSelectedBedrooms(beds);
    onSearch({ query: searchInput, bedrooms: beds, minPrice, maxPrice, status: selectedStatus, projectType: selectedProjectType });
  };

  const handlePriceSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setMaxPrice(val);
    onSearch({ query: searchInput, bedrooms: selectedBedrooms, minPrice, maxPrice: val, status: selectedStatus, projectType: selectedProjectType });
  };

  const handleMinPriceTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const textValue = e.target.value;
    const rawNum = parseBRLString(textValue);
    setMinPriceText(textValue ? formatBRLValue(rawNum) : '');
    setMinPrice(rawNum);
    onSearch({ query: searchInput, bedrooms: selectedBedrooms, minPrice: rawNum, maxPrice, status: selectedStatus, projectType: selectedProjectType });
  };

  const handleMaxPriceTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const textValue = e.target.value;
    const rawNum = parseBRLString(textValue);
    setMaxPriceText(textValue ? formatBRLValue(rawNum) : '');
    setMaxPrice(rawNum);
    onSearch({ query: searchInput, bedrooms: selectedBedrooms, minPrice, maxPrice: rawNum, status: selectedStatus, projectType: selectedProjectType });
  };

  const handleStatusClick = (status: Property['status'] | null) => {
    setSelectedStatus(status);
    onSearch({ query: searchInput, bedrooms: selectedBedrooms, minPrice, maxPrice, status, projectType: selectedProjectType });
  };

  const handleTypeClick = (type: string | null) => {
    const finalVal = selectedProjectType === type ? null : type;
    setSelectedProjectType(finalVal);
    onSearch({ query: searchInput, bedrooms: selectedBedrooms, minPrice, maxPrice, status: selectedStatus, projectType: finalVal });
  };

  const handleClearAll = () => {
    onClearFilters();
    setSearchInput('');
    onSearch({ query: '', bedrooms: null, minPrice: 100000, maxPrice: 20000000, status: null, projectType: null });
  };

  return (
    <div id="search-filter-box" className="w-full bg-white text-zinc-900 flex flex-col relative">
      
      {/* 1. TOP HEADER: CLOSE BUTTON (X) & CLEAR FILTERS BUTTON ON LEFT */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-white">
        <div className="flex items-center gap-4">
          {/* Close button X */}
          <button 
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer flex items-center justify-center border border-zinc-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Clear Filters Button */}
          <button 
            type="button"
            onClick={handleClearAll}
            className="text-xs font-bold uppercase tracking-wider text-[#203366] hover:text-[#FF9D00] hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 py-2.5 px-4 rounded-xl transition-all font-mono cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>

        <div className="flex items-center gap-2 text-zinc-800">
          <SlidersHorizontal className="h-4.5 w-4.5 text-[#FF9D00]" />
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest font-mono text-[#203366]">
            Filtrar Lançamentos
          </span>
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="p-6 sm:p-8 space-y-8">
        
        {/* Real-time search query box */}
        <div className="relative w-full">
          <label className="text-[11px] font-bold tracking-widest text-[#203366] uppercase font-mono block mb-2">
            ✈ Busca Rápida
          </label>
          <div className="flex items-center rounded-xl bg-zinc-50 border border-zinc-200 focus-within:border-[#FF9D00] focus-within:ring-1 focus-within:ring-[#FF9D00]/20 transition-all duration-300 pl-4 pr-2 py-1">
            <Search className="h-5 w-5 text-zinc-400 shrink-0" />
            <input
              type="text"
              className="w-full bg-transparent px-3 py-3 text-sm text-zinc-800 placeholder-zinc-400 outline-none border-none focus:ring-0"
              placeholder="Busque por Região, Bairro, Empreendimento ou Palavras-chave..."
              value={searchInput}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => handleQueryChange('')}
                className="text-[10px] text-zinc-500 hover:text-[#FF9D00] uppercase font-mono tracking-wider px-2 cursor-pointer transition-colors"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 mt-2 w-full rounded-xl border border-zinc-200 bg-white p-2 shadow-xl z-50 text-left"
              >
                <p className="text-[9px] font-bold tracking-widest text-[#FF9D00] uppercase px-3 py-1 font-mono border-b border-zinc-100 w-full mb-1">
                  Sugestões
                </p>
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSuggestion(item.text)}
                    className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-[#203366] transition-all text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[#FF9D00] shrink-0" />
                      <span className="font-semibold text-zinc-900">{item.text}</span>
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-mono bg-[#FF9D00]/10 px-2 py-0.5 rounded text-[#FF9D00]">
                      {item.type}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. FAIXA DE PREÇO SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold tracking-widest text-[#203366] uppercase font-mono block">
              ✦ Faixa de Preço
            </label>
            <span className="text-xs font-bold text-[#FF9D00] font-mono bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-200">
              Valor Máximo: {formatBRLValue(maxPrice)}
            </span>
          </div>

          {/* Slider bar range */}
          <div className="relative">
            <input
              type="range"
              min="100000"
              max="20000000"
              step="100000"
              value={maxPrice}
              onChange={handlePriceSliderChange}
              className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-[#FF9D00] focus:outline-none"
            />
            <div className="flex justify-between text-[9px] text-zinc-400 font-mono mt-1 px-1">
              <span>R$ 100 Mil</span>
              <span>R$ 5 M</span>
              <span>R$ 10 M</span>
              <span>R$ 15 M</span>
              <span>R$ 20 M</span>
            </div>
          </div>

          {/* Side by side numeric inputs to type freely */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-500 block font-mono">
                Preço Mínimo
              </span>
              <div className="relative rounded-xl border border-zinc-200 focus-within:border-[#FF9D00] bg-white px-3.5 py-2.5 transition-all">
                <input
                  type="text"
                  value={minPriceText}
                  onChange={handleMinPriceTextChange}
                  placeholder="R$ 100.000"
                  className="w-full bg-transparent text-sm font-bold text-zinc-800 focus:outline-none placeholder-zinc-300 border-none p-0 focus:ring-0"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-500 block font-mono">
                Preço Máximo
              </span>
              <div className="relative rounded-xl border border-zinc-200 focus-within:border-[#FF9D00] bg-white px-3.5 py-2.5 transition-all">
                <input
                  type="text"
                  value={maxPriceText}
                  onChange={handleMaxPriceTextChange}
                  placeholder="R$ 20.000.000"
                  className="w-full bg-transparent text-sm font-bold text-zinc-800 focus:outline-none placeholder-zinc-300 border-none p-0 focus:ring-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. TIPO DE IMÓVEL SECTION */}
        <div className="space-y-3 text-left">
          <label className="text-[11px] font-bold tracking-widest text-[#203366] uppercase font-mono block">
            ✦ Tipo de Imóvel
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {availableProjectTypes.map((type) => {
              const label = getPluralTypeName(type);
              const isSelected = selectedProjectType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeClick(type)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-[#203366] text-white border-[#203366] shadow-md shadow-[#203366]/15'
                      : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className={`mb-2 p-2 rounded-lg ${isSelected ? 'bg-white/10 text-[#FF9D00]' : 'bg-zinc-50 text-zinc-600'}`}>
                    {getTypeIcon(type)}
                  </div>
                  <span className="text-xs font-bold font-sans">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. DORMITÓRIOS SECTION: LINE TODOS + CIRCLES */}
        <div className="space-y-3 text-left">
          <label className="text-[11px] font-bold tracking-widest text-[#203366] uppercase font-mono block">
            ✦ Dormitórios Recomendados
          </label>
          
          <div className="flex items-center gap-4 py-1.5 flex-wrap">
            {/* Todos option circle/capsule */}
            <button
              type="button"
              onClick={() => handleBedroomsClick(null)}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border cursor-pointer h-10 ${
                selectedBedrooms === null
                  ? 'bg-[#FF9D00] text-black border-[#FF9D00] shadow-md shadow-[#FF9D00]/10'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
              }`}
            >
              Todos
            </button>

            {/* Individual bedroom circles */}
            <div className="flex items-center gap-2.5">
              {[1, 2, 3, 4, 5].map((beds) => {
                const isSelected = selectedBedrooms === beds;
                const displayLabel = beds === 5 ? '+5' : String(beds);
                return (
                  <button
                    key={beds}
                    type="button"
                    onClick={() => handleBedroomsClick(beds)}
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF9D00] text-black border-[#FF9D00] shadow-md shadow-[#FF9D00]/15 scale-105'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
                    }`}
                  >
                    {displayLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 6. ESTÁGIO DA OBRA SECTION */}
        <div className="space-y-3 text-left">
          <label className="text-[11px] font-bold tracking-widest text-[#203366] uppercase font-mono block">
            ✦ Estágio da Obra
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusClick(null)}
              type="button"
              className={`px-4 py-2.5 rounded-xl text-xs tracking-wider uppercase font-extrabold transition-all duration-300 border cursor-pointer ${
                selectedStatus === null
                  ? 'bg-[#203366] text-white border-[#203366] shadow-md'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 font-semibold'
              }`}
            >
              Todos
            </button>
            {(['Pré-lançamento', 'Lançamento', 'Em construção', 'Pronto'] as const).map((stage) => {
              const displayLabel = stage === 'Lançamento' ? 'Lançado' : stage;
              // Normalize stage names
              const isSelected = selectedStatus === stage;
              return (
                <button
                  key={stage}
                  onClick={() => handleStatusClick(stage)}
                  type="button"
                  className={`px-4 py-2.5 rounded-xl text-xs tracking-wider uppercase transition-all duration-300 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF9D00] text-black border-[#FF9D00] font-extrabold shadow-md'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 font-semibold'
                  }`}
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. FOOTER ACTIONS */}
      <div className="mt-4 p-6 border-t border-zinc-100 flex items-center justify-center bg-zinc-50/50 rounded-b-3xl">
        <button
          onClick={() => {
            const el = document.getElementById('projects-showcase');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
            onClose?.();
          }}
          type="button"
          className="w-full sm:w-auto px-12 py-4 rounded-xl bg-[#203366] text-white font-extrabold text-xs uppercase tracking-widest hover:bg-[#1a2b56] hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
        >
          <Search className="h-4.5 w-4.5 text-[#FF9D00]" />
          Visualizar Resultados
        </button>
      </div>

    </div>
  );
}
