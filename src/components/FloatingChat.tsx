import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Phone, User, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
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
  
  // Register / Credentials inputs
  const [userName, setUserName] = useState(() => localStorage.getItem('vivas_user_chat_name') || '');
  const [userPhone, setUserPhone] = useState(() => localStorage.getItem('vivas_user_chat_phone') || '');
  const [userMsg, setUserMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active chat session ID (stored in client localStorage to resume across page refreshes)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => localStorage.getItem('vivas_user_chat_id'));
  const [currentChatDoc, setCurrentChatDoc] = useState<Message | null>(null);
  
  // Reply input inside the active chat stream
  const [replyText, setReplyText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to the specific document in Firestore if a session is active
  useEffect(() => {
    if (!activeSessionId) {
      setCurrentChatDoc(null);
      return;
    }

    // Connect real-time snap-listener
    const docRef = doc(db, 'mensagens', activeSessionId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setCurrentChatDoc(snapshot.data() as Message);
        } else {
          // Document was deleted by administrator, let's reset locally
          console.warn("[Floating Chat] Chat session document was not found or deleted on server.");
          handleResetSession();
        }
      },
      (error) => {
        console.error("[Floating Chat] Firestore listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [activeSessionId]);

  // Handle auto-scroll to the bottom of message stream
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChatDoc?.replies, isOpen]);

  // Find assigned or fallback active broker
  const activeBroker = brokers?.find(b => b.status === 'Ativo' && b.receiveChat === true)
    || brokers?.find(b => b.status === 'Ativo')
    || null;

  // Derive active profile visual data based on who is speaking (assigned or fallback default)
  const conversationBroker = brokers?.find(b => b.id === currentChatDoc?.assignedBrokerId) || activeBroker;
  const chatAvatar = conversationBroker?.chatPhotoUrl || EXECUTIVE_AVATAR;
  const chatName = conversationBroker?.chatName || "Juliana VIVA SC";
  const chatTitle = conversationBroker ? "Corretor(a) de Plantão" : "Especialista em Lançamentos";

  // Initial form submission to create & register the chat session
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) return;

    setIsSubmitting(true);

    const greeting = userMsg.trim() || 'Olá! Gostaria de conhecer melhor os lançamentos em destaque e receber uma simulação.';
    const sessionId = `msg_user_${Date.now()}`;

    const newChatPayload: Message = {
      id: sessionId,
      name: userName.trim(),
      contact: userPhone.trim(),
      message: greeting,
      propertyId: 'Geral (Chat do Site)',
      createdAt: new Date().toISOString(),
      assignedBrokerId: activeBroker?.id || undefined,
      assignedBrokerName: activeBroker?.name || undefined,
      status: 'Novo',
      replies: []
    };

    try {
      // Save directly to the Firestore collection
      await saveMessageToFirestore(newChatPayload, true);
      
      // Store credentials to resume session
      localStorage.setItem('vivas_user_chat_id', sessionId);
      localStorage.setItem('vivas_user_chat_name', userName.trim());
      localStorage.setItem('vivas_user_chat_phone', userPhone.trim());
      
      setActiveSessionId(sessionId);
      setCurrentChatDoc(newChatPayload);
      setUserMsg('');
      setIsSubmitting(false);
    } catch (err) {
      console.error('Failed to register message lead in interactive chat', err);
      setIsSubmitting(false);
    }
  };

  // Submit client message reply inside the active session
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentChatDoc) return;

    const newReply = {
      id: `rep_client_${Date.now()}`,
      author: userName || currentChatDoc.name || 'Cliente',
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
      isBroker: false
    };

    const updatedReplies = [...(currentChatDoc.replies || []), newReply];

    // Status is rolled back to 'Novo' or 'Atendendo' to grab the broker's attention back
    const updatedPayload: Message = {
      ...currentChatDoc,
      replies: updatedReplies,
      status: currentChatDoc.status === 'Finalizado' ? 'Atendendo' : currentChatDoc.status || 'Atendendo'
    };

    setReplyText('');

    try {
      await saveMessageToFirestore(updatedPayload, true);
    } catch (err) {
      console.error('Failed to submit client response message', err);
    }
  };

  // Close and completely reset credentials to allow starting a different thread
  const handleResetSession = () => {
    localStorage.removeItem('vivas_user_chat_id');
    localStorage.removeItem('vivas_user_chat_name');
    localStorage.removeItem('vivas_user_chat_phone');
    
    // Clear state
    setActiveSessionId(null);
    setCurrentChatDoc(null);
    setUserName('');
    setUserPhone('');
    setUserMsg('');
  };

  // Compose chronological stream of visual messages:
  // First item is the original customer prompt message, followed by chronological replies
  const chatFlow = currentChatDoc ? [
    {
      id: 'original_user_msg',
      author: currentChatDoc.name,
      content: currentChatDoc.message,
      createdAt: currentChatDoc.createdAt,
      isBroker: false
    },
    ...(currentChatDoc.replies || [])
  ] : [];

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-6 z-40 font-sans text-left">
      <AnimatePresence>
        {/* Chat Box Window */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-[90vw] sm:w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-zinc-150 overflow-hidden flex flex-col z-50 hover-glow"
          >
            {/* Header branding */}
            <div className="bg-zinc-950 p-4 text-white flex items-center justify-between relative shrink-0 border-b border-zinc-900">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={chatAvatar}
                    alt={chatName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border-2 border-orange-500 object-cover bg-zinc-900"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = EXECUTIVE_AVATAR;
                    }}
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-950 rounded-full"></span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider block">
                    {chatName}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    {chatTitle}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {activeSessionId && (
                  <button
                    onClick={() => {
                      if (confirm('Deseja iniciar um novo atendimento? Isto apagará o histórico atual do seu navegador.')) {
                        handleResetSession();
                      }
                    }}
                    className="text-zinc-500 hover:text-orange-400 p-1 rounded-full hover:bg-zinc-900 transition-colors cursor-pointer"
                    title="Iniciar Outra Conversa"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-900 transition-colors cursor-pointer"
                  id="close-chat-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Logic Area */}
            {activeSessionId && currentChatDoc ? (
              // 1. ACTIVE LIVE CHAT VIEW
              <div className="flex-1 flex flex-col justify-between overflow-hidden bg-zinc-50">
                {/* Real-time agent status bar & banner */}
                <div className="px-4 py-2 bg-zinc-100 border-b border-zinc-200 text-[10px] text-zinc-500 flex justify-between items-center shrink-0">
                  {currentChatDoc.status === 'Novo' ? (
                    <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      <span>Enviando chamado aos corretores...</span>
                    </div>
                  ) : currentChatDoc.status === 'Atendendo' ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Corretor conectado via Chat</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-zinc-600">
                      <span>Atendimento encerrado</span>
                    </div>
                  )}
                  <span className="font-mono text-[9px] uppercase">Chamado #{currentChatDoc.id.split('_').pop()?.slice(-4)}</span>
                </div>

                {/* Back-and-forth Bubble Flow lists */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  <div className="bg-orange-50 text-[10px] text-orange-850 p-2 text-center rounded-xl border border-orange-100/60 font-medium">
                    Atendimento interativo iniciado. Digite suas dúvidas para falar em tempo real!
                  </div>

                  {chatFlow.map((msg) => {
                    const isUser = !msg.isBroker;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm block ${
                            isUser
                              ? 'bg-orange-500 text-white rounded-tr-none text-right'
                              : 'bg-white text-zinc-800 border border-zinc-200 rounded-tl-none text-left'
                          }`}
                        >
                          {!isUser && (
                            <span className="text-[8px] font-bold text-orange-500 block mb-1 uppercase tracking-widest">
                              {chatName}
                            </span>
                          )}
                          <p className="whitespace-pre-line font-sans font-medium">{msg.content}</p>
                        </div>
                        <span className="text-[8px] text-zinc-400 font-mono mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input response bar */}
                <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-zinc-250 flex gap-2 shrink-0">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Digite sua resposta de texto..."
                    className="flex-1 rounded-xl bg-zinc-50 border border-zinc-250 px-4 py-2 text-xs text-zinc-800 focus:bg-white focus:border-orange-500 outline-none font-medium"
                    id="client-live-chat-reply-input"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
                    title="Enviar Mensagem"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            ) : (
              // 2. INITIAL FORM REGISTER VIEW (GET CUSTOMER DETAILS FIRST)
              <div className="flex-1 flex flex-col justify-between overflow-hidden bg-zinc-50/50">
                {/* Welcoming guidelines */}
                <div className="p-4 bg-zinc-100/60 border-b border-zinc-100 space-y-3 flex-1 overflow-y-auto">
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-zinc-150 text-xs shadow-sm leading-relaxed text-zinc-850 font-medium font-sans">
                    Olá! Seja bem-vindo(a) ao portal imobiliário VIVASC 💡
                  </div>
                  
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-zinc-150 text-xs shadow-sm leading-relaxed text-zinc-850 font-medium font-sans animate-fade-in">
                    Me chamo <strong>{chatName}</strong>. Vamos simular propostas de pagamento facilitadas ou tirar dúvidas sobre os condomínios com nosso plantão online? 🌅
                  </div>
                  
                  <div className="bg-orange-50/40 p-3 rounded-xl border border-orange-100 font-mono text-[9px] text-orange-800 leading-normal flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-orange-500" />
                    <span>Ao iniciar, você se conecta diretamente com a nossa equipe no painel interativo interno para receber atendimento imediato na plataforma.</span>
                  </div>
                </div>

                {/* Lead Registration Form */}
                <form onSubmit={handleStartChat} className="p-4 bg-white space-y-3.5 border-t border-zinc-150 shrink-0">
                  <div className="space-y-2.5">
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                      <input
                        type="text"
                        required
                        placeholder="Nenhum cadastro? Informe seu nome"
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
                        placeholder="WhatsApp (DDD + Número) para contato"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        className="w-full text-xs rounded-lg border border-zinc-250 bg-zinc-50/50 py-2 pl-9 pr-3 text-zinc-800 focus:border-orange-500 focus:bg-white outline-none font-mono font-medium"
                      />
                    </div>

                    <div>
                      <textarea
                        placeholder="Como podemos te ajudar? Escreva sua dúvida inicial..."
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
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider font-mono"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Iniciar Chat no Site</span>
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button Bubble (Fixed right-6 layout) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white hover:bg-zinc-50 p-1.5 pr-4 rounded-full shadow-2xl border border-zinc-200/80 hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer"
        title="Fale agora com nosso corretor de plantão!"
        id="whatsapp-floating-btn"
      >
        <div className="relative">
          <img
            src={chatAvatar}
            alt={chatName}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-full object-cover border border-zinc-200 bg-zinc-900"
            onError={(e) => {
              (e.target as HTMLImageElement).src = EXECUTIVE_AVATAR;
            }}
          />
          {/* Glowing pulse rings around portrait */}
          <span className="absolute inset-0 rounded-full border border-orange-500/40 animate-ping"></span>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
        </div>

        <div className="text-left py-0.5">
          <span className="text-[9px] font-mono font-black tracking-widest text-[#FF9D00] uppercase block animate-pulse">
            Atendimento Online
          </span>
          <span className="text-xs font-extrabold text-zinc-900 tracking-tight block">
            {chatName}
          </span>
        </div>
      </button>
    </div>
  );
}
