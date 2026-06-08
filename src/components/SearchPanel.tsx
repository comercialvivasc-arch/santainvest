import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Sparkles, SlidersHorizontal, Home, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Property } from '../types';

interface SearchPanelProps {
  properties: Property[];
  onSearch: (filters: { 
    query: string; 
    bedrooms: number | null; 
    maxPrice: number;
    status: Property['status'] | null;
    maxDownpayment: number;
  }) => void;
  selectedBedrooms: number | null;
  setSelectedBedrooms: (bedrooms: number | null) => void;
  maxPrice: number;
  setMaxPrice: (price: number) => void;
  selectedStatus: Property['status'] | null;
  setSelectedStatus: (status: Property['status'] | null) => void;
  maxDownpayment: number;
  setMaxDownpayment: (val: number) => void;
  onClose?: () => void;
}

export default function SearchPanel({
  properties,
  onSearch,
  selectedBedrooms,
  setSelectedBedrooms,
  maxPrice,
  setMaxPrice,
  selectedStatus,
  setSelectedStatus,
  maxDownpayment,
  setMaxDownpayment,
  onClose,
}: SearchPanelProps) {
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Dynamic Suggestion generation from current properties
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

    return helperArray.slice(0, 5); // Max 5 suggestions
  }, [searchInput, properties]);

  // Dynamically obtain available bedroom options from properties
  const availableBedroomOptions = useMemo(() => {
    const bedroomSet = new Set<number>();
    properties.forEach((p) => {
      if (typeof p.bedrooms === 'number') {
        bedroomSet.add(p.bedrooms);
      } else if (typeof p.bedrooms === 'string') {
        const matches = p.bedrooms.match(/\d+/g);
        if (matches) {
          matches.forEach((m) => {
            const val = parseInt(m, 10);
            if (!isNaN(val)) {
              bedroomSet.add(val);
            }
          });
        }
      }
    });
    const unique = Array.from(bedroomSet).sort((a, b) => a - b);
    return unique.length > 0 ? unique : [1, 2, 3, 4];
  }, [properties]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleQueryChange = (val: string) => {
    setSearchInput(val);
    onSearch({ query: val, bedrooms: selectedBedrooms, maxPrice, status: selectedStatus, maxDownpayment });
  };

  const selectSuggestion = (val: string) => {
    setSearchInput(val);
    setShowSuggestions(false);
    onSearch({ query: val, bedrooms: selectedBedrooms, maxPrice, status: selectedStatus, maxDownpayment });
  };

  const handleBedroomsClick = (beds: number | null) => {
    setSelectedBedrooms(beds);
    onSearch({ query: searchInput, bedrooms: beds, maxPrice, status: selectedStatus, maxDownpayment });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setMaxPrice(val);
    onSearch({ query: searchInput, bedrooms: selectedBedrooms, maxPrice: val, status: selectedStatus, maxDownpayment });
  };

  const handleStatusClick = (status: Property['status'] | null) => {
    setSelectedStatus(status);
    onSearch({ query: searchInput, bedrooms: selectedBedrooms, maxPrice, status, maxDownpayment });
  };

  const handleDownpaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setMaxDownpayment(val);
    onSearch({ query: searchInput, bedrooms: selectedBedrooms, maxPrice, status: selectedStatus, maxDownpayment: val });
  };

  return (
    <div 
      id="search-filter-box"
      className="w-full bg-[#121318] p-6 sm:p-8 relative"
    >
      {/* Subtle Orange top neon border glow */}
      <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[#FF6600] to-transparent"></div>

      {/* Title inside search block */}
      <div className="mb-6 text-left">
        <h3 className="text-xs font-bold tracking-widest text-[#FF6600] uppercase font-mono">
          ⚡ Encontre seu Imóvel Ideal
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Filtre em tempo real nossa seleção de lançamentos por localização, dormitórios, estágio de obra e fluxo de pagamento.
        </p>
      </div>

          {/* Search Bar Row with integrated suggestions */}
          <div className="relative w-full">
            <div className="flex items-center rounded-xl bg-black/60 border border-zinc-800 focus-within:border-[#FF6600]/80 transition-all duration-300 pl-4 pr-2 py-1 shadow-inner">
              <Search className="h-5 w-5 text-[#FF6600] shrink-0" />
              <input
                type="text"
                className="w-full bg-transparent px-3 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:ring-0"
                placeholder="Busque por Região, Bairro, Empreendimento ou Tipo..."
                value={searchInput}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => handleQueryChange('')}
                  className="text-xs text-zinc-300 hover:text-[#FF6600] uppercase font-mono tracking-wider px-2 cursor-pointer transition-colors"
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
                  className="absolute left-0 mt-2 w-full rounded-xl border border-zinc-850 bg-black p-2 shadow-2xl z-50 text-left"
                >
                  <p className="text-[10px] font-bold tracking-widest text-[#FF6600] uppercase px-3 py-1 font-mono border-b border-zinc-900 w-full mb-1">
                    Sugestões encontradas
                  </p>
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectSuggestion(item.text)}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#FF6600] shrink-0" />
                        <span className="font-semibold text-white">{item.text}</span>
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-mono bg-[#FF6600]/10 border border-[#FF6600]/25 px-2 py-0.5 rounded text-[#FF6600]">
                        {item.type}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* TWO COLUMN GRID ON DESKTOP */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            {/* Left Column: Selector Buttons (Dormitórios and Estágio da Obra) */}
            <div className="flex flex-col gap-6 justify-between">
              
              {/* Rooms Selector */}
              <div>
                <label className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-2.5">
                  ✦ Dormitórios Recomendados
                </label>
                <div className="flex flex-wrap gap-1.55">
                  <button
                    onClick={() => handleBedroomsClick(null)}
                    type="button"
                    className={`px-3 py-2 rounded-lg text-xs tracking-wider uppercase font-semibold transition-all duration-300 border cursor-pointer mr-1.5 mb-1.5 ${
                      selectedBedrooms === null
                        ? 'bg-[#FF6600] text-black border-[#FF6600] font-bold shadow-lg shadow-orange-500/20'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-[#FF6600] hover:text-black hover:border-[#FF6600]'
                    }`}
                  >
                    Todos
                  </button>
                  {availableBedroomOptions.map((beds) => (
                    <button
                      key={beds}
                      onClick={() => handleBedroomsClick(beds)}
                      type="button"
                      className={`px-3 py-2 rounded-lg text-xs tracking-wider uppercase font-semibold transition-all duration-300 border cursor-pointer mr-1.5 mb-1.5 ${
                        selectedBedrooms === beds
                          ? 'bg-[#FF6600] text-black border-[#FF6600] font-bold shadow-lg shadow-orange-500/20'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-[#FF6600] hover:text-black hover:border-[#FF6600]'
                      }`}
                    >
                      {beds === 1 ? `1 Dorm` : `${beds} Dorms`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status/Estágio da Obra Selector */}
              <div>
                <label className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase font-mono block mb-2.5">
                  ✦ Estágio da Obra
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleStatusClick(null)}
                    type="button"
                    className={`px-3 py-2 rounded-lg text-xs tracking-wider uppercase font-semibold transition-all duration-300 border cursor-pointer mr-1.5 mb-1.5 ${
                      selectedStatus === null
                        ? 'bg-[#FF6600] text-black border-[#FF6600] font-bold shadow-lg shadow-orange-500/20'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-[#FF6600] hover:text-black hover:border-[#FF6600]'
                    }`}
                  >
                    Todos
                  </button>
                  {(['Pré-lançamento', 'Lançamento', 'Em construção', 'Pronto'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusClick(st)}
                      type="button"
                      className={`px-3 py-2 rounded-lg text-xs tracking-wider uppercase font-semibold transition-all duration-300 border cursor-pointer mr-1.5 mb-1.5 ${
                        selectedStatus === st
                          ? 'bg-[#FF6600] text-black border-[#FF6600] font-bold shadow-lg shadow-orange-500/20'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-[#FF6600] hover:text-black hover:border-[#FF6600]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Sliders (Total Price and Available Downpayment) */}
            <div className="flex flex-col gap-6 justify-between">
              
              {/* Max Price Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold tracking-widest text-zinc-300 uppercase font-mono block">
                    ✦ Valor Máximo do Imóvel
                  </label>
                  <span className="text-xs font-bold text-white font-mono bg-black/60 px-2.5 py-0.5 rounded-md border border-zinc-800">
                    {formatBRL(maxPrice)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="350000"
                    max="10000000"
                    step="50000"
                    value={maxPrice}
                    onChange={handlePriceChange}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#FF6600]"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-1">
                    <span>R$ 350 mil</span>
                    <span>R$ 5 M</span>
                    <span>R$ 10 M</span>
                  </div>
                </div>
              </div>

              {/* Entrance Payment ("quanto de entrada dispõe") Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold tracking-widest text-zinc-300 uppercase font-mono block">
                    ✦ Entrada de que Dispõe?
                  </label>
                  <span className="text-xs font-bold text-[#FF6600] font-mono bg-black/60 px-2.5 py-0.5 rounded-md border border-zinc-800">
                    {maxDownpayment === 0 ? 'Qualquer valor' : formatBRL(maxDownpayment)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="1500000"
                    step="10000"
                    value={maxDownpayment}
                    onChange={handleDownpaymentChange}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#FF6600]"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono mt-1">
                    <span>Qualquer valor</span>
                    <span>R$ 750 mil</span>
                    <span>R$ 1.5 M</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Call to Action: Search Button with Anchor Scroll */}
          <div className="mt-8 pt-6 border-t border-zinc-900/60 flex justify-center">
            <button
              onClick={() => {
                const el = document.getElementById('projects-showcase');
                el?.scrollIntoView({ behavior: 'smooth' });
                onClose?.();
              }}
              type="button"
              className="w-full sm:w-auto px-10 py-4 rounded-xl bg-[#FF6600] text-black font-extrabold text-xs uppercase tracking-widest hover:bg-orange-600 hover:shadow-lg hover:shadow-[#FF6600]/25 active:scale-98 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
            >
              <Search className="h-4 w-4 stroke-[3]" />
              Buscar Lançamentos
            </button>
          </div>

    </div>
  );
}
