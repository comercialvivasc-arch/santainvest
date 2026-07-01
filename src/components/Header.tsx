import React from 'react';
import { Menu, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { BrandSettings } from '../types';

interface HeaderProps {
  settings: BrandSettings;
}

export default function Header({ 
  settings 
}: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const location = useLocation();

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

  const menuItems: { to: string; label: string }[] = [
    { to: '/', label: 'Lançamentos' },
    { to: '/bairros', label: 'Bairros' },
    { to: '/sobre', label: 'Sobre Nós' },
    { to: '/cadastro', label: 'Cadastro' },
    { to: '/favoritos', label: 'Favoritos' },
    { to: '/contato', label: 'Contato' }
  ];

  return (
    <header 
      style={{ backgroundColor: '#ff6200' }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${headerBgClass} ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div 
        style={{ backgroundColor: '#ff6200' }}
        className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8"
      >
        {/* Futuristic Logo & Brand (ESQUERDA) */}
        <Link 
          to="/"
          className="flex cursor-pointer items-center gap-2 sm:gap-3 group shrink-0"
          id="brand-logo"
        >
          {settings.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={settings.brandName || "Logo"} 
              referrerPolicy="no-referrer"
              style={{ width: '128px' }}
              className="object-contain transition-all duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary rotate-45 shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border border-white sm:border-2 -rotate-45"></div>
              <div className="absolute -inset-0.5 animate-pulse rounded-lg bg-primary/30 blur-sm -z-10 group-hover:bg-primary/50"></div>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-wider text-white uppercase sm:text-base font-sans leading-none">
              {settings.brandName || 'VIVA SC'}
            </span>
            <span className="hidden sm:inline text-[8px] font-semibold tracking-widest text-[#FF9D00] uppercase font-mono mt-0.5">
              {settings.tagline || 'Futuristic Living'}
            </span>
          </div>
        </Link>

        {/* Navigation & Actions (DIREITA) */}
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs xl:text-sm font-bold tracking-wide uppercase shrink-0">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link 
                key={item.to}
                to={item.to}
                className={`transition-all duration-200 cursor-pointer text-left relative py-1 ${
                  isActive 
                    ? 'text-[#FF9D00]' 
                    : 'text-zinc-100 hover:text-[#FF9D00]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-[-4px] left-0 right-0 h-[2.5px] bg-[#FF9D00] rounded-full animate-fade-in" />
                )}
              </Link>
            );
          })}
          <Link
            to="/admin"
            className="text-[10px] tracking-widest font-mono uppercase bg-[#FF9D00] text-black font-extrabold py-2 px-4 rounded-xl shadow-lg cursor-pointer hover:bg-white transition-all duration-200"
          >
            Painel Admin
          </Link>
        </nav>

        {/* Mobile Menu Toggle (DIREITA - MOBILE VIEW) */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 sm:p-2 rounded-lg bg-transparent border border-transparent text-zinc-350 hover:text-white cursor-pointer transition-all focus:outline-none"
          >
            {isOpen ? (
              <X style={{ width: '28px', height: '28px' }} />
            ) : (
              <Menu style={{ width: '28px', height: '28px' }} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ backgroundColor: '#1d2c55' }}
          className="lg:hidden border-t border-zinc-800 p-5 flex flex-col gap-2 shadow-2xl relative z-40"
        >
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link 
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={`text-xs tracking-wider font-extrabold uppercase py-3 px-4 rounded-xl text-left transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#203366] text-[#FF9D00]' 
                    : 'text-zinc-200 hover:bg-[#203366]/50 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            to="/admin"
            onClick={() => setIsOpen(false)}
            className="text-xs tracking-widest font-mono uppercase bg-[#FF9D00] text-black font-extrabold py-3.5 px-4 rounded-xl text-center mt-2.5 shadow-lg cursor-pointer"
          >
            Painel Admin
          </Link>
        </motion.div>
      )}
    </header>
  );
}
