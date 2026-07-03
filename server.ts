import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';

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

const app = express();

// Add JSON and URL-encoded body parsing with 25MB limit to support base64 document attachments
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// API endpoint for automatic email dispatches when messages/leads enter the portal
app.post('/api/notify-email', async (req, res) => {
  try {
    const { type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ error: 'Missing type or data' });
    }

    console.log(`[Email Notification API] Triggered for type: "${type}", user: "${data.name || 'Anonymous'}"`);

    // 1. Fetch current brand configuration to find dispatch target email
    const brandSettings = await fetchBrandSettings();
    const targetEmail = brandSettings?.email || 'comercial.vivasc@gmail.com';
    const companyName = brandSettings?.companyName || 'VIVASC Lançamentos Imobiliários';

    // 2. Build template & Subject
    const { subject, html } = buildEmailHtml(type, data, brandSettings);

    // 3. Resolve attachments
    const attachments: any[] = [];
    if (type === 'lead' && data.preApprovalData) {
      const pa = data.preApprovalData;
      if (pa.rgCpfDoc && pa.rgCpfDoc.base64) {
        const parsed = parseBase64Attachment(pa.rgCpfDoc);
        if (parsed) attachments.push(parsed);
      }
      if (pa.residenciaDoc && pa.residenciaDoc.base64) {
        const parsed = parseBase64Attachment(pa.residenciaDoc);
        if (parsed) attachments.push(parsed);
      }
      if (pa.rendaDoc && pa.rendaDoc.base64) {
        const parsed = parseBase64Attachment(pa.rendaDoc);
        if (parsed) attachments.push(parsed);
      }
    }

    // 4. Set up nodemailer transporter
    const transporter = getMailTransporter();

    if (transporter) {
      const sender = process.env.EMAIL_FROM || process.env.SMTP_USER || 'contato@vivasclancamentos.com';
      const info = await transporter.sendMail({
        from: `"${companyName} Portal" <${sender}>`,
        to: targetEmail,
        subject,
        html,
        attachments
      });
      console.log(`[Email Notification API] Email sent successfully via SMTP! MessageId: ${info.messageId}`);
      return res.json({ success: true, message: 'Email sent via SMTP', messageId: info.messageId });
    } else {
      // Fallback or development visual debug reporting
      console.log("======================================================================");
      console.log(`✉️ [EMAIL WORKSPACE LOG] - SMTP not configured. Printing email content to console.`);
      console.log(`TO: ${targetEmail}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`ATTACHMENTS: ${attachments.length} file(s) attached.`);
      console.log("----------------------------------------------------------------------");
      console.log(`HTML BODY PREVIEW (first 600 chars):\n${html.slice(0, 600)}...`);
      console.log("======================================================================");

      return res.json({ 
        success: true, 
        simulated: true, 
        message: 'Notification processed! Add SMTP environment variables to transmit live.',
        target: targetEmail,
        attachmentsCount: attachments.length
      });
    }
  } catch (err: any) {
    console.error('[Email Notification API Error]', err);
    let friendlyError = err.message || 'Erro desconhecido ao processar e-mail.';
    if (err.message && (err.message.includes('535') || err.message.toLowerCase().includes('invalid login') || err.message.toLowerCase().includes('username and password not accepted'))) {
      friendlyError = "Erro de Autenticação SMTP (Gmail/Google Workspace - Código 535). A Google rejeitou o login e senha configurados na plataforma como SMTP_USER e SMTP_PASS. Se você está usando o e-mail 'comercial.vivasc@gmail.com', o Gmail BLOQUEIA senhas comuns por motivos de segurança. Para corrigir isso: 1. Acesse sua Conta Google. 2. Ative a 'Verificação em 2 Etapas'. 3. Procure por 'Senhas de App' (App Passwords) ao final da página de segurança física. 4. Crie uma nova senha de app chamada 'CRM VIVASC' e copie o código gerado de 16 letras. 5. Cole este código de 16 letras SEM espaços diretamente no segredo SMTP_PASS nas configurações da plataforma.";
    }
    return res.status(500).json({ 
      error: 'Failed to process email dispatch due to SMTP authorization issues', 
      details: err.message,
      friendlyInstructions: friendlyError
    });
  }
});

// API route for short links
app.get('/api/s/:id', async (req, res) => {
  const { id } = req.params;
  const prop = await getPropertyInfo(id);
  if (prop && prop.slug) {
    res.redirect(301, `/imovel/${prop.slug}`);
  } else {
    res.redirect('/');
  }
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /\nSitemap: https://www.meuprimeiroimovelsc.com.br/sitemap.xml');
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const properties = await fetchAllProperties();
    
    async function fetchAllProperties() {
      // Logic to fetch all properties (e.g. from Firestore or INITIAL_PROPERTIES)
      return INITIAL_PROPERTIES; 
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += '  <url>\n    <loc>https://www.meuprimeiroimovelsc.com.br/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n';
    properties.forEach((p: any) => {
      if (p.slug) {
        xml += `  <url>\n    <loc>https://www.meuprimeiroimovelsc.com.br/imovel/${p.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }
    });
    xml += '</urlset>';
    res.type('application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});


// Load template robustly
async function getTemplate(vite?: any): Promise<string> {
    const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
    const isProd = process.env.NODE_ENV === 'production' || isVercel;
    
    // In dev mode (with active vite middleware), we MUST load the root index.html template
    // rather than the compiled dist/index.html to avoid stale asset bundles reference.
    const pathsToTry = (isProd && !vite)
        ? [
            path.resolve(process.cwd(), 'dist/index.html'),
            path.resolve(process.cwd(), '../dist/index.html'),
            path.resolve(process.cwd(), 'index.html')
          ]
        : [
            path.resolve(process.cwd(), 'index.html'),
            path.resolve(process.cwd(), 'dist/index.html'),
            path.resolve(process.cwd(), '../dist/index.html')
          ];

    let templatePath = '';
    for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
            templatePath = p;
            break;
        }
    }
    
    try {
        if (templatePath) {
            console.log(`[SSR] Found template at: ${templatePath}`);
            let template = fs.readFileSync(templatePath, 'utf-8');
            if (vite) {
                template = await vite.transformIndexHtml('/', template);
            }
            return template;
        }
        console.error(`[SSR] Template file NOT found in any searched path: ${JSON.stringify(pathsToTry)}`);
    } catch (e) {
        console.error(`[SSR] Error reading template file at: ${templatePath}`, e);
    }
    
    // Return a minimal fallback HTML to prevent 500
    return '<html><head><title>Meu Primeiro Imóvel</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>';
}

