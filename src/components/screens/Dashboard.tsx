import React from 'react';
import { motion } from 'motion/react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { NeonCard, NeonButton, NumberTicker } from '../UI';
import { AppSettings } from '../../types';

interface DashboardProps {
  stats: any;
  settings: AppSettings;
  addLog: (type: 'half_day' | 'full_day') => void;
  setModals: React.Dispatch<React.SetStateAction<any>>;
  phrase: { text: string; type: string };
}

export const Dashboard = ({ stats, settings, addLog, setModals, phrase }: DashboardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
      className="space-y-8"
    >
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
        {[
           { label: 'Semanal', val: stats.weekly, goal: settings.weekly_goal, prog: stats.wProgress, color: 'green' },
           { label: 'Mensal', val: stats.monthly, goal: settings.monthly_goal, prog: stats.mProgress, color: 'blue' }
        ].map((p, i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-app-text/40 uppercase">Progresso {p.label}</span>
              <span className={`text-xs font-mono text-neon-${p.color}`}>R$ {p.val} / {p.goal}</span>
            </div>
            <div className="w-full h-2 bg-app-muted rounded-full overflow-hidden border border-app-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${p.prog}%` }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                className={`h-full bg-gradient-to-r from-neon-${p.color} to-neon-blue neon-glow-${p.color} relative`}
              >
                <motion.div animate={{ x: ['-100%', '200%'], opacity: [0, 0.3, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 w-20 bg-app-text/30 skew-x-12" />
              </motion.div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 pt-4">
        <NeonButton onClick={() => addLog('full_day')} variant="green" className="h-24 text-xl group">
          <Plus className="w-6 h-6 group-hover:rotate-180 transition-transform" /> Dia Inteiro
        </NeonButton>
        <NeonButton onClick={() => addLog('half_day')} variant="blue" className="h-20 text-lg group">
          <Minus className="w-6 h-6 group-hover:-translate-x-1 transition-transform" /> Meio Dia
        </NeonButton>
      </div>
      <p className={`text-center py-6 px-4 text-sm italic font-medium transition-colors ${phrase.type === 'joke' ? 'text-neon-pink shadow-neon-pink/10 drop-shadow-sm' : 'text-app-text/40'}`}>
        "{phrase.text}"
      </p>
      <NeonButton onClick={() => setModals((m: any) => ({ ...m, reset: true }))} variant="pink" className="w-full h-16 text-sm uppercase tracking-widest">
        <RotateCcw className="w-5 h-5" /> Zerar Balanço
      </NeonButton>
    </motion.div>
  );
};
