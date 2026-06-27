import React, { useState } from 'react';
import { User, Briefcase, Coins, Check, FileText } from 'lucide-react';
import { Property, BrandSettings } from '../types';
import { saveLeadToFirestore, saveMessageToFirestore } from '../services/firestoreService';

interface CadastroFormProps {
  property?: Property;
  settings: BrandSettings;
}

export const CadastroForm: React.FC<CadastroFormProps> = ({ property, settings }) => {
  const [paStatus, setPaStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [paError, setPaError] = useState<string | null>(null);
  
  const [paName, setPaName] = useState('');
  const [paCpf, setPaCpf] = useState('');
  const [paEstadoCivil, setPaEstadoCivil] = useState('Solteiro(a)');
  const [paProfissao, setPaProfissao] = useState('');
  const [paEmail, setPaEmail] = useState('');
  const [paTelefone, setPaTelefone] = useState('');
  const [paRendaBruta, setPaRendaBruta] = useState('');
  const [paRegimeTrabalho, setPaRegimeTrabalho] = useState('CLT');
  const [paComporRenda, setPaComporRenda] = useState(false);
  const [paHasEntrada, setPaHasEntrada] = useState(false);
  const [paEntrada, setPaEntrada] = useState('');
  const [paHasParcela, setPaHasParcela] = useState(false);
  const [paParcela, setPaParcela] = useState('');
  const [paDocRgCpf, setPaDocRgCpf] = useState<any>(null);
  const [paDocResidencia, setPaDocResidencia] = useState<any>(null);
  const [paDocRenda, setPaDocRenda] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paName || !paCpf || !paEmail || !paTelefone || !paRendaBruta) {
      setPaError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    setPaStatus('submitting');
    setPaError(null);

    try {
      const idLead = 'lead_pa_' + Date.now();
      await saveLeadToFirestore({
        id: idLead,
        name: paName,
        contact: `${paEmail} • ${paTelefone}`,
        message: `🚀 Cadastro ${property ? property.name : 'Geral'}`,
        propertyId: property?.id || 'geral',
        propertyName: property?.name || 'Cadastro Geral',
        status: 'Novo',
        createdAt: new Date().toISOString(),
        preApprovalData: {
          cpf: paCpf,
          estadoCivil: paEstadoCivil,
          profissao: paProfissao,
          email: paEmail,
          telefone: paTelefone,
          rendaBruta: paRendaBruta,
          regimeTrabalho: paRegimeTrabalho as 'CLT' | 'Autônomo',
          comporRenda: paComporRenda,
          entradaDisponivel: paHasEntrada ? 'Não possuo entrada' : paEntrada,
          parcelaDisponivel: paHasParcela ? 'Sem valor definido' : paParcela,
          rgCpfDoc: paDocRgCpf ? { name: paDocRgCpf.name, size: paDocRgCpf.size, base64: 'placeholder' } : undefined,
          residenciaDoc: paDocResidencia ? { name: paDocResidencia.name, size: paDocResidencia.size, base64: 'placeholder' } : undefined,
          rendaDoc: paDocRenda ? { name: paDocRenda.name, size: paDocRenda.size, base64: 'placeholder' } : undefined,
        }
      });
      setPaStatus('success');
    } catch (err: any) {
      setPaError('Erro ao enviar.');
      setPaStatus('idle');
    }
  };

  if (paStatus === 'success') {
    return (
      <div className="bg-emerald-50 rounded-2xl p-6 text-center space-y-4">
        <Check className="h-12 w-12 text-emerald-600 mx-auto" />
        <h5 className="font-bold">Cadastro Enviado!</h5>
        <button onClick={() => setPaStatus('idle')} className="bg-zinc-900 text-white px-6 py-2 rounded-xl">Novo Cadastro</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs">{paError}</div>}
      
      {/* 1. Informações Pessoais */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-2">
          <User className="h-4 w-4" /> 1. Informações Pessoais
        </h4>
        <input type="text" required placeholder="Nome Completo *" value={paName} onChange={(e) => setPaName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs" />
        <div className="grid grid-cols-2 gap-3">
          <input type="text" required placeholder="CPF *" value={paCpf} onChange={(e) => setPaCpf(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs" />
          <select value={paEstadoCivil} onChange={(e) => setPaEstadoCivil(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs">
            <option value="Solteiro(a)">Solteiro(a)</option>
            <option value="Casado(a)">Casado(a)</option>
            <option value="União Estável">União Estável</option>
            <option value="Divorciado(a)">Divorciado(a)</option>
          </select>
        </div>
        <input type="text" required placeholder="Profissão *" value={paProfissao} onChange={(e) => setPaProfissao(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs" />
        <div className="grid grid-cols-2 gap-3">
          <input type="email" required placeholder="E-mail *" value={paEmail} onChange={(e) => setPaEmail(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs" />
          <input type="tel" required placeholder="Telefone *" value={paTelefone} onChange={(e) => setPaTelefone(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs" />
        </div>
      </div>

      {/* 2. Informações Financeiras */}
      <div className="space-y-3 pt-3 border-t">
        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-2">
          <Coins className="h-4 w-4" /> 2. Informações Financeiras
        </h4>
        <div className="flex gap-3">
          <button type="button" onClick={() => setPaRegimeTrabalho('CLT')} className={`flex-1 p-2 rounded-xl text-xs font-bold ${paRegimeTrabalho === 'CLT' ? 'bg-[#FF9D00] text-black' : 'bg-zinc-100'}`}>CLT</button>
          <button type="button" onClick={() => setPaRegimeTrabalho('Autônomo')} className={`flex-1 p-2 rounded-xl text-xs font-bold ${paRegimeTrabalho === 'Autônomo' ? 'bg-[#FF9D00] text-black' : 'bg-zinc-100'}`}>Autônomo</button>
        </div>
        <input type="text" required placeholder="Renda Bruta Mensal (R$)" value={paRendaBruta} onChange={(e) => setPaRendaBruta(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs" />
        <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
          <input type="checkbox" checked={paComporRenda} onChange={(e) => setPaComporRenda(e.target.checked)} />
          Desejo compor renda familiar
        </label>
        <div className="space-y-2">
          <input type="text" placeholder="Entrada aproximada disponível (R$)" value={paEntrada} onChange={(e) => setPaEntrada(e.target.value)} disabled={paHasEntrada} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs" />
          <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
            <input type="checkbox" checked={paHasEntrada} onChange={(e) => { setPaHasEntrada(e.target.checked); if(e.target.checked) setPaEntrada(''); }} />
            Não possuo entrada
          </label>
        </div>
        <div className="space-y-2">
          <input type="text" placeholder="Valor de parcela mensal ideal (R$)" value={paParcela} onChange={(e) => setPaParcela(e.target.value)} disabled={paHasParcela} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs" />
          <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
            <input type="checkbox" checked={paHasParcela} onChange={(e) => { setPaHasParcela(e.target.checked); if(e.target.checked) setPaParcela(''); }} />
            Sem valor mensal definido
          </label>
        </div>
      </div>

      {/* 3. Documentação */}
      <div className="space-y-3 pt-3 border-t">
        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-2">
          <FileText className="h-4 w-4" /> 3. Documentação (Upload)
        </h4>
        <div className="space-y-2">
          <label className="text-[10px] text-zinc-500">Cópia RG/CPF</label>
          <input type="file" onChange={(e) => setPaDocRgCpf(e.target.files?.[0] || null)} className="w-full text-xs" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-zinc-500">Comprovante de Residência</label>
          <input type="file" onChange={(e) => setPaDocResidencia(e.target.files?.[0] || null)} className="w-full text-xs" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-zinc-500">Renda (Holerite ou IR)</label>
          <input type="file" onChange={(e) => setPaDocRenda(e.target.files?.[0] || null)} className="w-full text-xs" />
        </div>
      </div>
      
      <button type="submit" className="w-full bg-[#FF9D00] text-black p-4 rounded-xl font-bold uppercase text-xs">
        {paStatus === 'submitting' ? 'Enviando...' : 'Enviar Cadastro'}
      </button>
    </form>
  );
};
