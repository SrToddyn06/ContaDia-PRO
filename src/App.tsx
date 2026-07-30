import React, { useEffect } from 'react';
import { 
  LayoutDashboard, Calendar as CalendarIcon, Settings as SettingsIcon, 
  Plus, RotateCcw, Download, Trash2, AlertCircle,
  Coffee, Zap, ShieldCheck, Wallet, ArrowUpRight, ArrowDownRight, Info, Bell, BellRing, Clock, X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { format, parseISO, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { App as CapApp } from '@capacitor/app';

import { useAppLogic } from './hooks/useAppLogic';
import { Dashboard } from './components/screens/Dashboard';
import { Calendar } from './components/screens/Calendar';
import { AnimatedSplash } from './components/AnimatedSplash';
import { NeonButton, NeonCard } from './components/UI';
import { CATEGORIES, APP_VERSION } from './constants';
import { roundMoney } from './utils/money';
import { Expense, FixedExpense } from './types';

export default function App() {
  const logic = useAppLogic();
  const {
    activeTab, setActiveTab, exitToast, setExitToast, setExitAttempts,
    isAppLoading,
    logs, expenses, setExpenses, fixedExpenses, setFixedExpenses, settings, setSettings,
    currentMonth, setCurrentMonth, selectedDate, setSelectedDate,
    phrase, modals, setModals, newFixedLabel, setNewFixedLabel,
    undo, setUndo, exportDate, setExportDate, expenseFilter, setExpenseFilter,
    newExpense, setNewExpense, stats, addLog, handleFactoryReset, expenseSubTab, setExpenseSubTab,
    editingExpenseId, startEditing, clearExpenseForm
  } = logic;

  useEffect(() => {
    CapApp.addListener('backButton', () => {
      // If any modal is open, close it
      if (modals.reset || modals.addExpense || modals.addFixed || modals.factoryReset) {
        setModals({ reset: false, addExpense: false, addFixed: false, factoryReset: false });
        clearExpenseForm();
        return;
      }

      // If not on dashboard, go to dashboard
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return;
      }

      // If on dashboard, handle exit with double tap protection
      setExitAttempts(prev => {
        if (prev >= 1) {
          CapApp.exitApp();
          return 0;
        }
        setExitToast(true);
        setTimeout(() => setExitToast(false), 2000);
        return prev + 1;
      });
    });

    return () => {
      CapApp.removeAllListeners();
    };
  }, [activeTab, modals, setActiveTab, setExitAttempts, setExitToast, setModals]);

  const handleTabChange = (tab: any) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setExitAttempts(0);
  };

  const deleteExpense = (id: number) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
  };

  return (
    <div className={`min-h-screen bg-app-bg text-app-text font-sans selection:bg-neon-blue/30 ${settings.theme === 'light' ? 'light' : ''}`}>
      <AnimatePresence>
        {isAppLoading && <AnimatedSplash />}
      </AnimatePresence>

      <div className="max-w-md mx-auto pb-40 pt-12 px-5 sm:px-6">
        <header className="flex items-center justify-between mb-10">
          <div className="max-w-[70%]">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter neon-text-green italic truncate">CONTADIA PRO</h1>
          </div>
          <div className="w-12 h-12 rounded-2xl border border-neon-green/30 flex items-center justify-center bg-neon-green/5 neon-glow-green"><Zap className="w-6 h-6 text-neon-green" /></div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <Dashboard stats={stats} settings={settings} addLog={addLog} setModals={setModals} phrase={phrase} />}

          {activeTab === 'calendar' && (
            <Calendar
              currentMonth={currentMonth} setCurrentMonth={setCurrentMonth}
              selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              logs={logs} expenses={expenses} fixedExpenses={fixedExpenses}
            />
          )}

          {activeTab === 'expenses' && (
            <motion.div initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }} className="space-y-8 pb-10">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[10px] font-bold text-app-text/40 uppercase tracking-[0.3em]">Controle de Gastos</h2>
                <div className="flex p-1 bg-app-muted border border-app-border rounded-xl">
                  <button onClick={() => setExpenseSubTab('overview')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${expenseSubTab === 'overview' ? 'bg-app-card text-neon-pink shadow-sm' : 'text-app-text/30'}`}>Dashboard</button>
                  <button onClick={() => setExpenseSubTab('fixed')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${expenseSubTab === 'fixed' ? 'bg-app-card text-neon-pink shadow-sm' : 'text-app-text/30'}`}>Fixos</button>
                </div>
              </div>

              {expenseSubTab === 'overview' ? (
                 <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <NeonCard glowColor="pink" className="p-5">
                        <p className="text-[8px] font-bold text-app-text/40 uppercase tracking-widest mb-1">Gasto no Mês</p>
                        <h3 className="text-2xl font-black">R$ {roundMoney(expenses.filter(e => isSameMonth(parseISO(e.date), new Date())).reduce((a, c) => a + c.value, 0)).toFixed(2)}</h3>
                      </NeonCard>
                      <NeonCard glowColor="yellow" className="p-5">
                        <p className="text-[8px] font-bold text-app-text/40 uppercase tracking-widest mb-1">Gasto Hoje</p>
                        <h3 className="text-2xl font-black">R$ {roundMoney(expenses.filter(e => isSameDay(parseISO(e.date), new Date())).reduce((a, c) => a + c.value, 0)).toFixed(2)}</h3>
                      </NeonCard>
                    </div>

                    <button onClick={() => { clearExpenseForm(); setModals((m: any) => ({ ...m, addExpense: true })); }} className="w-full py-5 rounded-2xl bg-neon-pink text-white flex items-center justify-center gap-3 shadow-lg shadow-neon-pink/20 font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-98 transition-all">
                      <Plus className="w-5 h-5" /> Lançar Gasto
                    </button>

                    <div className="space-y-3">
                      {expenses.slice(0, 20).map(e => {
                        const cat = CATEGORIES.find(c => c.label === e.category) || CATEGORIES[CATEGORIES.length - 1];
                        return (
                          <div key={e.id} className="p-4 rounded-2xl bg-app-muted border border-app-border flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-app-bg border border-app-border" style={{ color: cat.color }}><cat.icon className="w-5 h-5" /></div>
                              <div>
                                <p className="text-sm font-bold">{e.description || e.category}</p>
                                <p className="text-[10px] text-app-text/40 uppercase">{format(parseISO(e.date), 'dd/MM')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-base font-black text-rose-500">R$ {e.value.toFixed(2)}</p>
                              <div className="flex gap-1">
                                <button onClick={() => startEditing(e)} className="p-2 bg-neon-blue/10 text-neon-blue rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteExpense(e.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {expenses.length === 0 && (
                        <div className="py-10 text-center border-2 border-dashed border-app-border rounded-3xl text-app-text/20 italic text-sm">Nenhum gasto registrado.</div>
                      )}
                    </div>
                 </div>
              ) : (
                <div className="space-y-4">
                  {fixedExpenses.map(f => (
                    <div key={f.id} className="p-4 rounded-2xl border bg-app-muted border-app-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${f.isActive ? 'bg-neon-pink/10 border-neon-pink text-neon-pink' : 'border-app-text/20 text-app-text/20'}`}><ShieldCheck className="w-4 h-4" /></div>
                        <div><p className="text-sm font-bold">{f.label}</p></div>
                      </div>
                      <input type="number" value={f.value || ''} onChange={(e) => {
                        const val = Number(e.target.value);
                        setFixedExpenses((prev: FixedExpense[]) => prev.map(item => item.id === f.id ? { ...item, value: val } : item));
                      }} className="w-20 bg-transparent border-b border-app-border text-right font-mono font-bold text-sm outline-none" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }} className="space-y-8">
              <h2 className="text-[10px] font-bold text-app-text/40 uppercase tracking-[0.3em]">Ajustes do Sistema</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-app-text/40 uppercase">Meio Dia</p>
                    <input type="number" value={settings.half_day_value} onChange={(e) => setSettings((s: any) => ({...s, half_day_value: Number(e.target.value)}))} className="w-full p-4 rounded-2xl bg-app-muted border border-app-border outline-none font-bold text-neon-blue" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-app-text/40 uppercase">Dia Inteiro</p>
                    <input type="number" value={settings.full_day_value} onChange={(e) => setSettings((s: any) => ({...s, full_day_value: Number(e.target.value)}))} className="w-full p-4 rounded-2xl bg-app-muted border border-app-border outline-none font-bold text-neon-green" />
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-app-border">
                  <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest">Tema da Interface</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setSettings((s: any) => ({...s, theme: 'dark'}))} className={`p-4 rounded-2xl border ${settings.theme === 'dark' ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'bg-app-muted border-app-border text-app-text/40'}`}>Escuro</button>
                    <button onClick={() => setSettings((s: any) => ({...s, theme: 'light'}))} className={`p-4 rounded-2xl border ${settings.theme === 'light' ? 'bg-neon-yellow/10 border-neon-yellow text-neon-yellow' : 'bg-app-muted border-app-border text-app-text/40'}`}>Claro</button>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-app-border">
                  <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest">Lembrete Diário</p>
                  <div className="p-5 rounded-3xl bg-app-card border border-app-border space-y-4">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${settings.notifications_enabled ? 'bg-neon-blue/10 text-neon-blue' : 'bg-app-muted text-app-text/20'}`}>
                          {settings.notifications_enabled ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold">Ativar Notificação</p>
                          <p className="text-[10px] text-app-text/40 uppercase">Lembrete para registrar diária</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications_enabled}
                        onChange={(e) => setSettings((s: any) => ({...s, notifications_enabled: e.target.checked}))}
                        className={`w-10 h-5 rounded-full bg-app-muted appearance-none checked:bg-neon-blue transition-all relative before:content-[''] before:absolute before:w-3 before:h-3 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:left-6`}
                      />
                    </label>

                    {settings.notifications_enabled && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="pt-4 border-t border-app-border flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 text-app-text/60">
                          <Clock className="w-4 h-4 text-neon-blue" />
                          <span className="text-xs font-bold uppercase tracking-wider">Horário do Lembrete:</span>
                        </div>
                        <input
                          type="time"
                          value={settings.notification_time}
                          onChange={(e) => setSettings((s: any) => ({...s, notification_time: e.target.value}))}
                          className="bg-app-muted border border-app-border rounded-xl px-4 py-2 text-sm font-mono font-bold text-neon-blue focus:border-neon-blue outline-none"
                        />
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-app-card border border-neon-pink/20 space-y-4">
                    <h4 className="text-xs font-black uppercase">Manutenção</h4>
                    <button onClick={() => setModals((m: any) => ({ ...m, factoryReset: true }))} className="w-full p-4 rounded-2xl bg-neon-pink/10 border border-neon-pink/20 text-neon-pink font-black uppercase text-[10px]">⚠️ Restaurar Padrões de Fábrica</button>
                </div>
                <div className="pt-8 text-center"><p className="text-[10px] font-bold text-app-text/20 uppercase tracking-[0.2em]">Contadia Pro v{APP_VERSION}</p></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-sm glass-nav rounded-[2rem] p-1.5 flex items-center justify-between shadow-2xl z-50 border border-app-border">
          {[ 
            { id: 'dashboard', l: 'Início', i: LayoutDashboard, c: 'neon-green' }, 
            { id: 'calendar', l: 'Agenda', i: CalendarIcon, c: 'neon-blue' }, 
            { id: 'expenses', l: 'Gastos', i: Wallet, c: 'neon-pink' },
            { id: 'settings', l: 'Ajustes', i: SettingsIcon, c: 'neon-blue' } 
          ].map((t) => (
            <button key={t.id} onClick={() => handleTabChange(t.id)} className="relative flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl">
              {activeTab === t.id && <motion.div layoutId="activeTab" className={`absolute inset-0 bg-${t.c}/10 rounded-2xl -z-10`} />}
              <t.i className={`w-5 h-5 ${activeTab === t.id ? `text-${t.c}` : 'text-app-text/30'}`} />
              <span className={`text-[8px] font-black uppercase tracking-widest ${activeTab === t.id ? `text-${t.c}` : 'text-app-text/30'}`}>{t.l}</span>
            </button>
          ))}
        </nav>

        <AnimatePresence>
          {exitToast && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-app-card/90 backdrop-blur-md px-6 py-3 rounded-full border border-app-border shadow-2xl z-[100]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-app-text/60">Pressione novamente para sair</p>
            </motion.div>
          )}
          {undo && (
            <motion.div initial={{ y: 100, x: '-50%', opacity: 0 }} animate={{ y: 0, x: '-50%', opacity: 1 }} exit={{ y: 100, x: '-50%', opacity: 0 }} className="fixed bottom-32 left-1/2 w-[calc(100%-3rem)] max-w-sm bg-app-card border border-neon-blue/30 p-4 rounded-3xl shadow-2xl z-[60] flex items-center justify-between gap-4">
              <div><p className="text-[10px] font-bold text-app-text/40 uppercase">Ação Realizada</p><p className="text-xs font-bold">{undo.label}</p></div>
              <button onClick={() => { undo.revert(); setUndo(null); }} className="px-4 py-2 bg-neon-blue text-white rounded-xl text-[10px] font-bold uppercase">Desfazer</button>
            </motion.div>
          )}
          {modals.factoryReset && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-app-card border border-neon-pink/30 rounded-[2.5rem] p-8 max-w-sm w-full text-center">
                <Trash2 className="w-12 h-12 text-neon-pink mx-auto mb-4" />
                <h3 className="text-2xl font-black mb-2 uppercase">Formatar App?</h3>
                <p className="text-app-text/60 text-xs mb-8">Isso apagará definitivamente todos os seus lançamentos e ajustes.</p>
                <div className="flex flex-col gap-3">
                  <button onClick={handleFactoryReset} className="w-full py-4 rounded-2xl bg-neon-pink text-white font-black uppercase text-[10px]">Confirmar</button>
                  <button onClick={() => setModals((m: any) => ({ ...m, factoryReset: false }))} className="w-full py-4 rounded-2xl bg-app-muted text-app-text/60 font-bold uppercase text-[10px]">Cancelar</button>
                </div>
              </motion.div>
            </div>
          )}
          {modals.addExpense && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-app-bg/95 backdrop-blur-md">
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-app-card border border-app-border rounded-[2.5rem] p-8 max-w-md w-full space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black">{editingExpenseId ? 'Alterar Gasto' : 'Novo Gasto'}</h3>
                  <button onClick={() => { setModals((m: any) => ({ ...m, addExpense: false })); clearExpenseForm(); }} className="p-2 rounded-xl bg-app-muted text-app-text/40 hover:text-app-text">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <input type="number" placeholder="0,00" value={newExpense.value || ''} onChange={(e) => setNewExpense((p: any) => ({...p, value: Number(e.target.value)}))} className="w-full p-4 rounded-2xl bg-app-muted border border-app-border outline-none font-bold text-xl" />
                  <select value={newExpense.category} onChange={(e) => setNewExpense((p: any) => ({...p, category: e.target.value}))} className="w-full p-4 rounded-2xl bg-app-muted border border-app-border outline-none font-bold">
                    {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                  </select>
                  <input type="text" placeholder="Descrição" value={newExpense.description} onChange={(e) => setNewExpense((p: any) => ({...p, description: e.target.value}))} className="w-full p-4 rounded-2xl bg-app-muted border border-app-border outline-none font-bold" />
                  <input type="date" value={newExpense.date ? format(parseISO(newExpense.date), 'yyyy-MM-dd') : ''} onChange={(e) => setNewExpense((p: any) => ({...p, date: e.target.value}))} className="w-full p-4 rounded-2xl bg-app-muted border border-app-border outline-none font-bold" />
                  <NeonButton onClick={() => {
                    if (!newExpense.value) return;
                    const expenseData = {
                      ...newExpense,
                      value: roundMoney(newExpense.value || 0),
                      id: editingExpenseId || Date.now(),
                      date: newExpense.date || new Date().toISOString()
                    } as Expense;

                    if (editingExpenseId) {
                      setExpenses((prev: Expense[]) => prev.map(e => e.id === editingExpenseId ? expenseData : e));
                    } else {
                      setExpenses((prev: Expense[]) => [expenseData, ...prev]);
                    }

                    setModals((m: any) => ({ ...m, addExpense: false }));
                    clearExpenseForm();
                  }} variant="pink" className="w-full h-16">{editingExpenseId ? 'Salvar Alteração' : 'Salvar Gasto'}</NeonButton>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
