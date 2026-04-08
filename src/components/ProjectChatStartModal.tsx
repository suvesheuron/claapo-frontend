import { Link } from 'react-router-dom';
import { FaMessage, FaPlus, FaTriangleExclamation, FaXmark } from 'react-icons/fa6';
import { useApiQuery } from '../hooks/useApiQuery';

interface ProjectItem {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface ProjectsResponse {
  items?: ProjectItem[];
}

interface ProjectChatStartModalProps {
  isOpen: boolean;
  targetLabel: string;
  onClose: () => void;
  onStartChat: (projectId: string) => void;
}

const selectableStatuses = new Set(['draft', 'open', 'active', 'in_progress', 'completed']);

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export default function ProjectChatStartModal({
  isOpen,
  targetLabel,
  onClose,
  onStartChat,
}: ProjectChatStartModalProps) {
  const { data, loading, error } = useApiQuery<ProjectsResponse>(isOpen ? '/projects?limit=100' : null);
  const projects = (data?.items ?? [])
    .filter((project) => selectableStatuses.has(project.status))
    .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Start Project Chat</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Select a project before chatting with {targetLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
            aria-label="Close"
          >
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((x) => (
                <div key={x} className="h-16 rounded-xl bg-neutral-100 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
              <FaTriangleExclamation className="text-red-500 text-sm shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-snug">{error}</p>
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm font-semibold text-neutral-800">No projects available for chat.</p>
              <p className="text-xs text-neutral-500 mt-1 mb-4">Create a project first, then start a project-wise chat.</p>
              <Link
                to="/dashboard/projects/new"
                className="rounded-xl inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B5BDB] text-white text-sm font-semibold hover:bg-[#2f4ac2] transition-colors"
                onClick={onClose}
              >
                <FaPlus className="w-3 h-3" /> Create Project
              </Link>
            </div>
          )}

          {!loading && !error && projects.length > 0 && (
            <div className="space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onStartChat(project.id)}
                  className="w-full text-left rounded-xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{project.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{formatDateRange(project.startDate, project.endDate)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF4FF] text-[#3B5BDB] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      <FaMessage className="w-2.5 h-2.5" /> Chat
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
