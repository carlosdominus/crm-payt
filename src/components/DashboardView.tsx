import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, 
  PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { 
  TrendingUp, DollarSign, Package, Users, Calendar, Edit, Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfDay, endOfDay } from 'date-fns';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export interface Sale {
  id: string;
  clientKey: string;
  date: string; // YYYY-MM-DD
  productName: string;
  value: number;
  commission: number;
  timestamp: number;
}

export interface Client {
  key: string;
  nome: string;
  telefone: string;
  status?: string;
  assignedWhatsappId?: string;
  lastPurchaseTimestamp?: number;
  leads: Array<{
    timestamp?: number;
    data?: string;
    produto?: string;
    src?: string;
    sck?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    ttcid?: string;
  }>;
}

export interface WhatsappAccount {
  id: string;
  name: string;
  phoneNumber: string;
  color: string;
}

interface DashboardViewProps {
  manualSales: Sale[];
  enrichedClients: Client[];
  whatsappAccounts: WhatsappAccount[];
  clientTags: Record<string, string>;
  tagTimestamps: Record<string, string>;
  getClientTag: (client: Client) => string;
  handleEditSale: (sale: Sale) => void;
  handleDeleteSale: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  manualSales,
  enrichedClients,
  whatsappAccounts,
  clientTags,
  tagTimestamps,
  getClientTag,
  handleEditSale,
  handleDeleteSale
}) => {
  const [activeDashSubTab, setActiveDashSubTab] = useState<'vendas' | 'relatorios' | 'leads' | 'tabela' | 'conversao'>('vendas');
  const [dashDateFilter, setDashDateFilter] = useState<'7' | '15' | '30' | '60' | '90' | 'all' | 'custom'>('all');
  const [dashStartDate, setDashStartDate] = useState<string>('');
  const [dashEndDate, setDashEndDate] = useState<string>('');
  const [dashShowUtms, setDashShowUtms] = useState<boolean>(false);
  const [dashFilterPayment, setDashFilterPayment] = useState<'pix' | 'all'>('all');
  const [selectedStateForModal, setSelectedStateForModal] = useState<string | null>(null);
  const [conversionProductFilter, setConversionProductFilter] = useState<string>('all');

  const uniqueProductsList = useMemo(() => {
    const set = new Set<string>();
    manualSales.forEach(s => {
      if (s.productName) {
        const clean = s.productName.replace(/( - [0-9]+ Potes?)/gi, '').trim();
        set.add(clean);
      }
    });
    enrichedClients.forEach(c => {
      c.leads?.forEach(l => {
        if (l.produto) {
          const clean = l.produto.replace(/( - [0-9]+ Potes?)/gi, '').trim();
          set.add(clean);
        }
      });
    });
    return Array.from(set).sort();
  }, [manualSales, enrichedClients]);

  const dddStateMap: Record<string, string> = {
    '11': 'São Paulo (SP)', '12': 'São Paulo (SP)', '13': 'São Paulo (SP)', '14': 'São Paulo (SP)', '15': 'São Paulo (SP)', '16': 'São Paulo (SP)', '17': 'São Paulo (SP)', '18': 'São Paulo (SP)', '19': 'São Paulo (SP)',
    '21': 'Rio de Janeiro (RJ)', '22': 'Rio de Janeiro (RJ)', '24': 'Rio de Janeiro (RJ)',
    '27': 'Espírito Santo (ES)', '28': 'Espírito Santo (ES)',
    '31': 'Minas Gerais (MG)', '32': 'Minas Gerais (MG)', '33': 'Minas Gerais (MG)', '34': 'Minas Gerais (MG)', '35': 'Minas Gerais (MG)', '37': 'Minas Gerais (MG)', '38': 'Minas Gerais (MG)',
    '41': 'Paraná (PR)', '42': 'Paraná (PR)', '43': 'Paraná (PR)', '44': 'Paraná (PR)', '45': 'Paraná (PR)', '46': 'Paraná (PR)',
    '47': 'Santa Catarina (SC)', '48': 'Santa Catarina (SC)', '49': 'Santa Catarina (SC)',
    '51': 'Rio Grande do Sul (RS)', '53': 'Rio Grande do Sul (RS)', '54': 'Rio Grande do Sul (RS)', '55': 'Rio Grande do Sul (RS)',
    '61': 'Distrito Federal (DF)',
    '62': 'Goiás (GO)', '64': 'Goiás (GO)',
    '63': 'Tocantins (TO)',
    '65': 'Mato Grosso (MT)', '66': 'Mato Grosso (MT)',
    '67': 'Mato Grosso do Sul (MS)',
    '68': 'Acre (AC)',
    '69': 'Rondônia (RO)',
    '71': 'Bahia (BA)', '73': 'Bahia (BA)', '74': 'Bahia (BA)', '75': 'Bahia (BA)', '77': 'Bahia (BA)',
    '79': 'Sergipe (SE)',
    '81': 'Pernambuco (PE)', '87': 'Pernambuco (PE)',
    '82': 'Alagoas (AL)',
    '83': 'Paraíba (PB)',
    '84': 'Rio Grande do Norte (RN)',
    '85': 'Ceará (CE)', '88': 'Ceará (CE)',
    '86': 'Piauí (PI)', '89': 'Piauí (PI)',
    '91': 'Pará (PA)', '93': 'Pará (PA)', '94': 'Pará (PA)',
    '92': 'Amazonas (AM)', '97': 'Amazonas (AM)',
    '95': 'Roraima (RR)',
    '96': 'Amapá (AP)',
    '98': 'Maranhão (MA)', '99': 'Maranhão (MA)'
  };

  const getLocalFromPhone = (phone: string): string => {
    if (!phone) return 'Não Especificado';
    const cleaned = phone.replace(/\D/g, '');
    let withoutDDI = cleaned;
    if (cleaned.startsWith('55') && cleaned.length >= 10) {
      withoutDDI = cleaned.substring(2);
    }
    if (withoutDDI.length >= 2) {
      const ddd = withoutDDI.substring(0, 2);
      return dddStateMap[ddd] || `Outros (DDD ${ddd})`;
    }
    return 'Sem DDD';
  };

  // Filter verification helper
  const isWithinDashFilter = (itemTimestampOrDate: number | string) => {
    if (dashDateFilter === 'all') return true;
    
    let itemTime = 0;
    if (typeof itemTimestampOrDate === 'number') {
      itemTime = itemTimestampOrDate;
    } else {
      itemTime = new Date(itemTimestampOrDate + 'T12:00:00').getTime();
    }
    if (isNaN(itemTime)) return false;

    const now = new Date();
    const startTime = new Date();

    if (dashDateFilter === '7') {
      startTime.setDate(now.getDate() - 7);
      return itemTime >= startOfDay(startTime).getTime() && itemTime <= endOfDay(now).getTime();
    } else if (dashDateFilter === '15') {
      startTime.setDate(now.getDate() - 15);
      return itemTime >= startOfDay(startTime).getTime() && itemTime <= endOfDay(now).getTime();
    } else if (dashDateFilter === '30') {
      startTime.setDate(now.getDate() - 30);
      return itemTime >= startOfDay(startTime).getTime() && itemTime <= endOfDay(now).getTime();
    } else if (dashDateFilter === '60') {
      startTime.setDate(now.getDate() - 60);
      return itemTime >= startOfDay(startTime).getTime() && itemTime <= endOfDay(now).getTime();
    } else if (dashDateFilter === '90') {
      startTime.setDate(now.getDate() - 90);
      return itemTime >= startOfDay(startTime).getTime() && itemTime <= endOfDay(now).getTime();
    } else if (dashDateFilter === 'custom') {
      if (!dashStartDate) return true;
      const start = startOfDay(new Date(dashStartDate + 'T00:00:00')).getTime();
      const end = dashEndDate ? endOfDay(new Date(dashEndDate + 'T23:59:59')).getTime() : endOfDay(now).getTime();
      return itemTime >= start && itemTime <= end;
    }
    return true;
  };

  const filteredSalesForDash = useMemo(() => {
    return manualSales.filter(sale => isWithinDashFilter(sale.timestamp || sale.date));
  }, [manualSales, dashDateFilter, dashStartDate, dashEndDate]);

  const filteredClientsForDash = useMemo(() => {
    return enrichedClients.filter(client => {
      const clientTime = client.leads?.[0]?.timestamp || client.lastPurchaseTimestamp;
      return isWithinDashFilter(clientTime || '');
    });
  }, [enrichedClients, dashDateFilter, dashStartDate, dashEndDate]);

  const selectedStateClients = useMemo(() => {
    if (!selectedStateForModal) return [];
    return filteredClientsForDash.filter(client => {
      const stateName = getLocalFromPhone(client.telefone);
      if (stateName !== selectedStateForModal) return false;
      const tag = getClientTag ? getClientTag(client) : (clientTags[client.key] || '');
      const hasContactTag = ['reloginho', 'pendente', 'contato_sucesso', 'contato_falha', 'vendido'].includes(tag);
      const hasSales = (client.manualSales || []).some(s => isWithinDashFilter(s.timestamp || s.date));
      return hasContactTag || hasSales;
    });
  }, [selectedStateForModal, filteredClientsForDash, clientTags, getClientTag, dashDateFilter]);

  const dashTotalCommission = useMemo(() => {
    return filteredSalesForDash.reduce((acc, curr) => acc + curr.commission, 0);
  }, [filteredSalesForDash]);

  const dashTotalSalesCount = useMemo(() => {
    return filteredSalesForDash.length;
  }, [filteredSalesForDash]);

  const commissionMonthPix = useMemo(() => {
    const currentYearMonth = format(new Date(), 'yyyy-MM');
    return manualSales.reduce((acc, curr) => {
      const saleYearMonth = curr.date.substring(0, 7);
      if (saleYearMonth === currentYearMonth && (!curr.saleType || curr.saleType === 'pix')) {
        return acc + curr.commission;
      }
      return acc;
    }, 0);
  }, [manualSales]);

  const commissionMonthPayt = useMemo(() => {
    const currentYearMonth = format(new Date(), 'yyyy-MM');
    return manualSales.reduce((acc, curr) => {
      const saleYearMonth = curr.date.substring(0, 7);
      if (saleYearMonth === currentYearMonth && curr.saleType === 'payt') {
        return acc + curr.commission;
      }
      return acc;
    }, 0);
  }, [manualSales]);

  const commissionMonthTotal = useMemo(() => {
    return commissionMonthPix + commissionMonthPayt;
  }, [commissionMonthPix, commissionMonthPayt]);

  const displayedSalesForTable = useMemo(() => {
    if (dashFilterPayment === 'pix') {
      return filteredSalesForDash.filter(sale => !sale.saleType || sale.saleType === 'pix');
    }
    return filteredSalesForDash;
  }, [filteredSalesForDash, dashFilterPayment]);

  const dashDailySalesAndCommission = useMemo(() => {
    const dailyMap = new Map<string, { date: string; formattedDate: string; count: number; commission: number; value: number }>();
    filteredSalesForDash.forEach(sale => {
      const rawDate = sale.date; // YYYY-MM-DD
      let formattedDate = rawDate;
      try {
        const parts = rawDate.split('-');
        if (parts.length === 3) {
          formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`; // dd/mm/yyyy
        }
      } catch (_) {}
      
      const existing = dailyMap.get(rawDate) || { date: rawDate, formattedDate, count: 0, commission: 0, value: 0 };
      existing.count += 1;
      existing.commission += sale.commission;
      existing.value += sale.value;
      dailyMap.set(rawDate, existing);
    });
    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSalesForDash]);

  const dashMonthlyCommissionTimeline = useMemo(() => {
    const monthlyMap = new Map<string, { month: string; monthLabel: string; value: number; commission: number }>();
    filteredSalesForDash.forEach(sale => {
      const parts = sale.date.split('-');
      if (parts.length < 2) return;
      const monthKey = `${parts[0]}-${parts[1]}`; // YYYY-MM
      const monthIndex = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      const monthLabel = `${monthNames[monthIndex]}/${year}`;
      
      const existing = monthlyMap.get(monthKey) || { month: monthKey, monthLabel, value: 0, commission: 0 };
      existing.value += sale.value;
      existing.commission += sale.commission;
      monthlyMap.set(monthKey, existing);
    });
    return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredSalesForDash]);

  const dashHourlyDistribution = useMemo(() => {
    const distribution = Array.from({ length: 24 }, (_, i) => ({ 
      hour: i, 
      label: `${i}h`, 
      count: 0, 
      value: 0 
    }));
    filteredSalesForDash.forEach(sale => {
      const saleDate = sale.timestamp ? new Date(sale.timestamp) : new Date(sale.date + 'T12:00:00');
      if (isNaN(saleDate.getTime())) return;
      const hour = saleDate.getHours();
      distribution[hour].count += 1;
      distribution[hour].value += sale.value;
    });
    return distribution;
  }, [filteredSalesForDash]);

  const dashWeeklyDistribution = useMemo(() => {
    const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const distribution = dayLabels.map((day, idx) => ({
      day,
      idx: idx === 6 ? 0 : idx + 1, // mapping to javascript getDay() where 0=Sunday, 1=Monday
      count: 0,
      value: 0
    }));
    filteredSalesForDash.forEach(sale => {
      const saleDate = sale.timestamp ? new Date(sale.timestamp) : new Date(sale.date + 'T12:00:00');
      if (isNaN(saleDate.getTime())) return;
      const dayIndex = saleDate.getDay();
      const targetDay = distribution.find(d => d.idx === dayIndex);
      if (targetDay) {
        targetDay.count += 1;
        targetDay.value += sale.value;
      }
    });
    return distribution;
  }, [filteredSalesForDash]);

  const dashMonthlyDaysDistribution = useMemo(() => {
    const dayMap = new Map<number, { day: number; label: string; count: number; value: number }>();
    for (let i = 1; i <= 31; i++) {
      dayMap.set(i, { day: i, label: `${i}`, count: 0, value: 0 });
    }
    filteredSalesForDash.forEach(sale => {
      const saleDate = sale.timestamp ? new Date(sale.timestamp) : new Date(sale.date + 'T12:00:00');
      if (isNaN(saleDate.getTime())) return;
      const dayNum = saleDate.getDate();
      const existing = dayMap.get(dayNum);
      if (existing) {
        existing.count += 1;
        existing.value += sale.value;
      }
    });
    return Array.from(dayMap.values()).sort((a, b) => a.day - b.day);
  }, [filteredSalesForDash]);

  const dashYearlyMonthsDistribution = useMemo(() => {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthMap = new Map<number, { monthIndex: number; monthName: string; count: number; value: number }>();
    for (let i = 0; i < 12; i++) {
      monthMap.set(i, { monthIndex: i, monthName: monthNames[i], count: 0, value: 0 });
    }
    filteredSalesForDash.forEach(sale => {
      const saleDate = sale.timestamp ? new Date(sale.timestamp) : new Date(sale.date + 'T12:00:00');
      if (isNaN(saleDate.getTime())) return;
      const monthIndex = saleDate.getMonth();
      const existing = monthMap.get(monthIndex);
      if (existing) {
        existing.count += 1;
        existing.value += sale.value;
      }
    });
    return Array.from(monthMap.values()).sort((a, b) => a.monthIndex - b.monthIndex);
  }, [filteredSalesForDash]);

  const dashWhatsappDistribution = useMemo(() => {
    const distributionMap = new Map<string, number>();
    filteredClientsForDash.forEach(client => {
      const tag = getClientTag(client);
      if (tag === 'lixo') return;
      const whatsappId = client.assignedWhatsappId;
      const account = whatsappAccounts.find(a => a.id === whatsappId);
      const name = account ? account.name : 'Não Atribuído';
      distributionMap.set(name, (distributionMap.get(name) || 0) + 1);
    });
    return Array.from(distributionMap.entries()).map(([name, value]) => {
      const account = whatsappAccounts.find(a => a.name === name);
      return { 
         name, 
         value, 
         color: account ? account.color : '#cbd5e1' 
      };
    }).sort((a, b) => b.value - a.value);
  }, [filteredClientsForDash, whatsappAccounts, getClientTag]);

  const dashWhatsappSales = useMemo(() => {
    const salesValueMap = new Map<string, number>();
    const salesCountMap = new Map<string, number>();
    
    filteredSalesForDash.forEach(sale => {
      const client = enrichedClients.find(c => c.key === sale.clientKey);
      const whatsappId = client?.assignedWhatsappId;
      const account = whatsappAccounts.find(a => a.id === whatsappId);
      const name = account ? account.name : 'Não Atribuído';
      
      salesValueMap.set(name, (salesValueMap.get(name) || 0) + sale.value);
      salesCountMap.set(name, (salesCountMap.get(name) || 0) + 1);
    });
    
    const salesData = whatsappAccounts.map(acc => ({
      name: acc.name,
      value: salesValueMap.get(acc.name) || 0,
      count: salesCountMap.get(acc.name) || 0,
      color: acc.color
    })).sort((a, b) => b.value - a.value);

    if (salesValueMap.has('Não Atribuído')) {
      salesData.push({
        name: 'Não Atribuído',
        value: salesValueMap.get('Não Atribuído') || 0,
        count: salesCountMap.get('Não Atribuído') || 0,
        color: '#cbd5e1'
      });
    }
    return salesData;
  }, [filteredSalesForDash, enrichedClients, whatsappAccounts]);

  const dashManualSalesByProduct = useMemo(() => {
    const productMap = new Map<string, { name: string; value: number }>();
    filteredSalesForDash.forEach(sale => {
      const productName = sale.productName || 'Não Especificado';
      const cleanedName = productName.replace(/( - [0-9]+ Potes?)/gi, '').trim();
      const existing = productMap.get(cleanedName) || { name: cleanedName, value: 0 };
      existing.value += sale.value;
      productMap.set(cleanedName, existing);
    });
    return Array.from(productMap.values()).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredSalesForDash]);

  const dashLeadsComparisonTimeline = useMemo(() => {
    const dailyMap = new Map<string, { date: string; formattedDate: string; novosLeads: number; reloginhos: number; vendidos: number }>();
    const formatDateKey = (d: Date) => format(d, 'yyyy-MM-dd');
    
    let daysCount = 0;
    if (dashDateFilter === '7') daysCount = 7;
    else if (dashDateFilter === '15') daysCount = 15;
    else if (dashDateFilter === '30') daysCount = 30;
    else if (dashDateFilter === '60') daysCount = 60;
    else if (dashDateFilter === '90') daysCount = 90;
    
    if (daysCount > 0) {
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const k = formatDateKey(d);
        const p = format(d, 'dd/MM/yyyy');
        dailyMap.set(k, { date: k, formattedDate: p, novosLeads: 0, reloginhos: 0, vendidos: 0 });
      }
    }
    
    // 1. Novos Leads na Planilha
    enrichedClients.forEach(client => {
      client.leads.forEach(lead => {
        const leadDate = lead.timestamp ? new Date(lead.timestamp) : new Date(lead.data + 'T12:00:00');
        if (isNaN(leadDate.getTime())) return;
        const k = formatDateKey(leadDate);
        
        if (isWithinDashFilter(leadDate.getTime())) {
          if (!dailyMap.has(k)) {
            const p = format(leadDate, 'dd/MM/yyyy');
            dailyMap.set(k, { date: k, formattedDate: p, novosLeads: 0, reloginhos: 0, vendidos: 0 });
          }
          const existing = dailyMap.get(k)!;
          existing.novosLeads += 1;
        }
      });
    });
    
    // 2. Leads com Tag de Reloginho
    Object.entries(clientTags).forEach(([clientKey, tagValue]) => {
      if (tagValue === 'reloginho') {
        const tsStr = tagTimestamps[clientKey];
        if (tsStr) {
          const tagDate = new Date(tsStr);
          if (!isNaN(tagDate.getTime()) && isWithinDashFilter(tagDate.getTime())) {
            const k = formatDateKey(tagDate);
            if (!dailyMap.has(k)) {
              const p = format(tagDate, 'dd/MM/yyyy');
              dailyMap.set(k, { date: k, formattedDate: p, novosLeads: 0, reloginhos: 0, vendidos: 0 });
            }
            const existing = dailyMap.get(k)!;
            existing.reloginhos += 1;
          }
        }
      }
    });
    
    // 3. Vendidos (vendas manuais)
    manualSales.forEach(sale => {
      const saleDate = sale.timestamp ? new Date(sale.timestamp) : new Date(sale.date + 'T12:00:00');
      if (isNaN(saleDate.getTime())) return;
      const k = formatDateKey(saleDate);
      
      if (isWithinDashFilter(saleDate.getTime())) {
        if (!dailyMap.has(k)) {
          const p = format(saleDate, 'dd/MM/yyyy');
          dailyMap.set(k, { date: k, formattedDate: p, novosLeads: 0, reloginhos: 0, vendidos: 0 });
        }
        const existing = dailyMap.get(k)!;
        existing.vendidos += 1;
      }
    });
    
    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [enrichedClients, clientTags, tagTimestamps, manualSales, dashDateFilter, dashStartDate, dashEndDate]);

  const dashTagsDistribution = useMemo(() => {
    let lixo = 0;
    let reloginho = 0;
    let vendido = 0;
    let falha = 0; 
    let sucesso = 0; 
    let semTag = 0;
    
    filteredClientsForDash.forEach(client => {
      const tag = getClientTag(client);
      if (!tag) {
        semTag++;
      } else if (tag === 'lixo') {
        lixo++;
      } else if (tag === 'reloginho') {
        reloginho++;
      } else if (tag === 'vendido') {
        vendido++;
      } else if (tag === 'contato_falha') {
        falha++;
      } else if (tag === 'contato_sucesso') {
        sucesso++;
      } else {
        semTag++;
      }
    });
    
    return [
      { name: "Sem Tag", value: semTag, color: "#cbd5e1" },
      { name: "Reloginho", value: reloginho, color: "#f59e0b" },
      { name: "Vendido", value: vendido, color: "#10b981" },
      { name: "Contato Mal Sucedido", value: falha, color: "#8b5cf6" },
      { name: "Contato Bem Sucedido", value: sucesso, color: "#06b6d4" },
      { name: "Lixo", value: lixo, color: "#f43f5e" },
    ].filter(item => item.value > 0);
  }, [filteredClientsForDash, getClientTag]);

  const dashStatusDistribution = useMemo(() => {
    const statusColorMap: Record<string, string> = {
      "Aprovado": "#00BC7D",
      "Pendente": "#FE9900",
      "Cancelado": "#EC1A40",
      "Recusado": "#EC1A40",
      "Reembolsado": "#3b82f6",
      "Carrinho Abandonado": "#8FA1B9",
      "Expirado": "#F44900",
      "Lixo": "#fda4af"
    };
    const statusMap = new Map<string, number>();
    filteredClientsForDash.forEach(client => {
      const status = client.status || 'Sem status';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    
    return Array.from(statusMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: statusColorMap[name] || "#94a3b8"
    })).sort((a, b) => b.value - a.value);
  }, [filteredClientsForDash]);

  const dashProductDistribution = useMemo(() => {
    const productMap = new Map<string, number>();
    filteredClientsForDash.forEach(client => {
      const productName = client.leads?.[0]?.produto || 'Não Especificado';
      const cleanedName = productName.replace(/( - [0-9]+ Potes?)/gi, '').trim();
      productMap.set(cleanedName, (productMap.get(cleanedName) || 0) + 1);
    });
    
    return Array.from(productMap.entries()).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filteredClientsForDash]);

  const dashLocationDistribution = useMemo(() => {
    const dddStateMap: Record<string, string> = {
      '11': 'São Paulo (SP)', '12': 'São Paulo (SP)', '13': 'São Paulo (SP)', '14': 'São Paulo (SP)', '15': 'São Paulo (SP)', '16': 'São Paulo (SP)', '17': 'São Paulo (SP)', '18': 'São Paulo (SP)', '19': 'São Paulo (SP)',
      '21': 'Rio de Janeiro (RJ)', '22': 'Rio de Janeiro (RJ)', '24': 'Rio de Janeiro (RJ)',
      '27': 'Espírito Santo (ES)', '28': 'Espírito Santo (ES)',
      '31': 'Minas Gerais (MG)', '32': 'Minas Gerais (MG)', '33': 'Minas Gerais (MG)', '34': 'Minas Gerais (MG)', '35': 'Minas Gerais (MG)', '37': 'Minas Gerais (MG)', '38': 'Minas Gerais (MG)',
      '41': 'Paraná (PR)', '42': 'Paraná (PR)', '43': 'Paraná (PR)', '44': 'Paraná (PR)', '45': 'Paraná (PR)', '46': 'Paraná (PR)',
      '47': 'Santa Catarina (SC)', '48': 'Santa Catarina (SC)', '49': 'Santa Catarina (SC)',
      '51': 'Rio Grande do Sul (RS)', '53': 'Rio Grande do Sul (RS)', '54': 'Rio Grande do Sul (RS)', '55': 'Rio Grande do Sul (RS)',
      '61': 'Distrito Federal (DF)',
      '62': 'Goiás (GO)', '64': 'Goiás (GO)',
      '63': 'Tocantins (TO)',
      '65': 'Mato Grosso (MT)', '66': 'Mato Grosso (MT)',
      '67': 'Mato Grosso do Sul (MS)',
      '68': 'Acre (AC)',
      '69': 'Rondônia (RO)',
      '71': 'Bahia (BA)', '73': 'Bahia (BA)', '74': 'Bahia (BA)', '75': 'Bahia (BA)', '77': 'Bahia (BA)',
      '79': 'Sergipe (SE)',
      '81': 'Pernambuco (PE)', '87': 'Pernambuco (PE)',
      '82': 'Alagoas (AL)',
      '83': 'Paraíba (PB)',
      '84': 'Rio Grande do Norte (RN)',
      '85': 'Ceará (CE)', '88': 'Ceará (CE)',
      '86': 'Piauí (PI)', '89': 'Piauí (PI)',
      '91': 'Pará (PA)', '93': 'Pará (PA)', '94': 'Pará (PA)',
      '92': 'Amazonas (AM)', '97': 'Amazonas (AM)',
      '95': 'Roraima (RR)',
      '96': 'Amapá (AP)',
      '98': 'Maranhão (MA)', '99': 'Maranhão (MA)'
    };
    const getBrazilLocalFromPhone = (phone: string): string => {
      if (!phone) return 'Não Especificado';
      const cleaned = phone.replace(/\D/g, '');
      let withoutDDI = cleaned;
      if (cleaned.startsWith('55') && cleaned.length >= 10) {
        withoutDDI = cleaned.substring(2);
      }
      if (withoutDDI.length >= 2) {
        const ddd = withoutDDI.substring(0, 2);
        return dddStateMap[ddd] || `Outros (DDD ${ddd})`;
      }
      return 'Sem DDD';
    };
    
    const localMap = new Map<string, number>();
    // Use filteredSalesForDash (representing manual sales) to get DDD from matching clients
    filteredSalesForDash.forEach(sale => {
      const client = enrichedClients.find(c => c.key === sale.clientKey);
      if (client) {
        const loc = getBrazilLocalFromPhone(client.telefone);
        localMap.set(loc, (localMap.get(loc) || 0) + 1);
      }
    });
    
    return Array.from(localMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredSalesForDash, enrichedClients]);

  const stateConversionAnalysis = useMemo(() => {
    const dddStateMap: Record<string, string> = {
      '11': 'São Paulo (SP)', '12': 'São Paulo (SP)', '13': 'São Paulo (SP)', '14': 'São Paulo (SP)', '15': 'São Paulo (SP)', '16': 'São Paulo (SP)', '17': 'São Paulo (SP)', '18': 'São Paulo (SP)', '19': 'São Paulo (SP)',
      '21': 'Rio de Janeiro (RJ)', '22': 'Rio de Janeiro (RJ)', '24': 'Rio de Janeiro (RJ)',
      '27': 'Espírito Santo (ES)', '28': 'Espírito Santo (ES)',
      '31': 'Minas Gerais (MG)', '32': 'Minas Gerais (MG)', '33': 'Minas Gerais (MG)', '34': 'Minas Gerais (MG)', '35': 'Minas Gerais (MG)', '37': 'Minas Gerais (MG)', '38': 'Minas Gerais (MG)',
      '41': 'Paraná (PR)', '42': 'Paraná (PR)', '43': 'Paraná (PR)', '44': 'Paraná (PR)', '45': 'Paraná (PR)', '46': 'Paraná (PR)',
      '47': 'Santa Catarina (SC)', '48': 'Santa Catarina (SC)', '49': 'Santa Catarina (SC)',
      '51': 'Rio Grande do Sul (RS)', '53': 'Rio Grande do Sul (RS)', '54': 'Rio Grande do Sul (RS)', '55': 'Rio Grande do Sul (RS)',
      '61': 'Distrito Federal (DF)',
      '62': 'Goiás (GO)', '64': 'Goiás (GO)',
      '63': 'Tocantins (TO)',
      '65': 'Mato Grosso (MT)', '66': 'Mato Grosso (MT)',
      '67': 'Mato Grosso do Sul (MS)',
      '68': 'Acre (AC)',
      '69': 'Rondônia (RO)',
      '71': 'Bahia (BA)', '73': 'Bahia (BA)', '74': 'Bahia (BA)', '75': 'Bahia (BA)', '77': 'Bahia (BA)',
      '79': 'Sergipe (SE)',
      '81': 'Pernambuco (PE)', '87': 'Pernambuco (PE)',
      '82': 'Alagoas (AL)',
      '83': 'Paraíba (PB)',
      '84': 'Rio Grande do Norte (RN)',
      '85': 'Ceará (CE)', '88': 'Ceará (CE)',
      '86': 'Piauí (PI)', '89': 'Piauí (PI)',
      '91': 'Pará (PA)', '93': 'Pará (PA)', '94': 'Pará (PA)',
      '92': 'Amazonas (AM)', '97': 'Amazonas (AM)',
      '95': 'Roraima (RR)',
      '96': 'Amapá (AP)',
      '98': 'Maranhão (MA)', '99': 'Maranhão (MA)'
    };
    const getLocalFromPhone = (phone: string): string => {
      if (!phone) return 'Não Especificado';
      const cleaned = phone.replace(/\D/g, '');
      let withoutDDI = cleaned;
      if (cleaned.startsWith('55') && cleaned.length >= 10) {
        withoutDDI = cleaned.substring(2);
      }
      if (withoutDDI.length >= 2) {
        const ddd = withoutDDI.substring(0, 2);
        return dddStateMap[ddd] || `Outros (DDD ${ddd})`;
      }
      return 'Sem DDD';
    };

    const stateMap = new Map<string, { stateName: string; contactedLeads: number; salesCount: number; salesValue: number }>();

    filteredClientsForDash.forEach(client => {
      if (conversionProductFilter !== 'all') {
        const hasMatchingProduct = client.leads?.some(l => {
          const pName = l.produto || '';
          const cleaned = pName.replace(/( - [0-9]+ Potes?)/gi, '').trim();
          return cleaned.toLowerCase() === conversionProductFilter.toLowerCase();
        });
        if (!hasMatchingProduct) return;
      }
      const tag = getClientTag ? getClientTag(client) : (clientTags[client.key] || '');
      if (['reloginho', 'pendente', 'contato_sucesso', 'contato_falha', 'vendido'].includes(tag)) {
        const stateName = getLocalFromPhone(client.telefone);
        if (stateName && stateName !== 'Não Especificado' && stateName !== 'Sem DDD') {
          const existing = stateMap.get(stateName) || { stateName, contactedLeads: 0, salesCount: 0, salesValue: 0 };
          existing.contactedLeads += 1;
          stateMap.set(stateName, existing);
        }
      }
    });

    filteredSalesForDash.forEach(sale => {
      if (conversionProductFilter !== 'all') {
        const sName = sale.productName || '';
        const cleaned = sName.replace(/( - [0-9]+ Potes?)/gi, '').trim();
        if (cleaned.toLowerCase() !== conversionProductFilter.toLowerCase()) return;
      }
      const client = enrichedClients.find(c => c.key === sale.clientKey);
      if (client) {
        const stateName = getLocalFromPhone(client.telefone);
        if (stateName && stateName !== 'Não Especificado' && stateName !== 'Sem DDD') {
          const existing = stateMap.get(stateName) || { stateName, contactedLeads: 0, salesCount: 0, salesValue: 0 };
          existing.salesCount += 1;
          existing.salesValue += sale.value;
          stateMap.set(stateName, existing);
        }
      }
    });

    return Array.from(stateMap.values()).map(item => {
      const conversionRate = item.contactedLeads > 0 ? (item.salesCount / item.contactedLeads) * 100 : 0;
      return {
        ...item,
        conversionRate: parseFloat(conversionRate.toFixed(2))
      };
    }).sort((a, b) => b.conversionRate - a.conversionRate);
  }, [filteredClientsForDash, filteredSalesForDash, enrichedClients, clientTags, getClientTag, conversionProductFilter]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 custom-scrollbar bg-slate-50/40">
      
      {/* FILTER & TABS DASHBOARD SELECTOR - rounded, compact, consistent */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Subtabs tabs layout */}
          <div className="bg-slate-100 p-1 rounded-xl flex flex-wrap items-center gap-1 select-none">
            {(['vendas', 'relatorios', 'leads', 'tabela', 'conversao'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveDashSubTab(tab)}
                className={cn(
                  "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer capitalize",
                  activeDashSubTab === tab
                    ? "bg-white text-modern-primary shadow-sm"
                    : "text-modern-secondary hover:text-modern-primary"
                )}
              >
                {tab === 'relatorios' ? 'Relatórios' : tab === 'conversao' ? 'Conversão' : tab}
              </button>
            ))}
          </div>

          {/* Date Options */}
          <div className="flex flex-wrap items-center gap-1.5 select-none text-xs">
            {[
              { value: '7', label: '7d' },
              { value: '15', label: '15d' },
              { value: '30', label: '30d' },
              { value: '60', label: '60d' },
              { value: '90', label: '90d' },
              { value: 'all', label: 'Todo Período' },
              { value: 'custom', label: 'Personalizado' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setDashDateFilter(opt.value as any)}
                className={cn(
                  "px-3 py-1.5 font-black uppercase tracking-widest rounded-lg transition-all border text-[10px] cursor-pointer",
                  dashDateFilter === opt.value
                    ? "bg-modern-primary text-white border-modern-primary"
                    : "bg-white text-modern-secondary border-slate-200/85 hover:border-slate-300"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date range fields */}
        {dashDateFilter === 'custom' && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100/70 text-xs w-full max-w-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-modern-secondary font-black uppercase tracking-widest text-[9px]">Data de Início:</span>
              <input 
                type="date" 
                value={dashStartDate}
                onChange={(e) => setDashStartDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-modern-primary font-bold"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-modern-secondary font-black uppercase tracking-widest text-[9px]">Data Final:</span>
              <input 
                type="date" 
                value={dashEndDate}
                onChange={(e) => setDashEndDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-modern-primary font-bold"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* RENDER ACTIVE TAB */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDashSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className="space-y-6"
        >
          {/* TAB: VENDAS */}
          {activeDashSubTab === 'vendas' && (
            <div className="space-y-6">
              {/* Vendas Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-modern-secondary">Comissão</p>
                    <h4 className="text-xl font-black text-emerald-600 mt-1 font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashTotalCommission)}
                    </h4>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <DollarSign size={18} />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-modern-secondary">Total de Vendas</p>
                    <h4 className="text-xl font-black text-slate-800 mt-1 font-mono">{dashTotalSalesCount}</h4>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <TrendingUp size={18} />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-modern-secondary">Faturamento Total</p>
                    <h4 className="text-xl font-black text-slate-800 mt-1 font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        filteredSalesForDash.reduce((sum, s) => sum + s.value, 0)
                      )}
                    </h4>
                  </div>
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                    <Package size={18} />
                  </div>
                </div>
              </div>

              {/* Split Month Commissions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-modern-secondary">Comissão (Mês) - PIX</p>
                    <h4 className="text-xl font-black text-emerald-600 mt-1 font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commissionMonthPix)}
                    </h4>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <DollarSign size={18} />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-modern-secondary">Comissão (Mês) - Payt</p>
                    <h4 className="text-xl font-black text-blue-600 mt-1 font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commissionMonthPayt)}
                    </h4>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <DollarSign size={18} />
                  </div>
                </div>

                <div className="bg-white border border-rose-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between bg-gradient-to-br from-white to-rose-50/10">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">Comissão Total (Mês)</p>
                    <h4 className="text-xl font-black text-rose-600 mt-1 font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commissionMonthTotal)}
                    </h4>
                  </div>
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                    <DollarSign size={18} />
                  </div>
                </div>
              </div>

              {/* Commission Timeline and Volumes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline Monthly */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm lg:col-span-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4">Comissão por Mês (Linha do Tempo)</h3>
                  <div className="h-[240px] w-full">
                    {dashMonthlyCommissionTimeline.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashMonthlyCommissionTimeline}>
                          <defs>
                            <linearGradient id="areaCommCol" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="monthLabel" tick={{ fontSize: 9 }} tickLine={false} />
                          <YAxis tickFormatter={(val) => `R$${val}`} tick={{ fontSize: 9 }} tickLine={false} />
                          <Tooltip 
                            formatter={(value: any) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Comissão']}
                            labelStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                            contentStyle={{ fontSize: '11px', borderRadius: '12px' }}
                          />
                          <Area type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#areaCommCol)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sem comissões para gerar a linha do tempo</div>
                    )}
                  </div>
                </div>

                {/* Volume de Vendas Diário */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm lg:col-span-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4">Volume de Vendas Diário</h3>
                  <div className="h-[240px] w-full">
                    {dashDailySalesAndCommission.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashDailySalesAndCommission}>
                          <XAxis dataKey="formattedDate" tick={{ fontSize: 9 }} tickLine={false} />
                          <YAxis tick={{ fontSize: 9 }} tickLine={false} />
                          <Tooltip 
                            formatter={(value: any) => [value, 'Vendas']}
                            labelStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                            contentStyle={{ fontSize: '11px', borderRadius: '12px' }}
                          />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Vendas Diárias" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sem vendas no período</div>
                    )}
                  </div>
                </div>

                {/* Volume de comissão diário */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm lg:col-span-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4">Volume de comissão diário</h3>
                  <div className="h-[240px] w-full">
                    {dashDailySalesAndCommission.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashDailySalesAndCommission}>
                          <XAxis dataKey="formattedDate" tick={{ fontSize: 9 }} tickLine={false} />
                          <YAxis tickFormatter={(val) => `R$${val}`} tick={{ fontSize: 9 }} tickLine={false} />
                          <Tooltip 
                            formatter={(value: any) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Comissão']}
                            labelStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                            contentStyle={{ fontSize: '11px', borderRadius: '12px' }}
                          />
                          <Line type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Comissão Diária" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sem comissões registradas</div>
                    )}
                  </div>
                </div>
              </div>

              {/* WhatsApp Sales Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
                  <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4">Vendas por WhatsApp (Faturamento)</h3>
                  <div className="h-[240px] w-full">
                    {dashWhatsappSales.some(s => s.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashWhatsappSales} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                          <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={110} tickLine={false} />
                          <Tooltip formatter={(value: any) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Faturamento']} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {dashWhatsappSales.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sem faturamento por WhatsApp registrado no período</div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
                  <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4">Vendas por WhatsApp (Volume/Quantidade)</h3>
                  <div className="h-[240px] w-full">
                    {dashWhatsappSales.some(s => s.count > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashWhatsappSales} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                          <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={110} tickLine={false} />
                          <Tooltip formatter={(value: any) => [value, 'Vendas']} />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {dashWhatsappSales.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sem vendas por WhatsApp registradas no período</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RELATÓRIOS */}
          {activeDashSubTab === 'relatorios' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly distribution */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4">Vendas por Horário (Distribuição Horária)</h3>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashHourlyDistribution}>
                      <defs>
                        <linearGradient id="relHourCol" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9 }} tickLine={false} />
                      <Tooltip 
                        formatter={(value: any) => [value, 'Vendas']}
                        contentStyle={{ fontSize: '11px', borderRadius: '12px' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#relHourCol)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Day of the week distribution */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4">Vendas por Dia da Semana</h3>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashWeeklyDistribution}>
                      <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9 }} tickLine={false} />
                      <Tooltip 
                        formatter={(value: any) => [value, 'Vendas']}
                        contentStyle={{ fontSize: '11px', borderRadius: '12px' }}
                      />
                      <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly days distribution */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4 font-sans">Vendas por Período do Mês (Dias)</h3>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashMonthlyDaysDistribution}>
                      <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9 }} tickLine={false} />
                      <Tooltip 
                        formatter={(value: any) => [value, 'Vendas']}
                        contentStyle={{ fontSize: '11px', borderRadius: '12px' }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Annual months distribution */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4">Vendas por Período do Ano (Meses)</h3>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashYearlyMonthsDistribution}>
                      <XAxis dataKey="monthName" tick={{ fontSize: 9 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9 }} tickLine={false} />
                      <Tooltip 
                        formatter={(value: any) => [value, 'Vendas']}
                        contentStyle={{ fontSize: '11px', borderRadius: '12px' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LEADS */}
          {activeDashSubTab === 'leads' && (
            <div className="space-y-6">
              
              {/* Comparative funnel timeline: leads x reloginho x vendidos */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4">
                  Comparativo de Funil: Leads Novos x Reloginhos Adicionados x Vendas Efetuadas
                </h3>
                <div className="h-[260px] w-full">
                  {dashLeadsComparisonTimeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashLeadsComparisonTimeline}>
                        <XAxis dataKey="formattedDate" tick={{ fontSize: 9 }} tickLine={false} />
                        <YAxis tick={{ fontSize: 9 }} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                        <Line type="monotone" dataKey="novosLeads" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 2 }} name="Leads Novos (Planilha)" />
                        <Line type="monotone" dataKey="reloginhos" stroke="#eab308" strokeWidth={2.5} dot={{ r: 2 }} name="Reloginhos Marcados" />
                        <Line type="monotone" dataKey="vendidos" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2 }} name="Vendidos (Vendas)" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sem dados correspondentes no período</div>
                  )}
                </div>
              </div>

              {/* Grids row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Distribuição Contatos por WhatsApp */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4">Distribuição de Contatos por WhatsApp</h3>
                  <div className="h-[220px] w-full flex items-center justify-center">
                    {dashWhatsappDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashWhatsappDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {dashWhatsappDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [value, 'Contatos']} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-slate-400 text-xs text-center flex items-center justify-center h-full">Sem leads filtrados</div>
                    )}
                  </div>
                </div>

                {/* Distribuição de Vendas por WhatsApp */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4 font-sans">Faturamento Registrado por WhatsApp</h3>
                  <div className="h-[220px] w-full">
                    {dashWhatsappSales.some(s => s.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashWhatsappSales} layout="vertical" margin={{ left: 10, right: 10 }}>
                          <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} tickLine={false} />
                          <Tooltip formatter={(value: any) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Faturamento']} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {dashWhatsappSales.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sem faturamento registrado por WhatsApp no período</div>
                    )}
                  </div>
                </div>

                {/* Tag distribution graph */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4">Leads com Tag</h3>
                  <div className="h-[220px] w-full flex items-center justify-center">
                    {dashTagsDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashTagsDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {dashTagsDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [value, 'Clientes']} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-slate-400 text-xs">Sem dados</div>
                    )}
                  </div>
                </div>

                {/* Status distribution graph */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4 font-sans">Distribuição por Status Atual</h3>
                  <div className="h-[220px] w-full flex items-center justify-center">
                    {dashStatusDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashStatusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {dashStatusDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [value, 'Clientes']} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-slate-400 text-xs">Sem dados</div>
                    )}
                  </div>
                </div>

                {/* Grouped products */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#101010] mb-4 font-sans">Distribuição por Produto</h3>
                  <div className="h-[225px] w-full">
                    {dashProductDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashProductDistribution} layout="vertical" margin={{ left: 10, right: 10 }}>
                          <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={120} tickLine={false} />
                          <Tooltip formatter={(value: any) => [value, 'Leads']} />
                          <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-slate-400 text-xs flex items-center justify-center h-full">Nenhum produto especificado</div>
                    )}
                  </div>
                </div>

                {/* Vendas Manuais por Produto */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#101010] mb-4 font-sans">Vendas Manuais por Produto</h3>
                  <div className="h-[225px] w-full">
                    {dashManualSalesByProduct.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashManualSalesByProduct} layout="vertical" margin={{ left: 10, right: 10 }}>
                          <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={120} tickLine={false} />
                          <Tooltip formatter={(value: any) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Faturamento']} />
                          <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-slate-400 text-xs flex items-center justify-center h-full">Nenhuma venda manual registrada no período</div>
                    )}
                  </div>
                </div>

                {/* Map DDD layout */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-modern-text mb-4">Distribuição por DDD / Local no Brasil (Apenas Vendas Manuais)</h3>
                  <div className="h-[225px] w-full">
                    {dashLocationDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashLocationDistribution}>
                          <XAxis dataKey="name" tick={{ fontSize: 8 }} interval={0} tickLine={false} />
                          <YAxis tick={{ fontSize: 9 }} tickLine={false} />
                          <Tooltip formatter={(value: any) => [value, 'Vendas']} />
                          <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-slate-400 text-xs flex items-center justify-center h-full">Nenhuma venda manual com DDD identificado no período</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: TABELA (HISTÓRICO) */}
          {activeDashSubTab === 'tabela' && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-modern-text">Histórico de Vendas Manuais</h3>
                  <p className="text-[10px] font-bold text-modern-secondary uppercase tracking-wider mt-0.5 font-sans">Visão detalhada das vendas filtradas no período atual</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 self-start bg-white border border-slate-200/60 p-2 rounded-xl shadow-sm sm:shadow-none sm:border-0 sm:p-0">
                  {/* Switch PIX / PIX + Payt */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#5f6368]">
                      {dashFilterPayment === 'pix' ? 'Filtro: Apenas PIX' : 'Filtro: PIX + Payt'}
                    </span>
                    <button 
                      onClick={() => setDashFilterPayment(prev => prev === 'all' ? 'pix' : 'all')}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors duration-200 focus:outline-none cursor-pointer",
                        dashFilterPayment === 'all' ? "bg-modern-primary" : "bg-slate-200"
                      )}
                      title="Alternar entre apenas PIX ou PIX + Payt"
                    >
                      <motion.div 
                        animate={{ x: dashFilterPayment === 'all' ? 20 : 2 }}
                        className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* Division line for large screens */}
                  <div className="hidden sm:block h-4 w-px bg-slate-200" />

                  {/* Switch UTMs */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#5f6368]">{dashShowUtms ? 'Esconder UTMs' : 'Ver UTMs'}</span>
                    <button 
                      onClick={() => setDashShowUtms(!dashShowUtms)}
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors duration-200 focus:outline-none cursor-pointer",
                        dashShowUtms ? "bg-modern-primary" : "bg-slate-200"
                      )}
                    >
                      <motion.div 
                        animate={{ x: dashShowUtms ? 20 : 2 }}
                        className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-100/40 sticky top-0 z-20">
                      <th className="py-3 px-4 text-[10px] font-black text-modern-secondary uppercase tracking-widest border-b border-slate-100">Data</th>
                      <th className="py-3 px-4 text-[10px] font-black text-modern-secondary uppercase tracking-widest border-b border-slate-100">Produto</th>
                      <th className="py-3 px-4 text-[10px] font-black text-modern-secondary uppercase tracking-widest border-b border-slate-100">Valor</th>
                      <th className="py-3 px-4 text-[10px] font-black text-modern-secondary uppercase tracking-widest border-b border-slate-100">Cliente</th>
                      
                      {!dashShowUtms ? (
                        <>
                           <th className="py-3 px-4 text-[10px] font-black text-modern-secondary uppercase tracking-widest text-right border-b border-slate-100">Comissão</th>
                           <th className="py-3 px-4 border-b border-slate-100 w-[80px]"></th>
                        </>
                      ) : (
                        <>
                           <th className="py-3 px-4 text-[10px] font-black text-modern-secondary uppercase tracking-widest border-b border-slate-100">Source</th>
                           <th className="py-3 px-4 text-[10px] font-black text-modern-secondary uppercase tracking-widest border-b border-slate-100">Medium</th>
                           <th className="py-3 px-4 text-[10px] font-black text-modern-secondary uppercase tracking-widest border-b border-slate-100">Campaign</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedSalesForTable.length > 0 ? (
                      displayedSalesForTable.sort((a,b) => b.timestamp - a.timestamp).map(sale => {
                        const client = enrichedClients.find(c => c.key === sale.clientKey);
                        const lastLead = client?.leads[0];
                        return (
                          <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="py-3 px-4 text-xs font-bold text-modern-text border-b border-slate-100/65 font-mono">
                              {(() => {
                                const [year, month, day] = sale.date.split('-');
                                return `${day}/${month}/${year}`;
                              })()}
                            </td>
                            <td className="py-3 px-4 text-xs text-modern-text font-medium border-b border-slate-100/65 truncate max-w-[180px] flex items-center gap-1.5">
                              <span className={cn(
                                "inline-flex items-center text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0",
                                sale.saleType === 'payt' ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              )}>
                                {sale.saleType === 'payt' ? 'Payt' : 'PIX'}
                              </span>
                              <span className="truncate">{sale.productName}</span>
                            </td>
                            <td className="py-3 px-4 text-xs text-modern-text font-bold border-b border-slate-100/65 font-mono">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.value)}
                            </td>
                            <td className="py-3 px-4 text-xs text-modern-text font-semibold border-b border-slate-100/65 truncate max-w-[120px]">
                              {client?.nome || 'N/A'}
                            </td>
                            
                            {!dashShowUtms ? (
                              <>
                                <td className="py-3 px-4 text-xs font-black text-emerald-600 text-right border-b border-slate-100/65 font-mono font-bold">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.commission)}
                                </td>
                                <td className="py-3 px-4 border-b border-slate-100/65 text-right">
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => handleEditSale(sale)}
                                      className="p-1 px-2 text-slate-500 hover:text-emerald-500 transition-colors cursor-pointer"
                                      title="Editar"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteSale(sale.id)}
                                      className="p-1 px-2 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                                      title="Excluir"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-3 px-4 text-[10px] text-modern-secondary border-b border-slate-100/65 font-mono">{lastLead?.utm_source || '-'}</td>
                                <td className="py-3 px-4 text-[10px] text-modern-secondary border-b border-slate-100/65 font-mono">{lastLead?.utm_medium || '-'}</td>
                                <td className="py-3 px-4 text-[10px] text-modern-secondary border-b border-slate-100/65 font-mono">{lastLead?.utm_campaign || '-'}</td>
                              </>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={dashShowUtms ? 7 : 6} className="py-12 text-center text-xs font-bold text-modern-secondary uppercase tracking-widest whitespace-nowrap">
                          Nenhuma venda encontrada para os filtros atuais
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CONVERSÃO */}
          {activeDashSubTab === 'conversao' && (
            <div className="space-y-6">
              {/* Product filter header card */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-modern-text">Taxa de Conversão por Estado (Leads WhatsApp)</h3>
                  <p className="text-[10px] text-modern-secondary uppercase tracking-wider mt-0.5">Analise a eficiência de conversão por UF filtrando por produto específico</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-modern-secondary">Produto:</span>
                  <select
                    value={conversionProductFilter}
                    onChange={(e) => setConversionProductFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-modern-text focus:outline-none focus:ring-2 focus:ring-modern-primary/20 cursor-pointer"
                  >
                    <option value="all">Todos os Produtos ({uniqueProductsList.length})</option>
                    {uniqueProductsList.map(prod => (
                      <option key={prod} value={prod}>{prod}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* State Conversion Table */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-modern-text">Resultados por Estado</h3>
                    <p className="text-[10px] text-modern-secondary uppercase tracking-wider mt-0.5">Clique em qualquer estado para ver os leads contatados e vendas no período</p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {stateConversionAnalysis.length} estados analisados
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-modern-secondary tracking-wider">
                        <th className="py-2.5 px-3">Estado (UF)</th>
                        <th className="py-2.5 px-3 text-center">Leads Contatados (WhatsApp)</th>
                        <th className="py-2.5 px-3 text-center">Vendas Manuais</th>
                        <th className="py-2.5 px-3 text-right">Taxa de Conversão (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {stateConversionAnalysis.map((item, idx) => (
                        <tr 
                          key={item.stateName} 
                          onClick={() => setSelectedStateForModal(item.stateName)}
                          className="hover:bg-slate-100/90 transition-colors cursor-pointer group"
                          title={`Clique para ver leads e vendas de ${item.stateName}`}
                        >
                          <td className="py-3 px-3 font-bold text-modern-text flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[9px] font-black flex items-center justify-center shrink-0 group-hover:bg-modern-primary group-hover:text-white transition-colors">
                              {idx + 1}
                            </span>
                            <span className="underline decoration-slate-300 group-hover:decoration-modern-primary transition-all">
                              {item.stateName}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-700">{item.contactedLeads}</td>
                          <td className="py-3 px-3 text-center font-bold text-emerald-600">{item.salesCount}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={cn(
                              "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider",
                              item.conversionRate >= 10 ? "bg-emerald-100 text-emerald-800" :
                              item.conversionRate >= 5 ? "bg-blue-100 text-blue-800" :
                              "bg-slate-100 text-slate-700"
                            )}>
                              {item.conversionRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {stateConversionAnalysis.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400 italic text-xs">
                            Nenhum lead com tags de atendimento WhatsApp no período ou produto selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* State Details Modal */}
      <AnimatePresence>
        {selectedStateForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-modern-text">
                    Leads e Vendas — {selectedStateForModal}
                  </h3>
                  <p className="text-[11px] text-modern-secondary mt-0.5">
                    Lista de leads contatados e vendas manuais registradas neste estado no período. ({selectedStateClients.length} encontrados)
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStateForModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                {selectedStateClients.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStateClients.map(client => {
                      const tag = getClientTag ? getClientTag(client) : (clientTags[client.key] || '');
                      const clientSales = (client.manualSales || []).filter(s => isWithinDashFilter(s.timestamp || s.date));
                      return (
                        <div key={client.key} className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 hover:border-slate-300 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-modern-text">{client.nome || 'Cliente sem nome'}</h4>
                              <p className="text-[11px] text-modern-secondary font-mono">{client.telefone || 'Sem telefone'}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {tag && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                                  Tag: {tag}
                                </span>
                              )}
                              {clientSales.length > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                  {clientSales.length} Venda(s) — {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(clientSales.reduce((acc, s) => acc + s.value, 0))}
                                </span>
                              )}
                            </div>
                          </div>
                          {clientSales.length > 0 && (
                            <div className="pt-2 border-t border-slate-200/60 text-[11px] space-y-1">
                              <p className="text-[10px] font-black uppercase text-modern-secondary tracking-wider">Histórico de Vendas no Período:</p>
                              {clientSales.map(sale => (
                                <div key={sale.id} className="flex justify-between items-center bg-white px-3 py-1.5 rounded border border-slate-100 font-mono text-[11px]">
                                  <span className="font-bold text-slate-700">{sale.productName}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-400">{sale.date}</span>
                                    <span className="font-bold text-emerald-600">
                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.value)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 italic text-xs">
                    Nenhum lead ou venda manual encontrada para este estado no período selecionado.
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setSelectedStateForModal(null)}
                  className="bg-modern-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-modern-primary/90 transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
