// src/modules/sessions/sessions.dto.ts
import { z } from "zod";

export const createSessionSchema = z
  .object({
    title: z
      .string()
      .min(1, "Tiêu đề buổi học không được để trống")
      .max(150, "Tiêu đề tối đa 150 ký tự"),

    requireApproval: z.boolean().optional().default(false),

    // 🎯 BỔ SUNG: Khóa chặt bắt buộc phải truyền chuỗi thời gian lịch trình
    startedAt: z.string().min(1, "Thời gian bắt đầu buổi học là bắt buộc"),
    endedAt: z.string().min(1, "Thời gian kết thúc buổi học là bắt buộc"),
  })
  // 🧮 BỘ LỌC TOÁN HỌC 1: Kiểm tra tính tuyến tính thời gian
  .refine(
    (data) => {
      const start = new Date(data.startedAt).getTime();
      const end = new Date(data.endedAt).getTime();
      return end > start;
    },
    {
      message:
        "Thời gian kết thúc bài học bắt buộc phải lớn hơn thời gian bắt đầu.",
      path: ["endedAt"], // Báo lỗi đỏ trúng đích vào ô input endedAt dưới Frontend
    },
  )
  // 🧮 BỘ LỌC TOÁN HỌC 2: Quán triệt luật thời lượng < 3 tiếng (10,800,000 ms)
  .refine(
    (data) => {
      const start = new Date(data.startedAt).getTime();
      const end = new Date(data.endedAt).getTime();
      const durationMs = end - start;
      const MAX_DURATION_MS = 3 * 60 * 60 * 1000;

      return durationMs <= MAX_DURATION_MS;
    },
    {
      message:
        "Quán triệt: Thời lượng diễn ra một buổi học trực tuyến không được phép vượt quá 3 tiếng.",
      path: ["endedAt"], // Báo lỗi đỏ trúng đích vào ô input endedAt dưới Frontend
    },
  );

export type CreateSessionDto = z.infer<typeof createSessionSchema>;
