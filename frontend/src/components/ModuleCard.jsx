import { motion } from 'framer-motion';
import {
  Bug,
  Building2,
  Check,
  Database,
  DollarSign,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MODULE_ICONS = {
  module_01_phishing: Mail,
  module_02_passwords: KeyRound,
  module_03_malware: Bug,
  module_04_vishing: Phone,
  module_05_physical_security: Building2,
  module_06_data_handling: Database,
  module_07_social_engineering: Users,
  module_08_financial_scams: DollarSign,
};

const statusStyles = {
  locked: {
    card: 'cursor-not-allowed border-l-slate-400 opacity-75 dark:border-l-slate-600',
    badge: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
    badgeLabel: 'Locked',
  },
  unlocked: {
    card: 'cursor-pointer border-l-cyan-500 hover:shadow-md',
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
    badgeLabel: 'Unlocked',
  },
  completed: {
    card: 'cursor-pointer border-l-green-500 hover:shadow-md',
    badge: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    badgeLabel: 'Completed',
  },
};

export default function ModuleCard({ module }) {
  const navigate = useNavigate();
  const { id, title, description, status, order } = module;
  const styles = statusStyles[status] || statusStyles.locked;
  const isClickable = status === 'unlocked' || status === 'completed';
  const TopicIcon = MODULE_ICONS[id] || Mail;

  const handleClick = () => {
    if (isClickable) navigate(`/module/${id}`);
  };

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      navigate(`/module/${id}`);
    }
  };

  return (
    <motion.div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      whileHover={isClickable ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={`panel relative flex h-full w-full min-h-[220px] flex-col border-l-4 p-5 transition-shadow ${styles.card}`}
    >
      <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
        {order}
      </span>

      <div className="mb-3 flex h-10 shrink-0 items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-cyan-600 dark:bg-slate-700/80 dark:text-cyan-400">
          <TopicIcon className="h-5 w-5" />
        </span>
        {status === 'locked' && <Lock className="h-4 w-4 text-slate-500" />}
        {status === 'completed' && <Check className="h-4 w-4 text-green-600 dark:text-green-400" />}
      </div>

      <h3 className="line-clamp-2 min-h-[2.75rem] pr-8 text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-2 line-clamp-3 min-h-[3.75rem] flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>

      <span
        className={`mt-auto inline-flex w-fit rounded-full px-2.5 py-0.5 pt-4 text-xs font-medium ${styles.badge}`}
      >
        {styles.badgeLabel}
      </span>
    </motion.div>
  );
}
