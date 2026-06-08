import React from 'react';
import { ShieldCheck, User, Building2, Menu, X, Landmark, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { BrandSettings } from '../types';

interface HeaderProps {
  currentView: 'home' | 'admin';
  onNavigate: (view: 'home' | 'admin') => void;
  query?: string;
  setQuery?: (q: string) => void;
  settings: BrandSettings;
}

export default function Header({ currentView, onNavigate, query, setQuery, settings }: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);
      
      // Keep visible at the very top of the page
      if (currentScrollY < 80) {
        setIsVisible(true);
      } else {
        // Scroll down hides, scroll up shows
        if (currentScrollY > lastScrollY) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const headerBgClass = 'bg-transparent border-b border-transparent shadow-none';

  return (
    <header 
      style={{ backgroundColor: '#37409A' }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${headerBgClass} ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div 
        style={{ backgroundColor: '#37409A' }}
        className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8"
      >
        {/* Futuristic Logo & Brand (ESQUERDA) */}
        <div 
          onClick={() => onNavigate('home')} 
          className="flex cursor-pointer items-center gap-2 sm:gap-3 group shrink-0"
          id="brand-logo"
        >
          {settings.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={settings.brandName || "Logo"} 
              referrerPolicy="no-referrer"
              style={{ width: '120px', height: '80px' }}
              className="object-contain transition-all duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary rotate-45 shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border border-white sm:border-2 -rotate-45"></div>
              <div className="absolute -inset-0.5 animate-pulse rounded-lg bg-primary/30 blur-sm -z-10 group-hover:bg-primary/50"></div>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-wider text-white uppercase sm:text-lg font-sans leading-none">
              {settings.brandName || 'VIVA SC'}
            </span>
            <span className="hidden sm:inline text-[8px] font-semibold tracking-widest text-zinc-400 uppercase font-mono mt-0.5">
              {settings.tagline || 'Futuristic Living'}
            </span>
          </div>
        </div>

        {/* Navigation & Actions (DIREITA) */}
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-zinc-300 uppercase shrink-0">
          <button 
            onClick={() => onNavigate('home')}
            style={{ color: '#F6CF40' }}
            className={`transition-colors duration-200 hover:text-primary text-left cursor-pointer ${currentView === 'home' ? 'text-primary border-b-2 border-primary pb-1 mt-1' : ''}`}
          >
            Lançamentos
          </button>
          <a 
            href="#projects-showcase" 
            className="transition-colors duration-200 hover:text-primary cursor-pointer"
          >
            Exclusivos
          </a>
          <a
            href={`https://wa.me/${settings.phone || '5547999999999'}?text=${encodeURIComponent("Olá! Gostaria de conhecer os lançamentos imobiliários do portal.")}`}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="transition-colors duration-200 hover:text-primary cursor-pointer"
          >
            Contato
          </a>
        </nav>

        {/* Mobile Menu Toggle (DIREITA - MOBILE VIEW) */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 sm:p-2 rounded-lg bg-transparent border border-transparent text-zinc-300 hover:text-white cursor-pointer transition-all focus:outline-none"
          >
            {isOpen ? <X className="h-5.5 w-5.5 sm:h-6 sm:w-6" /> : <Menu className="h-5.5 w-5.5 sm:h-6 sm:w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-white/10 bg-zinc-950 p-6 flex flex-col gap-4"
        >
          <button 
            onClick={() => { onNavigate('home'); setIsOpen(false); }}
            className={`text-sm tracking-widest font-semibold uppercase hover:text-primary text-left py-2 border-b border-zinc-900 ${currentView === 'home' ? 'text-primary' : 'text-zinc-300'}`}
          >
            Lançamentos
          </button>
          <a 
            href="#projects-showcase" 
            onClick={() => setIsOpen(false)}
            className="text-sm tracking-widest font-semibold uppercase text-zinc-300 hover:text-primary py-2 border-b border-zinc-900"
          >
            Exclusivos
          </a>
          <a
            href={`https://wa.me/${settings.phone || '5547999999999'}?text=${encodeURIComponent("Olá! Gostaria de falar com um consultor sobre os lançamentos activos.")}`}
            onClick={() => setIsOpen(false)}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="text-sm tracking-widest font-semibold uppercase text-zinc-300 hover:text-primary py-2 border-b border-zinc-900"
          >
            Contato WhatsApp
          </a>
        </motion.div>
      )}
    </header>
  );
}
