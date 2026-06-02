// src/socket/socket.client.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../stores/auth.store";
import { SocketContextType } from "./socket.types";
import { registerGlobalSocketHandlers } from "./socket.handlers";

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);

  // 🎯 CHỐT 2: Instance Socket nằm gọn trong useRef, triệt tiêu 100% hiện tượng re-render thừa thải cho các page con
  const socketRef = useRef<Socket | null>(null);

  // 🎯 CHỐT 1: Trích xuất trực tiếp thông tin xác thực sạch từ Zustand Store
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  // =======================================================================
  // ⚡ LUỒNG 1: QUẢN LÝ VÒNG ĐỜI KẾT NỐI (CHỈ CHẠY KHI LOG IN / LOG OUT)
  // =======================================================================
  useEffect(() => {
    // Nếu chưa đăng nhập hoặc bấm đăng xuất -> Thu hồi kết nối sạch sẽ
    if (!user || !accessToken) {
      if (socketRef.current) {
        console.log(
          "🧹 [Socket.io] User logged out. Disconnecting socket safely...",
        );
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // 🎯 CHỐT CHẶN KIÊN CỐ: Nếu đã có kết nối tồn tại thì GIỮ NGUYÊN, không tạo lại instance
    if (socketRef.current) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    console.log(
      `🔌 [Socket.io] Khởi tạo kết nối lõi bền vững đến: ${socketUrl}...`,
    );

    const socketInstance = io(socketUrl, {
      auth: {
        token: accessToken,
      },
      transports: ["websocket"],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketInstance.on("connect", () => {
      console.log(
        "🟢 [Socket.io] Kết nối thành công vĩnh cửu! Socket ID:",
        socketInstance.id,
      );
      setIsConnected(true);
    });

    socketInstance.on("disconnect", (reason) => {
      console.warn("🔴 [Socket.io] Ngắt kết nối tạm thời. Lý do:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("🚨 [Socket.io] Lỗi Handshake cổng gác:", err.message);
    });

    registerGlobalSocketHandlers(socketInstance);
    socketRef.current = socketInstance;

    return () => {
      // Chỉ hủy kết nối thực sự khi component Unmount hoàn toàn khỏi Root ứng dụng
      if (socketInstance && !useAuthStore.getState().user) {
        console.log("🧹 [Socket.io] Cleaning up connection instance...");
        socketInstance.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id]); // 🎯 SỬA CHỐT: Chỉ chạy lại khi ID người dùng thay đổi (Đăng nhập/Đăng xuất)

  // =======================================================================
  // 🔄 LUỒNG 2: ĐỒNG BỘ TOKEN NGẦM (SILENT REFRESH TOKEN SYNC)
  // Cập nhật token mới vào Socket Auth mà KHÔNG LÀM ĐỨT KẾT NỐI REAL-TIME
  // =======================================================================
  useEffect(() => {
    if (socketRef.current && accessToken) {
      console.log(
        "🔄 [Socket.io] Đã âm thầm đồng bộ AccessToken mới tươi mà không làm ngắt mạng!",
      );
      socketRef.current.auth = { token: accessToken };
    }
  }, [accessToken]); // Chạy mượt mà mỗi khi token ngầm thay đổi dưới nền

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
