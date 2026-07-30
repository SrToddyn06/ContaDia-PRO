import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Zap, Lock } from 'lucide-react';
import { WorkLog, Expense, FixedExpense } from '../../types';
import { roundMoney } from '../../utils/money';

interface CalendarProps {
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  selectedDate: Date | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>;
  logs: WorkLog[];
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
}

export const Calendar = ({
  currentMonth, setCurrentMonth, selectedDate, setSelectedDate,
  logs, expenses, fixedExpenses
}: CalendarProps) => {

  const selectedMonthStats = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const mLogs = logs.filter(l => {
      try {
        const d = parseISO(l.date);
        return d >= start && d <= end;
      } catch { return false; }
    });
    const totalEarned = roundMoney(mLogs.reduce((a, c) => a + (Number(c.value) || 0), 0));

    const mExpenses = expenses.filter(e => {
      try {
        const d = parseISO(e.date);
        return d >= start && d <= end;
      } catch { return false; }
    });

    const hasInjectedFixed = mExpenses.some(e => e.category === 'Fixos (Auto)');
    const variableSpent = roundMoney(mExpenses.filter(e => e.category !== 'Fixos (Auto)').reduce((a, c) => a + (Number(c.value) || 0), 0));
    const fixedSpent = roundMoney(hasInjectedFixed
      ? mExpenses.filter(e => e.category === 'Fixos (Auto)').reduce((a, c) => a + (Number(c.value) || 0), 0)
      : fixedExpenses.filter(f => f.isActive).reduce((a, c) => a + (Number(c.value) || 0), 0));

    const totalSpent = roundMoney(variableSpent + fixedSpent);
    return { earned: totalEarned, spent: totalSpent, balance: roundMoney(totalEarned - totalSpent) };
  }, [currentMonth, logs, expenses, fixedExpenses]);

  const monthlyHistory = useMemo(() => {
    const historyMap: { [key: string]: any } = {};
    logs.forEach(l => {
      try {
        const d = parseISO(l.date);
        const key = format(d, 'yyyy-MM');
        if (!historyMap[key]) historyMap[key] = { date: startOfMonth(d), earned: 0, variableSpent: 0, fixedSpent: 0, hasInjectedFixed: false };
        historyMap[key].earned = roundMoney(historyMap[key].earned + (Number(l.value) || 0));
      } catch {}
    });
    expenses.forEach(e => {
      try {
        const d = parseISO(e.date);
        const key = format(d, 'yyyy-MM');
        if (!historyMap[key]) historyMap[key] = { date: startOfMonth(d), earned: 0, variableSpent: 0, fixedSpent: 0, hasInjectedFixed: false };
        if (e.category === 'Fixos (Auto)') {
          historyMap[key].fixedSpent = roundMoney(historyMap[key].fixedSpent + (Number(e.value) || 0));
          historyMap[key].hasInjectedFixed = true;
        } else {
          historyMap[key].variableSpent = roundMoney(historyMap[key].variableSpent + (Number(e.value) || 0));
        }
      } catch {}
    });
    const activeFixedSum = roundMoney(fixedExpenses.filter(f => f.isActive).reduce((a, c) => a + c.value, 0));
    Object.keys(historyMap).forEach(key => {
      if (!historyMap[key].hasInjectedFixed) historyMap[key].fixedSpent = activeFixedSum;
    });
    return Object.values(historyMap)
      .map((item: any) => ({
        date: item.date,
        earned: item.earned,
        spent: roundMoney(item.variableSpent + item.fixedSpent),
        balance: roundMoney(item.earned - (item.variableSpent + item.fixedSpent))
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [logs, expenses, fixedExpenses]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }} className="space-y-6">
      <h2 className="text-[10px] font-bold text-app-text/40 uppercase tracking-[0.3em]">Calendário de Atividades</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Ganhos Mês', v: selectedMonthStats.earned, c: 'green' },
          { l: 'Gastos Mês', v: selectedMonthStats.spent, c: 'pink' },
          { l: 'Saldo Mês', v: selectedMonthStats.balance, c: 'blue' }
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-2xl bg-app-muted border border-app-border">
            <p className="text-[8px] font-bold text-app-text/30 uppercase mb-1">{s.l}</p>
            <p className={`text-xs font-black text-neon-${s.c} truncate`}>
              R$ {s.v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </p>
          </div>
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
            const dFixed = (selectedDate && isSameDay(selectedDate, startOfMonth(selectedDate))) ? fixedExpenses.filter(f => f.isActive && f.value > 0) : [];
            if (!dLogs.length && !dExpenses.length && !dFixed.length) return <div className="py-12 text-center border border-dashed border-app-border rounded-3xl text-app-text/20 italic text-sm">Sem atividades nesta data.</div>;
            return (
              <>
                {dLogs.map((l, i) => (
                  <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-5 rounded-2xl bg-app-muted border border-app-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-neon-blue/10 text-neon-blue"><Zap className="w-5 h-5" /></div>
                      <div><p className="text-sm font-bold">Entrada: {l.type === 'full_day' ? 'Dia Inteiro' : 'Meio Dia'}</p><p className="text-[10px] text-app-text/30 uppercase">Lucro registrado</p></div>
                    </div>
                    <div className="text-right"><p className="text-lg font-black text-neon-blue">R$ {l.value}</p></div>
                  </motion.div>
                ))}
                {dFixed.map((f, i) => (
                  <motion.div key={`fixed-${f.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (dLogs.length + i) * 0.05 }} className="flex items-center justify-between p-5 rounded-2xl bg-app-card border border-rose-500/20 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-500"><Lock className="w-5 h-5" /></div>
                      <div><p className="text-sm font-bold">Base: {f.label}</p><p className="text-[10px] text-app-text/30 uppercase tracking-widest">Gasto Fixo Mensal</p></div>
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
                        <div><p className="text-sm font-bold">Saída: {e.description || e.category}</p><p className="text-[10px] text-app-text/30 uppercase">{e.category}</p></div>
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

      <div className="space-y-4 pt-6 border-t border-app-border">
        <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest">Resumo Mensal Geral</p>
        <div className="space-y-3">
          {monthlyHistory.map((m, i) => (
            <div key={i} className="p-5 rounded-3xl bg-app-card border border-app-border flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-tight text-neon-blue">{format(m.date, 'MMMM yyyy', { locale: ptBR })}</p>
                <div className="flex gap-4 mt-1 text-[9px] font-semibold text-app-text/40 uppercase tracking-wider">
                  <span>Recebido: <span className="text-neon-green">R$ {m.earned.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                  <span>Gasto: <span className="text-neon-pink">R$ {m.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-black tracking-tight px-3 py-1.5 rounded-xl ${m.balance >= 0 ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-neon-pink/10 text-neon-pink border border-neon-pink/20'}`}>
                  {m.balance >= 0 ? '+' : ''} R$ {m.balance.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
