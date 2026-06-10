import React from 'react';
import { BrandSettings } from '../types';

interface FooterProps {
  settings: BrandSettings;
  onTabChange?: (tab: 'home' | 'sobre' | 'lançamentos' | 'bairros' | 'favoritos' | 'contato') => void;
  onNavigateToHome?: () => void;
  onNavigateToAdmin?: () => void;
}

export default function Footer({ settings, onTabChange, onNavigateToHome, onNavigateToAdmin }: FooterProps) {
  const menus: { id: 'home' | 'sobre' | 'lançamentos' | 'bairros' | 'favoritos' | 'contato'; label: string }[] = [
    { id: 'home', label: 'Início' },
    { id: 'lançamentos', label: 'Lançamentos' },
    { id: 'bairros', label: 'Bairros' },
    { id: 'sobre', label: 'Sobre Nós' },
    { id: 'favoritos', label: 'Favoritos' },
    { id: 'contato', label: 'Contato' }
  ];

  const handleMenuClick = (tabId: typeof menus[number]['id']) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
    if (onNavigateToHome) {
      onNavigateToHome();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-zinc-100 text-zinc-700 border-t border-zinc-200 py-10 sm:py-16 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Top container: columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-6 mb-12">
          
          {/* Left column: Logo & Menus one below the other */}
          <div className="flex flex-col items-start space-y-6">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.brandName || "Logo"}
                referrerPolicy="no-referrer"
                className="max-h-[60px] object-contain cursor-pointer h-auto"
                onClick={() => handleMenuClick('home')}
              />
            ) : (
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleMenuClick('home')}
              >
                <div className="h-8 w-8 bg-[#203366] rounded-lg flex items-center justify-center text-white font-black text-xs">
                  M1
                </div>
                <span className="text-lg font-black text-[#203366] tracking-tight uppercase">
                  {settings?.brandName || 'Meu Primeiro Imóvel'}
                </span>
              </div>
            )}

            {/* Menus one below another */}
            <div className="flex flex-col space-y-2.5 pl-1">
              <span className="text-[10px] font-bold tracking-widest text-[#203366] uppercase">
                Acesse o Site
              </span>
              <div className="flex flex-col space-y-1.5">
                {menus.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleMenuClick(m.id)}
                    className="text-left text-xs font-medium text-zinc-600 hover:text-[#203366] hover:underline transition-colors focus:outline-none cursor-pointer"
                  >
                    {m.label}
                  </button>
                ))}
                
                {onNavigateToAdmin && (
                  <button
                    onClick={() => {
                      onNavigateToAdmin();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-left text-xs font-semibold text-[#203366] hover:text-[#FF9D00] hover:underline transition-colors focus:outline-none cursor-pointer flex items-center gap-1 pt-1.5 border-t border-zinc-200/60 mt-1"
                  >
                    ⚙ Painel Admin
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right column: Terms and Privacy Policy right-aligned or styled clearly */}
          <div className="flex flex-col md:items-end justify-center space-y-3 md:text-right pr-2">
            <span className="text-[10px] font-bold tracking-widest text-[#203366] uppercase">
              Legal & Regulamentar
            </span>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => alert(`Termos de Uso & Privacidade de ${settings?.brandName || 'Meu Primeiro Imóvel'}:\n\nTodos os logins e dados fornecidos cooperam com as regras da lei geral de proteção de dados (LGPD). Os atendimentos imobiliários são liderados por profissionais corretores inscritos no CRECI.`)}
                className="text-left md:text-right text-xs font-semibold text-[#203366] hover:underline cursor-pointer"
              >
                Termos & Privacidade
              </button>
              <button
                onClick={() => alert(`Política de Privacidade:\n\nNosso portal armazena temporariamente dados de favoritos localmente e envia de maneira criptografada solicitações de contato ao e-mail institucional e canais de corretores licenciados no WhatsApp.`)}
                className="text-left md:text-right text-xs text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                Política de privacidade
              </button>
            </div>
          </div>

        </div>

        {/* Bottom row: copyright with CRECI and CNPJ */}
        <div className="border-t border-zinc-250 pt-8 flex flex-col items-center justify-center text-center space-y-2">
          
          <p className="text-xs text-zinc-500 font-medium">
            © {currentYear} @Copyright <span className="font-semibold text-zinc-850">{settings?.companyName || 'Meu Primeiro Imóvel ME'}</span> | <span className="font-mono text-[11px] font-bold text-zinc-800">{settings?.creci || 'Creci 36847'}</span>
          </p>

          <p className="text-[11px] font-mono text-zinc-450 tracking-wider">
            CNPJ: {settings?.cnpj || '51.874.234/0001-90'}
          </p>

          <div className="pt-2 text-[10px] text-zinc-400">
            Balneário Camboriú / Santa Catarina • Atendimento Premium 
          </div>

        </div>

      </div>
    </footer>
  );
}
