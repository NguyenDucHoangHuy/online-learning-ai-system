import { Request, Response } from "express";

import { participantsService } from "./participants.service";

import { HTTP_STATUS, MESSAGES } from "../../common/constants";

import { sendResponse } from "../../common/utils/response.util";
import { asyncHandler } from "../../common/utils/async-handler.util";
import { JoinStatus } from "@prisma/client";
import { getIO } from "../../sockets/socket.server";
import { SOCKET_EVENTS } from "../../sockets/socket.events";
import { emitToStudent } from "../../sockets/utils/emit.util";

export const participantsController = {
  joinSession: asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;

    const result = await participantsService.joinSession(
      req.params.sessionId,
      studentId,
    );

    const message =
      result.joinStatus === "PENDING"
        ? MESSAGES.JOIN_REQUEST_SENT
        : MESSAGES.JOIN_SUCCESS;

    return sendResponse(res, HTTP_STATUS.OK, message, result);
  }),

  getParticipants: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;
    const { sessionId } = req.params;

    // Zod đã đảm bảo biến này hoặc là undefined, hoặc là giá trị chuẩn xác của JoinStatus
    const status = req.query.status as JoinStatus | undefined;
    const result = await participantsService.getParticipants(
      req.params.sessionId,
      teacherId,
      status,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      MESSAGES.PARTICIPANTS_FETCHED,
      result,
    );
  }),

  approveParticipant: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;

    const result = await participantsService.approveParticipant(
      req.params.participantId,
      teacherId,
    );

    emitToStudent(getIO(), result.studentId, SOCKET_EVENTS.PARTICIPANT_APPROVED, {
      participantId: result.id,
      sessionId: result.sessionId,
      joinedAt: result.joinedAt,
    });

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      MESSAGES.PARTICIPANT_APPROVED,
      result,
    );
  }),

  rejectParticipant: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;

    const result = await participantsService.rejectParticipant(
      req.params.participantId,
      teacherId,
    );

    emitToStudent(getIO(), result.studentId, SOCKET_EVENTS.PARTICIPANT_REJECTED, {
      participantId: result.id,
      sessionId: result.sessionId,
    });

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      MESSAGES.PARTICIPANT_REJECTED,
      result,
    );
  }),

  leaveSession: asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;

    const result = await participantsService.leaveSession(
      req.params.participantId,
      studentId,
    );

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.LEFT_SESSION, result);
  }),

  approveAllParticipants: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;
    const { sessionId } = req.params;

    const result = await participantsService.approveAllParticipants(
      sessionId,
      teacherId,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      MESSAGES.PARTICIPANT_APPROVED,
      result,
    );
  }),
};
