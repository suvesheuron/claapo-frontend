import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaXmark, FaChevronDown, FaChevronUp } from 'react-icons/fa6';
import { useAuth } from '../contexts/AuthContext';
import { useApiQuery } from '../hooks/useApiQuery';

interface ProfileMe {
  displayName?: string;
  companyName?: string;
  skills?: string[];
  dailyBudget?: number | null;
  availabilitySlots?: unknown[];
  availabilities?: unknown[];
}

interface Step {
  label: string;
  done: boolean;
  to: string;
}

function getSteps(role: string, profile: ProfileMe | null): Step[] {
  if (!profile) return [];
  const hasName = !!(profile.displayName || profile.companyName);
  const hasRate = !!(profile.dailyBudget != null && profile.dailyBudget > 0);
  const hasSkills = !!(profile.skills?.length);
  const hasAvailability = !!(
    (profile.availabilitySlots && (profile.availabilitySlots as unknown[]).length > 0) ||
    (profile.availabilities && (profile.availabilities as unknown[]).length > 0)
  );

  if (role === 'individual') {
    return [
      { label: 'Complete your profile', done: hasName, to: '/dashboard/profile' },
      { label: 'Add your skills & budget', done: hasSkills && hasRate, to: '/dashboard/profile' },
      { label: 'Set your availability', done: hasAvailability, to: '/dashboard/availability' },
      { label: "You're ready to get hired!", done: hasName && hasSkills && hasRate && hasAvailability, to: '/dashboard' },
    ];
  }
  if (role === 'vendor') {
    return [
      { label: 'Complete vendor profile', done: hasName, to: '/dashboard/vendor-profile' },
      { label: 'Add your equipment', done: false, to: '/dashboard/equipment' },
      { label: 'Set availability', done: hasAvailability, to: '/dashboard/vendor-availability' },
      { label: 'Start accepting bookings!', done: hasName && hasAvailability, to: '/dashboard' },
    ];
  }
  // company
  return [
    { label: 'Complete company profile', done: hasName, to: '/dashboard/company-profile' },
    { label: 'Create your first project', done: false, to: '/dashboard/projects/new' },
    { label: 'Search & hire crew', done: false, to: '/dashboard/search' },
    { label: 'Lock your team!', done: false, to: '/dashboard' },
  ];
}

export default function OnboardingChecklist() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const storageKey = user ? `crewcall_onboarding_dismissed_${user.id}` : null;

  useEffect(() => {
    if (storageKey && localStorage.getItem(storageKey) === 'true') {
      setDismissed(true);
    }
  }, [storageKey]);

  const { data: profile } = useApiQuery<ProfileMe>(user ? '/profile/me' : null);

  const steps = getSteps(user?.role ?? '', profile);
  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  const handleDismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, 'true');
    setDismissed(true);
  };

  // Don't show if dismissed, all done, or profile loaded but name already set (not a new user)
  if (dismissed || allDone || !user) return null;

  // Only show if there's something to do (not all steps done)
  if (steps.length === 0) return null;

  const pct = Math.round((completedCount / steps.length) * 100);

  // Progress ring calculations
  const ringSize = 36;
  const strokeWidth = 3;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 border border-neutral-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#3B5BDB] via-[#4E6AE0] to-[#5B9DF9] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.06] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-8 w-16 h-16 bg-white/[0.04] rounded-full translate-y-1/2" />
        <div className="flex items-center gap-3 relative">
          {/* Progress ring */}
          <div className="relative shrink-0">
            <svg width={ringSize} height={ringSize} className="-rotate-90">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="white"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
              {completedCount}/{steps.length}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm">Get started</p>
            <p className="text-white/60 text-[11px] font-medium">{pct}% complete</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 relative">
          <button onClick={() => setCollapsed((c) => !c)} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
            {collapsed ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
          </button>
          <button onClick={handleDismiss} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
            <FaXmark className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-neutral-100">
        <div
          className="h-0.5 bg-gradient-to-r from-[#3B5BDB] to-[#5B9DF9] transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="p-4 space-y-1">
          {steps.map((step, i) => (
            <Link
              key={i}
              to={step.to}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 group ${step.done ? 'opacity-50' : 'hover:bg-[#EEF4FF]/60'}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold transition-all duration-200 ${
                step.done
                  ? 'bg-gradient-to-br from-[#3B5BDB] to-[#5B9DF9] text-white shadow-sm shadow-[#3B5BDB]/20'
                  : 'bg-neutral-100 text-neutral-400 border border-neutral-200/60 group-hover:border-[#3B5BDB]/30 group-hover:bg-[#EEF4FF] group-hover:text-[#3B5BDB]'
              }`}>
                {step.done ? <FaCheck className="text-[9px]" /> : <span>{i + 1}</span>}
              </div>
              <span className={`text-xs font-medium leading-tight ${step.done ? 'text-neutral-400 line-through' : 'text-neutral-700 group-hover:text-[#3B5BDB]'}`}>
                {step.label}
              </span>
            </Link>
          ))}

          <button
            onClick={handleDismiss}
            className="w-full text-center text-[11px] text-neutral-400 hover:text-neutral-600 py-2 mt-2 rounded-lg hover:bg-neutral-50 transition-all font-medium"
          >
            Dismiss checklist
          </button>
        </div>
      )}
    </div>
  );
}
