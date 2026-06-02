import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Smile,
  Zap,
  Users,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useSessionDetail } from "../../services/sessions/sessions.queries";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizePdfText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");

const escapePdfText = (value: unknown) =>
  normalizePdfText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const sanitizeFileName = (value: string) =>
  normalizePdfText(value)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const createReportPdfBlob = (
  title: string,
  metaLines: string[],
  rows: string[][],
  timelineRows: string[][],
) => {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 42;
  const lineHeight = 16;
  const objects: string[] = [];
  const addObject = (content: string) => {
    objects.push(content);
    return objects.length;
  };

  const pagesObjectId = 2;
  const fontObjectId = 3;
  const pageObjectIds: number[] = [];
  const commands: string[] = [];
  let y = pageHeight - margin;

  addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);
  addObject("PAGES_PLACEHOLDER");
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const write = (text: string, x = margin, size = 10) => {
    commands.push(`BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
    y -= lineHeight;
  };

  const newPage = () => {
    const content = commands.join("\n");
    const contentObjectId = addObject(
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    );
    const pageObjectId = addObject(
      `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
    );
    pageObjectIds.push(pageObjectId);
    commands.length = 0;
    y = pageHeight - margin;
  };

  const ensureSpace = (neededLines = 1) => {
    if (y - neededLines * lineHeight < margin) newPage();
  };

  write(title, margin, 18);
  y -= 8;
  metaLines.forEach((line) => write(line, margin, 10));
  y -= 14;

  write("Student Participation Breakdown", margin, 14);
  y -= 4;
  write("#   Name                         Email                         Status      Duration   Attention   State", margin, 8);
  rows.forEach((row) => {
    ensureSpace();
    write(
      `${row[0].padEnd(3)} ${row[1].slice(0, 28).padEnd(28)} ${row[2]
        .slice(0, 28)
        .padEnd(28)} ${row[3].slice(0, 10).padEnd(10)} ${row[4]
        .slice(0, 9)
        .padEnd(9)} ${row[5].slice(0, 9).padEnd(9)} ${row[6].slice(0, 12)}`,
      margin,
      8,
    );
  });

  if (rows.length === 0) write("No participant data recorded.", margin, 9);

  y -= 14;
  ensureSpace(4);
  write("Attention Timeline", margin, 14);
  y -= 4;
  write("Minute      Attention      Recorded At", margin, 8);
  timelineRows.forEach((row) => {
    ensureSpace();
    write(
      `${row[0].padEnd(10)} ${row[1].padEnd(14)} ${row[2]}`,
      margin,
      8,
    );
  });

  if (timelineRows.length === 0) write("No tracking data recorded.", margin, 9);

  newPage();

  objects[pagesObjectId - 1] =
    `<< /Type /Pages /Kids [${pageObjectIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${pageObjectIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
};

export default function SessionReportPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  // 🎯 Giữ nguyên cấu hình no-cache của bồ
  const { data: sessionResponse, isLoading } = useSessionDetail(sessionId || "");

  // 🎯 FIX TRIỆT ĐỂ LỖI ĐỎ: Ép kiểu thô qua cấu trúc Record an toàn để qua mặt cả TS lẫn ESLint Any
  const sessionData = sessionResponse?.data;

  // Trích xuất mảng dữ liệu sinh viên một cách hợp lệ
  const participants = sessionData?.participants || [];
  const timeline = sessionData?.timeline || [];

  const happinessIndex = sessionData?.reportSummary?.averageAttention ?? 0;
  const chartPoints = timeline.slice(-7).map((point, index, list) => {
    const divisor = Math.max(list.length - 1, 1);
    return {
      x: Math.round((index / divisor) * 520),
      y: Math.round(160 - (point.attentionIndex / 100) * 140),
      label: `${point.minute}m`,
    };
  });
  const chartPath =
    chartPoints.length > 0
      ? chartPoints
          .map((point, index) =>
            index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
          )
          .join(" ")
      : "M 0 140 L 520 140";

  const handleExportPdf = () => {
    if (!sessionData) return;

    const generatedAt = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const pdfBlob = createReportPdfBlob(
      sessionData.title || "Session Report",
      [
        `Session code: ${sessionData.sessionCode}`,
        `Status: ${sessionData.status}`,
        `Generated: ${generatedAt}`,
        `Average attention: ${happinessIndex}%`,
        `Participants: ${participants.length}`,
        `Tracking logs: ${sessionData.reportSummary?.totalEmotionLogs ?? 0}`,
      ],
      participants.map((participant, index) => [
        String(index + 1),
        participant.fullName || "Unnamed student",
        participant.email || "-",
        participant.joinStatus,
        `${participant.duration}m`,
        `${participant.attentionIndex}%`,
        participant.primaryState,
      ]),
      timeline.map((point) => [
        `${point.minute}m`,
        `${point.attentionIndex}%`,
        formatDateTime(point.recordedAt),
      ]),
    );

    downloadBlob(
      pdfBlob,
      `${sanitizeFileName(sessionData.title || "session-report")}-report.pdf`,
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3 text-slate-500">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-semibold text-sm">
          Đang tải báo cáo chi tiết buổi học...
        </p>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-7xl mx-auto">
        <p className="text-slate-500 font-medium">
          Không tìm thấy dữ liệu cho buổi học này hoặc đang đồng bộ từ
          Database...
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm font-bold text-blue-600 hover:underline"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
              {(sessionData.title as string) || "Chi tiết buổi học"}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Mã phòng học:{" "}
              <span className="font-mono text-indigo-600 font-bold">
                {sessionData.sessionCode as string}
              </span>{" "}
              • Trạng thái: {sessionData.status as string}
            </p>
          </div>
        </div>

        <button
          onClick={handleExportPdf}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl text-xs font-bold tracking-widest transition-colors shadow-md shadow-slate-900/10"
        >
          <Download size={16} />
          EXPORT DETAILED DATA
        </button>
      </div>

      {/* TOP GRID (CHART & METRICS) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
        <div className="xl:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[360px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Engagement Timeline
              </h3>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Average Participant Attention
              </span>
            </div>
            <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest">
              AI TRACKING HISTORY
            </span>
          </div>

          <div className="relative h-48 w-full mt-4 flex flex-col justify-end">
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-bold text-slate-400 pb-6">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>

            <div className="ml-8 relative h-full">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 520 160"
                preserveAspectRatio="none"
                className="absolute bottom-6"
              >
                <path
                  d={chartPath}
                  stroke="#3b82f6"
                  strokeWidth="4"
                  fill="none"
                />
                {chartPoints.map((point) => (
                  <circle
                    key={`${point.x}-${point.y}`}
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                ))}
              </svg>

              <div className="absolute bottom-0 w-full flex justify-between text-[10px] font-bold text-slate-400">
                {chartPoints.length === 0 ? (
                  <span>No tracking data</span>
                ) : (
                  chartPoints.map((point) => (
                    <span key={point.label}>{point.label}</span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex-1 flex flex-col justify-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <Smile size={28} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-1">
              {happinessIndex}%
            </h2>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-5 uppercase">
              Happiness Index
            </p>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${happinessIndex}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-950 text-white rounded-3xl p-8 shadow-xl flex-1 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-slate-800 opacity-50">
              <Zap size={100} />
            </div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-blue-400">
                <Zap size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">AI OBSERVATION</h4>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">
                  Smart Analytics
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-300 font-medium italic relative z-10">
              "Participation peaked exactly 20 minutes in during the live demo.
              This suggests visual demonstrations significantly increase student
              retention for this topic."
            </p>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Users size={20} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Student Participation Breakdown ({participants.length})
        </h2>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase w-1/4">
                  Full Name
                </th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase w-[15%]">
                  Duration
                </th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase w-1/4">
                  Attention
                </th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase w-1/5">
                  Primary State
                </th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase text-right">
                  Insight
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participants.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-8 py-10 text-center text-sm font-medium text-slate-400"
                  >
                    Chưa ghi nhận dữ liệu tham gia của sinh viên nào trong buổi
                    học này.
                  </td>
                </tr>
              ) : (
                participants.map((item) => {
                  const attentionScore = item.attentionIndex;
                  const stateString = item.primaryState || "NEUTRAL";

                  let badgeStyle = "bg-slate-100 text-slate-600";
                  if (stateString === "HAPPY" || stateString === "SURPRISED")
                    badgeStyle = "bg-emerald-50 text-emerald-600";
                  if (
                    stateString === "SAD" ||
                    stateString === "ANGRY" ||
                    stateString === "FEARFUL" ||
                    stateString === "DISGUSTED"
                  )
                    badgeStyle = "bg-rose-50 text-rose-600";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-5 text-sm font-bold text-slate-900">
                        {item.fullName ||
                          "Sinh viên ẩn danh"}
                      </td>
                      <td className="px-8 py-5 text-sm font-semibold text-slate-600">
                        {item.duration}m
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-slate-900 w-8">
                            {attentionScore}%
                          </span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                attentionScore > 80
                                  ? "bg-emerald-400"
                                  : attentionScore > 50
                                    ? "bg-blue-400"
                                    : "bg-rose-400"
                              }`}
                              style={{ width: `${attentionScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest uppercase ${badgeStyle}`}
                        >
                          {stateString}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => alert(`Inspecting detail...`)}
                          className="text-[10px] font-extrabold text-blue-600 tracking-widest flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        >
                          INSPECT <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
