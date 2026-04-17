import { useRole } from '../contexts/RoleContext';

const ROLE_STYLES: Record<string, { dot: string; chip: string; text: string }> = {
  individual: { dot: 'bg-[#22C55E]', chip: 'bg-emerald-50 dark:bg-emerald-900/40',  text: 'text-emerald-700 dark:text-emerald-300' },
  vendor:     { dot: 'bg-[#F4C430]', chip: 'bg-[#FEF7E0] dark:bg-[#3B2A10]',         text: 'text-[#8A6508] dark:text-[#FBBF24]' },
  company:    { dot: 'bg-[#3678F1]', chip: 'bg-[#E8F0FE] dark:bg-[#15264A]',         text: 'text-[#2563EB] dark:text-[#60A5FA]' },
};

export default function RoleIndicator() {
  const { currentRole } = useRole();

  const style = ROLE_STYLES[currentRole] ?? ROLE_STYLES.individual;

  return (
    <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full select-none ${style.chip} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0 animate-flicker`} />
      <span className="capitalize tracking-wide">{currentRole}</span>
    </div>
  );
}
