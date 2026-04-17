import { useState } from 'react';
import { useRole, type UserRole } from '../contexts/RoleContext';
import { FaUsers, FaVideo, FaTruck, FaChevronDown } from 'react-icons/fa6';

const roles: { value: UserRole; label: string; icon: typeof FaUsers; description: string }[] = [
  { value: 'Company', label: 'Company', icon: FaUsers, description: 'Production Company' },
  { value: 'Individual', label: 'Individual', icon: FaVideo, description: 'Freelancer' },
  { value: 'Vendor', label: 'Vendor', icon: FaTruck, description: 'Equipment Vendor' },
];

export default function RoleSwitcher() {
  const { currentRole, setCurrentRole } = useRole();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-[#141A28] rounded-lg shadow-lg dark:shadow-black/40 border border-neutral-200 dark:border-[#1F2940] p-3 max-w-xs">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2"
      >
        <div className="text-left">
          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">Switch Role (Dev Mode)</p>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">change roles here</p>
        </div>
        <FaChevronDown
          className={`w-3 h-3 text-neutral-500 dark:text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="space-y-1 mt-2">
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = currentRole === role.value;
            return (
              <button
                key={role.value}
                onClick={() => setCurrentRole(role.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                  isActive
                    ? 'bg-neutral-900 dark:bg-[#1E2640] text-white'
                    : 'bg-neutral-50 dark:bg-[#1E2640]/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E2640]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{role.label}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-neutral-300' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    {role.description}
                  </div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-white shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

