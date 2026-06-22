import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Phone, User, CheckCircle2 } from 'lucide-react';
import { saveMessageToFirestore } from '../services/firestoreService';
import { Message, BrandSettings, Broker } from '../types';

// Unsplash high-quality image of a professional, friendly, smiling blonde business / executive woman
const EXECUTIVE_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200";

interface FloatingChatProps {
  settings: BrandSettings | null;
  brokers?: Broker[];
}

export default function FloatingChat({ settings, brokers = [] }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userMsg, setUserMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Find an active broker set to receive chat, or fallback to any active broker
  const activeBroker = brokers?.find(b => b.status === 'Ativo' && b.receiveChat === true)
    || brokers?.find(b => b.status === 'Ativo')
    || null;

  const chatAvatar = activeBroker?.chatPhotoUrl || EXECUTIVE_AVATAR;
  const chatName = activeBroker?.chatName || "Juliana VIVA SC";
  const brokerNameLabel = activeBroker?.name || "Consultora VIVA SC";
  const chatTitle = activeBroker ? "Corretor de Plantão" : "Consultora Especialista Lançamentos";

  const phoneRaw = activeBroker?.phone || settings?.phone || '5547999999999';
  let whatsappNumber = phoneRaw.replace(/\D/g, '');
  if (whatsappNumber && !whatsappNumber.startsWith('55') && (whatsappNumber.length === 10 || whatsappNumber.length === 11)) {
    whatsappNumber = '55' + whatsappNumber;
  }

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) return;

    setIsSubmitting(true);

    const greeting = userMsg.trim() || 'Olá! Gostaria de conhecer melhor os lançamentos em destaque e receber uma simulação.';
    const messageId = `msg_${Date.now()}`;

    const messagePayload: Message = {
      id: messageId,
      name: userName.trim(),
      contact: userPhone.trim(),
      message: greeting,
      propertyId: 'Geral (Chat Flutuante)',
      createdAt: new Date().toISOString(),
      assignedBrokerId: activeBroker?.id || undefined,
      assignedBrokerName: activeBroker?.name || undefined,
      status: 'Novo',
      replies: []
    };

    try {
      // Save directly to Firestore CRM database
      await saveMessageToFirestore(messagePayload, true);
      
      setIsSent(true);
      
      const textToForward = `Olá, me chamo *${userName.trim()}* (${userPhone.trim()}).\n\n${greeting}`;
      const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(textToForward)}`;
      
      // Delay redirection slightly so the user sees success confirmation
      setTimeout(() => {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        // Reset states
        setUserMsg('');
        setIsOpen(false);
        setIsSent(false);
        setIsSubmitting(false);
      }, 1200);

    } catch (err) {
      console.error('Failed to register message lead', err);
      // Fallback redirect anyways
      const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá! Me chamo ${userName.trim()}.\n\n${greeting}`)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-6 z-40 font-sans text-left">
      <AnimatePresence>
        {/* Chat Box Window */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-[88vw] sm:w-[350px] bg-white rounded-2xl shadow-2xl border border-zinc-150 overflow-hidden flex flex-col z-50"
          >
            {/* Header branding */}
            <div className="bg-zinc-900 p-4 text-white flex items-center justify-between relative">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={chatAvatar}
                    alt={chatName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border-2 border-orange-500 object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-900 rounded-full"></span>
                </div>
                <div>
                  <h4 className="text-xs font-bold font-sans tracking-wide text-white uppercase block">
                    {chatName}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    {chatTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
                id="close-chat-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bubble Messages Area */}
            <div className="p-4 bg-zinc-50 border-b border-zinc-100 space-y-3.5 max-h-[220px] overflow-y-auto">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-zinc-150 max-w-[90%] text-xs shadow-sm leading-relaxed text-zinc-800">
                Olá! Seja bem-vindo(a) ao portal de imóveis VIVASC 💡
              </div>
              
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-zinc-150 max-w-[90%] text-xs shadow-sm leading-relaxed text-zinc-800">
                Me chamo {chatName}. Vamos simular os fluxos de pagamento facilitados ou esclarecer qualquer dúvida sobre os condomínios? 🌅
              </div>
            </div>

            {/* Form */}
            {isSent ? (
              <div className="p-6 text-center space-y-2.5 bg-white flex flex-col items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
                <p className="text-xs font-bold text-zinc-800">Conectando com o WhatsApp...</p>
                <p className="text-[10px] text-zinc-500">{chatName} está aguardando você na conversa!</p>
              </div>
            ) : (
              <form onSubmit={handleStartChat} className="p-4 bg-white space-y-3">
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="Seu nome"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full text-xs rounded-lg border border-zinc-250 bg-zinc-50/50 py-2 pl-9 pr-3 text-zinc-800 focus:border-orange-500 focus:bg-white outline-none font-medium"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Seu WhatsApp"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full text-xs rounded-lg border border-zinc-250 bg-zinc-50/50 py-2 pl-9 pr-3 text-zinc-800 focus:border-orange-500 focus:bg-white outline-none font-mono font-medium"
                    />
                  </div>

                  <div>
                    <textarea
                      placeholder="Sua proposta ou mensagem (opcional)..."
                      value={userMsg}
                      onChange={(e) => setUserMsg(e.target.value)}
                      rows={2}
                      className="w-full text-xs rounded-lg border border-zinc-250 bg-zinc-50/50 py-2 px-3 text-zinc-800 focus:border-orange-500 focus:bg-white outline-none resize-none leading-relaxed font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !userName.trim() || !userPhone.trim()}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Iniciar Chat com {chatName}</span>
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white hover:bg-zinc-50 p-1.5 pr-4 rounded-full shadow-2xl border border-zinc-200/80 hover:scale-105 active:scale-95 transition-all outline-none"
        title="Fale agora com corretor de plantão!"
        id="whatsapp-floating-btn"
      >
        <div className="relative">
          <img
            src={chatAvatar}
            alt={chatName}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-full object-cover border border-zinc-200"
          />
          {/* Glowing pulse rings around portrait */}
          <span className="absolute inset-0 rounded-full border border-orange-500/40 animate-ping"></span>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
        </div>

        <div className="text-left py-0.5">
          <span className="text-[9px] font-mono font-black tracking-widest text-[#FF9D00] uppercase block animate-pulse">
            Fale agora!
          </span>
          <span className="text-xs font-extrabold text-zinc-900 tracking-tight block">
            {chatName}
          </span>
        </div>
      </button>
    </div>
  );
}
