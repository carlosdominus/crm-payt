import React, { useState, useMemo } from 'react';
import { WhatsAppChip, Client } from '../types';
import { 
  RefreshCw, Search, Phone, CheckCircle, XCircle, AlertTriangle, 
  User, Smartphone, Check, ExternalLink, Link, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WhatsAppChipsViewProps {
  chips: WhatsAppChip[];
  clients: Client[];
  isSyncing: boolean;
  onSync: () => Promise<void>;
  selectedClient: Client | null;
  activeChip: WhatsAppChip | null;
  onSetActiveChip: (chip: WhatsAppChip) => void;
  onSelectClient: (client: Client) => void;
  onGoToCrm: () => void;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const cleanPhone = (phone: string): string => {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('5555') && cleaned.length >= 14) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.length === 10 || cleaned.length === 11) {
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    } else {
      cleaned = '55' + cleaned;
    }
  }
  return cleaned;
};

export const WhatsAppChipsView: React.FC<WhatsAppChipsViewProps> = ({
  chips,
  clients,
  isSyncing,
  onSync,
  selectedClient,
  activeChip,
  onSetActiveChip,
  onSelectClient,
  onGoToCrm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');
  const [showClientSelectorForChip, setShowClientSelectorForChip] = useState<WhatsAppChip | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  // Sincronizar com o CRM:
  // Para cada chip, encontrar de forma dinâmica se ele já existe cadastrado no banco do CRM (comparando o número normalizado)
  const getLinkedClient = (chip: WhatsAppChip): Client | undefined => {
    return clients.find(c => {
      const clientCleaned = cleanPhone(c.telefone || '');
      return clientCleaned && clientCleaned === chip.normalizedNumero;
    });
  };

  // Filtros de busca e status
  const filteredChips = useMemo(() => {
    return chips.filter(chip => {
      // Busca por número ou aparelho
      const matchSearch = 
        chip.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chip.normalizedNumero.includes(searchTerm) ||
        chip.aparelho.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por status ZAP
      // Inativo = "caiu" ou "não aplica"
      const statusLower = (chip.statusZap || '').toLowerCase();
      const isActive = statusLower === 'ativo';
      const isInactive = statusLower === 'caiu' || statusLower === 'nao aplica' || statusLower === 'não aplica';

      if (filterType === 'active') {
        return matchSearch && isActive;
      }
      if (filterType === 'inactive') {
        return matchSearch && isInactive;
      }
      return matchSearch;
    });
  }, [chips, searchTerm, filterType]);

  // Estatísticas para cards informativos
  const stats = useMemo(() => {
    let active = 0;
    let inactive = 0;
    chips.forEach(chip => {
      const statusLower = (chip.statusZap || '').toLowerCase();
      if (statusLower === 'ativo') active++;
      else if (statusLower === 'caiu' || statusLower === 'nao aplica' || statusLower === 'não aplica') inactive++;
    });
    return {
      total: chips.length,
      active,
      inactive
    };
  }, [chips]);

  // Lista de clientes filtrada para o seletor rápido
  const quickClientList = useMemo(() => {
    if (!clientSearchTerm) return clients.slice(0, 10);
    return clients.filter(c => 
      c.nome.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      c.telefone.includes(clientSearchTerm)
    ).slice(0, 10);
  }, [clients, clientSearchTerm]);

  const handleOpenChat = (chip: WhatsAppChip, targetClient: Client) => {
    const cleanClientPhone = cleanPhone(targetClient.telefone || '');
    if (!cleanClientPhone) {
      alert("Este cliente não possui um telefone válido.");
      return;
    }
    onSetActiveChip(chip);
    const url = `https://wa.me/${cleanClientPhone}`;
    window.open(url, '_blank');
  };

  return (
    <div className="px-10 py-6 flex flex-col h-full overflow-y-auto bg-modern-bg space-y-6">
      
      {/* Top Banner / Hero area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-modern-border shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-modern-text flex items-center gap-2">
            <Smartphone className="text-modern-primary" size={24} />
            Aparelhos WhatsApp
          </h2>
          <p className="text-xs text-modern-secondary font-medium">
            Gerencie os chips e números em operação para disparos e atendimento. Fonte de dados integrada com a planilha Dominus.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {activeChip && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-modern-primary/10 border border-modern-primary/20 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-modern-primary animate-pulse" />
              <p className="text-[11px] font-bold text-modern-primary">
                Ativo: {activeChip.aparelho} ({activeChip.numero})
              </p>
            </div>
          )}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-modern-primary text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-modern-primary/90 transition-all shadow-md shadow-modern-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
          </button>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-modern-border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-modern-secondary">Total de Números</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-modern-text">{stats.total}</p>
            <p className="text-[10px] text-modern-secondary font-medium">chips na operação</p>
          </div>
        </div>
        
        <div className="bg-white border border-modern-border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Chips Ativos</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-emerald-600">{stats.active}</p>
            <p className="text-[10px] text-emerald-600/70 font-medium">prontos para uso</p>
          </div>
        </div>

        <div className="bg-white border border-modern-border rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Chips Inativos</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-rose-500">{stats.inactive}</p>
            <p className="text-[10px] text-rose-500/70 font-medium">caiu / não aplica</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Toggle Filter */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-modern-border w-full md:w-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'active', label: 'Ativos' },
            { id: 'inactive', label: 'Inativos' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id as any)}
              className={cn(
                "flex-1 md:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all",
                filterType === item.id 
                  ? "bg-white text-modern-text shadow-sm border border-modern-border" 
                  : "text-modern-secondary hover:text-modern-text"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-modern-secondary" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por número ou aparelho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-modern-border rounded-xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-modern-primary/5 transition-all shadow-sm placeholder:text-modern-secondary/40"
          />
        </div>
      </div>

      {/* Selected Customer Card Banner */}
      {selectedClient && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              {selectedClient.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-black text-emerald-900">Cliente Selecionado para Contato</p>
              <p className="text-[11px] text-emerald-700 font-bold">
                {selectedClient.nome} • {selectedClient.telefone}
              </p>
            </div>
          </div>
          <button 
            onClick={onGoToCrm}
            className="text-[10px] font-black uppercase tracking-wider text-emerald-700 hover:underline flex items-center gap-1"
          >
            Ver no CRM <ArrowUpRight size={12} />
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white border border-modern-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-modern-border text-[10px] font-bold uppercase tracking-wider text-modern-secondary">
                <th className="px-6 py-4">Número</th>
                <th className="px-6 py-4">Tipo WhatsApp</th>
                <th className="px-6 py-4">Aparelho / Perfil</th>
                <th className="px-6 py-4">Status ZAP</th>
                <th className="px-6 py-4">Vinculado a Cliente</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredChips.map((chip) => {
                const linkedClient = getLinkedClient(chip);
                const isSelectedActive = activeChip?.id === chip.id;
                
                const statusLower = (chip.statusZap || '').toLowerCase();
                let statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                    <XCircle size={10} /> {chip.statusZap || 'Inativo'}
                  </span>
                );
                
                if (statusLower === 'ativo') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle size={10} className="text-emerald-600" /> Ativo
                    </span>
                  );
                } else if (statusLower === 'caiu') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-100 text-rose-800 border border-rose-200">
                      <XCircle size={10} className="text-rose-600" /> Caiu
                    </span>
                  );
                } else if (statusLower === 'analise' || statusLower.includes('analis') || statusLower.includes('análise')) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
                      <AlertTriangle size={10} className="text-amber-600" /> Análise
                    </span>
                  );
                }

                return (
                  <tr 
                    key={chip.id} 
                    className={cn(
                      "hover:bg-slate-50 transition-colors",
                      isSelectedActive && "bg-modern-primary/5 hover:bg-modern-primary/5"
                    )}
                  >
                    {/* Número */}
                    <td className="px-6 py-4.5 font-bold text-modern-text">
                      <div className="flex flex-col">
                        <span>{chip.numero}</span>
                        <span className="text-[10px] text-modern-secondary font-medium tracking-tight font-mono">{chip.normalizedNumero}</span>
                      </div>
                    </td>

                    {/* Tipo WhatsApp */}
                    <td className="px-6 py-4.5 font-medium text-modern-secondary capitalize">
                      {chip.tipoWhatsapp || 'Não definido'}
                    </td>

                    {/* Aparelho */}
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-modern-text">{chip.aparelho || 'Sem Aparelho'}</span>
                        <span className="text-[10px] text-modern-secondary font-medium">{chip.localChip} • {chip.perfilPc || 'Sem perfil'}</span>
                      </div>
                    </td>

                    {/* Status ZAP */}
                    <td className="px-6 py-4.5">
                      {statusBadge}
                    </td>

                    {/* Vinculado a Cliente */}
                    <td className="px-6 py-4.5">
                      {linkedClient ? (
                        <div className="flex items-center gap-1.5 cursor-pointer hover:underline" onClick={() => onSelectClient(linkedClient)}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <div>
                            <p className="font-bold text-emerald-700">{linkedClient.nome}</p>
                            <p className="text-[9px] text-modern-secondary font-medium">{linkedClient.telefone}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-modern-secondary uppercase tracking-wider bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          Não Vinculado
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Ativar chip para operação */}
                        <button
                          onClick={() => onSetActiveChip(chip)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-1",
                            isSelectedActive 
                              ? "bg-modern-primary border-modern-primary text-white"
                              : "bg-white hover:bg-slate-50 border-modern-border text-modern-secondary hover:text-modern-primary"
                          )}
                        >
                          {isSelectedActive ? <Check size={12} /> : null}
                          {isSelectedActive ? "Usando este" : "Usar este"}
                        </button>

                        {/* Contatar cliente selecionado ou outro */}
                        {selectedClient ? (
                          <button
                            onClick={() => handleOpenChat(chip, selectedClient)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <Phone size={12} /> Falar com {selectedClient.nome.split(' ')[0]}
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowClientSelectorForChip(chip)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                          >
                            <User size={12} /> Escolher Contato
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredChips.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-modern-secondary">
                    <Smartphone size={32} className="mx-auto mb-3 opacity-20 text-modern-secondary" />
                    <p className="text-xs font-bold uppercase tracking-wider">Nenhum chip encontrado.</p>
                    <p className="text-[11px] text-modern-secondary/60 mt-1">Sincronize com a planilha para importar novos aparelhos.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Contact Selector Modal */}
      <AnimatePresence>
        {showClientSelectorForChip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div 
              className="fixed inset-0 bg-modern-text/40 backdrop-blur-sm"
              onClick={() => {
                setShowClientSelectorForChip(null);
                setClientSearchTerm('');
              }}
            />
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-modern-border z-10 space-y-4 relative">
              <h3 className="text-sm font-extrabold text-modern-text uppercase tracking-wider border-b border-slate-100 pb-2">
                Selecionar Cliente para {showClientSelectorForChip.aparelho}
              </h3>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-modern-secondary" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nome ou telefone..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-modern-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-modern-primary/20"
                  />
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {quickClientList.map(c => (
                    <button
                      key={c.key}
                      onClick={() => {
                        handleOpenChat(showClientSelectorForChip, c);
                        setShowClientSelectorForChip(null);
                        setClientSearchTerm('');
                      }}
                      className="w-full text-left p-3 rounded-xl border border-transparent hover:border-modern-border hover:bg-slate-50 transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-modern-text">{c.nome}</p>
                        <p className="text-[10px] text-modern-secondary">{c.telefone}</p>
                      </div>
                      <ExternalLink size={12} className="text-modern-secondary" />
                    </button>
                  ))}
                  {quickClientList.length === 0 && (
                    <p className="text-center py-6 text-xs text-modern-secondary">Nenhum cliente cadastrado.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowClientSelectorForChip(null);
                    setClientSearchTerm('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-modern-secondary hover:text-modern-text"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
