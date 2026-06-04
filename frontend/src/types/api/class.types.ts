// src/types/api/class.types.ts
export interface ClassItem {
  id: string;
  name: string;
  code: string; // Ví dụ: IT001, SE104
  description: string | null;
  teacherId: string;
  _count?: {
    students: number; // Đếm số sinh viên trong lớp
    sessions: number; // Đếm số buổi học đã mở
  };

  createdAt: string;
  updatedAt: string;
}

export interface CreateClassPayload {
  name: string;
  description?: string;
}

export interface UpdateClassPayload {
  name?: string;
  description?: string;
}

export interface ClassResponse {
  success: boolean;
  data: ClassItem;
}

export interface ClassesResponse {
  success: boolean;
  data: ClassItem[];
}
