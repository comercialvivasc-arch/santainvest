import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Helper to escape HTML characters
function escapeHtml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getFirebaseProjectId(): string {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.projectId) {
        return config.projectId;
      }
    }
  } catch (err) {
    console.error('Failed to read firebase config file in Vercel function', err);
  }
  return 'meuprimeiroimovel';
}

async function fetchBrandSettings(): Promise<any | null> {
  try {
    const projectId = getFirebaseProjectId();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/brand`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    if (!data.fields) return null;
    
    const fields = data.fields;
    return {
      companyName: fields.companyName?.stringValue || 'VIVASC Lançamentos Imobiliários',
      slogan: fields.slogan?.stringValue || fields.tagline?.stringValue || 'Sua Imobiliária de Confiança em Santa Catarina',
      shareLogoUrl: fields.shareLogoUrl?.stringValue || fields.logoUrl?.stringValue || '',
      phone: fields.phone?.stringValue || '',
      email: fields.email?.stringValue || 'comercial.vivasc@gmail.com',
    };
  } catch {
    return null;
  }
}

function getMailTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return null;
}

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

  if (!email) email = 'não informado';
  if (!phone) phone = 'não informado';

  return { email, phone };
}

function formatLocalTime(isoString: string | undefined): string {
  try {
    const d = isoString ? new Date(isoString) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleString('pt-BR');
    return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch {
    return new Date().toLocaleString('pt-BR');
  }
}

function buildWhatsAppLink(phoneStr: string): string {
  if (!phoneStr || phoneStr === 'não informado') return '';
  const cleaned = phoneStr.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  
  let finalNumber = cleaned;
  if (cleaned.length === 10 || cleaned.length === 11) {
    finalNumber = '55' + cleaned;
  }
  return `https://api.whatsapp.com/send?phone=${finalNumber}&text=${encodeURIComponent('Olá! Vi o seu cadastro no Portal da VIVASC Imobiliária. Meu nome é corretor administrador, como posso te ajudar hoje?')}`;
}

function buildEmailHtml(type: string, data: any, brandSettings: any): { subject: string; html: string } {
  const company = brandSettings?.companyName || 'VIVASC Lançamentos Imobiliários';
  const logoUrl = brandSettings?.shareLogoUrl || '';
  
  const clientName = data.name || 'Cliente Interessado';
  const registrationDateStr = formatLocalTime(data.createdAt);
  const { email, phone } = extractContactDetails(data);
  const waLink = buildWhatsAppLink(phone);
  const propertyNameStr = data.propertyName || 'Página Principal / Atendimento Geral';
  const propertyIDStr = data.propertyId || 'Institucional';

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
          
          <div style="background-color: #171717; padding: 30px; text-align: center; border-bottom: 5px solid #e52521;">
            ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-height: 55px; margin-bottom: 12px; display: inline-block;" />` : ''}
            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; text-transform: uppercase;">${isPreApproval ? 'Ficha de Pré-Aprovação de Crédito' : 'Novo Lead Recebido'}</h1>
            <p style="margin: 6px 0 0 0; color: #a3a3a3; font-size: 11px; letter-spacing: 0.15em; font-weight: 700; text-transform: uppercase;">CRM VIVASC LANÇAMENTOS IMOBILIÁRIOS</p>
          </div>

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

              <div style="margin-top: 25px; background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px;">
                <span style="display: block; font-size: 10px; text-transform: uppercase; color: #888888; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 6px;">Mensagem Enviada pelo Portal:</span>
                <p style="margin: 0; color: #374151; font-size: 13px; font-style: italic; line-height: 1.6;">
                  "${escapeHtml(data.message || '')}"
                </p>
              </div>

              ${whatsappButtonHtml}

              ${docsSection}
            </div>

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ error: 'Missing type or data' });
    }

    console.log(`[Vercel Serverless Email] Processing: type="${type}"`);

    // 1. Fetch settings
    const brandSettings = await fetchBrandSettings();
    const targetEmail = brandSettings?.email || 'comercial.vivasc@gmail.com';

    // 2. Build email template
    const { subject, html } = buildEmailHtml(type, data, brandSettings);

    // 3. Resolve attachments
    const attachments: any[] = [];
    if (type === 'lead' && data.preApprovalData) {
      const pa = data.preApprovalData;
      if (pa.rgCpfDoc) {
        const att = parseBase64Attachment(pa.rgCpfDoc);
        if (att) attachments.push(att);
      }
      if (pa.residenciaDoc) {
        const att = parseBase64Attachment(pa.residenciaDoc);
        if (att) attachments.push(att);
      }
      if (pa.rendaDoc) {
        const att = parseBase64Attachment(pa.rendaDoc);
        if (att) attachments.push(att);
      }
    }

    // 4. Create mail transporter
    const transporter = getMailTransporter();
    if (!transporter) {
      console.warn('[Vercel SMTP Warn] SMTP credentials are not fully defined in environment. Simulating dispatch logs.');
      return res.status(200).json({
        success: true,
        message: 'Lead processed. SMTP is simulated (local server-only).',
        simulatedLogs: {
          recipient: targetEmail,
          subject,
          attachmentsCount: attachments.length
        }
      });
    }

    // 5. Send actual email
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'comercial.vivasc@gmail.com';
    const info = await transporter.sendMail({
      from: `"CRM Portal VIVASC" <${fromAddress}>`,
      to: targetEmail,
      subject,
      html,
      attachments
    });

    console.log('[Vercel SMTP Success] Email sent safely, MsgID:', info.messageId);
    return res.status(200).json({
      success: true,
      message: 'Email dispatched successfully via Vercel Serverless Function.',
      messageId: info.messageId
    });

  } catch (error: any) {
    console.error('[Vercel Serverless Email Error]', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal Server Error'
    });
  }
}
