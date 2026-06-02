// src/app/providers/AppProviders.tsx
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../lib/query-client";
import { SocketProvider } from "../../socket/socket.client"; // ✅ Đã trỏ chuẩn vào file (.tsx) vừa rewrite

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 🔌 BƠM DÒNG MÁU SOCKET THỜI GIAN THỰC TOÀN CỤC */}
      <SocketProvider>{children}</SocketProvider>
    </QueryClientProvider>
  );
};