async function handleIndexRequest(req: express.Request, res: express.Response, next: express.NextFunction, vite?: any) {
  const url = req.originalUrl;
  console.log(`[SSR] Request URL: ${url}`);
  
  if (url.includes('.') && !url.includes('?')) {
    return next();
  }

  let template: string;
  try {
      template = await getTemplate(vite);
  } catch (e) {
      console.error('[SSR] Critical Error in getTemplate.', e);
      // Fallback
      template = '<html><head><title>Meu Primeiro Imóvel</title></head><body><div id="root"></div></body></html>';
  }

  const imovelId = String(req.query.imovel || req.query.id || '');
  
  let slug = '';
  const match = req.path.match(/^\/imovel\/([^\/?#]+)\/?$/i);
  if (match) {
    slug = decodeURIComponent(match[1]).trim();
  }
  
  let title = 'Meu Primeiro Imóvel';
  let description = 'Imóveis em Balneário Camboriú, Itajaí e região. Apartamentos, casas e investimentos imobiliários selecionados.';
  let imageUrl = 'https://i.postimg.cc/mrCcfw9n/MODELO-2.png';
  let siteName = 'Meu Primeiro Imóvel';

  // 1. Fetch Brand Settings (Safe)
  try {
      console.log(`[SSR] Fetching brand settings...`);
      const settings = await fetchBrandSettings();
      if (settings) {
          if (settings.companyName) siteName = settings.companyName;
          if (settings.companyName && settings.slogan) title = `${settings.companyName} - ${settings.slogan}`;
          if (settings.shareLogoUrl) imageUrl = settings.shareLogoUrl;
      }
      console.log(`[SSR] Brand settings fetched.`);
  } catch (e) {
      console.error('[SSR] Error fetching brand settings (non-fatal):', e);
  }

  // 2. Fetch Property (Safe)
  let prop: any = null;
  try {
      console.log(`[SSR] Fetching property for ${slug || imovelId}...`);
      if (imovelId) {
          prop = await getPropertyInfo(imovelId);
      } else if (slug && slug !== 'imovel' && slug !== '') {
          prop = await fetchPropertyBySlug(slug);
      }
      console.log(`[SSR] Search Result for ${slug || imovelId}:`, prop ? 'FOUND' : 'NOT FOUND');
  } catch (e) {
      console.error('[SSR] Error fetching property info (non-fatal):', e);
  }

  // 3. Setup Metatags (Safe)
  try {
      console.log(`[SSR] Building metatags...`);
      if (prop) {
        title = prop.seoTitle || `${prop.name || 'Imóvel'} em ${prop.neighborhood || ''}, ${prop.region || ''}`.replace(/, $/, '');
        
        if (prop.seoDescription) {
          description = prop.seoDescription;
        } else {
          const pType = prop.projectType || 'Lançamento';
          const priceFormatted = prop.price ? formatBRL(prop.price) : 'Sob Consulta';
          const locationFormatted = [prop.neighborhood, prop.region].filter(Boolean).join(', ');
          const bedLabel = prop.bedrooms ? `${prop.bedrooms} ` + (Number(prop.bedrooms) === 1 ? 'dormitório' : 'dormitórios') : '';
          const suitesLabel = prop.suites ? ` (${prop.suites} ` + (Number(prop.suites) === 1 ? 'suíte' : 'suítes') + ')' : '';
          const areaLabel = prop.area ? `${prop.area}m²` : '';
          
          const specs = [areaLabel, bedLabel + suitesLabel].filter(Boolean).join(' | ');
          description = `${pType} de Alto Padrão - ${prop.name || 'Imóvel'}${locationFormatted ? ' em ' + locationFormatted : ''}. ${specs ? specs + '. ' : ''}Valor sugerido: a partir de ${priceFormatted}. Fluxo direto com a construtora facilitado. Saiba mais!`;
        }
        
        if (prop.images && prop.images.length > 0) {
          imageUrl = prop.images[0];
        }
      }
      console.log(`[SSR] Metatags built.`);
  } catch (e) {
      console.error('[SSR] Error building metatags (non-fatal):', e);
  }
  
  // 4. Final Response Construction (Safe)
  try {
    console.log(`[SSR] Constructing final response...`);
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
    let host: string = 'santainvest.vercel.app';
    const rawHost = req.headers['x-forwarded-host'] || req.get('host');
    if (rawHost) {
      host = Array.isArray(rawHost) ? rawHost[0] : rawHost;
    }

    let canonicalUrl = `${protocol}://${host}${req.originalUrl}`;
    const sanitizedImageUrl = sanitizeImageUrl(imageUrl, protocol, host);

    const metaTags = `
      <title>${escapeHtml(title)}</title>
      <meta property="og:type" content="website" />
      <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
      <meta property="og:title" content="${escapeHtml(title)}" />
      <meta property="og:description" content="${escapeHtml(description)}" />
      <meta property="og:image" content="${escapeHtml(sanitizedImageUrl)}" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="${escapeHtml(siteName)}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />
      <meta name="twitter:title" content="${escapeHtml(title)}" />
      <meta name="twitter:description" content="${escapeHtml(description)}" />
      <meta name="twitter:image" content="${escapeHtml(sanitizedImageUrl)}" />
      <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    `;

    let html = template;
    // Basic replacement
    html = html.replace(/<title>.*?<\/title>/gi, '');
    html = html.replace(/<meta\s+property=["']og:[^"']*["']\s+content=["'][^"']*["']\s*\/?>/gi, '');
    html = html.replace(/<meta\s+name=["']twitter:[^"']*["']\s+content=["'][^"']*["']\s*\/?>/gi, '');
    html = html.replace(/<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/gi, '');
    
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${metaTags}`);
    } else {
      html = metaTags + html;
    }
    console.log(`[SSR] Response constructed.`);
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  } catch (e: any) {
    console.error('[SSR] Error sending response:', e);
    // FALLBACK: Return template as is to avoid 500
    res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
  }
}


const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const isProd = process.env.NODE_ENV === 'production' || isVercel;

if (isProd) {
  // If we are in production but NOT running on Vercel (e.g. running in Cloud Run/Docker container),
  // we must serve static files from the 'dist' directory.
  if (!isVercel) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
  }
  
  // Clean, synchronous register for production mapping
  app.get('*', (req, res, next) => {
    handleIndexRequest(req, res, next);
  });
} else {
  // Local development: initialize Vite asynchronously
  async function initVite() {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    
    app.get('*', (req, res, next) => {
      handleIndexRequest(req, res, next, vite);
    });
    
    // Start local listening since we are in dev
    app.listen(3000, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:3000`);
    });
  }
  initVite();
}

