import { Property, BannerAd, BrandSettings } from './types';

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    name: 'Aura Cyber Residence',
    status: 'Em construção',
    deliveryDate: 'Out/27',
    neighborhood: 'Meia Praia',
    region: 'Litoral',
    address: 'Av. Beira Mar, 2100 - Itapema - SC',
    projectType: 'Apartamento',
    bedrooms: 3,
    area: 120,
    parkingSpaces: 2,
    price: 1250000,
    downpayment: 125000,
    installments: 4500,
    availableUnits: 8,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
    ],
    floorPlans: [
      {
        id: 'fp-1-1',
        name: 'Planta Tipo A (Frente Mar)',
        image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
        description: 'Amplo living com sacada integrada e churrasqueira a carvão, 3 suítes plenas (sendo 1 master com hidromassagem e closet), cozinha em conceito aberto e 2 vagas de garagem privativas.',
        area: 120
      },
      {
        id: 'fp-1-2',
        name: 'Planta Tipo B (Lateral Vista Mar)',
        image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80',
        description: 'Planta otimizada com 3 dormitórios (sendo 1 suíte espaçosa e 2 demi-suítes), cozinha americana integrada à sala de jantar/estar, rebaixamento em gesso e acabamento de alto padrão.',
        area: 110
      }
    ]
  },
  {
    id: 'prop-2',
    name: 'Nexus Future Tower',
    status: 'Lançamento',
    deliveryDate: 'Dez/28',
    neighborhood: 'Jardins',
    region: 'São Paulo',
    address: 'Alameda Lorena, 1420 - Jardins - SP',
    projectType: 'Apartamento',
    bedrooms: 2,
    area: 85,
    parkingSpaces: 1,
    price: 890000,
    downpayment: 89000,
    installments: 3200,
    availableUnits: 15,
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80'
    ],
    floorPlans: [
      {
        id: 'fp-2-1',
        name: 'Planta Executive Loft',
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        description: 'Living integrado com pé-direito duplo, 2 suítes no mezanino tecnológico, fechadura biométrica e automação residencial completa alexa/google assistant integrados.',
        area: 85
      }
    ]
  },
  {
    id: 'prop-3',
    name: 'Vanguard Horizon Penthouse',
    status: 'Pronto',
    deliveryDate: 'Imediata',
    neighborhood: 'Barra da Tijuca',
    region: 'Rio de Janeiro',
    address: 'Av. Lúcio Costa, 3500 - Barra - RJ',
    projectType: 'Cobertura',
    bedrooms: 4,
    area: 210,
    parkingSpaces: 3,
    price: 3450000,
    downpayment: 69000,
    installments: 12500,
    availableUnits: 3,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'prop-4',
    name: 'Skyline Lumina Studio',
    status: 'Pré-lançamento',
    deliveryDate: 'Jul/26',
    neighborhood: 'Centro',
    region: 'Litoral',
    address: 'Rua 1500, 450 - Balneário Camboriú - SC',
    projectType: 'Studio',
    bedrooms: 1,
    area: 45,
    parkingSpaces: 1,
    price: 490000,
    downpayment: 49000,
    installments: 1800,
    isMcmv: true,
    availableUnits: 12,
    cefContractFee: 3200,
    images: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

export const INITIAL_BANNERS: BannerAd[] = [
  {
    id: 'banner-1',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80',
    title: 'O Futuro Mora no Topo',
    subtitle: 'Lançamentos exclusivos que redefinem o luxo e a inovação tecnológica sustentável.',
    active: true
  },
  {
    id: 'banner-2',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
    title: 'Invista com Inteligência',
    subtitle: 'Os melhores projetos de alto padrão com as melhores condições de pagamento direto com a construtora.',
    active: true
  }
];

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  id: 'brand',
  phone: '5547999999999',
  email: 'comercial.vivasc@gmail.com',
  logoUrl: '',
  brandName: 'Meu Primeiro Imóvel',
  tagline: 'Imóveis Selecionados de Alto Padrão',
  faviconUrl: '',
  shareLogoUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&h=630&q=80',
  companyName: 'Meu Primeiro Imóvel',
  creci: 'Creci 36847',
  cnpj: '51.874.234/0001-90',
  footerLogoUrl: '',
  footerLogoHeight: '',
  termsOfUse: '',
  privacyPolicy: '',
  cookieText: '',
  enableCookieConsent: true
};
