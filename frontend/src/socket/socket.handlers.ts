// src/socket/socket.handlers.ts
import { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../constants/events.constants";

export const registerGlobalSocketHandlers = (socket: Socket) => {
  // Lắng nghe các lỗi nghiệp vụ real-time do Backend ném về qua kênh 'error'
  socket.on(SOCKET_EVENTS.ERROR, (payload: { message: string }) => {
    console.error("🚨 [Socket Global Error]:", payload.message);
    // Bồ có thể tích hợp thư viện Toast thông báo (như react-hot-toast/sonner) tại đây sau này:
    // toast.error(payload.message);
  });
};