// Start standalone production listener only when NOT running serverless on Vercel
if (isProd && !isVercel) {
  app.listen(3000, '0.0.0.0', () => {
    console.log(`Server running in standalone mode on port 3000`);
  });
}

export default app;

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
    return 'https://i.postimg.cc/mrCcfw9n/MODELO-2.png';
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
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let projectId = 'meuprimeiroimovel';
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.projectId) {
        projectId = config.projectId;
      }
    }
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/properties/${propId}`;
    const res = await fetch(url);
    if (!res.ok) {
        console.error(`[Data] Failed to fetch property ${propId}. Status: ${res.status}`);
        return null;
    }
    const data: any = await res.json();
    if (!data.fields) {
        console.warn(`[Data] Property ${propId} found but no fields.`);
        return null;
    }
    
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
    console.error(`[Data] Error in fetchPropertyFromFirestore for ${propId}:`, err);
    return null;
  }
}

async function fetchPropertyBySlug(slug: string): Promise<any | null> {
  // 1. Validation
  if (!slug || typeof slug !== 'string' || slug === 'imovel' || slug.length < 3) {
      console.warn(`[Data] Invalid slug provided: ${slug}`);
      return null;
  }

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let projectId = 'meuprimeiroimovel';
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.projectId) projectId = config.projectId;
      } catch (e) {
        console.warn('[Data] Failed to read firebase-applet-config.json, using default');
      }
    }
    
    // Query by slug
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
    console.log(`[Data] Querying slug: ${slug} at ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'properties' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'slug' },
              op: 'EQUAL',
              value: { stringValue: slug }
            }
          }
        }
      })
    });
    
    if (!response.ok) {
        const errText = await response.text();
        console.error(`[Data] Failed to query slug ${slug}. Status: ${response.status}, Body: ${errText}`);
        return null;
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      console.warn(`[Data] Empty Firestore response for slug: ${slug}`);
      return null;
    }

    const match = results.find((item: any) => item && item.document && item.document.fields);
    if (!match?.document) {
      console.warn(`[Data] No valid document found for slug: ${slug}`);
      return null;
    }

    const doc = match.document;
    const fields = doc.fields || null;
    
    if (!fields) {
        console.warn(`[Data] Document found but without fields for slug: ${slug}`);
        return null;
    }
    
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
      images = fields.images.arrayValue.values
        .map((v: any) => v.stringValue)
        .filter((v: any) => typeof v === 'string' && v.length > 0);
    }
    
    return {
      id: doc.name.split('/').pop(),
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
    console.error(`[Data] Unexpected error in fetchPropertyBySlug for ${slug}:`, err);
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
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let projectId = 'meuprimeiroimovel';
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.projectId) projectId = config.projectId;
      } catch (e) {
        console.warn('[Data] Failed to read firebase-applet-config.json in fetchBrandSettings, using default');
      }
    }
    
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/brand`;
    const res = await fetch(url);
    
    if (!res.ok) {
        const errText = await res.text();
        console.error(`[Data] Failed to fetch brand settings. Status: ${res.status}, Body: ${errText}`);
        return null;
    }
    
    const data: any = await res.json();
    if (!data.fields) {
        console.warn(`[Data] Brand settings document found but no fields.`);
        return null;
    }
    
    const fields = data.fields;
    return {
      companyName: fields.companyName?.stringValue || 'VIVASC Lançamentos Imobiliários',
      slogan: fields.slogan?.stringValue || fields.tagline?.stringValue || 'Sua Imobiliária de Confiança em Santa Catarina',
      shareLogoUrl: fields.shareLogoUrl?.stringValue || fields.logoUrl?.stringValue || '',
      phone: fields.phone?.stringValue || '',
      email: fields.email?.stringValue || 'comercial.vivasc@gmail.com',
    };
  } catch (err) {
    console.error(`[Data] Error in fetchBrandSettings:`, err);
    return null;
  }
}

// Nodemailer SMTP Transporter Generator
function getMailTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true', // true to enforce SSL/TLS, false for others
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // avoids SSL handshake issues on some providers
      }
    });
  }
  return null;
}

// Converts attached media files back to Buffer for raw file delivery
function parseBase64Attachment(docObj: { name: string; base64: string }) {
  if (!docObj || !docObj.base64) return null;
  try {
    const parts = docObj.base64.split(';base64,');
    const base64Content = parts.length > 1 ? parts[1] : parts[0];
    return {
      filename: docObj.name,
      content: Buffer.from(base64Content, 'base64'),
    };
  } catch (err) {
    console.error(`[PDF Attachment conversion failed for ${docObj.name}]`, err);
    return null;
  }
}

// Extracts clean, split email and phone strings from the contact info
function extractContactDetails(data: any): { email: string; phone: string } {
  let email = '';
  let phone = '';

  if (data.preApprovalData) {
    email = data.preApprovalData.email || '';
    phone = data.preApprovalData.telefone || '';
  }

  const contactStr = data.contact || '';
  if (!email || !phone) {
    if (contactStr.includes('•')) {
      const parts = contactStr.split('•');
      if (!email) email = parts[0]?.trim() || '';
      if (!phone) phone = parts[1]?.trim() || '';
    } else if (contactStr.includes('@')) {
      email = contactStr.trim();
    } else {
      phone = contactStr.trim();
    }
  }

  // Final trim fallbacks
  if (!email) email = 'não informado';
  if (!phone) phone = 'não informado';

  return { email, phone };
}

// Format date into PT-BR (Sao Paulo Timezone)
function formatLocalTime(isoString: string | undefined): string {
  try {
    const d = isoString ? new Date(isoString) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleString('pt-BR');
    return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch {
    return new Date().toLocaleString('pt-BR');
  }
}

// Builds the secure, mobile/browser compatible instant WhatsApp URL
function buildWhatsAppLink(phoneStr: string): string {
  if (!phoneStr || phoneStr === 'não informado') return '';
  // Remove spaces, dashes, symbols
  const cleaned = phoneStr.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  
  let finalNumber = cleaned;
  // If no country code, prepend Brazil country code (55)
  if (cleaned.length === 10 || cleaned.length === 11) {
    finalNumber = '55' + cleaned;
  }
  return `https://api.whatsapp.com/send?phone=${finalNumber}&text=${encodeURIComponent('Olá! Vi o seu cadastro no Portal da VIVASC Imobiliária. Meu nome é corretor administrador, como posso te ajudar hoje?')}`;
}

