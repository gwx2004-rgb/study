import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Gauge,
  AlertCircle,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Loader2,
  ChevronDown,
  GraduationCap,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { LucideIcon } from "lucide-react";
import { getCombinedStats } from "@/lib/chat-store";
import type { SessionStats } from "@/lib/chat-types";
import { fetchSessionProgressReport } from "@/lib/progress-report-client";
import type { ProgressReport } from "@/lib/progress-report";
import { getProfile } from "@/lib/user-store";
import {
  deleteSpeakingSession,
  formatSessionDate,
  formatSessionLabel,
  getSpeakingSessions,
  type SpeakingPracticeSession,
} from "@/lib/speaking-session-store";

export const Route = createFileRoute("/_main/assessment")({
  head: () => ({ meta: [{ title: "Progress" }] }),
  component: AssessmentPage,
});

function AssessmentPage() {
  const [stats, setStats] = useState<SessionStats | null>(() => getCombinedStats());
  const [sessions, setSessions] = useState<SpeakingPracticeSession[]>(() =>
    getSpeakingSessions()
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [reportErrors, setReportErrors] = useState<Record<string, string>>({});
  const [reports, setReports] = useState<Record<string, ProgressReport>>({});
  const [deleteTarget, setDeleteTarget] = useState<SpeakingPracticeSession | null>(
    null
  );

  useEffect(() => {
    setStats(getCombinedStats());
    setSessions(getSpeakingSessions());

    const onFocus = () => {
      setStats(getCombinedStats());
      setSessions(getSpeakingSessions());
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const refreshSessions = useCallback(() => {
    setSessions(getSpeakingSessions());
  }, []);

  const loadSessionReport = useCallback(
    async (sessionId: string, force = false) => {
      const profile = getProfile();
      if (!profile) return;

      setLoadingId(sessionId);
      setReportErrors((prev) => {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });

      try {
        const report = await fetchSessionProgressReport(sessionId, profile, force);
        setReports((prev) => ({ ...prev, [sessionId]: report }));
        refreshSessions();
      } catch (err) {
        setReportErrors((prev) => ({
          ...prev,
          [sessionId]:
            err instanceof Error ? err.message : "Could not generate report",
        }));
      } finally {
        setLoadingId(null);
      }
    },
    [refreshSessions]
  );

  async function handleViewReport(session: SpeakingPracticeSession) {
    const opening = expandedId !== session.id;
    setExpandedId(opening ? session.id : null);

    if (!opening) return;

    const existing = session.report ?? reports[session.id];
    if (existing) {
      setReports((prev) => ({ ...prev, [session.id]: existing }));
      return;
    }

    await loadSessionReport(session.id);
  }

  function confirmDeleteSession() {
    if (!deleteTarget) return;
    deleteSpeakingSession(deleteTarget.id);
    setSessions(getSpeakingSessions());
    if (expandedId === deleteTarget.id) setExpandedId(null);
    setReports((prev) => {
      const next = { ...prev };
      delete next[deleteTarget.id];
      return next;
    });
    setReportErrors((prev) => {
      const next = { ...prev };
      delete next[deleteTarget.id];
      return next;
    });
    setDeleteTarget(null);
  }

  const words = stats?.totalWords ?? 0;
  const fluency = stats?.avgWordsPerMessage ?? 0;
  const errors = (stats?.grammarIssues ?? []).slice(0, 5).map((e) => ({
    label: e.category,
    count: 1,
  }));
  const daily = [0, 0, 0, 0, 0, 0, stats?.userMessages ?? 0];

  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-8 space-y-4">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI insights from your chats with Sofia
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/vocabulary" className="block">
          <StatCard
            icon={BookOpen}
            label="Vocabulary"
            value={words.toString()}
            unit="words"
            hint="Tap to review this week"
          />
        </Link>
        <StatCard
          icon={Gauge}
          label="Fluency"
          value={fluency.toFixed(1)}
          unit="w/msg"
        />
      </div>

      <Card title="Common grammar slips" icon={AlertCircle}>
        {errors.length === 0 ? (
          <Empty text="No data yet — say something to Sofia." />
        ) : (
          <ul className="space-y-2">
            {errors.map((e) => (
              <li key={e.label} className="flex justify-between text-sm">
                <span>{e.label}</span>
                <span className="text-muted-foreground">{e.count}×</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <SpeakingReportsSection
        sessions={sessions}
        expandedId={expandedId}
        loadingId={loadingId}
        reports={reports}
        reportErrors={reportErrors}
        onViewReport={handleViewReport}
        onRegenerate={(id) => void loadSessionReport(id, true)}
        onDelete={setDeleteTarget}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete practice record?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${formatSessionLabel(deleteTarget)}" and its report will be removed. This cannot be undone.`
                : "This record will be removed permanently."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card title="Last 7 days" icon={MessageSquare}>
        <div className="flex items-end gap-2 h-24">
          {daily.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-md bg-primary/20"
              style={{ height: `${Math.max(6, v * 8)}px` }}
              title={`Day ${i + 1}: ${v}`}
            />
          ))}
        </div>
      </Card>

      {stats && stats.userMessages > 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          {stats.sessionDurationMinutes.toFixed(0)} min · {stats.userMessages}{" "}
          messages sent
        </p>
      )}
    </div>
  );
}

function SpeakingReportsSection({
  sessions,
  expandedId,
  loadingId,
  reports,
  reportErrors,
  onViewReport,
  onRegenerate,
  onDelete,
}: {
  sessions: SpeakingPracticeSession[];
  expandedId: string | null;
  loadingId: string | null;
  reports: Record<string, ProgressReport>;
  reportErrors: Record<string, string>;
  onViewReport: (session: SpeakingPracticeSession) => void;
  onRegenerate: (sessionId: string) => void;
  onDelete: (session: SpeakingPracticeSession) => void;
}) {
  return (
    <Card title="Speaking practice reports" icon={Sparkles}>
      {sessions.length === 0 ? (
        <Empty text="Finish an IELTS/TOEFL speaking session to see records here." />
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => {
            const expanded = expandedId === session.id;
            const report = reports[session.id] ?? session.report;
            const loading = loadingId === session.id;

            return (
              <li
                key={session.id}
                className="rounded-xl border border-border overflow-hidden"
              >
                <div className="p-3 bg-secondary/40">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                      <GraduationCap size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm leading-snug">
                        {formatSessionLabel(session)}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {formatSessionDate(session.endedAt)} · {session.userMessageCount}{" "}
                        {session.userMessageCount === 1 ? "reply" : "replies"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(session)}
                      disabled={loading}
                      className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition disabled:opacity-40"
                      aria-label="Delete practice record"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onViewReport(session)}
                    disabled={loading}
                    className="mt-3 w-full py-2 rounded-lg bg-background text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-accent transition disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        {expanded ? "Hide report" : report ? "View report" : "Generate report"}
                        <ChevronDown
                          size={14}
                          className={`transition ${expanded ? "rotate-180" : ""}`}
                        />
                      </>
                    )}
                  </button>
                </div>

                {expanded && report && !loading && (
                  <div className="p-3 pt-0 space-y-3 text-sm leading-relaxed border-t border-border bg-card">
                    <ReportBody report={report} />
                    <button
                      type="button"
                      disabled={loadingId === session.id}
                      onClick={() => onRegenerate(session.id)}
                      className="text-[11px] text-primary font-medium flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Regenerate
                    </button>
                  </div>
                )}

                {expanded && loading && (
                  <div className="p-4 flex flex-col items-center gap-2 text-muted-foreground border-t border-border">
                    <Loader2 size={18} className="animate-spin text-primary" />
                    <p className="text-xs">Analyzing this session…</p>
                  </div>
                )}

                {expanded && reportErrors[session.id] && !report && !loading && (
                  <div className="p-3 border-t border-border space-y-2">
                    <p className="text-xs text-destructive text-center">
                      {reportErrors[session.id]}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRegenerate(session.id)}
                      className="w-full py-2 rounded-lg bg-secondary text-xs font-medium"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function ReportBody({ report }: { report: ProgressReport }) {
  return (
    <>
      <p className="text-[15px]">{report.summary}</p>

      {report.strengths.length > 0 && (
        <ReportSection title="Strengths">
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            {report.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </ReportSection>
      )}

      {report.areasToImprove.length > 0 && (
        <ReportSection title="Areas to improve">
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            {report.areasToImprove.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </ReportSection>
      )}

      {report.vocabularyInsights && (
        <ReportSection title="Vocabulary">
          <p className="text-muted-foreground">{report.vocabularyInsights}</p>
        </ReportSection>
      )}

      {report.grammarInsights && (
        <ReportSection title="Grammar">
          <p className="text-muted-foreground">{report.grammarInsights}</p>
        </ReportSection>
      )}

      {report.speakingNotes && (
        <ReportSection title="Speaking">
          <p className="text-muted-foreground">{report.speakingNotes}</p>
        </ReportSection>
      )}

      {report.recommendations.length > 0 && (
        <ReportSection title="Recommendations">
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            {report.recommendations.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </ReportSection>
      )}
    </>
  );
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="font-semibold text-[13px] mb-1">{title}</h4>
      {children}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  hint?: string;
}) {
  return (
    <div
      className="bg-card rounded-2xl p-4 text-left h-full"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon size={14} /> {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      {hint && (
        <p className="text-[10px] text-primary mt-1.5 font-medium">{hint}</p>
      )}
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-card rounded-2xl p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-[15px]">
        <Icon size={16} className="text-primary" /> {title}
      </h3>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground py-4 text-center">{text}</div>;
}
