import { CustomSocket } from "../socket.types";
import { SOCKET_EVENTS } from "../socket.events";

export const emitSocketError = (socket: CustomSocket, message: string) => {
  socket.emit(SOCKET_EVENTS.ERROR, { message });
};
