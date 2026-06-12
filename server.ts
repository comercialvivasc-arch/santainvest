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
      
      let title = 'VIVASC - Lançamentos Imobiliários';
      let description = 'Encontre o imóvel dos seus sonhos em Santa Catarina. Lançamentos com fluxo de pagamento sob medida!';
      let imageUrl = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&h=630&q=80';
      const canonicalUrl = `https://${req.get('host') || 'ais-pre-wiffv4jkprcwv6spmkf2oj-178679523613.us-east1.run.app'}${req.originalUrl}`;

      if (imovelId) {
        const prop = await getPropertyInfo(imovelId);
        if (prop) {
          title = `${prop.name} - Lançamento em ${prop.neighborhood}`;
          
          const roomsLabel = prop.bedrooms === 1 ? '1 quarto' : `${prop.bedrooms} quartos`;
          const areaLabel = `${prop.area}m²`;
          const locationLabel = `${prop.neighborhood}, ${prop.region}`;
          const priceLabel = prop.price ? ` - Preço sugerido: ${formatBRL(prop.price)}` : '';
          
          description = `Lançamento Imperdível: ${prop.name}. Apartamento com ${roomsLabel}, área de ${areaLabel} no bairro ${locationLabel}${priceLabel}. Fale conosco pelo WhatsApp!`;
          
          if (prop.images && prop.images.length > 0) {
            imageUrl = prop.images[0];
          }
        }
      } else {
        const settings = await fetchBrandSettings();
        if (settings) {
          title = `${settings.companyName} - ${settings.slogan}`;
        }
      }

      // Generate dynamic meta tags
      const metaTags = `
    <title>${escapeHtml(title)}</title>
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    `;

      // Replace and clean any existing tags
      let html = template;
      html = html.replace(/<title>.*?<\/title>/gi, '');
      
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

async function fetchPropertyFromFirestore(propId: string): Promise<Property | null> {
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
    const bedrooms = fields.bedrooms?.integerValue ? parseInt(fields.bedrooms.integerValue, 10) : 0;
    const area = fields.area?.integerValue ? parseInt(fields.area.integerValue, 10) : 0;
    const price = fields.price?.integerValue ? parseInt(fields.price.integerValue, 10) : 0;
    
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
    };
  } catch (err) {
    return null;
  }
}

async function getPropertyInfo(propId: string): Promise<Property | null> {
  const firestoreProp = await fetchPropertyFromFirestore(propId);
  if (firestoreProp) {
    return firestoreProp;
  }
  const found = INITIAL_PROPERTIES.find((p) => p.id === propId);
  if (found) {
    return found as Property;
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
    return {
      companyName: data.fields.companyName?.stringValue || 'VIVASC Lançamentos Imobiliários',
      slogan: data.fields.slogan?.stringValue || 'Sua Imobiliária de Confiança em Santa Catarina',
    };
  } catch {
    return null;
  }
}

startServer();
