import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaXmark, FaChevronDown, FaChevronUp } from 'react-icons/fa6';
import { useAuth } from '../contexts/AuthContext';
import { useApiQuery } from '../hooks/useApiQuery';

interface ProfileMe {
  displayName?: string;
  companyName?: string;
  skills?: string[];
  dailyRateMin?: number | null;
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
  const hasRate = !!(profile.dailyRateMin);
  const hasSkills = !!(profile.skills?.length);
  const hasAvailability = !!(
    (profile.availabilitySlots && (profile.availabilitySlots as unknown[]).length > 0) ||
    (profile.availabilities && (profile.availabilities as unknown[]).length > 0)
  );

  if (role === 'individual') {
    return [
      { label: 'Complete your profile', done: hasName, to: '/dashboard/profile' },
      { label: 'Add your skills & rate', done: hasSkills && hasRate, to: '/dashboard/profile' },
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

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#3678F1] to-[#5B9DF9]">
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Get started</p>
          <p className="text-white/70 text-xs">{completedCount} of {steps.length} steps complete</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCollapsed((c) => !c)} className="text-white/70 hover:text-white p-1 transition-colors">
            {collapsed ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
          </button>
          <button onClick={handleDismiss} className="text-white/70 hover:text-white p-1 transition-colors">
            <FaXmark className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-neutral-100">
        <div
          className="h-1 bg-[#3678F1] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="p-3 space-y-1.5">
          {steps.map((step, i) => (
            <Link
              key={i}
              to={step.to}
              className={`flex items-center gap-3 p-2 rounded-xl transition-colors group ${step.done ? 'opacity-60' : 'hover:bg-[#EEF4FF]'}`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${step.done ? 'bg-[#3678F1] border-[#3678F1]' : 'border-neutral-300 group-hover:border-[#3678F1]'}`}>
                {step.done && <FaCheck className="text-white text-[8px]" />}
              </div>
              <span className={`text-xs font-medium ${step.done ? 'text-neutral-400 line-through' : 'text-neutral-700 group-hover:text-[#3678F1]'}`}>
                {step.label}
              </span>
            </Link>
          ))}

          <button
            onClick={handleDismiss}
            className="w-full text-center text-xs text-neutral-400 hover:text-neutral-600 py-1 mt-1 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
