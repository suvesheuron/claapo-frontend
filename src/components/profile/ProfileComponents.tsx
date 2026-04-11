import React from 'react';
import { FaInstagram, FaYoutube, FaVimeoV, FaImdb, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import { getCompletionStatus } from '../../utils/profileCompletion';

interface ProfileSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable profile section card component
 */
export function ProfileSection({ 
  title, 
  description, 
  icon, 
  children, 
  className = '' 
}: ProfileSectionProps) {
  return (
    <div className={`rounded-2xl bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {(title || description) && (
        <div className="px-5 py-4 border-b border-neutral-100 flex items-start gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0 text-brand-primary">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
            {description && (
              <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  /** @deprecated icons are no longer rendered at row level — kept for call-site compatibility */
  icon?: React.ReactNode;
  copyable?: boolean;
  className?: string;
}

/**
 * Reusable info row for displaying profile data.
 * Uses a fixed label column so every row in a section lines up.
 */
export function InfoRow({
  label,
  value,
  copyable = false,
  className = '',
}: InfoRowProps) {
  const isValueEmpty =
    value === null || value === undefined || value === '' || value === '—';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const text = typeof value === 'string' ? value : String(value ?? '');
    if (!text || text === '—') return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      className={`grid grid-cols-[140px_1fr_auto] gap-4 items-start py-3 border-b border-neutral-100 last:border-b-0 ${className}`}
    >
      <dt className="text-xs font-medium text-neutral-500 pt-0.5 uppercase tracking-wide">
        {label}
      </dt>
      <dd
        className={`text-sm leading-relaxed ${
          isValueEmpty ? 'text-neutral-400 italic' : 'text-neutral-800'
        } break-words min-w-0`}
      >
        {value || '—'}
      </dd>
      {copyable && !isValueEmpty ? (
        <button
          type="button"
          onClick={handleCopy}
          className="text-[11px] text-brand-primary hover:text-brand-primary/80 font-semibold px-2 py-1 rounded-md hover:bg-brand-primary/5 transition-colors shrink-0"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'url' | 'number' | 'textarea';
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  readOnlyReason?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  helpText?: string;
  error?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable editable field component with icon support
 */
export function EditableField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  readOnly = false,
  readOnlyReason,
  icon,
  iconPosition = 'left',
  helpText,
  error,
  rows = 3,
  disabled = false,
  className = '',
}: EditableFieldProps) {
  const inputClass = `w-full px-3 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:bg-neutral-50 disabled:text-neutral-400 placeholder:text-neutral-400 ${
    readOnly 
      ? 'border-neutral-100 bg-neutral-50/80 text-neutral-500 cursor-not-allowed' 
      : error 
        ? 'border-red-300 focus:border-red-500' 
        : 'border-neutral-300 bg-white'
  } ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''} ${className}`;

  const renderInput = () => {
    const commonProps = {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
      placeholder,
      disabled: disabled || readOnly,
      className: inputClass,
    };

    if (type === 'textarea') {
      return (
        <textarea
          {...commonProps}
          rows={rows}
          className={`${inputClass} resize-none`}
        />
      );
    }

    return (
      <input
        type={type}
        {...commonProps}
        className={inputClass}
      />
    );
  };

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {readOnly && readOnlyReason && (
          <span className="text-neutral-400 font-normal ml-2">({readOnlyReason})</span>
        )}
      </label>
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 flex items-center justify-center">
            {icon}
          </div>
        )}
        {renderInput()}
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      {helpText && !error && (
        <p className="text-[10px] text-neutral-400 mt-1">{helpText}</p>
      )}
      {error && (
        <p className="text-[10px] text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

interface SkillTagProps {
  skill: string;
  onRemove?: () => void;
  className?: string;
}

/**
 * Skill tag component for displaying skills
 */
export function SkillTag({ skill, onRemove, className = '' }: SkillTagProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20 ${className}`}>
      {skill}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:bg-brand-primary/20 rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${skill}`}
        >
          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </span>
  );
}

interface SocialLinksData {
  instagramUrl?: string | null;
  imdbUrl?: string | null;
  youtubeUrl?: string | null;
  vimeoUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  website?: string | null;
}

interface SocialLinksProps {
  links: SocialLinksData;
  editable?: boolean;
  onChange?: (field: keyof SocialLinksData, value: string) => void;
  disabled?: boolean;
}

/**
 * Social links display/edit component
 */
export function SocialLinks({ links, editable = false, onChange, disabled = false }: SocialLinksProps) {
  const socialPlatforms: { key: keyof SocialLinksData; label: string; Icon: React.ComponentType<{ className?: string }>; placeholder: string; color: string; bg: string }[] = [
    { key: 'instagramUrl', label: 'Instagram', Icon: FaInstagram, placeholder: 'https://instagram.com/username', color: 'text-[#E4405F]', bg: 'bg-[#E4405F]/10' },
    { key: 'youtubeUrl', label: 'YouTube', Icon: FaYoutube, placeholder: 'https://youtube.com/@channel', color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10' },
    { key: 'vimeoUrl', label: 'Vimeo', Icon: FaVimeoV, placeholder: 'https://vimeo.com/username', color: 'text-[#1AB7EA]', bg: 'bg-[#1AB7EA]/10' },
    { key: 'imdbUrl', label: 'IMDb', Icon: FaImdb, placeholder: 'https://imdb.com/name/...', color: 'text-[#F5C518]', bg: 'bg-[#F5C518]/10' },
    { key: 'linkedinUrl', label: 'LinkedIn', Icon: FaLinkedinIn, placeholder: 'https://linkedin.com/in/username', color: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/10' },
    { key: 'twitterUrl', label: 'X (Twitter)', Icon: FaXTwitter, placeholder: 'https://x.com/username', color: 'text-black', bg: 'bg-black/10' },
  ];

  if (editable) {
    return (
      <div className="space-y-3">
        {socialPlatforms.map(({ key, label, Icon, placeholder, color }) => (
          <EditableField
            key={key}
            label={label}
            type="url"
            value={(links[key] as string) || ''}
            onChange={(value) => onChange?.(key, value)}
            placeholder={placeholder}
            disabled={disabled}
            icon={<Icon className={`w-4 h-4 ${color}`} />}
          />
        ))}
      </div>
    );
  }

  const hasLinks = Object.values(links).some((v) => v && v !== '');

  if (!hasLinks) {
    return <p className="text-sm text-neutral-400 italic">No social links added</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {socialPlatforms.map(({ key, label, Icon, color, bg }) => {
        const url = links[key] as string | null | undefined;
        if (!url) return null;
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold ${bg} ${color} hover:opacity-80 transition-opacity`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </a>
        );
      })}
    </div>
  );
}

interface ProfileCompletionBadgeProps {
  percentage: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Profile completion badge with progress ring
 */
export function ProfileCompletionBadge({
  percentage,
  showLabel = true,
  size = 'md'
}: ProfileCompletionBadgeProps) {
  const { label, color } = getCompletionStatus(percentage);

  const sizeConfig = {
    sm: { container: 'w-12 h-12', svg: 'w-12 h-12', text: 'text-[10px]' },
    md: { container: 'w-16 h-16', svg: 'w-16 h-16', text: 'text-xs' },
    lg: { container: 'w-24 h-24', svg: 'w-24 h-24', text: 'text-sm' },
  };

  const config = sizeConfig[size];
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 5;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${config.container} shrink-0`}>
        <svg className={config.svg} viewBox="0 0 40 40">
          {/* Background circle */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 20 20)"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${config.text}`} style={{ color }}>
            {percentage}%
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="min-w-0">
          <p className="text-xs font-medium text-neutral-500 whitespace-nowrap">Profile Completion</p>
          <p className={`text-xs font-semibold truncate`} style={{ color }}>{label}</p>
        </div>
      )}
    </div>
  );
}
