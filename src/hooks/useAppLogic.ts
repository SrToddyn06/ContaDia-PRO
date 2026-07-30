import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO,
  isAfter, isBefore, subDays, startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import { WorkLog, AppSettings, Expense, FixedExpense } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { INITIAL_FIXED_EXPENSES, MOTIVATIONAL_PHRASES, JOKES } from '../constants';
import { roundMoney } from '../utils/money';
import { scheduleReminder } from '../utils/notifications';

export const useAppLogic = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'expenses' | 'settings'>('dashboard');
  const [exitAttempts, setExitAttempts] = useState(0);
  const [exitToast, setExitToast] = useState(false);
  const [expenseSubTab, setExpenseSubTab] = useState<'overview' | 'fixed'>('overview');

  const [logs, setLogs] = useLocalStorage<WorkLog[]>('contadia_logs', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('contadia_expenses', []);
  const [fixedExpenses, setFixedExpenses] = useLocalStorage<FixedExpense[]>('contadia_fixed_expenses', INITIAL_FIXED_EXPENSES);
  const [settings, setSettings] = useLocalStorage<AppSettings>('contadia_settings', {
    half_day_value: 60, full_day_value: 120, show_jokes: true, show_tips: true,
    theme: 'dark', weekly_goal: 2000, monthly_goal: 8000, last_reset_date: new Date(0).toISOString(),
    user_name: '', notifications_enabled: false, notification_time: '18:00'
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [phrase, setPhrase] = useState({ text: "", type: 'motivation' as 'motivation' | 'joke' });
  const [modals, setModals] = useState({ reset: false, addExpense: false, addFixed: false, factoryReset: false });
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

  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);

  const startEditing = useCallback((expense: Expense) => {
    setNewExpense(expense);
    setEditingExpenseId(expense.id);
    setModals(prev => ({ ...prev, addExpense: true }));
  }, []);

  const clearExpenseForm = useCallback(() => {
    setNewExpense({
      value: 0,
      category: 'Alimentação',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Pix',
      isBusiness: false
    });
    setEditingExpenseId(null);
  }, []);

  // Effect to check for month change and inject fixed expenses
  useEffect(() => {
    const lastReset = parseISO(settings.last_reset_date);
    const now = new Date();

    if (!isSameMonth(lastReset, now) && lastReset.getTime() > 0) {
      const lastDayOfPrevMonth = format(endOfMonth(lastReset), 'yyyy-MM-dd');
      const injections: Expense[] = fixedExpenses
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
        setExpenses((prev: Expense[]) => [...injections, ...prev]);
      }

      setSettings((prev: AppSettings) => ({
        ...prev,
        last_reset_date: startOfMonth(now).toISOString()
      }));
    }
  }, [settings.last_reset_date, fixedExpenses, setExpenses, setSettings]);

  useEffect(() => {
    const pooled = [
      ...MOTIVATIONAL_PHRASES.map(t => ({ text: t, type: 'motivation' as const })),
      ...(settings.show_jokes ? JOKES.map(t => ({ text: t, type: 'joke' as const })) : [])
    ];
    if (pooled.length > 0) {
      setPhrase(pooled[Math.floor(Math.random() * pooled.length)]);
    }
  }, [settings.show_jokes]);

  const stats = useMemo(() => {
    const resetDate = parseISO(settings.last_reset_date);
    const active = logs.filter(l => {
      try {
        return parseISO(l.date) >= resetDate;
      } catch { return false; }
    });
    const now = new Date();
    const getEarned = (start: Date) => roundMoney(active.filter(l => parseISO(l.date) >= start).reduce((a, c) => a + (Number(c.value) || 0), 0));

    const weekStart = startOfWeek(now, { locale: ptBR });
    const monthStart = startOfMonth(now);
    const todayStart = startOfDay(now);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const dEarned = getEarned(todayStart);
    const wEarned = getEarned(weekStart);
    const mEarned = getEarned(monthStart);

    return {
      total: roundMoney(active.reduce((a, c) => a + (Number(c.value) || 0), 0)),
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

  const addLog = useCallback((type: 'half_day' | 'full_day') => {
    const value = roundMoney(type === 'full_day' ? settings.full_day_value : settings.half_day_value);
    const newLog: WorkLog = { id: Date.now(), date: new Date().toISOString(), type, value };
    const previousLogs = [...logs];
    setLogs((prev: WorkLog[]) => [newLog, ...prev]);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: type === 'full_day' ? ['#00ff9d', '#00d4ff'] : ['#fcd34d', '#ff007a'] });

    const id = Date.now();
    setUndo({ label: `Lançamento de ${type === 'full_day' ? 'Dia Inteiro' : 'Meio Dia'}`, revert: () => setLogs(previousLogs), id });
    setTimeout(() => setUndo(current => current?.id === id ? null : current), 5000);
  }, [logs, settings, setLogs]);

  const handleFactoryReset = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  useEffect(() => {
    scheduleReminder(settings.notification_time, settings.notifications_enabled);
  }, [settings.notification_time, settings.notifications_enabled]);

  return {
    activeTab, setActiveTab,
    exitAttempts, setExitAttempts,
    exitToast, setExitToast,
    expenseSubTab, setExpenseSubTab,
    logs, setLogs,
    expenses, setExpenses,
    fixedExpenses, setFixedExpenses,
    settings, setSettings,
    currentMonth, setCurrentMonth,
    selectedDate, setSelectedDate,
    phrase, setPhrase,
    modals, setModals,
    newFixedLabel, setNewFixedLabel,
    undo, setUndo,
    exportDate, setExportDate,
    expenseFilter, setExpenseFilter,
    newExpense, setNewExpense,
    stats,
    addLog,
    handleFactoryReset,
    editingExpenseId,
    setEditingExpenseId,
    startEditing,
    clearExpenseForm
  };
};
