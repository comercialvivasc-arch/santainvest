export interface FloorPlan {
  id: string;
  name: string;        // e.g. "Planta Tipo A"
  image: string;       // URL or Base64 string
  description: string; // Description details e.g. "3 Suítes sendo 1 Master com closet, Cozinha gourmet e Churrasqueira"
  area?: string | number; // m² (optional)
  bedrooms?: string | number; // Add bedrooms
}

export interface Property {
  id: string;
  name: string;
  status: 'Lançamento' | 'Em construção' | 'Pronto' | 'Pré-lançamento';
  deliveryDate: string; // e.g., 'Mar/26', 'Dez/25'
  neighborhood: string;
  address: string;
  region: string; // e.g., 'Centro', 'Zona Sul', 'Litoral'
  projectType: string; // e.g., 'Apartamento', 'Cobertura', 'Studio', 'Casa'
  bedrooms: string | number;
  suites?: string | number;
  area: string | number; // in m²
  parkingSpaces: string | number;
  price: string | number; // starting price (valor a partir de) - Changed to string | number
  downpayment: number; // entrada a partir de
  installments: number; // parcelas a partir de
  images: string[]; // array of images for the slider
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  schemaMarkup?: string;
  privateNotes?: string;
  detailedDescription?: string;
  videoUrl?: string;
  floorPlans?: FloorPlan[];
  downpaymentPct?: number;
  downpaymentInstallmentsCount?: number;
  installmentsPct?: number;
  installmentsCount?: number;
  reintegrationPct?: number;
  reintegrationCount?: number;
  reintegrationValue?: number;
  keysPct?: number;
  keysValue?: number;
  isMcmv?: boolean;
  mcmvLogoUrl?: string;
  cefContractFee?: number;
  availableUnits?: number;
  tableConditionDescription?: string;
}

export interface BannerAd {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  link?: string;
  active: boolean;
}

export interface SearchFilters {
  query: string;
  bedrooms: number | null; // null means any
  maxPrice: number;
}

export interface BrandSettings {
  id: string; // usually 'brand'
  phone: string; // WhatsApp phone
  email: string; // contact form email
  logoUrl: string; // brand logo image URL
  brandName: string; // brand headline
  tagline: string; // brand tagline
  faviconUrl?: string; // custom tab favicon
  shareLogoUrl?: string; // main/home share preview logo image url
  companyName?: string; // legal company name e.g. "Meu Primeiro Imóvel ME"
  creci?: string;       // CRECI number e.g. "36847"
  cnpj?: string;        // CNPJ number e.g. "00.000.000/0001-00"
  footerLogoUrl?: string; // alternative brand logo URL for dark or light backgrounds (e.g., footer)
  footerLogoHeight?: string; // custom footer logo height (e.g. "40px" or "10")
  termsOfUse?: string;      // custom terms of use and privacy text
  privacyPolicy?: string;   // custom privacy policy text
  cookieText?: string;      // custom cookie text description
  enableCookieConsent?: boolean; // configuration to enable or disable the cookie consent banner
  aboutHeading?: string;    // Badge text above "Sobre Nós"
  aboutSubtitle?: string;   // Introduction subtitle under "Sobre Nós"
  aboutHistory?: string;    // History text under "História & Propósito"
  mcmvLogoUrl?: string;     // Logo for Minha Casa Minha Vida
  cadastroHeading?: string; // Heading for Cadastro page
  cadastroSubtitle?: string;// Subtitle for Cadastro page
  cadastroContent?: string; // Content for Cadastro page
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'Administrador' | 'Corretor' | 'Cliente';
  phone?: string;
  createdAt: string;
}

export interface Broker {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Ativo' | 'Inativo';
  region: string;
  createdAt: string;
  chatName?: string;
  chatPhotoUrl?: string;
  password?: string;
  receiveChat?: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  observations: string;
  createdAt: string;
}

export interface PreApprovalData {
  cpf: string;
  estadoCivil: string;
  profissao: string;
  email: string;
  telefone: string;
  rendaBruta: string;
  regimeTrabalho: 'CLT' | 'Autônomo';
  comporRenda: boolean;
  entradaDisponivel?: string;
  parcelaDisponivel?: string;
  rgCpfDoc?: { name: string; size: number; base64: string };
  residenciaDoc?: { name: string; size: number; base64: string };
  rendaDoc?: { name: string; size: number; base64: string };
}

export interface Lead {
  id: string;
  name: string;
  contact: string;
  message: string;
  propertyId: string;
  propertyName: string;
  status: 'Novo' | 'Em Atendimento' | 'Visita Agendada' | 'Finalizado';
  brokerId?: string; // assigned broker ID
  brokerName?: string; // assigned broker name
  preApprovalData?: PreApprovalData; // custom pre-approval details
  createdAt: string;
}

export interface Visit {
  id: string;
  propertyId: string;
  propertyName: string;
  clientName: string;
  clientContact: string;
  date: string;
  time: string;
  status: 'Pendente' | 'Confirmada' | 'Realizada' | 'Cancelada';
  brokerId?: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  name: string;
  contact: string;
  message: string;
  propertyId: string;
  createdAt: string;
  assignedBrokerId?: string;
  assignedBrokerName?: string;
  status?: 'Novo' | 'Atendendo' | 'Finalizado';
  replies?: {
    id: string;
    author: string;
    content: string;
    createdAt: string;
    isBroker: boolean;
  }[];
}

