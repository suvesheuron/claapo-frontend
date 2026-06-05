import { useEffect, useState } from 'react';
import { FaEnvelope, FaPhone } from 'react-icons/fa6';
import { api } from '../../services/api';

/**
 * Two Public/Private switches that control whether the user's email and phone
 * appear on their PUBLIC profile. Role-agnostic — shared by every Edit Profile
 * page. Persists immediately via PATCH /profile/contact-visibility.
 */
export default function ContactVisibilityToggles({
  email,
  phone,
  initialEmailPublic,
  initialPhonePublic,
  disabled = false,
}: {
  email?: string | null;
  phone?: string | null;
  initialEmailPublic: boolean;
  initialPhonePublic: boolean;
  disabled?: boolean;
}) {
  const [emailPublic, setEmailPublic] = useState(initialEmailPublic);
  const [phonePublic, setPhonePublic] = useState(initialPhonePublic);
  const [saving, setSaving] = useState(false);

  // Keep in sync if the parent rehydrates (e.g. after a profile refetch).
  useEffect(() => { setEmailPublic(initialEmailPublic); }, [initialEmailPublic]);
  useEffect(() => { setPhonePublic(initialPhonePublic); }, [initialPhonePublic]);

  const persist = async (next: { isEmailPublic?: boolean; isPhonePublic?: boolean }) => {
    setSaving(true);
    try {
      await api.patch('/profile/contact-visibility', next);
    } catch {
      // Roll back on failure so the switch reflects the persisted state.
      if (next.isEmailPublic !== undefined) setEmailPublic((v) => !v);
      if (next.isPhonePublic !== undefined) setPhonePublic((v) => !v);
    } finally {
      setSaving(false);
    }
  };

  const Row = ({
    icon, label, value, isPublic, onToggle,
  }: {
    icon: React.ReactNode; label: string; value?: string | null; isPublic: boolean; onToggle: () => void;
  }) => (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-800">{label}</p>
          <p className="text-xs text-neutral-500 truncate">{value || '—'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <span className={`text-xs font-bold ${isPublic ? 'text-[#15803D]' : 'text-neutral-400'}`}>
          {isPublic ? 'Public' : 'Private'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          aria-label={`Make ${label.toLowerCase()} ${isPublic ? 'private' : 'public'}`}
          disabled={disabled || saving}
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${isPublic ? 'bg-[#22C55E]' : 'bg-neutral-300'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="divide-y divide-neutral-100">
      <p className="text-xs text-neutral-500 pb-2">
        Control what shows on your public profile. Hidden details stay private and aren't shown to people who view your profile.
      </p>
      <Row
        icon={<FaEnvelope className="w-3.5 h-3.5" />}
        label="Email"
        value={email}
        isPublic={emailPublic}
        onToggle={() => { const next = !emailPublic; setEmailPublic(next); persist({ isEmailPublic: next }); }}
      />
      <Row
        icon={<FaPhone className="w-3.5 h-3.5" />}
        label="Phone Number"
        value={phone}
        isPublic={phonePublic}
        onToggle={() => { const next = !phonePublic; setPhonePublic(next); persist({ isPhonePublic: next }); }}
      />
    </div>
  );
}
