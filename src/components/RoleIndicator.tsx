import { useRole } from '../contexts/RoleContext';

export default function RoleIndicator() {
  const { currentRole } = useRole();

  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-[#F3F4F6] border border-neutral-200 px-2.5 py-1.5 rounded-full">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-flicker shrink-0" />
      <span>Role: {currentRole}</span>
    </div>
  );
}