// Build a structured, high-conversion, warm and corporate HTML notification email
function buildEmailHtml(type: string, data: any, brandSettings: any): { subject: string; html: string } {
  const company = brandSettings?.companyName || 'VIVASC Lançamentos Imobiliários';
  const logoUrl = brandSettings?.shareLogoUrl || '';
  
  const clientName = data.name || 'Cliente Interessado';
  const registrationDateStr = formatLocalTime(data.createdAt);
  const { email, phone } = extractContactDetails(data);
  const waLink = buildWhatsAppLink(phone);
  const propertyNameStr = data.propertyName || 'Página Principal / Atendimento Geral';
  const propertyIDStr = data.propertyId || 'Institucional';

  // Build beautiful WhatsApp Call-To-Action buttons
  const whatsappButtonHtml = waLink ? `
    <div style="margin-top: 15px; margin-bottom: 20px; text-align: center;">
      <a href="${waLink}" target="_blank" style="background-color: #25d366; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 211, 102, 0.4); text-transform: uppercase; letter-spacing: 0.05em;">
        💬 Chamar no WhatsApp agora
      </a>
    </div>
  ` : '';

  if (type === 'lead') {
    const isPreApproval = !!data.preApprovalData;
    const subject = isPreApproval 
      ? `[PRÉ-APROVAÇÃO] ${clientName} solicitou análise pelo portal`
      : `[LEAD COMERCIAL] Novo contato do portal: ${clientName}`;

    let docsSection = '';
    if (isPreApproval && data.preApprovalData) {
      const pa = data.preApprovalData;
      const docList = [
        pa.rgCpfDoc ? `<li><strong>✓ Cópia do RG/CPF:</strong> ${pa.rgCpfDoc.name} <span style="color:#22c55e; font-size:11px;">(anexado ao email)</span></li>` : `<li><span style="color:#ef4444;">✗</span> Não anexou cópia do RG/CPF</li>`,
        pa.residenciaDoc ? `<li><strong>✓ Comprovante de Residência:</strong> ${pa.residenciaDoc.name} <span style="color:#22c55e; font-size:11px;">(anexado ao email)</span></li>` : `<li><span style="color:#ef4444;">✗</span> Não anexou Comprovante de Residência</li>`,
        pa.rendaDoc ? `<li><strong>✓ Comprovante de Renda (IR/Holerite/INSS):</strong> ${pa.rendaDoc.name} <span style="color:#22c55e; font-size:11px;">(anexado ao email)</span></li>` : `<li><span style="color:#ef4444;">✗</span> Não anexou Comprovante de Renda</li>`
      ].join('');
      
      docsSection = `
        <div style="margin-top: 22px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; color: #0f172a; font-size: 13px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">📁 Copias de Auditoria (Anexos em Base64)</h3>
          <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 12px; line-height: 1.8;">
            ${docList}
          </ul>
        </div>
      `;
    }

    const dataRows = isPreApproval && data.preApprovalData ? `
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>CPF do Cliente:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">${data.preApprovalData.cpf}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Estado Civil:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">${data.preApprovalData.estadoCivil}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Profissão / Cargo:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">${data.preApprovalData.profissao}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Regime CLT ou Autônomo:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #e52521; font-weight: bold; text-transform: uppercase;">${data.preApprovalData.regimeTrabalho}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Renda Bruta Mensal:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #15803d; font-weight: 800; font-size:15px;">R$ ${data.preApprovalData.rendaBruta}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Compor renda familiar extra?</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827;">${data.preApprovalData.comporRenda ? '<strong>Sim</strong>, com dependente ou familiar' : 'Não'}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Entrada disponível:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">${data.preApprovalData.entradaDisponivel || 'Não possui / Sem entrada'}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Parcela mensal disponível:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">${data.preApprovalData.parcelaDisponivel || 'Não possui'}</td></tr>
    ` : `
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Interesse imobiliário:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">Simular fluxo comercial direto / Tabela Construtora</td></tr>
    `;

    const html = `
      <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 40px 10px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e5e7eb;">
          
          <!-- BRAND COLOR TOP BANNER -->
          <div style="background-color: #171717; padding: 30px; text-align: center; border-bottom: 5px solid #e52521;">
            ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-height: 55px; margin-bottom: 12px; display: inline-block;" />` : ''}
            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em;">${isPreApproval ? 'Ficha de Pré-Aprovação de Crédito' : 'Novo Lead Recebido'}</h1>
            <p style="margin: 6px 0 0 0; color: #a3a3a3; font-size: 11px; letter-spacing: 0.15em; font-weight: 700; text-transform: uppercase;">CRM VIVASC LANÇAMENTOS IMOBILIÁRIOS</p>
          </div>

          <!-- EMAIL COMPONENT BODY -->
          <div style="padding: 30px;">
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 0;">Olá, equipe <strong>${escapeHtml(company)}</strong>,</p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
              Temos um novo lead comercial cadastrado no portal. Veja os dados de atendimento:
            </p>

            <div style="margin-top: 25px;">
              <h2 style="font-size: 14px; text-transform: uppercase; color: #111827; border-bottom: 3px solid #e52521; padding-bottom: 6px; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 15px;">📋 Informações Cadastrais</h2>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280; width: 45%;"><strong>Nome do Cliente:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 700;">${escapeHtml(clientName)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>E-mail:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #2563eb; font-weight: 600;">${escapeHtml(email)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Telefone Principal:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">${escapeHtml(phone)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Imóvel de Interesse:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-style: italic; font-weight: 600;">${escapeHtml(propertyNameStr)} (ID: ${escapeHtml(propertyIDStr)})</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Data e Hora do Cadastro:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #374151;">${escapeHtml(registrationDateStr)} (T.L. Brasil/SP)</td>
                </tr>
                ${dataRows}
              </table>

              <!-- LEAVE OBS MESSAGE -->
              <div style="margin-top: 25px; background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px;">
                <span style="display: block; font-size: 10px; text-transform: uppercase; color: #888888; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 6px;">Mensagem Enviada pelo Portal:</span>
                <p style="margin: 0; color: #374151; font-size: 13px; font-style: italic; line-height: 1.6;">
                  "${escapeHtml(data.message || '')}"
                </p>
              </div>

              <!-- Action WhatsApp -->
              ${whatsappButtonHtml}

              ${docsSection}
            </div>

            <!-- ACTION CORRETOR TIPS -->
            <div style="margin-top: 30px; border-top: 2px dashed #e5e7eb; padding-top: 20px; font-size: 12px; color: #6b7280; line-height: 1.6;">
              💡 <strong>Dica do Sistema:</strong> Acesse o Painel Administrativo no portal para ver e atribuir esse lead a corretores licenciados ou para fazer o download fácil das cópias anexadas caso o cliente as tenha enviado.
            </div>

            <p style="margin-top: 35px; margin-bottom: 0px; text-align: center; font-size: 11px; color: #9ca3af; letter-spacing:0.02em;">
              Notificação corporativa processada pelo sistema de CRM VIVASC Lançamentos Imobiliários.
            </p>
          </div>
          
        </div>
      </div>
    `;
    return { subject, html };
  } else {
    // Standard User Question Form / Message
    const subject = `[CONTATO RÁPIDO] Nova mensagem recebida: ${clientName}`;
    const html = `
      <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 40px 10px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden;">
          
          <div style="background-color: #171717; padding: 30px; text-align: center; border-bottom: 5px solid #e52521;">
            ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-height: 55px; margin-bottom: 12px; display: inline-block;" />` : ''}
            <h1 style="margin: 0; color: #ffffff; font-size: 21px; font-weight: 800; text-transform: uppercase;">Nova Mensagem Informativa</h1>
            <p style="margin: 5px 0 0 0; color: #a3a3a3; font-size: 11px; letter-spacing: 0.1em; font-weight: bold; text-transform: uppercase;">Portal Meu Primeiro Imóvel</p>
          </div>

          <div style="padding: 30px;">
            <p style="color: #4b5563; font-size: 14px; margin-top: 0;">Olá, corretor administrador <strong>${escapeHtml(company)}</strong>,</p>
            <p style="color: #4b5563; font-size: 14px;">Um visitante enviou um questionamento pelo formulário rápido de contato:</p>
            
            <div style="margin-top: 25px; background-color: #fdfdfd; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
              <table style="width: 100%; font-size: 13px; color: #374151; margin-bottom: 15px;">
                <tr><td style="padding: 8px 0; color:#888888; width: 35%;"><strong>Nome:</strong></td><td style="padding: 8px 0; color:#111827; font-weight:bold;">${escapeHtml(clientName)}</td></tr>
                <tr><td style="padding: 8px 0; color:#888888;"><strong>E-mail:</strong></td><td style="padding: 8px 0; color:#2563eb; font-weight:bold;">${escapeHtml(email)}</td></tr>
                <tr><td style="padding: 8px 0; color:#888888;"><strong>Telefone / Zoom:</strong></td><td style="padding: 8px 0; color:#111827; font-weight:bold;">${escapeHtml(phone)}</td></tr>
                <tr><td style="padding: 8px 0; color:#888888;"><strong>Imóvel de Referência / Assunto:</strong></td><td style="padding: 8px 0; font-style:italic; font-weight:bold;">${escapeHtml(propertyNameStr)} (Ref ID: ${escapeHtml(propertyIDStr)})</td></tr>
                <tr><td style="padding: 8px 0; color:#888888;"><strong>Data do Envio:</strong></td><td>${escapeHtml(registrationDateStr)} (T. L. Brasil/SP)</td></tr>
              </table>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
                <span style="display: block; font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 6px;">Mensagem Completa:</span>
                <p style="margin: 0; color: #111827; font-size: 13px; font-style: italic; line-height: 1.6; background-color:#fafafa; padding:12px; border-radius:8px; border:1px solid #f3f4f6;">
                  "${escapeHtml(data.message || '')}"
                </p>
              </div>

              <!-- Action WhatsApp Link -->
              ${whatsappButtonHtml}
            </div>

            <p style="margin-top: 35px; margin-bottom: 0px; text-align: center; font-size: 11px; color: #9ca3af;">
              Este e-mail é disparado de forma protegida e automatizada.
            </p>
          </div>
          
        </div>
      </div>
    `;
    return { subject, html };
  }
}


