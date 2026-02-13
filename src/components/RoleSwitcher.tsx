import { useRole, type UserRole } from '../contexts/RoleContext';
import { FaUsers, FaVideo, FaTruck } from 'react-icons/fa6';

const roles: { value: UserRole; label: string; icon: typeof FaUsers; description: string }[] = [
  { value: 'company', label: 'Company', icon: FaUsers, description: 'Production Company' },
  { value: 'individual', label: 'Individual', icon: FaVideo, description: 'Freelancer' },
  { value: 'vendor', label: 'Vendor', icon: FaTruck, description: 'Equipment Vendor' },
];

export default function RoleSwitcher() {
  const { currentRole, setCurrentRole } = useRole();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-neutral-200 p-3 max-w-xs">
      <div className="mb-2">
        <p className="text-xs font-semibold text-neutral-900 mb-1">Switch Role (Dev Mode)</p>
        <p className="text-[10px] text-neutral-500">Change role in RoleContext.tsx for production</p>
      </div>
      <div className="space-y-1">
        {roles.map((role) => {
          const Icon = role.icon;
          const isActive = currentRole === role.value;
          return (
            <button
              key={role.value}
              onClick={() => setCurrentRole(role.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                isActive
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{role.label}</div>
                <div className={`text-[10px] truncate ${isActive ? 'text-neutral-300' : 'text-neutral-500'}`}>
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
    </div>
  );
}

