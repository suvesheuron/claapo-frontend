import { useRole } from '../contexts/RoleContext';

const ROLE_STYLES: Record<string, string> = {
  individual: 'bg-emerald-500',
  vendor:     'bg-violet-500',
  company:    'bg-blue-500',
};

export default function RoleIndicator() {
  const { currentRole } = useRole();

  const dotColor = ROLE_STYLES[currentRole] ?? 'bg-emerald-500';

  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 px-2 py-1 rounded-md bg-neutral-100/80 select-none">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 animate-flicker`} />
      <span className="capitalize">{currentRole}</span>
    </div>
  );
}
