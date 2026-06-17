import React, { useState } from 'react';
import { Property, BrandSettings } from '../types';
import { saveMessageToFirestore } from '../services/firestoreService';

interface ContatoSectionProps {
  settings: BrandSettings;
  properties: Property[];
}

export default function ContatoSection({ settings, properties }: ContatoSectionProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [subject, setSubject] = useState('Dúvida Geral / Agendar Visita');
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const idMsg = 'msg_' + Math.random().toString(36).substring(2, 9);
      await saveMessageToFirestore({
        id: idMsg,
        name: name,
        contact: contact,
        message: msg,
        propertyId: subject,
        createdAt: new Date().toISOString()
      });
      setStatus('success');
      setName('');
      setContact('');
      setMsg('');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="w-full bg-white text-zinc-900 py-16 px-6 lg:px-8 mt-1 border-t border-zinc-150 animate-fade-in" id="contato-section-wrapper">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[11px] font-bold tracking-widest text-[#FF9D00] uppercase font-mono block">
            ✦ Atendimento de Boutique Exclusivo
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#203366] uppercase tracking-tight">
            Entre em Contato
          </h1>
          <p className="max-w-2xl mx-auto text-sm text-zinc-550 leading-relaxed">
            Nossa equipe está capacitada para simular, esclarecer as tabelas de poupança direto com a construtora e agendar sua visita aos decorados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-4">
          {/* Contact details */}
          <div className="bg-[#203366] text-white p-8 rounded-3xl flex flex-col justify-between shadow-lg" id="contact-info-panel">
            <div className="space-y-6">
              <h2 className="text-lg font-bold uppercase tracking-tight text-[#FF9D00]">
                Canais Diretos
              </h2>

              <div className="space-y-4 text-xs text-zinc-200">
                <div className="flex flex-col space-y-1 border-b border-white/10 pb-4">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#FF9D00]">WhatsApp Oficial</span>
                  <a 
                    href={`https://wa.me/${(settings?.phone || '5547999999999').replace(/\D/g, '')}?text=Olá! Gostaria de falar com um corretor sobre os lançamentos.`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-base font-black text-white hover:underline hover:text-[#FF9D00] transition-all"
                  >
                    +{settings?.phone || '55 47 99999-9999'}
                  </a>
                </div>

                <div className="flex flex-col space-y-1 border-b border-white/10 pb-4">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#FF9D00]">E-mail Corporativo</span>
                  <a href={`mailto:${settings?.email || 'comercial.vivasc@gmail.com'}`} className="text-sm hover:underline hover:text-[#FF9D00] transition-all">
                    {settings?.email || 'comercial.vivasc@gmail.com'}
                  </a>
                </div>

                <div className="flex flex-col space-y-1 pb-2">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#FF9D00]">Cidade Sede</span>
                  <span className="text-sm font-semibold">Balneário Camboriú / SC</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 text-[10px] font-mono text-zinc-300 leading-relaxed">
              <strong>{settings?.companyName || 'Meu Primeiro Imóvel ME'}</strong>
              <br />CRECI: {settings?.creci || '36847'}
              <br />CNPJ: {settings?.cnpj || '51.874.234/0001-90'}
            </div>
          </div>

          {/* Form */}
          <div className="bg-zinc-50 border border-zinc-200 p-8 rounded-3xl shadow-sm" id="contact-form-panel">
            <h2 className="text-lg font-bold text-zinc-950 uppercase tracking-tight mb-4">
              Envie-nos um e-mail
            </h2>

            {status === 'success' && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 font-bold mb-4" id="success-alert">
                ✦ Mensagem enviada com sucesso! Nossos parceiros heróis entrarão em contato no WhatsApp fornecido.
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4" id="contact-form-el">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full rounded-xl bg-white border border-zinc-200 px-4 py-2.5 text-xs text-zinc-900 focus:border-[#203366] outline-none"
                  id="form-input-name"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Celular / WhatsApp</label>
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="(47) 99999-9999"
                  className="w-full rounded-xl bg-white border border-zinc-200 px-4 py-2.5 text-xs text-zinc-900 focus:border-[#203366] outline-none"
                  id="form-input-contact"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Referência ou Assunto</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl bg-white border border-zinc-200 px-4 py-2.5 text-xs text-zinc-900 focus:border-[#203366] outline-none"
                  id="form-select-subject"
                >
                  <option value="Dúvida Geral / Agendar Visita">Dúvida Geral / Agendar Visita</option>
                  <option value="Simulação de Fluxo de Financiamento">Simular Meu Parcelamento</option>
                  {properties.map(p => (
                    <option key={p.id} value={`Sobre o Imóvel: ${p.name}`}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 font-mono block mb-1">Sua Mensagem</label>
                <textarea
                  required
                  rows={3}
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Olá! Gostaria de receber o plano de parcelas e memorial descritivo..."
                  className="w-full rounded-xl bg-white border border-zinc-200 p-4 text-xs text-zinc-900 focus:border-[#203366] outline-none resize-none"
                  id="form-textarea-msg"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center h-11 rounded-xl bg-[#203366] hover:bg-zinc-900 text-white font-extrabold text-xs uppercase tracking-widest shadow transition-all cursor-pointer"
                id="form-submit-btn"
              >
                Enviar Requisição
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
