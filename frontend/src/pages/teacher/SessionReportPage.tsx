import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Download,
  Loader2,
  Smile,
  X,
  Users,
  Zap,
} from "lucide-react";

import { api } from "../../lib/axios";
import { formatDate } from "../../utils/date";

type EmotionType =
  | "ABSENT"
  | "HAPPY"
  | "SAD"
  | "ANGRY"
  | "NEUTRAL"
  | "SURPRISED"
  | "FEARFUL"
  | "DISGUSTED";

type AttentionLevel = "HIGH" | "MEDIUM" | "LOW";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface SessionReport {
  session: {
    id: string;
    title: string;
    sessionCode: string;
    status: string;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
    class: {
      id: string;
      name: string;
      teacherId: string;
    };
  };
  totalLogs: number;
  averageAttention: number;
  weightedAttention: number;
  highAttentionCount: number;
  lowAttentionCount: number;
  participantCount: number;
  analyzedParticipantCount: number;
  emotionDistribution: Array<{
    emotion: EmotionType;
    count: number;
    percentage: number;
  }>;
  attentionDistribution: Array<{
    attentionLevel: AttentionLevel;
    count: number;
    percentage: number;
  }>;
  timeline: Array<{
    minute: number;
    averageAttention: number;
    logCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  }>;
  students: Array<{
    participantId: string;
    studentId: string;
    fullName: string;
    email: string;
    joinedAt: string | null;
    leftAt: string | null;
    logCount: number;
    focusedLogCount: number;
    lowAttentionCount: number;
    attentionPercentage: number;
    weightedAttention: number;
    primaryEmotion: EmotionType;
    latestEmotion: EmotionType | null;
    latestAttentionLevel: AttentionLevel | null;
    latestRecordedAt: string | null;
    timeline: Array<{
      minute: number;
      averageAttention: number;
      logCount: number;
      highCount: number;
      mediumCount: number;
      lowCount: number;
    }>;
    logs: Array<{
      index: number;
      id: string;
      emotion: EmotionType;
      confidence: number;
      attentionLevel: AttentionLevel;
      attentionScore: number;
      recordedAt: string;
      minute: number | null;
    }>;
  }>;
}

type ReportStudent = SessionReport["students"][number];

const emotionLabel: Record<EmotionType, string> = {
  ABSENT: "Absent",
  HAPPY: "Happy",
  SAD: "Sleepy/Sad",
  ANGRY: "Angry",
  NEUTRAL: "Neutral",
  SURPRISED: "Surprised",
  FEARFUL: "Fearful",
  DISGUSTED: "Disgusted",
};

const attentionLabel: Record<AttentionLevel, string> = {
  HIGH: "Focused",
  MEDIUM: "Normal",
  LOW: "Unfocused",
};

const attentionBadgeClass: Record<AttentionLevel, string> = {
  HIGH: "bg-emerald-50 text-emerald-700 border-emerald-100",
  MEDIUM: "bg-sky-50 text-sky-700 border-sky-100",
  LOW: "bg-rose-50 text-rose-700 border-rose-100",
};

const emotionBadgeClass: Record<EmotionType, string> = {
  ABSENT: "bg-slate-100 text-slate-700 border-slate-200",
  HAPPY: "bg-emerald-50 text-emerald-700 border-emerald-100",
  NEUTRAL: "bg-sky-50 text-sky-700 border-sky-100",
  SAD: "bg-rose-50 text-rose-700 border-rose-100",
  ANGRY: "bg-orange-50 text-orange-700 border-orange-100",
  SURPRISED: "bg-amber-50 text-amber-700 border-amber-100",
  FEARFUL: "bg-violet-50 text-violet-700 border-violet-100",
  DISGUSTED: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
};

const studentLineColors = [
  "#0284c7",
  "#059669",
  "#dc2626",
  "#7c3aed",
  "#d97706",
  "#0891b2",
  "#be185d",
  "#16a34a",
];

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const formatPercent = (value: number) => `${Math.round(value)}%`;

