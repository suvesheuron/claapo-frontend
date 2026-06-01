import { useMemo, useState } from 'react';
import {
  FaImage, FaFilm, FaFileLines, FaTrash, FaArrowUpRightFromSquare, FaPlay,
} from 'react-icons/fa6';
import MediaLightbox from '../MediaLightbox';

export type ShowcaseMediaType = 'image' | 'video' | 'document';

export interface ShowcaseItem {
  id: string;
  title: string;
  mediaType: ShowcaseMediaType;
  fileName?: string | null;
  mimeType?: string | null;
  url: string | null;
  createdAt?: string;
}

type FilterKey = 'all' | ShowcaseMediaType;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'image', label: 'Images' },
  { key: 'video', label: 'Videos' },
  { key: 'document', label: 'Documents' },
];

interface WorkShowcaseProps {
  items: ShowcaseItem[];
  /** When true, shows a delete button on each card. */
  editable?: boolean;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
  /** Message shown when there are no items at all. */
  emptyMessage?: string;
}

/**
 * Filterable gallery of a cast member's Work Showcase — images, videos and
 * documents. Shared between the cast's own profile (editable) and the public
 * profile view (read-only). Audio is intentionally not supported.
 *
 * Images and videos open in an in-app lightbox (we never navigate the browser
 * to the raw signed S3 URL — that leaks the storage host and looks broken).
 * Documents open in a new tab since they're meant to be downloaded/read.
 */
export default function WorkShowcase({
  items,
  editable = false,
  onDelete,
  deletingId,
  emptyMessage = 'No work showcased yet.',
}: WorkShowcaseProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [preview, setPreview] = useState<ShowcaseItem | null>(null);

  // Only show filter tabs for categories that actually have items, but always
  // show "All" so the control never collapses to a single useless tab.
  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: items.length, image: 0, video: 0, document: 0 };
    for (const it of items) c[it.mediaType] += 1;
    return c;
  }, [items]);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.mediaType === filter)),
    [items, filter],
  );

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center">
        <FaFilm className="text-neutral-400 text-2xl mx-auto mb-2" />
        <p className="text-sm font-semibold text-neutral-700">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.filter((f) => f.key === 'all' || counts[f.key] > 0).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filter === f.key
                ? 'bg-[#3678F1] text-white border-[#3678F1]'
                : 'bg-white text-neutral-600 border-neutral-300 hover:border-[#3678F1] hover:text-[#3678F1]'
            }`}
          >
            {f.label}
            <span className={`ml-1.5 ${filter === f.key ? 'text-white/80' : 'text-neutral-400'}`}>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {visible.map((item) => (
          <ShowcaseCard
            key={item.id}
            item={item}
            editable={editable}
            deleting={deletingId === item.id}
            onOpen={() => setPreview(item)}
            onDelete={onDelete ? () => onDelete(item.id) : undefined}
          />
        ))}
      </div>

      <MediaLightbox
        media={preview && preview.mediaType !== 'document' && preview.url
          ? { url: preview.url, type: preview.mediaType, title: preview.title }
          : null}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}

function ShowcaseCard({
  item, editable, deleting, onOpen, onDelete,
}: {
  item: ShowcaseItem;
  editable?: boolean;
  deleting?: boolean;
  onOpen: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="group relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
      {/* Media preview */}
      {item.mediaType === 'image' && item.url ? (
        <button type="button" onClick={onOpen} className="block w-full aspect-square bg-neutral-100" aria-label={`Open ${item.title}`}>
          <img src={item.url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
        </button>
      ) : item.mediaType === 'video' && item.url ? (
        <button type="button" onClick={onOpen} className="relative block w-full aspect-square bg-black" aria-label={`Play ${item.title}`}>
          {/* First frame as a poster; clicking opens the full player. */}
          <video src={item.url} muted preload="metadata" className="w-full h-full object-cover pointer-events-none" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center">
              <FaPlay className="text-white text-sm ml-0.5" />
            </span>
          </span>
        </button>
      ) : (
        <a
          href={item.url ?? '#'}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center gap-2 aspect-square bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] text-[#3678F1] hover:from-[#DBEAFE] hover:to-[#c7defb] transition-colors"
        >
          <FaFileLines className="text-3xl" />
          <span className="text-[11px] font-semibold inline-flex items-center gap-1">
            Open <FaArrowUpRightFromSquare className="text-[9px]" />
          </span>
        </a>
      )}

      {/* Type badge */}
      <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-semibold backdrop-blur-sm pointer-events-none">
        {item.mediaType === 'image' ? <FaImage /> : item.mediaType === 'video' ? <FaFilm /> : <FaFileLines />}
        {item.mediaType === 'image' ? 'Image' : item.mediaType === 'video' ? 'Video' : 'Doc'}
      </span>

      {/* Delete */}
      {editable && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          title="Remove"
          aria-label="Remove item"
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-[#F40F02] shadow-sm flex items-center justify-center hover:bg-white disabled:opacity-60"
        >
          {deleting
            ? <span className="w-3 h-3 border-2 border-[#F40F02]/30 border-t-[#F40F02] rounded-full animate-spin" />
            : <FaTrash className="text-[11px]" />}
        </button>
      )}

      {/* Title */}
      <div className="px-2.5 py-2 bg-white">
        <p className="text-xs font-semibold text-neutral-800 truncate" title={item.title}>
          {item.title || item.fileName || 'Untitled'}
        </p>
      </div>
    </div>
  );
}

