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
    <div className="px-5 py-4 flex flex-col flex-1 min-h-0 overflow-hidden bg-modern-bg space-y-4">
      
      {/* Top Banner and Stats Row (Unified for maximum compactness) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* Left Side: Aparelhos WhatsApp Title & Sync - Spans 6 cols */}
        <div className="lg:col-span-6 bg-white p-4.5 rounded-2xl border border-modern-border shadow-sm flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-bold tracking-tight text-modern-text flex items-center gap-2">
              <Smartphone className="text-modern-primary" size={18} />
              Aparelhos WhatsApp
            </h2>
            <p className="text-[10.5px] text-modern-secondary font-medium leading-tight">
              Gerencie os chips e números em operação para disparos e atendimento. Sincronizado com a planilha Dominus.
            </p>
          </div>
          
          <div className="flex items-center justify-between gap-2 flex-wrap mt-1">
            {activeChip ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-modern-primary/10 border border-modern-primary/20 rounded-lg max-w-[280px]">
                <span className="w-1.5 h-1.5 rounded-full bg-modern-primary animate-pulse shrink-0" />
                <p className="text-[10px] font-black text-modern-primary truncate">
                  Ativo: {activeChip.aparelho} ({activeChip.numero})
                </p>
              </div>
            ) : (
              <div className="w-1" />
            )}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 bg-modern-primary text-white text-[10.5px] font-bold px-4 py-2 rounded-lg hover:bg-modern-primary/90 transition-all shadow-md shadow-modern-primary/10 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              <RefreshCw size={11} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
            </button>
          </div>
        </div>

        {/* Total de Números Card - Spans 2 cols */}
        <div className="lg:col-span-2 bg-white border border-modern-border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <p className="text-[9px] font-bold uppercase tracking-wider text-modern-secondary leading-none">Total de Números</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <p className="text-xl font-black text-modern-text leading-none">{stats.total}</p>
            <p className="text-[9px] text-modern-secondary font-medium">chips na operação</p>
          </div>
        </div>
        
        {/* Chips Ativos Card - Spans 2 cols */}
        <div className="lg:col-span-2 bg-white border border-modern-border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 leading-none">Chips Ativos</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <p className="text-xl font-black text-emerald-600 leading-none">{stats.active}</p>
            <p className="text-[9px] text-emerald-600/70 font-medium">prontos para uso</p>
          </div>
        </div>

        {/* Chips Inativos Card - Spans 2 cols */}
        <div className="lg:col-span-2 bg-white border border-modern-border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <p className="text-[9px] font-bold uppercase tracking-wider text-rose-500 leading-none">Chips Inativos</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <p className="text-xl font-black text-rose-500 leading-none">{stats.inactive}</p>
            <p className="text-[9px] text-rose-500/70 font-medium">caiu / não aplica</p>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar (Compact Height) */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Toggle Filter */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-modern-border w-full md:w-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'active', label: 'Ativos' },
            { id: 'inactive', label: 'Inativos' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id as any)}
              className={cn(
                "flex-1 md:flex-none px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all",
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
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-modern-secondary" size={13} />
          <input 
            type="text" 
            placeholder="Buscar por número ou aparelho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-modern-border rounded-lg text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-modern-primary/10 transition-all shadow-sm placeholder:text-modern-secondary/40"
          />
        </div>
      </div>

      {/* Selected Customer Card Banner (Compact) */}
      {selectedClient && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
              {selectedClient.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-900 leading-tight">Cliente Selecionado para Contato</p>
              <p className="text-[10px] text-emerald-700 font-bold leading-tight mt-0.5">
                {selectedClient.nome} • {selectedClient.telefone}
              </p>
            </div>
          </div>
          <button 
            onClick={onGoToCrm}
            className="text-[9px] font-black uppercase tracking-wider text-emerald-700 hover:underline flex items-center gap-1"
          >
            Ver no CRM <ArrowUpRight size={11} />
          </button>
        </div>
      )}

      {/* Main Table (Optimized row spacing for a much cleaner/compact layout) */}
      <div className="bg-white border border-modern-border rounded-2xl shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-modern-border text-[9px] font-bold uppercase tracking-wider text-modern-secondary">
                <th className="sticky top-0 bg-slate-50 z-10 px-4 py-2.5">Número (Chave)</th>
                <th className="sticky top-0 bg-slate-50 z-10 px-4 py-2.5">Datas / Histórico</th>
                <th className="sticky top-0 bg-slate-50 z-10 px-4 py-2.5">Tipo</th>
                <th className="sticky top-0 bg-slate-50 z-10 px-4 py-2.5">Aparelho</th>
                <th className="sticky top-0 bg-slate-50 z-10 px-4 py-2.5">Perfil PC / Conexão</th>
                <th className="sticky top-0 bg-slate-50 z-10 px-4 py-2.5">Status ZAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {filteredChips.map((chip) => {
                const linkedClient = getLinkedClient(chip);
                const isSelectedActive = activeChip?.id === chip.id;
                
                const statusLower = (chip.statusZap || '').toLowerCase();
                let statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                    <XCircle size={9} /> {chip.statusZap || 'Inativo'}
                  </span>
                );
                
                if (statusLower === 'ativo') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle size={9} className="text-emerald-600" /> Ativo
                    </span>
                  );
                } else if (statusLower === 'caiu') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-rose-100 text-rose-800 border border-rose-200">
                      <XCircle size={9} className="text-rose-600" /> Caiu
                    </span>
                  );
                } else if (statusLower === 'analise' || statusLower.includes('analis') || statusLower.includes('análise')) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
                      <AlertTriangle size={9} className="text-amber-600" /> Análise
                    </span>
                  );
                }

                return (
                  <tr 
                    key={chip.id} 
                    className={cn(
                      "hover:bg-slate-50 transition-colors",
                      isSelectedActive && "bg-modern-primary/5 hover:bg-modern-primary/5",
                      statusLower === 'caiu' && "opacity-60 bg-rose-50/10"
                    )}
                  >
                    {/* Número (Chave) */}
                    <td className="px-4 py-2 font-bold text-modern-text">
                      <div className="flex flex-col leading-tight">
                        <span className="text-[11.5px]">{chip.numero}</span>
                        <span className="text-[9.5px] text-modern-secondary font-medium tracking-tight font-mono">{chip.normalizedNumero}</span>
                      </div>
                    </td>

                    {/* Datas / Histórico */}
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-0.5 text-[10px] leading-none">
                        <div className="flex items-center gap-1">
                          <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-slate-400 min-w-[50px]">CHIP CAD.:</span>
                          {chip.chipCadastrado ? (
                            <span className="font-bold text-modern-text bg-slate-100 px-1 rounded">{chip.chipCadastrado}</span>
                          ) : (
                            <span className="text-slate-400 italic">Sem registro</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-emerald-600/70 min-w-[50px]">ZAP ATIVO:</span>
                          {chip.dataCadastroWhatsapp ? (
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-100">{chip.dataCadastroWhatsapp}</span>
                          ) : (
                            <span className="text-slate-400 italic">Sem registro</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tipo WhatsApp */}
                    <td className="px-4 py-2">
                      {chip.tipoWhatsapp ? (
                        <span className={cn(
                          "inline-block px-2 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wide border",
                          chip.tipoWhatsapp.toLowerCase() === 'business' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          chip.tipoWhatsapp.toLowerCase() === 'dual' ? "bg-purple-50 text-purple-700 border-purple-200" :
                          chip.tipoWhatsapp.toLowerCase() === 'pessoal' ? "bg-sky-50 text-sky-700 border-sky-200" :
                          "bg-slate-50 text-slate-700 border-slate-200"
                        )}>
                          {chip.tipoWhatsapp}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-medium">Não informado</span>
                      )}
                    </td>

                    {/* Aparelho Celular */}
                    <td className="px-4 py-2">
                      {chip.aparelho && chip.aparelho.toLowerCase() !== 'nenhum' ? (
                        <span className="inline-flex items-center gap-1 bg-slate-50 text-modern-text border border-modern-border px-2 py-0.5 rounded font-bold text-[10px]">
                          <Smartphone size={10} className="text-modern-secondary" />
                          {chip.aparelho}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-medium">Sem Aparelho</span>
                      )}
                    </td>

                    {/* Perfil PC / Conexão */}
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-0.5 leading-tight">
                        <div className="flex items-center gap-1 text-[10.5px]">
                          <span className="font-semibold text-modern-secondary">Perfil PC:</span>
                          {chip.perfilPc && chip.perfilPc.toLowerCase() !== 'ainda sem' && chip.perfilPc.toLowerCase() !== 'não aplica' ? (
                            <span className="font-bold text-modern-text bg-blue-50 text-blue-700 px-1 rounded border border-blue-100 font-mono text-[9.5px]">{chip.perfilPc}</span>
                          ) : (
                            <span className="text-slate-400 italic">Sem perfil</span>
                          )}
                        </div>
                        {chip.statusConexaoPc && (
                          <div className="flex items-center gap-1 text-[9.5px] mt-0.5">
                            <span className="font-semibold text-modern-secondary">Conexão:</span>
                            <span className={cn(
                              "font-extrabold uppercase text-[8.5px] px-1 rounded border leading-none py-0.5",
                              chip.statusConexaoPc.toLowerCase() === '2' || chip.statusConexaoPc.toLowerCase() === 'conectado'
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-rose-50 text-rose-500 border-rose-100"
                            )}>
                              {chip.statusConexaoPc}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status ZAP */}
                    <td className="px-4 py-2">
                      {statusBadge}
                    </td>
                  </tr>
                );
              })}

              {filteredChips.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-modern-secondary">
                    <Smartphone size={28} className="mx-auto mb-2 opacity-20 text-modern-secondary" />
                    <p className="text-[10px] font-bold uppercase tracking-wider">Nenhum chip encontrado.</p>
                    <p className="text-[9.5px] text-modern-secondary/60 mt-0.5">Sincronize com a planilha para importar novos aparelhos.</p>
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
