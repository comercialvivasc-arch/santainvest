import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Fallback properties
import { INITIAL_PROPERTIES } from './src/data';

interface Property {
  id: string;
  name: string;
  status: string;
  neighborhood: string;
  region: string;
  bedrooms: number;
  area: number;
  price: number;
  images: string[];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  let vite: any;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
  }

  // Intercept index page / GET route
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    
    // Pass assets to standard handling
    if (url.includes('.') && !url.includes('?')) {
      return next();
    }

    try {
      let template: string;
      if (process.env.NODE_ENV !== 'production') {
        template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
      } else {
        template = fs.readFileSync(path.resolve(process.cwd(), 'dist/index.html'), 'utf-8');
      }

      // Check query parameters for product/property ID
      const imovelId = String(req.query.imovel || req.query.id || '');
      
      let title = 'Santa Invest Imóveis';
      let description = 'Imóveis em Balneário Camboriú, Itajaí e região. Apartamentos, casas e investimentos imobiliários selecionados.';
      let imageUrl = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&h=630&q=80';
      let siteName = 'Santa Invest Imóveis';

      const settings = await fetchBrandSettings();
      if (settings) {
        if (settings.companyName) {
          siteName = settings.companyName;
        }
        if (settings.companyName && settings.slogan) {
          title = `${settings.companyName} - ${settings.slogan}`;
        }
        if (settings.shareLogoUrl) {
          imageUrl = settings.shareLogoUrl;
        }
      }

      // Determine the dynamic canonical URL context & properties
      const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
      let host: string = 'santainvest.vercel.app';
      const rawHost = req.headers['x-forwarded-host'] || req.get('host');
      if (rawHost) {
        if (Array.isArray(rawHost)) {
          host = rawHost[0];
        } else {
          host = rawHost;
        }
      }

      let canonicalUrl = `${protocol}://${host}/`;
      if (imovelId) {
        canonicalUrl += `?imovel=${imovelId}`;
      } else {
        const cleanPath = req.path === '/' ? '' : req.path;
        canonicalUrl += cleanPath;
      }

      if (imovelId) {
        const prop = await getPropertyInfo(imovelId);
        if (prop) {
          title = prop.seoTitle || `${prop.name} em ${prop.neighborhood}, ${prop.region}`;
          
          if (prop.seoDescription) {
            description = prop.seoDescription;
          } else {
            const pType = prop.projectType || 'Lançamento';
            const priceFormatted = prop.price ? formatBRL(prop.price) : 'Sob Consulta';
            const locationFormatted = `${prop.neighborhood}, ${prop.region}`;
            const bedLabel = prop.bedrooms ? `${prop.bedrooms} ` + (Number(prop.bedrooms) === 1 ? 'dormitório' : 'dormitórios') : '';
            const suitesLabel = prop.suites ? ` (${prop.suites} ` + (Number(prop.suites) === 1 ? 'suíte' : 'suítes') + ')' : '';
            const areaLabel = prop.area ? `${prop.area}m²` : '';
            
            const specs = [areaLabel, bedLabel + suitesLabel].filter(Boolean).join(' | ');
            description = `${pType} de Alto Padrão - ${prop.name} em ${locationFormatted}. ${specs ? specs + '. ' : ''}Valor sugerido: a partir de ${priceFormatted}. Fluxo direto com a construtora facilitado. Saiba mais!`;
          }
          
          if (prop.images && prop.images.length > 0) {
            imageUrl = prop.images[0];
          }
        }
      }

      const sanitizedImageUrl = sanitizeImageUrl(imageUrl, protocol, host);

      // Generate dynamic meta tags in pristine compliance
      const metaTags = `
    <title>${escapeHtml(title)}</title>
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(sanitizedImageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(sanitizedImageUrl)}" />

    <!-- SEO / Canonical Links -->
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    `;

      // Replace and clean any existing duplicate tags
      let html = template;
      html = html.replace(/<title>.*?<\/title>/gi, '');
      html = html.replace(/<meta\s+property=["']og:[^"']*["']\s+content=["'][^"']*["']\s*\/?>/gi, '');
      html = html.replace(/<meta\s+name=["']twitter:[^"']*["']\s+content=["'][^"']*["']\s*\/?>/gi, '');
      html = html.replace(/<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/gi, '');
      
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${metaTags}`);
      } else {
        html = metaTags + html;
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e: any) {
      if (process.env.NODE_ENV !== 'production' && vite) {
        vite.ssrFixStacktrace(e);
      }
      console.error('Render error:', e);
      res.status(500).end(e.stack || 'Server Error');
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VIVASC Server] Running on http://localhost:${PORT}`);
  });
}

