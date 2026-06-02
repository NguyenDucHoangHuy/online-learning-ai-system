import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classesService } from "./classes.service";
import { CreateClassPayload } from "../../types/api/class.types"; // Import type payload nếu cần

export const CLASS_KEYS = {
  all: ["classes"] as const,
  detail: (id: string) => ["class", id] as const,
};

// 1. Hook lấy danh sách tất cả các lớp học
export const useClasses = () => {
  return useQuery({
    queryKey: CLASS_KEYS.all,
    queryFn: classesService.getClasses,
  });
};

// 2. Hook lấy chi tiết một lớp học cụ thể
export const useClassDetail = (classId: string) => {
  return useQuery({
    queryKey: CLASS_KEYS.detail(classId),
    queryFn: () => classesService.getClassById(classId),
    enabled: !!classId,
  });
};

// 3. Hook tạo mới lớp học
export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classesService.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CLASS_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey: ["sessions", "dashboard-stats"],
      });
    },
  });
};

// 4. 🔥 HOOK CHỈNH SỬA LỚP HỌC (LƯU THẲNG VÀO DATABASE)
export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Nhận tham số đầu vào gồm ID cần sửa và nội dung Payload cập nhật
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CreateClassPayload;
    }) => classesService.updateClass(id, payload), // Đảm bảo gọi chính xác hàm trong classes.service của bạn

    onSuccess: (_, variables) => {
      // 🔄 Làm mới danh sách lớp học ở trang tổng quan
      queryClient.invalidateQueries({
        queryKey: CLASS_KEYS.all,
      });

      // 🔄 Làm mới luôn cả dữ liệu chi tiết của lớp học đó (nếu có trang chi tiết lớp học đang mở)
      queryClient.invalidateQueries({
        queryKey: CLASS_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: ["sessions", "dashboard-stats"],
      });
    },
  });
};

// 🌹 Thêm hook này vào cuối file query để hết lỗi ts(2305)
export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classesService.deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CLASS_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey: ["sessions", "dashboard-stats"],
      });
    },
  });
};
