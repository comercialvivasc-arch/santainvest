import React from 'react';
import { Menu, X, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { BrandSettings } from '../types';
import { useLanguage, Language } from '../context/LanguageContext';

interface HeaderProps {
  currentView: 'home' | 'admin';
  onNavigate: (view: 'home' | 'admin') => void;
  currentTab: 'home' | 'sobre' | 'lançamentos' | 'bairros' | 'favoritos' | 'contato';
  onTabChange: (tab: 'home' | 'sobre' | 'lançamentos' | 'bairros' | 'favoritos' | 'contato') => void;
  query?: string;
  setQuery?: (q: string) => void;
  settings: BrandSettings;
}

export default function Header({ 
  currentView, 
  onNavigate, 
  currentTab, 
  onTabChange, 
  query, 
  setQuery, 
  settings 
}: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { language, setLanguage, t } = useLanguage();

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

  const menuItems: { id: typeof currentTab; label: string }[] = [
    { id: 'lançamentos', label: t('nav.lançamentos') },
    { id: 'bairros', label: t('nav.bairros') },
    { id: 'sobre', label: t('nav.sobre') },
    { id: 'favoritos', label: t('nav.favoritos') },
    { id: 'contato', label: t('nav.contato') }
  ];

  const languagesList: { code: Language; label: string; flag: string }[] = [
    { code: 'pt', label: 'PT', flag: '🇧🇷' },
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'es', label: 'ES', flag: '🇪🇸' }
  ];

  const handleMenuClick = (tabId: typeof currentTab) => {
    onTabChange(tabId);
    onNavigate('home');
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header 
      style={{ backgroundColor: '#203366' }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${headerBgClass} ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div 
        style={{ backgroundColor: '#203366' }}
        className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8"
      >
        {/* Futuristic Logo & Brand (ESQUERDA) */}
        <div 
          onClick={() => handleMenuClick('home')} 
          className="flex cursor-pointer items-center gap-2 sm:gap-3 group shrink-0"
          id="brand-logo"
        >
          {settings.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={settings.brandName || "Logo"} 
              referrerPolicy="no-referrer"
              className="w-[120px] h-[60px] sm:w-[155px] sm:h-[80px] object-contain transition-all duration-300 group-hover:scale-105"
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
        </div>

        {/* Navigation & Actions (DIREITA) */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Desktop Navigation */}
          <nav className="flex items-center gap-5 xl:gap-7 text-xs xl:text-sm font-bold tracking-wide uppercase shrink-0">
            {menuItems.map((item) => {
              const isActive = currentView === 'home' && currentTab === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
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
                </button>
              );
            })}
          </nav>

          {/* Desktop Language Selector */}
          <div className="flex items-center gap-1.5 border-l border-zinc-700/60 pl-4 ml-1">
            {languagesList.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`text-[10px] px-2 py-1.5 rounded-lg transition-all font-mono font-black ${
                  language === lang.code
                    ? 'bg-[#FF9D00] text-[#203366] shadow'
                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
                aria-label={`Switch to ${lang.label}`}
              >
                <span className="mr-1">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

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
            const isActive = currentView === 'home' && currentTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`text-xs tracking-wider font-extrabold uppercase py-3 px-4 rounded-xl text-left transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#203366] text-[#FF9D00]' 
                    : 'text-zinc-200 hover:bg-[#203366]/50 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {/* Mobile Language Selector */}
          <div className="flex items-center justify-between bg-[#203366]/60 border border-zinc-700/30 rounded-xl px-4 py-2.5 my-2">
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-[#FF9D00]" />
              {t('ui.select_lang')}
            </span>
            <div className="flex gap-1.5">
              {languagesList.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    language === lang.code
                      ? 'bg-[#FF9D00] text-[#203366] shadow-md scale-105'
                      : 'text-zinc-300 bg-[#1d2c55]/80 hover:text-white'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              onNavigate(currentView === 'admin' ? 'home' : 'admin');
              setIsOpen(false);
            }}
            className="text-xs tracking-widest font-mono uppercase bg-[#FF9D00] text-black font-extrabold py-3.5 px-4 rounded-xl text-center mt-2 shadow-lg cursor-pointer"
          >
            {currentView === 'admin' ? t('nav.back') : t('nav.admin')}
          </button>
        </motion.div>
      )}
    </header>
  );
}
