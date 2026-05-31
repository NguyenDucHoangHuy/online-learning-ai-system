import { PropsWithChildren, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const AppProviders = ({ children }: PropsWithChildren) => {
  // Sử dụng useState để đảm bảo QueryClient chỉ tạo 1 lần duy nhất trong vòng đời của App
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false, // Chặn tự động refetch lại API khi user chuyển tab trình duyệt
            retry: 1, // Thử gọi lại API tối đa 1 lần nếu mạng lỗi
            staleTime: 1000 * 60 * 5, // Mặc định dữ liệu cache được coi là mới trong 5 phút
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
