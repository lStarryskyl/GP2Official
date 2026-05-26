import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  FolderKanban,
  Search,
  User as UserIcon,
  X,
} from 'lucide-react';

export interface PhaseActivityEntry {
  key: string;
  phaseId: string;
  phaseTitle: string;
  stepNumber: number;
  completedAt?: string | null;
  confirmer?: string | null;
  note?: string | null;
  projectId?: string;
  projectName?: string;
}

interface PhaseActivityTimelineProps {
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  entries: PhaseActivityEntry[];
  showProject?: boolean;
  previewNotes?: boolean;
  notePreviewLength?: number;
  showFilters?: boolean;
  onEntryClick?: (entry: PhaseActivityEntry) => void;
}

export const PhaseActivityTimeline: React.FC<PhaseActivityTimelineProps> = ({
  title = 'Project Activity',
  description = 'Audit trail of every confirmed phase completion across the project.',
  emptyTitle = 'No phase completions yet',
  emptyDescription = 'Once a teammate confirms a phase, the event will appear here with their note.',
  entries,
  showProject = false,
  previewNotes = false,
  notePreviewLength = 160,
  showFilters = false,
  onEntryClick,
}) => {
  const [confirmerFilter, setConfirmerFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');

  const confirmerOptions = useMemo(() => {
    if (!showFilters) return [];
    const set = new Map<string, string>();
    entries.forEach((entry) => {
      const name = (entry.confirmer || '').trim();
      if (name) set.set(name.toLowerCase(), name);
    });
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
  }, [entries, showFilters]);

  const trimmedSearch = searchText.trim();

  const filteredEntries = useMemo(() => {
    if (!showFilters) return entries;
    const fromTs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : null;
    const toTs = dateTo ? new Date(dateTo + 'T23:59:59.999').getTime() : null;
    const needle = trimmedSearch.toLowerCase();

    return entries.filter((entry) => {
      if (confirmerFilter !== 'all') {
        const name = (entry.confirmer || '').trim().toLowerCase();
        if (name !== confirmerFilter) return false;
      }
      const ts = entry.completedAt ? new Date(entry.completedAt).getTime() : null;
      if (fromTs !== null) {
        if (ts === null || ts < fromTs) return false;
      }
      if (toTs !== null) {
        if (ts === null || ts > toTs) return false;
      }
      if (needle) {
        const note = (entry.note || '').toLowerCase();
        if (!note.includes(needle)) return false;
      }
      return true;
    });
  }, [entries, showFilters, confirmerFilter, dateFrom, dateTo, trimmedSearch]);

  const filtersActive =
    showFilters &&
    (confirmerFilter !== 'all' || dateFrom !== '' || dateTo !== '' || trimmedSearch !== '');

  const clearFilters = () => {
    setConfirmerFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearchText('');
  };

  const renderHighlightedNote = (note: string) => {
    if (!showFilters || !trimmedSearch) return note;
    const escaped = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = note.split(regex);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <mark
          key={i}
          className="bg-yellow-300/30 text-yellow-100 rounded px-0.5"
        >
          {part}
        </mark>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      ),
    );
  };

  const hasAnyEvents = entries.length > 0;
  const hasMatchingEvents = filteredEntries.length > 0;

  return (
    <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl p-4 sm:p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">{description}</p>
        </div>
        <span className="text-xs font-medium text-[var(--text-muted)] px-2.5 py-1 rounded-full bg-[var(--brand-800)] border border-[var(--brand-700)]">
          {filtersActive
            ? `${filteredEntries.length} of ${entries.length}`
            : `${entries.length} ${entries.length === 1 ? 'event' : 'events'}`}
        </span>
      </div>

      {showFilters && hasAnyEvents && (
        <div className="mb-4 rounded-xl border border-[var(--brand-700)]/60 bg-[var(--brand-800)]/60 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter & Search</span>
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-[var(--blue-400)] hover:text-[var(--blue-300)] normal-case tracking-normal"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                Confirmer
              </label>
              <select
                value={confirmerFilter}
                onChange={(e) => setConfirmerFilter(e.target.value)}
                className="w-full text-sm bg-[var(--brand-900)] border border-[var(--brand-700)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue-400)]"
              >
                <option value="all">All confirmers</option>
                {confirmerOptions.map((name) => (
                  <option key={name} value={name.toLowerCase()}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
                className="w-full text-sm bg-[var(--brand-900)] border border-[var(--brand-700)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue-400)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className="w-full text-sm bg-[var(--brand-900)] border border-[var(--brand-700)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue-400)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                Search notes
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-faint)] pointer-events-none" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search note text…"
                  className="w-full text-sm bg-[var(--brand-900)] border border-[var(--brand-700)] rounded-lg pl-7 pr-7 py-1.5 text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--blue-400)]"
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--brand-700)] text-[var(--text-faint)] hover:text-[var(--text-primary)]"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasAnyEvents ? (
        <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-xl border border-dashed border-[var(--brand-700)] bg-[var(--brand-800)]/40">
          <Clock className="h-8 w-8 text-[var(--text-faint)] mb-2" />
          <p className="text-sm font-medium text-[var(--text-primary)]">{emptyTitle}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">{emptyDescription}</p>
        </div>
      ) : !hasMatchingEvents ? (
        <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-xl border border-dashed border-[var(--brand-700)] bg-[var(--brand-800)]/40">
          <Search className="h-8 w-8 text-[var(--text-faint)] mb-2" />
          <p className="text-sm font-medium text-[var(--text-primary)]">No matching activity</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
            Try adjusting the confirmer, date range, or search text to widen your results.
          </p>
          <button
            onClick={clearFilters}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--blue-400)] hover:text-[var(--blue-300)]"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </button>
        </div>
      ) : (
        <ol className="relative border-l border-[var(--brand-700)]/70 ml-2 space-y-5">
          {filteredEntries.map((entry) => {
            const completedAt = entry.completedAt ? new Date(entry.completedAt) : null;
            const confirmer = entry.confirmer || 'A team member';
            const fullNote = (entry.note || '').trim();
            const collapsed = fullNote.replace(/\s+/g, ' ');
            const truncated = previewNotes && collapsed.length > notePreviewLength;
            const note = previewNotes
              ? truncated
                ? `${collapsed.slice(0, notePreviewLength).trimEnd()}…`
                : collapsed
              : fullNote;
            const clickable = Boolean(onEntryClick);
            return (
              <li key={entry.key} className="ml-5">
                <span className="absolute -left-[7px] flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[var(--blue-400)] ring-4 ring-[var(--brand-850)]">
                  <CheckCircle2 className="h-2.5 w-2.5 text-[var(--brand-900)]" />
                </span>
                <div className="rounded-xl border border-[var(--brand-700)]/60 bg-[var(--brand-800)] p-4 hover:border-[var(--blue-400)]/50 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        disabled={!clickable}
                        onClick={() => onEntryClick?.(entry)}
                        className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--blue-400)] transition-colors flex items-center gap-1.5 text-left disabled:cursor-default disabled:hover:text-[var(--text-primary)]"
                      >
                        Phase {entry.stepNumber}: {entry.phaseTitle}
                        {clickable && <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                        {showProject && entry.projectName && (
                          <span className="inline-flex items-center gap-1">
                            <FolderKanban className="h-3 w-3" />
                            {entry.projectName}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          {confirmer}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {completedAt ? completedAt.toLocaleString() : 'Timestamp unavailable'}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-blue-900/30 text-blue-300 border border-blue-500/30">
                      Completed
                    </span>
                  </div>
                  {note ? (
                    <p className="mt-3 text-sm text-[var(--text-primary)] whitespace-pre-wrap border-l-2 border-[var(--blue-400)]/40 pl-3">
                      {renderHighlightedNote(note)}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs italic text-[var(--text-faint)]">No completion notes added.</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

export default PhaseActivityTimeline;
