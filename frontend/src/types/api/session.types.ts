// src/types/api/session.types.ts

export type SessionStatus = "WAITING" | "ACTIVE" | "ENDED";
export type JoinStatus = "PENDING" | "APPROVED" | "REJECTED";

// 🧱 1. Thực thể gốc ClassSession trong Database
export interface SessionItem {
  id: string;
  classId: string;
  title: string;
  sessionCode: string;
  requireApproval: boolean;
  status: SessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 📦 2. Payload Thô gửi lên Body khi tạo buổi học (Khớp CreateSessionDto của BE)
export interface CreateSessionPayload {
  title: string;
  requireApproval: boolean;
  startedAt: string;
  endedAt: string;
}

// 📩 3. Phản hồi cho các thao tác Single Session (Tạo mới, Start, End)
export interface SessionResponse {
  success: boolean;
  data: SessionItem;
}

// 🗂️ 4. Phản hồi danh sách Session của một Lớp (Có kèm _count của Prisma)
export interface SessionWithCount extends SessionItem {
  _count: {
    participants: number;
  };
}

export interface SessionsResponse {
  success: boolean;
  data: SessionWithCount[]; // 🎯 Đúng chuẩn: Trả về mảng trực tiếp bên trong data
}

// 🎯 5. Chi tiết một Session khi dùng bộ lọc getSessionById (Có include class và _count stats)
export interface SessionDetailData extends SessionItem {
  class: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    teacherId: string;
    createdAt: string;
    updatedAt: string;
  };
  _count?: {
    participants: number;
    chatMessages: number;
  };
}

export interface SessionDetailResponse {
  success: boolean;
  data: SessionDetailData;
}

// 🔍 6. Phản hồi trả về từ hàm lookupSession khi học sinh check mã Code
export interface LookupSessionData {
  id: string;
  title: string;
  status: SessionStatus;
  requireApproval: boolean;
  sessionCode: string;
  class: {
    id: string;
    name: string;
  };
}

export interface LookupSessionResponse {
  success: boolean;
  data: LookupSessionData;
}

// 📜 7. Cấu trúc lịch sử tham gia lớp học của Sinh viên (Hàm getMyHistory)
export interface ParticipantHistoryItem {
  id: string;
  studentId: string;
  sessionId: string;
  joinStatus: JoinStatus;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
  session: {
    id: string;
    classId: string;
    title: string;
    sessionCode: string;
    requireApproval: boolean;
    status: SessionStatus;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
    updatedAt: string;
    class: {
      id: string;
      name: string;
      code: string;
      description: string | null;
      teacherId: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export interface StudentHistoryResponse {
  success: boolean;
  data: ParticipantHistoryItem[];
}