const formatDuration = (
  startAt: string | null,
  endAt: string | null,
  fallbackEndAt: string | null,
) => {
  if (!startAt) return "0m";

  const start = new Date(startAt).getTime();
  const end = new Date(endAt ?? fallbackEndAt ?? Date.now()).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return "0m";
  }

  const totalMinutes = Math.round((end - start) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const downloadReportCsv = (report: SessionReport) => {
  const rows = [
    [
      "Student",
      "Email",
      "Attention Percentage",
      "Weighted Attention",
      "Duration",
      "Primary Emotion",
      "Latest Attention",
      "Total Logs",
      "Low Attention Logs",
    ],
    ...report.students.map((student) => [
      student.fullName,
      student.email,
      String(student.attentionPercentage),
      String(student.weightedAttention),
      formatDuration(
        student.joinedAt,
        student.leftAt,
        report.session.endedAt ?? student.latestRecordedAt,
      ),
      student.primaryEmotion,
      student.latestAttentionLevel ?? "",
      String(student.logCount),
      String(student.lowAttentionCount),
    ]),
  ];
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report.session.title || "session"}-report.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export default function SessionReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedStudent, setSelectedStudent] = useState<ReportStudent | null>(
    null,
  );
  const sessionId = searchParams.get("sessionId");

  const {
    data: report,
    isLoading,
    isError,
    error,
  } = useQuery<SessionReport>({
    queryKey: ["session-report", sessionId],
    enabled: Boolean(sessionId),
    queryFn: async () => {
      const response = (await api.get<ApiEnvelope<SessionReport>>(
        `/emotions/sessions/${sessionId}/emotions/report`,
      )) as unknown as ApiEnvelope<SessionReport>;
      return response.data;
    },
  });

  const engagementChartData = useMemo(() => {
    if (!report) return [];

    const rows = new Map<number, Record<string, number>>();
    const ensureRow = (minute: number): Record<string, number> => {
      const existing = rows.get(minute);
      if (existing) return existing;
      const row: Record<string, number> = { minute };
      rows.set(minute, row);
      return row;
    };

    report.timeline.forEach((point) => {
      ensureRow(point.minute).average = point.averageAttention;
    });
    report.students.forEach((student, index) => {
      student.timeline.forEach((point) => {
        ensureRow(point.minute)[`student_${index}`] = point.averageAttention;
      });
    });

    return Array.from(rows.values()).sort((a, b) => a.minute - b.minute);
  }, [report]);
  const dominantEmotion = report?.emotionDistribution.reduce(
    (best, item) => (item.count > best.count ? item : best),
    { emotion: "NEUTRAL" as EmotionType, count: 0, percentage: 0 },
  );
  const lowAttentionRate =
    report && report.totalLogs > 0
      ? (report.lowAttentionCount / report.totalLogs) * 100
      : 0;

  if (!sessionId) {
    return (
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl p-8 text-center">
        <AlertTriangle className="mx-auto text-amber-500 mb-4" size={36} />
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Missing session report
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Please open this page from Session History so the sessionId is
          included.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-xs font-bold tracking-widest text-white hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          GO BACK
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-500">
        <Loader2 className="animate-spin text-blue-600" size={44} />
        <p className="font-bold text-xs uppercase tracking-widest text-slate-400">
          Loading AI session report...
        </p>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="max-w-4xl mx-auto bg-white border border-rose-200 rounded-xl p-8 text-center">
        <AlertTriangle className="mx-auto text-rose-500 mb-4" size={36} />
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Cannot load report
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          {error instanceof Error ? error.message : "Please try again later."}
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-xs font-bold tracking-widest text-white hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          GO BACK
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-11 h-11 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {report.session.title}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              {report.session.class.name} - Code {report.session.sessionCode} -
              {formatDate(report.session.createdAt)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => downloadReportCsv(report)}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg text-xs font-bold tracking-widest transition-colors shadow-md shadow-slate-900/10"
        >
          <Download size={16} />
          EXPORT CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
            <Zap size={20} />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {formatPercent(report.averageAttention)}
          </div>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
            Overall Focus
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center mb-4">
            <BarChart3 size={20} />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {formatPercent(report.weightedAttention)}
          </div>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
            Weighted Score
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center mb-4">
            <Users size={20} />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {report.analyzedParticipantCount}/{report.participantCount}
          </div>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
            Students Analyzed
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mb-4">
            <AlertTriangle size={20} />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {formatPercent(lowAttentionRate)}
          </div>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
            Unfocused Rate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm min-h-[340px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Engagement Timeline
              </h3>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Average and per-student attention by 5-minute bucket
              </span>
            </div>
            <span className="bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest">
              {report.totalLogs} LOGS
            </span>
          </div>

          <div className="h-64 w-full">
            {engagementChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={engagementChartData}
                  margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
                >
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="minute"
                    tickFormatter={(minute) => `${minute}m`}
                    tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${Math.round(Number(value))}%`]}
                    labelFormatter={(minute) => `Minute ${minute}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                  <Line
                    type="monotone"
                    dataKey="average"
                    name="Average"
                    stroke="#0f172a"
                    strokeWidth={4}
                    connectNulls
                    dot={{ r: 4 }}
                  />
                  {report.students.map((student, index) => (
                    <Line
                      key={student.participantId}
                      type="monotone"
                      dataKey={`student_${index}`}
                      name={student.fullName}
                      stroke={
                        studentLineColors[index % studentLineColors.length]
                      }
                      strokeWidth={2}
                      connectNulls
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-400">
                No engagement data was recorded for this session.
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-950 text-white rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-emerald-400">
              <Smile size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Emotion Summary</h4>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">
                Dominant: {emotionLabel[dominantEmotion?.emotion ?? "NEUTRAL"]}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {report.emotionDistribution
              .filter((item) => item.count > 0)
              .map((item) => (
                <div key={item.emotion}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span>{emotionLabel[item.emotion]}</span>
                    <span>{formatPercent(item.percentage)}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${clampPercent(item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}

            {report.totalLogs === 0 && (
              <p className="text-sm text-slate-400 font-medium">
                No AI logs were recorded for this session yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
          <Users size={20} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Student Participation Breakdown
        </h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70">
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">
                  Student
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">
                  Attention
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">
                  Duration
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">
                  Emotion
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">
                  Latest State
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase text-right">
                  Logs
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.students.map((student) => (
                <tr
                  key={student.participantId}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-slate-900">
                      {student.fullName}
                    </div>
                    <div className="text-xs font-medium text-slate-400 mt-1">
                      {student.email}
                    </div>
                  </td>
                  <td className="px-6 py-5 min-w-[220px]">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-900 w-10">
                        {formatPercent(student.attentionPercentage)}
                      </span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            student.attentionPercentage >= 80
                              ? "bg-emerald-400"
                              : student.attentionPercentage >= 50
                                ? "bg-sky-400"
                                : "bg-rose-400"
                          }`}
                          style={{
                            width: `${clampPercent(student.attentionPercentage)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">
                    {formatDuration(
                      student.joinedAt,
                      student.leftAt,
                      report.session.endedAt ?? student.latestRecordedAt,
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex border px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest ${emotionBadgeClass[student.primaryEmotion]}`}
                    >
                      {emotionLabel[student.primaryEmotion]}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {student.latestAttentionLevel ? (
                      <span
                        className={`inline-flex border px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest ${attentionBadgeClass[student.latestAttentionLevel]}`}
                      >
                        {attentionLabel[student.latestAttentionLevel]}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        No data
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(student)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black tracking-widest text-sky-700 transition-colors hover:border-sky-200 hover:bg-sky-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
                      disabled={student.logCount === 0}
                    >
                      {student.logCount}
                    </button>
                  </td>
                </tr>
              ))}

              {report.students.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm font-semibold text-slate-400"
                  >
                    No approved students found for this session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-4xl max-h-[86vh] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {selectedStudent.fullName}
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {selectedStudent.logCount} AI logs -{" "}
                  {formatPercent(selectedStudent.attentionPercentage)} focused
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[64vh] overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Focused Logs
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-900">
                    {selectedStudent.focusedLogCount}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Low Attention
                  </p>
                  <p className="mt-1 text-2xl font-black text-rose-600">
                    {selectedStudent.lowAttentionCount}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Primary Emotion
                  </p>
                  <p className="mt-2">
                    <span
                      className={`inline-flex border px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest ${emotionBadgeClass[selectedStudent.primaryEmotion]}`}
                    >
                      {emotionLabel[selectedStudent.primaryEmotion]}
                    </span>
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        #
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Time
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Minute
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Emotion
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Attention
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedStudent.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs font-bold text-slate-500">
                          {log.index}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700">
                          {formatTime(log.recordedAt)}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700">
                          {log.minute !== null ? `${Math.round(log.minute)}m` : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex border px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest ${emotionBadgeClass[log.emotion]}`}
                          >
                            {emotionLabel[log.emotion]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex border px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest ${attentionBadgeClass[log.attentionLevel]}`}
                          >
                            {attentionLabel[log.attentionLevel]} -{" "}
                            {log.attentionScore}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                          {formatPercent(log.confidence)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
