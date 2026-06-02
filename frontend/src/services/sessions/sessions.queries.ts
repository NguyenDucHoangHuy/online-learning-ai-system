// src/services/sessions/sessions.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsService } from "./sessions.service";
import { CreateSessionPayload } from "../../types/api";

export const SESSION_KEYS = {
  all: ["sessions"] as const,
  detail: (sessionId: string) => ["session", sessionId] as const,
  classSessions: (classId: string) => ["sessions", "class", classId] as const,
  studentHistory: ["sessions", "student-history"] as const, // Quản lý cache lịch sử sinh viên
};

/**
 * 🎯 ĐÃ NÂNG CẤP TYPE-SAFE: Lấy chi tiết phòng học và bóc tách cấu trúc thông minh
 */
export const useSessionDetail = (
  sessionId: string,
  options?: { refetchInterval?: number | false },
) => {
  return useQuery({
    queryKey: SESSION_KEYS.detail(sessionId),
    queryFn: async () => {
      const res = await sessionsService.getSessionById(sessionId);

      // 🚀 GIẢI PHÁP TRUNG CHUYỂN QUA UNKNOWN CHỐT HẠ:
      // Ép biểu thức sang 'unknown' trước khi ép sang Record để xóa sạch lỗi biên dịch
      if (res && typeof res === "object") {
        const rawObj = res as unknown as Record<string, unknown>;
        if ("data" in rawObj && rawObj.data) {
          return rawObj.data;
        }
      }
      return res;
    },
    enabled: !!sessionId,
    ...options,
  });
};
/**
 * Giáo viên tạo buổi học trực tuyến mới
 */
export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      payload,
    }: {
      classId: string;
      payload: CreateSessionPayload;
    }) => sessionsService.createSession(classId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SESSION_KEYS.all,
      });
    },
  });
};

/**
 * Student check phòng và xin gia nhập bằng sessionCode
 */
export const useLookupSession = () => {
  return useMutation({
    mutationFn: async (sessionCode: string) => {
      const res = await sessionsService.lookupSession(sessionCode);

      // 🚀 GIẢI PHÁP TRUNG CHUYỂN QUA UNKNOWN CHỐT HẠ:
      if (res && typeof res === "object") {
        const rawObj = res as unknown as Record<string, unknown>;
        if ("data" in rawObj && rawObj.data) {
          return rawObj.data;
        }
      }
      return res;
    },
  });
};
/**
 * Giáo viên bấm nút mở luồng dạy trực tuyến công nghệ cao
 */
export const useStartSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sessionsService.startSession,
    onSuccess: (_, sessionId) => {
      const sid = sessionId as string;
      queryClient.invalidateQueries({
        queryKey: SESSION_KEYS.detail(sid),
      });
    },
  });
};

/**
 * Giáo viên ra lệnh đóng phòng dạy, dập tắt các track stream và giải phóng bộ nhớ đệm toàn cục
 */
export const useEndSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: string;
      payload?: Record<string, unknown>;
    }) => sessionsService.endSession(sessionId, payload),
    onSuccess: (_, variables) => {
      const vars = variables as unknown;
      const sid =
        (vars as { sessionId?: string })?.sessionId ?? (vars as string);
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all });
      if (typeof sid === "string") {
        queryClient.invalidateQueries({
          queryKey: SESSION_KEYS.detail(sid),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["teacher-classes"] });
    },
  });
};

/**
 * Fetch danh sách các buổi học của lớp học hiện tại
 */
export const useClassSessions = (classId: string) => {
  return useQuery({
    queryKey: SESSION_KEYS.classSessions(classId),
    queryFn: () => sessionsService.getSessionsByClassId(classId),
    enabled: !!classId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook tự động bốc lịch sử học tập thật của Sinh viên từ Database
 */
export const useStudentHistory = (options?: {
  refetchInterval?: number | false;
}) => {
  return useQuery({
    queryKey: SESSION_KEYS.studentHistory,
    queryFn: () => sessionsService.getStudentHistory(),
    staleTime: 1000 * 60 * 3,
    ...options,
  });
};
