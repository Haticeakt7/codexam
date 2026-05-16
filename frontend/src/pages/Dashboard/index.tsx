// ==========================================================
// Dashboard – Quiz Listesi (Ana Dashboard)
// ROUTE: /dashboard  (PrivateRoute: User + Admin)
// ==========================================================

import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMyQuizzes, useDeleteQuiz } from "@/hooks/useQuizzes";
import type { Quiz } from "@/api/types";
import DashboardLayout from "@/components/layouts/DashboardLayout";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function quizParticipationUrl(token: string) {
  return `${window.location.origin}/q/join/${token}`;
}

// ── Sortable quiz card ─────────────────────────────────────

interface QuizCardProps {
  quiz: Quiz;
  copiedId: string | null;
  onCopy: (quiz: Quiz) => void;
  onDelete: (quiz: Quiz) => void;
  onNavigate: (path: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
  statusBadge: (status: string) => React.ReactNode;
  isDndEnabled: boolean;
}

function SortableQuizCard({ quiz, copiedId, onCopy, onDelete, onNavigate, t, statusBadge, isDndEnabled }: QuizCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: quiz.id,
    disabled: !isDndEnabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        {/* Drag handle — only interactive when DnD is enabled */}
        <button
          {...(isDndEnabled ? { ...attributes, ...listeners } : {})}
          className={`flex-shrink-0 mt-0.5 p-1 rounded text-muted touch-none transition-colors ${
            isDndEnabled
              ? "hover:text-text hover:bg-surface2 cursor-grab active:cursor-grabbing"
              : "opacity-20 cursor-default"
          }`}
          title={isDndEnabled ? t("dashboard.dragToReorder") : undefined}
          tabIndex={-1}
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" className="opacity-60">
            <circle cx="3" cy="3" r="1.5"/>
            <circle cx="9" cy="3" r="1.5"/>
            <circle cx="3" cy="8" r="1.5"/>
            <circle cx="9" cy="8" r="1.5"/>
            <circle cx="3" cy="13" r="1.5"/>
            <circle cx="9" cy="13" r="1.5"/>
          </svg>
        </button>

        <h3 className="line-clamp-2 font-semibold text-text flex-1 min-w-0">{quiz.title}</h3>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {statusBadge(quiz.status)}
          {quiz.participationToken && (
            <button
              onClick={() => onCopy(quiz)}
              title={t("quiz.copyLink")}
              className={`p-1 rounded transition-colors ${
                copiedId === quiz.id
                  ? "text-green-500 bg-green-500/10"
                  : "text-muted hover:text-text hover:bg-surface2"
              }`}
            >
              {copiedId === quiz.id ? "✓" : "⎘"}
            </button>
          )}
        </div>
      </div>

      {quiz.description && (
        <p className="mb-4 line-clamp-2 text-sm text-muted">{quiz.description}</p>
      )}

      <div className="mb-4 flex items-center gap-2 text-xs text-muted mt-auto">
        <span>{quiz.durationMinutes} {t("quiz.questionCount_dk")}</span>
        <span>·</span>
        <span>{quiz.questionCount || 0} {t("quiz.questions")}</span>
        {quiz.participantCount > 0 && (
          <>
            <span>·</span>
            <span>{quiz.participantCount} {t("quiz.participants")}</span>
          </>
        )}
      </div>

      <div className="flex gap-2 border-t border-border pt-4">
        <button
          onClick={() => onNavigate(`/dashboard/quiz/${quiz.id}/settings`)}
          className="flex-1 rounded-md border border-border bg-surface2 py-2 text-sm font-semibold text-text hover:bg-border transition-colors"
        >
          {t("quiz.editBtn")}
        </button>
        <button
          onClick={() => onNavigate(`/dashboard/quiz/${quiz.id}/monitor`)}
          className="flex-1 rounded-md bg-primary/10 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          {t("quiz.monitorBtn")}
        </button>
        <button
          onClick={() => onDelete(quiz)}
          className="flex-1 rounded-md bg-red-500/10 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors"
        >
          {t("quiz.deleteBtn")}
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

const STORAGE_KEY      = "codexam_quiz_order";
const SORT_STORAGE_KEY = "codexam_quiz_sort";
const PAGE_SIZE = 9;

const STATUS_FILTERS = ["all", "Draft", "Published", "Active", "Ended", "Archived"] as const;
type SortMode = "custom" | "newest" | "oldest" | "titleAZ" | "titleZA" | "participants";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: quizzes, isLoading } = useMyQuizzes();
  const { mutate: deleteQuiz, isPending: deleting } = useDeleteQuiz();
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const navigate = useNavigate();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>(
    () => (localStorage.getItem(SORT_STORAGE_KEY) as SortMode | null) ?? "custom"
  );

  const handleSortMode = (mode: SortMode) => {
    setSortMode(mode);
    localStorage.setItem(SORT_STORAGE_KEY, mode);
  };
  const [page, setPage] = useState(1);

  // Ordered IDs (persisted in localStorage for custom sort)
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  // Sync orderedIds when quizzes load or change
  useEffect(() => {
    if (!quizzes) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedIds: string[] = saved ? JSON.parse(saved) : [];
    const quizIds = quizzes.map((q) => q.id);
    const merged = [
      ...savedIds.filter((id) => quizIds.includes(id)),
      ...quizIds.filter((id) => !savedIds.includes(id)),
    ];
    setOrderedIds(merged);
  }, [quizzes]);

