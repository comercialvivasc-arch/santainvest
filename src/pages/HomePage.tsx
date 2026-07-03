import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal } from 'lucide-react';
import SearchHero from '../components/SearchHero';
import PropertyCard from '../components/PropertyCard';
import SearchPanel from '../components/SearchPanel';
import { Property, BannerAd, BrandSettings } from '../types';

interface HomePageProps {
  banners: BannerAd[];
  properties: Property[];
  settings: BrandSettings;
  query: string;
  setQuery: (q: string) => void;
  filteredProperties: Property[];
  isFilterPopupOpen: boolean;
  setIsFilterPopupOpen: (b: boolean) => void;
  selectedBedrooms: number | null;
  setSelectedBedrooms: (n: number | null) => void;
  minPrice: number;
  setMinPrice: (n: number) => void;
  maxPrice: number;
  setMaxPrice: (n: number) => void;
  selectedStatus: Property['status'] | null;
  setSelectedStatus: (s: Property['status'] | null) => void;
  selectedProjectType: string | null;
  setSelectedProjectType: (s: string | null) => void;
  handleResetFilters: () => void;
}

export default function HomePage({ 
    banners, properties, settings, query, setQuery, filteredProperties, isFilterPopupOpen, setIsFilterPopupOpen, 
    selectedBedrooms, setSelectedBedrooms, minPrice, setMinPrice, maxPrice, setMaxPrice, 
    selectedStatus, setSelectedStatus, selectedProjectType, setSelectedProjectType, handleResetFilters 
}: HomePageProps) {
  return (
    <motion.div
      key="home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ backgroundColor: '#ffffff' }}
    >
      <SearchHero 
        properties={properties}
        banners={banners}
        query={query}
        setQuery={setQuery}
        onOpenProperty={(id) => {}} // PropertyCard handles navigation
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 relative z-10">

          <div>
            <span 
              style={{ color: '#ff6200' }}
              className="text-[11px] font-bold tracking-widest uppercase font-mono block mb-1"
            >
              ✦ Portfolio Selecionado
            </span>
            <h2 className="text-3xl font-black text-zinc-950 tracking-tight sm:text-4xl uppercase">
              Lançamentos Sugeridos
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Projetos modernos com arquitetura futurista e excelentes simulações de parcelamento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => setIsFilterPopupOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-[#FF9D00]/40 px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-zinc-900 transition-all duration-300 shadow-sm cursor-pointer"
              title="Abrir filtros de pesquisa"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#FF9D00]" />
              Filtrar Lançamentos
            </button>
          </div>
        </div>
        
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {filteredProperties.map((prop, idx) => (
              <PropertyCard 
                key={prop.id} 
                property={prop} 
                allProperties={properties} 
                settings={settings} 
                index={idx}
              />
            ))}
          </div>
        </div>

        {/* Filters Popup Modal */}
        <AnimatePresence>
          {isFilterPopupOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 cursor-default"
                onClick={() => setIsFilterPopupOpen(false)}
              />

              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative w-full max-w-4xl bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
              >
                <div className="overflow-y-auto flex-1 styles-scrollbar-custom bg-white">
                  <SearchPanel 
                    properties={properties}
                    selectedBedrooms={selectedBedrooms}
                    setSelectedBedrooms={setSelectedBedrooms}
                    minPrice={minPrice}
                    setMinPrice={setMinPrice}
                    maxPrice={maxPrice}
                    setMaxPrice={setMaxPrice}
                    selectedStatus={selectedStatus}
                    setSelectedStatus={setSelectedStatus}
                    selectedProjectType={selectedProjectType}
                    setSelectedProjectType={setSelectedProjectType}
                    onSearch={({ query: q, bedrooms: b, minPrice: minVal, maxPrice: maxVal, status: s, projectType: pt }) => {
                      setQuery(q);
                      if (b !== undefined) setSelectedBedrooms(b);
                      if (minVal !== undefined) setMinPrice(minVal);
                      if (maxVal !== undefined) setMaxPrice(maxVal);
                      if (s !== undefined) setSelectedStatus(s);
                      if (pt !== undefined) setSelectedProjectType(pt);
                    }}
                    onClose={() => setIsFilterPopupOpen(false)}
                    onClearFilters={handleResetFilters}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </motion.div>
  );
}