// Helpers
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

function sanitizeImageUrl(imgUrl: string, protocol: string, host: string): string {
  if (!imgUrl) {
    return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&h=630&q=80';
  }
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
    return imgUrl;
  }
  if (imgUrl.startsWith('//')) {
    return `${protocol}:${imgUrl}`;
  }
  if (imgUrl.startsWith('/')) {
    return `${protocol}://${host}${imgUrl}`;
  }
  return `${protocol}://${host}/${imgUrl}`;
}

async function fetchPropertyFromFirestore(propId: string): Promise<any | null> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/meuprimeiroimovel/databases/(default)/documents/properties/${propId}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    if (!data.fields) return null;
    
    const fields = data.fields;
    const name = fields.name?.stringValue || '';
    const status = fields.status?.stringValue || '';
    const neighborhood = fields.neighborhood?.stringValue || '';
    const region = fields.region?.stringValue || '';
    const projectType = fields.projectType?.stringValue || 'Apartamento';
    
    const bedrooms = fields.bedrooms?.integerValue ? parseInt(fields.bedrooms.integerValue, 10) : 
                     (fields.bedrooms?.doubleValue ? Math.round(fields.bedrooms.doubleValue) : 0);
                     
    const suites = fields.suites?.integerValue ? parseInt(fields.suites.integerValue, 10) : 
                   (fields.suites?.doubleValue ? Math.round(fields.suites.doubleValue) : 0);
                   
    const parkingSpaces = fields.parkingSpaces?.integerValue ? parseInt(fields.parkingSpaces.integerValue, 10) : 
                          (fields.parkingSpaces?.doubleValue ? Math.round(fields.parkingSpaces.doubleValue) : 0);
                          
    const area = fields.area?.integerValue ? parseInt(fields.area.integerValue, 10) : 
                 (fields.area?.doubleValue ? Math.round(fields.area.doubleValue) : 0);
                 
    const price = fields.price?.integerValue ? parseInt(fields.price.integerValue, 10) : 
                  (fields.price?.doubleValue ? Math.round(fields.price.doubleValue) : 0);
                  
    const seoTitle = fields.seoTitle?.stringValue || '';
    const seoDescription = fields.seoDescription?.stringValue || '';
    
    let images: string[] = [];
    if (fields.images?.arrayValue?.values) {
      images = fields.images.arrayValue.values.map((v: any) => v.stringValue).filter(Boolean);
    }
    
    return {
      id: propId,
      name,
      status,
      neighborhood,
      region,
      bedrooms,
      area,
      price,
      images,
      projectType,
      suites,
      parkingSpaces,
      seoTitle,
      seoDescription
    };
  } catch (err) {
    return null;
  }
}

async function getPropertyInfo(propId: string): Promise<any | null> {
  const firestoreProp = await fetchPropertyFromFirestore(propId);
  if (firestoreProp) {
    return firestoreProp;
  }
  const found = INITIAL_PROPERTIES.find((p) => p.id === propId);
  if (found) {
    return found;
  }
  return null;
}

async function fetchBrandSettings(): Promise<any | null> {
  try {
    const url = 'https://firestore.googleapis.com/v1/projects/meuprimeiroimovel/databases/(default)/documents/settings/brand';
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    if (!data.fields) return null;
    
    const fields = data.fields;
    return {
      companyName: fields.companyName?.stringValue || 'VIVASC Lançamentos Imobiliários',
      slogan: fields.slogan?.stringValue || 'Sua Imobiliária de Confiança em Santa Catarina',
      shareLogoUrl: fields.shareLogoUrl?.stringValue || fields.logoUrl?.stringValue || '',
      phone: fields.phone?.stringValue || '',
    };
  } catch {
    return null;
  }
}

startServer();
