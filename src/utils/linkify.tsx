import { Fragment, type ReactNode } from 'react';

// Matches http(s):// URLs and bare www. URLs. Deliberately conservative so it
// doesn't munch trailing punctuation that isn't part of the URL.
const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

/**
 * Splits a string into plain text + clickable URL anchors. Used inside chat
 * message bubbles so users can tap a link instead of having to copy/paste it.
 */
export function linkifyText(text: string | null | undefined, linkClassName?: string): ReactNode {
  if (!text) return text ?? '';
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  // Reset regex state — global regexes carry lastIndex between calls.
  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(text)) !== null) {
    const raw = match[0];
    // Strip trailing punctuation that often follows a URL in prose
    // (e.g. "see https://x.com.").
    const trimmedRaw = raw.replace(/[.,!?;:)\]}>]+$/, '');
    const trailing = raw.slice(trimmedRaw.length);
    const start = match.index;
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));
    const href = trimmedRaw.startsWith('http') ? trimmedRaw : `https://${trimmedRaw}`;
    nodes.push(
      <a
        key={`lnk-${start}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        // Stop the parent message bubble's context-menu / click handlers from
        // swallowing the navigation when the user taps the link.
        onClick={(e) => e.stopPropagation()}
        className={linkClassName ?? 'underline break-all hover:opacity-80'}
      >
        {trimmedRaw}
      </a>,
    );
    if (trailing) nodes.push(trailing);
    lastIndex = start + raw.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.map((n, i) => <Fragment key={i}>{n}</Fragment>);
}
