export interface FloorPlan {
  id: string;
  name: string;        // e.g. "Planta Tipo A"
  image: string;       // URL or Base64 string
  description: string; // Description details e.g. "3 Suítes sendo 1 Master com closet, Cozinha gourmet e Churrasqueira"
  area?: string | number; // m² (optional)
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
  price: number; // starting price (valor a partir de)
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
  installmentsPct?: number;
  installmentsCount?: number;
  reintegrationPct?: number;
  reintegrationCount?: number;
  reintegrationValue?: number;
  keysPct?: number;
  keysValue?: number;
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
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  observations: string;
  createdAt: string;
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
}