  // Reset to page 1 when filter or sort changes
  useEffect(() => { setPage(1); }, [filterStatus, sortMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedIds.indexOf(active.id as string);
    const newIndex = orderedIds.indexOf(over.id as string);
    const next = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // Filter
  const filteredQuizzes = (quizzes ?? []).filter((q) =>
    filterStatus === "all" || q.status === filterStatus
  );

  // Sort
  const isDndEnabled = sortMode === "custom";
  const displayQuizzes: Quiz[] = isDndEnabled
    ? orderedIds.map((id) => filteredQuizzes.find((q) => q.id === id)).filter(Boolean) as Quiz[]
    : [...filteredQuizzes].sort((a, b) => {
        switch (sortMode) {
          case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "titleAZ": return a.title.localeCompare(b.title);
          case "titleZA": return b.title.localeCompare(a.title);
          case "participants": return (b.participantCount ?? 0) - (a.participantCount ?? 0);
          default: return 0;
        }
      });

  // Paginate
  const totalPages = Math.max(1, Math.ceil(displayQuizzes.length / PAGE_SIZE));
  const paginatedQuizzes = displayQuizzes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // IDs for DndContext must stay the full ordered set to maintain stable IDs
  const paginatedIds = paginatedQuizzes.map((q) => q.id);

  const handleCopyLink = (quiz: Quiz) => {
    if (!quiz.participationToken) return;
    navigator.clipboard.writeText(quizParticipationUrl(quiz.participationToken)).then(() => {
      setCopiedId(quiz.id);
      if (copyTimers.current[quiz.id]) clearTimeout(copyTimers.current[quiz.id]);
      copyTimers.current[quiz.id] = setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteQuiz(deleteTarget.id, {
      onSuccess: () => { setDeleteTarget(null); },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":    return <span className="bg-green-500/20 text-green-500 border border-green-500/30 px-2 py-0.5 rounded text-xs font-semibold">{t("quiz.active")}</span>;
      case "Ended":     return <span className="bg-surface2 text-muted border border-border px-2 py-0.5 rounded text-xs font-semibold">{t("quiz.ended")}</span>;
      case "Published": return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs font-semibold">{t("quiz.published")}</span>;
      case "Archived":  return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded text-xs font-semibold">{t("quiz.archived")}</span>;
      default:          return <span className="bg-surface2 text-muted border border-border px-2 py-0.5 rounded text-xs font-semibold">{t("quiz.draft")}</span>;
    }
  };

  const SORT_OPTIONS: { value: SortMode; label: string }[] = [
    { value: "custom",       label: t("dashboard.sortCustom") },
    { value: "newest",       label: t("dashboard.sortNewest") },
    { value: "oldest",       label: t("dashboard.sortOldest") },
    { value: "titleAZ",      label: t("dashboard.sortTitleAZ") },
    { value: "titleZA",      label: t("dashboard.sortTitleZA") },
    { value: "participants", label: t("dashboard.sortParticipants") },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 p-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-text">{t("dashboard.myQuizzes")}</h1>
          <Link
            to="/dashboard/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            {t("quiz.newQuizBtn")}
          </Link>
        </div>

        {/* Filter + Sort toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Status filter tabs — scrollable on mobile */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 overflow-x-auto flex-shrink-0 max-w-full">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterStatus === s
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-text hover:bg-surface2"
                }`}
              >
                {s === "all" ? t("dashboard.filterAll") : t(`quiz.status.${s.toLowerCase()}`, s)}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs text-muted flex-shrink-0">{t("dashboard.sortLabel")}:</span>
            <select
              value={sortMode}
              onChange={(e) => handleSortMode(e.target.value as SortMode)}
              className="flex-1 sm:flex-initial rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text focus:border-primary focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quiz grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : displayQuizzes.length > 0 ? (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={paginatedIds} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedQuizzes.map((quiz) => (
                    <SortableQuizCard
                      key={quiz.id}
                      quiz={quiz}
                      copiedId={copiedId}
                      onCopy={handleCopyLink}
                      onDelete={setDeleteTarget}
                      onNavigate={navigate}
                      t={t}
                      statusBadge={getStatusBadge}
                      isDndEnabled={isDndEnabled}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded border border-border bg-surface px-4 py-2 text-sm font-medium text-muted hover:text-text hover:bg-surface2 disabled:opacity-40 transition-colors"
                >
                  {t("dashboard.prevPage")}
                </button>
                <span className="text-sm text-muted">
                  {t("dashboard.pageInfo", { page, total: totalPages })}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded border border-border bg-surface px-4 py-2 text-sm font-medium text-muted hover:text-text hover:bg-surface2 disabled:opacity-40 transition-colors"
                >
                  {t("dashboard.nextPage")}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface py-16 text-center">
            <p className="mb-4 text-muted">
              {filterStatus !== "all"
                ? t("quiz.noQuizzesYet")
                : t("quiz.noQuizzesYet")}
            </p>
            {filterStatus === "all" && (
              <Link
                to="/dashboard/new"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
              >
                {t("quiz.firstQuizBtn")}
              </Link>
            )}
          </div>
        )}

        {/* Delete Confirm Dialog */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg">
              <h3 className="mb-2 text-lg font-bold text-text">{t("quiz.deleteTitle")}</h3>
              <p className="mb-6 text-sm text-muted">
                <span className="font-semibold text-text">{deleteTarget.title}</span>{" "}
                {t("quiz.deleteConfirm")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 rounded-lg border border-border bg-surface2 py-2 text-sm font-medium text-text hover:bg-border transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {deleting ? t("common.deleting") : t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
