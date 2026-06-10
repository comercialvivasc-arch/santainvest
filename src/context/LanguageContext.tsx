import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'pt' | 'en' | 'es';

type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
  pt: {
    // Nav / Menu items
    'nav.home': 'Home',
    'nav.lançamentos': 'Lançamentos',
    'nav.bairros': 'Bairros',
    'nav.sobre': 'Sobre Nós',
    'nav.favoritos': 'Favoritos',
    'nav.contato': 'Contato',
    'nav.admin': 'Painel Admin',
    'nav.back': 'Voltar ao Portal',

    // Search Panel & Hero
    'search.quick': 'Busca Rápida',
    'search.placeholder': 'Qual cidade ou bairro você busca?',
    'search.global_placeholder': 'Busque por Região, Bairro, Empreendimento ou Palavras-chave...',
    'search.clear': 'Limpar',
    'search.clear_filters': 'Limpar filtros',
    'search.title': 'Filtrar Lançamentos',
    'search.price_range': 'Faixa de Preço',
    'search.max_price': 'Valor Máximo',
    'search.min_price_label': 'Preço Mínimo',
    'search.max_price_label': 'Preço Máximo',
    'search.property_type': 'Tipo de Imóvel',
    'search.bedrooms': 'Dormitórios Recomendados',
    'search.all': 'Todos',
    'search.stage': 'Estágio da Obra',
    'search.results': 'Visualizar Resultados',
    'search.suggestions': 'Sugestões',
    'search.regions_found': 'Regiões Encontradas',
    'search.no_favorites': 'Você ainda não favoritou nenhum lançamento comercial. Clique nos anúncios e favorite o imóvel de seu interesse!',
    'search.property': 'imóvel',
    'search.properties': 'imóveis',

    // Property stages
    'stage.pre': 'Pré-lançamento',
    'stage.launch': 'Lançamento',
    'stage.construction': 'Em construção',
    'stage.ready': 'Pronto',

    // Property Card & Detail modal
    'prop.delivery': 'Previsão de Entrega',
    'prop.bedrooms': 'Dormitórios',
    'prop.suites': 'Suítes',
    'prop.vagas': 'Vagas',
    'prop.area': 'Área',
    'prop.from': 'A partir de',
    'prop.downpay_from': 'Entrada a partir de',
    'prop.installments_from': 'Parcelas a partir de',
    'prop.plans': 'Plantas Disponíveis',
    'prop.video': 'Vídeo de Apresentação',
    'prop.broker': 'Falar com Corretor',
    'prop.proposal': 'Solicitar Proposta',
    'prop.copy_link': 'Copiar Link',
    'prop.link_copied': 'Link copiado!',
    'prop.sim_title': 'Simulação de Financiamento',
    'prop.address': 'Endereço',
    'prop.details_title': 'Detalhes do Lançamento',

    // Contact Form
    'form.name': 'Seu Nome',
    'form.phone': 'Seu Telefone / WhatsApp',
    'form.message': 'Mensagem',
    'form.message_placeholder': 'Olá, tenho interesse neste imóvel. Gostaria de receber mais informações e tabelas.',
    'form.submit': 'Enviar Proposta no WhatsApp',
    'form.success': 'Mensagem enviada com sucesso!',
    'form.error': 'Erro ao enviar mensagem. Preencha todos os campos corretamente.',

    // General UI
    'ui.rights': 'Todos os direitos reservados.',
    'ui.creci': 'CRECI comercial',
    'ui.cnpj': 'CNPJ',
    'ui.select_lang': 'Selecione o Idioma',
    'ui.alternative_logo': 'Logotipo Alternativo para o Rodapé',
    'ui.saving': 'Salvando...',
    'ui.saved': 'Configurações salvas com sucesso!',
    'ui.loading': 'Carregando dados...',

    // Hero Text defaults
    'hero.badge': 'Lançamentos de Auto Padrão',
    'hero.search_cta': 'Qual cidade ou bairro você busca?',
    'hero.see_all': 'Ver todos os imóveis'
  },
  en: {
    // Nav / Menu items
    'nav.home': 'Home',
    'nav.lançamentos': 'Properties',
    'nav.bairros': 'Neighborhoods',
    'nav.sobre': 'About Us',
    'nav.favoritos': 'Favorites',
    'nav.contato': 'Contact',
    'nav.admin': 'Admin Panel',
    'nav.back': 'Back to Portal',

    // Search Panel & Hero
    'search.quick': 'Quick Search',
    'search.placeholder': 'Which city or neighborhood are you looking for?',
    'search.global_placeholder': 'Search by Region, Neighborhood, Project or Keywords...',
    'search.clear': 'Clear',
    'search.clear_filters': 'Clear filters',
    'search.title': 'Filter Properties',
    'search.price_range': 'Price Range',
    'search.max_price': 'Maximum Price',
    'search.min_price_label': 'Minimum Price',
    'search.max_price_label': 'Maximum Price',
    'search.property_type': 'Property Type',
    'search.bedrooms': 'Recommended Bedrooms',
    'search.all': 'All',
    'search.stage': 'Construction Stage',
    'search.results': 'View Results',
    'search.suggestions': 'Suggestions',
    'search.regions_found': 'Regions Found',
    'search.no_favorites': 'You have not favorited any launches yet. Explore our properties and click the star icon to save!',
    'search.property': 'property',
    'search.properties': 'properties',

    // Property stages
    'stage.pre': 'Pre-launch',
    'stage.launch': 'Launch',
    'stage.construction': 'Under construction',
    'stage.ready': 'Ready to move',

    // Property Card & Detail modal
    'prop.delivery': 'Estimated Delivery',
    'prop.bedrooms': 'Bedrooms',
    'prop.suites': 'Suites',
    'prop.vagas': 'Garages',
    'prop.area': 'Area',
    'prop.from': 'Starting from',
    'prop.downpay_from': 'Downpayment from',
    'prop.installments_from': 'Installments from',
    'prop.plans': 'Available Floor Plans',
    'prop.video': 'Presentation Video',
    'prop.broker': 'Chat with Broker',
    'prop.proposal': 'Request Proposal',
    'prop.copy_link': 'Copy Link',
    'prop.link_copied': 'Link copied!',
    'prop.sim_title': 'Financing Simulation',
    'prop.address': 'Address',
    'prop.details_title': 'Property Details',

    // Contact Form
    'form.name': 'Your Name',
    'form.phone': 'Your Phone / WhatsApp',
    'form.message': 'Message',
    'form.message_placeholder': 'Hello, I am interested in this property. I would like to receive more details.',
    'form.submit': 'Send Proposal on WhatsApp',
    'form.success': 'Message sent successfully!',
    'form.error': 'Error sending message. Please fill in all fields correctly.',

    // General UI
    'ui.rights': 'All rights reserved.',
    'ui.creci': 'CRECI license',
    'ui.cnpj': 'CNPJ legal ID',
    'ui.select_lang': 'Select Language',
    'ui.alternative_logo': 'Alternative Footer Logo',
    'ui.saving': 'Saving changes...',
    'ui.saved': 'Settings saved successfully!',
    'ui.loading': 'Loading properties...',

    // Hero Text defaults
    'hero.badge': 'Luxury & Premium Developments',
    'hero.search_cta': 'Which city or neighborhood are you looking for?',
    'hero.see_all': 'See all properties'
  },
  es: {
    // Nav / Menu items
    'nav.home': 'Inicio',
    'nav.lançamentos': 'Lanzamientos',
    'nav.bairros': 'Barrios',
    'nav.sobre': 'Quiénes Somos',
    'nav.favoritos': 'Favoritos',
    'nav.contato': 'Contacto',
    'nav.admin': 'Panel Admin',
    'nav.back': 'Volver al Portal',

    // Search Panel & Hero
    'search.quick': 'Búsqueda Rápida',
    'search.placeholder': '¿Qué ciudad o barrio estás buscando?',
    'search.global_placeholder': 'Busque por Región, Barrio, Proyecto o Palabras clave...',
    'search.clear': 'Limpiar',
    'search.clear_filters': 'Limpiar filtros',
    'search.title': 'Filtrar Lanzamientos',
    'search.price_range': 'Rango de Precios',
    'search.max_price': 'Valor Máximo',
    'search.min_price_label': 'Precio Mínimo',
    'search.max_price_label': 'Precio Máximo',
    'search.property_type': 'Tipo de Inmueble',
    'search.bedrooms': 'Dormitorios Recomendados',
    'search.all': 'Todos',
    'search.stage': 'Etapa de la Obra',
    'search.results': 'Ver Resultados',
    'search.suggestions': 'Sugerencias',
    'search.regions_found': 'Regiones Encontradas',
    'search.no_favorites': 'No has guardado ningún lanzamiento todavía. ¡Explora nuestros anuncios y haz clic en favoritos!',
    'search.property': 'inmueble',
    'search.properties': 'inmuebles',

    // Property stages
    'stage.pre': 'Pre-lanzamiento',
    'stage.launch': 'Lanzamiento',
    'stage.construction': 'En construcción',
    'stage.ready': 'Listo',

    // Property Card & Detail modal
    'prop.delivery': 'Previsión de Entrega',
    'prop.bedrooms': 'Dormitorios',
    'prop.suites': 'Suites',
    'prop.vagas': 'Cocheras',
    'prop.area': 'Área',
    'prop.from': 'A partir de',
    'prop.downpay_from': 'Entrada a partir de',
    'prop.installments_from': 'Cuotas a partir de',
    'prop.plans': 'Planos Disponibles',
    'prop.video': 'Video de Presentación',
    'prop.broker': 'Hablar con Corredor',
    'prop.proposal': 'Solicitar Propuesta',
    'prop.copy_link': 'Copiar Enlace',
    'prop.link_copied': '¡Enlace copiado!',
    'prop.sim_title': 'Simulación de Financiación',
    'prop.address': 'Dirección',
    'prop.details_title': 'Detalles del Lanzamiento',

    // Contact Form
    'form.name': 'Su Nombre',
    'form.phone': 'Su Teléfono / WhatsApp',
    'form.message': 'Mensaje',
    'form.message_placeholder': 'Hola, estoy interesado en este inmueble. Me gustaría recibir más información.',
    'form.submit': 'Enviar Propuesta por WhatsApp',
    'form.success': '¡Mensaje enviado con éxito!',
    'form.error': 'Error al enviar mensaje. Rellene todos los campos correctamente.',

    // General UI
    'ui.rights': 'Todos los derechos reservados.',
    'ui.creci': 'CRECI licencia',
    'ui.cnpj': 'CNPJ corporativo',
    'ui.select_lang': 'Seleccionar Idioma',
    'ui.alternative_logo': 'Logotipo Alternativo para el Rodapé',
    'ui.saving': 'Guardando...',
    'ui.saved': '¡Guardado correctamente!',
    'ui.loading': 'Cargando datos...',

    // Hero Text defaults
    'hero.badge': 'Lanzamientos de Alto Nivel',
    'hero.search_cta': '¿Qué ciudad o barrio estás buscando?',
    'hero.see_all': 'Ver todos los inmuebles'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('vivas_site_lang');
      if (saved === 'en' || saved === 'es' || saved === 'pt') {
        return saved;
      }
    } catch {}
    return 'pt';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('vivas_site_lang', lang);
    } catch {}
  };

  const t = (key: string): string => {
    const dict = dictionaries[language] || dictionaries.pt;
    if (dict[key] !== undefined) {
      return dict[key];
    }
    // Fallback to Portuguese dictionary
    const ptDict = dictionaries.pt;
    if (ptDict[key] !== undefined) {
      return ptDict[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
