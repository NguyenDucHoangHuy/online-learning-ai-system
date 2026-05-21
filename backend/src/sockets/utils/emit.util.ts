// src/sockets/utils/emit.util.ts
import { CustomServer } from "../socket.types";
import { SocketEventValue } from "../socket.events"; // ✅ Import kiểu giá trị Event

export const emitToSession = (
  io: CustomServer,
  sessionId: string,
  event: SocketEventValue, // ✅ Ép kiểu chặt chẽ tại đây
  data: any,
) => {
  io.to(`session:${sessionId}`).emit(event as any, data);
};

export const emitToTeacher = (
  io: CustomServer,
  teacherId: string,
  event: SocketEventValue, // ✅ Ép kiểu chặt chẽ tại đây
  data: any,
) => {
  io.to(`teacher:${teacherId}`).emit(event as any, data);
};

export const emitToStudent = (
  io: CustomServer,
  studentId: string,
  event: SocketEventValue, // ✅ Ép kiểu chặt chẽ tại đây
  data: any,
) => {
  io.to(`student:${studentId}`).emit(event as any, data);
};
