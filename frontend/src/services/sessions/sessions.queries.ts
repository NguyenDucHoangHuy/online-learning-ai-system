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
 * Lấy chi tiết phòng học để nạp dữ liệu realtime
 */
export const useSessionDetail = (
  sessionId: string,
  options?: { refetchInterval?: number | false }, // 🎯 Bổ sung thêm nhận diện cấu hình ngầm
) => {
  return useQuery({
    queryKey: SESSION_KEYS.detail(sessionId),
    queryFn: () => sessionsService.getSessionById(sessionId),
    enabled: !!sessionId,
    ...options, // Trải phẳng options cấu hình (như refetchInterval) vào đây
  });
};

/**
 * Giáo viên tạo buổi học trực tuyến mới
 */
export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // 🎯 FIX: Gom classId và payload vào chung 1 object làm tham số duy nhất cho mutationFn
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
 * 🎯 ĐỒNG BỘ BE: Đổi từ useJoinSession cũ sang useLookupSession ăn theo hàm GET mới
 */
export const useLookupSession = () => {
  return useMutation({
    mutationFn: sessionsService.lookupSession,
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
      queryClient.invalidateQueries({
        queryKey: SESSION_KEYS.detail(sessionId),
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
    mutationFn: sessionsService.endSession,
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: SESSION_KEYS.detail(sessionId),
      });
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
 * 🎯 BỔ SUNG: Hook tự động bốc lịch sử học tập thật của Sinh viên từ Database
 */
export const useStudentHistory = (options?: {
  refetchInterval?: number | false;
}) => {
  return useQuery({
    queryKey: SESSION_KEYS.studentHistory,
    queryFn: sessionsService.getStudentHistory,
    staleTime: 1000 * 60 * 3, // Cache mặc định 3 phút
    ...options, // 🎯 CHỐT 7: Trải phẳng options để ghi đè cấu hình polling khi cần thiết
  });
};
