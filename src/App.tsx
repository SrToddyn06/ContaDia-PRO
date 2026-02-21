import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, Calendar as CalendarIcon, Settings as SettingsIcon, 
  Plus, Minus, RotateCcw, TrendingUp, Download, Trash2, AlertCircle, 
  Coffee, Zap, ChevronRight, ChevronLeft, Clock, ShieldCheck, Users, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WorkLog, AppSettings, MOTIVATIONAL_PHRASES, JOKES, Employee } from './types';
import confetti from 'canvas-confetti';

// --- Shared Components ---

const NeonCard = ({ children, className = "", glowColor = "green" }: { children: React.ReactNode, className?: string, glowColor?: 'green' | 'blue' | 'pink' | 'yellow' }) => {
  const glowClasses = {
    green: "neon-glow-green border-neon-green/20",
    blue: "neon-glow-blue border-neon-blue/20",
    pink: "neon-glow-pink border-neon-pink/20",
    yellow: "neon-glow-yellow border-neon-yellow/20"
  };
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`bg-app-card rounded-3xl border ${glowClasses[glowColor]} p-6 ${className}`}>
      {children}
    </motion.div>
  );
};

const NeonButton = ({ children, onClick, variant = 'green', className = "", disabled = false }: any) => {
  const variants = {
    green: 'bg-neon-green/10 text-neon-green border-neon-green/50 hover:bg-neon-green hover:text-black',
    blue: 'bg-neon-blue/10 text-neon-blue border-neon-blue/50 hover:bg-neon-blue hover:text-black',
    pink: 'bg-neon-pink/10 text-neon-pink border-neon-pink/50 hover:bg-neon-pink hover:text-black',
    ghost: 'bg-transparent text-app-text/40 hover:text-app-text hover:bg-app-muted border-transparent'
  };
  const glow = { green: '0 0 20px rgba(0, 255, 157, 0.4)', blue: '0 0 20px rgba(0, 212, 255, 0.4)', pink: '0 0 20px rgba(255, 0, 122, 0.4)', ghost: 'none' };
  return (
    <motion.button whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.02, boxShadow: glow[variant as keyof typeof glow] }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={onClick} disabled={disabled}
      className={`px-6 py-4 rounded-2xl font-bold border transition-all flex items-center justify-center gap-3 disabled:opacity-30 ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </motion.button>
  );
};

const NumberTicker = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    let start = display;
    const end = value;
    if (start === end) return;
    const duration = 800;
    const startTime = performance.now();
    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(start + (end - start) * ease));
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [value]);
  return <span>{display.toLocaleString()}</span>;
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'settings' | 'admin'>('dashboard');
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [settings, setSettings] = useState<AppSettings>({
    half_day_value: 60, full_day_value: 120, show_jokes: true, show_tips: true,
    theme: 'dark', weekly_goal: 2000, monthly_goal: 8000, last_reset_date: new Date(0).toISOString()
  });
  const [phrase, setPhrase] = useState("");
  const [modals, setModals] = useState({ reset: false, factory: false });

  const fetchLogs = useCallback(() => {
    const savedLogs = localStorage.getItem('contadia_logs');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    else setLogs([]);

    const savedEmps = localStorage.getItem('contadia_employees');
    if (savedEmps) setEmployees(JSON.parse(savedEmps));
  }, []);

  const fetchSettings = useCallback(() => {
    const savedSettings = localStorage.getItem('contadia_settings');
    if (savedSettings) {
      const data = JSON.parse(savedSettings);
      setSettings(s => ({ ...s, ...data, 
        half_day_value: Number(data.half_day_value), 
        full_day_value: Number(data.full_day_value),
        show_jokes: data.show_jokes === true || data.show_jokes === 'true', 
        show_tips: data.show_tips === true || data.show_tips === 'true',
        weekly_goal: Number(data.weekly_goal), 
        monthly_goal: Number(data.monthly_goal)
      }));
    }
  }, []);

  useEffect(() => {
    fetchLogs(); fetchSettings();
    const pool = [...MOTIVATIONAL_PHRASES, ...(settings.show_jokes ? JOKES : [])];
    setPhrase(pool[Math.floor(Math.random() * pool.length)]);
  }, [fetchLogs, fetchSettings, settings.show_jokes]);

  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [settings.theme]);

  const saveLogsToLocal = (newLogs: WorkLog[]) => {
    localStorage.setItem('contadia_logs', JSON.stringify(newLogs));
    setLogs(newLogs);
  };

  const saveSettingsToLocal = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    localStorage.setItem('contadia_settings', JSON.stringify(updated));
    setSettings(updated);
  };

  const addLog = (type: 'half_day' | 'full_day') => {
    const value = type === 'full_day' ? settings.full_day_value : settings.half_day_value;
    const newLog: WorkLog = { id: Date.now(), date: new Date().toISOString(), type, value };
    const updatedLogs = [newLog, ...logs];
    saveLogsToLocal(updatedLogs);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: type === 'full_day' ? ['#00ff9d', '#00d4ff'] : ['#fcd34d', '#ff007a'] });
  };

  const importCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const newLogs: WorkLog[] = [];
      const startIdx = lines[0].toLowerCase().includes('data') || lines[0].toLowerCase().includes('funcionário') ? 1 : 0;
      
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/"/g, ''));
        if (parts.length < 3) continue;
        
        let dateStr, typeStr, valueStr;
        if (parts.length >= 6) {
          dateStr = parts[0] === settings.user_name ? parts[1] + ' ' + parts[2] : parts[1] + ' ' + parts[2]; // Simplified
          dateStr = parts[1] + ' ' + parts[2];
          typeStr = parts[4];
          valueStr = parts[5];
        } else {
          dateStr = parts[0] + ' ' + parts[1];
          typeStr = parts[3];
          valueStr = parts[4];
        }

        let date;
        try {
          if (dateStr.includes('/')) {
            const [dmy, hm] = dateStr.split(' ');
            const [d, m, y] = dmy.split('/');
            date = new Date(`${y}-${m}-${d}T${hm || '00:00'}:00`).toISOString();
          } else {
            date = new Date(dateStr).toISOString();
          }
        } catch (err) { continue; }

        const type = typeStr.toLowerCase().includes('inteiro') || typeStr.toLowerCase().includes('full') ? 'full_day' : 'half_day';
        const value = parseFloat(valueStr);
        if (!isNaN(value)) newLogs.push({ id: Math.random(), date, type, value });
      }
      if (newLogs.length > 0) {
        const updatedLogs = [...newLogs, ...logs];
        saveLogsToLocal(updatedLogs);
        alert(`${newLogs.length} registros importados!`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const stats = useMemo(() => {
    const resetDate = parseISO(settings.last_reset_date);
    const active = logs.filter(l => parseISO(l.date) >= resetDate);
    const now = new Date();
    const getEarned = (start: Date) => active.filter(l => parseISO(l.date) >= start).reduce((a, c) => a + (Number(c.value) || 0), 0);
    
    const weekStart = new Date(); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); monthStart.setHours(0,0,0,0);
    const yearStart = new Date(now.getFullYear(), 0, 1); yearStart.setHours(0,0,0,0);

    const wEarned = getEarned(weekStart);
    const mEarned = getEarned(monthStart);
    
    return {
      total: active.reduce((a, c) => a + (Number(c.value) || 0), 0),
      days: active.length,
      fullDays: active.filter(l => l.type === 'full_day').length,
      halfDays: active.filter(l => l.type === 'half_day').length,
      weekly: wEarned,
      monthly: mEarned,
      yearly: getEarned(yearStart),
      wProgress: Math.min((wEarned / settings.weekly_goal) * 100, 100),
      mProgress: Math.min((mEarned / settings.monthly_goal) * 100, 100)
    };
  }, [logs, settings]);

  const exportCSV = (range: 'all' | 'month' | 'day' = 'all') => {
    let filteredLogs = [...logs];
    let filename = `contadia_total_${format(new Date(), 'yyyy-MM-dd')}`;

    if (range === 'month') {
      filteredLogs = logs.filter(l => isSameMonth(parseISO(l.date), currentMonth));
      filename = `contadia_${format(currentMonth, 'MMMM_yyyy', { locale: ptBR })}`;
    } else if (range === 'day' && selectedDate) {
      filteredLogs = logs.filter(l => isSameDay(parseISO(l.date), selectedDate));
      filename = `contadia_${format(selectedDate, 'dd_MM_yyyy')}`;
    }

    if (filteredLogs.length === 0) {
      alert('Nenhum dado encontrado para o período selecionado.');
      return;
    }

    const headers = ['Funcionário', 'Data', 'Hora', 'Dia da Semana', 'Tipo', 'Valor (R$)', 'Mês', 'Ano'];
    const rows = filteredLogs.map(l => {
      const d = parseISO(l.date);
      return [
        settings.user_name || 'Funcionário',
        format(d, 'dd/MM/yyyy'),
        format(d, 'HH:mm'),
        format(d, 'EEEE', { locale: ptBR }),
        l.type === 'full_day' ? 'Dia Inteiro' : 'Meio Dia',
        l.value.toFixed(2),
        format(d, 'MMMM', { locale: ptBR }),
        format(d, 'yyyy')
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importAdminCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const startIdx = lines[0].toLowerCase().includes('nome') || lines[0].toLowerCase().includes('funcionario') ? 1 : 0;
      
      const empMap: Record<string, Employee> = {};
      
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/"/g, ''));
        if (parts.length < 3) continue;
        
        // Expected format: Funcionário, Data, Hora, ...
        // Or if it's the old format: Data, Hora, ...
        let name, dateStr, typeStr, valueStr;

        if (parts.length >= 6) {
          // New format with name
          name = parts[0];
          dateStr = parts[1] + ' ' + parts[2];
          typeStr = parts[4];
          valueStr = parts[5];
        } else {
          // Fallback/Old format
          name = "Desconhecido";
          dateStr = parts[0] + ' ' + parts[1];
          typeStr = parts[3];
          valueStr = parts[4];
        }

        let date;
        try {
          if (dateStr.includes('/')) {
            const [dmy, hm] = dateStr.split(' ');
            const [d, m, y] = dmy.split('/');
            date = new Date(`${y}-${m}-${d}T${hm || '00:00'}:00`).toISOString();
          } else {
            date = new Date(dateStr).toISOString();
          }
        } catch (err) { continue; }

        const type = typeStr.toLowerCase().includes('inteiro') ? 'full_day' : 'half_day';
        const value = Number(parseFloat(valueStr) || (type === 'full_day' ? settings.full_day_value : settings.half_day_value));

        if (!empMap[name]) {
          empMap[name] = { id: Math.random(), name, total_to_pay: 0, logs: [] };
        }
        empMap[name].logs.push({ id: Math.random(), date, type, value });
        empMap[name].total_to_pay += value;
      }
      const newEmployees = Object.values(empMap);
      setEmployees(newEmployees);
      localStorage.setItem('contadia_employees', JSON.stringify(newEmployees));
      alert(`${newEmployees.length} funcionários processados!`);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text font-sans">
      <div className="max-w-md mx-auto pb-32 pt-12 px-6">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tighter neon-text-green italic">CONTADIA PRO</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-[10px] font-mono text-app-text/40 uppercase tracking-[0.3em]">Sistema Ativo</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl border border-neon-green/30 flex items-center justify-center bg-neon-green/5 neon-glow-green"><Zap className="w-6 h-6 text-neon-green" /></div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="db" initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }} className="space-y-8">
              <div className="grid grid-cols-1 gap-4">
                <NeonCard glowColor="green" className="relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-neon-green/10 rounded-full blur-3xl" />
                  <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest mb-1">Balanço Total</p>
                  <h2 className="text-5xl font-black tracking-tighter">R$ <NumberTicker value={stats.total} /></h2>
                </NeonCard>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <NeonCard glowColor="blue" className="flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest mb-1">Diárias</p>
                    <p className="text-3xl font-black">{stats.fullDays}</p>
                  </NeonCard>
                  <NeonCard glowColor="yellow" className="flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest mb-1">Meias</p>
                    <p className="text-3xl font-black">{stats.halfDays}</p>
                  </NeonCard>
                  <NeonCard glowColor="pink" className="flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest mb-1">Meta Sem.</p>
                    <p className="text-3xl font-black">{stats.wProgress.toFixed(0)}%</p>
                  </NeonCard>
                </div>
              </div>

              <div className="space-y-6">
                {[ { label: 'Semanal', val: stats.weekly, goal: settings.weekly_goal, prog: stats.wProgress, color: 'green' },
                   { label: 'Mensal', val: stats.monthly, goal: settings.monthly_goal, prog: stats.mProgress, color: 'blue' }
                ].map((p, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end"><span className="text-[10px] font-bold text-app-text/40 uppercase">Progresso {p.label}</span><span className={`text-xs font-mono text-neon-${p.color}`}>R$ {p.val} / {p.goal}</span></div>
                    <div className="w-full h-2 bg-app-muted rounded-full overflow-hidden border border-app-border">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${p.prog}%` }} transition={{ type: 'spring', stiffness: 50, damping: 20 }} className={`h-full bg-gradient-to-r from-neon-${p.color} to-neon-blue neon-glow-${p.color} relative`}>
                        <motion.div animate={{ x: ['-100%', '200%'], opacity: [0, 0.3, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 w-20 bg-app-text/30 skew-x-12" />
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4">
                <NeonButton onClick={() => addLog('full_day')} variant="green" className="h-24 text-xl group"><Plus className="w-6 h-6 group-hover:rotate-180 transition-transform" /> Dia Inteiro</NeonButton>
                <NeonButton onClick={() => addLog('half_day')} variant="blue" className="h-20 text-lg group"><Minus className="w-6 h-6 group-hover:-translate-x-1 transition-transform" /> Meio Dia</NeonButton>
              </div>
              <p className="text-center py-6 px-4 text-sm text-app-text/40 italic">"{phrase}"</p>
              <NeonButton onClick={() => setModals(m => ({ ...m, reset: true }))} variant="pink" className="w-full h-16 text-sm uppercase tracking-widest"><RotateCcw className="w-5 h-5" /> Zerar Balanço</NeonButton>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div key="cal" initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }} className="space-y-6">
              <h2 className="text-[10px] font-bold text-app-text/40 uppercase tracking-[0.3em]">Calendário de Atividades</h2>
              <div className="grid grid-cols-3 gap-3">
                {[ { l: 'Semanal', v: stats.weekly, c: 'green' }, { l: 'Mensal', v: stats.monthly, c: 'blue' }, { l: 'Anual', v: stats.yearly, c: 'pink' } ].map((s, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-app-muted border border-app-border"><p className="text-[8px] font-bold text-app-text/30 uppercase mb-1">{s.l}</p><p className={`text-sm font-bold text-neon-${s.c}`}>R$ {s.v}</p></div>
                ))}
              </div>

              <div className="bg-app-card border border-app-border rounded-[2rem] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold uppercase text-app-text/60">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl bg-app-muted border border-app-border"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl bg-app-muted border border-app-border"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                  <div className="grid grid-cols-7 gap-1 mb-2">{['D','S','T','Q','Q','S','S'].map((d, i) => <div key={i} className="text-center text-[10px] font-bold text-app-text/20">{d}</div>)}</div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const start = startOfWeek(startOfMonth(currentMonth));
                    const days = eachDayOfInterval({ start, end: endOfWeek(endOfMonth(currentMonth)) });
                    return days.map((d, i) => {
                      const dLogs = logs.filter(l => isSameDay(parseISO(l.date), d));
                      const sel = selectedDate && isSameDay(d, selectedDate);
                      return (
                        <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={() => setSelectedDate(d)}
                          className={`relative h-10 flex flex-col items-center justify-center rounded-xl text-xs font-bold ${!isSameMonth(d, currentMonth) ? 'text-app-text/10' : 'text-app-text/60'} ${sel ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'hover:bg-app-muted'} ${dLogs.length > 0 && !sel ? 'text-neon-green' : ''}`}>
                          {format(d, 'd')}
                          {dLogs.length > 0 && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${sel ? 'bg-neon-green' : 'bg-neon-green/50 neon-glow-green'}`} />}
                        </motion.button>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-app-text/40 uppercase">{selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}</h3>
                <div className="space-y-3">
                  {(() => {
                    const dLogs = selectedDate ? logs.filter(l => isSameDay(parseISO(l.date), selectedDate)) : [];
                    return dLogs.length ? dLogs.map((l, i) => (
                      <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-5 rounded-2xl bg-app-muted border border-app-border">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${l.type === 'full_day' ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-blue/10 text-neon-blue'}`}>{l.type === 'full_day' ? <Zap className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}</div>
                          <div><div className="flex items-center gap-2"><p className="text-sm font-bold">{l.type === 'full_day' ? 'Dia Inteiro' : 'Meio Dia'}</p><div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-app-muted"><Clock className="w-2.5 h-2.5 text-app-text/40" /><span className="text-[9px] font-mono text-app-text/60">{format(parseISO(l.date), 'HH:mm')}</span></div></div><p className="text-[10px] text-app-text/30 uppercase">Verificado</p></div>
                        </div>
                        <div className="text-right"><p className="text-lg font-black">R$ {l.value}</p><p className="text-[8px] font-bold text-neon-green uppercase">Pago</p></div>
                      </motion.div>
                    )) : <div className="py-12 text-center border border-dashed border-app-border rounded-3xl text-app-text/20 italic text-sm">Nenhum pagamento nesta data.</div>;
                  })()}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="set" initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }} className="space-y-8">
              <h2 className="text-[10px] font-bold text-app-text/40 uppercase tracking-[0.3em]">Ajustes do Sistema</h2>
              <div className="space-y-6">
                <div className="space-y-4"><p className="text-[10px] font-bold text-app-text/40 uppercase">Valores de Turno</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[ { l: 'Meio Dia', k: 'half_day_value', c: 'blue' }, { l: 'Dia Inteiro', k: 'full_day_value', c: 'green' } ].map((f, i) => (
                      <div key={i} className="space-y-2"><span className="text-[10px] text-app-text/30 uppercase">{f.l}</span><motion.input whileFocus={{ scale: 1.02 }} type="number" value={settings[f.k as keyof AppSettings] as any} onChange={(e) => saveSettingsToLocal({ [f.k]: Number(e.target.value) })} className={`w-full p-4 rounded-2xl bg-app-muted border border-app-border focus:border-neon-${f.c} outline-none font-mono font-bold text-neon-${f.c}`} /></div>
                    ))}
                  </div>
                </div>
                {[ { l: 'Meta Semanal', k: 'weekly_goal', c: 'pink' }, { l: 'Meta Mensal', k: 'monthly_goal', c: 'blue' } ].map((f, i) => (
                  <div key={i} className="space-y-2"><p className="text-[10px] font-bold text-app-text/40 uppercase">{f.l} (R$)</p><motion.input whileFocus={{ scale: 1.01 }} type="number" value={settings[f.k as keyof AppSettings] as any} onChange={(e) => saveSettingsToLocal({ [f.k]: Number(e.target.value) })} className={`w-full p-4 rounded-2xl bg-app-muted border border-app-border focus:border-neon-${f.c} outline-none font-mono font-bold text-neon-${f.c} text-2xl`} /></div>
                ))}
                <div className="space-y-4 pt-4 border-t border-app-border">
                  <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest">Tema da Interface</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => saveSettingsToLocal({ theme: 'dark' })}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${settings.theme === 'dark' ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'bg-app-muted border-app-border text-app-text/40'}`}
                    >
                      <Zap className="w-4 h-4" /> Escuro
                    </button>
                    <button 
                      onClick={() => saveSettingsToLocal({ theme: 'light' })}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${settings.theme === 'light' ? 'bg-neon-yellow/10 border-neon-yellow text-neon-yellow' : 'bg-app-muted border-app-border text-app-text/40'}`}
                    >
                      <Coffee className="w-4 h-4" /> Claro
                    </button>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-app-border">
                  {[ { l: 'Ativar Piadas', k: 'show_jokes', i: Coffee, c: 'blue' }, { l: 'Dicas de Produtividade', k: 'show_tips', i: TrendingUp, c: 'green' } ].map((t, i) => (
                    <label key={i} className="flex items-center justify-between p-4 rounded-2xl bg-app-muted border border-transparent hover:border-app-border cursor-pointer group">
                      <div className="flex items-center gap-3"><t.i className={`w-4 h-4 text-app-text/30 group-hover:text-neon-${t.c}`} /><span className="text-sm font-medium">{t.l}</span></div>
                      <input type="checkbox" checked={settings[t.k as keyof AppSettings] as any} onChange={(e) => saveSettingsToLocal({ [t.k]: e.target.checked })} className={`w-10 h-5 rounded-full bg-app-muted appearance-none checked:bg-neon-${t.c} transition-all relative before:content-[''] before:absolute before:w-3 before:h-3 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:left-6`} />
                    </label>
                  ))}
                </div>
              </div>
              <section className="pt-12 border-t border-app-border space-y-6">
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest">Identificação no CSV</p>
                  <div className="space-y-2">
                    <span className="text-[10px] text-app-text/30 uppercase">Seu Nome Completo</span>
                    <motion.input 
                      whileFocus={{ scale: 1.01 }} 
                      type="text" 
                      placeholder="Ex: João Silva"
                      value={settings.user_name || ''} 
                      onChange={(e) => saveSettingsToLocal({ user_name: e.target.value })} 
                      className="w-full p-4 rounded-2xl bg-app-muted border border-app-border focus:border-neon-blue outline-none font-bold text-app-text" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest">Exportar Dados (CSV)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => exportCSV('day')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-app-muted border border-app-border hover:border-neon-green/30 transition-all group">
                      <Clock className="w-4 h-4 text-app-text/30 group-hover:text-neon-green" />
                      <span className="text-[8px] font-bold uppercase">Dia Sel.</span>
                    </button>
                    <button onClick={() => exportCSV('month')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-app-muted border border-app-border hover:border-neon-blue/30 transition-all group">
                      <CalendarIcon className="w-4 h-4 text-app-text/30 group-hover:text-neon-blue" />
                      <span className="text-[8px] font-bold uppercase">Mês Atual</span>
                    </button>
                    <button onClick={() => exportCSV('all')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-app-muted border border-app-border hover:border-neon-pink/30 transition-all group">
                      <Download className="w-4 h-4 text-app-text/30 group-hover:text-neon-pink" />
                      <span className="text-[8px] font-bold uppercase">Tudo</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input type="file" accept=".csv" onChange={importCSV} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <NeonButton variant="ghost" className="w-full text-[10px] uppercase pointer-events-none">
                    <Plus className="w-4 h-4" /> Importar CSV
                  </NeonButton>
                </div>

                <NeonButton onClick={() => setModals(m => ({ ...m, factory: true }))} variant="pink" className="w-full h-16 text-sm uppercase border-rose-500/50 text-rose-500">
                  <Trash2 className="w-5 h-5" /> Reset de Fábrica
                </NeonButton>
              </section>
            </motion.div>
          )}

          {activeTab === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }} className="space-y-8">
              {!isAdminAuthenticated ? (
                <div className="space-y-6 py-12">
                  <div className="text-center space-y-2">
                    <ShieldCheck className="w-12 h-12 text-neon-pink mx-auto mb-4" />
                    <h2 className="text-2xl font-black tracking-tighter">Acesso Restrito</h2>
                    <p className="text-app-text/40 text-sm">Digite a senha mestra para acessar o painel administrativo.</p>
                  </div>
                  <div className="space-y-4">
                    <input 
                      type="password" 
                      placeholder="Senha do Administrador"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full p-4 rounded-2xl bg-app-muted border border-app-border focus:border-neon-pink outline-none text-center font-bold tracking-widest"
                    />
                    <NeonButton onClick={() => adminPassword === 'admin' ? setIsAdminAuthenticated(true) : alert('Senha Incorreta')} variant="pink" className="w-full">
                      Autenticar
                    </NeonButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-bold text-app-text/40 uppercase tracking-[0.3em]">Painel do Empregador</h2>
                    <button onClick={() => setIsAdminAuthenticated(false)} className="text-[8px] font-bold text-neon-pink uppercase tracking-widest">Sair</button>
                  </div>

                  <NeonCard glowColor="pink" className="relative overflow-hidden">
                    <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest mb-1">Total Geral a Pagar</p>
                    <h2 className="text-4xl font-black tracking-tighter text-neon-pink">
                      R$ <NumberTicker value={employees.reduce((a, c) => a + c.total_to_pay, 0)} />
                    </h2>
                  </NeonCard>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest">Folha de Pagamento</p>
                      <div className="relative">
                        <input type="file" accept=".csv" onChange={importAdminCSV} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-pink/10 border border-neon-pink/30 text-neon-pink text-[10px] font-bold uppercase tracking-widest">
                          <FileText className="w-3 h-3" /> Importar Funcionários
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {employees.length > 0 ? employees.map((emp) => (
                        <motion.div key={emp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-app-muted border border-app-border space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-neon-pink/10 flex items-center justify-center text-neon-pink">
                                <Users className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold tracking-tight">{emp.name}</p>
                                <p className="text-[10px] text-app-text/30 uppercase">{emp.logs.length} Turnos Registrados</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-neon-pink">R$ {emp.total_to_pay.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-app-border space-y-2">
                            {emp.logs.slice(0, 3).map((l, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[10px] text-app-text/40">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  <span>{format(parseISO(l.date), 'dd/MM HH:mm')}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-app-muted border border-app-border">{l.type === 'full_day' ? 'Integral' : 'Meio'}</span>
                                </div>
                                <span className="font-mono">R$ {l.value}</span>
                              </div>
                            ))}
                            {emp.logs.length > 3 && <p className="text-[8px] text-center text-app-text/20 uppercase tracking-widest pt-1">+ {emp.logs.length - 3} outros registros</p>}
                          </div>
                        </motion.div>
                      )) : (
                        <div className="py-12 text-center border border-dashed border-app-border rounded-3xl">
                          <Users className="w-8 h-8 text-app-text/10 mx-auto mb-3" />
                          <p className="text-app-text/20 italic text-sm">Nenhum funcionário importado.</p>
                          <p className="text-[8px] text-app-text/10 uppercase mt-2">Importe um CSV com: Nome, Data, Tipo, Valor</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm glass-nav rounded-3xl p-2 flex items-center justify-between shadow-2xl z-50 border border-app-border">
          {[ 
            { id: 'dashboard', l: 'Início', i: LayoutDashboard, c: 'neon-green' }, 
            { id: 'calendar', l: 'Calendário', i: CalendarIcon, c: 'neon-blue' }, 
            { id: 'admin', l: 'Admin', i: ShieldCheck, c: 'neon-pink' },
            { id: 'settings', l: 'Ajustes', i: SettingsIcon, c: 'neon-pink' } 
          ].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className="relative flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl z-10">
              {activeTab === t.id && <motion.div layoutId="activeTab" className={`absolute inset-0 bg-${t.c}/10 rounded-2xl -z-10`} transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}
              <t.i className={`w-5 h-5 ${activeTab === t.id ? `text-${t.c}` : 'text-app-text/30'}`} />
              <span className={`text-[8px] font-black uppercase tracking-widest ${activeTab === t.id ? `text-${t.c}` : 'text-app-text/30'}`}>{t.l}</span>
            </button>
          ))}
        </nav>

        <AnimatePresence>
          {modals.reset && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-app-bg/90 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-app-card border border-neon-pink/30 rounded-[2.5rem] p-10 max-w-sm w-full text-center neon-glow-pink">
                <div className="w-16 h-16 bg-neon-pink/10 rounded-full flex items-center justify-center mx-auto mb-6"><RotateCcw className="w-8 h-8 text-neon-pink" /></div>
                <h3 className="text-2xl font-black mb-2">Zerar Balanço?</h3>
                <p className="text-app-text/40 text-sm mb-8">Isso zerará o seu saldo e progressos no painel inicial. O histórico no calendário será mantido.</p>
                <div className="flex flex-col gap-3">
                  <button onClick={resetBalance} className="w-full py-4 rounded-2xl bg-neon-pink text-white font-bold">Confirmar Reset</button>
                  <button onClick={() => setModals(m => ({ ...m, reset: false }))} className="w-full py-4 rounded-2xl bg-app-muted text-app-text/60 font-bold">Cancelar</button>
                </div>
              </motion.div>
            </div>
          )}
          {modals.factory && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-app-bg/90 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-app-card border border-rose-500/30 rounded-[2.5rem] p-10 max-w-sm w-full text-center neon-glow-pink">
                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle className="w-8 h-8 text-rose-500" /></div>
                <h3 className="text-2xl font-black mb-2">Reset de Fábrica?</h3>
                <p className="text-app-text/40 text-sm mb-8">CUIDADO: Isso apagará TUDO (ganhos e configurações) e voltará aos padrões originais.</p>
                <div className="flex flex-col gap-3">
                  <button onClick={factoryReset} className="w-full py-4 rounded-2xl bg-rose-500 text-white font-bold shadow-[0_0_20px_rgba(244,63,94,0.4)]">WIPE TOTAL</button>
                  <button onClick={() => setModals(m => ({ ...m, factory: false }))} className="w-full py-4 rounded-2xl bg-app-muted text-app-text/60 font-bold">Cancelar</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
