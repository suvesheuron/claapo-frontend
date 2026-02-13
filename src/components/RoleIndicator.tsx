import { useRole } from '../contexts/RoleContext';

export default function RoleIndicator() {
  const { currentRole } = useRole();

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500 bg-transparent border border-neutral-300 px-3 py-1.5 rounded-full">
      <div className="relative flex items-center justify-center w-4 h-4 mr-1">
        {/* Transparent circle (no border, no fill) */}
        <div className="absolute w-4 h-4 rounded-full bg-transparent"></div>
        {/* Flickering green dot inside circle (no border on the dot itself) */}
        <div className="absolute w-2 h-2 rounded-full bg-green-500 animate-flicker"></div>
      </div>
      <span>Role: {currentRole}</span>
    </div>
  );
}

