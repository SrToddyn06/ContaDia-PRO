import { roundMoney } from '../utils/money';

export const NeonCard = ({ children, className = "", glowColor = "green" }: { children: React.ReactNode, className?: string, glowColor?: 'green' | 'blue' | 'pink' | 'yellow' }) => {
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

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'green' | 'blue' | 'pink' | 'ghost';
  className?: string;
  disabled?: boolean;
}

export const NeonButton = ({ children, onClick, variant = 'green', className = "", disabled = false }: NeonButtonProps) => {
  const variants = {
    green: 'bg-neon-green/10 text-neon-green border-neon-green/30 hover:bg-neon-green hover:text-black dark:hover:text-black',
    blue: 'bg-neon-blue/10 text-neon-blue border-neon-blue/30 hover:bg-neon-blue hover:text-black dark:hover:text-black',
    pink: 'bg-neon-pink/10 text-neon-pink border-neon-pink/30 hover:bg-neon-pink hover:text-black dark:hover:text-black',
    ghost: 'bg-transparent text-app-text/40 hover:text-app-text hover:bg-app-muted border-transparent'
  };

  return (
    <motion.button whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={onClick} disabled={disabled}
      className={`px-6 py-4 rounded-2xl font-bold border transition-all flex items-center justify-center gap-3 disabled:opacity-30 neon-button-${variant} ${variants[variant]} ${className}`}>
      {children}
    </motion.button>
  );
};

export const NumberTicker = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const safeValue = isNaN(value) ? 0 : roundMoney(value);
    let start = display;
    const end = safeValue;
    if (start === end) return;
    const duration = 800;
    const startTime = performance.now();
    let animId: number;
    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = start + (end - start) * ease;
      setDisplay(progress === 1 ? end : roundMoney(currentVal));
      if (progress < 1) {
        animId = requestAnimationFrame(update);
      }
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  const formatted = display.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return <span>{formatted}</span>;
};
