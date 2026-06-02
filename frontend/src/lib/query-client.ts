// src/lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 🎯 KHÓA BẢO VỆ 1: Tắt refetch khi đổi tab, bảo vệ băng thông và giữ luồng stream WebRTC/Socket ổn định
      refetchOnWindowFocus: false,

      // 🎯 KHÓA BẢO VỆ 2: Không tự động retry vô hạn khi lỗi mạng, giúp bẫy lỗi và đá trang lập tức (như lỗi 403/409)
      retry: false,

      // Thời gian mặc định dữ liệu được coi là "sạch" (không cần fetch lại nếu quay lại trang) là 1 phút
      staleTime: 1000 * 60 * 1,
    },
  },
});
