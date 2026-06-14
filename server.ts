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

async function startServer() {
  const app = express();
  const PORT = 3000;

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
      return res.status(500).json({ error: 'Failed to process email dispatch', details: err.message });
    }
  });

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
      
      let title = 'Meu Primeiro Imóvel';
      let description = 'Imóveis em Balneário Camboriú, Itajaí e região. Apartamentos, casas e investimentos imobiliários selecionados.';
      let imageUrl = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&h=630&q=80';
      let siteName = 'Meu Primeiro Imóvel';

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
      email: fields.email?.stringValue || 'comercial.vivasc@gmail.com',
    };
  } catch {
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

// Build a structured, high-conversion, warm and corporate HTML notification email
function buildEmailHtml(type: string, data: any, brandSettings: any): { subject: string; html: string } {
  const company = brandSettings?.companyName || 'VIVASC Lançamentos Imobiliários';
  const logoUrl = brandSettings?.shareLogoUrl || '';
  
  if (type === 'lead') {
    const isPreApproval = !!data.preApprovalData;
    const clientName = data.name || 'Cliente Interessado';
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
        <div style="margin-top: 22px; background-color: #f7fee7; border: 1px solid #d9f99d; border-radius: 12px; padding: 18px;">
          <h3 style="margin-top: 0; margin-bottom: 10px; color: #3f6212; font-size: 13px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">📁 Copias de Auditoria (Anexos Originais)</h3>
          <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 12px; line-height: 1.8;">
            ${docList}
          </ul>
        </div>
      `;
    }

    const dataRows = isPreApproval && data.preApprovalData ? `
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>CPF:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">${data.preApprovalData.cpf}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Estado Civil:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">${data.preApprovalData.estadoCivil}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Profissão:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">${data.preApprovalData.profissao}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Regime CLT ou Autônomo:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #e52521; font-weight: bold; text-transform: uppercase;">${data.preApprovalData.regimeTrabalho}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Renda Bruta Mensal:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #15803d; font-weight: 800; font-size:15px;">R$ ${data.preApprovalData.rendaBruta}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Compor renda familiar extra?</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827;">${data.preApprovalData.comporRenda ? '<strong>Sim</strong>, com dependente ou familiar' : 'Não'}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Entrada disponível:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">${data.preApprovalData.entradaDisponivel || 'Não possui / Sem entrada'}</td></tr>
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Parcela mensal disponível:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">${data.preApprovalData.parcelaDisponivel || 'Não possui'}</td></tr>
    ` : `
      <tr><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Interesse imobiliário:</strong></td><td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">Simular fluxo comercial direto</td></tr>
    `;

    const html = `
      <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 40px 10px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e5e7eb;">
          
          <!-- BRAND COLOR TOP BANNER -->
          <div style="background-color: #171717; padding: 30px; text-align: center; border-bottom: 5px solid #e52521;">
            ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-height: 55px; margin-bottom: 12px; display: inline-block;" />` : ''}
            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em;">${isPreApproval ? 'Ficha de Pré-Aprovação de Crédito' : 'Novo Lead do Portal'}</h1>
            <p style="margin: 6px 0 0 0; color: #a3a3a3; font-size: 11px; letter-spacing: 0.15em; font-weight: 700; text-transform: uppercase;">AUDITORIA VIVASC LANÇAMENTOS IMOBILIÁRIOS</p>
          </div>

          <!-- EMAIL COMPONENT BODY -->
          <div style="padding: 30px;">
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 0;">Olá, administrador e corretores do portal <strong>${escapeHtml(company)}</strong>,</p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
              O cliente <strong>${escapeHtml(clientName)}</strong> preencheu um formulário comercial de simulação bancária para o imóvel <strong>${escapeHtml(data.propertyName)}</strong>. Veja os detalhes cadastrados abaixo:
            </p>

            <div style="margin-top: 25px;">
              <h2 style="font-size: 14px; text-transform: uppercase; color: #111827; border-bottom: 3px solid #e52521; padding-bottom: 6px; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 15px;">📋 Informações Cadastrais</h2>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280; width: 45%;"><strong>Nome do Cliente:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 700;">${escapeHtml(data.name)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>E-mail:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #2563eb; font-weight: 600;">${escapeHtml(isPreApproval ? data.preApprovalData?.email || '' : data.contact.split('•')[0]?.trim() || '')}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Telefone Principal:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-weight: 600;">${escapeHtml(isPreApproval ? data.preApprovalData?.telefone || '' : data.contact.split('•')[1]?.trim() || data.contact)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #6b7280;"><strong>Empreendimento de Referência:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 2px solid #f3f4f6; color: #111827; font-style: italic;">${escapeHtml(data.propertyName)} (ID: ${data.propertyId})</td>
                </tr>
                ${dataRows}
              </table>

              <!-- LEAVE OBS MESSAGE -->
              <div style="margin-top: 25px; background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px;">
                <span style="display: block; font-size: 10px; text-transform: uppercase; color: #888888; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 6px;">Mensagem Enviada pelo Portal:</span>
                <p style="margin: 0; color: #374151; font-size: 13px; font-style: italic; line-height: 1.6;">
                  "${escapeHtml(data.message)}"
                </p>
              </div>

              ${docsSection}
            </div>

            <!-- ACTION CORRETOR TIPS -->
            <div style="margin-top: 30px; border-top: 2px dashed #e5e7eb; padding-top: 20px; font-size: 12px; color: #6b7280; line-height: 1.6;">
              💡 <strong>Dica de Atendimento:</strong> Acesse o Painel do Administrador no site para ver este lead, realizar a atribuição a um corretor licenciado ou baixar com comodidade todos os documentos originais arquivados em base de dados de segurança.
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
    const clientName = data.name || 'Visitante Anônimo';
    const subject = `[PORTAL VIVASC] Mensagem de Contato Rápido - ${clientName}`;
    const html = `
      <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 40px 10px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden;">
          
          <div style="background-color: #171717; padding: 30px; text-align: center; border-bottom: 5px solid #e52521;">
            ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-height: 55px; margin-bottom: 12px; display: inline-block;" />` : ''}
            <h1 style="margin: 0; color: #ffffff; font-size: 21px; font-weight: 800; text-transform: uppercase;">Nova Mensagem de Contato</h1>
            <p style="margin: 5px 0 0 0; color: #a3a3a3; font-size: 11px; letter-spacing: 0.1em; font-weight: bold; text-transform: uppercase;">Portal Meu Primeiro Imóvel</p>
          </div>

          <div style="padding: 30px;">
            <p style="color: #4b5563; font-size: 14px; margin-top: 0;">Olá, corretor administrador <strong>${escapeHtml(company)}</strong>,</p>
            <p style="color: #4b5563; font-size: 14px;">Um visitante enviou um questionamento pelo formulário rápido de contato:</p>
            
            <div style="margin-top: 25px; background-color: #fdfdfd; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
              <table style="width: 100%; font-size: 13px; color: #374151; margin-bottom: 15px;">
                <tr><td style="padding: 8px 0; color:#888888; width: 30%;"><strong>Nome:</strong></td><td style="padding: 8px 0; color:#111827; font-weight:bold;">${escapeHtml(data.name)}</td></tr>
                <tr><td style="padding: 8px 0; color:#888888;"><strong>Contato direto:</strong></td><td style="padding: 8px 0; color:#2563eb; font-weight:bold;">${escapeHtml(data.contact)}</td></tr>
                <tr><td style="padding: 8px 0; color:#888888;"><strong>Código Imóvel:</strong></td><td style="padding: 8px 0; font-style:italic;">${escapeHtml(data.propertyId || 'Página Institucional')}</td></tr>
                <tr><td style="padding: 8px 0; color:#888888;"><strong>Enviado em:</strong></td><td>${new Date(data.createdAt).toLocaleString('pt-BR')}</td></tr>
              </table>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
                <span style="display: block; font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 6px;">Mensagem Completa:</span>
                <p style="margin: 0; color: #111827; font-size: 13px; font-style: italic; line-height: 1.6; background-color:#fafafa; padding:12px; border-radius:8px; border:1px solid #f3f4f6;">
                  "${escapeHtml(data.message)}"
                </p>
              </div>
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

startServer();
