import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, Calendar as CalendarIcon, Settings as SettingsIcon, 
  Plus, Minus, RotateCcw, TrendingUp, Download, Trash2, AlertCircle, 
  Coffee, Zap, ChevronRight, ChevronLeft, Clock, ShieldCheck, 
  Wallet, DollarSign, PieChart, Info, Filter, ArrowUpRight, ArrowDownRight,
  Utensils, Car, Gamepad2, Home, Lightbulb, HeartPulse, Hammer, Shirt, Package, FileText, MoreHorizontal, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO,
  isAfter, isBefore, subDays, startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WorkLog, AppSettings, MOTIVATIONAL_PHRASES, JOKES, Expense, FixedExpense } from './types';
import confetti from 'canvas-confetti';
import { 
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';

const APP_VERSION = "0.2.3";

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
    green: 'bg-neon-green/10 text-neon-green border-neon-green/30 hover:bg-neon-green hover:text-black dark:hover:text-black',
    blue: 'bg-neon-blue/10 text-neon-blue border-neon-blue/30 hover:bg-neon-blue hover:text-black dark:hover:text-black',
    pink: 'bg-neon-pink/10 text-neon-pink border-neon-pink/30 hover:bg-neon-pink hover:text-black dark:hover:text-black',
    ghost: 'bg-transparent text-app-text/40 hover:text-app-text hover:bg-app-muted border-transparent'
  };
  
  return (
    <motion.button whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={onClick} disabled={disabled}
      className={`px-6 py-4 rounded-2xl font-bold border transition-all flex items-center justify-center gap-3 disabled:opacity-30 neon-button-${variant} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </motion.button>
  );
};

const NumberTicker = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const safeValue = isNaN(value) ? 0 : value;
    let start = display;
    const end = safeValue;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'expenses' | 'settings'>('dashboard');
  const [exitAttempts, setExitAttempts] = useState(0);
  const [exitToast, setExitToast] = useState(false);
  const [expenseSubTab, setExpenseSubTab] = useState<'overview' | 'fixed'>('overview');
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([
    { id: 1, label: 'Aluguel', value: 0, isActive: false },
    { id: 2, label: 'Água', value: 0, isActive: false },
    { id: 3, label: 'Energia', value: 0, isActive: false },
    { id: 4, label: 'Internet', value: 0, isActive: false },
    { id: 5, label: 'Salário', value: 0, isActive: false },
    { id: 6, label: 'Contador', value: 0, isActive: false },
    { id: 7, label: 'Transporte', value: 0, isActive: false },
    { id: 8, label: 'Alimentação fixo', value: 0, isActive: false },
    { id: 9, label: 'Material/Insumos', value: 0, isActive: false },
    { id: 10, label: 'Marketing/Ads', value: 0, isActive: false },
    { id: 11, label: 'Seguro/Plano', value: 0, isActive: false },
    { id: 12, label: 'Taxas/MEI', value: 0, isActive: false },
    { id: 13, label: 'Manutenção', value: 0, isActive: false },
    { id: 14, label: 'Outros', value: 0, isActive: false }
  ]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [settings, setSettings] = useState<AppSettings>({
    half_day_value: 60, full_day_value: 120, show_jokes: true, show_tips: true,
    theme: 'dark', weekly_goal: 2000, monthly_goal: 8000, last_reset_date: new Date(0).toISOString()
  });
  const [phrase, setPhrase] = useState({ text: "", type: 'motivation' as 'motivation' | 'joke' });
  const [modals, setModals] = useState({ reset: false, addExpense: false, addFixed: false });
  const [newFixedLabel, setNewFixedLabel] = useState("");
  const [undo, setUndo] = useState<{ label: string; revert: () => void; id: number } | null>(null);
  const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseFilter, setExpenseFilter] = useState<'today' | '7days' | '30days' | 'month' | 'all'>('month');
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    value: 0,
    category: 'Alimentação',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Pix',
    isBusiness: false
  });

  const fetchLogs = useCallback(() => {
    try {
      const savedLogs = localStorage.getItem('contadia_logs');
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        setLogs(Array.isArray(parsed) ? parsed : []);
      } else {
        setLogs([]);
      }

      const savedExpenses = localStorage.getItem('contadia_expenses');
      if (savedExpenses) {
        const parsed = JSON.parse(savedExpenses);
        setExpenses(Array.isArray(parsed) ? parsed : []);
      } else {
        setExpenses([]);
      }

      const savedFixed = localStorage.getItem('contadia_fixed_expenses');
      if (savedFixed) {
        const parsed = JSON.parse(savedFixed);
        setFixedExpenses(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error("Local Storage Error (Logs/Expenses):", e);
      setLogs([]);
      setExpenses([]);
    }
  }, []);

  const fetchSettings = useCallback(() => {
    try {
      const savedSettings = localStorage.getItem('contadia_settings');
      if (savedSettings) {
        const data = JSON.parse(savedSettings);
        
        // Auto-cleanup: Check if month changed
        const lastResetStr = data.last_reset_date || new Date(0).toISOString();
        const lastReset = parseISO(lastResetStr);
        const now = new Date();
        
        const sanitizeNumber = (val: any, fallback: number) => {
          const num = Number(val);
          return isNaN(num) ? fallback : num;
        };

        if (!isSameMonth(lastReset, now) && lastReset.getTime() > 0) {
          // Log historic fixed expenses before resetting month
          const savedExpenses = localStorage.getItem('contadia_expenses');
          const currentExpenses: Expense[] = savedExpenses ? JSON.parse(savedExpenses) : [];
          const savedFixed = localStorage.getItem('contadia_fixed_expenses');
          const currentFixed: FixedExpense[] = savedFixed ? JSON.parse(savedFixed) : [];
          
          const lastDayOfPrevMonth = format(endOfMonth(lastReset), 'yyyy-MM-dd');
          const injections: Expense[] = currentFixed
            .filter(f => f.isActive && f.value > 0)
            .map(f => ({
              id: Date.now() + Math.random(),
              value: f.value,
              category: 'Fixos (Auto)',
              description: `Mensalidade: ${f.label}`,
              date: lastDayOfPrevMonth,
              paymentMethod: 'Pix',
              isBusiness: true
            }));
          
          if (injections.length > 0) {
            const updatedExpenses = [...injections, ...currentExpenses];
            localStorage.setItem('contadia_expenses', JSON.stringify(updatedExpenses));
            setExpenses(updatedExpenses);
          }

          const newResetStr = startOfMonth(now).toISOString();
          const updatedSettings = { ...data, last_reset_date: newResetStr };
          localStorage.setItem('contadia_settings', JSON.stringify(updatedSettings));
          setSettings(s => ({ ...s, ...updatedSettings,
            half_day_value: sanitizeNumber(updatedSettings.half_day_value, 60), 
            full_day_value: sanitizeNumber(updatedSettings.full_day_value, 120),
            show_jokes: updatedSettings.show_jokes === true || updatedSettings.show_jokes === 'true', 
            show_tips: updatedSettings.show_tips === true || updatedSettings.show_tips === 'true',
            weekly_goal: sanitizeNumber(updatedSettings.weekly_goal, 2000), 
            monthly_goal: sanitizeNumber(updatedSettings.monthly_goal, 8000)
          }));
        } else {
          setSettings(s => ({ ...s, ...data, 
            half_day_value: sanitizeNumber(data.half_day_value, 60), 
            full_day_value: sanitizeNumber(data.full_day_value, 120),
            show_jokes: data.show_jokes === true || data.show_jokes === 'true', 
            show_tips: data.show_tips === true || data.show_tips === 'true',
            weekly_goal: sanitizeNumber(data.weekly_goal, 2000), 
            monthly_goal: sanitizeNumber(data.monthly_goal, 8000)
          }));
        }
      }
    } catch (e) {
      console.error("Local Storage Error (Settings):", e);
    }
  }, []);

  const addFixedExpense = () => {
    if (!newFixedLabel.trim()) return;
    const newFixed: FixedExpense = {
      id: Date.now(),
      label: newFixedLabel,
      value: 0,
      isActive: true
    };
    const updated = [...fixedExpenses, newFixed];
    saveFixedExpensesToLocal(updated);
    setNewFixedLabel("");
    setModals(prev => ({ ...prev, addFixed: false }));
  };

  const removeFixedExpense = (id: number) => {
    const updated = fixedExpenses.filter(f => f.id !== id);
    saveFixedExpensesToLocal(updated);
  };

  useEffect(() => {
    // Initial history state to intercept the first 'back'
    window.history.replaceState({ tab: 'dashboard' }, '');

    const handleBackBtn = (e: PopStateEvent) => {
      // If any modal is open, close them first
      if (modals.reset || modals.addExpense) {
        setModals({ reset: false, addExpense: false });
        // Restore history so it doesn't navigate back a tab yet
        window.history.pushState({ tab: activeTab }, '');
        return;
      }

      if (e.state && e.state.tab && e.state.tab !== activeTab) {
        setActiveTab(e.state.tab);
        setExitAttempts(0);
      } else if (activeTab === 'dashboard') {
        // Double tap to exit logic
        setExitAttempts(prev => prev + 1);
        setExitToast(true);
        window.history.pushState({ tab: 'dashboard' }, ''); // Keep inside app
        
        setTimeout(() => {
          setExitAttempts(0);
          setExitToast(false);
        }, 2000);
      } else {
        setActiveTab('dashboard');
        setExitAttempts(0);
        window.history.replaceState({ tab: 'dashboard' }, '');
      }
    };

    window.addEventListener('popstate', handleBackBtn);
    return () => window.removeEventListener('popstate', handleBackBtn);
  }, [activeTab, modals]);

  const handleTabChange = (tab: typeof activeTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    window.history.pushState({ tab }, '');
    setExitAttempts(0);
  };

  useEffect(() => {
    fetchLogs(); 
    fetchSettings();
  }, []); // Strictly once on mount

  useEffect(() => {
    const pooled = [
      ...MOTIVATIONAL_PHRASES.map(t => ({ text: t, type: 'motivation' as const })),
      ...(settings.show_jokes ? JOKES.map(t => ({ text: t, type: 'joke' as const })) : [])
    ];
    if (pooled.length > 0) {
      setPhrase(pooled[Math.floor(Math.random() * pooled.length)]);
    }
  }, [settings.show_jokes]);

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

  const saveExpensesToLocal = (newExpenses: Expense[]) => {
    localStorage.setItem('contadia_expenses', JSON.stringify(newExpenses));
    setExpenses(newExpenses);
  };

  const saveFixedExpensesToLocal = (newFixed: FixedExpense[]) => {
    localStorage.setItem('contadia_fixed_expenses', JSON.stringify(newFixed));
    setFixedExpenses(newFixed);
  };

  const saveSettingsToLocal = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    localStorage.setItem('contadia_settings', JSON.stringify(updated));
    setSettings(updated);
  };

  const triggerUndo = (label: string, revert: () => void) => {
    const id = Date.now();
    setUndo({ label, revert, id });
    setTimeout(() => {
      setUndo(current => current?.id === id ? null : current);
    }, 5000);
  };

  const addLog = (type: 'half_day' | 'full_day') => {
    const value = type === 'full_day' ? settings.full_day_value : settings.half_day_value;
    const newLog: WorkLog = { id: Date.now(), date: new Date().toISOString(), type, value };
    const previousLogs = [...logs];
    const updatedLogs = [newLog, ...logs];
    saveLogsToLocal(updatedLogs);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: type === 'full_day' ? ['#00ff9d', '#00d4ff'] : ['#fcd34d', '#ff007a'] });
    triggerUndo(`Lançamento de ${type === 'full_day' ? 'Dia Inteiro' : 'Meio Dia'}`, () => saveLogsToLocal(previousLogs));
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

  const resetBalance = () => {
    const previousResetDate = settings.last_reset_date;
    const now = new Date().toISOString();
    saveSettingsToLocal({ last_reset_date: now });
    setModals(m => ({ ...m, reset: false }));
    triggerUndo('Balanço Zerado', () => saveSettingsToLocal({ last_reset_date: previousResetDate }));
  };

  const stats = useMemo(() => {
    const resetDate = parseISO(settings.last_reset_date);
    const active = logs.filter(l => {
      try {
        return parseISO(l.date) >= resetDate;
      } catch { return false; }
    });
    const now = new Date();
    const getEarned = (start: Date) => active.filter(l => parseISO(l.date) >= start).reduce((a, c) => a + (Number(c.value) || 0), 0);
    
    const weekStart = new Date(); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); monthStart.setHours(0,0,0,0);
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const yearStart = new Date(now.getFullYear(), 0, 1); yearStart.setHours(0,0,0,0);

    const dEarned = getEarned(todayStart);
    const wEarned = getEarned(weekStart);
    const mEarned = getEarned(monthStart);
    
    return {
      total: Math.round(active.reduce((a, c) => a + (Number(c.value) || 0), 0) * 100) / 100,
      daily: dEarned,
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
    } else if (range === 'day') {
      const d = parseISO(exportDate);
      filteredLogs = logs.filter(l => isSameDay(parseISO(l.date), d));
      filename = `contadia_${format(d, 'dd_MM_yyyy')}`;
    }

    if (filteredLogs.length === 0) {
      alert('Nenhum dado encontrado para o período selecionado.');
      return;
    }

    const headers = ['Tipo', 'Data', 'Valor (R$)', 'Detalhe', 'Método', 'Negócio?'];
    
    const logRows = filteredLogs.map(l => {
      const d = parseISO(l.date);
      return [
        'Entrada',
        format(d, 'dd/MM/yyyy HH:mm'),
        l.value.toFixed(2),
        l.type === 'full_day' ? 'Dia Inteiro' : 'Meio Dia',
        'Pix',
        'Sim'
      ];
    });

    const expenseRows = expenses
      .filter(e => {
        if (range === 'month') return isSameMonth(parseISO(e.date), currentMonth);
        if (range === 'day') return isSameDay(parseISO(e.date), parseISO(exportDate));
        return true;
      })
      .map(e => [
        'Saída',
        format(parseISO(e.date), 'dd/MM/yyyy'),
        e.value.toFixed(2),
        e.description || e.category,
        e.paymentMethod,
        e.isBusiness ? 'Sim' : 'Não'
      ]);

    const allRows = [...logRows, ...expenseRows];
    
    const csvContent = [
      headers.join(','),
      ...allRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const expenseStats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthExpenses = expenses.filter(e => isSameMonth(parseISO(e.date), now));
    const lastMonthExpenses = expenses.filter(e => {
      const d = parseISO(e.date);
      return isAfter(d, lastMonthStart) && isBefore(d, lastMonthEnd);
    });

    const activeFixedSum = fixedExpenses.filter(f => f.isActive).reduce((a, c) => a + c.value, 0);
    
    const thisMonthTotal = thisMonthExpenses.reduce((a, c) => a + c.value, 0) + activeFixedSum;
    const lastMonthTotal = lastMonthExpenses.reduce((a, c) => a + c.value, 0) + activeFixedSum;

    const todayStart = startOfDay(now);
    const todayTotal = expenses.filter(e => isSameDay(parseISO(e.date), todayStart)).reduce((a, c) => a + c.value, 0);

    const categoryData = thisMonthExpenses.reduce((acc: any, curr) => {
      const cat = curr.category;
      acc[cat] = (acc[cat] || 0) + curr.value;
      return acc;
    }, {});

    const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

    return {
      thisMonthTotal,
      thisMonthVariable: thisMonthTotal - activeFixedSum,
      lastMonthTotal,
      todayTotal,
      monthCount: thisMonthExpenses.length,
      fixedTotal: activeFixedSum,
      pieData,
      isHigher: thisMonthTotal > lastMonthTotal,
      diff: Math.abs(thisMonthTotal - lastMonthTotal)
    };
  }, [expenses, fixedExpenses]);

  const CATEGORIES = [
    { label: 'Alimentação', icon: Utensils, color: '#f87171' },
    { label: 'Transporte', icon: Car, color: '#60a5fa' },
    { label: 'Entretenimento', icon: Gamepad2, color: '#a78bfa' },
    { label: 'Casa', icon: Home, color: '#fb923c' },
    { label: 'Contas', icon: Lightbulb, color: '#facc15' },
    { label: 'Saúde', icon: HeartPulse, color: '#f472b6' },
    { label: 'Ferramentas', icon: Hammer, color: '#94a3b8' },
    { label: 'Roupas', icon: Shirt, color: '#2dd4bf' },
    { label: 'Compras', icon: Package, color: '#818cf8' },
    { label: 'Impostos', icon: FileText, color: '#fb7185' },
    { label: 'Investimento', icon: TrendingUp, color: '#4ade80' },
    { label: 'Outros', icon: MoreHorizontal, color: '#cbd5e1' },
  ];

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const d = parseISO(e.date);
      if (expenseFilter === 'today') return isSameDay(d, now);
      if (expenseFilter === '7days') return isAfter(d, subDays(now, 7));
      if (expenseFilter === '30days') return isAfter(d, subDays(now, 30));
      if (expenseFilter === 'month') return isSameMonth(d, now);
      return true;
    }).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [expenses, expenseFilter]);

  const addExpense = () => {
    if (!newExpense.value || newExpense.value <= 0) return alert('Insira um valor válido');
    const expense: Expense = {
      ...newExpense as Expense,
      id: Date.now(),
      date: newExpense.date || new Date().toISOString()
    };
    const previousExpenses = [...expenses];
    saveExpensesToLocal([expense, ...expenses]);
    setModals(m => ({ ...m, addExpense: false }));
    triggerUndo(`Gasto de R$ ${expense.value.toFixed(2)}`, () => saveExpensesToLocal(previousExpenses));
    setNewExpense({
      value: 0,
      category: 'Alimentação',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Pix',
      isBusiness: false
    });
  };

  const deleteExpense = (id: number) => {
    const target = expenses.find(e => e.id === id);
    if (!target) return;
    const updated = expenses.filter(e => e.id !== id);
    saveExpensesToLocal(updated);
    triggerUndo(`Excluído: ${target.description || target.category}`, () => {
      setExpenses(current => [...current, target]);
      const saved = localStorage.getItem('contadia_expenses');
      const currentArr = saved ? JSON.parse(saved) : [];
      localStorage.setItem('contadia_expenses', JSON.stringify([...currentArr, target]));
    });
  };

  const COLORS = ['#00ff9d', '#00d4ff', '#ff007a', '#fcd34d', '#a78bfa', '#fb923c', '#facc15', '#f472b6'];

  return (
    <div className="min-h-screen bg-app-bg text-app-text font-sans selection:bg-neon-blue/30">
      <div className="max-w-md mx-auto pb-40 pt-12 px-5 sm:px-6">
        <header className="flex items-center justify-between mb-10">
          <div className="max-w-[70%]">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter neon-text-green italic truncate">CONTADIA PRO</h1>
          </div>
          <div className="w-12 h-12 rounded-2xl border border-neon-green/30 flex items-center justify-center bg-neon-green/5 neon-glow-green"><Zap className="w-6 h-6 text-neon-green" /></div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="db" initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }} className="space-y-8">
              <div className="grid grid-cols-1 gap-4">
                <NeonCard glowColor="green" className="relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-neon-green/10 rounded-full blur-3xl" />
                  <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest mb-1">Balanço Total Ativo</p>
                  <h2 className="text-5xl font-black tracking-tighter">R$ <NumberTicker value={stats.total} /></h2>
                </NeonCard>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <NeonCard glowColor="blue" className="flex flex-col justify-center py-5">
                    <p className="text-[8px] font-bold text-app-text/40 uppercase tracking-widest mb-1">Diárias</p>
                    <p className="text-2xl font-black tracking-tight">{stats.fullDays}</p>
                  </NeonCard>
                  <NeonCard glowColor="yellow" className="flex flex-col justify-center py-5">
                    <p className="text-[8px] font-bold text-app-text/40 uppercase tracking-widest mb-1">Meias</p>
                    <p className="text-2xl font-black tracking-tight">{stats.halfDays}</p>
                  </NeonCard>
                  <NeonCard glowColor="pink" className="flex flex-col justify-center py-5 sm:col-span-1 col-span-2">
                    <p className="text-[8px] font-bold text-app-text/40 uppercase tracking-widest mb-1">Meta Sem.</p>
                    <p className="text-2xl font-black tracking-tight">{stats.wProgress.toFixed(0)}%</p>
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
              <p className={`text-center py-6 px-4 text-sm italic font-medium transition-colors ${phrase.type === 'joke' ? 'text-neon-pink shadow-neon-pink/10 drop-shadow-sm' : 'text-app-text/40'}`}>
                "{phrase.text}"
              </p>
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
                      const dExpenses = expenses.filter(e => isSameDay(parseISO(e.date), d));
                      const sel = selectedDate && isSameDay(d, selectedDate);
                      return (
                        <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={() => setSelectedDate(d)}
                          className={`relative h-10 flex flex-col items-center justify-center rounded-xl text-xs font-bold ${!isSameMonth(d, currentMonth) ? 'text-app-text/10' : 'text-app-text/60'} ${sel ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'hover:bg-app-muted'} ${dLogs.length > 0 && !sel ? 'text-neon-blue' : ''} ${dExpenses.length > 0 && !sel && dLogs.length === 0 ? 'text-rose-500' : ''}`}>
                          {format(d, 'd')}
                          <div className="absolute bottom-1 flex gap-0.5">
                            {dLogs.length > 0 && <div className={`w-1 h-1 rounded-full ${sel ? 'bg-neon-blue' : 'bg-neon-blue/50 neon-glow-blue'}`} />}
                            {dExpenses.length > 0 && <div className={`w-1 h-1 rounded-full ${sel ? 'bg-rose-500' : 'bg-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />}
                          </div>
                        </motion.button>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest">{selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}</h3>
                <div className="space-y-3">
                  {(() => {
                    const dLogs = selectedDate ? logs.filter(l => isSameDay(parseISO(l.date), selectedDate)) : [];
                    const dExpenses = selectedDate ? expenses.filter(e => isSameDay(parseISO(e.date), selectedDate)) : [];
                    
                    // Virtual fixed expenses for the 1st of the month
                    const dFixed = (selectedDate && isSameDay(selectedDate, startOfMonth(selectedDate))) 
                      ? fixedExpenses.filter(f => f.isActive && f.value > 0)
                      : [];

                    if (!dLogs.length && !dExpenses.length && !dFixed.length) {
                      return <div className="py-12 text-center border border-dashed border-app-border rounded-3xl text-app-text/20 italic text-sm">Sem atividades nesta data.</div>;
                    }

                    return (
                      <>
                        {dLogs.map((l, i) => (
                          <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-5 rounded-2xl bg-app-muted border border-app-border">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-neon-blue/10 text-neon-blue"><Zap className="w-5 h-5" /></div>
                              <div><div className="flex items-center gap-2"><p className="text-sm font-bold">Entrada: {l.type === 'full_day' ? 'Dia Inteiro' : 'Meio Dia'}</p></div><p className="text-[10px] text-app-text/30 uppercase">Lucro registrado</p></div>
                            </div>
                            <div className="text-right"><p className="text-lg font-black text-neon-blue">R$ {l.value}</p></div>
                          </motion.div>
                        ))}
                        {dFixed.map((f, i) => (
                          <motion.div key={`fixed-${f.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (dLogs.length + i) * 0.05 }} className="flex items-center justify-between p-5 rounded-2xl bg-app-card border border-rose-500/20 shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-500"><Lock className="w-5 h-5" /></div>
                              <div><div className="flex items-center gap-2"><p className="text-sm font-bold">Base: {f.label}</p></div><p className="text-[10px] text-app-text/30 uppercase tracking-widest">Gasto Fixo Mensal</p></div>
                            </div>
                            <div className="text-right"><p className="text-lg font-black text-rose-500">R$ {f.value}</p></div>
                          </motion.div>
                        ))}
                        {dExpenses.map((e, i) => {
                          const cat = CATEGORIES.find(c => c.label === e.category) || CATEGORIES[CATEGORIES.length - 1];
                          return (
                            <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (dLogs.length + dFixed.length + i) * 0.05 }} className="flex items-center justify-between p-5 rounded-2xl bg-app-muted border border-app-border border-l-rose-500/50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-500"><cat.icon className="w-5 h-5" /></div>
                                <div><div className="flex items-center gap-2"><p className="text-sm font-bold">Saída: {e.description || e.category}</p></div><p className="text-[10px] text-app-text/30 uppercase">{e.category}</p></div>
                              </div>
                              <div className="text-right"><p className="text-lg font-black text-rose-500">R$ {e.value}</p></div>
                            </motion.div>
                          );
                        })}
                      </>
                    );
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
                      <div key={i} className="space-y-2">
                        <span className="text-[10px] text-app-text/30 uppercase">{f.l}</span>
                        <motion.input 
                          whileFocus={{ scale: 1.02 }} 
                          type="number" 
                          value={settings[f.k as keyof AppSettings] || ''} 
                          onChange={(e) => saveSettingsToLocal({ [f.k]: Number(e.target.value) })}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          className={`w-full p-4 rounded-2xl bg-app-muted border border-app-border focus:border-neon-${f.c} outline-none font-mono font-bold text-neon-${f.c}`} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {[ { l: 'Meta Semanal', k: 'weekly_goal', c: 'pink' }, { l: 'Meta Mensal', k: 'monthly_goal', c: 'blue' } ].map((f, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-[10px] font-bold text-app-text/40 uppercase">{f.l} (R$)</p>
                    <motion.input 
                      whileFocus={{ scale: 1.01 }} 
                      type="number" 
                      value={settings[f.k as keyof AppSettings] || ''} 
                      onChange={(e) => saveSettingsToLocal({ [f.k]: Number(e.target.value) })}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      className={`w-full p-4 rounded-2xl bg-app-muted border border-app-border focus:border-neon-${f.c} outline-none font-mono font-bold text-neon-${f.c} text-2xl`} 
                    />
                  </div>
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
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-app-muted border border-app-border">
                      <span className="text-[10px] text-app-text/30 uppercase font-bold">Escolher data para exportar</span>
                      <div className="flex gap-1.5 sm:gap-2">
                        <input 
                          type="date" 
                          value={exportDate} 
                          onChange={(e) => setExportDate(e.target.value)}
                          className="flex-1 min-w-0 bg-app-card border border-app-border rounded-xl px-2 py-2 text-[10px] font-bold focus:border-neon-blue outline-none"
                        />
                        <button 
                          onClick={() => exportCSV('day')} 
                          className="whitespace-nowrap px-3 py-2 rounded-xl bg-neon-blue text-white text-[9px] font-bold uppercase shadow-lg shadow-neon-blue/20 active:scale-95 transition-all"
                        >
                          Exportar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => exportCSV('month')} className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-app-muted border border-app-border hover:border-neon-blue/30 transition-all group">
                        <CalendarIcon className="w-4 h-4 text-app-text/30 group-hover:text-neon-blue" />
                        <span className="text-[10px] font-bold uppercase">Mês Atual</span>
                      </button>
                      <button onClick={() => exportCSV('all')} className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-app-muted border border-app-border hover:border-neon-pink/30 transition-all group">
                        <Download className="w-4 h-4 text-app-text/30 group-hover:text-neon-pink" />
                        <span className="text-[10px] font-bold uppercase">Tudo</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <input type="file" accept=".csv" onChange={importCSV} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <NeonButton variant="ghost" className="w-full text-[10px] uppercase pointer-events-none">
                    <Plus className="w-4 h-4" /> Importar CSV
                  </NeonButton>
                </div>

                <div className="pt-8 text-center">
                  <p className="text-[10px] font-bold text-app-text/20 uppercase tracking-[0.2em]">Contadia Pro v{APP_VERSION}</p>
                  <p className="text-[8px] text-app-text/10 mt-1 uppercase">Desenvolvido para uso local</p>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <motion.div key="exp" initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }} className="space-y-8 pb-10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-[10px] font-bold text-app-text/40 uppercase tracking-[0.3em]">Controle de Gastos</h2>
                  <button 
                    onClick={() => setModals(m => ({ ...m, addExpense: true }))}
                    className="w-8 h-8 rounded-full bg-neon-pink text-white flex items-center justify-center shadow-lg shadow-neon-pink/40 hover:scale-110 active:scale-95 transition-transform"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex p-1 bg-app-muted border border-app-border rounded-xl">
                  <button onClick={() => setExpenseSubTab('overview')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${expenseSubTab === 'overview' ? 'bg-app-card text-neon-pink shadow-sm' : 'text-app-text/30'}`}>Dashboard</button>
                  <button onClick={() => setExpenseSubTab('fixed')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${expenseSubTab === 'fixed' ? 'bg-app-card text-neon-pink shadow-sm' : 'text-app-text/30'}`}>Fixos</button>
                </div>
              </div>

              {expenseSubTab === 'overview' ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <NeonCard glowColor="pink" className="relative p-5">
                      <p className="text-[8px] font-bold text-app-text/40 uppercase tracking-widest mb-1">Gasto no Mês</p>
                      <h3 className="text-2xl font-black">R$ {expenseStats.thisMonthTotal.toFixed(2)}</h3>
                      <div className="mt-2 flex items-center justify-between text-[7px] font-bold uppercase tracking-tighter">
                        <span className="text-app-text/40 italic">Fixos: R$ {expenseStats.fixedTotal.toFixed(0)}</span>
                        <span className="text-app-text/40 italic">Var: R$ {expenseStats.thisMonthVariable.toFixed(0)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[8px] font-bold border-t border-app-border pt-2">
                        {expenseStats.isHigher ? (
                          <span className="text-rose-500 flex items-center gap-0.5"><ArrowUpRight className="w-2 h-2" /> + R$ {expenseStats.diff.toFixed(0)}</span>
                        ) : (
                          <span className="text-neon-green flex items-center gap-0.5"><ArrowDownRight className="w-2 h-2" /> - R$ {expenseStats.diff.toFixed(0)}</span>
                        )}
                        <span className="text-app-text/20">vs mês ant.</span>
                      </div>
                    </NeonCard>
                    <NeonCard glowColor="yellow" className="relative p-5">
                      <p className="text-[8px] font-bold text-app-text/40 uppercase tracking-widest mb-1">Gasto Hoje</p>
                      <h3 className="text-2xl font-black">R$ {expenseStats.todayTotal.toFixed(2)}</h3>
                      <p className="text-[8px] font-bold text-app-text/30 mt-2 lowercase">{expenseStats.monthCount} lançamentos no mês</p>
                    </NeonCard>
                  </div>

                  {expenseStats.pieData.length > 0 && (
                    <div className="h-48 w-full bg-app-card rounded-[2rem] border border-app-border p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie data={expenseStats.pieData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                            {expenseStats.pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--card-color)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '10px' }}
                            itemStyle={{ color: 'var(--text-color)' }}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {expenseStats.thisMonthTotal > (stats.monthly * 0.8) && stats.monthly > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
                      <Info className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-500/80 font-medium leading-relaxed">⚠️ Seus gastos este mês atingiram 80% do seu faturamento. Mantenha cautela.</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <button 
                      onClick={() => setModals(m => ({ ...m, addExpense: true }))}
                      className="w-full py-5 rounded-2xl bg-neon-pink text-white flex items-center justify-center gap-3 shadow-lg shadow-neon-pink/20 font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-98 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Lançar Gasto
                    </button>

                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest">Histórico Variável</p>
                      <div className="flex gap-1">
                        <button onClick={() => setExpenseFilter('today')} className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border transition-all ${expenseFilter === 'today' ? 'bg-neon-pink/20 border-neon-pink text-neon-pink' : 'border-app-border text-app-text/30'}`}>Hoje</button>
                        <button onClick={() => setExpenseFilter('month')} className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border transition-all ${expenseFilter === 'month' ? 'bg-neon-pink/20 border-neon-pink text-neon-pink' : 'border-app-border text-app-text/30'}`}>Mês</button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {filteredExpenses.length > 0 ? filteredExpenses.map((e) => {
                        const cat = CATEGORIES.find(c => c.label === e.category) || CATEGORIES[CATEGORIES.length - 1];
                        return (
                          <motion.div key={e.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-2xl bg-app-muted border border-app-border flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-app-bg border border-app-border" style={{ color: cat.color }}>
                                <cat.icon className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold">{e.description || e.category}</p>
                                <div className="flex items-center gap-2 text-[10px] text-app-text/40 uppercase font-bold tracking-tight">
                                  <span>{format(parseISO(e.date), "dd/MM")}</span>
                                  <span className="w-1 h-1 rounded-full bg-app-text/10" />
                                  <span>{e.paymentMethod}</span>
                                  {e.isBusiness && <span className="text-neon-blue border border-neon-blue/30 px-1 rounded-sm text-[8px]">Business</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-base font-black">R$ {e.value.toFixed(2)}</p>
                                <button onClick={() => deleteExpense(e.id)} className="text-[8px] font-bold uppercase text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">Excluir</button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      }) : (
                        <div className="py-10 text-center border-2 border-dashed border-app-border rounded-3xl text-app-text/20 italic text-sm">Nenhum gasto variável registrado este mês.</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-neon-pink/5 border border-neon-pink/20 rounded-[2rem] shadow-sm">
                    <div>
                      <h4 className="text-lg font-black tracking-tight">Gastos Fixos Mensais</h4>
                      <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest mt-1">Custo base da operação</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-neon-pink">R$ {expenseStats.fixedTotal.toFixed(2)}</p>
                      <p className="text-[8px] font-bold text-app-text/30 uppercase">Debitados todo dia 01</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pb-10">
                    {fixedExpenses.map((f) => (
                      <div key={f.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${f.isActive ? 'bg-app-muted border-app-border' : 'bg-transparent border-dashed border-app-border opacity-50'}`}>
                        <div className="flex items-center gap-3">
                          <button onClick={() => {
                            const updated = fixedExpenses.map(item => item.id === f.id ? { ...item, isActive: !item.isActive } : item);
                            saveFixedExpensesToLocal(updated);
                          }} className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${f.isActive ? 'bg-neon-pink/10 border-neon-pink text-neon-pink' : 'border-app-text/20 text-app-text/20'}`}>
                            {f.isActive ? <ShieldCheck className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                          </button>
                          <div>
                            <p className="text-sm font-bold">{f.label}</p>
                            <p className="text-[10px] text-app-text/40 tracking-wider">Mensal</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="number" 
                            value={f.value || ''}
                            onChange={(e) => {
                              const updated = fixedExpenses.map(item => item.id === f.id ? { ...item, value: Number(e.target.value) } : item);
                              saveFixedExpensesToLocal(updated);
                            }}
                            onFocus={(e) => e.target.select()}
                            placeholder="0,00"
                            className="w-20 bg-transparent border-b border-app-border text-right font-mono font-bold text-sm outline-none focus:border-neon-pink"
                          />
                          {f.id > 14 && (
                            <button onClick={() => removeFixedExpense(f.id)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => setModals(m => ({ ...m, addFixed: true }))}
                      className="mt-4 p-4 rounded-2xl border-2 border-dashed border-app-border text-app-text/40 hover:text-neon-pink hover:border-neon-pink/30 hover:bg-neon-pink/5 transition-all flex items-center justify-center gap-3 font-bold uppercase text-[10px]"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Gasto Fixo
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-sm glass-nav rounded-[2rem] p-1.5 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 border border-app-border">
          {[ 
            { id: 'dashboard', l: 'Início', i: LayoutDashboard, c: 'neon-green' }, 
            { id: 'calendar', l: 'Agenda', i: CalendarIcon, c: 'neon-blue' }, 
            { id: 'expenses', l: 'Gastos', i: Wallet, c: 'neon-pink' },
            { id: 'settings', l: 'Ajustes', i: SettingsIcon, c: 'neon-blue' } 
          ].map((t) => (
            <button key={t.id} onClick={() => handleTabChange(t.id as any)} className="relative flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl z-10">
              {activeTab === t.id && <motion.div layoutId="activeTab" className={`absolute inset-0 bg-${t.c}/10 rounded-2xl -z-10`} transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}
              <t.i className={`w-5 h-5 ${activeTab === t.id ? `text-${t.c}` : 'text-app-text/30'}`} />
              <span className={`text-[8px] font-black uppercase tracking-widest ${activeTab === t.id ? `text-${t.c}` : 'text-app-text/30'}`}>{t.l}</span>
            </button>
          ))}
        </nav>

        <AnimatePresence>
          {exitToast && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-app-card/90 backdrop-blur-md px-6 py-3 rounded-full border border-app-border shadow-2xl z-[100]"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-app-text/60">Pressione novamente para sair</p>
            </motion.div>
          )}

          {undo && (
            <motion.div 
              initial={{ y: 100, x: '-50%', opacity: 0 }}
              animate={{ y: 0, x: '-50%', opacity: 1 }}
              exit={{ y: 100, x: '-50%', opacity: 0 }}
              className="fixed bottom-32 left-1/2 w-[calc(100%-3rem)] max-w-sm bg-app-card border border-neon-blue/30 p-4 rounded-3xl shadow-2xl z-[60] flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neon-blue/10 flex items-center justify-center text-neon-blue">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest">Ação Realizada</p>
                  <p className="text-xs font-bold truncate max-w-[150px]">{undo.label}</p>
                </div>
              </div>
              <button 
                onClick={() => { undo.revert(); setUndo(null); }}
                className="px-4 py-2 bg-neon-blue text-white rounded-xl text-[10px] font-bold uppercase shadow-lg shadow-neon-blue/20 active:scale-95 transition-all"
              >
                Desfazer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
          {modals.addFixed && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-app-bg/90 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-app-card border border-app-border p-8 rounded-[2.5rem] shadow-2xl relative">
                <button onClick={() => setModals(m => ({ ...m, addFixed: false }))} className="absolute top-6 right-6 p-2 text-app-text/20 hover:text-app-text transition-colors"><Plus className="w-6 h-6 rotate-45" /></button>
                <div className="text-center space-y-2 mb-8 text-neon-pink">
                  <div className="w-16 h-16 rounded-3xl bg-neon-pink/10 flex items-center justify-center mx-auto mb-4 border border-neon-pink/30"><Lock className="w-8 h-8" /></div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">Novo Gasto Fixo</h3>
                  <p className="text-[10px] font-bold text-app-text/40 tracking-[0.2em] uppercase">Mensalidade recorrente</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-app-text/40 uppercase">Nome do Gasto</label>
                    <input autoFocus type="text" value={newFixedLabel} onChange={(e) => setNewFixedLabel(e.target.value)} placeholder="Ex: Assinatura Software" className="w-full p-4 rounded-2xl bg-app-muted border border-app-border focus:border-neon-pink outline-none font-bold placeholder:text-app-text/10" />
                  </div>
                  <NeonButton onClick={addFixedExpense} variant="pink" className="w-full h-16 text-sm uppercase tracking-widest shadow-lg shadow-neon-pink/20">Salvar Gasto</NeonButton>
                </div>
              </motion.div>
            </div>
          )}
          {modals.addExpense && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-app-bg/95 backdrop-blur-md">
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-app-card border border-app-border rounded-[2.5rem] p-8 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black">Adicionar Gasto</h3>
                  <button onClick={() => setModals(m => ({ ...m, addExpense: false }))} className="p-2 rounded-xl bg-app-muted text-app-text/40"><AlertCircle className="rotate-45 w-5 h-5" /></button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-app-text/40 uppercase">Valor do Gasto</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-app-text/60">R$</span>
                      <input 
                        type="number" 
                        value={newExpense.value || ''}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, value: Number(e.target.value) }))}
                        onFocus={(e) => e.target.select()}
                        placeholder="0,00"
                        className="w-full p-4 pl-12 rounded-2xl bg-app-muted border border-app-border focus:border-neon-pink outline-none font-bold text-xl"
                      />
                    </div>
                  </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-app-text/40 uppercase">Categoria</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button 
                          key={cat.label} 
                          onClick={() => setNewExpense(prev => ({ ...prev, category: cat.label }))}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${newExpense.category === cat.label ? 'bg-app-muted border-neon-pink text-neon-pink' : 'border-app-border text-app-text/40 grayscale opacity-60'}`}
                        >
                          <cat.icon className="w-5 h-5 mb-1" />
                          <span className="text-[7px] font-black uppercase text-center line-clamp-1">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-app-text/40 uppercase">Descrição (Opcional)</label>
                    <input 
                      type="text" 
                      value={newExpense.description}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Ex: Almoço da equipe"
                      className="w-full p-4 rounded-2xl bg-app-muted border border-app-border focus:border-neon-pink outline-none font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-app-text/40 uppercase">Data</label>
                      <input 
                        type="date" 
                        value={newExpense.date}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full p-4 rounded-2xl bg-app-muted border border-app-border focus:border-neon-pink outline-none font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-app-text/40 uppercase">Pagamento</label>
                      <select 
                        value={newExpense.paymentMethod}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="w-full p-4 rounded-2xl bg-app-muted border border-app-border focus:border-neon-pink outline-none font-bold text-sm"
                      >
                        {['Dinheiro', 'Pix', 'Cartão', 'Débito', 'Crédito'].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center justify-between p-4 rounded-2xl bg-app-muted border border-transparent hover:border-app-border cursor-pointer group">
                    <div className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-app-text/30 group-hover:text-neon-blue" /><span className="text-sm font-medium">Gasto do Negócio?</span></div>
                    <input type="checkbox" checked={newExpense.isBusiness} onChange={(e) => setNewExpense(prev => ({ ...prev, isBusiness: e.target.checked }))} className={`w-10 h-5 rounded-full bg-app-muted appearance-none checked:bg-neon-blue transition-all relative before:content-[''] before:absolute before:w-3 before:h-3 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:left-6`} />
                  </label>
                </div>

                <NeonButton onClick={addExpense} variant="pink" className="w-full h-16 text-lg">Salvar Gasto</NeonButton>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
