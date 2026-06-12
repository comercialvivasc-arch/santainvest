import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, FileText, CheckCircle } from 'lucide-react';
import { BrandSettings } from '../types';

interface LegalDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
  settings: BrandSettings;
}

export default function LegalDocsModal({ isOpen, onClose, type, settings }: LegalDocsModalProps) {
  const isTerms = type === 'terms';
  const companyName = settings?.companyName || 'Meu Primeiro Imóvel ME';
  const creci = settings?.creci || 'Creci 36847';
  const cnpj = settings?.cnpj || '51.874.234/0001-90';
  const brandName = settings?.brandName || 'VIVA SC';

  // Fallback text if admin left it empty
  const defaultTerms = `### Termos de Uso e Consentimento

Bem-vindo ao portal **${brandName}**. Ao acessar e navegar por este site, você concorda em cumprir e estar sujeito aos seguintes Termos de Uso:

1. **Escopo dos Serviços**: Este site é uma vitrine digital de lançamentos imobiliários de alto padrão em Santa Catarina. As tabelas de preços, simulações de fluxo de entrada, parcelas e informações de plantas de apartamentos apresentadas têm caráter meramente informativo e ilustrativo. Todos os valores podem sofrer alterações sem aviso prévio. A confirmação de preços e unidades deve ser realizada diretamente com o corretor responsável.
2. **Atendimento Especializado**: Todo o atendimento consultivo e a intermediação de negócios são liderados por corretores licenciados inscritos regularmente no Conselho Regional de Corretores de Imóveis (CRECI Santa Catarina).
3. **Consentimento de Contato**: Ao preencher qualquer formulário eletrônico de simulação ou clicar em botões de direcionamento ao WhatsApp, você concorda voluntariamente em receber mensagens, ligações e e-mails de nossos consultores para prestar-lhe assessoria imobiliária direcionada ao seu perfil.
4. **Resolução de Conflitos**: Fica eleito o foro da comarca de Balneário Camboriú/SC para dirimir qualquer controvérsia decorrente do uso deste portal, com renúncia expressa a qualquer outro.`;

  const defaultPrivacy = `### Política de Privacidade e Proteção de Dados (LGPD)

A privacidade e a proteção dos seus dados pessoais são prioridades fundamentais para a **${companyName}** (CRECI: ${creci} | CNPJ: ${cnpj}). Esta política de privacidade descreve em linguagem simples e transparente como coletamos, usamos e protegemos suas informações, em total conformidade com a **Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)**.

1. **Coleta de Informações**: Nós coletamos dados pessoais quando você os fornece por livre e espontânea vontade em nossos campos de cadastro (formulários de simulação) ou interações de atendimento via WhatsApp. Os dados coletados incluem:
   - Nome completo e sobrenome
   - Telefone celular com WhatsApp
   - Endereço de e-mail

2. **Finalidade de Uso**: Estas informações são utilizadas unicamente com a finalidade de:
   - Fornecer simulações financeiras personalizadas sobre os empreendimentos de seu interesse (ex: Entrada, parcelas mensais, balões adicionais, etc).
   - Enviar novidades, tabelas atualizadas, plantas e vídeos exclusivos de lançamentos imobiliários.
   - Entrar em contato via WhatsApp ou telefone para prestar assessoria exclusiva de investimento ou moradia.

3. **Armazenamento Seguro**: Seus dados de contato são armazenados em servidores seguros, protegidos contra acessos não autorizados. Jamais comercializamos, vendemos ou alugamos seus dados pessoais a terceiros. Seus contatos são processados apenas internamente por nossa equipe de vendas credenciada.

4. **Direito do Usuário de Exclusão (LGPD)**: Você possui total direito de controle sobre seus dados cadastrados. Caso deseje solicitar o acesso completo aos seus dados cadastrados em nossa base ou requisitar a completa deleção de seu contato para não receber mais mensagens, basta enviar sua solicitação para o e-mail formal: **${settings?.email || 'comercial.vivasc@gmail.com'}** ou informar diretamente ao corretor que lhe contatou. Excluiremos suas informações permanentemente em um prazo máximo de 48 horas úteis.`;

  const title = isTerms ? "Termos de Uso & Consentimento" : "Política de Privacidade (LGPD)";
  const rawContent = isTerms 
    ? (settings?.termsOfUse || defaultTerms) 
    : (settings?.privacyPolicy || defaultPrivacy);

  // Simple formatter to split text into custom styled paragraphs/headers
  const renderFormattedContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-3" />;
      
      // Render markdown headers
      if (trimmed.startsWith('###')) {
        return (
          <h3 key={idx} className="text-sm font-extrabold text-zinc-950 uppercase tracking-widest mt-6 mb-2 border-b border-zinc-100 pb-1 flex items-center gap-1.5 font-sans">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            {trimmed.replace(/^###\s+/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <p key={idx} className="font-bold text-zinc-900 mt-4 mb-1 text-xs">
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <ul key={idx} className="list-disc pl-5 my-1.5 text-xs text-zinc-600 leading-relaxed">
            <li>{trimmed.replace(/^[-*]\s+/, '')}</li>
          </ul>
        );
      }
      
      // Inline bold parser helper
      return (
        <p key={idx} className="text-xs text-zinc-650 leading-relaxed mb-3">
          {trimmed.split('**').map((item, i) => {
            if (i % 2 === 1) {
              return <strong key={i} className="font-bold text-zinc-900">{item}</strong>;
            }
            return item;
          })}
        </p>
      );
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-zinc-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-150 bg-zinc-50 shrink-0">
              <div className="flex items-center gap-2.5">
                {isTerms ? (
                  <FileText className="h-5 w-5 text-primary" />
                ) : (
                  <Shield className="h-5 w-5 text-emerald-600" />
                )}
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">
                    {title}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-mono tracking-tight uppercase">
                    {brandName} • Compliance Imobiliário
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-150 transition-all cursor-pointer"
                title="Fechar Janela"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-white select-text">
              <div className="prose prose-sm max-w-none text-zinc-700">
                {renderFormattedContent(rawContent)}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-150 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                Portal em total conformidade com a LGPD
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md shadow-zinc-900/10 active:scale-95"
              >
                Entendi e Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
