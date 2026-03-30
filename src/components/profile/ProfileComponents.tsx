import React from 'react';
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
  icon?: React.ReactNode;
  copyable?: boolean;
  onCopy?: () => void;
  className?: string;
}

/**
 * Reusable info row for displaying profile data
 */
export function InfoRow({ 
  label, 
  value, 
  icon, 
  copyable = false, 
  onCopy,
  className = '' 
}: InfoRowProps) {
  const isValueEmpty = value === null || value === undefined || value === '' || value === '—';
  
  return (
    <div className={`flex items-start gap-3 py-2.5 ${className}`}>
      {icon && (
        <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5 text-neutral-500">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-[minmax(80px,120px)_1fr] gap-4 items-start">
          <dt className="text-xs font-medium text-neutral-500 pt-1">{label}</dt>
          <dd className={`text-sm ${isValueEmpty ? 'text-neutral-400' : 'text-neutral-800'} break-all`}>
            {value || '—'}
          </dd>
        </div>
      </div>
      {copyable && !isValueEmpty && onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="text-xs text-brand-primary hover:text-brand-primary/80 font-medium px-2 py-1 rounded hover:bg-brand-primary/5 transition-colors shrink-0"
        >
          Copy
        </button>
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
  website?: string | null;
  instagramUrl?: string | null;
  imdbUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
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
  const socialPlatforms = [
    { key: 'website' as const, label: 'Website', icon: '🌐', placeholder: 'https://yourwebsite.com' },
    { key: 'instagramUrl' as const, label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/username' },
    { key: 'imdbUrl' as const, label: 'IMDb', icon: '🎬', placeholder: 'https://imdb.com/name/...' },
    { key: 'linkedinUrl' as const, label: 'LinkedIn', icon: '💼', placeholder: 'https://linkedin.com/in/username' },
    { key: 'twitterUrl' as const, label: 'Twitter', icon: '🐦', placeholder: 'https://twitter.com/username' },
    { key: 'youtubeUrl' as const, label: 'YouTube', icon: '▶️', placeholder: 'https://youtube.com/@channel' },
  ];

  if (editable) {
    return (
      <div className="space-y-3">
        {socialPlatforms.map(({ key, label, icon, placeholder }) => (
          <EditableField
            key={key}
            label={`${icon} ${label}`}
            type="url"
            value={(links[key] as string) || ''}
            onChange={(value) => onChange?.(key, value)}
            placeholder={placeholder}
            disabled={disabled}
          />
        ))}
      </div>
    );
  }

  const hasLinks = Object.values(links).some(v => v && v !== '');
  
  if (!hasLinks) {
    return (
      <p className="text-sm text-neutral-400 italic">No social links added</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {socialPlatforms.map(({ key, label, icon }) => {
        const url = links[key] as string | null | undefined;
        if (!url) return null;
        
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-neutral-100 text-neutral-700 hover:bg-brand-primary hover:text-white transition-colors"
          >
            <span>{icon}</span>
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
