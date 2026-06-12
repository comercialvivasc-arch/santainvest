import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Cookie, Check } from 'lucide-react';
import { BrandSettings } from '../types';

interface CookieConsentProps {
  settings: BrandSettings;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export default function CookieConsent({ settings, onOpenTerms, onOpenPrivacy }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if consent has been given already
    const consent = localStorage.getItem('vivas_cookie_consent_v1');
    const isConsentEnabled = settings?.enableCookieConsent !== false;

    if (!consent && isConsentEnabled) {
      // Small delayed appearance for smooth loading feeling
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [settings]);

  const handleAccept = () => {
    localStorage.setItem('vivas_cookie_consent_v1', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('vivas_cookie_consent_v1', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  const defaultCookieText = `Este site utiliza cookies de navegação essenciais para personalizar ofertas e analisar o tráfego do portal com segurança, sob as diretrizes da Lei Geral de Proteção de Dados (LGPD). Ao continuar, você concorda com o uso de cookies em seu dispositivo.`;
  const text = settings?.cookieText || defaultCookieText;

  return (
    <AnimatePresence>
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[180] select-none">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          className="relative bg-zinc-950/95 border border-zinc-800 backdrop-blur-md rounded-2xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col gap-4 text-left"
        >
          {/* Top layout */}
          <div className="flex gap-3">
            <div className="h-9 w-9 bg-orange-500/10 border border-orange-500/25 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
              <Cookie className="h-5 w-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                Consentimento de Cookies (LGPD)
              </h4>
              <p className="text-[11px] leading-relaxed text-zinc-300">
                {text}
              </p>
            </div>
          </div>

          {/* Links related to terms */}
          <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] text-zinc-500 pl-1 border-t border-zinc-850 pt-3">
            <span>Consulte nossos:</span>
            <button
              onClick={onOpenTerms}
              className="text-orange-500 hover:text-white font-semibold transition-colors underline decoration-dotted cursor-pointer"
            >
              Termos de Uso
            </button>
            <span>&bull;</span>
            <button
              onClick={onOpenPrivacy}
              className="text-orange-500 hover:text-white font-semibold transition-colors underline decoration-dotted cursor-pointer"
            >
              Política de Privacidade
            </button>
          </div>

          {/* Buttons layout */}
          <div className="flex items-center gap-2 mt-1 select-none">
            <button
              onClick={handleDecline}
              className="flex-1 py-2 text-[10px] text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 rounded-lg text-center uppercase tracking-wider transition-all border border-zinc-850/60 font-semibold cursor-pointer active:scale-95"
            >
              Recusar
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 py-2 text-[10px] text-black bg-orange-500 hover:bg-orange-450 rounded-lg text-center uppercase tracking-wider font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 active:scale-95"
            >
              <Check className="h-3 w-3 stroke-[3]" />
              Aceitar Cookies
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
