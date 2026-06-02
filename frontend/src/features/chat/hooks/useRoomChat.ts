// src/features/chat/hooks/useRoomChat.ts
import { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";
import { api } from "../../../lib/axios";
import { SOCKET_EVENTS } from "../../../constants/events.constants";

// Định kiểu cấu trúc tin nhắn đồng bộ đét đẹt với ChatMessageWithUser của Backend bồ gửi
export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  message: string;
  sentAt: string;
  user: {
    id: string;
    fullName: string;
    role: "TEACHER" | "STUDENT" | string;
  };
}

interface UseRoomChatProps {
  socket: Socket | null;
  isConnected: boolean;
  sessionId: string;
}

export function useRoomChat({
  socket,
  isConnected,
  sessionId,
}: UseRoomChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 📜 1. Hàm tự động cuộn mượt mà xuống đáy hộp chat khi có tin nhắn mới
  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior });
    }, 80);
  };

  // 📥 2. Gọi REST API bốc sạch lịch sử chat từ Database khi vừa đặt chân vào phòng
  useEffect(() => {
    if (!sessionId) return;

    async function loadChatHistory() {
      try {
        setIsLoadingHistory(true);
        // Endpoint REST bồ định nghĩa: /api/sessions/:sessionId/messages (hoặc chỉnh lại theo route thực tế của bồ)
        const res = await api.get<unknown>(
          `/sessions/${sessionId}/messages?limit=50`,
        );

        const resData =
          (res.data as {
            data?: { messages?: ChatMessage[] };
            messages?: ChatMessage[];
          }) || {};
        const extractedMessages: ChatMessage[] = Array.isArray(res.data)
          ? (res.data as ChatMessage[])
          : resData.messages ||
            (resData as { data?: { messages?: ChatMessage[] } }).data
              ?.messages ||
            [];

        setMessages(extractedMessages);
        scrollToBottom("auto"); // Lần đầu load thì cuộn thẳng xuống không cần smooth delay
      } catch (err) {
        console.warn(
          "⚠️ [Chat History Guard] Không thể nạp lịch sử chat cũ:",
          err,
        );
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadChatHistory();
  }, [sessionId]);

  // 📡 3. Đóng xích Socket lắng nghe sự kiện phát tin nhắn mới tinh (CHAT_NEW) từ Server dội về công khai
  useEffect(() => {
    if (!socket || !isConnected || !sessionId) return;

    console.log(
      "💬 [Chat Realtime Engine] Đã kích hoạt lắng nghe kênh chat phòng học...",
    );

    socket.on(SOCKET_EVENTS.CHAT_NEW, (newMsg: ChatMessage) => {
      if (newMsg.sessionId === sessionId) {
        setMessages((prev) => {
          // Khóa chặn chống trùng tin nhắn do cơ chế lặp socket vãng lai
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom("smooth"); // Có tin nhắn mới dội tới -> Cuộn trượt mượt mà xuống
      }
    });

    return () => {
      socket.off(SOCKET_EVENTS.CHAT_NEW);
    };
  }, [socket, isConnected, sessionId]);

  // 🚀 4. Hàm bắn lệnh gửi tin nhắn công khai qua cổng Socket (CHAT_SEND) kèm Callback nhận phản hồi
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanMessage = inputValue.trim();
    if (!cleanMessage || !socket || !isConnected) return;

    // Định dạng gói dữ liệu gửi đi trùng khớp đét đẹt với Backend bắt
    const payload = {
      sessionId,
      message: cleanMessage,
    };

    console.log(
      "📤 [Chat Outgoing] Đang đẩy tin nhắn lên Server Socket...",
      payload,
    );

    // Kích hoạt phát tin kèm cổng Callback Acknowledgement nhận Canonical Message dập thẳng từ DB
    socket.emit(
      SOCKET_EVENTS.CHAT_SEND,
      payload,
      (ack: { success: boolean; data?: ChatMessage; message?: string }) => {
        if (ack.success && ack.data) {
          console.log(
            "🎯 [Chat Outgoing Ack] Tin nhắn đã được lưu DB và sync thành công!",
          );
          setInputValue(""); // Dọn sạch ô nhập liệu
          // Lưu ý: Không cần setMessages tại đây, vì lệnh broadcast CHAT_NEW ở mục 3 trên Server sẽ dội tin về cho chính mình luôn, giúp đồng bộ Canonical
        } else {
          console.error("🚨 Gửi tin nhắn thất bại:", ack.message);
          alert(ack.message || "Gửi tin nhắn bất thành. Vui lòng thử lại!");
        }
      },
    );
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isLoadingHistory,
    chatBottomRef,
    handleSendMessage,
    scrollToBottom,
  };
}
